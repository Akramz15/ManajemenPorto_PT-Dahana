export const formatRupiah = (
  value: number | null | undefined,
  abbreviated = false,
): string => {
  if (value === null || value === undefined) return "N/A";

  if (abbreviated) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `Rp ${(value / 1e12).toFixed(1)}T`;
    if (abs >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}M`;
    if (abs >= 1e6) return `Rp ${(value / 1e6).toFixed(1)}Jt`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPersen = (
  value: number | null | undefined,
  decimals = 1,
): string => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
};

export const formatTon = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return `${value.toLocaleString("id-ID")} Ton`;
};

export const formatRibu = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "N/A";
  return value.toLocaleString("id-ID");
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
};

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
