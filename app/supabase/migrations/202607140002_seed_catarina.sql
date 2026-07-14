insert into public.cq_sites(slug, name, default_domain, status)
values ('catarina-queiroz', 'Catarina Queiroz Clínica Estética', 'dracatarinaqueiroz.pages.dev', 'active')
on conflict (slug) do update
set name = excluded.name,
    default_domain = excluded.default_domain,
    status = excluded.status;

insert into public.cq_site_domains(site_id, hostname, is_primary)
select id, 'dracatarinaqueiroz.pages.dev', true
from public.cq_sites
where slug = 'catarina-queiroz'
on conflict (hostname) do update
set site_id = excluded.site_id,
    is_primary = true;

insert into public.cq_admin_allowlist(site_id, email, role)
select id, 'jvgacontato@gmail.com', 'owner'
from public.cq_sites
where slug = 'catarina-queiroz'
on conflict (site_id, email) do update set role = 'owner';

insert into public.cq_site_settings(
  site_id,
  professional_name,
  professional_title,
  whatsapp,
  phone,
  address_line,
  city,
  state,
  maps_url,
  opening_hours,
  seo_title,
  seo_description,
  footer_text,
  hero,
  theme
)
select
  id,
  'Catarina Queiroz',
  'Esteticista e cosmetóloga',
  '5581989844806',
  '(81) 98984-4806',
  'Rua Ribeiro de Brito, 554 — Boa Viagem',
  'Recife',
  'PE',
  'https://www.google.com/maps/search/?api=1&query=Rua+Ribeiro+de+Brito+554+Boa+Viagem+Recife',
  'Atendimento com hora marcada',
  'Catarina Queiroz | Estética Facial e Corporal em Boa Viagem',
  'Clínica de estética facial e corporal em Boa Viagem, Recife. Avaliação individual e atendimento com hora marcada.',
  'Resultados variam conforme avaliação individual e resposta de cada pessoa.',
  jsonb_build_object(
    'eyebrow', 'Estética facial e corporal em Boa Viagem',
    'title', 'Cuidado estético com técnica, atenção e naturalidade.',
    'subtitle', 'Cada atendimento começa com uma avaliação individual para entender suas necessidades, definir o protocolo mais adequado e conduzir seu cuidado com clareza e responsabilidade.',
    'image_url', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=2200&q=88',
    'primary_cta', 'Agendar pelo WhatsApp',
    'secondary_cta', 'Conhecer os procedimentos'
  ),
  jsonb_build_object(
    'brand', '#76574d',
    'brand_dark', '#4b342d',
    'paper', '#fffdfb',
    'ink', '#2b2421'
  )
from public.cq_sites
where slug = 'catarina-queiroz'
on conflict (site_id) do update
set professional_name = excluded.professional_name,
    professional_title = excluded.professional_title,
    whatsapp = excluded.whatsapp,
    phone = excluded.phone,
    address_line = excluded.address_line,
    city = excluded.city,
    state = excluded.state,
    maps_url = excluded.maps_url,
    opening_hours = excluded.opening_hours,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    footer_text = excluded.footer_text,
    hero = excluded.hero,
    theme = excluded.theme;

insert into public.cq_sections(site_id, section_key, eyebrow, title, subtitle, content, is_enabled, sort_order, status)
select site.id, seed.section_key, seed.eyebrow, seed.title, seed.subtitle, seed.content, true, seed.sort_order, 'published'
from public.cq_sites site
cross join (values
  (
    'needs',
    'Comece pela sua necessidade',
    'O tratamento certo começa por uma boa avaliação.',
    'Antes de indicar qualquer procedimento, avaliamos sua queixa, sua rotina e seus objetivos.',
    '{"items":[{"title":"Cravos, oleosidade e textura irregular","text":"Cuidados direcionados à limpeza, renovação e equilíbrio da pele."},{"title":"Inchaço facial e aparência cansada","text":"Protocolos para favorecer leveza, viço e um aspecto mais descansado."},{"title":"Retenção de líquidos e desconforto corporal","text":"Técnicas voltadas à circulação, ao bem-estar e à melhora do contorno visual."},{"title":"Flacidez, gordura localizada e sinais de envelhecimento","text":"Planejamento individual para tratar diferentes objetivos de forma responsável."}]}'::jsonb,
    10
  ),
  (
    'procedures',
    'Procedimentos',
    'Tratamentos escolhidos de acordo com a sua necessidade.',
    'A indicação final é definida somente após uma avaliação individual.',
    '{}'::jsonb,
    20
  ),
  (
    'process',
    'Como funciona',
    'Você entende cada etapa antes de começar.',
    'A avaliação inicial esclarece sua necessidade, explica as possibilidades e alinha expectativas.',
    '{"steps":[{"title":"Avaliação individual","text":"Entendimento da queixa, do histórico, da rotina e do objetivo principal."},{"title":"Definição do protocolo","text":"Escolha do procedimento, frequência e orientações adequadas."},{"title":"Realização do procedimento","text":"Atendimento com hora marcada e explicação clara."},{"title":"Orientações e acompanhamento","text":"Recomendações para sustentar a evolução e reavaliar o plano."}]}'::jsonb,
    30
  ),
  (
    'about',
    'A profissional',
    'Catarina Queiroz',
    'Esteticista e cosmetóloga, com atuação em tratamentos faciais e corporais.',
    '{"body":"Seu atendimento é conduzido com escuta, transparência e indicação responsável, respeitando as características, os objetivos e o ritmo de cada pessoa.","image_url":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1300&q=85"}'::jsonb,
    40
  ),
  (
    'results',
    'Resultados e experiências',
    'Evoluções que podem ser acompanhadas com clareza.',
    'Cada resultado depende da avaliação, do protocolo indicado e da resposta individual.',
    '{}'::jsonb,
    50
  ),
  (
    'faq',
    'Dúvidas frequentes',
    'Informações importantes antes do seu atendimento.',
    'Tire suas principais dúvidas antes de conversar com a clínica.',
    '{}'::jsonb,
    60
  ),
  (
    'location',
    'Localização',
    'Atendimento em Boa Viagem.',
    'Consulte a disponibilidade e agende pelo WhatsApp.',
    '{}'::jsonb,
    70
  )
) as seed(section_key, eyebrow, title, subtitle, content, sort_order)
where site.slug = 'catarina-queiroz'
on conflict (site_id, section_key) do update
set eyebrow = excluded.eyebrow,
    title = excluded.title,
    subtitle = excluded.subtitle,
    content = excluded.content,
    is_enabled = excluded.is_enabled,
    sort_order = excluded.sort_order,
    status = excluded.status;

