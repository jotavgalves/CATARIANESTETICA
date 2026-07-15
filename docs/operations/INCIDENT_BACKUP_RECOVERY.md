# Incidentes, backup e recuperação

## Objetivo

Definir como preservar o site, limitar danos e restaurar operação sem improvisar mudanças permanentes fora do GitHub.

## Classificação de incidentes

### Disponibilidade

- site público indisponível;
- painel não autentica;
- RPC pública falha;
- Storage não entrega imagens;
- deployment inválido.

### Integridade

- conteúdo alterado incorretamente;
- mídia removida ou referências quebradas;
- migration parcial;
- dados de um site acessíveis por outro;
- publicação sem consentimento.

### Segurança

- chave ou token exposto;
- usuário não autorizado;
- RLS ou policy ausente;
- upload malicioso;
- acesso indevido a segredos.

## Resposta inicial

1. registrar horário, ambiente e sintomas;
2. interromper publicações e mudanças não essenciais;
3. preservar logs relevantes sem copiar secrets;
4. identificar último commit/deployment saudável;
5. decidir entre rollback de frontend, restauração de dados ou rotação de credenciais;
6. comunicar o estado sem afirmar causa não confirmada.

## Rollback do frontend

Quando o problema está no código ou configuração do Cloudflare:

1. reverter o merge ou restaurar o commit anterior no `main`;
2. aguardar deployment de produção;
3. confirmar o commit exibido no Cloudflare;
4. executar smoke test público e administrativo.

O rollback de frontend não desfaz alterações de banco ou dados feitas enquanto a versão defeituosa esteve ativa.

## Rollback de banco

Migrations devem preferir mudanças compatíveis e reversíveis. Uma migration já aplicada não deve ser editada. A correção deve ser uma nova migration.

Para incidentes de dados:

- identificar tabelas e linhas afetadas;
- exportar estado atual antes da correção;
- restaurar somente o escopo necessário;
- validar foreign keys, RLS e referências de mídia;
- registrar o procedimento.

## Backup

### Estrutura

A estrutura é preservada por:

- migrations versionadas;
- funções e policies em migrations;
- documentação técnica;
- histórico do GitHub.

### Dados

Backups precisam contemplar:

- tabelas de site e conteúdo;
- UUIDs e relações;
- JSONB;
- metadados de mídia;
- objetos do bucket;
- checksums;
- allowlist e membership de forma segura.

Secrets e usuários Auth exigem procedimento separado.

### Frequência

Antes de mudança crítica ou migração:

- exportação completa do site;
- inventário de Storage;
- contagens por tabela;
- relatório de funções, RLS e policies;
- cópia das variáveis sem valores secretos.

## Recuperação de mídia

Uma restauração completa precisa recuperar:

1. original;
2. variantes;
3. registros `cq_media_files`;
4. registros `cq_media_variants`;
5. referências de URL em settings, seções e cadastros.

Restaurar apenas o banco deixa objetos ausentes. Restaurar apenas o bucket deixa metadados e referências inconsistentes.

## Credencial exposta

1. revogar ou rotacionar imediatamente;
2. verificar logs e histórico;
3. atualizar o ambiente correto;
4. redeploy quando necessário;
5. testar integração;
6. remover o segredo do histórico por procedimento apropriado se houve commit;
7. revisar acessos realizados durante a janela.

Não basta apagar o texto de um commit posterior.

## Incidente de autorização

- suspender usuário ou policy problemática;
- confirmar se RLS está habilitado;
- testar como `anon`, membro de outro site e membro autorizado;
- revisar funções `security definer` e `search_path`;
- avaliar exposição de dados;
- aplicar migration corretiva;
- adicionar teste de regressão.

## Recuperação de acesso administrativo

Preferir:

- recuperação oficial de senha;
- allowlist controlada;
- recriação do membership por administrador seguro.

Não inserir senhas manualmente nem compartilhar sessão.

## Critérios de encerramento

Um incidente é encerrado quando:

- causa confirmada;
- serviço restaurado;
- dados validados;
- credenciais rotacionadas quando aplicável;
- teste de regressão criado;
- documentação/migration atualizada;
- relatório com impacto, linha do tempo e prevenção registrado.

## Retenção do ambiente anterior em migração

Após troca de Supabase, manter o projeto antigo intacto durante uma janela definida, normalmente 14 a 30 dias. O acesso deve ser restrito. A exclusão só ocorre após comparação, validação de mídia, login, RPC pública e período estável.