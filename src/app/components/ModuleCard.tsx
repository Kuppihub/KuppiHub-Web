"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Box,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import CloseIcon from "@mui/icons-material/Close";

export interface ModuleData {
  module_id: number;
  module: { code: string; name: string; description: string };
  faculty?: { name: string };
  department?: { name: string };
  semester?: { name: string };
  video_count?: number;
}

interface ModuleCardProps {
  moduleData: ModuleData;
  index: number;
  editMode: boolean;
  onRemove: (moduleId: number) => void;
  onRemoveWithEvent: (e: React.MouseEvent, moduleId: number) => void;
  onClick: (moduleId: number) => void;
}

export default function ModuleCard({
  moduleData,
  index,
  editMode,
  onRemove,
  onRemoveWithEvent,
  onClick,
}: ModuleCardProps) {
  const m = moduleData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      style={{ height: "100%" }}
    >
      <Card
        variant="outlined"
        sx={{
          height: "100%",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.4)",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.12))",
          backdropFilter: "blur(20px) saturate(160%)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:hover": editMode
            ? {}
            : {
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.18))",
                borderColor: "rgba(255, 255, 255, 0.55)",
                boxShadow: "0 12px 40px 0 rgba(31, 38, 135, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
                transform: "translateY(-4px) scale(1.01)",
              },
        }}
      >
        <CardActionArea
          onClick={() => {
            if (editMode) {
              onRemove(m.module_id);
              return;
            }
            onClick(m.module_id);
          }}
          sx={{ height: "100%", alignItems: "stretch" }}
        >
          <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%" }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: editMode ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                  color: editMode ? "#dc2626" : "#1d4ed8",
                  border: "1px solid",
                  borderColor: editMode ? "rgba(239, 68, 68, 0.25)" : "rgba(59, 130, 246, 0.25)",
                  boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(4px)",
                  flexShrink: 0,
                }}
              >
                <SchoolIcon />
              </Box>

              {editMode ? (
                <IconButton
                  component="span"
                  aria-label="remove module"
                  onClick={(e) => onRemoveWithEvent(e, m.module_id)}
                  size="small"
                  sx={{ color: "error.main" }}
                >
                  <CloseIcon />
                </IconButton>
              ) : (
                <Chip
                  label={`${m.video_count || 0} videos`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  mt: 2,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: "text.primary",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {m.module.code} - {m.module.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  minHeight: 48,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {m.module.description}
              </Typography>
            </Box>

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {m.semester?.name || m.department?.name || ""}
              </Typography>
              {!editMode ? (
                <Typography variant="caption" color="primary.main" fontWeight={700}>
                  View
                </Typography>
              ) : (
                <Typography variant="caption" color="error.main" fontWeight={700}>
                  Tap to remove
                </Typography>
              )}
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
}
