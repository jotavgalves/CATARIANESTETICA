# Fluxo para alterações por IA

1. Ler `AGENTS.md`.
2. Identificar o único arquivo responsável pela mudança.
3. Alterar conteúdo pelo painel sempre que possível.
4. Não criar arquivos de correção paralelos.
5. Executar `npm run check`.
6. Abrir pull request.
7. Somente mesclar após a CI aprovar.

## Onde alterar

- Cores compartilhadas: `src/styles/tokens.css`
- Layout público: `src/styles/public.css`
- Layout do painel: `src/styles/admin.css`
- Estrutura pública: `src/public/render.ts`
- Interações públicas: `src/public/main.ts`
- Analytics: `src/public/analytics.ts`
- Painel: `src/admin/`
- Banco: `supabase/migrations/`
- Funções de servidor: `supabase/functions/`
