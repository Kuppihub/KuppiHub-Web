export interface LinkItem {
  id: string;
  url: string;
}

export interface ModuleSearchResult {
  id: number;
  code: string;
  name: string;
  video_count: number;
}

// Available domain options for access restriction
export const DOMAIN_OPTIONS = [
  { value: '@uom.lk', label: 'University of Moratuwa (@uom.lk)' },
  { value: '@cse.mrt.ac.lk', label: 'CSE Department (@cse.mrt.ac.lk)' },
  { value: '@gmail.com', label: 'Gmail Users (@gmail.com)' }
] as const;

export interface FormData {
  moduleId: number | null;
  moduleCode: string;
  title: string;
  description: string;
  languageCode: string;
  studentName: string;
  studentId: number | null;
  isKuppi: boolean;
  youtubeLinks: LinkItem[];
  telegramLinks: LinkItem[];
  gdriveLinks: LinkItem[];
  onedriveLinks: LinkItem[];
  materialLinks: LinkItem[];
  // Domain restriction fields
  hasRestriction: boolean;
  allowedDomains: string[];
}

// Generate unique ID
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial form state
export const initialFormData: FormData = {
  moduleId: null,
  moduleCode: "",
  title: "",
  description: "",
  languageCode: "si",
  studentName: "",
  studentId: null,
  isKuppi: true,
  youtubeLinks: [{ id: generateId(), url: "" }],
  telegramLinks: [],
  gdriveLinks: [],
  onedriveLinks: [],
  materialLinks: [],
  // Domain restriction defaults
  hasRestriction: false,
  allowedDomains: [],
};

export type LinkCategory = "youtubeLinks" | "telegramLinks" | "gdriveLinks" | "onedriveLinks" | "materialLinks";
