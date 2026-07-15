import { authErrorMessage, consumeAuthUrlNotice, updatePassword, waitForSession } from "./auth-controller";

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const root = requiredElement<HTMLElement>("#reset-root");

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderError(message: string, code: string): void {
  root.innerHTML = `<p class="eyebrow">Recuperação de acesso</p><h2>Não foi possível redefinir a senha</h2><div class="status-message is-error">${escapeHtml(message)}</div><p class="auth-help">Código: ${escapeHtml(code)}</p><a class="button button-primary" href="/admin/">Voltar para o login</a>`;
}

function renderForm(): void {
  root.innerHTML = `<p class="eyebrow">Recuperação de acesso</p><h2>Defina uma nova senha</h2><p>Use pelo menos 10 caracteres.</p><form class="form-grid" data-reset-password><div class="field field-full"><label for="new-password">Nova senha</label><input id="new-password" name="new_password" type="password" autocomplete="new-password" minlength="10" required></div><div class="field field-full"><label for="confirm-password">Confirmar senha</label><input id="confirm-password" name="confirm_password" type="password" autocomplete="new-password" minlength="10" required></div><div class="status-message field-full" data-reset-status hidden></div><div class="form-actions"><button class="button button-primary" type="submit">Salvar nova senha</button></div></form>`;
}

async function initialize(): Promise<void> {
  const notice = consumeAuthUrlNotice();
  if (notice?.isError) {
    renderError(notice.message, notice.code ?? "AUTH_LINK_INVALID");
    return;
  }

  const session = await waitForSession();
  if (!session) {
    renderError("Este link expirou, já foi utilizado ou não criou uma sessão válida. Solicite uma nova recuperação.", "AUTH_RECOVERY_SESSION_MISSING");
    return;
  }

  renderForm();
}

root.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches("[data-reset-password]")) return;

  const data = new FormData(form);
  const password = String(data.get("new_password") ?? "");
  const confirmation = String(data.get("confirm_password") ?? "");
  const status = form.querySelector<HTMLElement>("[data-reset-status]");
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  const showStatus = (message: string, isError: boolean): void => {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };

  if (password.length < 10) {
    showStatus("Use uma senha com pelo menos 10 caracteres.", true);
    return;
  }
  if (password !== confirmation) {
    showStatus("As senhas não são iguais.", true);
    return;
  }

  if (button) button.disabled = true;
  showStatus("Salvando nova senha…", false);
  void updatePassword(password).then(() => {
    window.location.assign("/admin/?password_updated=1");
  }).catch((error: unknown) => {
    if (button) button.disabled = false;
    showStatus(authErrorMessage(error), true);
  });
});

void initialize().catch((error: unknown) => {
  renderError(authErrorMessage(error), "AUTH_RECOVERY_BOOT_FAILED");
});
