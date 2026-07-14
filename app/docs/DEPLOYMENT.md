# Publicação no Cloudflare Pages

## Projeto

- Repositório: `jotavgalves/CATARIANESTETICA`
- Branch de produção: `main`
- Diretório raiz: `app`
- Comando: `npm run build`
- Saída: `dist`
- Node: `22`

## Variáveis

```text
VITE_SUPABASE_URL=https://euvwkkmkkunuimbrfpds.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_c53gPWCZom1evm0sf_Mngw_pixOwGr4
VITE_SITE_IDENTIFIER=catarina-queiroz
```

## Supabase Auth

Adicionar a URL final do painel em Authentication > URL Configuration > Redirect URLs:

```text
https://DOMINIO/admin/
```

## Funções

As funções `track-event` e `tracking-secrets` já fazem parte do repositório. Configure o segredo antes de cadastrar credenciais no painel:

```bash
supabase secrets set TRACKING_ENCRYPTION_KEY="CHAVE-ALEATORIA-DE-PELO-MENOS-32-CARACTERES" --project-ref euvwkkmkkunuimbrfpds
```

## Primeiro acesso

1. Abra `/admin/`.
2. Informe `jvgacontato@gmail.com`.
3. Use o link recebido por e-mail.
4. O gatilho do banco vinculará automaticamente o usuário ao site autorizado.
