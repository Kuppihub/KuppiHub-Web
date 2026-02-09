'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import { app } from '@/lib/firebase';

export default function LiveCounter() {
  const [liveCount, setLiveCount] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showCounter, setShowCounter] = useState<boolean>(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowCounter(window.scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      const database = getDatabase(app);
      const visitorsRef = ref(database, 'visitors');
      let userRef: any = null;

      // Add this user to the active count
      const userId = Math.random().toString(36).substr(2, 9);
      userRef = ref(database, `visitors/active/${userId}`);
      set(userRef, true);

      // Auto-disconnect when user leaves
      onDisconnect(userRef).remove();

      // Listen for real-time updates
      onValue(visitorsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const activeCount = data.active ? Object.keys(data.active).length : 0;
          setLiveCount(activeCount);
        } else {
          setLiveCount(0);
        }
      });

      setIsVisible(true);

      return () => {
        // Cleanup on unmount
        if (userRef) {
          set(userRef, null);
        }
      };
    } catch (error) {
      console.error('Error setting up live counter:', error);
    }
  }, []);

  return (
    <div
      className={`fixed top-20 right-4 bg-white text-gray-900 px-3 py-2 rounded-full shadow-md font-semibold transition-all duration-300 flex items-center gap-2 ${
        isVisible && showCounter ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
      <span className="text-sm font-medium">{liveCount}</span>
    </div>
  );
}
