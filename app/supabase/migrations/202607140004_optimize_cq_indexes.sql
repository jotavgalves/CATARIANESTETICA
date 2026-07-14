create index if not exists cq_site_domains_site_id_idx on public.cq_site_domains(site_id);
create index if not exists cq_site_members_user_id_idx on public.cq_site_members(user_id);
create index if not exists cq_faq_items_site_sort_idx on public.cq_faq_items(site_id, sort_order);
create index if not exists cq_media_files_site_created_idx on public.cq_media_files(site_id, created_at desc);
create index if not exists cq_media_files_created_by_idx on public.cq_media_files(created_by) where created_by is not null;
create index if not exists cq_results_site_sort_idx on public.cq_results(site_id, sort_order);
create index if not exists cq_results_procedure_id_idx on public.cq_results(procedure_id) where procedure_id is not null;
create index if not exists cq_testimonials_site_sort_idx on public.cq_testimonials(site_id, sort_order);
create index if not exists cq_testimonials_procedure_id_idx on public.cq_testimonials(procedure_id) where procedure_id is not null;
create index if not exists cq_content_revisions_site_created_idx on public.cq_content_revisions(site_id, created_at desc);
create index if not exists cq_content_revisions_actor_id_idx on public.cq_content_revisions(actor_id) where actor_id is not null;
create index if not exists cq_procedures_site_sort_idx on public.cq_procedures(site_id, sort_order);
create index if not exists cq_sections_site_sort_idx on public.cq_sections(site_id, sort_order);
create index if not exists cq_tracking_events_site_created_idx on public.cq_tracking_events(site_id, created_at desc);

drop policy if exists cq_members_self_select on public.cq_site_members;
drop policy if exists cq_members_owner_all on public.cq_site_members;

create policy cq_members_select
on public.cq_site_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.cq_is_site_member(site_id, array['owner'])
);

create policy cq_members_owner_insert
on public.cq_site_members
for insert
to authenticated
with check (public.cq_is_site_member(site_id, array['owner']));

create policy cq_members_owner_update
on public.cq_site_members
for update
to authenticated
using (public.cq_is_site_member(site_id, array['owner']))
with check (public.cq_is_site_member(site_id, array['owner']));

create policy cq_members_owner_delete
on public.cq_site_members
for delete
to authenticated
using (public.cq_is_site_member(site_id, array['owner']));
