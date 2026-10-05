"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Truck,
  DollarSign,
} from "lucide-react";

interface DeliveryArea {
  id: string;
  name: string;
  shippingFee: number;
  minOrderAmount: number;
  isActive: boolean;
}

export default function AdminAreaPage() {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [areaForm, setAreaForm] = useState({
    name: "",
    shippingFee: "10000",
    minOrderAmount: "30000",
  });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function loadAreas() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/delivery/areas");
      const json = await res.json();
      if (json.data) setAreas(json.data);
    } catch {
      showToast("error", "Gagal memuat area pengiriman");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAreas();
  }, []);

  async function handleCreateArea(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/admin/delivery/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: areaForm.name,
          shippingFee: Number(areaForm.shippingFee),
          minOrderAmount: Number(areaForm.minOrderAmount) || 0,
          isActive: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal membuat area pengiriman");

      showToast("success", `Area "${areaForm.name}" berhasil ditambahkan!`);
      setIsModalOpen(false);
      setAreaForm({ name: "", shippingFee: "10000", minOrderAmount: "30000" });
      loadAreas();
    } catch (err: any) {
      showToast("error", err.message);
    }
  }

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  const filteredAreas = areas.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 text-sm shadow-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-emerald-700" />
            Area Cakupan Pengiriman Kurir Toko
          </h1>
          <p className="text-sm text-stone-500">
            Wilayah kecamatan/kelurahan yang dilayani armada pengiriman Toko Saudara beserta tarif ongkos kirim
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAreas}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Area Baru
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kecamatan atau wilayah (e.g. Sukasari, Coblong)..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Areas Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Nama Wilayah / Kecamatan</th>
                <th className="py-3 px-4">Tarif Ongkir</th>
                <th className="py-3 px-4">Minimal Belanja</th>
                <th className="py-3 px-4">Status Layanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">
                    Memuat area pengiriman...
                  </td>
                </tr>
              ) : filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">
                    Tidak ada area yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredAreas.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900 text-xs flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                      {a.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-800 text-xs">
                      {formatRupiah(a.shippingFee)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-600">
                      {formatRupiah(a.minOrderAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Aktif Dilayani
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                          Non-aktif
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Area */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                Tambah Area Pengiriman Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArea} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Wilayah / Kecamatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kecamatan Kramat Jati, Jakarta Timur"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tarif Ongkos Kirim (Rp)
                </label>
                <input
                  type="number"
                  required
                  placeholder="10000"
                  value={areaForm.shippingFee}
                  onChange={(e) => setAreaForm({ ...areaForm, shippingFee: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Minimal Belanja (Rp)
                </label>
                <input
                  type="number"
                  placeholder="30000"
                  value={areaForm.minOrderAmount}
                  onChange={(e) => setAreaForm({ ...areaForm, minOrderAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  Simpan Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
