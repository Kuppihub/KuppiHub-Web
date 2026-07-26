// components/VideoCard.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import KuppiCommentsInline from './KuppiCommentsInline';
import KuppiReviewsInline from './KuppiReviewsInline';
import { Video } from '../types/video';

function GoogleDriveIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
    </svg>
  );
}

function OneDriveIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#0364B8" d="M12.2 8.4c1.7-2.2 4.4-3.6 7.4-3.6 3.9 0 7.2 2.4 8.5 5.8 2.6.4 4.6 2.7 4.6 5.4 0 3-2.5 5.5-5.5 5.5H8.8c-3.1 0-5.6-2.5-5.6-5.6 0-2.7 1.9-5 4.5-5.5.6-1.5 1.7-2.8 3.1-3.6.4-.2.9-.4 1.4-.4z" />
      <path fill="#0078D4" d="M7.4 21.5h16.8c.3 0 .6 0 .9-.1-1.1 1.7-3 2.8-5.2 2.8H6.1c-2.3 0-4.2-1.5-4.9-3.6 1.2 1.1 2.8 1.7 4.5 1.7.6 0 1.1-.1 1.7-.3z" />
    </svg>
  );
}

const RAISED = 'shadow-[8px_8px_16px_#c3c8cf,-8px_-8px_16px_#ffffff]';
const RAISED_SM = 'shadow-[4px_4px_8px_#c3c8cf,-4px_-4px_8px_#ffffff]';
const RECESSED = 'shadow-[inset_6px_6px_12px_#cdd4df,inset_-6px_-6px_12px_#ffffff]';
const RECESSED_SM = 'shadow-[inset_4px_4px_8px_#c3c8cf,inset_-4px_-4px_8px_#ffffff]';

interface VideoCardProps {
  video: Video;
  moduleId: string;
  isActive: boolean;
  onToggle: (id: number) => void;
}

