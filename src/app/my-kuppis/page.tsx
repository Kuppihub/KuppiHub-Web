"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authGet, authPatch, authPut } from "@/lib/auth-fetch";
import CircularProgress from "@mui/material/CircularProgress";
import Preloader from "../components/Preloader";
import {
  KuppiHeader,
  EmptyState,
  KuppiCard,
  EditDialog,
  Kuppi,
  EditFormState,
} from "./components";

export default function MyKuppisPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [kuppis, setKuppis] = useState<Kuppi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit modal state
  const [editingKuppi, setEditingKuppi] = useState<Kuppi | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Fetch user's kuppis
  useEffect(() => {
    const fetchMyKuppis = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        // Use authenticated GET request
        const res = await authGet("/api/my-kuppis");
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch kuppis");
        }
        
        setKuppis(data.data || []);
      } catch (err) {
        console.error("Error fetching kuppis:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch kuppis");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchMyKuppis();
    }
  }, [user, authLoading]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Toggle visibility
  const handleToggleVisibility = async (kuppiId: number) => {
    if (!user?.uid) return;
    
    setTogglingId(kuppiId);
    try {
      // Use authenticated PATCH request
      const res = await authPatch("/api/my-kuppis", {
        video_id: kuppiId,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle visibility");
      }
      
      // Update local state
      setKuppis(prev => prev.map(k => 
        k.id === kuppiId ? { ...k, is_hidden: !k.is_hidden } : k
      ));
    } catch (err) {
      console.error("Error toggling visibility:", err);
      alert(err instanceof Error ? err.message : "Failed to toggle visibility");
    } finally {
      setTogglingId(null);
    }
  };

  // Save edit
  const handleSaveEdit = async (form: EditFormState) => {
    if (!user?.uid || !editingKuppi) return;
    
    // Filter out empty links
    const cleanedLinks = {
      youtube_links: form.youtube_links.filter(l => l.trim()),
      telegram_links: form.telegram_links.filter(l => l.trim()),
      gdrive_cloud_video_urls: form.gdrive_cloud_video_urls.filter(l => l.trim()),
      onedrive_cloud_video_urls: form.onedrive_cloud_video_urls.filter(l => l.trim()),
      material_urls: form.material_urls.filter(l => l.trim()),
    };

    // Check if at least one link exists
    const hasLinks = Object.values(cleanedLinks).some(arr => arr.length > 0);
    if (!hasLinks) {
      alert("At least one link is required");
      return;
    }
    
    setSaving(true);
    try {
      // Use authenticated PUT request
      const res = await authPut("/api/my-kuppis", {
        video_id: editingKuppi.id,
        title: form.title,
        description: form.description,
        ...cleanedLinks,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to update kuppi");
      }
      
      // Update local state
      setKuppis(prev => prev.map(k => 
        k.id === editingKuppi.id 
          ? { 
              ...k, 
              title: form.title, 
              description: form.description,
              ...cleanedLinks,
            } 
          : k
      ));
      
      setEditingKuppi(null);
    } catch (err) {
      console.error("Error updating kuppi:", err);
      alert(err instanceof Error ? err.message : "Failed to update kuppi");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return <Preloader />;
  }

  // Not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <KuppiHeader />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!error && kuppis.length === 0 && <EmptyState />}

        {/* Kuppis List */}
        <div className="space-y-3 sm:space-y-4">
          {kuppis.map((kuppi, index) => (
            <KuppiCard
              key={kuppi.id}
              kuppi={kuppi}
              index={index}
              togglingId={togglingId}
              onToggleVisibility={handleToggleVisibility}
              onEdit={setEditingKuppi}
            />
          ))}
        </div>

        {/* Stats */}
        {kuppis.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500"
          >
            {kuppis.length} kuppi{kuppis.length !== 1 ? "s" : ""} total • 
            {kuppis.filter(k => k.is_hidden).length} hidden
          </motion.div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditDialog
        kuppi={editingKuppi}
        open={!!editingKuppi}
        saving={saving}
        onClose={() => setEditingKuppi(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
