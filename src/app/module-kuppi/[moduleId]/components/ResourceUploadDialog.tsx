'use client';

import { useState } from 'react';
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
  
  const { user } = useAuth();

  const handleClose = () => {
    if (uploading) return;
    setUploadTitle('');
    setUploadDescription('');
    setUploadFile(null);
    setUploadHasRestriction(false);
    setUploadAllowedDomains([]);
    setUploadError(null);
    onClose();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!user) return setUploadError('Please log in to upload resources.');
    if (!uploadCategoryId) return setUploadError('Please select a category.');
    if (!uploadTitle.trim()) return setUploadError('Please enter a title.');
    if (!uploadFile) return setUploadError('Please choose a file.');

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

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      setUploadHasRestriction(false);
      setUploadAllowedDomains([]);
      onUploadSuccess(data?.message || 'Uploaded successfully.');
      handleClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
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
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              PDF only, max 10 MB
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
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
