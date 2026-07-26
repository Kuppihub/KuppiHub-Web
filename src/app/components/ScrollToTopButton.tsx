'use client';
import React, { useEffect, useState } from 'react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    let animationFrame: number | null = null;

    const updateScrollState = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

      setScrollPercent(scrolled);
      setIsVisible(scrollY > 300);
    };

    const handleScroll = () => {
      if (animationFrame !== null) return;
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        updateScrollState();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // SVG circle values
  const radius = 18;
  const stroke = 3;
  const normalizedRadius = Math.max(radius - stroke / 2, 0);
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset =
    !isNaN(circumference) && !isNaN(scrollPercent)
      ? circumference - (scrollPercent / 100) * circumference
      : 0;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full border border-white/30 text-blue-900 shadow-md sm:shadow-xl
                  bg-white/90 max-sm:backdrop-blur-none sm:bg-white/20 sm:backdrop-blur-lg
                  transition-all duration-500 ease-in-out hover:bg-white/95 sm:hover:bg-white/30 active:scale-95 transform sm:hover:scale-110
                  flex items-center justify-center
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      aria-label="Scroll to top"
    >
      <svg className="absolute w-full h-full rotate-[-90deg]" viewBox="0 0 40 40">
        <defs>
          <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" /> {/* amber-400 */}
            <stop offset="50%" stopColor="#f59e0b" /> {/* amber-500 */}
            <stop offset="100%" stopColor="#ea580c" /> {/* orange-600 */}
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r={normalizedRadius}
          stroke="url(#scrollGradient)"
          strokeWidth={stroke}
          fill="none"
          className="transition-all duration-300"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <svg className="h-5 w-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
