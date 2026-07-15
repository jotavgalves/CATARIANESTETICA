# Documentação técnica integral

Este índice descreve o estado técnico do CMS e do site Catarina Queiroz. A documentação é uma referência operacional e arquitetural. As fontes executáveis continuam sendo o código em `app/`, as migrations em `supabase/migrations/` e as Edge Functions em `supabase/functions/`.

## Ordem recomendada de leitura

1. [`architecture/SYSTEM_OVERVIEW.md`](architecture/SYSTEM_OVERVIEW.md) — visão geral e fronteiras do sistema.
2. [`architecture/APPLICATION_ARCHITECTURE.md`](architecture/APPLICATION_ARCHITECTURE.md) — aplicação pública, painel, módulos e fluxos.
3. [`architecture/ADMIN_AND_CONTENT.md`](architecture/ADMIN_AND_CONTENT.md) — CMS, editor visual, conteúdo e publicação.
4. [`architecture/MEDIA_PIPELINE.md`](architecture/MEDIA_PIPELINE.md) — upload, sanitização, recorte, variantes, Storage e lixeira.
5. [`architecture/TRACKING_AND_CONSENT.md`](architecture/TRACKING_AND_CONSENT.md) — consentimento, eventos e integrações.
6. [`database/SCHEMA_AND_PERMISSIONS.md`](database/SCHEMA_AND_PERMISSIONS.md) — modelo resumido de banco e autorização.
7. [`database/DATABASE_REFERENCE.md`](database/DATABASE_REFERENCE.md) — catálogo técnico de entidades, RPCs e segurança.
8. [`operations/DEPLOYMENT_AND_OPERATIONS.md`](operations/DEPLOYMENT_AND_OPERATIONS.md) — ambientes, Cloudflare, Supabase e operação.
9. [`operations/QUALITY_AND_TESTING.md`](operations/QUALITY_AND_TESTING.md) — CI, lint, testes e regras arquiteturais.
10. [`operations/INCIDENT_BACKUP_RECOVERY.md`](operations/INCIDENT_BACKUP_RECOVERY.md) — incidentes, backup e restauração.
11. [`migration/README.md`](migration/README.md) — migração e portabilidade.

## Escopo coberto

- site público e carregamento de conteúdo;
- painel administrativo e autenticação;
- editor visual de seções;
- procedimentos, resultados, depoimentos e FAQ;
- mídia, SVG, HEIC, recorte e variantes;
- Supabase Auth, Postgres, RLS, RPCs e Storage;
- rastreamento, consentimento e segredos;
- build, CI, deploy e variáveis de ambiente;
- migração entre projetos Supabase;
- rollback, backup e resposta a incidentes.

## Informações que não devem ser versionadas

A documentação nunca deve conter:

- anon key ou service role key reais;
- senhas ou hashes de usuários;
- tokens Meta, Google ou GA4;
- chave de criptografia dos segredos;
- conteúdo descriptografado de `cq_tracking_secrets`;
- cookies, sessões ou links privados de recuperação;
- dados pessoais não necessários para explicar a arquitetura.

## Regra de manutenção

Uma alteração técnica só está completa quando atualiza, conforme aplicável:

1. código;
2. migration;
3. tipos;
4. testes;
5. documentação técnica afetada.

A documentação não substitui teste em ambiente vazio, Preview autenticado ou validação pós-deploy.