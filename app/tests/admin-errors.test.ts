import { describe, expect, it } from "vitest";
import { formatAdminError, normalizeAdminError } from "../src/admin/errors";

const fallback = {
  code: "ADMIN_OPERATION_FAILED",
  message: "Não foi possível concluir esta operação.",
};

describe("admin error normalization", () => {
  it("maps duplicate procedure slugs to the slug field", () => {
    const error = normalizeAdminError({
      code: "23505",
      message: "duplicate key value violates unique constraint cq_procedures_site_id_slug_key",
    }, fallback);
    expect(error.code).toBe("DATABASE_DUPLICATE_SLUG");
    expect(error.field).toBe("slug");
  });

  it("maps invalid UUID references to the procedure selector", () => {
    const error = normalizeAdminError({
      code: "22P02",
      message: "invalid input syntax for type uuid",
    }, fallback);
    expect(error.code).toBe("DATABASE_INVALID_REFERENCE");
    expect(error.field).toBe("procedure_id");
  });

  it("preserves a meaningful validation message", () => {
    const error = normalizeAdminError(new Error("Confirme a autorização antes de publicar."), fallback);
    expect(error.message).toBe("Confirme a autorização antes de publicar.");
    expect(formatAdminError(error)).toContain("Código: ADMIN_OPERATION_FAILED");
  });

  it("uses the fallback instead of an empty generic error", () => {
    const error = normalizeAdminError({}, fallback);
    expect(error.message).toBe(fallback.message);
    expect(error.code).toBe(fallback.code);
  });
});
