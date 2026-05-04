"use client";

import { motion } from "framer-motion";

export default function InfoCard() {
  const steps = [
    {
      title: "Upload",
      description: "Upload to",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      title: "Get Link",
      description: "Copy the share link of your uploaded file.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
    {
      title: "Submit",
      description: "Paste your links below and publish your kuppi.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-4 sm:mb-6"
    >
      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0 max-w-2xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.title} className="contents">
              <div className="flex flex-row md:flex-col items-center gap-3 md:gap-2 text-left md:text-center md:flex-1">
                {index === 0 ? (
                  <a
                    href="https://t.me/KuppihubBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open @KuppiHubBot on Telegram"
                    className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 border-2 border-blue-200 flex items-center justify-center flex-shrink-0 hover:bg-blue-200 hover:border-blue-300 transition"
                  >
                    {step.icon}
                  </a>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-blue-700">{step.title}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 md:max-w-[150px]">
                    {index === 0 ? (
                      <>
                        {step.description}{" "}
                        <a
                          href="https://t.me/KuppihubBot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 underline font-semibold hover:text-blue-800"
                        >
                          @KuppiHubBot
                        </a>{" "}
                        on Telegram, YouTube, Google Drive or OneDrive.
                      </>
                    ) : (
                      step.description
                    )}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block w-12 h-px bg-blue-200 self-start mt-6 mx-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
