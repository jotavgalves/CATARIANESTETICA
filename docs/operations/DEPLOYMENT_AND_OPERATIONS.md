# Deploy e operação

## Ambientes

### Desenvolvimento local

Diretório: `app/`.

Fluxo padrão:

```bash
npm ci
npm run dev
```

Validação completa:

```bash
npm run check
```

### Preview

Branches e pull requests geram deployments de Preview no Cloudflare Pages. Preview deve ser usado para validar mudanças de interface, integração e configuração antes do merge.

### Produção

A produção é implantada a partir de `main`.

Configuração esperada do Cloudflare Pages:

- root directory: `app`;
- build command: `npm run build`;
- output directory: `dist`.

O deployment de produção só muda quando o commit entra no `main`; um Preview bem-sucedido não altera o domínio principal.

## Variáveis públicas

O frontend requer, conforme configuração:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_ANON_KEY`;
- `VITE_SITE_IDENTIFIER`.

Essas variáveis entram no bundle e não podem conter segredos.

## Secrets server-side

Edge Functions podem requerer:

- URL e service role do projeto;
- chave de criptografia de tracking;
- tokens e secrets das integrações.

Esses valores devem ser configurados no ambiente do Supabase e nunca no Cloudflare frontend, GitHub ou arquivos de exemplo preenchidos.

## Processo de entrega

```text
branch de trabalho
  ↓
commits pequenos e coerentes
  ↓
pull request
  ↓
CI completa
  ↓
Preview funcional
  ↓
merge confirmado
  ↓
deployment de produção
  ↓
smoke test
```

Nunca afirmar que uma alteração está em produção apenas porque existe `merge_commit_sha` temporário. Confirmar `merged=true`, commit em `main` e deployment de produção correspondente.

## Smoke test pós-deploy

Site público:

- página carrega sem erro;
- hero desktop e mobile corretos;
- logo e favicon;
- procedimentos;
- seções habilitadas;
- WhatsApp e mapa;
- ausência de erros no console relevantes.

Painel:

- login;
- carregamento dos dados;
- edição e salvamento controlado;
- upload de imagem pequena;
- biblioteca de mídia;
- logout;
- recuperação de senha em ambiente apropriado.

## Operação diária

- usar o painel, não SQL manual, para conteúdo;
- confirmar consentimento antes de publicar resultados/depoimentos;
- não remover mídia em uso;
- revisar Preview para mudanças estruturais;
- manter uma única pessoa responsável por publicação durante alterações críticas;
- registrar incidentes e mudanças de credenciais.

## Mudanças de banco

Toda alteração permanente exige migration versionada. O SQL Editor pode ser usado para inspeção ou resposta emergencial, mas qualquer correção permanente precisa ser reproduzida em migration e revisada no GitHub.

## Mudanças de domínio

Ao adicionar domínio:

1. configurar DNS/Cloudflare;
2. registrar em `cq_site_domains` pelo processo autorizado;
3. revisar domínio principal;
4. atualizar URLs de Auth permitidas no Supabase;
5. testar login, recuperação e links absolutos.

## Observabilidade

Fontes disponíveis:

- GitHub Actions;
- logs de deployment do Cloudflare;
- logs do navegador;
- logs do Supabase/Postgres;
- logs de Edge Functions;
- `cq_tracking_events` para status das integrações.

Não registrar tokens, payloads médicos, senhas ou secrets em logs.

## Rotação de credenciais

Após rotação:

- atualizar ambiente correto;
- invalidar chave anterior;
- gerar novo deploy quando a variável é de build;
- testar função afetada;
- registrar data e responsável;
- verificar que o valor não apareceu em commit ou log.

## Dependências externas

O site depende de:

- Cloudflare Pages;
- Supabase Auth/Postgres/Storage/Functions;
- provedores de tracking quando ativados;
- WhatsApp e Google Maps para links externos.

Falha de tracking não deve indisponibilizar o site. Falha do Supabase pode impedir conteúdo e painel; o frontend deve exibir erro controlado em vez de conteúdo inventado.