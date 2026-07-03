# Catarina Queiroz Clínica Estética

Base preparada para Cloudflare Pages com site público configurável e painel em `/adm/`.

## Estrutura

- `index.html`: entrada do site público.
- `src/`: JS e CSS do site.
- `config/site.config.json`: configuração inicial editável.
- `adm/`: painel de edição.
- `functions/`: Cloudflare Pages Functions.
- `wrangler.toml`: configuração para Cloudflare.

## Cloudflare Pages

Use preset `None`, sem build command, com output `/` ou `.`.

Crie um KV Namespace e vincule no projeto com o nome `SITE_CONFIG`.

Configure também as variáveis de ambiente indicadas em `.dev.vars.example`.

Depois do deploy, acesse `/adm/` para editar o site.

## Painel

O painel permite editar dados gerais, visual, conteúdo principal, pixels, manutenção e JSON completo. A aba JSON avançado permite criar/remover serviços, depoimentos, FAQ, mudar ordem, imagens, tamanhos e cores
