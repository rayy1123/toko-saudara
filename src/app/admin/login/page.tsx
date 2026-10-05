"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Calculator, UserCheck, Sparkles, RefreshCw } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("pemilik@tokosaudara.id");
  const [password, setPassword] = useState("PemilikSaudara123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function performLogin(targetEmail: string, targetPass: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Gagal melakukan login");
      }

      const role = data.data?.user?.role;
      if (role !== "ADMIN" && role !== "CASHIER") {
        throw new Error("Akun ini tidak memiliki hak akses portal toko");
      }

      if (data.data?.token) {
        localStorage.setItem("admin_token", data.data.token);
      }

      // If cashier, go directly to cashier page
      if (role === "CASHIER") {
        router.push("/admin/kasir");
      } else {
        router.push("/admin");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  const handleQuickOwner = () => {
    setEmail("pemilik@tokosaudara.id");
    setPassword("PemilikSaudara123!");
    performLogin("pemilik@tokosaudara.id", "PemilikSaudara123!");
  };

  const handleQuickCashier = () => {
    setEmail("kasir@tokosaudara.id");
    setPassword("KasirSaudara123!");
    performLogin("kasir@tokosaudara.id", "KasirSaudara123!");
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-stone-200 overflow-hidden space-y-0">
        {/* Header Branding */}
        <div className="bg-emerald-900 p-6 text-white text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white p-1 mx-auto mb-3 shadow-md border border-emerald-700">
            <video
              src="/video-toko-saudara.mp4"
              autoPlay
              loop
              muted
              playsInline
              poster="/logo.png"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h1 className="text-xl font-black tracking-tight">Toko Saudara</h1>
          <p className="text-xs text-emerald-300 font-bold mt-0.5">
            Portal Masuk Pemilik &amp; Kasir Toko
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">
            Kios Toko Saudara Pasar Kramat Jati Jakarta Timur
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick 1-Click Access Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Pilih Akses Cepat (1-Klik Masuk):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Akun Pemilik */}
              <button
                type="button"
                onClick={handleQuickOwner}
                disabled={loading}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-left transition flex items-center gap-2.5 shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-950">Akun Pemilik</div>
                  <div className="text-[10px] text-emerald-700">Akses penuh laporan &amp; laba rugi</div>
                </div>
              </button>

              {/* Akun Kasir */}
              <button
                type="button"
                onClick={handleQuickCashier}
                disabled={loading}
                className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-left transition flex items-center gap-2.5 shadow-2xs group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-blue-950">Akun Kasir</div>
                  <div className="text-[10px] text-blue-700">Catat transaksi &amp; cetak struk</div>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-stone-200"></div>
            <span className="shrink mx-3 text-stone-400 text-[11px]">atau login manual</span>
            <div className="grow border-t border-stone-200"></div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Alamat Email Petugas
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  placeholder="pemilik@tokosaudara.id / kasir@tokosaudara.id"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Memverifikasi Akun...
                </>
              ) : (
                <>
                  Masuk ke Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-stone-100 text-xs text-stone-500">
            <Link href="/" className="text-emerald-800 font-bold hover:underline">
              ← Kembali ke Beranda Toko
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
