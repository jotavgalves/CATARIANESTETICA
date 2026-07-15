# Portabilidade do Supabase

## Ordem de leitura

1. [`../architecture/SYSTEM_OVERVIEW.md`](../architecture/SYSTEM_OVERVIEW.md)
2. [`../database/SCHEMA_AND_PERMISSIONS.md`](../database/SCHEMA_AND_PERMISSIONS.md)
3. [`SUPABASE_MIGRATION_GUIDE.md`](SUPABASE_MIGRATION_GUIDE.md)
4. [`NEW_PROJECT_CHECKLIST.md`](NEW_PROJECT_CHECKLIST.md)
5. [`ROLLBACK_PLAN.md`](ROLLBACK_PLAN.md)

## Arquivos operacionais

- `migration/environment.example.json`: modelo sem segredos para descrever origem, destino e opções.
- `migration/site-export.schema.json`: contrato versionado do pacote de exportação.

## Regra de manutenção

As migrations em `supabase/migrations/` continuam sendo a única fonte executável do schema. A documentação explica e verifica o processo; não deve substituir ou duplicar migrations.

Ao alterar banco, RLS, Storage, Auth ou contratos de conteúdo:

1. criar migration;
2. atualizar tipos e testes;
3. atualizar a documentação afetada;
4. validar instalação em banco vazio;
5. validar migração em Preview antes de produção.

## Próxima etapa técnica

Os scripts de exportação, importação, cópia de Storage e comparação de ambientes devem implementar o contrato descrito aqui. Eles não devem conter DDL próprio nem desativar RLS; a construção do destino permanece responsabilidade das migrations.