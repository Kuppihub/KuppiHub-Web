"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import SchoolIcon from "@mui/icons-material/School";
import EngineeringIcon from "@mui/icons-material/Engineering";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ComputerIcon from "@mui/icons-material/Computer";
import BusinessIcon from "@mui/icons-material/Business";
import ScienceIcon from "@mui/icons-material/Science";
import FolderIcon from "@mui/icons-material/Folder";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

interface Module {
  module_id: number;
  module: {
    id: number;
    code: string;
    name: string;
    description?: string;
  };
  video_count?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HierarchyData = any;

interface ModuleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModule: (module: Module) => void;
  addedModuleIds: Set<number>;
}

// Map faculty keys to MUI icons
const getFacultyIcon = (id: string) => {
  const iconProps = { sx: { fontSize: 28, color: "#6366f1" } };
  switch (id) {
    case "engineering":
      return <EngineeringIcon {...iconProps} />;
    case "medicine":
      return <LocalHospitalIcon {...iconProps} />;
    case "architecture":
      return <AccountBalanceIcon {...iconProps} />;
    case "it":
      return <ComputerIcon {...iconProps} />;
    case "business":
      return <BusinessIcon {...iconProps} />;
    case "science":
      return <ScienceIcon {...iconProps} />;
    default:
      return <SchoolIcon {...iconProps} />;
  }
};

