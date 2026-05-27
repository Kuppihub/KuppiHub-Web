'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoCard from '../../components/VideoCard';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';
import { Video } from '../../types/video';
import { useAuth } from '@/contexts/AuthContext';
import { getIdToken } from '@/lib/auth-utils';

type ResourceCategory = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
};

type ResourceFolder = {
  id: number;
  name: string;
  parent_id: number | null;
};

type ResourceItem = {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
};

type ResourceCacheEntry = {
  categories: ResourceCategory[];
  folders: ResourceFolder[];
  resources: ResourceItem[];
};

type PersistedModuleCache = {
  videos: Video[] | null;
  resourcesMap: Array<[string, ResourceCacheEntry]>;
  didLoadCategories: boolean;
  categories: ResourceCategory[];
};

export default function ModuleKuppiPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openVideoIds, setOpenVideoIds] = useState<number[]>([]);

  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeParentFolderId, setActiveParentFolderId] = useState<number | null>(null);
  const [folderTrail, setFolderTrail] = useState<{ id: number; name: string }[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategoryId, setUploadCategoryId] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [activeDirectory, setActiveDirectory] = useState<'root' | 'kuppi' | 'resource'>('root');
  const [didLoadCategories, setDidLoadCategories] = useState(false);

  const videosCacheRef = useRef<Video[] | null>(null);
  const resourcesCacheRef = useRef<Map<string, ResourceCacheEntry>>(new Map());
  const entryPathRef = useRef<string>('/modules');

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const moduleId = params.moduleId as string;
  const { user } = useAuth();
  const storageKey = `module-kuppi-cache:${moduleId}:${user?.uid ?? 'guest'}`;

  useEffect(() => {
    if (!moduleId || typeof window === 'undefined') return;
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PersistedModuleCache;
      videosCacheRef.current = parsed.videos || null;
      resourcesCacheRef.current = new Map(parsed.resourcesMap || []);
      if (parsed.videos) setVideos(parsed.videos);
      if (parsed.categories?.length) setCategories(parsed.categories);
      if (parsed.didLoadCategories) {
        setDidLoadCategories(true);
        setResourcesLoading(false);
      }
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }, [storageKey, moduleId]);

  useEffect(() => {
    if (!moduleId || typeof window === 'undefined') return;
    const payload: PersistedModuleCache = {
      videos: videosCacheRef.current,
      resourcesMap: Array.from(resourcesCacheRef.current.entries()),
      didLoadCategories,
      categories,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
  }, [storageKey, moduleId, didLoadCategories, categories, videos, folders, resources]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = document.referrer;
    if (!ref) return;

    try {
      const refUrl = new URL(ref);
      const sameOrigin = refUrl.origin === window.location.origin;
      const isSamePage = refUrl.pathname === window.location.pathname;
      if (sameOrigin && !isSamePage) {
        entryPathRef.current = `${refUrl.pathname}${refUrl.search}`;
      }
    } catch {
      entryPathRef.current = '/modules';
    }
  }, []);

  const syncExplorerUrl = useCallback(
    (next: { view: 'root' | 'kuppi' | 'resource'; categoryId?: number | null; folderId?: number | null }) => {
      const qs = new URLSearchParams(searchParams.toString());
      qs.set('view', next.view);
      if (next.categoryId) qs.set('category', String(next.categoryId));
      else qs.delete('category');
      if (next.folderId) qs.set('folder', String(next.folderId));
      else qs.delete('folder');
      router.push(`/module-kuppi/${moduleId}?${qs.toString()}`);
    },
    [router, moduleId, searchParams]
  );

  const fetchVideos = useCallback(async () => {
    if (!moduleId) return;
    if (videosCacheRef.current) {
      setVideos(videosCacheRef.current);
      return;
    }

    setVideosLoading(true);
    try {
      const emailParam = user?.email ? `&userEmail=${encodeURIComponent(user.email)}` : '';
      const res = await fetch(`/api/kuppis?moduleId=${moduleId}${emailParam}`);
      if (!res.ok) throw new Error('Failed to fetch videos');
      const data: Video[] = await res.json();
      videosCacheRef.current = data;
      setVideos(data);
      setOpenVideoIds([]);
    } catch {
      setError('Failed to load videos');
    } finally {
      setVideosLoading(false);
    }
  }, [moduleId, user]);

  const fetchResources = useCallback(async () => {
    if (!moduleId) return;

    const cacheKey = `${moduleId}:${activeCategoryId ?? 'none'}:${activeParentFolderId ?? 'root'}`;
    const cached = resourcesCacheRef.current.get(cacheKey);
    if (cached) {
      setCategories(cached.categories);
      setFolders(cached.folders);
      setResources(cached.resources);
      setResourcesLoading(false);
      return;
    }

    setResourcesLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('moduleId', moduleId);
      if (activeCategoryId !== null) qs.set('categoryId', String(activeCategoryId));
      if (activeParentFolderId !== null) qs.set('parentFolderId', String(activeParentFolderId));

      const token = await getIdToken(user);
      if (!token) {
        setResourcesLoading(false);
        return;
      }

      const res = await fetch(`/api/module-resources?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load resources');

      const data = await res.json();
      const nextEntry: ResourceCacheEntry = {
        categories: data.categories || [],
        folders: data.folders || [],
        resources: data.resources || [],
      };
      resourcesCacheRef.current.set(cacheKey, nextEntry);
      setCategories(nextEntry.categories);
      setFolders(nextEntry.folders);
      setResources(nextEntry.resources);

      if (activeCategoryId === null && data.activeCategoryId) {
        setActiveCategoryId(data.activeCategoryId);
      }
      if (uploadCategoryId === null && data.activeCategoryId) {
        setUploadCategoryId(data.activeCategoryId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResourcesLoading(false);
    }
  }, [moduleId, activeCategoryId, activeParentFolderId, user, uploadCategoryId]);

  useEffect(() => {
    if (activeDirectory !== 'resource') return;
    fetchResources();
  }, [activeDirectory, fetchResources]);

  useEffect(() => {
    if (!didLoadCategories) return;
    if (activeDirectory !== 'kuppi') return;
    fetchVideos();
  }, [activeDirectory, didLoadCategories, fetchVideos]);

  useEffect(() => {
    if (didLoadCategories || !moduleId || !user) return;
    fetchResources().finally(() => setDidLoadCategories(true));
  }, [didLoadCategories, moduleId, user, fetchResources]);

  useEffect(() => {
    if (!didLoadCategories) return;

    const viewParam = searchParams.get('view');
    const categoryParam = searchParams.get('category');
    const folderParam = searchParams.get('folder');

    if (viewParam === 'kuppi') {
      setActiveDirectory('kuppi');
      return;
    }

    if (viewParam === 'resource') {
      const categoryId = categoryParam ? Number(categoryParam) : null;
      const folderId = folderParam ? Number(folderParam) : null;
      setActiveDirectory('resource');
      if (categoryId && !Number.isNaN(categoryId)) {
        setActiveCategoryId(categoryId);
        setUploadCategoryId(categoryId);
      }
      setActiveParentFolderId(folderId && !Number.isNaN(folderId) ? folderId : null);
      return;
    }

    setActiveDirectory('root');
    setActiveParentFolderId(null);
    setFolderTrail([]);
  }, [searchParams, didLoadCategories]);

  const handleBack = () => router.push(entryPathRef.current);
  const handleToggleVideo = (id: number) => {
    setOpenVideoIds((prev) => (
      prev.includes(id) ? prev.filter((videoId) => videoId !== id) : [...prev, id]
    ));
  };

  const getReferenceDate = (video: Video) => video.published_at ?? video.created_at;
  const getReferenceTimestamp = (video: Video) => {
    const referenceDate = getReferenceDate(video);
    if (!referenceDate) return 0;
    const parsed = Date.parse(referenceDate);
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  const getReferenceYear = (video: Video) => {
    const referenceDate = getReferenceDate(video);
    if (referenceDate && !Number.isNaN(Date.parse(referenceDate))) {
      return new Date(referenceDate).getFullYear().toString();
    }
    return 'Unknown Year';
  };

  const videosByYear = videos
    .slice()
    .sort((a, b) => getReferenceTimestamp(b) - getReferenceTimestamp(a))
    .reduce((acc, video) => {
      const year = getReferenceYear(video);
      if (!acc[year]) acc[year] = [];
      acc[year].push(video);
      return acc;
    }, {} as Record<string, Video[]>);

  const sortedYears = Object.keys(videosByYear).sort((a, b) => {
    if (a === 'Unknown Year') return 1;
    if (b === 'Unknown Year') return -1;
    return Number(b) - Number(a);
  });

  const openFolder = (folder: ResourceFolder) => {
    setFolders([]);
    setResources([]);
    setResourcesLoading(true);
    setFolderTrail((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setActiveParentFolderId(folder.id);
    syncExplorerUrl({ view: 'resource', categoryId: activeCategoryId, folderId: folder.id });
  };

  const goToFolderTrail = (index: number) => {
    setFolders([]);
    setResources([]);
    setResourcesLoading(true);
    const nextTrail = folderTrail.slice(0, index + 1);
    setFolderTrail(nextTrail);
    const nextFolderId = nextTrail[nextTrail.length - 1]?.id ?? null;
    setActiveParentFolderId(nextFolderId);
    syncExplorerUrl({ view: 'resource', categoryId: activeCategoryId, folderId: nextFolderId });
  };

  const enterResourceCategory = (categoryId: number) => {
    setFolders([]);
    setResources([]);
    setResourcesLoading(true);
    setActiveDirectory('resource');
    setActiveCategoryId(categoryId);
    setUploadCategoryId(categoryId);
    setActiveParentFolderId(null);
    setFolderTrail([]);
    syncExplorerUrl({ view: 'resource', categoryId, folderId: null });
  };

  const goToRoot = () => {
    setActiveDirectory('root');
    setActiveParentFolderId(null);
    setFolderTrail([]);
    syncExplorerUrl({ view: 'root', categoryId: null, folderId: null });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadMessage(null);

    if (!user) return setUploadError('Please log in to upload resources.');
    if (!uploadCategoryId) return setUploadError('Please select a category.');
    if (!uploadTitle.trim()) return setUploadError('Please enter a title.');
    if (!uploadFile) return setUploadError('Please choose a file.');

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
      fd.append('is_public', 'true');
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
      setUploadDialogOpen(false);
      setUploadMessage(data?.message || 'Uploaded successfully.');
      resourcesCacheRef.current.clear();
      await fetchResources();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getActiveCategoryName = () => (
    categories.find((c) => c.id === activeCategoryId)?.name || 'Resource'
  );

  const getAddButtonLabel = () => {
    const name = getActiveCategoryName();
    if (name.toLowerCase().includes('past paper answers')) return 'Add Past Paper Answer';
    if (name.toLowerCase().includes('past papers')) return 'Add Past Paper';
    if (name.toLowerCase().includes('lecture')) return 'Add Lecture Slide';
    if (name.toLowerCase().includes('short notes')) return 'Add Short Note';
    return `Add ${name}`;
  };

  const getCategoryNotice = () => {
    const name = getActiveCategoryName().toLowerCase();
    if (name.includes('lecture')) {
      return {
        severity: 'warning' as const,
        text: 'Please share lecture slides only with lecturer approval.',
      };
    }
    if (name.includes('past paper')) {
      return {
        severity: 'info' as const,
        text: 'Upload only materials that are allowed to be shared publicly for student learning.',
      };
    }
    return {
      severity: 'info' as const,
      text: 'Please upload only content you are permitted to share publicly.',
    };
  };

  const orderedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);

  if (!didLoadCategories && resourcesLoading) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={22} />
          <Typography color="primary">Loading module content...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Box className="max-w-7xl mx-auto space-y-8">
        <BackButton onClick={handleBack} className="mb-2" />
        <PageHeader title="Module Content" subtitle="Open a directory to view kuppi videos or study resources" />

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #dbeafe', background: 'rgba(255,255,255,0.9)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>Directory</Typography>
            {activeDirectory === 'kuppi' ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" onClick={goToRoot}>Back To Root</Button>
                <Button variant="contained" onClick={() => router.push('/add-kuppi')}>
                  Add Kuppi
                </Button>
              </Stack>
            ) : activeDirectory === 'resource' ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" onClick={goToRoot}>Back To Root</Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setUploadCategoryId(activeCategoryId);
                    setUploadDialogOpen(true);
                  }}
                >
                  {getAddButtonLabel()}
                </Button>
              </Stack>
            ) : null}
          </Stack>

          <Breadcrumbs sx={{ mb: 3 }}>
            <Link component="button" underline="hover" onClick={goToRoot}>Root</Link>
            {activeDirectory === 'kuppi' ? (
              <Typography color="text.primary">Kuppi</Typography>
            ) : null}
            {activeDirectory === 'resource' ? (
              <Typography color="text.primary">{categories.find((c) => c.id === activeCategoryId)?.name || 'Resources'}</Typography>
            ) : null}
            {activeDirectory === 'resource' && folderTrail.map((entry, idx) => (
              <Link
                key={entry.id}
                component="button"
                underline="hover"
                onClick={() => goToFolderTrail(idx)}
              >
                {entry.name}
              </Link>
            ))}
          </Breadcrumbs>

          {activeDirectory === 'root' ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined">
                  <CardActionArea onClick={async () => {
                    setActiveDirectory('kuppi');
                    setOpenVideoIds([]);
                    syncExplorerUrl({ view: 'kuppi', categoryId: null, folderId: null });
                    await fetchVideos();
                  }}>
                    <CardContent>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                        <VideoLibraryIcon color="primary" />
                        <Typography variant="h6">Kuppi</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        View all kuppi videos for this module.
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>

              {orderedCategories.map((category) => (
                <Grid key={category.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant="outlined">
                    <CardActionArea onClick={() => enterResourceCategory(category.id)}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                          <FolderIcon color="warning" />
                          <Typography variant="h6">{category.name}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Open folder and view files.
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : null}

          {activeDirectory === 'kuppi' ? (
            <Stack spacing={2}>
              {videosLoading ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography>Loading videos...</Typography>
                </Stack>
              ) : videos.length === 0 ? (
                <EmptyState />
              ) : (
                <Stack spacing={4}>
                  {sortedYears.map((year) => (
                    <Paper key={year} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{year}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {videosByYear[year].length} videos
                        </Typography>
                      </Stack>
                      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {videosByYear[year].map((video) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            moduleId={moduleId}
                            isActive={openVideoIds.includes(video.id)}
                            onToggle={handleToggleVideo}
                          />
                        ))}
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          ) : null}

          {activeDirectory === 'resource' ? (
            <Stack spacing={2}>
              <Alert severity={getCategoryNotice().severity}>
                {getCategoryNotice().text}
              </Alert>

              {uploadMessage ? <Alert severity="success">{uploadMessage}</Alert> : null}
              {uploadError ? <Alert severity="error">{uploadError}</Alert> : null}

              {resourcesLoading ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography>Loading resources...</Typography>
                </Stack>
              ) : null}

              {!resourcesLoading && folders.length === 0 && resources.length === 0 ? (
                <Typography color="text.secondary">No resources found in this folder.</Typography>
              ) : null}

              <Stack spacing={1.5}>
                {folders.map((folder) => (
                  <Card key={folder.id} variant="outlined">
                    <CardActionArea onClick={() => openFolder(folder)}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <FolderIcon color="warning" />
                          <Typography fontWeight={600}>{folder.name}</Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}

                {resources.map((resource) => (
                  <Card key={resource.id} variant="outlined">
                    <CardActionArea component="a" href={resource.file_url} target="_blank" rel="noreferrer">
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <DescriptionIcon color="primary" />
                          <Box>
                            <Typography fontWeight={600}>{resource.title}</Typography>
                            {resource.description ? (
                              <Typography variant="body2" color="text.secondary">{resource.description}</Typography>
                            ) : null}
                            <Typography variant="caption" color="primary">Open / Download</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>

              <Dialog
                open={uploadDialogOpen}
                onClose={() => (uploading ? null : setUploadDialogOpen(false))}
                fullWidth
                maxWidth="sm"
              >
                <DialogTitle>{getAddButtonLabel()}</DialogTitle>
                <Box component="form" onSubmit={handleUpload}>
                  <DialogContent>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Category"
                        value={getActiveCategoryName()}
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
                      <Typography variant="caption" color="text.secondary">
                        PDF only, max 10 MB
                      </Typography>
                    </Stack>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </DialogActions>
                </Box>
              </Dialog>
            </Stack>
          ) : null}
        </Paper>
      </Box>
    </Box>
  );
}
