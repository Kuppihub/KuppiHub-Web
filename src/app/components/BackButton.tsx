// components/BackButton.tsx
'use client';

import { motion } from 'framer-motion';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

export default function BackButton({ onClick, className = '' }: BackButtonProps) {
  return (
    <motion.button 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      onClick={onClick} 
      className={`px-5 py-2.5 mr-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl shadow-md hover:bg-white/30 text-blue-900 font-semibold flex items-center transition-all duration-300 ${className}`}
    >
      <svg className="w-5 h-5 mr-2 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back
    </motion.button>
  );
}
