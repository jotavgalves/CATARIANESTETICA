# Checklist de novo projeto Supabase

Use esta lista para instalar ou migrar o CMS para outro projeto.

## Preparação

- [ ] Repositório em commit estável.
- [ ] Migrations revisadas.
- [ ] Project ref de origem registrado.
- [ ] Novo projeto Supabase criado.
- [ ] Credenciais guardadas fora do GitHub.
- [ ] Arquivo local baseado em `migration/environment.example.json` criado.
- [ ] Janela de manutenção planejada.

## Banco

- [ ] Extensões necessárias instaladas.
- [ ] Todas as migrations aplicadas em ordem.
- [ ] Todas as tabelas `cq_*` presentes.
- [ ] Primary keys, foreign keys e unique constraints presentes.
- [ ] Índices presentes.
- [ ] Triggers presentes.
- [ ] Funções e RPCs presentes.
- [ ] Funções `SECURITY DEFINER` com `search_path` seguro.
- [ ] RLS ativo nas tabelas expostas.
- [ ] Policies equivalentes ao ambiente de referência.
- [ ] Grants de `anon`, `authenticated` e `service_role` revisados.
- [ ] `cq_tracking_secrets` sem leitura pelo frontend.

## Auth

- [ ] Administradores criados ou convidados no Auth destino.
- [ ] Novos IDs de Auth registrados.
- [ ] `cq_site_members` recriada com os novos IDs.
- [ ] Allowlist recriada apenas quando necessária.
- [ ] Owner testado.
- [ ] Editor testado.
- [ ] Usuário sem acesso corretamente bloqueado.
- [ ] Recuperação de senha testada.

## Dados

- [ ] Exportação validada pelo schema JSON.
- [ ] UUIDs do conteúdo preservados.
- [ ] Dados de apenas um site incluídos.
- [ ] Site importado.
- [ ] Configurações importadas.
- [ ] Domínios importados.
- [ ] Seções importadas.
- [ ] Procedimentos importados.
- [ ] Resultados importados.
- [ ] Depoimentos importados.
- [ ] FAQ importada.
- [ ] Tracking público importado.
- [ ] Relações entre procedimentos, resultados e depoimentos válidas.

## Storage

- [ ] Bucket `cq-media` criado.
- [ ] Publicidade do bucket configurada corretamente.
- [ ] Limite de arquivo configurado.
- [ ] MIME types configurados.
- [ ] Policies de `storage.objects` aplicadas.
- [ ] Originais copiados.
- [ ] Variantes copiadas.
- [ ] Paths preservados.
- [ ] Checksums conferidos.
- [ ] URLs regeneradas para o projeto destino.
- [ ] Nenhuma referência aponta ao project ref antigo.
- [ ] Upload por membro autorizado testado.
- [ ] Upload para site de outro usuário bloqueado.
- [ ] Lixeira, restauração e exclusão testadas.

## Edge Functions e secrets

- [ ] Funções implantadas no destino.
- [ ] Secrets configurados fora do GitHub.
- [ ] Chave de criptografia configurada.
- [ ] Funções testadas com chamadas controladas.
- [ ] Logs sem erro de permissão.
- [ ] Service role ausente do frontend.

## Preview

- [ ] Variáveis do Preview apontam ao destino.
- [ ] Site público abre.
- [ ] Mobile testado.
- [ ] Desktop testado.
- [ ] Login testado.
- [ ] Painel carrega todos os dados.
- [ ] Editor visual de seções salva corretamente.
- [ ] Upload e enquadramento funcionam.
- [ ] Procedimentos salvam.
- [ ] Antes/depois respeita consentimento.
- [ ] Depoimentos respeitam consentimento.
- [ ] FAQ salva.
- [ ] Rastreamento não expõe credenciais.

## Cutover

- [ ] Edição no CMS antigo temporariamente congelada.
- [ ] Exportação incremental final concluída.
- [ ] Arquivos novos copiados.
- [ ] Comparação origem/destino aprovada.
- [ ] Variáveis de produção atualizadas.
- [ ] Novo deployment concluído.
- [ ] Commit de produção confirmado.
- [ ] Project ref do bundle confirmado.
- [ ] Teste público concluído.
- [ ] Teste administrativo não destrutivo concluído.

## Pós-migração

- [ ] Projeto antigo preservado para rollback.
- [ ] Monitoramento de erros ativo.
- [ ] Novas escritas conferidas no destino.
- [ ] Backup final da origem armazenado com segurança.
- [ ] Data mínima para desativação da origem definida.
- [ ] Documentação atualizada com o novo project ref, sem secrets.