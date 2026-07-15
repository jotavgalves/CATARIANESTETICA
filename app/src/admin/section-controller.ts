function renumberRepeater(repeater: HTMLElement): void {
  const key = repeater.dataset.sectionRepeater;
  if (!key) return;
  const rows = Array.from(repeater.querySelectorAll<HTMLElement>("[data-section-repeater-item]"));
  const count = repeater.querySelector<HTMLInputElement>("[data-section-item-count]");
  if (count) count.value = String(rows.length);

  rows.forEach((row, index) => {
    const title = row.querySelector<HTMLElement>("header strong");
    if (title) title.textContent = `${repeater.dataset.itemLabel ?? "item"} ${index + 1}`;
    row.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[name]").forEach((control) => {
      control.name = control.name.replace(new RegExp(`^content\\.${key}\\.\\d+\\.`), `content.${key}.${index}.`);
      control.id = control.name.replace(/[^a-z0-9_-]+/gi, "-");
      const field = control.closest<HTMLElement>("[data-field-name]");
      if (field) field.dataset.fieldName = control.name;
      const label = control.closest<HTMLElement>(".field")?.querySelector<HTMLLabelElement>("label");
      if (label) label.htmlFor = control.id;
    });
    row.querySelectorAll<HTMLInputElement>("[data-upload-target]").forEach((upload) => {
      upload.dataset.uploadTarget = upload.dataset.uploadTarget?.replace(new RegExp(`^content\\.${key}\\.\\d+\\.`), `content.${key}.${index}.`);
    });
  });
}

function resetClonedRow(row: HTMLElement): void {
  row.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select").forEach((control) => {
    if (control instanceof HTMLInputElement && control.type === "file") {
      control.value = "";
      return;
    }
    control.value = "";
  });
  row.querySelectorAll<HTMLElement>("[data-upload-feedback]").forEach((feedback) => { feedback.hidden = true; });
  row.querySelectorAll<HTMLImageElement>("[data-upload-preview]").forEach((preview) => {
    preview.hidden = true;
    preview.removeAttribute("src");
  });
}

export function handleSectionEditorClick(target: Element): boolean {
  const action = target.closest<HTMLElement>("[data-section-item-add], [data-section-item-remove], [data-section-item-duplicate], [data-section-item-up], [data-section-item-down]");
  if (!action) return false;
  const repeater = action.closest<HTMLElement>("[data-section-repeater]");
  if (!repeater) return false;
  const list = repeater.querySelector<HTMLElement>(".section-repeater-list");
  if (!list) return false;

  if (action.hasAttribute("data-section-item-add")) {
    const template = list.querySelector<HTMLElement>("[data-section-repeater-item]");
    if (!template) return true;
    const clone = template.cloneNode(true) as HTMLElement;
    resetClonedRow(clone);
    list.append(clone);
    renumberRepeater(repeater);
    clone.querySelector<HTMLInputElement | HTMLTextAreaElement>("input:not([type='hidden']):not([type='file']), textarea")?.focus();
    return true;
  }

  const row = action.closest<HTMLElement>("[data-section-repeater-item]");
  if (!row) return true;

  if (action.hasAttribute("data-section-item-remove")) {
    row.remove();
  } else if (action.hasAttribute("data-section-item-duplicate")) {
    const clone = row.cloneNode(true) as HTMLElement;
    clone.querySelectorAll<HTMLInputElement>("input[type='file']").forEach((input) => { input.value = ""; });
    row.after(clone);
  } else if (action.hasAttribute("data-section-item-up") && row.previousElementSibling) {
    row.previousElementSibling.before(row);
  } else if (action.hasAttribute("data-section-item-down") && row.nextElementSibling) {
    row.nextElementSibling.after(row);
  }

  renumberRepeater(repeater);
  return true;
}
