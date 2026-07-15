# Critério de completude da migração

## O que já está documentado

A estratégia cobre:

- criação do projeto destino;
- aplicação ordenada das migrations;
- Auth, allowlist e memberships;
- dados relacionais com UUIDs preservados;
- Storage, variantes, checksums e reescrita de URLs;
- Edge Functions e secrets;
- variáveis do Cloudflare;
- Preview, sincronização final e troca sem downtime planejado;
- validação pós-migração;
- rollback para o projeto anterior.

## O que constitui uma migração completa

Uma migração só pode ser declarada concluída quando todos os itens abaixo passam:

### Estrutura

- migrations aplicadas sem erro;
- tabelas, colunas, defaults, constraints e índices equivalentes;
- triggers e funções equivalentes;
- RLS habilitado;
- policies e grants equivalentes;
- bucket e policies do Storage equivalentes.

### Dados

- `cq_sites` e configurações;
- domínios;
- seções;
- procedimentos;
- resultados;
- depoimentos;
- FAQ;
- tracking config;
- mídia e variantes;
- memberships recriados para usuários válidos.

### Arquivos

- todos os `storage_path` presentes;
- tamanho e checksum conferidos;
- URLs apontando ao destino;
- nenhuma referência ao host antigo, salvo registro histórico deliberado.

### Segurança

- anon acessa apenas o contrato público;
- usuário sem membership não acessa CMS;
- membro de um site não acessa outro;
- segredos não são legíveis;
- service role não aparece no frontend;
- funções sensíveis possuem grants restritos.

### Aplicação

- site público carrega;
- painel autentica;
- formulário salva;
- upload e reenquadramento funcionam;
- lixeira funciona;
- consentimento bloqueia publicação indevida;
- tracking de teste registra status esperado.

## Documentação versus automação

Os documentos definem o procedimento e o contrato. Eles não substituem scripts operacionais nem comprovam, sozinhos, que uma migração foi executada.

Enquanto os scripts de exportação, importação, Storage e comparação não existirem, a migração deve ser executada manualmente com checklist e dupla conferência. Nenhuma etapa manual pode desativar RLS ou introduzir DDL fora das migrations.

## Evidências obrigatórias

Guardar, sem segredos:

- commit das migrations;
- project refs de origem e destino;
- data e responsável;
- contagens por tabela;
- relatório de schema e policies;
- lista de objetos e checksums;
- resultado dos smoke tests;
- commit/deployment de produção;
- plano de rollback utilizado.

## Declaração honesta

A documentação técnica do sistema descreve o estado atual e o processo esperado. A portabilidade só é considerada comprovada após uma instalação em projeto vazio e uma migração real de teste concluírem todos os critérios deste arquivo.