# Referência técnica do banco

## Fonte de verdade

As migrations em `supabase/migrations/` são a única fonte executável. Este documento descreve o estado esperado e deve ser atualizado junto com migrations, tipos e testes.

## Extensões

O schema usa UUIDs e `citext`. Um projeto novo precisa aplicar as migrations em ordem para criar extensões, tabelas, funções, RLS, grants, triggers e Storage.

## Entidades

### Núcleo multi-site

- `cq_sites`: identidade do site, slug, domínio padrão e status;
- `cq_site_domains`: hostnames associados e domínio principal;
- `cq_site_settings`: identidade, contato, SEO, hero e tema;
- `cq_site_members`: vínculo usuário/site, papel e estado ativo;
- `cq_admin_allowlist`: e-mails autorizados a reivindicar acesso.

### Conteúdo

- `cq_sections`: seções ordenadas, habilitação, status e conteúdo JSONB;
- `cq_procedures`: procedimentos, descrições, publicação e ordem;
- `cq_results`: antes/depois, consentimento e publicação;
- `cq_testimonials`: depoimentos, origem, consentimento e publicação;
- `cq_faq_items`: perguntas e respostas;
- `cq_content_revisions`: snapshots de alterações e ator.

### Mídia

- `cq_media_files`: original, metadados, checksum e lixeira;
- `cq_media_variants`: versão por slot, dimensões e crop.

### Rastreamento

- `cq_tracking_configs`: IDs públicos e flags;
- `cq_tracking_secrets`: payload criptografado;
- `cq_tracking_events`: eventos, status e retentativas.

## Relações principais

```text
cq_sites.id
 ├─ cq_site_settings.site_id
 ├─ cq_site_domains.site_id
 ├─ cq_site_members.site_id
 ├─ cq_admin_allowlist.site_id
 ├─ cq_sections.site_id
 ├─ cq_procedures.site_id
 ├─ cq_results.site_id
 ├─ cq_testimonials.site_id
 ├─ cq_faq_items.site_id
 ├─ cq_media_files.site_id
 ├─ cq_media_variants.site_id
 └─ cq_tracking_*.site_id

cq_procedures.id
 ├─ cq_results.procedure_id
 └─ cq_testimonials.procedure_id

cq_media_files.id
 └─ cq_media_variants.media_id
```

## RPCs e funções públicas `cq_*`

### Acesso e autenticação

- `cq_attach_allowlisted_user()` — trigger `security definer` que vincula usuário allowlisted;
- `cq_claim_admin_access()` — RPC autenticada que reivindica acesso permitido;
- `cq_is_site_member(p_site_id, p_roles)` — verificação de membership usada por políticas e funções.

### Leitura pública

- `cq_get_public_site(p_identifier)` — `security definer`, executável por `anon` e `authenticated`, devolve o contrato público agregado.

### Mídia

- `cq_media_usage(p_media_id)` — retorna referências de uso;
- `cq_trash_media(p_media_id)` — soft delete;
- `cq_restore_media(p_media_id)` — restauração;
- `cq_delete_media_metadata(p_media_id)` — remove metadados autorizados;
- `cq_commit_media_variants(p_site_id, p_media_id, p_variants, p_old_url, p_new_url)` — confirma variantes e substitui referências atomicamente;
- `cq_replace_media_url(p_site_id, p_old_url, p_new_url)` — função interna de substituição;
- `cq_jsonb_contains_any(p_value, p_targets)` — busca recursiva em JSONB;
- `cq_jsonb_replace_string(p_value, p_old, p_new)` — substituição recursiva em JSONB.

### Manutenção

- `cq_touch_updated_at()` — trigger para timestamps.

## Privilégios de execução

Estado inventariado:

- `anon`: `cq_get_public_site`; helpers JSONB podem possuir EXECUTE padrão, mas não constituem API pública pretendida;
- `authenticated`: RPC pública, claim, membership e operações de mídia autorizadas;
- `service_role`: bypass administrativo do Supabase, nunca usado no frontend;
- funções internas sem grant explícito não devem ser chamadas pelo navegador.

Ao criar ou substituir uma função, revogar `PUBLIC` e conceder apenas aos papéis necessários quando ela expõe operação sensível.

## RLS

RLS deve permanecer habilitado nas tabelas CMS. Políticas atuais incluem:

- member `ALL` para settings, sections, procedures, results, testimonials, FAQ e mídia;
- owner para atualização de site e administração de membros;
- member `SELECT` para sites e revisões;
- member `SELECT` para eventos de tracking;
- owner `ALL` para allowlist.

A condição real usa membership ativo e, quando necessário, papel permitido. Copiar apenas o nome da policy não é suficiente; migrations devem recriar `USING` e `WITH CHECK`.

## Leitura pública

O papel `anon` não recebe CRUD direto nas tabelas de conteúdo. A leitura pública ocorre pela RPC agregadora, que filtra:

- site ativo;
- seções habilitadas/publicadas;
- procedimentos publicados;
- resultados publicados com consentimento;
- depoimentos publicados com consentimento;
- FAQ publicada;
- settings e assets públicos.

## Triggers e timestamps

Tabelas mutáveis usam `updated_at` e trigger compartilhada. Triggers de autenticação associam usuários allowlisted. Inventários de migração devem comparar triggers, não apenas tabelas.

## Índices e constraints

As migrations definem unicidade e desempenho, incluindo:

- slug de site;
- hostname;
- membership composto;
- section key por site;
- slug de procedimento por site;
- variantes por mídia/slot;
- índices por `site_id`, publicação, ordem e exclusão lógica.

A lista exata deve ser validada com `pg_indexes` e `pg_constraint` durante migração.

## Storage

Bucket `cq-media`:

- leitura pública de objetos;
- limite de 30 MB;
- MIME permitidos: JPEG, PNG, WebP, AVIF, SVG, HEIC e HEIF;
- escrita e exclusão para membro autorizado;
- primeiro segmento do caminho deve corresponder ao `site_id`.

As policies de `storage.objects` são parte do sistema e precisam ser auditadas no destino.

## Dados sensíveis

Não exportar em pacote comum:

- `cq_tracking_secrets.encrypted_payload`;
- sessões e usuários de `auth`;
- tokens ou chaves;
- eventos históricos sem decisão de retenção;
- dados pessoais desnecessários.

## Verificações mínimas pós-migration

1. tabelas, colunas e defaults;
2. PK, FK, unique e checks;
3. índices;
4. triggers;
5. RLS habilitado;
6. policies e expressões;
7. grants de tabela e função;
8. RPC pública como anon;
9. CRUD administrativo com usuário membro;
10. isolamento entre sites;
11. bucket, policies, MIME e limite;
12. impossibilidade de ler segredos pelo frontend.