export default function VideoCard({ video, moduleId, isActive, onToggle }: VideoCardProps) {
  return (
    <div
      className={`h-fit rounded-[40px] p-[8px] bg-[#E5E9F0] border border-white/60 transition-all duration-300 ${
        isActive
          ? 'shadow-[16px_16px_32px_#c3c8cf,-16px_-16px_32px_#ffffff]'
          : 'shadow-[10px_10px_24px_#c3c8cf,-10px_-10px_24px_#ffffff] hover:shadow-[14px_14px_30px_#c3c8cf,-14px_-14px_30px_#ffffff]'
      }`}
    >
      <div className="bg-[#F4F7FB] rounded-[32px] p-4 sm:p-5 border border-white shadow-[inset_4px_4px_8px_#ffffff,inset_-4px_-4px_8px_#dbe1ea]">
        <button
          onClick={() => onToggle(video.id)}
          className="w-full flex items-start justify-between gap-3 text-left focus:outline-none cursor-pointer"
          aria-expanded={isActive}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-full bg-[#E5E9F0] shadow-[6px_6px_12px_#c3c8cf,-6px_-6px_12px_#ffffff] flex items-center justify-center p-[4px] shrink-0 border border-white mt-0.5">
              <div className="w-full h-full rounded-full bg-[#3B5BDB] flex items-center justify-center shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.2)]">
                <svg className="w-3.5 h-3.5 text-white fill-white ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <h2 className="font-semibold text-[#2C3E50] text-[15px] sm:text-base leading-snug break-words">
              {video.title}
            </h2>
          </div>

          <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#E5E9F0] shadow-[inset_4px_4px_8px_#c3c8cf,inset_-4px_-4px_8px_#ffffff] border border-white/50 mt-0.5">
            <svg
              className={`w-4 h-4 text-[#475569] transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <AnimatePresence>
          {isActive ? <VideoCardContent video={video} moduleId={moduleId} /> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VideoCardContent({ video, moduleId }: { video: Video; moduleId: string }) {
  const router = useRouter();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      sx={{ overflow: 'hidden' }}
    >
      <div className="mt-4 flex flex-col gap-3">
        <div className={`bg-[#EAEFF6] rounded-[24px] p-4 flex flex-col gap-3 border border-white/70 ${RECESSED}`}>
          {video.description ? (
            <p className="text-sm text-[#475569] leading-normal font-normal whitespace-pre-line break-words">
              {video.description}
            </p>
          ) : null}

          {video.owner?.name ? (
            <div className="bg-[#2C3E50] rounded-2xl p-1.5 flex items-center max-w-full border border-[#3B4D61] shadow-[4px_4px_8px_rgba(200,210,225,0.8),-4px_-4px_8px_rgba(255,255,255,1)]">
              <div className="w-8 h-8 rounded-full bg-[#1A252F] shadow-[inset_3px_3px_6px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col ml-2.5 mr-3 min-w-0">
                <span className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wide leading-none mb-0.5">
                  Done by
                </span>
                <span className="text-sm font-medium text-[#F4F7FB] leading-snug break-words">
                  {video.owner.name}
                </span>
              </div>
            </div>
          ) : null}

          {video.language_code ? (
            <div className={`self-start bg-[#E5E9F0] rounded-full px-3.5 py-1.5 flex items-center gap-1.5 border border-white ${RAISED_SM}`}>
              <svg className="w-3.5 h-3.5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
              </svg>
              <span className="text-xs font-medium text-[#475569]">
                Language: {video.language_code.toUpperCase()}
              </span>
            </div>
          ) : null}

          <div className="flex flex-col gap-2.5">
            {video.youtube_links.map((url, index) => {
              const videoData = {
                kuppiId: video.id,
                videoUrl: url,
                videoTitle: video.title,
                description: video.description || '',
                studentName: video.owner?.name || '',
              };
              const encodedData = btoa(encodeURIComponent(JSON.stringify(videoData)));

              return (
                <button
                  key={`url-${index}`}
                  onClick={() => router.push(`/module-kuppi/${moduleId}/watch?data=${encodedData}`)}
                  className="w-full transition-transform hover:scale-[1.01] active:scale-[0.98] outline-none cursor-pointer"
                >
                  <div className="w-full bg-[#FA5252] rounded-2xl py-3 px-3.5 flex items-center gap-3 border border-[#FF8787] shadow-[6px_6px_12px_#c3c8cf,-6px_-6px_12px_#ffffff,inset_4px_4px_8px_rgba(255,255,255,0.3),inset_-4px_-4px_8px_rgba(0,0,0,0.1)]">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]">
                      <svg className="w-4 h-4 text-[#FA5252]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a2.974 2.974 0 0 0-2.094-2.103C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.404.583a2.974 2.974 0 0 0-2.094 2.103C0 8.09 0 12 0 12s0 3.91.502 5.814a2.974 2.974 0 0 0 2.094 2.103C4.495 20.5 12 20.5 12 20.5s7.505 0 9.404-.583a2.974 2.974 0 0 0 2.094-2.103C24 15.91 24 12 24 12s0-3.91-.502-5.814zM9.75 15.568V8.432L15.818 12 9.75 15.568z" />
                      </svg>
                    </div>
                    <span className="text-white font-medium text-sm text-left break-words">
                      Watch on YouTube{video.youtube_links.length > 1 ? ` ${index + 1}` : ''}
                    </span>
                  </div>
                </button>
              );
            })}

            {video.telegram_links?.map((link, index) => (
              <a
                key={`tg-${index}`}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full transition-transform hover:scale-[1.01] active:scale-[0.98] outline-none"
              >
                <div className="w-full bg-[#143db6] rounded-2xl py-3 px-3.5 flex items-center gap-3 border border-[#74C0FC] shadow-[6px_6px_12px_#c3c8cf,-6px_-6px_12px_#ffffff,inset_4px_4px_8px_rgba(255,255,255,0.3),inset_-4px_-4px_8px_rgba(0,0,0,0.1)]">
                  <div className="w-8 h-8 border-[2.5px] border-white rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white fill-white -ml-[1px]" viewBox="0 0 25 25">
                      <path d="M9.999 15.2 9.85 19c.35 0 .5-.15.7-.35l1.65-1.6 3.45 2.55c.65.35 1.1.15 1.25-.6l2.25-10.6c.2-.9-.35-1.25-.95-1.05L4.4 10.35c-.9.35-.85.85-.15 1.05l3.2 1 7.4-4.65c.35-.2.65-.1.4.15l-5.8 5.3Z" />
                    </svg>
                  </div>
                  <span className="text-white font-medium text-sm text-left break-words">
                    Telegram{video.telegram_links!.length > 1 ? ` ${index + 1}` : ''}
                  </span>
                </div>
              </a>
            ))}

            {video.onedrive_cloud_video_urls?.map((link, index) => (
              <a
                key={`cloud-${index}`}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full transition-transform hover:scale-[1.01] active:scale-[0.98] outline-none"
              >
                <div className={`w-full bg-[#E5E9F0] rounded-2xl py-3 px-3.5 flex items-center gap-3 border border-white ${RAISED}`}>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)]">
                    <OneDriveIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[#2C3E50] font-medium text-sm text-left break-words">
                    OneDrive{video.onedrive_cloud_video_urls!.length > 1 ? ` ${index + 1}` : ''}
                  </span>
                </div>
              </a>
            ))}

            {video.gdrive_cloud_video_urls?.map((link, index) => (
              <a
                key={`gdrive-${index}`}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full transition-transform hover:scale-[1.01] active:scale-[0.98] outline-none"
              >
                <div className={`w-full bg-[#E5E9F0] rounded-2xl py-3 px-3.5 flex items-center gap-3 border border-white ${RAISED}`}>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)]">
                    <GoogleDriveIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[#2C3E50] font-medium text-sm text-left break-words">
                    Google Drive{video.gdrive_cloud_video_urls!.length > 1 ? ` ${index + 1}` : ''}
                  </span>
                </div>
              </a>
            ))}

            {video.material_urls?.map((link, index) => (
              <a
                key={`mat-${index}`}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full transition-transform hover:scale-[1.01] active:scale-[0.98] outline-none"
              >
                <div className={`w-full bg-[#E5E9F0] rounded-2xl py-3 px-3.5 flex items-center gap-3 border border-white ${RAISED_SM}`}>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)]">
                    <svg className="w-4 h-4 text-[#475569]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-[#2C3E50] font-medium text-sm text-left break-words">
                    Materials - PDF{video.material_urls!.length > 1 ? ` ${index + 1}` : ''}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <hr className="border-t border-[#DCE2E9]" />

        <div className={`bg-[#EAEFF6] rounded-[24px] px-4 py-2 border border-white/70 ${RECESSED_SM}`}>
          <KuppiReviewsInline kuppiId={String(video.id)} />
          <KuppiCommentsInline kuppiId={String(video.id)} />
        </div>
      </div>
    </Box>
  );
}
