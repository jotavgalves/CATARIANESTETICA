# Status da implementação

## Concluído

- Schema multi-site no Supabase com prefixo `cq_`.
- RLS, bucket de imagens, allowlist administrativa e conteúdo inicial.
- Site público dinâmico.
- Painel administrativo.
- CRUD de procedimentos, resultados, depoimentos e FAQ.
- Upload de imagens.
- Meta Pixel e Conversions API.
- Google tag, GA4 Measurement Protocol e preparação para Data Manager.
- Consentimento, deduplicação e log de eventos.
- CSS e TypeScript separados.
- Regras para IAs e CI.

## Configuração externa necessária

- Publicar a pasta `app` no Cloudflare Pages.
- Autorizar a URL `/admin/` no Supabase Auth.
- Definir `TRACKING_ENCRYPTION_KEY` nas Edge Functions.
- Informar IDs e tokens reais da Meta e Google no painel.
