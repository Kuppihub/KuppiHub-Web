"use client";

import React, { memo } from "react";
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
  editMode: boolean;
  onRemove: (moduleId: number) => void;
  onRemoveWithEvent: (e: React.MouseEvent, moduleId: number) => void;
  onClick: (moduleId: number) => void;
}

export default memo(function ModuleCard({
  moduleData,
  editMode,
  onRemove,
  onRemoveWithEvent,
  onClick,
}: ModuleCardProps) {
  const m = moduleData;

  return (
    <div className="cv-card" style={{ height: "100%" }}>
      <Card
        variant="outlined"
        sx={{
          height: "100%",
          minHeight: 140,
          borderRadius: 3,
          border: "1px solid #c7d2fe",
          background: "#ffffff",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          boxShadow: "0 4px 6px -1px rgba(49, 46, 129, 0.08), 0 10px 20px -4px rgba(49, 46, 129, 0.12)",
          overflow: "hidden",
          transition: "box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease",
          "@media (hover: hover) and (pointer: fine)": {
            "&:hover": editMode
              ? {}
              : {
                  borderColor: "#a5b4fc",
                  boxShadow: "0 8px 12px -2px rgba(49, 46, 129, 0.1), 0 16px 28px -6px rgba(49, 46, 129, 0.16)",
                  transform: "translateY(-3px)",
                },
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
                  bgcolor: editMode ? "#fee2e2" : "#eef2ff",
                  color: editMode ? "#dc2626" : "#4338ca",
                  border: "1px solid",
                  borderColor: editMode ? "#fecaca" : "#c7d2fe",
                  boxShadow: "none",
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none",
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
              {editMode ? (
                <Typography variant="caption" color="error.main" fontWeight={700}>
                  Tap to remove
                </Typography>
              ) : null}
            </Stack>
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
});
