import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

const recoveryCooldownKey = "cq-admin-password-recovery-until";
const recoveryCooldownMs = 10 * 60 * 1000;

export interface AuthNotice {
  message: string;
  isError: boolean;
  code?: string;
}

export function authErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const message = raw.toLowerCase();

  if (message.includes("rate") || message.includes("exceeded") || message.includes("429")) {
    return "O limite temporário de e-mails foi atingido. Entre com sua senha ou aguarde antes de solicitar outra recuperação.";
  }
  if (message.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (message.includes("email_not_authorized") || message.includes("não está autorizado")) return "Este e-mail não está autorizado a acessar o painel.";
  if (message.includes("authentication_required") || message.includes("jwt")) return "Sua sessão expirou. Entre novamente.";
  if (message.includes("user not found") || message.includes("signup is disabled")) return "Não foi possível localizar uma conta autorizada para este e-mail.";
  if (message.includes("expired") || message.includes("otp_expired")) return "Este link expirou. Solicite uma nova recuperação de senha.";
  return "Não foi possível concluir o acesso. Verifique os dados e tente novamente.";
}

function authParameter(name: string): string {
  const url = new URL(window.location.href);
  const queryValue = url.searchParams.get(name);
  if (queryValue) return queryValue;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash).get(name) ?? "";
}

export function consumeAuthUrlNotice(): AuthNotice | null {
  const errorCode = authParameter("error_code") || authParameter("error");
  const description = authParameter("error_description");
  const passwordUpdated = new URL(window.location.href).searchParams.get("password_updated") === "1";

  if (!errorCode && !description && !passwordUpdated) return null;
  window.history.replaceState({}, document.title, window.location.pathname);

  if (passwordUpdated) {
    return { message: "Senha atualizada. Entre com seu e-mail e a nova senha.", isError: false, code: "AUTH_PASSWORD_UPDATED" };
  }

  const normalized = `${errorCode} ${description}`.toLowerCase();
  if (normalized.includes("expired") || normalized.includes("otp_expired")) {
    return { message: "Este link expirou ou já foi utilizado. Entre com sua senha ou solicite uma nova recuperação.", isError: true, code: "AUTH_LINK_EXPIRED" };
  }
  if (normalized.includes("access_denied")) {
    return { message: "O acesso pelo link foi recusado. Entre com sua senha ou solicite uma nova recuperação.", isError: true, code: "AUTH_LINK_DENIED" };
  }
  return { message: "O link de acesso não pôde ser validado. Entre com sua senha ou solicite uma nova recuperação.", isError: true, code: "AUTH_LINK_INVALID" };
}

export async function currentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("authentication_required");
  return data.session;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin/reset-password/`,
  });
  if (error) throw error;
  window.localStorage.setItem(recoveryCooldownKey, String(Date.now() + recoveryCooldownMs));
}

export function recoveryMinutesRemaining(): number {
  const stored = Number(window.localStorage.getItem(recoveryCooldownKey) ?? 0);
  if (!Number.isFinite(stored)) return 0;
  const remaining = stored - Date.now();
  return remaining > 0 ? Math.max(1, Math.ceil(remaining / 60000)) : 0;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function subscribeToAuth(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function waitForSession(timeoutMs = 4000): Promise<Session | null> {
  const existing = await currentSession();
  if (existing) return existing;

  return new Promise((resolve) => {
    let settled = false;
    let timer = 0;
    let unsubscribe = (): void => undefined;
    const finish = (session: Session | null): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(session);
    };
    unsubscribe = subscribeToAuth((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) finish(session);
    });
    timer = window.setTimeout(() => finish(null), timeoutMs);
  });
}
