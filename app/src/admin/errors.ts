export interface AdminErrorFallback {
  code: string;
  message: string;
  field?: string;
}

interface ErrorRecord {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  status?: unknown;
  statusCode?: unknown;
  name?: unknown;
}

const defaultFallback: AdminErrorFallback = {
  code: "ADMIN_OPERATION_FAILED",
  message: "Não foi possível concluir esta operação.",
};

export class AdminError extends Error {
  readonly code: string;
  readonly field: string | undefined;

  constructor(message: string, code: string, field?: string) {
    super(message);
    this.name = "AdminError";
    this.code = code;
    this.field = field;
  }
}

function asRecord(error: unknown): ErrorRecord {
  return typeof error === "object" && error !== null ? error : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function searchableMessage(error: unknown): string {
  const record = asRecord(error);
  return [
    error instanceof Error ? error.message : "",
    text(record.message),
    text(record.details),
    text(record.hint),
    text(record.code),
    text(record.status),
    text(record.statusCode),
  ].filter(Boolean).join(" ").toLowerCase();
}

function mappedError(error: unknown): AdminError | null {
  const record = asRecord(error);
  const databaseCode = text(record.code);
  const content = searchableMessage(error);

  if (/media_in_use/.test(content)) {
    return new AdminError("Esta mídia está em uso. Substitua ou remova a referência antes de enviá-la para a lixeira.", "MEDIA_IN_USE");
  }
  if (/media_not_in_trash/.test(content)) {
    return new AdminError("Envie a mídia para a lixeira antes da exclusão definitiva.", "MEDIA_NOT_IN_TRASH");
  }
  if (/media_not_found/.test(content)) {
    return new AdminError("Esta mídia não existe mais na biblioteca. Atualize o painel.", "MEDIA_NOT_FOUND");
  }
  if (/media_access_denied/.test(content)) {
    return new AdminError("Sua conta não tem permissão para alterar esta mídia.", "MEDIA_ACCESS_DENIED");
  }
  if (/media_url_required/.test(content)) {
    return new AdminError("A referência antiga e a nova versão da mídia são obrigatórias.", "MEDIA_URL_REQUIRED");
  }

  if (databaseCode === "23505" || /duplicate key|already exists|unique constraint/.test(content)) {
    if (/slug|cq_procedures_site_id_slug_key/.test(content)) {
      return new AdminError("Já existe um procedimento com este identificador. Use outro identificador ou deixe o campo vazio para gerar automaticamente.", "DATABASE_DUPLICATE_SLUG", "slug");
    }
    return new AdminError("Já existe um registro com estes dados.", "DATABASE_DUPLICATE_RECORD");
  }

  if (databaseCode === "22P02" || /invalid input syntax for type uuid|invalid uuid/.test(content)) {
    return new AdminError("Selecione um procedimento válido na lista.", "DATABASE_INVALID_REFERENCE", "procedure_id");
  }

  if (databaseCode === "23503" || /foreign key constraint/.test(content)) {
    return new AdminError("O item relacionado não existe mais. Atualize a página e selecione uma opção válida.", "DATABASE_REFERENCE_NOT_FOUND", "procedure_id");
  }

  if (databaseCode === "42501" || /row-level security|permission denied|not authorized|unauthorized/.test(content)) {
    return new AdminError("Sua sessão não tem permissão para concluir esta operação. Entre novamente e tente outra vez.", "AUTH_PERMISSION_DENIED");
  }

  if (/jwt|token.*expired|session.*expired|authentication required/.test(content)) {
    return new AdminError("Sua sessão expirou. Entre novamente no painel.", "AUTH_SESSION_EXPIRED");
  }

  if (/mime type|content type|unsupported.*format|not supported/.test(content)) {
    return new AdminError("O formato não pôde ser processado neste campo. Use SVG apenas para logo ou favicon; para fotos, use JPG, PNG, WebP, AVIF, HEIC ou HEIF.", "STORAGE_UNSUPPORTED_FORMAT");
  }

  if (/payload too large|entity too large|maximum allowed|file size|exceeded.*size|413/.test(content)) {
    return new AdminError("O arquivo excede o limite aceito pelo armazenamento.", "STORAGE_FILE_TOO_LARGE");
  }

  if (/failed to fetch|networkerror|network request failed|load failed|offline/.test(content)) {
    return new AdminError("Não foi possível conectar ao servidor. Verifique a internet e tente novamente.", "NETWORK_UNAVAILABLE");
  }

  if (/storage.*object.*not found|object not found/.test(content)) {
    return new AdminError("O arquivo solicitado não foi encontrado no armazenamento.", "STORAGE_OBJECT_NOT_FOUND");
  }

  return null;
}

export function normalizeAdminError(error: unknown, fallback?: AdminErrorFallback): AdminError {
  if (error instanceof AdminError) return error;

  const mapped = mappedError(error);
  if (mapped) return mapped;

  const safeFallback = fallback ?? defaultFallback;
  const record = asRecord(error);
  const rawMessage = error instanceof Error ? error.message.trim() : text(record.message);
  if (rawMessage && rawMessage !== "Error") {
    return new AdminError(rawMessage.replace(/\s*Código:\s*[A-Z0-9_-]+\.?$/i, ""), safeFallback.code, safeFallback.field);
  }

  return new AdminError(safeFallback.message, safeFallback.code, safeFallback.field);
}

export function formatAdminError(error: AdminError): string {
  return `${error.message} Código: ${error.code}`;
}

export function reportAdminError(context: string, error: unknown, normalized: AdminError): void {
  const record = asRecord(error);
  console.error("Admin operation failed", {
    context,
    code: normalized.code,
    sourceCode: text(record.code),
    status: text(record.status) || text(record.statusCode),
  });
}
