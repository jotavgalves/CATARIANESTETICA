# Espelhamento multi-site

O frontend identifica o site pelo domínio atual e chama `cq_get_public_site(hostname)`.

## Criar outro site

1. Inserir uma linha em `cq_sites`.
2. Inserir os domínios em `cq_site_domains`.
3. Criar `cq_site_settings` e `cq_tracking_configs` para o novo `site_id`.
4. Duplicar ou cadastrar seções, procedimentos e FAQ com o mesmo `site_id`.
5. Autorizar administradores em `cq_admin_allowlist`.

O mesmo build pode atender vários domínios. Cada domínio recebe seus próprios textos, imagens, número, logo, procedimentos, resultados, pixels e configurações.

## Isolamento

Todas as tabelas usam `site_id`. As políticas RLS validam a associação do usuário em `cq_site_members`. Um editor de um site não pode modificar outro site.
