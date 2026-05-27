import { useState, useEffect } from 'react';
import Script from 'next/script';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import { useAuth } from '@/contexts/AuthContext';
import { getIdToken } from '@/lib/auth-utils';
import { DOMAIN_OPTIONS } from '../../../add-kuppi/components/types';

interface ResourceUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: (message: string) => void;
  onUploadError?: (message: string) => void;
  moduleId: string;
  uploadCategoryId: number | null;
  categoryName: string;
  addButtonLabel: string;
  activeParentFolderId: number | null;
}

export default function ResourceUploadDialog({
  open,
  onClose,
  onUploadSuccess,
  onUploadError,
  moduleId,
  uploadCategoryId,
  categoryName,
  addButtonLabel,
  activeParentFolderId,
}: ResourceUploadDialogProps) {
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadHasRestriction, setUploadHasRestriction] = useState(false);
  const [uploadAllowedDomains, setUploadAllowedDomains] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  
  const { user } = useAuth();

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    // Define callbacks on window
    (window as any).onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };
    (window as any).onTurnstileExpire = () => {
      setTurnstileToken('');
    };
    (window as any).onTurnstileError = () => {
      setTurnstileToken('');
    };

    // Force Turnstile to scan the dynamically inserted DOM element
    const triggerImplicitRender = () => {
      const turnstile = (window as any).turnstile;
      if (turnstile && typeof turnstile.implicitRender === 'function') {
        try {
          const container = document.getElementById('dialog-turnstile-container');
          if (container) {
            // Restore standard class and attributes
            const sitekey = typeof process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === 'string' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
              ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
              : '1x00000000000000000000AA';

            container.innerHTML = `
              <div 
                class="cf-turnstile" 
                data-sitekey="${sitekey}"
                data-callback="onTurnstileSuccess"
                data-expired-callback="onTurnstileExpire"
                data-error-callback="onTurnstileError"
              ></div>
            `;
            turnstile.implicitRender();
          }
        } catch (e) {
          console.error("Turnstile implicitRender error:", e);
        }
      }
    };

    const timer = setTimeout(() => {
      triggerImplicitRender();
    }, 150);

    return () => {
      clearTimeout(timer);
      delete (window as any).onTurnstileSuccess;
      delete (window as any).onTurnstileExpire;
      delete (window as any).onTurnstileError;
    };
  }, [open]);

  const handleClose = () => {
    if (uploading) return;
    setUploadTitle('');
    setUploadDescription('');
    setUploadFile(null);
    setUploadHasRestriction(false);
    setUploadAllowedDomains([]);
    setUploadError(null);
    setTurnstileToken('');
    onClose();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!user) return setUploadError('Please log in to upload resources.');
    if (!uploadCategoryId) return setUploadError('Please select a category.');
    if (!uploadTitle.trim()) return setUploadError('Please enter a title.');
    if (!uploadFile) return setUploadError('Please choose a file.');
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
    if (uploadFile.size > MAX_FILE_SIZE) {
      return setUploadError('File is too large. The maximum size allowed is 4 MB.');
    }
    if (!turnstileToken) return setUploadError('Please complete the Cloudflare Turnstile verification.');

    if (uploadHasRestriction && uploadAllowedDomains.length === 0) {
      return setUploadError('Please select at least one email domain or disable the restriction.');
    }

    setUploading(true);
    try {
      const token = await getIdToken(user);
      if (!token) return setUploadError('Failed to authenticate upload request.');

      const fd = new FormData();
      fd.append('module_id', moduleId);
      fd.append('category_id', String(uploadCategoryId));
      fd.append('folder_id', activeParentFolderId === null ? '' : String(activeParentFolderId));
      fd.append('title', uploadTitle.trim());
      fd.append('description', uploadDescription.trim());
      fd.append('is_public', uploadHasRestriction ? 'false' : 'true');
      fd.append('turnstileToken', turnstileToken);
      
      if (uploadHasRestriction) {
        uploadAllowedDomains.forEach((domain) => {
          fd.append('allowed_domains', domain);
        });
      }
      
      fd.append('file', uploadFile);

      const res = await fetch('/api/module-resources/upload-discord', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      let data: any = {};
      const resText = await res.text();
      try {
        data = JSON.parse(resText);
      } catch {
        // If the server returns a 500 HTML or 413 Payload Too Large HTML page
        throw new Error(resText.substring(0, 100) || 'Upload failed due to a server error.');
      }
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      setUploadHasRestriction(false);
      setUploadAllowedDomains([]);
      setTurnstileToken('');
      onUploadSuccess(data?.message || 'Uploaded successfully.');
      handleClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <DialogTitle>{addButtonLabel}</DialogTitle>
      <Box component="form" onSubmit={handleUpload}>
        <DialogContent>
          <Stack spacing={2}>
            {uploadError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {uploadError}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Category"
              value={categoryName}
              InputProps={{ readOnly: true }}
            />
            <TextField
              fullWidth
              label="Title"
              placeholder="Enter title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
            />
            <TextField
              fullWidth
              label="Description"
              placeholder="Optional"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
            />
            
            <Button variant="outlined" component="label" fullWidth>
              {uploadFile ? `Selected: ${uploadFile.name}` : 'Choose File'}
              <input
                type="file"
                accept="application/pdf,.pdf,application/zip,.zip,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                hidden
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              PDF, ZIP, Word Docs only, max 4 MB
            </Typography>

            {/* Access Restriction Option */}
            <Box 
              sx={{ 
                border: "1px solid",
                borderColor: uploadHasRestriction ? "primary.main" : "grey.300",
                borderRadius: 2,
                p: 2,
                bgcolor: uploadHasRestriction ? "rgba(102, 126, 234, 0.04)" : "transparent",
                transition: "all 0.2s ease",
                mt: 1,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadHasRestriction}
                    onChange={(e) => {
                      setUploadHasRestriction(e.target.checked);
                      if (!e.target.checked) {
                        setUploadAllowedDomains([]);
                      }
                    }}
                    sx={{ color: "primary.main" }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {uploadHasRestriction ? (
                      <LockIcon sx={{ fontSize: 20, color: "primary.main" }} />
                    ) : (
                      <PublicIcon sx={{ fontSize: 20, color: "grey.500" }} />
                    )}
                    <Typography 
                      sx={{ 
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        color: uploadHasRestriction ? "primary.main" : "grey.700"
                      }}
                    >
                      Restrict access to specific email domains
                    </Typography>
                  </Box>
                }
              />
              
              {uploadHasRestriction && (
                <Box sx={{ mt: 1.5, pl: 3.5 }}>
                  <Typography 
                    sx={{ 
                      fontSize: "0.8rem", 
                      color: "grey.600",
                      mb: 1 
                    }}
                  >
                    Select which email domains can view this resource:
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {DOMAIN_OPTIONS.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        control={
                          <Checkbox
                            size="small"
                            checked={uploadAllowedDomains.includes(option.value)}
                            onChange={(e) => {
                              const newDomains = e.target.checked
                                ? [...uploadAllowedDomains, option.value]
                                : uploadAllowedDomains.filter(d => d !== option.value);
                              setUploadAllowedDomains(newDomains);
                            }}
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: "0.85rem" }}>
                            {option.label}
                          </Typography>
                        }
                      />
                    ))}
                  </Box>

                  {uploadAllowedDomains.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography 
                        sx={{ 
                          fontSize: "0.75rem", 
                          color: "grey.500",
                          mb: 1 
                        }}
                      >
                        Selected domains:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {uploadAllowedDomains.map((domain) => (
                          <Chip
                            key={domain}
                            label={domain}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => {
                              setUploadAllowedDomains(uploadAllowedDomains.filter(d => d !== domain));
                            }}
                            sx={{ fontSize: "0.75rem" }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {uploadAllowedDomains.length === 0 && (
                    <Typography 
                      sx={{ 
                        fontSize: "0.75rem", 
                        color: "warning.main",
                        mt: 1,
                        fontStyle: "italic"
                      }}
                    >
                      Please select at least one domain.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            {/* Cloudflare Turnstile Verification */}
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
              <div id="dialog-turnstile-container">
                <div
                  className="cf-turnstile"
                  data-sitekey={
                    typeof process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === 'string' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
                      ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
                      : '1x00000000000000000000AA'
                  }
                  data-callback="onTurnstileSuccess"
                  data-expired-callback="onTurnstileExpire"
                  data-error-callback="onTurnstileError"
                ></div>
              </div>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={uploading || !turnstileToken}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
