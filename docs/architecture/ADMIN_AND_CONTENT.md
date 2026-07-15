# Painel administrativo e conteúdo

## Autenticação

O painel usa Supabase Auth. O fluxo cobre:

- login por e-mail e senha;
- detecção da sessão atual;
- logout;
- solicitação de recuperação de senha;
- atualização de senha após retorno autenticado;
- associação do usuário a um site por allowlist/membership.

A sessão não concede acesso por si só. O usuário também precisa possuir vínculo ativo em `cq_site_members` ou ser anexado a partir de `cq_admin_allowlist` pelo fluxo autorizado.

## Papéis

Os papéis registrados no banco controlam escopo administrativo. A autorização final é aplicada por RLS e funções do banco, não apenas pela interface.

- `owner`: administração do site e membros;
- `admin` ou equivalente autorizado: gestão ampla de conteúdo;
- `editor`: edição de conteúdo segundo as políticas vigentes.

A interface pode ocultar ações, mas o banco deve negar qualquer ação não permitida.

## Estado administrativo

O estado principal contém:

- membership atual;
- dados do site;
- aba ativa;
- item em edição;
- filtro da biblioteca de mídia;
- mensagem de status;
- indicador de erro.

Após uma escrita bem-sucedida, os dados são recarregados da fonte para evitar que o navegador mantenha uma representação divergente do banco.

## Áreas do painel

### Visão geral

Apresenta contagens e alertas de publicação. Não é uma fonte analítica completa; os valores são derivados dos registros carregados.

### Identidade e contato

Edita nome profissional, especialidade, logo, favicon, WhatsApp, telefone, e-mail, Instagram, endereço, Google Maps, horário, SEO e rodapé.

Logo e favicon usam o pipeline de mídia. Os campos de URL resultantes são somente leitura no formulário e preenchidos pelo upload confirmado.

### Páginas e seções

Contém hero e seções estruturais. O editor visual substitui definitivamente a textarea de JSON.

Seções com conteúdo próprio:

- `needs`: lista de necessidades;
- `process`: imagens e etapas;
- `about`: imagem e texto institucional.

Seções conectadas a cadastros:

- `procedures`;
- `results`;
- `testimonials`;
- `faq`;
- `location`.

Essas seções controlam título, subtítulo, ordem e visibilidade; os itens vêm das tabelas específicas.

## Editor visual de seções

### Fonte única de esquema

`section-schema.ts` define os campos permitidos. Um campo novo deve ser declarado nesse arquivo. Dimensões e slots de mídia permanecem no schema de mídia, sem duplicação.

### Normalização

`section-content.ts`:

- aceita o JSONB existente;
- descarta valores de tipos incompatíveis;
- aplica valores vazios previsíveis;
- serializa somente campos declarados;
- valida obrigatoriedade e quantidade mínima;
- associa erros ao caminho do campo.

### Repetidores

Listas permitem:

- adicionar;
- duplicar;
- excluir;
- mover para cima;
- mover para baixo.

A ordem visual é a ordem serializada. Itens totalmente vazios não são persistidos. Campos obrigatórios são validados antes da escrita.

### Ausência de legado

Não existem `content_v2`, editor paralelo, textarea JSON oculta ou fallback permanente. O contrato de banco continua em `cq_sections.content`.

## Cadastros

### Procedimentos

Campos principais:

- nome e slug;
- categoria;
- imagem;
- descrições;
- duração e sessões;
- contraindicações;
- mensagem de WhatsApp;
- destaque, publicação e ordem.

O slug pode ser gerado a partir do nome e deve permanecer único por site.

### Resultados

Um resultado contém imagens antes/depois, procedimento opcional, região, sessões, período, relato e nome de exibição. A publicação exige `consent_confirmed=true`.

### Depoimentos

Contêm identificação de exibição, texto, foto, nota, origem e procedimento opcional. A publicação também exige consentimento confirmado.

### FAQ

Perguntas e respostas possuem ordem e estado de publicação.

## Persistência

Todas as operações passam por `repository.ts`:

- carregamento do membership;
- carregamento dos dados administrativos;
- salvamento de settings;
- salvamento de seção;
- upsert dos cadastros;
- exclusão;
- rastreamento;
- operações de mídia e RPCs.

Nenhum editor visual deve conhecer detalhes de tabela, RLS ou credenciais.

## Consistência e concorrência

O painel atual trabalha com recarregamento após salvamento. Não há edição colaborativa em tempo real nem resolução automática de conflitos. Em operação com vários editores, a última escrita válida pode prevalecer; alterações críticas devem ser coordenadas.

## Publicação

Há campos de visibilidade/publicação nos registros atuais. Uma camada editorial completa de rascunho, preview privado e publicação atômica deve ser implementada apenas com migration e contrato próprios; não deve ser simulada por duplicação de tabelas ou campos ocultos.