"use client";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TelegramIcon from "@mui/icons-material/Telegram";
import CloudIcon from "@mui/icons-material/Cloud";
import FolderIcon from "@mui/icons-material/Folder";
import { validateLinkUrl } from "@/lib/validation";
import { LinkItem } from "./types";

interface LinkSectionProps {
  type: "youtube" | "telegram" | "gdrive" | "onedrive" | "material";
  links: LinkItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, url: string) => void;
}

function GoogleDriveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

const config = {
  youtube: {
    title: "YouTube Links",
    icon: YouTubeIcon,
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fecaca",
    placeholder: "https://www.youtube.com/watch?v=...",
  },
  telegram: {
    title: "Telegram Links",
    icon: TelegramIcon,
    color: "#0088cc",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    placeholder: "https://t.me/...",
  },
  gdrive: {
    title: "Google Drive Links",
    icon: CloudIcon,
    color: "#16a34a",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    placeholder: "https://drive.google.com/...",
  },
  onedrive: {
    title: "OneDrive Links",
    icon: CloudIcon,
    color: "#0078d4",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    placeholder: "https://onedrive.live.com/...",
  },
  material: {
    title: "Material Links (PDF, Docs)",
    icon: FolderIcon,
    color: "#6b7280",
    bgColor: "#f9fafb",
    borderColor: "#e5e7eb",
    placeholder: "Direct link to PDF or document",
  },
};

export default function LinkSection({
  type,
  links,
  onAdd,
  onRemove,
  onUpdate,
}: LinkSectionProps) {
  const { title, icon: Icon, color, bgColor, borderColor, placeholder } = config[type];
  const isGoogleDrive = type === "gdrive";

  const handleUrlChange = (id: string, value: string) => {
    const validation = validateLinkUrl(value);
    if (validation.valid) {
      onUpdate(id, value);
    }
    // If invalid, we don't update the value, silently reject the invalid characters
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isGoogleDrive ? (
            <GoogleDriveIcon className="w-[18px] h-[16px] sm:w-[22px] sm:h-[20px]" />
          ) : (
            <Icon sx={{ color, fontSize: { xs: 18, sm: 22 } }} />
          )}
          <span className="font-medium text-gray-800 text-sm sm:text-base">{title}</span>
        </div>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: { xs: 14, sm: 18 } }} />}
          onClick={onAdd}
          sx={{
            textTransform: "none",
            color,
            fontSize: { xs: "0.7rem", sm: "0.8rem" },
            minWidth: "auto",
            px: { xs: 1, sm: 1.5 },
            "&:hover": {
              backgroundColor: `${color}15`,
            },
          }}
        >
          Add
        </Button>
      </div>
      
      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="text-xs sm:text-sm text-gray-500 italic py-2">
            No links added yet. Click &quot;Add&quot; to add one.
          </p>
        ) : (
          links.map((link, index) => (
            <div key={link.id} className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs text-gray-400 w-5 sm:w-6 flex-shrink-0">{index + 1}.</span>
              <TextField
                fullWidth
                size="small"
                value={link.url}
                onChange={(e) => handleUrlChange(link.id, e.target.value)}
                placeholder={placeholder}
                helperText="Links cannot contain double quotes or commas"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "white",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: { xs: 1, sm: 1.25 },
                    px: { xs: 1.5, sm: 2 },
                  },
                }}
              />
              <IconButton
                size="small"
                onClick={() => onRemove(link.id)}
                sx={{
                  color: "#ef4444",
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  "&:hover": { backgroundColor: "#fee2e2" },
                }}
              >
                <DeleteIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </div>
          ))
        )}
      </div>
    </Paper>
  );
}
