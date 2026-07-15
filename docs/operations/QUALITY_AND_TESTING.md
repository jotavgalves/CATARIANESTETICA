# Qualidade, CI e testes

## Comando local

No diretório `app/`, execute `npm run check`.

O comando reúne TypeScript, ESLint, Stylelint, Vitest e build de produção.

## Pipeline

A workflow `CMS Quality` verifica instalação de dependências, tipagem, lint de código, lint de CSS, testes, build e bundles. Um pull request não deve ser mesclado enquanto a execução estiver incompleta ou falha.

## Regras de código

- dados externos precisam ser validados;
- operações administrativas no Supabase permanecem em `repository.ts`;
- controladores coordenam e não duplicam persistência;
- renderizadores não acessam banco;
- erros de domínio usam códigos estáveis;
- credenciais nunca entram no repositório.

## Regras de CSS

- sem `!important`;
- sem estilos inline;
- sem classes de remendo;
- sem duplicação de regras para esconder problemas de cascata;
- reutilizar tokens e componentes existentes.

## Testes arquiteturais

Os testes impedem regressões estruturais, incluindo:

- mais de uma entrada por página;
- autenticação fora do controlador próprio;
- acesso administrativo ao Supabase fora do repositório;
- segunda implementação da matemática de crop;
- dimensões de mídia fora do schema central;
- processamento de SVG fora do processador;
- editor de mídia acoplado à persistência;
- retorno do upload antigo;
- retorno do editor JSON de seções;
- `JSON.parse` no fluxo visual das seções;
- mensagens cruas do Supabase na interface;
- estilos inline e `!important`.

## Testes de domínio

### Seções

- toda `section_key` possui schema;
- chaves são únicas;
- conteúdo inválido é normalizado;
- repetidores preservam ordem;
- campos obrigatórios geram erro associado ao campo.

### Mídia

- zoom, deslocamento e rotação;
- modos cover e contain;
- slots e variantes;
- sanitização de SVG;
- formatos suportados;
- limites que impedem áreas vazias em cover.

### Publicação

- resultados e depoimentos exigem consentimento;
- somente conteúdo publicável entra na RPC pública;
- relações e identificadores são consistentes.

## Validação manual

Mudanças visuais ou de mídia devem ser conferidas em desktop e larguras 320, 360, 390, 430, 768, 1024 e 1440 px. Alterações de upload devem ser testadas em Safari/iPhone quando possível, especialmente para HEIC.

Compatibilidade não testada deve ser registrada como limitação, sem afirmação de comprovação.

## Critérios de aceite

- escopo claro;
- sem estrutura legada paralela;
- sem funções com sufixos temporários;
- CI verde;
- Preview validado;
- documentação atualizada;
- rollback compreendido;
- confirmação de `merged=true` após o merge.

## Diagnóstico

1. identificar a etapa exata;
2. ler o log preservado;
3. reproduzir o mesmo comando;
4. corrigir a causa;
5. adicionar regressão quando necessário;
6. executar a pipeline completa novamente.