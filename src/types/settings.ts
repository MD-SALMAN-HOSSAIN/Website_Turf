export interface SiteConfig {
  id: string;
  siteName: string;
  tagline: string | null;
  noticeText: string | null;
  noticeEnabled: boolean;
  address: string | null;
  phone: string | null;
  emergencyPhone: string | null;
  email: string | null;
  openingTime: string;
  closingTime: string;
  mapsUrl: string | null;
  facebookUrl: string | null;
  heroVideoUrl: string | null;
}

export interface NoticeBarData {
  text: string | null;
  enabled: boolean;
}

export interface HeaderData {
  siteName: string;
}

export interface FooterData {
  siteName: string;
  openingTime: string;
  closingTime: string;
  address: string | null;
  phone: string | null;
  emergencyPhone: string | null;
  email: string | null;
  mapsUrl: string | null;
}

export type SiteConfigInput = Omit<SiteConfig, "id">;
