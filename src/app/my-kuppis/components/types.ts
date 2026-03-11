export interface Module {
  id: number;
  code: string;
  name: string;
}

export interface Student {
  id: number;
  name: string;
}

export interface Kuppi {
  id: number;
  title: string;
  description: string;
  youtube_links: string[];
  telegram_links: string[] | null;
  gdrive_cloud_video_urls: string[] | null;
  onedrive_cloud_video_urls: string[] | null;
  material_urls: string[] | null;
  is_kuppi: boolean;
  is_hidden: boolean;
  language_code: string;
  created_at: string;
  published_at: string;
  module: Module;
  student: Student | null;
}

export interface EditFormState {
  title: string;
  description: string;
  youtube_links: string[];
  telegram_links: string[];
  gdrive_cloud_video_urls: string[];
  onedrive_cloud_video_urls: string[];
  material_urls: string[];
}

export type LinkCategory = 
  | 'youtube_links' 
  | 'telegram_links' 
  | 'gdrive_cloud_video_urls' 
  | 'onedrive_cloud_video_urls' 
  | 'material_urls';
