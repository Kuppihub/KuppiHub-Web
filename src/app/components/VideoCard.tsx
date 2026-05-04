// components/VideoCard.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import KuppiCommentsInline from './KuppiCommentsInline';
import KuppiReviewsInline from './KuppiReviewsInline';

function GoogleDriveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

function OneDriveIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="35.98 139.2 648.03 430.85" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="onedrive-radial0" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(130.864814,156.804864,-260.089994,217.063603,48.669602,228.766494)">
          <stop offset="0" style={{ stopColor: "rgb(28.235294%,58.039216%,99.607843%)", stopOpacity: 1 }} />
          <stop offset="0.695072" style={{ stopColor: "rgb(3.529412%,20.392157%,70.196078%)", stopOpacity: 1 }} />
        </radialGradient>
        <radialGradient id="onedrive-radial1" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-575.289668,663.594003,-491.728488,-426.294267,596.956501,-6.380235)">
          <stop offset="0.165327" style={{ stopColor: "rgb(13.72549%,75.294118%,99.607843%)", stopOpacity: 1 }} />
          <stop offset="0.534" style={{ stopColor: "rgb(10.980392%,56.862745%,100%)", stopOpacity: 1 }} />
        </radialGradient>
        <radialGradient id="onedrive-radial2" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-136.753383,-114.806698,262.816935,-313.057562,181.196995,240.395994)">
          <stop offset="0" style={{ stopColor: "rgb(100%,100%,100%)", stopOpacity: 0.4 }} />
          <stop offset="0.660528" style={{ stopColor: "rgb(67.843137%,75.294118%,100%)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="onedrive-radial3" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-153.638428,-130.000063,197.433014,-233.332948,375.353994,451.43549)">
          <stop offset="0" style={{ stopColor: "rgb(1.176471%,22.745098%,80%)", stopOpacity: 1 }} />
          <stop offset="1" style={{ stopColor: "rgb(21.176471%,55.686275%,100%)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="onedrive-radial4" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(175.585899,405.198026,-437.434522,189.555055,169.378495,125.589294)">
          <stop offset="0.592618" style={{ stopColor: "rgb(20.392157%,39.215686%,89.019608%)", stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: "rgb(1.176471%,22.745098%,80%)", stopOpacity: 0.6 }} />
        </radialGradient>
        <radialGradient id="onedrive-radial5" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-459.329491,459.329491,-719.614455,-719.614455,589.876499,39.484649)">
          <stop offset="0" style={{ stopColor: "rgb(29.411765%,99.215686%,90.980392%)", stopOpacity: 0.898039 }} />
          <stop offset="0.543937" style={{ stopColor: "rgb(29.411765%,99.215686%,90.980392%)", stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="onedrive-linear0" gradientUnits="userSpaceOnUse" x1="29.999701" y1="37.9823" x2="29.999701" y2="18.398199" gradientTransform="matrix(15,0,0,15,0,0)">
          <stop offset="0" style={{ stopColor: "rgb(0%,52.54902%,100%)", stopOpacity: 1 }} />
          <stop offset="0.49" style={{ stopColor: "rgb(0%,73.333333%,100%)", stopOpacity: 1 }} />
        </linearGradient>
        <radialGradient id="onedrive-radial6" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(273.622108,108.513684,-205.488428,518.148261,296.488495,307.441492)">
          <stop offset="0" style={{ stopColor: "rgb(100%,100%,100%)", stopOpacity: 0.4 }} />
          <stop offset="0.785262" style={{ stopColor: "rgb(100%,100%,100%)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="onedrive-radial7" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-305.683909,263.459223,-264.352324,-306.720147,674.845505,249.378004)">
          <stop offset="0" style={{ stopColor: "rgb(29.411765%,99.215686%,90.980392%)", stopOpacity: 0.898039 }} />
          <stop offset="0.584724" style={{ stopColor: "rgb(29.411765%,99.215686%,90.980392%)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <g>
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial0)" }} d="M 215.078125 205.089844 C 116.011719 205.09375 41.957031 286.1875 36.382812 376.527344 C 39.835938 395.992188 51.175781 434.429688 68.941406 432.457031 C 91.144531 429.988281 147.066406 432.457031 194.765625 346.105469 C 229.609375 283.027344 301.285156 205.085938 215.078125 205.089844 Z M 215.078125 205.089844 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial1)" }} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial2)" }} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial3)" }} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial4)" }} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial5)" }} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-linear0)" }} d="M 215.699219 569.496094 C 215.699219 569.496094 489.320312 570.035156 535.734375 570.035156 C 619.960938 570.035156 684 501.273438 684 421.03125 C 684 340.789062 618.671875 272.445312 535.734375 272.445312 C 452.792969 272.445312 405.027344 334.492188 369.152344 402.226562 C 327.117188 481.59375 273.488281 568.546875 215.699219 569.496094 Z M 215.699219 569.496094 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial6)" }} d="M 215.699219 569.496094 C 215.699219 569.496094 489.320312 570.035156 535.734375 570.035156 C 619.960938 570.035156 684 501.273438 684 421.03125 C 684 340.789062 618.671875 272.445312 535.734375 272.445312 C 452.792969 272.445312 405.027344 334.492188 369.152344 402.226562 C 327.117188 481.59375 273.488281 568.546875 215.699219 569.496094 Z M 215.699219 569.496094 " />
        <path style={{ stroke: "none", fillRule: "nonzero", fill: "url(#onedrive-radial7)" }} d="M 215.699219 569.496094 C 215.699219 569.496094 489.320312 570.035156 535.734375 570.035156 C 619.960938 570.035156 684 501.273438 684 421.03125 C 684 340.789062 618.671875 272.445312 535.734375 272.445312 C 452.792969 272.445312 405.027344 334.492188 369.152344 402.226562 C 327.117188 481.59375 273.488281 568.546875 215.699219 569.496094 Z M 215.699219 569.496094 " />
      </g>
    </svg>
  );
}
import { Video } from '../types/video';

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
        {video.published_at && (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
            Published: {new Date(video.published_at).toLocaleDateString()}
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
              <OneDriveIcon className="h-5 w-5 mr-2" />
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
              <GoogleDriveIcon className="w-5 h-5 mr-2" />
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
