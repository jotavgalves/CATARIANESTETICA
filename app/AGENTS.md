# Regras obrigatórias para IAs e desenvolvedores

## Arquitetura

1. O site público possui um único ponto de entrada: `src/public/main.ts`.
2. O painel possui um único ponto de entrada: `src/admin/main.ts`.
3. Não adicione scripts diretamente aos componentes ou ao HTML.
4. Meta, Google Analytics e Google Ads só podem ser acessados por `src/public/analytics.ts`.
5. Conteúdo comercial deve vir do Supabase. Não duplique textos no código para corrigir o banco.

## CSS

1. Nunca use `!important`.
2. Nunca use atributo `style` no HTML ou em templates TypeScript.
3. Nunca crie classes com `fix`, `patch`, `temp`, `final` ou `new`.
4. Corrija o seletor original; não crie uma segunda regra para sobrescrever a primeira.
5. Cores e espaçamentos compartilhados pertencem a `src/styles/tokens.css`.
6. Um componente deve ter uma única fonte de estilos.

## JavaScript e TypeScript

1. Nunca crie outro arquivo de inicialização.
2. Nunca chame `fbq`, `gtag` ou `dataLayer.push` fora do módulo de analytics.
3. Nunca use `any`.
4. Não coloque segredos no frontend.
5. Novos eventos devem ser adicionados ao tipo `AnalyticsEventName` e à Edge Function.
6. Toda inicialização precisa ser idempotente ou possuir trava contra duplicação.

## Alterações

1. Leia o arquivo responsável antes de modificar.
2. Faça a menor alteração capaz de resolver a causa do problema.
3. Não crie arquivos de correção paralelos.
4. Não desative lint ou testes.
5. Execute `npm run check` antes de concluir.
6. Mudanças em banco precisam de migration versionada.
7. Resultados e depoimentos não podem ser publicados sem autorização confirmada.
