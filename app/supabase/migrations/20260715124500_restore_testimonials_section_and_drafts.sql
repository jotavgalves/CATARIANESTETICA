insert into public.cq_sections (
  site_id,
  section_key,
  eyebrow,
  title,
  subtitle,
  content,
  is_enabled,
  sort_order,
  status
)
select
  id,
  'testimonials',
  'Experiências',
  'Relatos de atendimento',
  'Depoimentos reais e autorizados ajudam novas pacientes a conhecer a experiência da clínica.',
  '{}'::jsonb,
  true,
  60,
  'published'
from public.cq_sites
where slug = 'catarina-queiroz'
on conflict (site_id, section_key) do update
set
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  subtitle = excluded.subtitle,
  is_enabled = true,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.cq_testimonials (
  site_id,
  client_display_name,
  testimonial_text,
  rating,
  source_name,
  consent_confirmed,
  is_published,
  sort_order
)
select
  site.id,
  draft.client_name,
  draft.testimonial_text,
  5,
  'Conteúdo antigo — revisar antes de publicar',
  false,
  false,
  draft.sort_order
from public.cq_sites as site
cross join (
  values
    ('Cliente 01', 'Atendimento muito cuidadoso, com explicação clara do protocolo e um ambiente lindo.', 10),
    ('Cliente 02', 'Me senti acolhida desde o primeiro contato. Tudo foi explicado com muita calma.', 20),
    ('Cliente 03', 'Amei a experiência. A pele ficou com sensação de limpeza e leveza.', 30),
    ('Cliente 04', 'Gostei muito da avaliação individual e do cuidado no acompanhamento.', 40)
) as draft(client_name, testimonial_text, sort_order)
where site.slug = 'catarina-queiroz'
  and not exists (
    select 1
    from public.cq_testimonials as testimonial
    where testimonial.site_id = site.id
  );
