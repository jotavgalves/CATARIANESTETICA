# Plano de rollback da migração

## Objetivo

Restaurar rapidamente a produção ao projeto Supabase anterior caso o destino apresente falha crítica.

## Condições para rollback

Execute rollback quando houver:

- indisponibilidade pública persistente;
- falha de login administrativo;
- perda ou corrupção de conteúdo;
- permissões excessivas ou acesso entre sites;
- arquivos ausentes em áreas críticas;
- impossibilidade de salvar dados;
- exposição de secrets;
- falha de rastreamento que comprometa o funcionamento principal.

Problemas apenas visuais devem ser avaliados separadamente. Não use rollback do banco para defeitos de CSS que possam ser revertidos por código.

## Preparação obrigatória

Antes da troca:

- preserve as variáveis anteriores do Cloudflare em cofre seguro;
- mantenha o projeto Supabase antigo ativo;
- registre o último commit estável;
- registre a hora do congelamento de edição;
- mantenha uma exportação final da origem;
- registre todas as escritas realizadas no destino após o cutover.

## Procedimento

1. interrompa novas alterações administrativas no destino;
2. restaure no Cloudflare a URL, anon key e identificador anteriores;
3. gere novo deployment de produção;
4. confirme que o bundle usa o project ref antigo;
5. teste página pública, login, conteúdo e mídia;
6. comunique que a origem voltou a ser a fonte oficial;
7. preserve o destino para investigação, sem novas escritas.

## Reconciliação

Caso tenham ocorrido alterações no destino depois da troca:

1. exporte somente os registros alterados no período;
2. compare com a origem por entidade e `updated_at`;
3. não importe automaticamente por cima da origem;
4. escolha, registre e aplique cada alteração válida;
5. copie também qualquer mídia nova e regenere suas referências.

## Dados que não devem ser descartados

- novos contatos ou eventos comerciais;
- alterações legítimas de conteúdo;
- arquivos enviados;
- logs de erro;
- IDs e timestamps das operações;
- configurações administrativas modificadas.

## Encerramento do incidente

O rollback só termina quando:

- a produção voltou a responder pelo ambiente antigo;
- nenhuma escrita continua indo ao destino;
- alterações do intervalo foram inventariadas;
- a causa foi identificada;
- existe plano de correção e nova validação em Preview.

## Prazo de retenção

Mantenha o projeto anterior intacto por no mínimo 14 dias. Para migrações com mídia, Auth e Edge Functions, 30 dias é a retenção recomendada.

Não exclua a origem apenas porque o novo ambiente permaneceu algumas horas sem erro.