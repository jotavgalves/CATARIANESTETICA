# Segurança

- O frontend usa somente a chave publicável do Supabase.
- Segredos da Meta e Google são enviados a uma Edge Function autenticada e armazenados criptografados.
- O conteúdo administrativo é protegido por RLS e associação em `cq_site_members`.
- Resultados e depoimentos não podem ser publicados sem `consent_confirmed`.
- Uploads são limitados a imagens de até 5 MB.
- A pasta inicial do objeto no Storage é o UUID do site e é validada pelas políticas.
- O endpoint de eventos aceita somente nomes registrados, valida o domínio e impede duplicação por `event_id`.
- O código bloqueia inicializações paralelas e a CI rejeita scripts e estilos de remendo.
