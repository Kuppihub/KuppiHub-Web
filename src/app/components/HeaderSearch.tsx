'use client';

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
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
        setResults(data.data || []);
      } catch (err) {
        console.error(err);
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
        className="w-full relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 hover:bg-white text-gray-700 border border-blue-200 shadow-sm"
      >
        <Search className="w-5 h-5" /> 
        <span className="hidden md:block text-sm">Search modules by code or name...</span>
        <span className="md:hidden text-sm">Search...</span>
      </button>

      {/* Full-page search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col backdrop-blur-sm bg-black/70">
          {/* Top search bar */}
          <div className="bg-gradient-to-r from-blue-100 via-purple-200 to-blue-500 text-white p-3 shadow bg-opacity-20">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              {/* Search Icon */}
              <Search className="w-5 h-5 text-gray-800" />

              {/* Input field */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules by name or code..."
                autoFocus
                className="flex-1 px-3 py-2 rounded-md border border-blue-500 focus:outline-none text-black placeholder-gray-600"
              />

              {/* Cancel button */}
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="text-xl font-semibold text-red-600 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto bg-transparent">
            {query.length < 2 ? (
              <p className="p-4 text-gray-100">Type at least 2 characters to search modules...</p>
            ) : loading ? (
              <p className="p-4 text-gray-100">Searching modules...</p>
            ) : results.length === 0 ? (
              <p className="p-4 text-gray-100">No modules found</p>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((mod: Module) => (
                  <div 
                    key={mod.id} 
                    className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition"
                  >
                    <p className="font-bold text-blue-600 text-sm">{mod.code}</p>
                    <p className="font-semibold text-gray-800 mt-1">{mod.name}</p>
                    <p className="text-sm text-gray-600 mt-2">📹 {mod.video_count} video{mod.video_count !== 1 ? 's' : ''}</p>
                    <button
                      onClick={() => handleAddToDashboard(mod)}
                      disabled={addedModules.has(mod.id)}
                      className={`mt-3 w-full py-1.5 rounded-full text-sm font-semibold transition-all ${
                        addedModules.has(mod.id)
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {addedModules.has(mod.id) ? '✓ Added to Dashboard' : '+ Add to Dashboard'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
