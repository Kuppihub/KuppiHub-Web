// components/VideoCard.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import KuppiCommentsInline from './KuppiCommentsInline';
import KuppiReviewsInline from './KuppiReviewsInline';

interface Video {
  id: number;
  title: string;
  youtube_links: string[];
  telegram_links?: string[];
  material_urls?: string[];
  onedrive_cloud_video_urls?: string[];
  gdrive_cloud_video_urls?: string[];
  is_kuppi?: boolean;
  description?: string;
  language_code?: string;
  created_at?: string;
  owner?: {
    name: string;
  };
}

interface VideoCardProps {
  video: Video;
  moduleId: string;
  isActive: boolean;
  onToggle: (id: number) => void;
}

export default function VideoCard({ video, moduleId, isActive, onToggle }: VideoCardProps) {


  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl h-fit"
    >
      <button
        onClick={() => onToggle(video.id)}
        className="w-full text-left p-6 flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="flex items-center">
          
          <h2 className="text-lg font-semibold text-gray-800">{video.title}</h2>
          {video.is_kuppi && (
            <span className="ml-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              Kuppi
            </span>
          )}
        </div>
        <svg 
          className={`w-6 h-6 text-blue-500 transform transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isActive && (
          <VideoCardContent video={video} moduleId={moduleId} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VideoCardContent({ video, moduleId }: { video: Video; moduleId: string }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="px-6 pb-6 border-t border-blue-100"
    >
      {video.description && (
        <p className="text-gray-600 mt-4 mb-4 text-sm whitespace-pre-line">
          {video.description}
        </p>
      )}

      {video.owner?.name && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">{video.owner.name}</p>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2">
        {video.language_code && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">
            Language: {video.language_code.toUpperCase()}
          </span>
        )}
        {video.created_at && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
            Uploaded: {new Date(video.created_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {video.youtube_links.map((url, index) => {
          // Create video data object and encode as base64
          const videoData = {
            kuppiId: video.id,
            videoUrl: url,
            videoTitle: video.title,
            description: video.description || '',
            studentName: video.owner?.name || '',
          };
          // Encode to UTF-8 first, then base64 to handle non-ASCII characters
          const encodedData = btoa(
  encodeURIComponent(JSON.stringify(videoData))
);
          
          return (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={`url-${index}`}
              onClick={() =>
                router.push(
                  `/module-kuppi/${moduleId}/watch?data=${encodedData}`
                )
              }
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-red-500 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M23.498 6.186a2.974 2.974 0 0 0-2.094-2.103C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.404.583a2.974 2.974 0 0 0-2.094 2.103C0 8.09 0 12 0 12s0 3.91.502 5.814a2.974 2.974 0 0 0 2.094 2.103C4.495 20.5 12 20.5 12 20.5s7.505 0 9.404-.583a2.974 2.974 0 0 0 2.094-2.103C24 15.91 24 12 24 12s0-3.91-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
              </svg>
              Watch Video From Youtube{video.youtube_links.length > 1 ? ` ${index + 1}` : ""}
            </motion.button>
          );
        })}

        <div className="flex flex-wrap gap-2">
          {video.telegram_links?.map((link, index) => (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={`tg-${index}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-grow flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
           <svg
  className="w-6 h-6 mr-1.5"
  fill="currentColor"
  viewBox="0 0 25 25"
  aria-hidden="true"
>
  <path d="M9.999 15.2 9.85 19c.35 0 .5-.15.7-.35l1.65-1.6 3.45 2.55c.65.35 1.1.15 1.25-.6l2.25-10.6c.2-.9-.35-1.25-.95-1.05L4.4 10.35c-.9.35-.85.85-.15 1.05l3.2 1 7.4-4.65c.35-.2.65-.1.4.15l-5.8 5.3Z" />
</svg>

              Download Video From Telegram {video.telegram_links!.length > 1 ? index + 1 : ""}
            </motion.a>
          ))}



            {video.onedrive_cloud_video_urls?.map((link, index) => (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={`cloud-${index}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
        >
              <img
              src="/images/icons/onedrive.png"
              className=" h-5 mr-2"
              alt="OneDrive"
              />
              OneDrive Video {video.onedrive_cloud_video_urls!.length > 1 ? index + 1 : ""}
            </motion.a>
            ))}

            {video.gdrive_cloud_video_urls?.map((link, index) => (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={`gdrive-${index}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M4.433 22l3.088-5.333H22l-3.088 5.333H4.433zm7.134-12L7.6 2h7.467l3.967 8H11.567zm-1.7 2.933L2 22l3.967-6.867L13.833 2l3.967 6.867-7.966 4.066z" />
              </svg>
              Google Drive Video {video.gdrive_cloud_video_urls!.length > 1 ? index + 1 : ""}
            </motion.a>
            ))}

          {video.material_urls?.map((link, index) => (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={`mat-${index}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-grow flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-xl text-white bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                ></path>
              </svg>
              Material (PDF){video.material_urls!.length > 1 ? index + 1 : ""}
            </motion.a>
          ))}
        </div>
      </div>

      <KuppiReviewsInline kuppiId={String(video.id)} />
      <KuppiCommentsInline kuppiId={String(video.id)} />
    </motion.div>
  );
}
