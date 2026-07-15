# Regras arquiteturais do CMS

## Fontes únicas de responsabilidade

- `src/admin/auth-controller.ts`: autenticação, sessão, recuperação e mudança de senha.
- `src/admin/errors.ts`: normalização e códigos dos erros administrativos.
- `src/admin/media-service.ts`: validação, conversão, redimensionamento, compressão e coordenação das imagens.
- `src/admin/repository.ts`: banco, Storage e funções de servidor. Não importa UI nem controladores.
- `src/admin/render.ts`: HTML das telas. Não chama Supabase.
- `src/admin/main.ts`: coordena eventos da página e inicializa o painel uma única vez.

## Regras obrigatórias

1. Substituir fluxos removendo a implementação anterior; nunca interceptar uma implementação antiga por outra camada.
2. Nenhum import TypeScript apenas por efeito colateral.
3. Nenhum `MutationObserver` para reescrever formulários já renderizados.
4. Apenas o controlador de autenticação pode chamar métodos `supabase.auth`.
5. Apenas um listener de estado de autenticação pode existir.
6. Cada página HTML possui exatamente um entrypoint JavaScript.
7. Mudanças estruturais só são mescladas após CI e validação em preview.
8. Não usar `!important`, estilos inline ou classes de remendo.
9. Apenas `repository.ts` pode acessar `supabase.storage` e tabelas do Supabase.
10. Apenas `media-service.ts` pode decodificar, redimensionar ou comprimir imagens.
11. Erros externos devem ser normalizados e nunca substituídos por mensagens genéricas.
12. Falhas no registro de mídia devem acionar a limpeza do arquivo recém-enviado.
13. Mensagens de erro não podem reconstruir o formulário nem descartar os valores preenchidos.
14. Campos relacionais devem usar seletores por nome, sem exigir identificadores técnicos do usuário.
