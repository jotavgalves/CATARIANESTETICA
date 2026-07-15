# Pipeline de mídia

## Objetivo

O subsistema de mídia garante que uploads sejam validados, enquadrados e convertidos para o uso correto antes da publicação. O original é preservado e as versões derivadas são registradas separadamente.

## Módulos

- `media-schema.ts`: slots, dimensões, proporções e formatos;
- `media-processor.ts`: validação, decodificação, sanitização e geração;
- `media-editor.ts`: enquadrador manual;
- `media-controller.ts`: coordenação da interface;
- `media-service.ts`: operações compostas e compensação;
- `repository.ts`: banco, RPC e Storage.

## Slots

Os slots centrais incluem:

- `general`;
- `logo_header`;
- `favicon`;
- `hero_desktop` — 1920 × 1080;
- `hero_mobile` — 1080 × 1350;
- `procedure_card` — 1200 × 900;
- `result_before` e `result_after` — 1200 × 1500;
- `testimonial_photo` — 800 × 800;
- `section_portrait` — 1200 × 1500;
- `section_landscape` — 1600 × 1000;
- `social_share` — 1200 × 630.

As dimensões não devem ser repetidas em formulários ou controladores.

## Formatos aceitos

Raster:

- JPEG;
- PNG;
- WebP;
- AVIF;
- HEIC/HEIF quando o navegador consegue decodificar.

Vetor:

- SVG somente nos slots autorizados, como logo e favicon.

O limite de origem é 30 MB. SVG possui limite menor e sanitização específica.

## Sanitização de SVG

O processador usa parser XML e remove elementos e atributos perigosos, incluindo scripts, `foreignObject`, objetos incorporados, handlers de evento e URLs inseguras. Também exige dimensões ou `viewBox` válidos.

Essa sanitização protege o fluxo normal do painel, mas ocorre no cliente. Uma carga enviada fora da aplicação não deve ser considerada segura apenas por essa camada; políticas de upload e revisão continuam necessárias.

## Enquadramento

O editor permite:

- arrastar;
- ampliar/reduzir;
- girar em passos de 90 graus;
- restaurar;
- escolher `cover` ou `contain` quando permitido.

A matemática de recorte é centralizada no processador. O editor utiliza a mesma renderização da geração final, evitando uma prévia divergente.

Em `cover`, os deslocamentos são limitados para impedir áreas vazias. Em `contain`, margens seguras podem ser intencionais, especialmente para favicon e identidade.

## Variantes

Cada variante registra:

- `slot_key`;
- caminho no Storage;
- URL pública;
- largura e altura;
- MIME type;
- tamanho;
- transformação de recorte em JSONB.

Logo SVG pode permanecer como variante principal e possuir fallback raster. Favicon gera versões 32, 180, 192 e 512 pixels para diferentes consumidores.

## Persistência

Tabelas:

- `cq_media_files`: arquivo original e metadados gerais;
- `cq_media_variants`: versões geradas por slot.

Bucket:

- `cq-media`;
- público para leitura dos arquivos publicados;
- escrita e exclusão condicionadas ao membership do site;
- caminhos isolados pelo `site_id`.

## Upload inicial

```text
arquivo local
  ↓
validação e decodificação
  ↓
enquadrador
  ↓
geração das variantes
  ↓
upload para Storage
  ↓
registro de mídia e variantes
```

Em falha parcial, o serviço tenta compensar o que já foi criado. A ordem de rollback evita deixar registros apontando para objetos inexistentes.

## Reenquadramento

O original é baixado, reenquadrado e novas variantes são enviadas. A RPC `cq_commit_media_variants` confirma variantes e substitui referências de URL de forma atômica no banco.

A substituição percorre settings, conteúdo JSON e registros relacionados, usando funções recursivas de JSONB.

## Uso e exclusão

`cq_media_usage` identifica referências ativas. Uma mídia em uso não deve ser removida sem substituição.

Lixeira:

- `cq_trash_media`: soft delete;
- `cq_restore_media`: restauração;
- `cq_delete_media_metadata`: exclusão definitiva dos metadados, após validações e remoção dos objetos.

A exclusão de Storage e banco não é uma única transação PostgreSQL. O serviço deve tratar compensação e relatar falhas parciais.

## Metadados e integridade

- checksum SHA-256 auxilia comparação e migração;
- largura, altura e proporção são registradas;
- original é preservado;
- `deleted_at` diferencia ativos e lixeira;
- referências públicas devem apontar ao projeto Supabase atual após migração.

## Limitações operacionais

- conversão HEIC varia por navegador;
- arquivos muito grandes consomem memória do navegador durante processamento;
- reenquadramento exige acesso ao original;
- URLs públicas mudam ao migrar de projeto;
- o navegador não substitui um antivírus ou scanner de conteúdo server-side.