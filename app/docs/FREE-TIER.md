# Operação gratuita

A arquitetura usa Cloudflare Pages para arquivos estáticos e o projeto Supabase gratuito já existente para banco, autenticação, Storage e Edge Functions.

O CMS foi isolado por tabelas `cq_`, bucket `cq-media` e funções próprias. Nenhuma tabela do sistema do Armazém é usada pelo site da clínica.

Acompanhe os limites gratuitos nos painéis da Cloudflare e do Supabase. IDs e tokens de publicidade não geram custo no CMS; eventuais custos dependem das próprias campanhas contratadas nas plataformas de anúncios.
