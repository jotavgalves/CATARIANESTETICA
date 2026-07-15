# Guia de migração para outro Supabase

## Objetivo

Recriar o sistema em um novo projeto Supabase sem perder estrutura, permissões, conteúdo, arquivos ou relações.

A migração é concluída somente quando o novo ambiente funciona de forma independente do projeto antigo.

## Princípios

1. migrations constroem a estrutura;
2. exportações transportam dados do site;
3. arquivos do Storage são copiados separadamente;
4. UUIDs são preservados em uma migração completa;
5. URLs do projeto antigo são substituídas;
6. o ambiente novo é validado em Preview antes da produção;
7. o projeto antigo permanece disponível para rollback.

## O que precisa ser migrado

- extensões PostgreSQL;
- tabelas, colunas, constraints, índices e sequências;
- funções, triggers e RPCs;
- RLS e grants;
- bucket e políticas de Storage;
- conteúdo do CMS;
- arquivos originais e variantes;
- usuários administrativos e vínculos;
- Edge Functions;
- secrets das Edge Functions;
- variáveis do Cloudflare Pages.

## Pré-requisitos

- acesso de proprietário aos dois projetos Supabase;
- acesso ao repositório GitHub;
- Supabase CLI instalada e autenticada;
- Node.js compatível com o projeto;
- acesso às variáveis do Cloudflare Pages;
- janela de manutenção para a sincronização final.

Nunca coloque `service_role`, senha do banco ou secrets reais no GitHub.

## Estrutura esperada do pacote de exportação

O formato principal é JSON versionado, não uma coleção de CSVs independentes.

Ordem lógica:

1. site;
2. configurações;
3. domínios;
4. allowlist e membros;
5. seções;
6. procedimentos;
7. resultados;
8. depoimentos;
9. FAQ;
10. tracking público;
11. mídia original;
12. variantes.

Eventos históricos e segredos devem ser tratados separadamente conforme a finalidade da migração.

## Fase 1 — Preparação

### 1. Criar o projeto destino

Crie um projeto vazio na região adequada. Não reutilize chaves do projeto anterior.

Registre em local seguro:

- project ref;
- URL pública;
- anon key;
- service role;
- senha ou connection string do banco.

### 2. Criar arquivo local de ambiente

Copie `migration/environment.example.json` para um arquivo ignorado pelo Git e preencha origem e destino.

### 3. Congelar o contrato

Antes da exportação:

- confirme que `main` está estável;
- registre o último commit;
- registre a versão mais recente das migrations;
- não aplique mudanças estruturais durante a migração.

## Fase 2 — Construir o destino

### 1. Vincular a CLI ao projeto destino

Use a CLI apenas com credenciais locais. Confirme visualmente o project ref antes de aplicar qualquer alteração.

### 2. Aplicar migrations

Aplique todas as migrations em ordem histórica. Não copie SQL de forma seletiva pelo editor web.

Resultado esperado:

- todas as tabelas `cq_*` existem;
- extensões estão instaladas;
- funções e triggers existem;
- RLS está ativo;
- policies e grants foram aplicados;
- bucket e políticas de Storage estão configurados pelas migrations correspondentes.

### 3. Validar banco vazio

Antes de importar conteúdo, verifique:

- schema completo;
- funções com `search_path` seguro;
- nenhuma tabela administrativa acessível por `anon`;
- `authenticated` limitado por RLS;
- `cq_tracking_secrets` isolada;
- bucket `cq-media` configurado.

## Fase 3 — Auth

Para poucos administradores, não migre hashes de senha.

Procedimento recomendado:

1. crie ou convide os usuários no novo Supabase Auth;
2. peça que definam nova senha pelo fluxo oficial;
3. obtenha os novos `auth.users.id`;
4. recrie `cq_site_members` com esses IDs;
5. mantenha a allowlist necessária para recuperação e vinculação inicial;
6. teste owner e editor separadamente.

Não copie diretamente linhas internas de `auth.users` entre projetos.

## Fase 4 — Exportar os dados

A exportação deve:

- filtrar por `site_id`;
- preservar UUIDs dos registros do CMS;
- preservar JSONB sem conversão textual inadequada;
- registrar versão do formato e data;
- incluir checksums de mídia;
- omitir secrets por padrão;
- validar o pacote contra `migration/site-export.schema.json`.

Antes de importar, confira:

- quantidade de registros por entidade;
- existência do site e das configurações;
- relações entre procedimentos, resultados e depoimentos;
- relações entre originais e variantes;
- ausência de dados de outro site.

