"use client";

import { motion } from "framer-motion";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import PersonAddIcon from "@mui/icons-material/PersonAdd";

export default function NewTutorCard() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
            borderRadius: 4,
            p: { xs: 2, sm: 2.5 },
            mb: { xs: 4, sm: 5 },
            mt: { xs: 3, sm: 4 },
            mx: { xs: 1, sm: 2 },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PersonAddIcon sx={{ color: "white", fontSize: { xs: 24, sm: 28 } }} />
            <Box>
              <p className="text-white font-semibold text-sm sm:text-base">
                Want to be featured as a Tutor?
              </p>
              <p className="text-white/80 text-xs sm:text-sm">
                Fill out the form to add your profile to our Tutors section
              </p>
            </Box>
          </Box>
          <Button
            variant="contained"
            href="https://forms.gle/zasMHhtQgLnuVjgs7"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.95))",
              backdropFilter: "blur(8px)",
              color: "#5b21b6",
              fontWeight: 700,
              px: { xs: 2.5, sm: 3.5 },
              py: 1.2,
              borderRadius: 999,
              textTransform: "none",
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px 0 rgba(102, 126, 234, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.5)",
              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              "&:hover": {
                background: "#ffffff",
                transform: "scale(1.04) translateY(-1px)",
                boxShadow: "0 6px 20px 0 rgba(102, 126, 234, 0.4)",
              },
            }}
          >
            Fill Tutor Form
          </Button>
        </Box>
      </motion.div>
    </>
  );
}
