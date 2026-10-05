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
  Phone,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function DaftarPage() {
  const router = useRouter();
  const { setCurrentUser, showToast } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMsg("Mohon lengkapi seluruh formulir pendaftaran");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal mendaftarkan akun");
      }

      const userData = json.data.user;
      const newUser: UserType = {
        id: userData.id,
        name: userData.profile?.name || name.trim(),
        email: userData.email,
        phone: userData.phone || phone.trim(),
        role: "CUSTOMER",
        addressLine: "",
        district: "Sukasari",
        city: "Kota Bandung",
      };

      setCurrentUser(newUser);
      showToast(`Selamat datang, ${newUser.name}! Akun Anda berhasil dibuat.`, "success");
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat pendaftaran");
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
          Daftar Akun Pelanggan
        </h1>
        <p className="text-xs text-gray-500">
          Nikmati kemudahan pesan sayur segar subuh langsung diantar ke pagar rumah Anda.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saudara-cream-200 shadow-xs space-y-5">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Nama Lengkap *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rina Wulandari"
                className="w-full pl-9 pr-3.5 py-2.5 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Alamat Email *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rina.wulandari@gmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">No. WhatsApp / HP Aktif *</label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full pl-9 pr-3.5 py-2.5 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
            <p className="text-[10px] text-gray-400">
              Digunakan kurir toko untuk konfirmasi pengantaran belanjaan.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700">Kata Sandi *</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3.5 py-2.5 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 text-xs text-gray-600">
            <ShieldCheck className="w-4 h-4 text-saudara-green-700 shrink-0 mt-0.5" />
            <span>
              Dengan mendaftar, Anda menyetujui ketentuan layanan dan garansi 100% kesegaran Toko Saudara.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="market-btn-orange w-full py-3 text-sm font-bold shadow-md shadow-saudara-orange-600/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Mendaftarkan Akun..." : "Daftar Akun Sekarang"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-saudara-cream-100 text-xs text-gray-500">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="text-saudara-green-800 font-bold hover:underline">
            Masuk di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}
