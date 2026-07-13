import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-center p-4">
      <p className="text-7xl font-black text-slate-200">404</p>
      <h1 className="text-xl font-bold text-slate-800">
        Halaman tidak ditemukan
      </h1>
      <p className="text-sm text-slate-500">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <button onClick={() => navigate("/")} className="btn-primary mt-2">
        Kembali ke Beranda
      </button>
    </div>
  );
}