export default function ModuleSelector({
  isOpen,
  onClose,
  onAddModule,
  addedModuleIds,
}: ModuleSelectorProps) {
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(true);
  const [selections, setSelections] = useState<string[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Fetch hierarchy on mount
  useEffect(() => {
    if (isOpen && !hierarchy) {
      fetchHierarchy();
    }
  }, [isOpen, hierarchy]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelections([]);
      setModules([]);
    }
  }, [isOpen]);

  const fetchHierarchy = async () => {
    setLoadingHierarchy(true);
    try {
      const res = await fetch("/api/hierarchy");
      if (res.ok) {
        const data = await res.json();
        setHierarchy(data);
      }
    } catch (err) {
      console.error("Failed to fetch hierarchy:", err);
    } finally {
      setLoadingHierarchy(false);
    }
  };

  // Navigate through the hierarchy based on current selections
  const getCurrentNode = useCallback(() => {
    if (!hierarchy) return null;
    
    let node = hierarchy;
    
    for (const sel of selections) {
      if (node.children && node.children[sel]) {
        node = node.children[sel];
      } else if (node[sel]) {
        node = node[sel];
      } else {
        return null;
      }
    }
    
    return node;
  }, [hierarchy, selections]);

  // Get current options to display (sorted by order property if present)
  const getCurrentOptions = useCallback((): { id: string; name: string; icon?: string; order?: number }[] => {
    if (!hierarchy) return [];
    
    if (selections.length === 0) {
      // Root level - show faculties
      const options = Object.entries(hierarchy).map(([id, node]: [string, HierarchyData]) => ({
        id,
        name: node.name,
        icon: node.icon,
        order: node.order ?? 999,
      }));
      // Sort by order property
      return options.sort((a, b) => a.order - b.order);
    }
    
    const currentNode = getCurrentNode();
    if (!currentNode || !currentNode.children) return [];
    
    const options = Object.entries(currentNode.children).map(([id, node]: [string, HierarchyData]) => ({
      id,
      name: node.name,
      icon: node.icon,
      order: node.order ?? 999,
    }));
    // Sort by order property
    return options.sort((a, b) => a.order - b.order);
  }, [hierarchy, selections, getCurrentNode]);

  // Get the current level label
  const getCurrentLevelLabel = useCallback((): string => {
    if (!hierarchy || selections.length === 0) return "Faculty";
    
    // Get the faculty node (first selection)
    const facultyNode = hierarchy[selections[0]];
    if (facultyNode && facultyNode.levels) {
      const levelIndex = selections.length - 1;
      if (levelIndex < facultyNode.levels.length) {
        return facultyNode.levels[levelIndex];
      }
    }
    
    return "Selection";
  }, [hierarchy, selections]);

  // Check if current node has modules (final level)
  const hasModules = useCallback((): boolean => {
    const currentNode = getCurrentNode();
    return currentNode !== null && Array.isArray(currentNode.modules);
  }, [getCurrentNode]);

  // Fetch modules when we reach a node with modules
  useEffect(() => {
    const fetchModulesForNode = async () => {
      const currentNode = getCurrentNode();
      if (currentNode && currentNode.modules && currentNode.modules.length > 0) {
        setLoadingModules(true);
        try {
          const ids = currentNode.modules.join(",");
          const res = await fetch(`/api/modules-by-ids?ids=${ids}`);
          if (res.ok) {
            const data = await res.json();
            setModules(data);
          }
        } catch (err) {
          console.error("Failed to fetch modules:", err);
        } finally {
          setLoadingModules(false);
        }
      }
    };
    
    if (hasModules()) {
      fetchModulesForNode();
    } else {
      setModules([]);
    }
  }, [selections, getCurrentNode, hasModules]);

  // Get breadcrumb trail
  const getBreadcrumb = useCallback((): { id: string; name: string }[] => {
    if (!hierarchy) return [];
    
    const trail: { id: string; name: string }[] = [];
    let node = hierarchy;
    
    for (const sel of selections) {
      if (node.children && node.children[sel]) {
        trail.push({ id: sel, name: node.children[sel].name });
        node = node.children[sel];
      } else if (node[sel]) {
        trail.push({ id: sel, name: node[sel].name });
        node = node[sel];
      }
    }
    
    return trail;
  }, [hierarchy, selections]);

  const handleSelect = (id: string) => {
    setSelections((prev) => [...prev, id]);
  };

  const handleBack = () => {
    if (selections.length > 0) {
      setSelections((prev) => prev.slice(0, -1));
      setModules([]);
    }
  };

  const currentOptions = getCurrentOptions();
  const breadcrumb = getBreadcrumb();
  const showModules = hasModules();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden sm:mx-4"
      >
        {/* Header - matching main theme */}
        <div className="bg-gradient-to-r from-blue-100 via-purple-200 to-blue-500 text-gray-800 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              {selections.length > 0 && (
                <button 
                  onClick={handleBack} 
                  className="p-1.5 sm:p-2 hover:bg-white/30 rounded-lg active:bg-white/40 transition-colors"
                >
                  <ArrowBackIcon sx={{ fontSize: 24 }} />
                </button>
              )}
              <h2 className="text-base sm:text-xl font-bold text-gray-800">Add Modules</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 hover:bg-white/30 rounded-lg active:bg-white/40 transition-colors"
            >
              <CloseIcon sx={{ fontSize: 24 }} />
            </button>
          </div>

          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div className="mt-2 text-xs sm:text-sm text-gray-700 flex items-center flex-wrap gap-1 overflow-x-auto">
              {breadcrumb.map((item, index) => (
                <span key={item.id} className="flex items-center whitespace-nowrap">
                  {index > 0 && <span className="mx-1 text-gray-500">→</span>}
                  <Chip
                    label={item.name}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.7)",
                      fontSize: "0.75rem",
                      height: 24,
                    }}
                  />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh] bg-gradient-to-br from-blue-50 to-indigo-50">
          {loadingHierarchy ? (
            <div className="flex justify-center py-12">
              <CircularProgress sx={{ color: "#8b5cf6" }} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Options Selection */}
              {!showModules && currentOptions.length > 0 && (
                <motion.div
                  key={`level-${selections.length}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                    Select {selections.length === 0 ? "Faculty" : getCurrentLevelLabel()}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {currentOptions.map((opt) => (
                      <Card
                        key={opt.id}
                        sx={{
                          borderRadius: 3,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            boxShadow: "0 4px 16px rgba(99, 102, 241, 0.2)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <CardActionArea
                          onClick={() => handleSelect(opt.id)}
                          sx={{ p: 2 }}
                        >
                          <div className="flex items-center space-x-3">
                            {selections.length === 0 ? (
                              getFacultyIcon(opt.id)
                            ) : (
                              <FolderIcon sx={{ fontSize: 28, color: "#8b5cf6" }} />
                            )}
                            <span className="font-medium text-gray-800 text-sm sm:text-base">
                              {opt.name}
                            </span>
                          </div>
                        </CardActionArea>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Modules List */}
              {showModules && (
                <motion.div
                  key="modules"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                    Select Modules
                  </h3>

                  {loadingModules ? (
                    <div className="flex justify-center py-12">
                      <CircularProgress sx={{ color: "#8b5cf6" }} />
                    </div>
                  ) : modules.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-gray-500">
                      <SentimentDissatisfiedIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }} />
                      <p className="text-sm sm:text-base">No modules found for this selection.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {modules.map((m) => {
                        const isAdded = addedModuleIds.has(m.module_id);
                        return (
                          <Card
                            key={m.module_id}
                            sx={{
                              borderRadius: 3,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            }}
                          >
                            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 mr-3">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-semibold text-indigo-600 text-sm sm:text-base">
                                      {m.module.code}
                                    </span>
                                    {m.video_count !== undefined && (
                                      <Chip
                                        label={`${m.video_count} videos`}
                                        size="small"
                                        sx={{
                                          backgroundColor: "#e0e7ff",
                                          color: "#4f46e5",
                                          fontSize: "0.7rem",
                                          height: 22,
                                        }}
                                      />
                                    )}
                                  </div>
                                  <p className="text-gray-700 text-sm truncate">{m.module.name}</p>
                                </div>
                                <Button
                                  variant={isAdded ? "outlined" : "contained"}
                                  size="small"
                                  onClick={() => onAddModule(m)}
                                  disabled={isAdded}
                                  startIcon={isAdded ? <CheckIcon /> : <AddIcon />}
                                  sx={{
                                    flexShrink: 0,
                                    borderRadius: 2,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    ...(isAdded
                                      ? {
                                          borderColor: "#10b981",
                                          color: "#10b981",
                                          "&.Mui-disabled": {
                                            borderColor: "#10b981",
                                            color: "#10b981",
                                          },
                                        }
                                      : {
                                          background: "linear-gradient(to right, #8b5cf6, #6366f1)",
                                          "&:hover": {
                                            background: "linear-gradient(to right, #7c3aed, #4f46e5)",
                                          },
                                        }),
                                  }}
                                >
                                  {isAdded ? "Added" : "Add to Dashboard"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-white">
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            {showModules
              ? `${modules.length} modules found`
              : `Step ${selections.length + 1}`}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
