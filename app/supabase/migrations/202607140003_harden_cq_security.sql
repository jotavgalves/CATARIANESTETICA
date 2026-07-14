create or replace function public.cq_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.cq_attach_allowlisted_user() from public, anon, authenticated;

revoke all on function public.cq_is_site_member(uuid, text[]) from public, anon;
grant execute on function public.cq_is_site_member(uuid, text[]) to authenticated;

revoke all on function public.cq_get_public_site(text) from public;
grant execute on function public.cq_get_public_site(text) to anon, authenticated;

-- Public bucket URLs do not require a broad SELECT policy. Removing this
-- prevents clients from listing every object in the bucket.
drop policy if exists cq_media_public_read on storage.objects;
