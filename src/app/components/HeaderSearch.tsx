'use client';

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authGet, authPost } from "@/lib/auth-fetch";

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

interface HeaderSearchProps {
  variant?: "desktop" | "mobile";
}

function readLocalDashboardModules(): DashboardModule[] {
  try {
    const raw = localStorage.getItem("dashboardModules");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function HeaderSearch({ variant }: HeaderSearchProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [addedModules, setAddedModules] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  const loadAddedModules = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      if (user?.uid) {
        const res = await authGet('/api/user-dashboard');
        if (res.ok) {
          const data = await res.json();
          const ids: number[] = Array.isArray(data.moduleIds) ? data.moduleIds : [];
          setAddedModules(new Set(ids));
          return;
        }
      }

      const parsed = readLocalDashboardModules();
      setAddedModules(new Set(parsed.map((m) => m.module_id)));
    } catch (err) {
      console.error(err);
      const parsed = readLocalDashboardModules();
      setAddedModules(new Set(parsed.map((m) => m.module_id)));
    }
  }, [user?.uid]);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => {
      const isMobileScreen = window.innerWidth < 640;
      if (variant === "mobile" && isMobileScreen) {
        setSearchOpen(true);
      } else if (variant === "desktop" && !isMobileScreen) {
        setSearchOpen(true);
      } else if (!variant) {
        setSearchOpen(true);
      }
    };
    const handleAuthCachesCleared = () => {
      setAddedModules(new Set());
    };
    window.addEventListener("openHeaderSearch", handleOpen);
    window.addEventListener("authCachesCleared", handleAuthCachesCleared);
    return () => {
      window.removeEventListener("openHeaderSearch", handleOpen);
      window.removeEventListener("authCachesCleared", handleAuthCachesCleared);
    };
  }, [variant]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSearchOpen(false);
      setQuery("");
    }
  };

  // Load already added modules for the current auth identity
  useEffect(() => {
    if (!searchOpen) return;
    loadAddedModules();
  }, [searchOpen, loadAddedModules]);

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
      let existing: DashboardModule[] = [];

      if (user?.uid) {
        const dashRes = await authGet('/api/user-dashboard');
        if (dashRes.ok) {
          const data = await dashRes.json();
          const ids: number[] = Array.isArray(data.moduleIds) ? data.moduleIds : [];
          if (ids.includes(mod.id)) {
            setAddedModules(new Set(ids));
            return;
          }
          if (ids.length > 0) {
            const detailsRes = await fetch(`/api/dashboard-modules?ids=${ids.join(",")}`);
            existing = detailsRes.ok ? await detailsRes.json() : [];
            if (!Array.isArray(existing)) existing = [];
          }
        }
      } else {
        existing = readLocalDashboardModules();
        if (existing.some((m) => m.module_id === mod.id)) {
          setAddedModules(new Set(existing.map((m) => m.module_id)));
          return;
        }
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
          const response = await authPost('/api/user-dashboard', {
            moduleIds: existing.map(m => m.module_id),
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
      setAddedModules(new Set(existing.map((m) => m.module_id)));
      
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
        className="w-full relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-50/60 backdrop-blur-md border border-blue-100/80 text-blue-900 shadow-sm hover:bg-blue-100/70 hover:text-blue-950 hover:shadow-md hover:border-blue-200 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
      >
        <Search className="w-5 h-5 text-blue-900 flex-shrink-0" /> 
        <span className="hidden md:block text-base text-blue-950 font-medium">Search modules by code or name...</span>
        <span className="md:hidden text-base text-blue-950 font-medium">Search...</span>
      </button>

      {/* Full-page search overlay */}
      {searchOpen && mounted && createPortal(
        <div 
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[9999] flex flex-col backdrop-blur-2xl bg-slate-900/60 dark:bg-slate-950/60 transition-all duration-300 overflow-hidden"
        >
          {/* Subtle decorative glow blobs at the background */}
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-[6000ms]" />

          {/* Close button in top-right - hidden on mobile, absolute on desktop */}
          <button
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
            className="hidden md:flex absolute top-8 right-8 p-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 hover:text-white backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer z-50"
            aria-label="Close search"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Top search bar container - clicking inside shouldn't close search */}
          <div className="w-full max-w-2xl mx-auto mt-10 sm:mt-24 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3 shadow-2xl">
              {/* Search Icon */}
              <Search className="w-5 h-5 sm:w-6 h-6 text-white/80 ml-1.5 sm:ml-2 flex-shrink-0" />

              {/* Input field */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules..."
                autoFocus
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-white/5 border border-white/15 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all duration-300 text-sm sm:text-base font-medium"
              />

              {/* Inline close button on mobile, hidden on desktop */}
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 cursor-pointer flex items-center justify-center"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center text-white/40 text-xs sm:text-sm mt-3 font-medium">
              Click anywhere outside to close search
            </p>
          </div>

          {/* Results container - clicking on the backdrop of this area closes search */}
          <div 
            onClick={handleOverlayClick}
            className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 py-3 sm:py-8 mt-2 sm:mt-6"
          >
            {query.length < 2 ? (
              <div className="max-w-md mx-auto p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl text-center backdrop-blur-md shadow-md mt-4 sm:mt-8" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs sm:text-sm text-white/90 font-medium">Type at least 2 characters to search modules...</p>
              </div>
            ) : loading ? (
              <div className="max-w-md mx-auto p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl text-center backdrop-blur-md shadow-md mt-4 sm:mt-8 flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <p className="text-xs sm:text-sm text-white/90 font-medium">Searching modules...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="max-w-md mx-auto p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl text-center backdrop-blur-md shadow-md mt-4 sm:mt-8" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs sm:text-sm text-white/90 font-medium">No modules found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" onClick={(e) => e.stopPropagation()}>
                {results.map((mod: Module) => (
                  <div
                    key={mod.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                      router.push(`/module-kuppi/${mod.id}`);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSearchOpen(false);
                        setQuery("");
                        router.push(`/module-kuppi/${mod.id}`);
                      }
                    }}
                    className="p-3.5 sm:p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-md sm:shadow-lg hover:bg-white/15 hover:border-white/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between h-full saturate-150 cursor-pointer"
                  >
                    <div>
                      <p className="font-bold text-blue-300 text-xs sm:text-sm tracking-wider uppercase">{mod.code}</p>
                      <p className="font-bold text-white mt-1 sm:mt-1.5 text-sm sm:text-base line-clamp-2 leading-snug">{mod.name}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-white/70 mt-2.5 sm:mt-3.5 font-medium flex items-center gap-1.5">📹 {mod.video_count} video{mod.video_count !== 1 ? 's' : ''}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToDashboard(mod);
                        }}
                        disabled={addedModules.has(mod.id)}
                        className={`mt-3 sm:mt-4 w-full py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
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
