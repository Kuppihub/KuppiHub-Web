"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SchoolIcon from "@mui/icons-material/School";
import ModuleSelector from "../components/ModuleSelector";
import Preloader from "../components/Preloader";
import ModuleCard, { ModuleData } from "../components/ModuleCard";
import { useAuth } from "@/contexts/AuthContext";
import { checkAndManageCacheExpiration } from "@/lib/cache-utils";

interface DashboardCachePayload {
  modules: ModuleData[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [modules, setModules] = useState<ModuleData[] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const userCheckedRef = useRef(false);
  const dashboardCacheKey = `dashboard-cache:${user?.uid ?? "guest"}`;

  // Ensure user exists in Supabase before syncing dashboard
  const ensureUserExists = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !user?.email) return false;
    if (userCheckedRef.current) return true;
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: user.uid,
          email: user.email,
          display_name: user.displayName,
          photo_url: user.photoURL,
          is_verified: user.emailVerified,
          auth_provider: user.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to ensure user exists:', errorData);
        return false;
      }
      
      userCheckedRef.current = true;
      return true;
    } catch (err) {
      console.error('Failed to ensure user exists:', err);
      return false;
    }
  }, [user]);

  // Sync modules to Supabase (for logged-in users)
  const syncToCloud = useCallback(async (moduleData: ModuleData[]) => {
    if (!user?.uid) return;
    
    try {
      // Ensure user exists first - don't proceed if this fails
      const userCreated = await ensureUserExists();
      if (!userCreated) {
        console.error('Cannot sync: user does not exist in database');
        return;
      }
      
      const moduleIds = moduleData.map(m => m.module_id);
      const response = await fetch('/api/user-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: user.uid, moduleIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to sync to cloud:', errorData);
      }
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
    }
  }, [user?.uid, ensureUserExists]);

  // Load modules from cloud (for logged-in users)
  const loadFromCloud = useCallback(async () => {
    if (!user?.uid) return null;
    
    try {
      setSyncing(true);
      
      // Ensure user exists first
      await ensureUserExists();
      
      const res = await fetch(`/api/user-dashboard?firebase_uid=${encodeURIComponent(user.uid)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.moduleIds || [];
    } catch (err) {
      console.error('Failed to load from cloud:', err);
      return null;
    } finally {
      setSyncing(false);
    }
  }, [user?.uid, ensureUserExists]);

  // Load modules from localStorage
  const loadModulesFromLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem("dashboardModules");
      const parsed: ModuleData[] = raw ? JSON.parse(raw) : [];
      return parsed;
    } catch (err) {
      console.error("Failed to read dashboard modules", err);
      return [];
    }
  }, []);

  // Save modules to localStorage
  const saveModulesToLocal = useCallback((moduleData: ModuleData[]) => {
    localStorage.setItem("dashboardModules", JSON.stringify(moduleData));
  }, []);

  // Fetch fresh module data from API
  const fetchModuleDetails = useCallback(async (moduleIds: number[]) => {
    if (moduleIds.length === 0) return [];
    
    try {
      const res = await fetch(`/api/dashboard-modules?ids=${moduleIds.join(",")}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Failed to fetch module details", err);
      return [];
    }
  }, []);

  // Main load effect
  useEffect(() => {
    if (typeof window === "undefined" || authLoading) return;

    const initializeModules = async () => {
      checkAndManageCacheExpiration();
      const cachedRaw = sessionStorage.getItem(dashboardCacheKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as DashboardCachePayload;
          if (Array.isArray(cached.modules)) {
            setModules(cached.modules);
            return;
          }
        } catch {
          sessionStorage.removeItem(dashboardCacheKey);
        }
      }

      if (user?.uid) {
        // User is logged in - load from database only
        const cloudModuleIds = await loadFromCloud();
        
        if (cloudModuleIds && cloudModuleIds.length > 0) {
          // Fetch fresh data for cloud modules
          const freshModules = await fetchModuleDetails(cloudModuleIds as number[]);
          
          if (freshModules.length > 0) {
            setModules(freshModules);
            saveModulesToLocal(freshModules);
            sessionStorage.setItem(
              dashboardCacheKey,
              JSON.stringify({ modules: freshModules } satisfies DashboardCachePayload)
            );
          } else {
            setModules([]);
            saveModulesToLocal([]);
            sessionStorage.setItem(
              dashboardCacheKey,
              JSON.stringify({ modules: [] } satisfies DashboardCachePayload)
            );
          }
        } else {
          // No modules in database for this user — clear any stale guest local cache
          setModules([]);
          saveModulesToLocal([]);
          sessionStorage.setItem(
            dashboardCacheKey,
            JSON.stringify({ modules: [] } satisfies DashboardCachePayload)
          );
        }
      } else {
        // Not logged in - use local storage only
        const localModules = loadModulesFromLocal();
        setModules(localModules);
        sessionStorage.setItem(
          dashboardCacheKey,
          JSON.stringify({ modules: localModules } satisfies DashboardCachePayload)
        );
        if (localModules.length > 0) {
          refreshModuleCounts(localModules);
        }
      }
    };

    initializeModules();
  }, [user, authLoading, loadFromCloud, loadModulesFromLocal, fetchModuleDetails, saveModulesToLocal, dashboardCacheKey]);

  // Listen for updates from HeaderSearch and auth cache clears
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleUpdate = async () => {
      const parsed = loadModulesFromLocal();
      setModules(parsed);
      sessionStorage.setItem(
        dashboardCacheKey,
        JSON.stringify({ modules: parsed } satisfies DashboardCachePayload)
      );
      
      // Sync to cloud if logged in
      if (user?.uid && parsed.length > 0) {
        await syncToCloud(parsed);
      }
    };

    const handleAuthCachesCleared = () => {
      setModules([]);
    };
    
    window.addEventListener("dashboardModulesUpdated", handleUpdate);
    window.addEventListener("authCachesCleared", handleAuthCachesCleared);
    
    return () => {
      window.removeEventListener("dashboardModulesUpdated", handleUpdate);
      window.removeEventListener("authCachesCleared", handleAuthCachesCleared);
    };
  }, [user?.uid, loadModulesFromLocal, syncToCloud, dashboardCacheKey]);

  // Fetch fresh video counts for dashboard modules
  const refreshModuleCounts = async (currentModules: ModuleData[]) => {
    try {
      const moduleIds = currentModules.map((m) => m.module_id).join(",");
      const res = await fetch(`/api/dashboard-modules?ids=${moduleIds}`);
      if (!res.ok) return;
      const freshData: ModuleData[] = await res.json();

      // Merge fresh data with existing
      const freshMap: Record<number, ModuleData> = {};
      freshData.forEach((m) => (freshMap[m.module_id] = m));

      const updated = currentModules.map((m) =>
        freshMap[m.module_id] ? { ...m, ...freshMap[m.module_id] } : m
      );

      setModules(updated);
      saveModulesToLocal(updated);
      sessionStorage.setItem(
        dashboardCacheKey,
        JSON.stringify({ modules: updated } satisfies DashboardCachePayload)
      );
    } catch (err) {
      console.error("Failed to refresh module counts", err);
    }
  };

  const handleModuleClick = (moduleId: number) => {
    if (editMode) return; // Don't navigate in edit mode
    router.push(`/module-kuppi/${moduleId}`);
  };

  const removeModule = async (moduleId: number) => {
    if (!modules) return;

    const updated = modules.filter((m) => m.module_id !== moduleId);
    setModules(updated);
    saveModulesToLocal(updated);
    sessionStorage.setItem(
      dashboardCacheKey,
      JSON.stringify({ modules: updated } satisfies DashboardCachePayload)
    );
    
    // Sync to cloud if logged in
    if (user?.uid) {
      await syncToCloud(updated);
    }
  };

  const handleRemoveModule = async (e: React.MouseEvent, moduleId: number) => {
    e.stopPropagation();
    await removeModule(moduleId);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Handle adding module from ModuleSelector
  interface SelectorModule {
    module_id: number;
    module: {
      id: number;
      code: string;
      name: string;
      description?: string;
    };
    video_count?: number;
  }

  const handleAddModuleFromSelector = async (selectedModule: SelectorModule) => {
    const newModule: ModuleData = {
      module_id: selectedModule.module_id,
      module: {
        code: selectedModule.module.code,
        name: selectedModule.module.name,
        description: selectedModule.module.description || "",
      },
      video_count: selectedModule.video_count,
    };

    const currentModules = modules || [];
    
    // Check if already exists
    if (currentModules.some(m => m.module_id === newModule.module_id)) {
      return;
    }

    const updated = [...currentModules, newModule];
    setModules(updated);
    saveModulesToLocal(updated);
    sessionStorage.setItem(
      dashboardCacheKey,
      JSON.stringify({ modules: updated } satisfies DashboardCachePayload)
    );

    // Sync to cloud if logged in
    if (user?.uid) {
      await syncToCloud(updated);
    }
  };

  // Get set of added module IDs for the selector
  const addedModuleIds = new Set((modules || []).map(m => m.module_id));
  const totalVideos = (modules || []).reduce((sum, module) => sum + (module.video_count || 0), 0);



  return (
    <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            p: { xs: 2, sm: 3 },
            borderRadius: 4,
            border: "1px solid rgba(255, 255, 255, 0.4)",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15))",
            backdropFilter: "blur(20px) saturate(160%)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-1">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Dashboard</span>
              </h1>
              
            </div>
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => window.dispatchEvent(new CustomEvent("openHeaderSearch"))}
                sx={{
                  borderRadius: 999,
                  px: 3,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 0.8))",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25), inset 0 2px 4px rgba(255, 255, 255, 0.35)",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  "&:hover": {
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(99, 102, 241, 0.95))",
                    boxShadow: "0 12px 32px rgba(59, 130, 246, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.45)",
                    transform: "scale(1.04) translateY(-1px)",
                  },
                  "&:active": {
                    transform: "scale(0.96)",
                  }
                }}
              >
                Add Modules
              </Button>
              {modules && modules.length > 0 && (
                <Button
                  variant={editMode ? "contained" : "outlined"}
                  color={editMode ? "success" : "inherit"}
                  startIcon={editMode ? undefined : <EditIcon />}
                  onClick={toggleEditMode}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    textTransform: "none",
                    fontWeight: 700,
                    ...(editMode ? {
                      background: "linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(21, 128, 61, 0.8))",
                      border: "1px solid rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 8px 24px rgba(34, 197, 94, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.35)",
                    } : {
                      background: "rgba(255, 255, 255, 0.15)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.35)",
                      boxShadow: "0 4px 16px rgba(31, 38, 135, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.25)",
                      color: "#1e3a8a",
                    }),
                    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    "&:hover": {
                      ...(editMode ? {
                        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(21, 128, 61, 0.95))",
                        boxShadow: "0 12px 32px rgba(34, 197, 94, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.45)",
                      } : {
                        background: "rgba(255, 255, 255, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.55)",
                        boxShadow: "0 8px 24px rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                      }),
                      transform: "scale(1.04) translateY(-1px)",
                    },
                    "&:active": {
                      transform: "scale(0.96)",
                    }
                  }}
                >
                  {editMode ? 'Done' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
      
          {syncing ? <LinearProgress sx={{ mt: 2, borderRadius: 999 }} /> : null}
        </Paper>

        {modules === null ? (
          <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <Paper
                key={n}
                sx={{
                  height: 140,
                  borderRadius: 4,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.08))",
                  backdropFilter: "blur(10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={30} sx={{ color: "primary.main" }} />
              </Paper>
            ))}
          </Box>
        ) : modules.length === 0 ? (
          <Paper
            initial={{ opacity: 0, scale: 0.95 }}
            component={motion.div}
            animate={{ opacity: 1, scale: 1 }}
            sx={{
              textAlign: "center",
              py: 6,
              px: 3,
              borderRadius: 4,
              border: "1px solid rgba(255, 255, 255, 0.4)",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15))",
              backdropFilter: "blur(20px) saturate(160%)",
              boxShadow: "0 10px 30px rgba(31, 38, 135, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
            }}
          >
            <SchoolIcon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              No modules in your dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Tap Add Modules to get started.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => window.dispatchEvent(new CustomEvent("openHeaderSearch"))}
              sx={{
                mt: 3,
                borderRadius: 999,
                px: 4,
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(99, 102, 241, 0.85))",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 24px rgba(59, 130, 246, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.35)",
                transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                "&:hover": {
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(99, 102, 241, 0.95))",
                  boxShadow: "0 12px 32px rgba(59, 130, 246, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.45)",
                  transform: "scale(1.04) translateY(-1px)",
                },
                "&:active": {
                  transform: "scale(0.96)",
                }
              }}
            >
              Add Your First Module
            </Button>
          </Paper>
        ) : (
          <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {modules.map((m, i) => (
              <ModuleCard
                key={m.module_id}
                moduleData={m}
                index={i}
                editMode={editMode}
                onRemove={removeModule}
                onRemoveWithEvent={handleRemoveModule}
                onClick={handleModuleClick}
              />
            ))}
          </Box>
        )}
      </div>

      {/* Module Selector Modal (Temporarily disabled - redirect to search) */}
      {false && (
        <ModuleSelector
          isOpen={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          onAddModule={handleAddModuleFromSelector}
          addedModuleIds={addedModuleIds}
        />
      )}
    </div>
  );
}
