# Regras arquiteturais do CMS

## Fontes únicas de responsabilidade

- `src/admin/auth-controller.ts`: autenticação, sessão, recuperação e mudança de senha.
- `src/admin/repository.ts`: banco, Storage e funções de servidor. Não importa UI nem controladores.
- `src/admin/render.ts`: HTML das telas. Não chama Supabase.
- `src/admin/main.ts`: coordena eventos da página e inicializa o painel uma única vez.
- `src/admin/errors.ts`: normaliza todos os erros administrativos e define códigos estáveis.
- `src/admin/media-schema.ts`: única fonte de slots, proporções, dimensões, formatos e regras de encaixe.
- `src/admin/media-processor.ts`: valida arquivos, sanitiza SVG, calcula checksum e gera originais/variantes.
- `src/admin/media-editor.ts`: interface do enquadrador. Reutiliza o renderizador do processador e não acessa banco ou Storage.
- `src/admin/media-service.ts`: coordena upload, reenquadramento, lixeira e exclusão sem manipular DOM.
- `src/public/responsive-media.ts`: aplica exclusivamente as versões desktop e mobile no site público.

## Regras obrigatórias

1. Substituir fluxos removendo a implementação anterior; nunca interceptar uma implementação antiga por outra camada.
2. Nenhum import TypeScript apenas por efeito colateral.
3. Nenhum `MutationObserver` para reescrever formulários já renderizados.
4. Apenas o controlador de autenticação pode chamar métodos `supabase.auth`.
5. Apenas um listener de estado de autenticação pode existir.
6. Cada página HTML possui exatamente um entrypoint JavaScript.
7. Mudanças estruturais só são mescladas após CI e validação em preview.
8. Não usar `!important`, estilos inline ou classes de remendo.
9. Apenas `repository.ts` pode acessar `supabase.storage`, tabelas ou RPCs administrativas.
10. Slots e dimensões de mídia não podem ser redefinidos fora de `media-schema.ts`.
11. Sanitização de SVG e geração de arquivos não podem existir fora de `media-processor.ts`.
12. O enquadrador deve reutilizar `renderMediaCanvas`; não pode implementar uma segunda matemática de recorte.
13. O original é preservado, e as páginas recebem apenas URLs de variantes próprias para seus slots.
14. Exclusão começa pela lixeira e exige verificação de referências.
15. Falhas parciais nunca podem deixar registros apontando para arquivos deliberadamente removidos.
