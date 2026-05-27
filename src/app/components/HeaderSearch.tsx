'use client';

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Module {
  id: number;
  code: string;
  name: string;
  description?: string;
  video_count: number;
}

interface DashboardModule {
  module_id: number;
  module: { code: string; name: string; description: string };
  video_count?: number;
}

export default function HeaderSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addedModules, setAddedModules] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSearchOpen(false);
      setQuery("");
    }
  };

  // Load already added modules when search opens
  useEffect(() => {
    if (searchOpen && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("dashboardModules");
        const parsed: DashboardModule[] = raw ? JSON.parse(raw) : [];
        setAddedModules(new Set(parsed.map(m => m.module_id)));
      } catch (err) {
        console.error(err);
      }
    }
  }, [searchOpen]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const debounceTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search-modules?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        // Robust parser to handle both direct and nested array structures
        const searchResults = Array.isArray(data.data) 
          ? data.data 
          : (data && data.data && Array.isArray(data.data.data) 
              ? data.data.data 
              : (Array.isArray(data) ? data : []));
              
        console.log("Search query:", query, "Parsed Results:", searchResults);
        setResults(searchResults);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleAddToDashboard = async (mod: Module) => {
    if (typeof window === "undefined") return;
    
    try {
      const raw = localStorage.getItem("dashboardModules");
      const existing: DashboardModule[] = raw ? JSON.parse(raw) : [];
      
      // Check if already added
      if (existing.some(m => m.module_id === mod.id)) {
        return;
      }
      
      // Add new module
      const newModule: DashboardModule = {
        module_id: mod.id,
        module: {
          code: mod.code,
          name: mod.name,
          description: mod.description || "",
        },
        video_count: mod.video_count,
      };
      
      existing.push(newModule);
      
      // If logged in, sync to database immediately
      if (user?.uid) {
        try {
          const response = await fetch('/api/user-dashboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firebase_uid: user.uid,
              moduleIds: existing.map(m => m.module_id),
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to sync to database');
            // Still save locally even if sync fails
          }
        } catch (err) {
          console.error('Failed to sync to database:', err);
          // Still save locally even if sync fails
        }
      }
      
      // Always save to localStorage
      localStorage.setItem("dashboardModules", JSON.stringify(existing));
      setAddedModules(prev => new Set([...prev, mod.id]));
      
      // Dispatch custom event to notify dashboard
      window.dispatchEvent(new CustomEvent("dashboardModulesUpdated"));
    } catch (err) {
      console.error("Failed to add to dashboard", err);
    }
  };

  return (
    <>
      {/* Search button (both desktop and mobile) */}
      <button
        onClick={() => setSearchOpen(true)}
        className="w-full relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-gray-900 shadow-sm hover:bg-white/30 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
      >
        <Search className="w-5 h-5 text-blue-900" /> 
        <span className="hidden md:block text-sm text-blue-950 font-medium">Search modules by code or name...</span>
        <span className="md:hidden text-sm text-blue-950 font-medium">Search...</span>
      </button>

      {/* Full-page search overlay */}
      {searchOpen && mounted && createPortal(
        <div 
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex flex-col backdrop-blur-2xl bg-slate-900/60 dark:bg-slate-950/60 transition-all duration-300 overflow-hidden"
        >
          {/* Subtle decorative glow blobs at the background */}
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[6000ms]" />

          {/* Close button in top-right */}
          <button
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
            className="absolute top-5 right-5 sm:top-8 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer z-50"
            aria-label="Close search"
          >
            <X className="w-5.5 h-5.5" />
          </button>

          {/* Top search bar container - clicking inside shouldn't close search */}
          <div className="w-full max-w-4xl mx-auto mt-12 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xl">
              {/* Search Icon */}
              <Search className="w-5 h-5 text-white/80 ml-1" />

              {/* Input field */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules by name or code..."
                autoFocus
                className="flex-1 px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm sm:text-base font-medium"
              />
            </div>
            <p className="text-center text-white/40 text-xs mt-2.5">
              Click anywhere outside to close search
            </p>
          </div>

          {/* Results container - clicking on the backdrop of this area closes search */}
          <div 
            onClick={handleOverlayClick}
            className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 py-6 mt-4"
          >
            {query.length < 2 ? (
              <div className="max-w-md mx-auto p-6 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md shadow-lg mt-8" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm sm:text-base text-white/80 font-medium">Type at least 2 characters to search modules...</p>
              </div>
            ) : loading ? (
              <div className="max-w-md mx-auto p-6 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md shadow-lg mt-8 flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <p className="text-sm sm:text-base text-white/80 font-medium">Searching modules...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="max-w-md mx-auto p-6 bg-white/5 border border-white/10 rounded-2xl text-center backdrop-blur-md shadow-lg mt-8" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm sm:text-base text-white/80 font-medium">No modules found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" onClick={(e) => e.stopPropagation()}>
                {results.map((mod: Module) => (
                  <div 
                    key={mod.id} 
                    className="p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:bg-white/15 hover:border-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-full saturate-150"
                  >
                    <div>
                      <p className="font-bold text-blue-300 text-xs sm:text-sm tracking-wider uppercase">{mod.code}</p>
                      <p className="font-bold text-white mt-1 text-sm sm:text-base line-clamp-2">{mod.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70 mt-3 font-medium flex items-center gap-1">📹 {mod.video_count} video{mod.video_count !== 1 ? 's' : ''}</p>
                      <button
                        onClick={() => handleAddToDashboard(mod)}
                        disabled={addedModules.has(mod.id)}
                        className={`mt-4 w-full py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                          addedModules.has(mod.id)
                            ? 'bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 cursor-default'
                            : 'bg-blue-500/20 hover:bg-blue-500/35 text-blue-200 border border-blue-500/35 hover:border-blue-500/50 shadow-sm active:scale-95'
                        }`}
                      >
                        {addedModules.has(mod.id) ? '✓ Added to Dashboard' : '+ Add to Dashboard'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