## Fase 5 — Importar os dados

Ordem recomendada:

1. `cq_sites`;
2. `cq_site_settings`;
3. `cq_site_domains`;
4. `cq_admin_allowlist`;
5. `cq_sections`;
6. `cq_procedures`;
7. `cq_results`;
8. `cq_testimonials`;
9. `cq_faq_items`;
10. `cq_tracking_configs`;
11. `cq_media_files`;
12. `cq_media_variants`;
13. `cq_site_members` com os novos IDs de Auth.

Use transação para os registros relacionais sempre que possível. Storage não participa dessa transação.

O importador deve ser idempotente ou recusar explicitamente um destino já preenchido. Nunca deve duplicar silenciosamente registros.

## Fase 6 — Migrar Storage

### Estratégia

Preserve `storage_path`, mas gere novas URLs públicas no destino.

Fluxo por arquivo:

1. baixar o objeto da origem;
2. validar tamanho e checksum;
3. enviar ao mesmo path no destino;
4. obter a URL nova;
5. atualizar o registro correspondente;
6. substituir referências de URL em settings, seções e entidades;
7. verificar que nenhuma URL continua apontando ao project ref antigo.

Copie:

- originais de `cq_media_files`;
- variantes de `cq_media_variants`;
- SVGs preservando o conteúdo já sanitizado;
- metadados e checksums.

Em falha parcial, remova do destino os objetos enviados pela execução incompleta ou retome por checkpoint verificado.

## Fase 7 — Edge Functions e secrets

Para cada função:

1. confirme o código versionado;
2. faça deploy para o projeto destino;
3. configure secrets pelo painel ou CLI;
4. não copie valores para arquivos do repositório;
5. execute uma chamada controlada;
6. confira logs e permissões.

Segredos de rastreamento criptografados podem depender de uma chave externa. Se a chave mudar, descriptografe em ambiente confiável e grave novamente usando o processo oficial do destino.

## Fase 8 — Preview no Cloudflare

Crie um deployment de Preview com:

- URL do Supabase destino;
- anon key do destino;
- identificador do site destino;
- nomes corretos de Edge Functions e bucket.

Teste:

- carregamento público;
- navegação mobile e desktop;
- login;
- recuperação de senha;
- leitura e salvamento no painel;
- editor visual de seções;
- upload, enquadramento, lixeira e restauração de mídia;
- procedimentos;
- resultados e consentimento;
- depoimentos e consentimento;
- FAQ;
- rastreamento sem exposição de segredos.

## Fase 9 — Sincronização final

Quando o Preview estiver aprovado:

1. anuncie uma janela curta de manutenção;
2. impeça novas edições no CMS antigo;
3. exporte novamente registros alterados desde a primeira exportação;
4. copie arquivos novos ou alterados;
5. importe o delta;
6. rode a comparação final;
7. só então troque as variáveis de produção.

## Fase 10 — Troca de produção

Atualize as variáveis do Cloudflare e faça um novo deployment.

Verifique imediatamente:

- commit implantado;
- project ref utilizado pelo bundle;
- resposta pública;
- login administrativo;
- mídia e favicon;
- gravação de teste não destrutiva;
- logs de erros.

## Critérios de aprovação

- contagens compatíveis entre origem e destino;
- mesmos IDs do conteúdo migrado;
- relações intactas;
- mesmos checksums dos arquivos;
- nenhuma URL do projeto antigo;
- RLS e grants verificados;
- `anon` bloqueado no CMS;
- owner e editor com limites corretos;
- secrets não legíveis;
- CI e build aprovados;
- Preview aprovado em desktop e mobile.

## Rollback

Em problema crítico:

1. restaure no Cloudflare as variáveis do projeto anterior;
2. gere novo deployment;
3. confirme que a produção voltou à origem;
4. suspenda escrita no destino até investigar;
5. registre o que foi escrito após a troca para reconciliação.

Mantenha o projeto anterior intacto por pelo menos 14 dias após a migração. Para mudanças críticas, 30 dias é mais seguro.

## O que não fazer

- desativar RLS para facilitar importação;
- usar service role no frontend;
- copiar somente tabelas e ignorar funções;
- migrar por CSV sem preservar JSON e relações;
- gerar novos UUIDs numa migração completa;
- manter URLs do Storage antigo;
- copiar usuários internos de Auth diretamente;
- trocar produção sem Preview;
- excluir o projeto antigo imediatamente;
- criar scripts paralelos que substituam as migrations.