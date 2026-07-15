export type JsonObject = Record<string, unknown>;

export interface SiteRecord {
  id: string;
  slug: string;
  name: string;
  default_domain: string | null;
  status: "draft" | "active" | "archived";
}

export interface SiteSettings {
  site_id?: string;
  logo_url: string;
  favicon_url: string;
  professional_name: string;
  professional_title: string;
  whatsapp: string;
  phone: string;
  email: string;
  instagram_url: string;
  address_line: string;
  city: string;
  state: string;
  maps_url: string;
  opening_hours: string;
  seo_title: string;
  seo_description: string;
  footer_text: string;
  hero: JsonObject;
  theme: JsonObject;
}

export interface SectionRecord {
  id: string;
  site_id?: string;
  section_key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  content: JsonObject;
  is_enabled: boolean;
  sort_order: number;
  status: "draft" | "published" | "archived";
}

export interface ProcedureRecord {
  id: string;
  site_id?: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  full_description: string;
  image_url: string;
  indications: unknown[];
  benefits: unknown[];
  contraindications: string;
  duration: string;
  session_estimate: string;
  whatsapp_message: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface ResultRecord {
  id: string;
  site_id?: string;
  procedure_id: string | null;
  procedure_name?: string | null;
  title: string;
  summary: string;
  before_image_url: string;
  after_image_url: string;
  body_area: string;
  sessions: string;
  treatment_period: string;
  testimonial_text: string;
  client_display_name: string;
  consent_confirmed?: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface TestimonialRecord {
  id: string;
  site_id?: string;
  procedure_id: string | null;
  procedure_name?: string | null;
  client_display_name: string;
  photo_url: string;
  testimonial_text: string;
  rating: number;
  source_name: string;
  source_url: string;
  consent_confirmed?: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface FaqRecord {
  id: string;
  site_id?: string;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
}

export interface TrackingConfig {
  site_id?: string;
  consent_mode: "required" | "informational" | "disabled";
  meta_pixel_id: string;
  meta_browser_enabled: boolean;
  meta_server_enabled: boolean;
  ga4_measurement_id: string;
  ga4_browser_enabled: boolean;
  ga4_server_enabled: boolean;
  google_ads_conversion_id: string;
  google_ads_conversion_label: string;
  google_ads_browser_enabled: boolean;
  google_ads_server_enabled: boolean;
}

export interface MediaVariantRecord {
  id: string;
  site_id: string;
  media_id: string;
  slot_key: string;
  storage_path: string;
  public_url: string;
  width: number;
  height: number;
  mime_type: string;
  size_bytes: number;
  crop: JsonObject;
  created_at: string;
}

export interface MediaRecord {
  id: string;
  site_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  category: string;
  media_kind: "photo" | "logo" | "favicon" | "graphic";
  width: number;
  height: number;
  aspect_ratio: number;
  checksum: string;
  deleted_at: string | null;
  created_at: string;
  variants: MediaVariantRecord[];
}

export interface MediaUsageReference {
  area: string;
  label: string;
  field: string;
  record_id: string;
}

export interface PublicMediaAssets {
  favicon: Record<string, string>;
}

export interface PublicSitePayload {
  site: SiteRecord;
  settings: SiteSettings;
  media_assets?: PublicMediaAssets;
  sections: SectionRecord[];
  procedures: ProcedureRecord[];
  results: ResultRecord[];
  testimonials: TestimonialRecord[];
  faq: FaqRecord[];
  tracking: TrackingConfig;
}

export interface AdminData extends PublicSitePayload {
  media: MediaRecord[];
}

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export type AnalyticsEventName =
  | "page_view"
  | "view_procedure"
  | "view_result"
  | "click_whatsapp"
  | "click_phone"
  | "click_instagram"
  | "click_map"
  | "start_contact"
  | "submit_lead"
  | "schedule_requested"
  | "appointment_confirmed";
