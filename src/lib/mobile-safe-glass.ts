/**
 * Mobile-safe glass surfaces: opaque / no blur under `sm`, full glass from `sm+`.
 * Avoids backdrop-filter + multi-layer shadow GPU cost while scrolling on phones.
 */

export const glassPanelSx = {
  background: {
    xs: "rgba(255, 255, 255, 0.94)",
    sm: "linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.15))",
  },
  backdropFilter: { xs: "none", sm: "blur(20px) saturate(160%)" },
  WebkitBackdropFilter: { xs: "none", sm: "blur(20px) saturate(160%)" },
  boxShadow: {
    xs: "0 2px 10px rgba(15, 23, 42, 0.08)",
    sm: "0 8px 32px 0 rgba(31, 38, 135, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
  },
} as const;

export const glassCardSx = {
  background: {
    xs: "rgba(255, 255, 255, 0.94)",
    sm: "linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))",
  },
  backdropFilter: { xs: "none", sm: "blur(20px)" },
  WebkitBackdropFilter: { xs: "none", sm: "blur(20px)" },
  boxShadow: {
    xs: "0 2px 8px rgba(15, 23, 42, 0.08)",
    sm: "0 4px 12px 0 rgba(31, 38, 135, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.25)",
  },
} as const;

export const glassYearPanelSx = {
  background: {
    xs: "rgba(255, 255, 255, 0.94)",
    sm: "linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))",
  },
  backdropFilter: { xs: "none", sm: "blur(15px)" },
  WebkitBackdropFilter: { xs: "none", sm: "blur(15px)" },
  boxShadow: {
    xs: "0 2px 8px rgba(15, 23, 42, 0.06)",
    sm: "0 4px 16px rgba(31, 38, 135, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
  },
} as const;

/** Disable blur under sm; keep desktop blur value. */
export const blurFromSm = (blur: string) =>
  ({
    backdropFilter: { xs: "none", sm: blur },
    WebkitBackdropFilter: { xs: "none", sm: blur },
  }) as const;

/** Hover lift only on fine pointers (skip transform jank on touch). */
export const finePointerHover = (hoverStyles: Record<string, unknown>) =>
  ({
    "@media (hover: hover) and (pointer: fine)": {
      "&:hover": hoverStyles,
    },
  }) as const;
