"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore, UserType } from "@/context/StoreContext";
import {
  ShoppingBag,
  User,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function MasukPage() {
  const router = useRouter();
  const { setCurrentUser, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg("Email dan kata sandi wajib diisi");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Email atau kata sandi tidak valid");
      }

      const userData = json.data.user;
      const loggedInUser: UserType = {
        id: userData.id,
        name: userData.profile?.name || userData.email.split("@")[0],
        email: userData.email,
        phone: userData.phone || "",
        role: userData.role,
        addressLine: userData.addresses?.[0]?.addressLine || "",
        district: userData.addresses?.[0]?.district || "Kramat Jati",
        city: userData.addresses?.[0]?.city || "Jakarta Timur",
      };

      setCurrentUser(loggedInUser);
      showToast(`Selamat datang kembali, ${loggedInUser.name}!`, "success");

      if (userData.role === "CASHIER") {
        router.push("/admin/kasir");
      } else if (userData.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <img
          src="/logo.png"
          alt="Toko Saudara"
          className="w-14 h-14 object-contain mx-auto drop-shadow-sm"
        />
        <h1 className="text-2xl font-black text-saudara-green-900 tracking-tight">
          Masuk ke Toko Saudara
        </h1>
        <p className="text-xs text-gray-500">
          Belanja sayur segar subuh dan sembako berkualitas langsung ke rumah Anda.
        </p>
      </div>

      {/* Guest Shopping Option Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-emerald-950 space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-extrabold text-xs">Mau Langsung Belanja Tanpa Akun?</span>
        </div>
        <p className="text-xs text-emerald-900 leading-relaxed">
          Toko Saudara <b>tidak mewajibkan Anda mendaftar atau membuat akun</b>. Anda bisa langsung memilih belanjaan dan cukup mengisi alamat di formulir checkout!
        </p>
        <Link
          href="/kategori"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-900 transition shadow-2xs"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Mulai Belanja Langsung <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Standard Login Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saudara-cream-200 shadow-xs space-y-6">
        <div>
          <h2 className="font-bold text-sm text-stone-900">Masuk Akun Terdaftar / Admin</h2>
          <p className="text-[11px] text-stone-400">Gunakan akun yang telah didaftarkan sebelumnya</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Alamat Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
                required
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Kata Sandi</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
                required
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="market-btn-primary w-full py-3 text-sm font-bold shadow-md shadow-saudara-green-700/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Akun"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-saudara-cream-100 text-xs text-gray-500">
          Belum punya akun? Anda bisa{" "}
          <Link href="/kategori" className="text-saudara-green-800 font-bold hover:underline">
            Langsung Belanja
          </Link>{" "}
          atau{" "}
          <Link href="/daftar" className="text-saudara-orange-700 font-bold hover:underline">
            Daftar Akun Baru
          </Link>
        </div>
      </div>
    </div>
  );
}
