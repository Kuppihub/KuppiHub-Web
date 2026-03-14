'use client';

import BackButton from './BackButton';

interface VideoPlayerProps {
  videoUrl: string;
  videoTitle?: string;
  description?: string;
  studentName?: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export default function VideoPlayer({ 
  videoUrl, 
  videoTitle, 
  description, 
  studentName, 
  onBack,
  children
}: VideoPlayerProps) {

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    
    // youtu.be format
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    
    // youtube.com?v= format
    if (url.includes('v=')) {
      const id = url.split('v=')[1].split('&')[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    
    // /embed/ format
    if (url.includes('/embed/')) {
      const id = url.split('/embed/')[1].split('?')[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
    
    // /v/ format
    if (url.includes('/v/')) {
      const id = url.split('/v/')[1].split('?')[0];
      if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }

    return null;
  };

  if (!videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        No video URL provided
      </div>
    );
  }

  const youtubeId = extractYouTubeId(videoUrl);

  if (!youtubeId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Invalid YouTube URL
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto relative">
        {onBack && (
          <BackButton onClick={onBack} className="absolute -left-20 top-0 hidden md:flex" />
        )}
        
        {videoTitle && (
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{videoTitle}</h1>
        )}
        
        {/* YouTube Embed */}
        <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={videoTitle || 'YouTube Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Video Info Section */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-6">
              {studentName && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Done by</p>
                    <p className="font-semibold text-gray-800">{studentName}</p>
                  </div>
                </div>
              )}

              {description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-line">{description}</p>
                </div>
              )}

              {!studentName && !description && (
                <p className="text-gray-500 text-center">No additional information available</p>
              )}
            </div>

            {children && (
              <div className="mt-8">
                {children}
              </div>
            )}
      </div>
    </div>
  );
}
