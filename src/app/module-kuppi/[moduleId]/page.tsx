'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

export default function ModuleKuppiPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);

  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeParentFolderId, setActiveParentFolderId] = useState<number | null>(null);
  const [folderTrail, setFolderTrail] = useState<{ id: number; name: string }[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { user } = useAuth();

  useEffect(() => {
    if (!moduleId) return;

    const fetchVideos = async () => {
      try {
        const emailParam = user?.email ? `&userEmail=${encodeURIComponent(user.email)}` : '';
        const res = await fetch(`/api/kuppis?moduleId=${moduleId}${emailParam}`);
        if (!res.ok) throw new Error('Failed to fetch videos');
        const data: Video[] = await res.json();
        setVideos(data);
        if (data.length > 0) {
          setActiveVideoId(data[0].id);
        }
      } catch {
        setError('Failed to load videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [moduleId, user]);

  const fetchResources = useCallback(async () => {
    if (!moduleId) return;

    setResourcesLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('moduleId', moduleId);
      if (activeCategoryId !== null) params.set('categoryId', String(activeCategoryId));
      if (activeParentFolderId !== null) params.set('parentFolderId', String(activeParentFolderId));
      const token = await getIdToken(user);
      if (!token) return;

      const res = await fetch(`/api/module-resources?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load resources');
      const data = await res.json();

      setCategories(data.categories || []);
      setFolders(data.folders || []);
      setResources(data.resources || []);
      if (activeCategoryId === null && data.activeCategoryId) {
        setActiveCategoryId(data.activeCategoryId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResourcesLoading(false);
    }
  }, [moduleId, activeCategoryId, activeParentFolderId, user]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleBack = () => router.back();
  const handleToggleVideo = (id: number) => {
    setActiveVideoId(activeVideoId === id ? null : id);
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
    setFolderTrail((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setActiveParentFolderId(folder.id);
  };

  const goRoot = () => {
    setFolderTrail([]);
    setActiveParentFolderId(null);
  };

  const goToTrail = (index: number) => {
    const nextTrail = folderTrail.slice(0, index + 1);
    setFolderTrail(nextTrail);
    setActiveParentFolderId(nextTrail[nextTrail.length - 1]?.id ?? null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-xl text-blue-600">Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto space-y-10">
        <BackButton onClick={handleBack} className="mb-8" />

        <PageHeader title="Module Content" subtitle="Explore videos and downloadable learning resources" />

        <section className="rounded-2xl border border-indigo-100 bg-white/80 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-indigo-900 mb-4">Resource Library</h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategoryId(category.id);
                  setActiveParentFolderId(null);
                  setFolderTrail([]);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  activeCategoryId === category.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-indigo-700 border-indigo-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="text-sm text-indigo-700 mb-4">
            <button type="button" onClick={goRoot} className="underline mr-2">Root</button>
            {folderTrail.map((entry, idx) => (
              <span key={entry.id}>
                /{' '}
                <button type="button" onClick={() => goToTrail(idx)} className="underline">
                  {entry.name}
                </button>{' '}
              </span>
            ))}
          </div>

          {resourcesLoading ? <p className="text-indigo-600">Loading resources...</p> : null}

          {!resourcesLoading && folders.length === 0 && resources.length === 0 ? (
            <p className="text-gray-600">No resources in this location yet.</p>
          ) : null}

          <div className="space-y-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => openFolder(folder)}
                className="w-full text-left px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100"
              >
                [Folder] {folder.name}
              </button>
            ))}

            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.file_url}
                target="_blank"
                rel="noreferrer"
                className="block px-4 py-3 rounded-lg border border-indigo-100 bg-white hover:bg-indigo-50"
              >
                <div className="font-medium text-indigo-900">{resource.title}</div>
                {resource.description ? <div className="text-sm text-gray-600">{resource.description}</div> : null}
                <div className="text-xs text-indigo-600 mt-1">Open / Download</div>
              </a>
            ))}
          </div>
        </section>

        {videos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-10">
            {sortedYears.map((year) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-sm font-semibold uppercase tracking-wider text-indigo-700/80 bg-white/70 px-3 py-1 rounded-full shadow-sm border border-indigo-100">
                    {year}
                  </div>
                  <div className="h-px flex-1 bg-indigo-200/60" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videosByYear[year].map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      moduleId={moduleId}
                      isActive={activeVideoId === video.id}
                      onToggle={handleToggleVideo}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