insert into public.cq_procedures(
  site_id,
  name,
  slug,
  category,
  short_description,
  image_url,
  whatsapp_message,
  is_featured,
  is_published,
  sort_order
)
select site.id, seed.name, seed.slug, seed.category, seed.description, seed.image_url, seed.message, true, true, seed.sort_order
from public.cq_sites site
cross join (values
  ('Limpeza de pele', 'limpeza-de-pele', 'Facial', 'Procedimento indicado para remover impurezas, reduzir cravos e melhorar o aspecto geral da pele.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1100&q=85', 'Olá, tenho interesse em limpeza de pele.', 10),
  ('Drenagem facial', 'drenagem-facial', 'Facial', 'Técnica manual voltada à redução do inchaço e à melhora da sensação de leveza no rosto.', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1100&q=85', 'Olá, tenho interesse em drenagem facial.', 20),
  ('Peeling químico', 'peeling-quimico', 'Facial', 'Renovação cutânea indicada para melhorar textura, viço e uniformidade da pele.', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1100&q=85', 'Olá, tenho interesse em peeling químico.', 30),
  ('Drenagem HD', 'drenagem-hd', 'Corporal', 'Técnica corporal voltada à retenção de líquidos, ao inchaço e à melhora do contorno visual.', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1100&q=85', 'Olá, tenho interesse em Drenagem HD.', 40),
  ('Endolaser', 'endolaser', 'Tecnologia', 'Tecnologia utilizada em protocolos específicos para contorno, flacidez e gordura localizada.', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1100&q=85', 'Olá, tenho interesse em Endolaser e gostaria de uma avaliação.', 50),
  ('Botox', 'botox', 'Rejuvenescimento', 'Tratamento voltado à suavização de linhas de expressão, sempre mediante avaliação profissional.', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1100&q=85', 'Olá, gostaria de uma avaliação para Botox.', 60)
) as seed(name, slug, category, description, image_url, message, sort_order)
where site.slug = 'catarina-queiroz'
on conflict (site_id, slug) do update
set name = excluded.name,
    category = excluded.category,
    short_description = excluded.short_description,
    image_url = excluded.image_url,
    whatsapp_message = excluded.whatsapp_message,
    is_featured = excluded.is_featured,
    is_published = excluded.is_published,
    sort_order = excluded.sort_order;

insert into public.cq_faq_items(site_id, question, answer, is_published, sort_order)
select site.id, seed.question, seed.answer, true, seed.sort_order
from public.cq_sites site
cross join (values
  ('Como funciona a avaliação?', 'A avaliação considera sua principal queixa, seu histórico, sua rotina e seus objetivos. A partir disso, é definido o protocolo mais adequado.', 10),
  ('Preciso saber qual procedimento quero?', 'Não. A avaliação existe justamente para identificar sua necessidade e explicar quais opções fazem sentido para o seu caso.', 20),
  ('O procedimento pode ser realizado no mesmo dia?', 'Isso depende do procedimento, da avaliação e da disponibilidade da agenda. A clínica confirma essa possibilidade durante o contato pelo WhatsApp.', 30),
  ('Quantas sessões são necessárias?', 'A quantidade de sessões varia conforme o objetivo, o protocolo escolhido e a resposta individual.', 40),
  ('Existem contraindicações?', 'Alguns procedimentos possuem contraindicações específicas. Por isso, informações sobre saúde, medicamentos e histórico devem ser avaliadas antes do atendimento.', 50),
  ('Como faço para agendar?', 'Clique em qualquer botão de WhatsApp, informe sua principal necessidade e consulte os horários disponíveis.', 60)
) as seed(question, answer, sort_order)
where site.slug = 'catarina-queiroz'
and not exists (
  select 1
  from public.cq_faq_items existing
  where existing.site_id = site.id
);

insert into public.cq_tracking_configs(site_id)
select id
from public.cq_sites
where slug = 'catarina-queiroz'
on conflict (site_id) do nothing;
