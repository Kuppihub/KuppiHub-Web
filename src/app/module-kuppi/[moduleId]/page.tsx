// ModuleKuppiPage.tsx (updated)
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import VideoCard from '../../components/VideoCard';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import BackButton from '../../components/BackButton';
import { Video } from '../../types/video';
import { useAuth } from '@/contexts/AuthContext';

export default function ModuleKuppiPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);

  const router = useRouter();
  const params = useParams();
  const moduleId = params.moduleId as string;
  const { user } = useAuth();

  useEffect(() => {
    if (!moduleId) return;

    const fetchVideos = async () => {
      try {
        // Pass user email for domain-based access filtering
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
    return "Unknown Year";
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
    if (a === "Unknown Year") return 1;
    if (b === "Unknown Year") return -1;
    return Number(b) - Number(a);
  });

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
      <div className="max-w-7xl mx-auto">
        <BackButton onClick={handleBack} className="mb-8" />
        
        <PageHeader 
          title="Module Content" 
          subtitle="Explore available videos and materials for this module" 
        />

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
