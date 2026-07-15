import { supabase } from "../lib/supabase";

const recoveryCooldownKey = "cq-admin-recovery-cooldown-until";
const recoveryCooldownMs = 10 * 60 * 1000;

function authMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const message = raw.toLowerCase();

  if (message.includes("rate") || message.includes("exceeded") || message.includes("429")) {
    return "O limite temporário de e-mails foi atingido. Entre com sua senha ou aguarde antes de solicitar outra recuperação.";
  }
  if (message.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (message.includes("email_not_authorized") || message.includes("não está autorizado")) return "Este e-mail não está autorizado a acessar o painel.";
  if (message.includes("authentication_required") || message.includes("jwt")) return "Sua sessão expirou. Entre novamente.";
  if (message.includes("user not found") || message.includes("signup is disabled")) return "Não foi possível enviar o acesso para este e-mail.";
  return "Não foi possível concluir o acesso. Verifique os dados e tente novamente.";
}

function loginForm(): HTMLFormElement | null {
  return document.querySelector<HTMLFormElement>('form[data-form="login"]');
}

function setLoginStatus(message: string, isError: boolean): void {
  const form = loginForm();
  if (!form) return;

  let status = form.querySelector<HTMLElement>(".status-message");
  if (!status) {
    status = document.createElement("div");
    status.className = "status-message";
    const firstField = form.querySelector(".field");
    if (firstField) form.insertBefore(status, firstField);
    else form.append(status);
  }

  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function cooldownUntil(): number {
  const stored = Number(window.localStorage.getItem(recoveryCooldownKey) ?? 0);
  return Number.isFinite(stored) ? stored : 0;
}

function updateRecoveryButton(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-auth-recovery]");
  if (!button) return;

  const remaining = cooldownUntil() - Date.now();
  if (remaining <= 0) {
    button.disabled = false;
    button.textContent = "Receber acesso por e-mail";
    return;
  }

  const minutes = Math.max(1, Math.ceil(remaining / 60000));
  button.disabled = true;
  button.textContent = `Novo e-mail em ${minutes} min`;
}

function enhanceLogin(): void {
  const form = loginForm();
  if (!form || form.dataset.authEnhanced === "true") return;
  form.dataset.authEnhanced = "true";

  const description = form.querySelector<HTMLParagraphElement>("h2 + p");
  if (description) description.textContent = "Entre com seu e-mail autorizado e sua senha. O acesso por e-mail fica reservado para recuperação.";

  const email = form.querySelector<HTMLInputElement>('input[name="email"]');
  if (email) {
    email.autocomplete = "email";
    email.placeholder = "seu@email.com";
  }

  const passwordField = document.createElement("div");
  passwordField.className = "field field-full";
  passwordField.innerHTML = '<label for="admin-password">Senha</label><input id="admin-password" name="password" type="password" autocomplete="current-password" minlength="8" required>';
  const actions = form.querySelector<HTMLElement>(".form-actions");
  if (actions) form.insertBefore(passwordField, actions);
  else form.append(passwordField);

  const primary = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (primary) primary.textContent = "Entrar";

  const recovery = document.createElement("button");
  recovery.className = "button button-outline";
  recovery.type = "button";
  recovery.dataset.authRecovery = "true";
  recovery.textContent = "Receber acesso por e-mail";
  actions?.append(recovery);

  const help = document.createElement("p");
  help.className = "auth-help field-full";
  help.textContent = "No primeiro acesso, use o link recebido anteriormente e depois defina uma senha no painel.";
  form.append(help);

  const existingStatus = form.querySelector<HTMLElement>(".status-message");
  if (existingStatus && /falha|erro|não|expir|limite/i.test(existingStatus.textContent ?? "")) existingStatus.classList.add("is-error");
  updateRecoveryButton();
}

function enhancePasswordPanel(): void {
  const dashboard = document.querySelector<HTMLElement>(".admin-grid");
  if (!dashboard || document.querySelector("[data-auth-password-panel]")) return;

  const panel = document.createElement("section");
  panel.className = "panel account-security-panel";
  panel.dataset.authPasswordPanel = "true";
  panel.innerHTML = `
    <div class="panel-heading">
      <div><h2>Senha de acesso</h2><p>Defina ou altere a senha usada para entrar sem depender de e-mails.</p></div>
    </div>
    <form class="form-grid" data-auth-password>
      <div class="field"><label for="new-password">Nova senha</label><input id="new-password" name="new_password" type="password" autocomplete="new-password" minlength="10" required></div>
      <div class="field"><label for="confirm-password">Confirmar senha</label><input id="confirm-password" name="confirm_password" type="password" autocomplete="new-password" minlength="10" required></div>
      <div class="form-actions"><button class="button button-primary" type="submit">Salvar senha</button></div>
      <div class="auth-password-status field-full" aria-live="polite"></div>
    </form>`;
  dashboard.insertAdjacentElement("afterend", panel);
}

