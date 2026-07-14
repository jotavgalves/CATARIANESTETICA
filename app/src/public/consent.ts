import type { ConsentState } from "../lib/types";

const storageKey = "cq-consent-v1";

export function readConsent(): ConsentState | null {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function writeConsent(input: Pick<ConsentState, "analytics" | "marketing">): ConsentState {
  const value: ConsentState = {
    necessary: true,
    analytics: input.analytics,
    marketing: input.marketing,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(storageKey, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent<ConsentState>("cq:consent", { detail: value }));
  return value;
}

export function renderConsentBanner(root: HTMLElement, onDecision: (state: ConsentState) => void): void {
  if (readConsent()) return;
  root.innerHTML = `
    <aside class="consent-banner" aria-label="Preferências de privacidade">
      <h2>Privacidade e medição</h2>
      <p>Usamos dados de medição para entender o desempenho do site e, com sua autorização, melhorar campanhas de publicidade.</p>
      <div class="consent-actions">
        <button class="button button-primary" type="button" data-consent="all">Aceitar todos</button>
        <button class="button button-outline" type="button" data-consent="analytics">Somente análise</button>
        <button class="button button-outline" type="button" data-consent="necessary">Somente necessários</button>
      </div>
    </aside>`;

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const choice = target.dataset.consent;
    if (!choice) return;
    const state = writeConsent({
      analytics: choice === "all" || choice === "analytics",
      marketing: choice === "all",
    });
    root.replaceChildren();
    onDecision(state);
  }, { once: true });
}
