// types/video.ts
export interface Video {
  id: number;
  title: string;
  youtube_links: string[];
  telegram_links?: string[];
  material_urls?: string[];
  onedrive_cloud_video_urls?: string[];
  gdrive_cloud_video_urls?: string[];
  is_kuppi?: boolean;
  description?: string;
  language_code?: string;
  created_at?: string;
  published_at?: string;
  allowed_domains?: string[]; // e.g., ['@uom.lk', '@cse.mrt.ac.lk'] - null means public
  owner?: {
    name: string;
    department?: {
      name: string;
    };
  };
}
