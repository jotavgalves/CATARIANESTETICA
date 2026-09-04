function removeServerTrackingControls(root: ParentNode = document): void {
  const serverNames = [
    "meta_server_enabled",
    "ga4_server_enabled",
    "google_ads_server_enabled",
  ];

  for (const name of serverNames) {
    const input = root.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    input?.closest("label")?.remove();
  }

  root.querySelector<HTMLFormElement>('form[data-form="tracking-secrets"]')
    ?.closest("section.panel")
    ?.remove();

  const trackingForm = root.querySelector<HTMLFormElement>('form[data-form="tracking"]');
  if (!trackingForm) return;

  let note = trackingForm.parentElement?.querySelector<HTMLElement>("[data-reference-tracking-note]");
  if (!note) {
    note = document.createElement("p");
    note.dataset.referenceTrackingNote = "true";
    note.className = "field-help";
    note.textContent = "Configuração alinhada ao site de referência: Pixel/Ads pelo navegador, sem Meta CAPI nem credenciais de servidor.";
    trackingForm.parentElement?.querySelector(".panel-heading")?.append(note);
  }
}

const root = document.querySelector("#admin-root");
if (root) {
  const observer = new MutationObserver(() => removeServerTrackingControls(root));
  observer.observe(root, { childList: true, subtree: true });
  removeServerTrackingControls(root);
}
