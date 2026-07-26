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
  Select,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import DescriptionIcon from '@mui/icons-material/Description';
import VideoCard from '../../components/VideoCard';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';
import Preloader from '../../components/Preloader';
import { Video } from '../../types/video';
import { useAuth } from '@/contexts/AuthContext';
import { getIdToken } from '@/lib/auth-utils';
import { checkAndManageCacheExpiration, forceExpireCache } from '@/lib/cache-utils';
import ResourceUploadDialog from './components/ResourceUploadDialog';
import { blurFromSm, finePointerHover, glassCardSx, glassPanelSx, glassYearPanelSx } from '@/lib/mobile-safe-glass';


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
  categoryCounts?: Record<number, number>;
  moduleTitle?: string;
};

export default function ModuleKuppiPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openVideoIds, setOpenVideoIds] = useState<number[]>([]);

  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number>>({});
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeParentFolderId, setActiveParentFolderId] = useState<number | null>(null);
  const [folderTrail, setFolderTrail] = useState<{ id: number; name: string }[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const [uploadCategoryId, setUploadCategoryId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState<string>('');

  const [activeDirectory, setActiveDirectory] = useState<'root' | 'kuppi' | 'resource'>('root');
  const [didLoadCategories, setDidLoadCategories] = useState(false);

  const videosCacheRef = useRef<Video[] | null>(null);
  const resourcesCacheRef = useRef<Map<string, ResourceCacheEntry>>(new Map());
  const entryPathRef = useRef<string>('/modules');

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const moduleId = params.moduleId as string;
  const { user, loading: authLoading } = useAuth();
  const storageKey = `module-kuppi-cache:${moduleId}:${user?.uid ?? 'guest'}`;

  useEffect(() => {
    if (!moduleId || typeof window === 'undefined') return;
    checkAndManageCacheExpiration();
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PersistedModuleCache;
      videosCacheRef.current = parsed.videos || null;
      resourcesCacheRef.current = new Map(parsed.resourcesMap || []);
      if (parsed.videos) setVideos(parsed.videos);
      if (parsed.categories?.length) setCategories(parsed.categories);
      if (parsed.categoryCounts) setCategoryCounts(parsed.categoryCounts);
      if (parsed.moduleTitle) setModuleTitle(parsed.moduleTitle);
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
      categoryCounts,
      moduleTitle,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
  }, [storageKey, moduleId, didLoadCategories, categories, categoryCounts, videos, folders, resources, moduleTitle]);

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
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/module-resources?${qs.toString()}`, {
        headers,
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
      if (data.categoryCounts && typeof data.categoryCounts === 'object') {
        setCategoryCounts(data.categoryCounts);
      }

      if (data.moduleCode && data.moduleName) {
        setModuleTitle(`${data.moduleCode} - ${data.moduleName}`);
      }

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
    if (activeDirectory !== 'kuppi' && activeDirectory !== 'root') return;
    fetchVideos();
  }, [activeDirectory, didLoadCategories, fetchVideos]);

  const prevUserUidRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    const currentUid = user?.uid;
    if (prevUserUidRef.current !== undefined && prevUserUidRef.current !== currentUid) {
      videosCacheRef.current = null;
      resourcesCacheRef.current = new Map();
      setDidLoadCategories(false);
      setVideos([]);
      setCategories([]);
      setCategoryCounts({});
      setFolders([]);
      setResources([]);
      setResourcesLoading(true);
    }
    prevUserUidRef.current = currentUid;
  }, [user, authLoading]);

  useEffect(() => {
    if (didLoadCategories || !moduleId || authLoading) return;
    fetchResources().finally(() => setDidLoadCategories(true));
  }, [didLoadCategories, moduleId, authLoading, fetchResources]);

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
  const handleToggleVideo = useCallback((id: number) => {
    setOpenVideoIds((prev) => (
      prev.includes(id) ? prev.filter((videoId) => videoId !== id) : [...prev, id]
    ));
  }, []);

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
    return <Preloader />;
  }

  if (error) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen py-6 sm:py-12 px-0 sm:px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Box className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <Box sx={{ px: { xs: 2, sm: 0 } }}>
          <BackButton onClick={handleBack} className="mb-2" />
          <PageHeader title={moduleTitle || "Module Content"} />
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderRadius: { xs: 0, sm: 4 }, 
            borderLeft: { xs: 'none', sm: '1px solid rgba(255, 255, 255, 0.4)' },
            borderRight: { xs: 'none', sm: '1px solid rgba(255, 255, 255, 0.4)' },
            borderTop: '1px solid rgba(255, 255, 255, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
            ...glassPanelSx,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700}>Directory</Typography>
            {activeDirectory === 'kuppi' ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="outlined"
                  onClick={goToRoot}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    width: { xs: '100%', sm: 'auto' },
                    textTransform: "none",
                    fontWeight: 700,
                    background: { xs: "rgba(255, 255, 255, 0.92)", sm: "rgba(255, 255, 255, 0.15)" },
                    ...blurFromSm("blur(10px)"),
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    boxShadow: "0 4px 16px rgba(31, 38, 135, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.25)",
                    color: "#1e3a8a",
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.55)",
                      boxShadow: "0 8px 24px rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                      transform: "scale(1.04) translateY(-1px)",
                    },
                    "&:active": {
                      transform: "scale(0.96)",
                    }
                  }}
                >
                  Back To Root
                </Button>
                <Button
                  variant="contained"
                  onClick={() => router.push('/add-kuppi')}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    width: { xs: '100%', sm: 'auto' },
                    textTransform: "none",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.8))",
                    ...blurFromSm("blur(8px)"),
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.35)",
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&:hover": {
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(99, 102, 241, 0.95))",
                      boxShadow: "0 12px 32px rgba(59, 130, 246, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.45)",
                      transform: "scale(1.04) translateY(-1px)",
                    },
                    "&:active": {
                      transform: "scale(0.96)",
                    }
                  }}
                >
                  Add Kuppi
                </Button>
              </Stack>
            ) : activeDirectory === 'resource' ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="outlined"
                  onClick={goToRoot}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    width: { xs: '100%', sm: 'auto' },
                    textTransform: "none",
                    fontWeight: 700,
                    background: { xs: "rgba(255, 255, 255, 0.92)", sm: "rgba(255, 255, 255, 0.15)" },
                    ...blurFromSm("blur(10px)"),
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    boxShadow: "0 4px 16px rgba(31, 38, 135, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.25)",
                    color: "#1e3a8a",
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.3)",
                      border: "1px solid rgba(255, 255, 255, 0.55)",
                      boxShadow: "0 8px 24px rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                      transform: "scale(1.04) translateY(-1px)",
                    },
                    "&:active": {
                      transform: "scale(0.96)",
                    }
                  }}
                >
                  Back To Root
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setUploadCategoryId(activeCategoryId);
                    setUploadDialogOpen(true);
                  }}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    width: { xs: '100%', sm: 'auto' },
                    textTransform: "none",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.8))",
                    ...blurFromSm("blur(8px)"),
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.35)",
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&:hover": {
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(99, 102, 241, 0.95))",
                      boxShadow: "0 12px 32px rgba(59, 130, 246, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.45)",
                      transform: "scale(1.04) translateY(-1px)",
                    },
                    "&:active": {
                      transform: "scale(0.96)",
                    }
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
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    ...glassCardSx,
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    ...finePointerHover({
                      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15))",
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      boxShadow: "0 8px 24px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                      transform: "translateY(-2px)",
                    }),
                  }}
                >
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
                        {videos.length} {videos.length === 1 ? 'kuppi' : 'kuppis'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>

              {orderedCategories.map((category) => (
                <Grid key={category.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(255, 255, 255, 0.35)",
                      ...glassCardSx,
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      ...finePointerHover({
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15))",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                        boxShadow: "0 8px 24px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                        transform: "translateY(-2px)",
                      }),
                    }}
                  >
                    <CardActionArea onClick={() => enterResourceCategory(category.id)}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                          <FolderIcon color="warning" />
                          <Typography variant="h6">{category.name}</Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {categoryCounts[category.id] ?? 0} {category.name.toLowerCase()}
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
                    <Paper
                      key={year}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: "1px solid rgba(255, 255, 255, 0.35)",
                        ...glassYearPanelSx,
                      }}
                    >
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
                  <Card
                    key={folder.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(255, 255, 255, 0.35)",
                      ...glassCardSx,
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      ...finePointerHover({
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15))",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                        boxShadow: "0 8px 24px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                        transform: "translateY(-2px)",
                      }),
                    }}
                  >
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
                  <Card
                    key={resource.id}
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(255, 255, 255, 0.35)",
                      ...glassCardSx,
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                      ...finePointerHover({
                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15))",
                        borderColor: "rgba(255, 255, 255, 0.5)",
                        boxShadow: "0 8px 24px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
                        transform: "translateY(-2px)",
                      }),
                    }}
                  >
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

              <ResourceUploadDialog
                open={uploadDialogOpen}
                onClose={() => setUploadDialogOpen(false)}
                onUploadSuccess={(msg) => {
                  setNotification({
                    open: true,
                    message: msg,
                    severity: 'success',
                  });
                  forceExpireCache();
                  resourcesCacheRef.current.clear();
                  fetchResources();
                }}
                onUploadError={(msg) => {
                  setNotification({
                    open: true,
                    message: msg,
                    severity: 'error',
                  });
                }}
                moduleId={moduleId}
                uploadCategoryId={uploadCategoryId}
                categoryName={getActiveCategoryName()}
                addButtonLabel={getAddButtonLabel()}
                activeParentFolderId={activeParentFolderId}
              />
            </Stack>
          ) : null}
        </Paper>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
