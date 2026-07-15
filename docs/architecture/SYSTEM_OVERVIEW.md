# Visão geral do sistema

## Finalidade

Este repositório contém um CMS multi-site para clínicas e profissionais, com site público, painel administrativo, autenticação Supabase, biblioteca de mídia, rastreamento e publicação de conteúdo.

Este documento define as fronteiras arquiteturais que devem ser preservadas ao manter, clonar ou migrar o sistema.

## Componentes

### Aplicação web

A aplicação está em `app/` e é construída com TypeScript e Vite.

- `src/public/`: carregamento e renderização do site público.
- `src/admin/`: autenticação, painel, formulários, editor visual, mídia e persistência administrativa.
- `src/lib/`: configuração, cliente Supabase e contratos compartilhados.
- `src/styles/`: folhas de estilo separadas por domínio.

### Supabase

O Supabase fornece:

- PostgreSQL;
- autenticação dos administradores;
- RLS por site;
- RPCs públicas e administrativas;
- Storage no bucket `cq-media`;
- Edge Functions e segredos de rastreamento, quando configurados.

### Cloudflare Pages

A produção é construída a partir de `main`.

Configuração esperada:

- raiz de build: `app`;
- comando: `npm run build`;
- saída: `dist`.

## Fluxos principais

### Site público

1. O navegador identifica o site pelo domínio ou identificador configurado.
2. A aplicação solicita um payload público controlado.
3. Apenas conteúdo publicado e autorizado é retornado.
4. O renderer público monta as seções sem acesso administrativo direto às tabelas.

### Painel administrativo

1. O usuário entra pelo Supabase Auth.
2. `cq_claim_admin_access` resolve o acesso autorizado.
3. O painel carrega apenas registros do site vinculado.
4. Toda escrita passa pelo `repository.ts`.
5. Erros são normalizados antes de aparecer na interface.

### Biblioteca de mídia

1. O navegador valida e prepara o arquivo.
2. O enquadrador gera a transformação desejada.
3. O original é enviado ao Storage.
4. Variantes são geradas conforme o slot.
5. Banco e Storage são coordenados com compensação em falhas parciais.
6. O original é preservado para novos enquadramentos.

## Fronteiras obrigatórias

- `repository.ts` é o único acesso do painel ao Supabase e ao Storage.
- `media-schema.ts` é a única definição de slots, proporções e saídas de mídia.
- `section-schema.ts` é a única definição de campos específicos das seções.
- `section-content.ts` é a única serialização e normalização do conteúdo das seções.
- controladores coordenam eventos; não implementam acesso ao banco.
- renderizadores produzem interface; não persistem dados.

Não criar implementações paralelas com nomes como `v2`, `legacy`, `new`, `fix`, `temp` ou `final`.

## Entidades principais

- `cq_sites`: sites administrados.
- `cq_site_domains`: domínios vinculados.
- `cq_site_members`: usuários Auth vinculados aos sites.
- `cq_admin_allowlist`: autorização inicial por e-mail.
- `cq_site_settings`: identidade, contato, SEO, hero e tema.
- `cq_sections`: conteúdo e ordem das seções.
- `cq_procedures`: procedimentos.
- `cq_results`: antes e depois.
- `cq_testimonials`: depoimentos.
- `cq_faq_items`: perguntas frequentes.
- `cq_media_files`: originais da biblioteca.
- `cq_media_variants`: versões geradas para cada slot.
- `cq_tracking_configs`: configuração pública de rastreamento.
- `cq_tracking_secrets`: credenciais criptografadas, nunca legíveis pelo frontend.
- `cq_tracking_events`: eventos e estado de processamento.
- `cq_content_revisions`: histórico técnico de alterações, quando aplicável.

## Princípios de segurança

- RLS permanece ativado nas tabelas expostas pela API.
- `anon` não recebe CRUD direto do CMS.
- `authenticated` recebe somente os privilégios necessários e ainda depende de RLS.
- `service_role` nunca é enviado ao navegador.
- segredos reais não entram no GitHub.
- arquivos SVG são aceitos apenas nos fluxos previstos e sanitizados antes do armazenamento.
- conteúdo público não depende de URLs ou recursos do ambiente antigo após uma migração concluída.

## Fonte de verdade

- migrations em `supabase/migrations/`: fonte executável do banco;
- código TypeScript: contrato utilizado pela aplicação;
- documentação em `docs/`: explicação operacional e referência auditável;
- exportações de conteúdo: dados específicos de cada site.

A documentação não substitui migrations e não deve evoluir como uma segunda implementação do schema.