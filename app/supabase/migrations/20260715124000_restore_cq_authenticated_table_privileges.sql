revoke truncate, references, trigger on table
  public.cq_sites,
  public.cq_site_domains,
  public.cq_site_members,
  public.cq_admin_allowlist,
  public.cq_site_settings,
  public.cq_sections,
  public.cq_procedures,
  public.cq_results,
  public.cq_testimonials,
  public.cq_faq_items,
  public.cq_media_files,
  public.cq_tracking_configs,
  public.cq_tracking_events,
  public.cq_content_revisions,
  public.cq_tracking_secrets
from authenticated;

grant select on table
  public.cq_sites,
  public.cq_site_domains,
  public.cq_site_members,
  public.cq_admin_allowlist,
  public.cq_site_settings,
  public.cq_sections,
  public.cq_procedures,
  public.cq_results,
  public.cq_testimonials,
  public.cq_faq_items,
  public.cq_media_files,
  public.cq_tracking_configs,
  public.cq_tracking_events,
  public.cq_content_revisions
  to authenticated;

grant insert, update, delete on table
  public.cq_site_domains,
  public.cq_site_members,
  public.cq_admin_allowlist,
  public.cq_sections,
  public.cq_procedures,
  public.cq_results,
  public.cq_testimonials,
  public.cq_faq_items,
  public.cq_media_files
  to authenticated;

grant update on table
  public.cq_sites,
  public.cq_site_settings,
  public.cq_tracking_configs
  to authenticated;

revoke all on table public.cq_tracking_secrets from anon, authenticated;
