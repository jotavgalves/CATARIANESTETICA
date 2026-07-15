# Schema e permissões do Supabase

## Fonte de verdade

As migrations em `supabase/migrations/` são a fonte executável do banco. Este documento é a referência humana para conferir se um novo projeto Supabase ficou completo.

## Extensões necessárias

- `pgcrypto`
- `citext`

## Tabelas

| Tabela | Responsabilidade |
|---|---|
| `cq_sites` | Cadastro dos sites |
| `cq_site_domains` | Domínios vinculados |
| `cq_site_members` | Usuários Auth vinculados aos sites |
| `cq_admin_allowlist` | Autorização inicial por e-mail |
| `cq_site_settings` | Identidade, contato, SEO, hero e tema |
| `cq_sections` | Seções, ordem e conteúdo JSONB |
| `cq_procedures` | Procedimentos |
| `cq_results` | Antes e depois, procedimento e consentimento |
| `cq_testimonials` | Depoimentos e consentimento |
| `cq_faq_items` | Perguntas frequentes |
| `cq_media_files` | Arquivos originais e lixeira lógica |
| `cq_media_variants` | Versões geradas por slot |
| `cq_tracking_configs` | IDs e flags públicas de rastreamento |
| `cq_tracking_secrets` | Credenciais criptografadas |
| `cq_tracking_events` | Eventos, status e tentativas |
| `cq_content_revisions` | Histórico técnico de alterações |

## Relações essenciais

- as entidades do CMS pertencem a um site por `site_id`;
- resultados e depoimentos podem referenciar `cq_procedures.id`;
- variantes referenciam `cq_media_files.id`;
- membros referenciam usuários do Supabase Auth;
- paths de mídia começam pelo UUID do site.

## Contratos críticos

### Seções

`cq_sections.content` continua sendo o único campo de conteúdo específico. Seu formato é definido por `app/src/admin/section-schema.ts` e validado por `section-content.ts`.

Não criar `content_v2`, `content_old`, editor legado ou coluna paralela.

### Consentimento

Resultados e depoimentos publicados devem ter autorização confirmada. Essa regra precisa existir no banco e na aplicação.

### Mídia

`cq_media_files` preserva o original. `cq_media_variants` guarda versões por uso, com dimensões, formato e enquadramento. `deleted_at` representa a lixeira lógica.

## Políticas RLS encontradas no ambiente de referência

| Tabela | Política | Operação |
|---|---|---|
| `cq_admin_allowlist` | `cq_allowlist_owner_all` | ALL |
| `cq_content_revisions` | `cq_revisions_member_select` | SELECT |
| `cq_faq_items` | `cq_faq_member_all` | ALL |
| `cq_media_files` | `cq_media_member_all` | ALL |
| `cq_media_variants` | `cq_media_variants_member_all` | ALL |
| `cq_procedures` | `cq_procedures_member_all` | ALL |
| `cq_results` | `cq_results_member_all` | ALL |
| `cq_sections` | `cq_sections_member_all` | ALL |
| `cq_site_domains` | `cq_domains_member_all` | ALL |
| `cq_site_members` | `cq_members_select` | SELECT |
| `cq_site_members` | `cq_members_owner_insert` | INSERT |
| `cq_site_members` | `cq_members_owner_update` | UPDATE |
| `cq_site_members` | `cq_members_owner_delete` | DELETE |
| `cq_site_settings` | `cq_settings_member_all` | ALL |
| `cq_sites` | `cq_sites_member_select` | SELECT |
| `cq_sites` | `cq_sites_owner_update` | UPDATE |
| `cq_testimonials` | `cq_testimonials_member_all` | ALL |
| `cq_tracking_configs` | `cq_tracking_config_member_all` | ALL |
| `cq_tracking_events` | `cq_tracking_events_member_select` | SELECT |

Os predicados completos de cada política devem vir das migrations. Nome e operação não bastam para validar a segurança.

## Papéis

### anon

- não recebe CRUD direto do CMS;
- acessa somente RPCs públicas controladas e objetos públicos necessários.

### authenticated

- recebe apenas os privilégios usados pelo painel;
- continua limitado por RLS e pelo site do usuário;
- não lê diretamente `cq_tracking_secrets`.

### service_role

- utilizado somente em ambiente confiável, migração e Edge Functions;
- nunca aparece no frontend ou em documentação com valor real.

## Storage

Bucket esperado: `cq-media`.

Requisitos:

- paths iniciados por `<site_id>/`;
- escrita somente para membro autorizado daquele site;
- nenhum membro altera arquivos de outro site;
- SVG somente nos fluxos previstos e após sanitização;
- URLs do projeto antigo devem ser substituídas durante migração.

## Verificação do destino

O ambiente novo só está aprovado quando:

1. todas as migrations aplicam em banco vazio;
2. RLS está ativo nas tabelas expostas;
3. políticas, funções e grants correspondem ao ambiente de referência;
4. usuário autorizado opera apenas o próprio site;
5. `anon` não acessa tabelas administrativas;
6. segredos não são retornados ao navegador;
7. Storage permite o site correto e bloqueia outro site;
8. foreign keys e constraints não possuem violações;
9. RPC pública e login administrativo funcionam.