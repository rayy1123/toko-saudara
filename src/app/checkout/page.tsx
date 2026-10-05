"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import {
  MapPin,
  Clock,
  CreditCard,
  CheckCircle,
  Truck,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Info,
  Check,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, appliedPromo, discountAmount, clearCart, showToast, user } = useStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields — Empty by default (no fake demo values), auto-loads from saved local profile or active user
  const [recipientName, setRecipientName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [addressLine, setAddressLine] = useState(user?.addressLine || "");
  const [district, setDistrict] = useState(user?.district || "Kramat Jati");
  const [city] = useState("Jakarta Timur");

  // Step 2: Jadwal Pengantaran (Dilakukan Saat Jam Operasional 15:30 - 06:00 WIB)
  const [deliverySlot, setDeliverySlot] = useState<string>("OPERASIONAL_SORE");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Step 3: Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER">("COD");

  // Load profile from active logged-in user or guest localStorage
  useEffect(() => {
    if (user?.name) {
      setRecipientName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.addressLine) setAddressLine(user.addressLine);
      if (user.district) setDistrict(user.district);
      return;
    }

    try {
      const savedProfile = localStorage.getItem("saudara_guest_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.recipientName) setRecipientName(parsed.recipientName);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.addressLine) setAddressLine(parsed.addressLine);
        if (parsed.district) setDistrict(parsed.district);
      }
    } catch {}
  }, [user]);

  // Shipping Calculation (Area Layanan Kramat Jati Jakarta Timur & Sekitarnya)
  const deliveryAreas: Record<string, number> = {
    "Kramat Jati": 8000,
    "Makasar": 10000,
    "Pasar Rebo": 10000,
    "Jatinegara": 12000,
    "Ciracas": 12000,
  };
  const baseShippingFee = deliveryAreas[district] || 8000;
  const shippingFee = subtotal >= 60000 ? 0 : baseShippingFee;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Stepper handlers
  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!recipientName.trim()) {
        setErrorMsg("Mohon masukkan Nama Penerima");
        return;
      }
      if (!phone.trim() || phone.trim().length < 8) {
        setErrorMsg("Mohon masukkan No. WhatsApp / HP yang aktif untuk konfirmasi pengantaran");
        return;
      }
      if (!addressLine.trim() || addressLine.trim().length < 5) {
        setErrorMsg("Mohon masukkan Alamat Pengiriman lengkap (nama jalan, no. rumah, RT/RW)");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        addressLine: addressLine.trim(),
        district,
        city,
        deliverySlot,
        deliveryNotes: deliveryNotes.trim(),
        paymentMethod,
        items: cart,
        promoCode: appliedPromo?.code,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses pesanan");
      }

      // Save profile in localStorage for next time convenience
      try {
        localStorage.setItem(
          "saudara_guest_profile",
          JSON.stringify({
            recipientName: recipientName.trim(),
            phone: phone.trim(),
            addressLine: addressLine.trim(),
            district,
          })
        );

        // Append to my orders list
        const existing = JSON.parse(localStorage.getItem("saudara_my_orders") || "[]");
        existing.unshift({
          orderNumber: data.order.orderNumber,
          createdAt: new Date().toISOString(),
          grandTotal: data.order.grandTotal,
        });
        localStorage.setItem("saudara_my_orders", JSON.stringify(existing.slice(0, 20)));
      } catch {}

      showToast("Pesanan berhasil dibuat! Struk digital resmi telah diterbitkan.", "success");
      clearCart();

      // Redirect immediately to E-Receipt!
      router.push(`/struk/${data.order.orderNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses pesanan.");
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-saudara-cream-100 flex items-center justify-center mx-auto text-gray-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Keranjang Belanja Anda Kosong</h2>
        <p className="text-xs text-gray-500">
          Belum ada produk di keranjang. Silakan pilih sayur atau sembako segar terlebih dahulu.
        </p>
        <Link href="/kategori" className="market-btn-primary inline-flex text-xs py-2.5 px-5 font-bold">
          Mulai Belanja Segar
        </Link>
      </div>
    );
  }

  const steps = [
    { number: 1, label: "Alamat", icon: MapPin },
    { number: 2, label: "Pengantaran", icon: Clock },
    { number: 3, label: "Pembayaran", icon: CreditCard },
    { number: 4, label: "Ringkasan", icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Link href="/" className="hover:text-saudara-green-800">
          Beranda
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/keranjang" className="hover:text-saudara-green-800">
          Keranjang
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-saudara-green-900 font-bold">Checkout Tanpa Akun</span>
      </nav>

      {/* Guest Checkout Notice Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-900 shadow-xs">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold block text-sm text-emerald-950">
            Belanja Mudah Tanpa Perlu Daftar Akun!
          </span>
          Cukup isi formulir nama, WhatsApp, dan alamat pengantaran di bawah ini. Setelah selesai, struk belanja digital resmi (E-Receipt) akan langsung diterbitkan dan pesanan segera disiapkan.
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-saudara-cream-200 shadow-xs">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-saudara-cream-200 -z-0" />
          {steps.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div key={s.number} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                    isCompleted
                      ? "bg-saudara-green-800 text-white shadow-sm"
                      : isCurrent
                      ? "bg-saudara-orange-600 text-white shadow-md ring-4 ring-saudara-orange-100"
                      : "bg-saudara-cream-100 text-gray-400 border border-saudara-cream-200"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : s.number}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-semibold mt-1.5 ${
                    isCurrent
                      ? "text-saudara-orange-600 font-bold"
                      : isCompleted
                      ? "text-saudara-green-800"
                      : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saudara-cream-200 shadow-xs space-y-6">
        {/* STEP 1: Alamat Penerima */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-saudara-cream-200">
              <MapPin className="w-5 h-5 text-saudara-green-700" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Langkah 1: Identitas & Alamat Pengantaran</h2>
                <p className="text-xs text-gray-500">
                  Kurir Toko Saudara akan mengantarkan pesanan langsung ke depan pagar/pintu rumah Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nama Lengkap Penerima *</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Contoh: Ibu Rina / Pak Budi"
                  className="w-full px-4 py-2.5 rounded-xl border border-saudara-cream-200 focus:border-saudara-green-600 text-sm focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">No. WhatsApp / HP Aktif *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2.5 rounded-xl border border-saudara-cream-200 focus:border-saudara-green-600 text-sm focus:outline-hidden"
                  required
                />
                <p className="text-[11px] text-gray-400">Untuk menerima struk belanja digital & kabar kurir jalan.</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Alamat Lengkap Rumah *</label>
              <textarea
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, gang, atau patokan rumah (misal: pagar hitam depan pos satpam)"
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-saudara-cream-200 focus:border-saudara-green-600 text-sm focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Kecamatan Pengiriman (Jakarta Timur) *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-saudara-cream-200 focus:border-saudara-green-600 text-sm focus:outline-hidden bg-white"
                >
                  <option value="Kramat Jati">Kec. Kramat Jati (Ongkir Rp 8.000)</option>
                  <option value="Makasar">Kec. Makasar (Ongkir Rp 10.000)</option>
                  <option value="Pasar Rebo">Kec. Pasar Rebo (Ongkir Rp 10.000)</option>
                  <option value="Jatinegara">Kec. Jatinegara (Ongkir Rp 12.000)</option>
                  <option value="Ciracas">Kec. Ciracas (Ongkir Rp 12.000)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Kota</label>
                <input
                  type="text"
                  value={city}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-saudara-cream-200 bg-saudara-cream-50 text-gray-600 text-sm"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="market-btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2"
              >
                Lanjut ke Jadwal Pengantaran <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Jadwal Pengantaran Jam Operasional */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-saudara-cream-200">
              <Clock className="w-5 h-5 text-saudara-green-700" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Langkah 2: Jadwal Pengantaran (Jam Operasional)</h2>
                <p className="text-xs text-gray-500">
                  Pengantaran dilakukan saat jam operasional toko: pk 15:30 WIB s/d 06:00 WIB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "OPERASIONAL_SORE",
                  title: "Sore / Malam (Operasional)",
                  time: "16:00 - 21:00 WIB",
                  desc: "Pengantaran sore hingga malam saat jam buka operasional toko.",
                },
                {
                  id: "OPERASIONAL_MALAM",
                  title: "Malam / Dini Hari",
                  time: "21:00 - 02:00 WIB",
                  desc: "Pengantaran malam hari saat pasar ramai beroperasi.",
                },
                {
                  id: "OPERASIONAL_SUBUH",
                  title: "Subuh (Operasional)",
                  time: "02:00 - 06:00 WIB",
                  desc: "Pengantaran subuh sebelum jam operasional tutup (06:00 WIB).",
                },
              ].map((slot) => {
                const isSelected = deliverySlot === slot.id;
                return (
                  <div
                    key={slot.id}
                    onClick={() => setDeliverySlot(slot.id as any)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-saudara-green-800 bg-saudara-green-50/70 ring-2 ring-saudara-green-600/20 shadow-xs"
                        : "border-saudara-cream-200 hover:border-saudara-green-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-saudara-green-950">{slot.title}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-saudara-green-800 bg-saudara-green-800 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="font-bold text-xs text-saudara-orange-600 mb-1">{slot.time}</div>
                    <p className="text-[11px] text-gray-500 leading-snug">{slot.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Catatan Khusus untuk Kurir Toko (Opsional)</label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Contoh: Tolong gantung di pagar / titip satpam / bunyikan bel"
                className="w-full px-4 py-2.5 rounded-xl border border-saudara-cream-200 focus:border-saudara-green-600 text-sm focus:outline-hidden"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-saudara-cream-200">
              <button
                type="button"
                onClick={handleBack}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="market-btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2"
              >
                Lanjut ke Metode Pembayaran <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Metode Pembayaran */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-saudara-cream-200">
              <CreditCard className="w-5 h-5 text-saudara-green-700" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Langkah 3: Pilih Metode Pembayaran</h2>
                <p className="text-xs text-gray-500">
                  Pilih cara bayar yang paling nyaman untuk Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                  paymentMethod === "COD"
                    ? "border-saudara-green-800 bg-saudara-green-50/70 ring-2 ring-saudara-green-600/20 shadow-xs"
                    : "border-saudara-cream-200 hover:border-saudara-green-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-saudara-orange-100 text-saudara-orange-700 flex items-center justify-center font-bold text-xs">
                      COD
                    </div>
                    <span className="font-extrabold text-sm text-gray-900">Bayar di Tempat (COD)</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === "COD"
                        ? "border-saudara-green-800 bg-saudara-green-800 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "COD" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Bayar tunai ke kurir toko saat belanjaan tiba dan Anda periksa kesegarannya. Tanpa repot transfer!
                </p>
              </div>

              <div
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`cursor-pointer p-5 rounded-2xl border transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-saudara-green-800 bg-saudara-green-50/70 ring-2 ring-saudara-green-600/20 shadow-xs"
                    : "border-saudara-cream-200 hover:border-saudara-green-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      TRF
                    </div>
                    <span className="font-extrabold text-sm text-gray-900">Transfer Bank / QRIS</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === "BANK_TRANSFER"
                        ? "border-saudara-green-800 bg-saudara-green-800 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "BANK_TRANSFER" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Transfer via BCA / Mandiri atau scan QRIS Toko Saudara. Nomor rekening akan tampil di struk digital.
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-saudara-cream-200">
              <button
                type="button"
                onClick={handleBack}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="market-btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2"
              >
                Lihat Ringkasan Pesanan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Ringkasan & Konfirmasi Buat Pesanan */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-saudara-cream-200">
              <CheckCircle className="w-5 h-5 text-saudara-green-700" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Langkah 4: Konfirmasi Pesanan Belanja</h2>
                <p className="text-xs text-gray-500">
                  Periksa kembali barang belanjaan dan alamat sebelum pesanan diproses.
                </p>
              </div>
            </div>

            {/* Recipient & Delivery Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-saudara-cream-50 p-4 rounded-2xl border border-saudara-cream-200 space-y-2 text-xs">
                <div className="font-extrabold text-saudara-green-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-saudara-green-700" />
                  Alamat Pengantaran
                </div>
                <div className="font-bold text-gray-900">{recipientName} ({phone})</div>
                <div className="text-gray-600 leading-relaxed">
                  {addressLine}, Kec. {district}, {city}
                </div>
                {deliveryNotes && (
                  <div className="text-saudara-orange-700 bg-saudara-orange-50 p-2 rounded-lg border border-saudara-orange-200 font-medium">
                    Catatan kurir: &quot;{deliveryNotes}&quot;
                  </div>
                )}
              </div>

              <div className="bg-saudara-cream-50 p-4 rounded-2xl border border-saudara-cream-200 space-y-2 text-xs">
                <div className="font-extrabold text-saudara-green-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-saudara-green-700" />
                  Jadwal & Pembayaran
                </div>
                <div className="text-gray-700">
                  <span className="text-gray-500">Waktu Antar:</span>{" "}
                  <span className="font-bold text-saudara-green-900">
                    Pengantaran Jam Operasional (15:30 - 06:00 WIB)
                  </span>
                </div>
                <div className="text-gray-700">
                  <span className="text-gray-500">Pembayaran:</span>{" "}
                  <span className="font-bold text-saudara-orange-700">
                    {paymentMethod === "COD" ? "Bayar di Tempat (COD Tunai)" : "Transfer Bank / QRIS"}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Summary Table */}
            <div className="border border-saudara-cream-200 rounded-2xl overflow-hidden">
              <div className="bg-saudara-cream-100 px-4 py-2 text-xs font-bold text-gray-700 flex justify-between">
                <span>Rincian Barang ({cart.length} macam)</span>
                <span>Subtotal</span>
              </div>
              <div className="divide-y divide-saudara-cream-100 max-h-56 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productUnitId} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{item.name}</span>
                      <span className="text-gray-500 block text-[11px]">
                        {item.quantity} {item.unitName} x {formatRupiah(item.price)}
                      </span>
                    </div>
                    <span className="font-bold text-saudara-green-900">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Totals */}
            <div className="bg-saudara-green-50/50 p-4 rounded-2xl border border-saudara-green-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Belanjaan</span>
                <span className="font-medium text-gray-900">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-saudara-orange-600 font-semibold">
                    <span>Potongan Kupon ({appliedPromo?.code})</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                  {appliedPromo?.itemBreakdowns && appliedPromo.itemBreakdowns.length > 0 && (
                    <div className="pl-2 border-l-2 border-saudara-orange-300 text-[11px] space-y-0.5 text-stone-600">
                      {appliedPromo.itemBreakdowns.map((b) => (
                        <div key={b.productUnitId} className="flex justify-between">
                          <span>
                            {b.productName} ({b.unitName}) x{b.quantity}
                          </span>
                          <span className="font-bold text-saudara-orange-700">
                            -{formatRupiah(b.subtotalDiscount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim Pasar ({district})</span>
                <span className="font-medium text-gray-900">
                  {shippingFee === 0 ? (
                    <span className="text-saudara-green-700 font-bold">GRATIS</span>
                  ) : (
                    formatRupiah(shippingFee)
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-saudara-green-200 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-saudara-green-950">TOTAL PEMBAYARAN</span>
                <span className="font-black text-lg text-saudara-green-900">
                  {formatRupiah(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between border-t border-saudara-cream-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" /> Ubah Data
              </button>

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={isSubmitting}
                className="market-btn-orange text-sm py-3.5 px-8 font-extrabold shadow-lg shadow-saudara-orange-600/30 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Membuat Pesanan & E-Receipt...</>
                ) : (
                  <>
                    Konfirmasi & Buat Pesanan <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
