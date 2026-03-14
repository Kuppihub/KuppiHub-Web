"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authPost } from "@/lib/auth-fetch";
import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import NewTutorCard from "./components/NewTutorCard";
import {
  PageHeader,
  InfoCard,
  ModuleSearch,
  LinkSection,
  FormFields,
  FormData,
  ModuleSearchResult,
  LinkCategory,
  generateId,
  initialFormData,
} from "./components";

export default function AddKuppiPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");
  
  // Module search state
  const [moduleSearch, setModuleSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<ModuleSearchResult | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Handle module selection
  const handleModuleSelect = (module: ModuleSearchResult) => {
    setSelectedModule(module);
    setFormData(prev => ({ ...prev, moduleId: module.id, moduleCode: module.code }));
  };

  // Handle module clear
  const handleModuleClear = () => {
    setSelectedModule(null);
    setFormData(prev => ({ ...prev, moduleId: null, moduleCode: "" }));
  };

  // Add link to a category
  const addLink = (category: LinkCategory) => {
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], { id: generateId(), url: "" }],
    }));
  };

  // Remove link from a category
  const removeLink = (category: LinkCategory, id: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter(link => link.id !== id),
    }));
  };

  // Update link URL
  const updateLink = (category: LinkCategory, id: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map(link => link.id === id ? { ...link, url } : link),
    }));
  };

  // Handle form field updates
  const handleFormChange = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const openErrorDialog = (message: string) => {
    setSubmitStatus({ type: "error", message });
    setErrorDialogMessage(message);
    setShowErrorDialog(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);
    setShowErrorDialog(false);

    // Validation
    if (!formData.moduleId) {
      openErrorDialog("Please select a module");
      return;
    }
    if (!formData.title.trim()) {
      openErrorDialog("Please enter a title");
      return;
    }
    if (!formData.description.trim()) {
      openErrorDialog("Please enter a description");
      return;
    }

    // Filter out empty links
    const youtubeLinks = formData.youtubeLinks.filter(l => l.url.trim()).map(l => l.url.trim());
    const telegramLinks = formData.telegramLinks.filter(l => l.url.trim()).map(l => l.url.trim());
    const gdriveLinks = formData.gdriveLinks.filter(l => l.url.trim()).map(l => l.url.trim());
    const onedriveLinks = formData.onedriveLinks.filter(l => l.url.trim()).map(l => l.url.trim());
    const materialLinks = formData.materialLinks.filter(l => l.url.trim()).map(l => l.url.trim());

    // Must have at least one link
    if (youtubeLinks.length === 0 && telegramLinks.length === 0 && gdriveLinks.length === 0 && onedriveLinks.length === 0 && materialLinks.length === 0) {
      openErrorDialog("Please add at least one video or material link");
      return;
    }

    // Validate domain restriction
    if (formData.hasRestriction && formData.allowedDomains.length === 0) {
      openErrorDialog("Please select at least one domain or disable the restriction");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use authenticated request with Firebase ID token
      const response = await authPost("/api/add-kuppi", {
        module_id: formData.moduleId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        language_code: formData.languageCode,
        index_no: formData.indexNo.trim() || null,
        is_kuppi: formData.isKuppi,
        youtube_links: youtubeLinks,
        telegram_links: telegramLinks.length > 0 ? telegramLinks : null,
        gdrive_cloud_video_urls: gdriveLinks.length > 0 ? gdriveLinks : null,
        onedrive_cloud_video_urls: onedriveLinks.length > 0 ? onedriveLinks : null,
        material_urls: materialLinks.length > 0 ? materialLinks : null,
        // Domain restriction - null means public, array means restricted
        allowed_domains: formData.hasRestriction && formData.allowedDomains.length > 0 
          ? formData.allowedDomains 
          : null,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }

      setSubmitStatus({ type: "success", message: "Your Kuppi has been submitted successfully! It will be reviewed and published soon." });
      setShowSuccessDialog(true);
      setFormData(initialFormData);
      setSelectedModule(null);
      setModuleSearch("");
    } catch (error) {
      openErrorDialog(error instanceof Error ? error.message : "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <CircularProgress sx={{ color: "#6366f1" }} />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return null;
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
  };
  const handleErrorDialogClose = () => {
    setShowErrorDialog(false);
  };

  return (
    <div className="min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <PageHeader />

        {/* Info Card */}
        <InfoCard />

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card sx={{ borderRadius: { xs: 3, sm: 4 }, boxShadow: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Status Messages */}
                <AnimatePresence>
                  {submitStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert 
                        severity={submitStatus.type === "success" ? "success" : "error"}
                        sx={{ borderRadius: 2 }}
                      >
                        {submitStatus.message}
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Module Selection */}
                <ModuleSearch
                  value={moduleSearch}
                  selectedModule={selectedModule}
                  onSearch={setModuleSearch}
                  onSelect={handleModuleSelect}
                  onClear={handleModuleClear}
                />

                {/* Form Fields */}
                <FormFields formData={formData} onChange={handleFormChange} />

                {/* Divider */}
                <Divider sx={{ my: { xs: 2, sm: 3 } }}>
                  <span className="text-xs sm:text-sm text-gray-500 px-2">Video & Material Links</span>
                </Divider>

                <p className="text-xs sm:text-sm text-gray-500 -mt-2 mb-3">
                  Add at least one link. You can add multiple links of each type.
                </p>

                {/* Link Sections */}
                <div className="space-y-3 sm:space-y-4">
                  <LinkSection
                    type="youtube"
                    links={formData.youtubeLinks}
                    onAdd={() => addLink("youtubeLinks")}
                    onRemove={(id) => removeLink("youtubeLinks", id)}
                    onUpdate={(id, url) => updateLink("youtubeLinks", id, url)}
                  />

                  <LinkSection
                    type="telegram"
                    links={formData.telegramLinks}
                    onAdd={() => addLink("telegramLinks")}
                    onRemove={(id) => removeLink("telegramLinks", id)}
                    onUpdate={(id, url) => updateLink("telegramLinks", id, url)}
                  />

                  <LinkSection
                    type="gdrive"
                    links={formData.gdriveLinks}
                    onAdd={() => addLink("gdriveLinks")}
                    onRemove={(id) => removeLink("gdriveLinks", id)}
                    onUpdate={(id, url) => updateLink("gdriveLinks", id, url)}
                  />

                  <LinkSection
                    type="onedrive"
                    links={formData.onedriveLinks}
                    onAdd={() => addLink("onedriveLinks")}
                    onRemove={(id) => removeLink("onedriveLinks", id)}
                    onUpdate={(id, url) => updateLink("onedriveLinks", id, url)}
                  />

                  <LinkSection
                    type="material"
                    links={formData.materialLinks}
                    onAdd={() => addLink("materialLinks")}
                    onRemove={(id) => removeLink("materialLinks", id)}
                    onUpdate={(id, url) => updateLink("materialLinks", id, url)}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2 sm:pt-4">
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                    sx={{
                      py: { xs: 1.25, sm: 1.5 },
                      background: "linear-gradient(to right, #3b82f6, #6366f1)",
                      borderRadius: 3,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                      boxShadow: 2,
                      "&:hover": {
                        background: "linear-gradient(to right, #2563eb, #4f46e5)",
                        boxShadow: 4,
                      },
                      "&:disabled": {
                        background: "#9ca3af",
                      },
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Kuppi"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <NewTutorCard />

        {/* Back Link */}
        <div className="text-center mt-4 sm:mt-6">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-xs sm:text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 60,
                color: "#10b981",
                mb: 2,
              }}
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-gray-800 mb-1"
          >
            Added Successfully!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-600 mb-4"
          >
            Your kuppi has been submitted and will be reviewed soon.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleSuccessDialogClose}
              variant="contained"
              sx={{
                background: "linear-gradient(to right, #3b82f6, #6366f1)",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 4,
              }}
            >
              Done
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={showErrorDialog}
        onClose={handleErrorDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 60,
                color: "#ef4444",
                mb: 2,
              }}
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-gray-800 mb-1"
          >
            Something Went Wrong
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-gray-600 mb-4"
          >
            {errorDialogMessage || "Failed to submit. Please try again."}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleErrorDialogClose}
              variant="contained"
              sx={{
                background: "linear-gradient(to right, #ef4444, #f97316)",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 4,
                "&:hover": {
                  background: "linear-gradient(to right, #dc2626, #ea580c)",
                },
              }}
            >
              Close
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
