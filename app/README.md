# Catarina Estética CMS

Aplicação multi-site composta por um site público e um painel administrativo. O conteúdo fica no Supabase e o mesmo código pode ser espelhado para outros domínios alterando apenas `VITE_SITE_IDENTIFIER` ou cadastrando o domínio em `cq_site_domains`.

## Desenvolvimento

```bash
npm install
cp .env.example .env
npm run dev
```

- Site público: `http://localhost:5173/`
- Painel: `http://localhost:5173/admin/`

## Cloudflare Pages

Configure o projeto com:

- Diretório raiz: `app`
- Comando de build: `npm run build`
- Diretório de saída: `dist`
- Node.js: 22

Variáveis públicas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SITE_IDENTIFIER`

## Supabase

O banco usa prefixo `cq_` para não interferir nos sistemas existentes. O login administrativo é por magic link. O e-mail precisa estar em `cq_admin_allowlist`.

No Auth, adicione como URL de redirecionamento:

```text
https://SEU-DOMINIO/admin/
```

Defina o segredo das Edge Functions uma única vez:

```bash
supabase secrets set TRACKING_ENCRYPTION_KEY="uma-chave-aleatoria-com-mais-de-32-caracteres"
```

Depois, tokens da Meta e Google podem ser cadastrados pelo painel e ficam criptografados.

## Espelhar para outro site

1. Cadastre outro registro em `cq_sites`.
2. Cadastre o domínio em `cq_site_domains`.
3. Crie as configurações e o conteúdo associados ao novo `site_id`.
4. Faça outro deploy do mesmo repositório ou use o mesmo build; o domínio determina qual conteúdo será carregado.

## Regras de qualidade

`npm run check` executa TypeScript, ESLint, Stylelint, testes arquiteturais e build. A CI bloqueia CSS com `!important`, estilos inline, pixels duplicados e inicializações paralelas.
