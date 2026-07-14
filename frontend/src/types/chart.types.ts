export interface KurvaSPoint {
  periode: string;
  rencana: number | null;
  realisasi: number | null;
}

export interface FinancialPoint {
  periode: string;
  penjualan: number;
  hpp: number;
  laba_kotor?: number;
  laba_bersih?: number;
}

export interface CashFlowPoint {
  periode: string;
  cfo_terima: number;
  cfo_keluar: number;
  cfi_terima: number;
  cfi_keluar: number;
  cff_terima: number;
  cff_keluar: number;
  saldo?: number | null;
}

export interface RKAPPoint {
  periode: string;
  rkap: number;
  realisasi: number;
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface InventoriPoint {
  periode: string;
  stok_awal: number;
  produksi: number;
  pengeluaran: number;
  stok_akhir: number;
}

export interface BubblePoint {
  id: string;
  nama: string;
  roi_persen: number;
  risiko_score: number;
  nilai_investasi: number;
  status: "aktif" | "prospek" | "ditangguhkan";
}

export interface ChartDataResponse {
  context: string;
  sub_context?: string;
  data_json: Record<string, unknown>;
  created_at: string;
}
