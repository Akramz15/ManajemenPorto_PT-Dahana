export const CHART_COLORS = {
  primary: "#3B82F6",
  primaryLight: "#93C5FD",
  positive: "#10B981",
  positiveLight: "#6EE7B7",
  negative: "#F43F5E",
  negativeLight: "#FDA4AF",
  neutral: "#94A3B8",
  neutralLight: "#CBD5E1",
  purple: "#8B5CF6",
  amber: "#F59E0B",
} as const;

export const DONUT_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.positive,
  CHART_COLORS.negative,
  CHART_COLORS.purple,
  CHART_COLORS.amber,
  CHART_COLORS.neutral,
];