function observeInterface(): void {
  const observer = new MutationObserver(() => {
    enhanceLogin();
    enhancePasswordPanel();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  enhanceLogin();
  enhancePasswordPanel();
}

async function submitPasswordLogin(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  const email = String(data.get("email") ?? "").trim();
  const password = String(data.get("password") ?? "");
  if (!email || !password) {
    setLoginStatus("Informe o e-mail e a senha.", true);
    return;
  }

  const buttons = form.querySelectorAll<HTMLButtonElement>("button");
  buttons.forEach((button) => { button.disabled = true; });
  setLoginStatus("Validando acesso…", false);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setLoginStatus(authMessage(error), true);
    buttons.forEach((button) => { button.disabled = false; });
    updateRecoveryButton();
    return;
  }

  setLoginStatus("Acesso confirmado. Carregando o painel…", false);
}

async function sendRecovery(): Promise<void> {
  const form = loginForm();
  const email = form?.querySelector<HTMLInputElement>('input[name="email"]')?.value.trim() ?? "";
  if (!email) {
    setLoginStatus("Informe o e-mail antes de solicitar a recuperação.", true);
    return;
  }
  if (cooldownUntil() > Date.now()) {
    updateRecoveryButton();
    setLoginStatus("Um e-mail já foi solicitado recentemente. Aguarde o prazo indicado no botão.", true);
    return;
  }

  const button = document.querySelector<HTMLButtonElement>("[data-auth-recovery]");
  if (button) button.disabled = true;
  setLoginStatus("Solicitando acesso por e-mail…", false);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin/`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    setLoginStatus(authMessage(error), true);
    updateRecoveryButton();
    return;
  }

  window.localStorage.setItem(recoveryCooldownKey, String(Date.now() + recoveryCooldownMs));
  setLoginStatus("E-mail enviado. Abra o link recebido para acessar e definir sua senha.", false);
  updateRecoveryButton();
}

async function savePassword(form: HTMLFormElement): Promise<void> {
  const data = new FormData(form);
  const password = String(data.get("new_password") ?? "");
  const confirmation = String(data.get("confirm_password") ?? "");
  const status = form.querySelector<HTMLElement>(".auth-password-status");

  if (password.length < 10) {
    if (status) {
      status.textContent = "Use uma senha com pelo menos 10 caracteres.";
      status.className = "auth-password-status status-message is-error field-full";
    }
    return;
  }
  if (password !== confirmation) {
    if (status) {
      status.textContent = "As senhas não são iguais.";
      status.className = "auth-password-status status-message is-error field-full";
    }
    return;
  }

  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) button.disabled = true;
  const { error } = await supabase.auth.updateUser({ password });
  if (button) button.disabled = false;

  if (error) {
    if (status) {
      status.textContent = authMessage(error);
      status.className = "auth-password-status status-message is-error field-full";
    }
    return;
  }

  form.reset();
  if (status) {
    status.textContent = "Senha salva. Nos próximos acessos, entre diretamente com e-mail e senha.";
    status.className = "auth-password-status status-message field-full";
  }
}

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;

  if (form.matches('form[data-form="login"]')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void submitPasswordLogin(form).catch((error: unknown) => setLoginStatus(authMessage(error), true));
    return;
  }

  if (form.matches("form[data-auth-password]")) {
    event.preventDefault();
    event.stopImmediatePropagation();
    void savePassword(form).catch((error: unknown) => {
      const status = form.querySelector<HTMLElement>(".auth-password-status");
      if (status) {
        status.textContent = authMessage(error);
        status.className = "auth-password-status status-message is-error field-full";
      }
    });
  }
}, true);

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element) || !target.closest("[data-auth-recovery]")) return;
  event.preventDefault();
  void sendRecovery();
});

window.setInterval(updateRecoveryButton, 30000);
observeInterface();
