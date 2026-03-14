"use client";

import { useSearchParams, useRouter } from "next/navigation";
import VideoPlayer from "../../../components/VideoPlayer";
import { useMemo } from "react";
import KuppiFeedback from "./KuppiFeedback";

interface VideoData {
  kuppiId?: number;
  videoUrl: string;
  videoTitle?: string;
  description?: string;
  studentName?: string;
}

export default function WatchVideoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Decode base64 data from URL
  const videoData = useMemo<VideoData | null>(() => {
    const data = searchParams.get("data");
    
    if (data) {
      try {
        // Decode from base64 and then from UTF-8
        const decoded = atob(data);
        const decodedStr = decodeURIComponent(atob(data));
        return JSON.parse(decodedStr) as VideoData;
      } catch (error) {
        console.error("Failed to decode video data:", error);
        return null;
      }
    }
    
    // Fallback for old URL format (backward compatibility)
    const videoUrl = searchParams.get("videoUrl");
    const videoTitle = searchParams.get("videoTitle");
    
    if (videoUrl) {
      try {
        return {
          videoUrl: decodeURIComponent(videoUrl),
          videoTitle: videoTitle ? decodeURIComponent(videoTitle) : undefined,
        };
      } catch {
        return { videoUrl };
      }
    }
    
    return null;
  }, [searchParams]);

  const handleBack = () => router.back();

  if (!videoData?.videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        No video URL provided
      </div>
    );
  }

  return (
    <VideoPlayer 
      key={videoData.videoUrl}
      videoUrl={videoData.videoUrl} 
      videoTitle={videoData.videoTitle} 
      description={videoData.description}
      studentName={videoData.studentName}
      onBack={handleBack}
    >
      {videoData.kuppiId && (
        <KuppiFeedback kuppiId={String(videoData.kuppiId)} />
      )}
    </VideoPlayer>
  );
}
