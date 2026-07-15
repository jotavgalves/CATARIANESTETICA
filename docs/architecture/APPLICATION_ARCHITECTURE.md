# Arquitetura da aplicação

## Visão geral

A aplicação é um frontend TypeScript/Vite servido pelo Cloudflare Pages e conectado ao Supabase. Há duas superfícies principais:

- site público, carregado a partir da RPC `cq_get_public_site`;
- painel administrativo em `/admin/`, autenticado pelo Supabase Auth.

O diretório de build é `app/`. Os comandos oficiais são definidos em `app/package.json`:

- `npm run dev`;
- `npm run build`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run lint:css`;
- `npm run test`;
- `npm run check`.

## Entradas da aplicação

### Site público

A entrada pública inicializa:

1. cliente Supabase público;
2. identificação do site por variável de ambiente ou hostname;
3. consulta à RPC pública;
4. aplicação de SEO, identidade e favicon;
5. renderização das seções habilitadas;
6. inicialização de mídia responsiva;
7. inicialização de consentimento e rastreamento.

O navegador não consulta diretamente tabelas privadas para montar a página. O contrato público é agregado pelo banco e devolvido como JSON.

### Painel administrativo

A entrada administrativa:

1. verifica sessão;
2. processa retorno de recuperação de senha;
3. carrega membership e dados administrativos;
4. mantém o estado da aba e do item em edição;
5. delega autenticação, mídia, seções e persistência aos controladores próprios;
6. renderiza o painel sem framework de componentes.

`main.ts` deve permanecer como orquestrador. Regras de negócio não devem ser concentradas nele.

## Camadas

### `src/lib`

Contém contratos compartilhados, tipos e configuração do cliente Supabase. Não deve conter regras visuais ou mutações administrativas.

### `src/public`

Responsável pelo site público:

- consulta e normalização de dados públicos;
- renderização das seções;
- SEO e favicon;
- hero desktop/mobile;
- eventos de conversão;
- consentimento;
- integrações públicas.

### `src/admin`

Responsável pelo CMS:

- autenticação;
- carregamento administrativo;
- formulários;
- editor de seções;
- biblioteca de mídia;
- persistência;
- mensagens e erros.

### `src/styles`

CSS dividido por domínio. Não são permitidos estilos inline ou `!important`. Alterações visuais devem ser feitas nas folhas adequadas e reutilizar tokens existentes.

### `tests`

Testes unitários e arquiteturais. Além de comportamento, eles protegem fronteiras como acesso ao Supabase, ausência de editor JSON legado, ausência de estilos inline e unicidade das implementações críticas.

## Fluxo de dados público

```text
hostname ou VITE_SITE_IDENTIFIER
        ↓
cq_get_public_site(identifier)
        ↓
JSON público agregado
        ↓
tipos e normalização
        ↓
renderização das seções habilitadas
```

A RPC pública deve retornar somente conteúdo publicável. Segredos, allowlist, membership, rascunhos administrativos e eventos internos não pertencem a esse contrato.

## Fluxo de escrita administrativa

```text
sessão autenticada
        ↓
formulário/controlador
        ↓
validação e normalização
        ↓
repository.ts
        ↓
Supabase com RLS ou RPC autorizada
        ↓
recarregamento do estado
```

`repository.ts` é a fronteira única para operações administrativas no Supabase. Editores e renderizadores não importam o cliente Supabase nem chamam tabelas diretamente.

## Contratos de conteúdo

As seções usam `cq_sections.content` como JSONB, mas o painel não expõe JSON bruto. O contrato é definido por:

- `section-schema.ts` — campos permitidos por seção;
- `section-content.ts` — normalização e serialização;
- `section-editor.ts` — controles visuais;
- `section-controller.ts` — ações de lista e coordenação.

O site público continua consumindo as chaves estáveis, como `items`, `steps`, `image_url`, `secondary_image_url` e `body`.

## Tratamento de erros

Erros técnicos são normalizados para códigos internos e mensagens compreensíveis. O painel não deve mostrar mensagens cruas do Supabase. Falhas de formulário devem apontar ao campo correspondente quando possível.

## Segurança no navegador

- somente a anon key pode existir no bundle público;
- service role nunca pode ser usada no frontend;
- HTML derivado de conteúdo é escapado antes da interpolação;
- nomes de arquivo e metadados não confiáveis usam `textContent` quando manipulados no DOM;
- SVG passa por sanitização antes do upload pelo fluxo normal do painel;
- URLs externas devem ser tratadas como dados e não como código.

## Limitações conscientes

- não há renderização server-side;
- HEIC depende da capacidade de decodificação do navegador;
- sanitização de SVG ocorre no cliente do painel, não é uma garantia server-side isolada;
- a disponibilidade pública depende de Cloudflare Pages e Supabase;
- alterações no banco exigem migration, não SQL manual permanente.