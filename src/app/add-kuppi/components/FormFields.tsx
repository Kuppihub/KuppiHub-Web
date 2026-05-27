"use client";

import { useState } from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import { FormData, DOMAIN_OPTIONS } from "./types";

interface FormFieldsProps {
  formData: FormData;
  onChange: (updates: Partial<FormData>) => void;
  tutors?: { id: number; name: string }[];
}

export default function FormFields({ formData, onChange, tutors = [] }: FormFieldsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredTutors = formData.studentName.trim() === "" 
    ? [] 
    : (tutors || []).filter(t => 
        t.name.toLowerCase().includes(formData.studentName.toLowerCase()) &&
        t.name.toLowerCase() !== formData.studentName.toLowerCase()
      );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, sm: 3 } }}>
      {/* Title */}
      <TextField
        fullWidth
        required
        label="Title"
        value={formData.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="e.g., Applied Statistics Kuppi 01 EE"
        inputProps={{ maxLength: 200 }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      />

      {/* Description */}
      <TextField
        fullWidth
        required
        label="Description"
        multiline
        rows={3}
        value={formData.description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder={`📔 Sections Covered :

Bernoulli Distribution
Geometric Distribution
Binomial Distribution
Negative Binomial Distribution
Reliability Function`}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
          },
        }}
      />

      {/* Student Name and Language Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr" }, gap: { xs: 2.5, sm: 3 } }}>
        {/* Student Name with Autocomplete suggestions */}
        <div className="relative">
          <TextField
            fullWidth
            required
            label="Student / Tutor Name"
            value={formData.studentName}
            onChange={(e) => {
              const typedName = e.target.value;
              const matchingTutor = (tutors || []).find(t => t.name.toLowerCase() === typedName.toLowerCase());
              onChange({ 
                studentName: typedName,
                studentId: matchingTutor ? matchingTutor.id : null
              });
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay closing to allow clicking on a suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="e.g., Sangeeth Kariyapperuma"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          {/* Autocomplete Suggestions Box */}
          {showSuggestions && filteredTutors.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 max-h-52 overflow-y-auto bg-white/95 backdrop-blur-md border border-blue-100 shadow-xl rounded-xl z-50 transition-all duration-300">
              <div className="p-1.5 space-y-1">
                <p className="text-[10px] text-blue-900/60 font-bold px-2 py-1 uppercase tracking-wider">Suggested Tutors</p>
                {filteredTutors.map((tutor) => (
                  <button
                    key={tutor.id}
                    type="button"
                    onClick={() => {
                      onChange({
                        studentName: tutor.name,
                        studentId: tutor.id
                      });
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs sm:text-sm text-gray-800 hover:bg-blue-500/10 hover:text-blue-900 rounded-lg transition-all duration-200 cursor-pointer font-medium"
                  >
                    {tutor.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Language */}
        <FormControl fullWidth>
          <InputLabel>Language</InputLabel>
          <Select
            value={formData.languageCode}
            label="Language"
            onChange={(e) => onChange({ languageCode: e.target.value })}
            sx={{
              borderRadius: 2,
            }}
          >
            <MenuItem value="si">Sinhala</MenuItem>
            <MenuItem value="ta">Tamil</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Access Restriction */}
      <Box 
        sx={{ 
          border: "1px solid",
          borderColor: formData.hasRestriction ? "primary.main" : "grey.300",
          borderRadius: 2,
          p: { xs: 2, sm: 2.5 },
          bgcolor: formData.hasRestriction ? "primary.50" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.hasRestriction}
              onChange={(e) => {
                onChange({ 
                  hasRestriction: e.target.checked,
                  allowedDomains: e.target.checked ? formData.allowedDomains : []
                });
              }}
              sx={{ color: "primary.main" }}
            />
          }
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {formData.hasRestriction ? (
                <LockIcon sx={{ fontSize: 20, color: "primary.main" }} />
              ) : (
                <PublicIcon sx={{ fontSize: 20, color: "grey.500" }} />
              )}
              <Typography 
                sx={{ 
                  fontSize: { xs: "0.85rem", sm: "0.9rem" },
                  fontWeight: 500,
                  color: formData.hasRestriction ? "primary.main" : "grey.700"
                }}
              >
                Restrict access to specific email domains
              </Typography>
            </Box>
          }
        />
        
        {formData.hasRestriction && (
          <Box sx={{ mt: 2, pl: { xs: 0, sm: 4 } }}>
            <Typography 
              sx={{ 
                fontSize: { xs: "0.75rem", sm: "0.8rem" }, 
                color: "grey.600",
                mb: 1.5 
              }}
            >
              Select which email domains can view this content:
            </Typography>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {DOMAIN_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      size="small"
                      checked={formData.allowedDomains.includes(option.value)}
                      onChange={(e) => {
                        const newDomains = e.target.checked
                          ? [...formData.allowedDomains, option.value]
                          : formData.allowedDomains.filter(d => d !== option.value);
                        onChange({ allowedDomains: newDomains });
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" } }}>
                      {option.label}
                    </Typography>
                  }
                />
              ))}
            </Box>

            {formData.allowedDomains.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography 
                  sx={{ 
                    fontSize: { xs: "0.7rem", sm: "0.75rem" }, 
                    color: "grey.500",
                    mb: 1 
                  }}
                >
                  Selected domains:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {formData.allowedDomains.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => {
                        onChange({ 
                          allowedDomains: formData.allowedDomains.filter(d => d !== domain) 
                        });
                      }}
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {formData.hasRestriction && formData.allowedDomains.length === 0 && (
              <Typography 
                sx={{ 
                  fontSize: { xs: "0.7rem", sm: "0.75rem" }, 
                  color: "warning.main",
                  mt: 1,
                  fontStyle: "italic"
                }}
              >
                ⚠️ Please select at least one domain, or uncheck the restriction
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
