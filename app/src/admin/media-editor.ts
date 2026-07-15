import { mediaAspectRatio, type MediaSlotDefinition } from "./media-schema";
import {
  normalizeMediaTransform,
  renderMediaCanvas,
  type MediaTransform,
  type PreparedMediaSource,
} from "./media-processor";

const DEFAULT_PREVIEW_WIDTH = 760;
const DEFAULT_PREVIEW_HEIGHT = 520;

function previewDimensions(source: PreparedMediaSource, slot: MediaSlotDefinition): { width: number; height: number } {
  const ratio = mediaAspectRatio(slot) ?? source.width / source.height;
  let width = DEFAULT_PREVIEW_WIDTH;
  let height = Math.round(width / ratio);
  if (height > DEFAULT_PREVIEW_HEIGHT) {
    height = DEFAULT_PREVIEW_HEIGHT;
    width = Math.round(height * ratio);
  }
  return { width: Math.max(240, width), height: Math.max(180, height) };
}

function editorMarkup(slot: MediaSlotDefinition, source: PreparedMediaSource): string {
  const ratio = mediaAspectRatio(slot);
  const format = ratio ? `${slot.width} × ${slot.height}px` : "proporção original";
  const minimumZoom = slot.fit === "contain" ? 0.5 : 1;
  return `
    <form method="dialog" class="media-editor-card">
      <header class="media-editor-header">
        <div><p class="eyebrow">Enquadramento</p><h2>${slot.label}</h2><p>${slot.help}</p></div>
        <button class="media-editor-close" type="button" data-media-editor-cancel aria-label="Cancelar">×</button>
      </header>
      <div class="media-editor-layout">
        <div class="media-editor-stage" data-media-editor-stage>
          <canvas data-media-editor-canvas aria-label="Prévia do enquadramento"></canvas>
          <span class="media-editor-grid" aria-hidden="true"></span>
        </div>
        <aside class="media-editor-controls">
          <div class="media-editor-source"><strong>${source.originalName}</strong><span>${source.width} × ${source.height}px · ${source.mimeType || "arquivo de imagem"}</span></div>
          <label class="field"><span>Preenchimento</span><select data-media-editor-fit><option value="cover">Recortar para preencher</option><option value="contain">Mostrar imagem inteira</option></select></label>
          <label class="field"><span>Zoom</span><input data-media-editor-zoom type="range" min="${minimumZoom}" max="3" step="0.01" value="1"><output data-media-editor-zoom-output>100%</output></label>
          <div class="media-editor-control-row"><button class="button button-outline button-small" type="button" data-media-editor-rotate-left>Girar à esquerda</button><button class="button button-outline button-small" type="button" data-media-editor-rotate-right>Girar à direita</button></div>
          <button class="button button-outline button-small" type="button" data-media-editor-reset>Restaurar enquadramento</button>
          <div class="media-editor-summary"><strong>Saída</strong><span>${format}</span><span>Arraste a imagem para reposicionar.</span></div>
        </aside>
      </div>
      <footer class="media-editor-actions"><button class="button button-outline" type="button" data-media-editor-cancel>Cancelar</button><button class="button button-primary" type="submit" value="confirm">Usar este enquadramento</button></footer>
    </form>`;
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Media editor element missing: ${selector}`);
  return element;
}

function normalizeRotation(value: number): MediaTransform["rotation"] {
  const normalized = ((value % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

export function openMediaEditor(
  source: PreparedMediaSource,
  slot: MediaSlotDefinition,
  initial?: MediaTransform,
): Promise<MediaTransform | null> {
  const dialog = document.createElement("dialog");
  dialog.className = "media-editor-dialog";
  dialog.innerHTML = editorMarkup(slot, source);
  document.body.append(dialog);

  const canvas = required<HTMLCanvasElement>(dialog, "[data-media-editor-canvas]");
  const stage = required<HTMLElement>(dialog, "[data-media-editor-stage]");
  const zoomInput = required<HTMLInputElement>(dialog, "[data-media-editor-zoom]");
  const zoomOutput = required<HTMLOutputElement>(dialog, "[data-media-editor-zoom-output]");
  const fitSelect = required<HTMLSelectElement>(dialog, "[data-media-editor-fit]");
  const dimensions = previewDimensions(source, slot);
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  let transform: MediaTransform = initial ?? {
    zoom: slot.defaultZoom ?? 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    fit: slot.fit,
  };
  transform = normalizeMediaTransform(source, dimensions.width, dimensions.height, transform);
  zoomInput.min = transform.fit === "contain" ? "0.5" : "1";
  zoomInput.value = String(transform.zoom);
  fitSelect.value = transform.fit;

  const draw = (): void => {
    transform = normalizeMediaTransform(source, dimensions.width, dimensions.height, transform);
    const rendered = renderMediaCanvas(source, dimensions.width, dimensions.height, transform, slot.kind === "logo" || slot.kind === "favicon");
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(rendered, 0, 0);
    zoomInput.value = String(transform.zoom);
    zoomOutput.value = `${Math.round(transform.zoom * 100)}%`;
  };

  zoomInput.addEventListener("input", () => {
    transform = { ...transform, zoom: Number(zoomInput.value) };
    draw();
  });
  fitSelect.addEventListener("change", () => {
    const fit = fitSelect.value === "contain" ? "contain" : "cover";
    transform = { ...transform, fit, zoom: fit === "contain" ? Math.min(transform.zoom, 1) : Math.max(transform.zoom, 1), offsetX: 0, offsetY: 0 };
    zoomInput.min = fit === "contain" ? "0.5" : "1";
    draw();
  });
  required<HTMLButtonElement>(dialog, "[data-media-editor-rotate-left]").addEventListener("click", () => {
    transform = { ...transform, rotation: normalizeRotation(transform.rotation - 90), offsetX: 0, offsetY: 0 };
    draw();
  });
  required<HTMLButtonElement>(dialog, "[data-media-editor-rotate-right]").addEventListener("click", () => {
    transform = { ...transform, rotation: normalizeRotation(transform.rotation + 90), offsetX: 0, offsetY: 0 };
    draw();
  });
  required<HTMLButtonElement>(dialog, "[data-media-editor-reset]").addEventListener("click", () => {
    transform = { zoom: slot.defaultZoom ?? 1, offsetX: 0, offsetY: 0, rotation: 0, fit: slot.fit };
    zoomInput.min = slot.fit === "contain" ? "0.5" : "1";
    fitSelect.value = slot.fit;
    draw();
  });

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;
  stage.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startOffsetX = transform.offsetX;
    startOffsetY = transform.offsetY;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    transform = {
      ...transform,
      offsetX: startOffsetX + (event.clientX - startX) / canvas.clientWidth,
      offsetY: startOffsetY + (event.clientY - startY) / canvas.clientHeight,
    };
    draw();
  });
  const finishDrag = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  };
  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);

  draw();
  dialog.showModal();

  return new Promise((resolve) => {
    let completed = false;
    const finish = (result: MediaTransform | null): void => {
      if (completed) return;
      completed = true;
      dialog.close();
      dialog.remove();
      resolve(result);
    };
    dialog.querySelectorAll<HTMLElement>("[data-media-editor-cancel]").forEach((button) => button.addEventListener("click", () => finish(null)));
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(null);
    });
    required<HTMLFormElement>(dialog, "form").addEventListener("submit", (event) => {
      event.preventDefault();
      finish(normalizeMediaTransform(source, dimensions.width, dimensions.height, transform));
    });
  });
}
