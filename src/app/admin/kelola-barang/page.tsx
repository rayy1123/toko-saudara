"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  PackagePlus,
  Boxes,
  TrendingUp,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Save,
  Tag,
  Layers,
  Percent,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductUnitItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitName: string;
  unitCode: string;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
}

export default function AdminKelolaBarangPage() {
  const [activeTab, setActiveTab] = useState<"new_product" | "new_stock" | "new_price">("new_product");
  const [categories, setCategories] = useState<Category[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Tab 1 Form: Input Barang Baru
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "",
    sku: `PROD-${Date.now().toString().slice(-4)}`,
    description: "",
    imageUrl: "",
    isFresh: true,
    harvestInfo: "Segar datang subuh dari petani lokal",
    unitName: "1 Kilogram",
    unitCode: "kg",
    costPrice: 8000,
    price: 12000,
    stockQuantity: 20,
    lowStockThreshold: 5,
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Tab 2: State Tambah Stok Cepat (unitId -> { qtyToAdd, costPrice, note })
  const [stockInputs, setStockInputs] = useState<Record<string, { qty: number; costPrice?: number; note?: string }>>({});
  const [updatingStockUnitId, setUpdatingStockUnitId] = useState<string | null>(null);

  // Tab 3: State Update Harga Baru (unitId -> { newPrice, newCostPrice })
  const [priceInputs, setPriceInputs] = useState<Record<string, { price: number; costPrice: number }>>({});
  const [updatingPriceUnitId, setUpdatingPriceUnitId] = useState<string | null>(null);

  const showNotify = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch("/api/v1/categories"),
        fetch("/api/v1/products?limit=100"),
      ]);

      const catsJson = await catsRes.json();
      const prodsJson = await prodsRes.json();

      if (catsJson.data) {
        setCategories(catsJson.data);
        if (!productForm.categoryId && catsJson.data.length > 0) {
          setProductForm((prev) => ({ ...prev, categoryId: catsJson.data[0].id }));
        }
      }

      if (prodsJson.data) {
        const flat: ProductUnitItem[] = [];
        prodsJson.data.forEach((p: any) => {
          if (p.units && Array.isArray(p.units)) {
            p.units.forEach((u: any) => {
              flat.push({
                id: u.id,
                productId: p.id,
                productName: p.name,
                sku: p.sku,
                categoryName: p.category?.name || "Umum",
                unitName: u.unitName,
                unitCode: u.unitCode,
                price: u.price,
                costPrice: u.costPrice,
                stockQuantity: u.stockQuantity,
                lowStockThreshold: u.lowStockThreshold,
                imageUrl: p.imageUrl,
              });
            });
          }
        });
        setProductUnits(flat);

        // Pre-fill price inputs for Tab 3
        const initialPrices: Record<string, { price: number; costPrice: number }> = {};
        flat.forEach((u) => {
          initialPrices[u.id] = { price: u.price, costPrice: u.costPrice || 0 };
        });
        setPriceInputs(initialPrices);
      }
    } catch (err: any) {
      showNotify("error", err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler Tab 1: Submit Barang Baru
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.categoryId) {
      showNotify("error", "Nama barang dan kategori wajib diisi");
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        categoryId: productForm.categoryId,
        sku: productForm.sku.trim().toUpperCase(),
        description: productForm.description.trim() || undefined,
        imageUrl: productForm.imageUrl.trim() || undefined,
        isFresh: productForm.isFresh,
        harvestInfo: productForm.isFresh ? productForm.harvestInfo.trim() : undefined,
        units: [
          {
            unitName: productForm.unitName.trim(),
            unitCode: productForm.unitCode.trim(),
            price: Number(productForm.price),
            costPrice: Number(productForm.costPrice) || null,
            stockQuantity: Number(productForm.stockQuantity) || 0,
            lowStockThreshold: Number(productForm.lowStockThreshold) || 5,
          },
        ],
      };

      const res = await fetch("/api/v1/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menyimpan barang baru");
      }

      showNotify("success", `Barang baru "${productForm.name}" berhasil ditambahkan ke toko!`);

      // Reset form
      setProductForm({
        name: "",
        categoryId: categories[0]?.id || "",
        sku: `PROD-${Date.now().toString().slice(-4)}`,
        description: "",
        imageUrl: "",
        isFresh: true,
        harvestInfo: "Segar datang subuh dari petani lokal",
        unitName: "1 Kilogram",
        unitCode: "kg",
        costPrice: 8000,
        price: 12000,
        stockQuantity: 20,
        lowStockThreshold: 5,
      });

      loadData();
    } catch (err: any) {
      showNotify("error", err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Handler Tab 2: Tambah Stok Cepat
  const handleAddStock = async (unit: ProductUnitItem) => {
    const input = stockInputs[unit.id];
    const qtyToAdd = input?.qty || 0;

    if (qtyToAdd <= 0) {
      showNotify("error", `Masukkan jumlah stok tambahan untuk ${unit.productName}`);
      return;
    }

    setUpdatingStockUnitId(unit.id);
    try {
      const payload = {
        productUnitId: unit.id,
        type: "PURCHASE",
        quantity: qtyToAdd,
        note: input?.note || "Kulakan restock barang pasar",
      };

      const res = await fetch("/api/v1/admin/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menambah stok");
      }

      showNotify(
        "success",
        `Stok ${unit.productName} (${unit.unitName}) bertambah +${qtyToAdd}! Total stok sekarang: ${json.data.newStockQuantity}`
      );

      // Reset input for this unit
      setStockInputs((prev) => ({ ...prev, [unit.id]: { qty: 0, note: "" } }));
      loadData();
    } catch (err: any) {
      showNotify("error", err.message);
    } finally {
      setUpdatingStockUnitId(null);
    }
  };

  // Handler Tab 3: Update Harga Baru
  const handleUpdatePrice = async (unit: ProductUnitItem) => {
    const input = priceInputs[unit.id];
    if (!input || input.price < 0) {
      showNotify("error", "Harga jual tidak valid");
      return;
    }

    setUpdatingPriceUnitId(unit.id);
    try {
      const res = await fetch(`/api/v1/admin/product-units/${unit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: input.price,
          costPrice: input.costPrice > 0 ? input.costPrice : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memperbarui harga");
      }

      showNotify(
        "success",
        `Harga ${unit.productName} (${unit.unitName}) berhasil diubah menjadi ${formatRupiah(input.price)}!`
      );
      loadData();
    } catch (err: any) {
      showNotify("error", err.message);
    } finally {
      setUpdatingPriceUnitId(null);
    }
  };

  const filteredUnits = productUnits.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.productName.toLowerCase().includes(q) ||
      u.unitName.toLowerCase().includes(q) ||
      u.sku.toLowerCase().includes(q) ||
      u.categoryName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <PackagePlus className="w-3.5 h-3.5" />
            Manajemen Komoditas Toko Pasar
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Input Barang Baru, Stok Baru & Harga Baru
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Satu tempat terpadu untuk mendaftarkan barang baru, menambah stok belanjaan masuk, dan mengupdate harga harian toko.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Segarkan Data
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200 text-xs">
        <button
          onClick={() => setActiveTab("new_product")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
            activeTab === "new_product"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <PackagePlus className="w-4 h-4 text-emerald-700" />
          <span>1. Masukin Barang Baru</span>
        </button>

        <button
          onClick={() => setActiveTab("new_stock")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
            activeTab === "new_stock"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Boxes className="w-4 h-4 text-blue-700" />
          <span>2. Masukin Stok Baru (Restock)</span>
        </button>

        <button
          onClick={() => setActiveTab("new_price")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
            activeTab === "new_price"
              ? "bg-white text-emerald-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-700" />
          <span>3. Masukin Harga Baru (Update Harian)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FORM MASUKIN BARANG BARU */}
      {/* ========================================================================= */}
      {activeTab === "new_product" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-200">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">Form Pendaftaran Barang Baru</h2>
              <p className="text-xs text-stone-500">
                Lengkapi informasi komoditas, varian satuan, harga modal, harga jual, dan stok awal.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateProduct} className="space-y-6 text-xs">
            {/* Section 1: Informasi Produk */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-stone-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">
                  A
                </span>
                Identitas Produk
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-bold text-stone-700 block mb-1">Nama Barang / Produk *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Contoh: Wortel Brastagi Super / Beras Pandan Wangi 5kg"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kategori Pasar *</label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden bg-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kode SKU / Barcode</label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-mono uppercase focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Foto / URL Gambar (Opsional)</label>
                  <input
                    type="url"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Deskripsi Singkat Komoditas</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Kualitas produk, kebersihan, rasa, atau cara pengolahan..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Produk Segar Switch */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="isFreshToggle"
                    checked={productForm.isFresh}
                    onChange={(e) => setProductForm({ ...productForm, isFresh: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-600"
                  />
                  <label htmlFor="isFreshToggle" className="cursor-pointer">
                    <span className="font-bold text-emerald-950 block">Tandai sebagai &quot;Produk Segar Subuh&quot;</span>
                    <span className="text-[11px] text-emerald-800">
                      Tampil di etalase hasil bumi segar subuh dengan badge panen harian
                    </span>
                  </label>
                </div>

                {productForm.isFresh && (
                  <input
                    type="text"
                    value={productForm.harvestInfo}
                    onChange={(e) => setProductForm({ ...productForm, harvestInfo: e.target.value })}
                    placeholder="Info panen, misal: Dipetik subuh tadi di Lembang"
                    className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs bg-white"
                  />
                )}
              </div>
            </div>

            {/* Section 2: Satuan, Harga Modal, Harga Jual & Stok Awal */}
            <div className="space-y-4 pt-4 border-t border-stone-200">
              <h3 className="font-extrabold text-sm text-stone-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">
                  B
                </span>
                Satuan Jual, Harga & Stok Awal
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Nama Satuan / Varian *</label>
                  <input
                    type="text"
                    value={productForm.unitName}
                    onChange={(e) => setProductForm({ ...productForm, unitName: e.target.value })}
                    placeholder="1 Kilogram / 1 Ikat / 1 Papan"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kode Satuan *</label>
                  <select
                    value={productForm.unitCode}
                    onChange={(e) => setProductForm({ ...productForm, unitCode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="ikat">Ikat</option>
                    <option value="papan">Papan</option>
                    <option value="rak">Rak / Tray (Telur)</option>
                    <option value="pcs">Pcs / Butir / Buah</option>
                    <option value="liter">Liter / Pouch</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Harga Modal / Beli (HPP) (Rp) *</label>
                  <input
                    type="number"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) || 0 })}
                    placeholder="8000"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Harga Jual ke Pelanggan (Rp) *</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) || 0 })}
                    placeholder="12000"
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 text-xs font-bold text-emerald-950 focus:border-emerald-600 focus:outline-hidden"
                    min="100"
                    required
                  />
                </div>
              </div>

              {/* Profit Margin Preview Bar */}
              <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">Margin Keuntungan per Satuan:</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-stone-800">
                    Laba Kotor: +{formatRupiah(Math.max(0, productForm.price - productForm.costPrice))}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                    {productForm.costPrice > 0
                      ? `${Math.round(((productForm.price - productForm.costPrice) / productForm.costPrice) * 100)}% Margin`
                      : "100% Margin"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Stok Awal Masuk *</label>
                  <input
                    type="number"
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) || 0 })}
                    placeholder="20"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    min="0"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Otomatis dicatat di ledger inventori sebagai PURCHASE.</p>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Batas Minimum Peringatan Stok (Alert)</label>
                  <input
                    type="number"
                    value={productForm.lowStockThreshold}
                    onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: Number(e.target.value) || 5 })}
                    placeholder="5"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    min="1"
                    required
                  />
                  <p className="text-[10px] text-stone-400 mt-1">Muncul notifikasi jika stok berada di bawah angka ini.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-stone-200">
              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="market-btn-primary px-8 py-3.5 text-xs font-black flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSubmittingProduct ? (
                  <>Menyimpan Barang Baru...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Daftarkan & Simpan Barang Baru
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASUKIN STOK BARU (RESTOCK CEPAT) */}
      {/* ========================================================================= */}
      {activeTab === "new_stock" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-black text-stone-900">Tambah & Perbarui Stok Barang</h2>
              <p className="text-xs text-stone-500">
                Pilih barang yang baru dikulak, masukkan jumlah stok tambahan, dan klik &quot;Tambah Stok&quot;.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari barang untuk tambah stok..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:border-emerald-600"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {filteredUnits.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                Tidak ada komoditas yang cocok dengan pencarian.
              </div>
            ) : (
              filteredUnits.map((u) => {
                const currentStockInput = stockInputs[u.id] || { qty: 0, note: "" };
                const isUpdating = updatingStockUnitId === u.id;
                const isLow = u.stockQuantity <= u.lowStockThreshold;

                return (
                  <div
                    key={u.id}
                    className="py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-stone-50/70 p-3 rounded-2xl transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-stone-900">{u.productName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">
                          {u.unitName}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">({u.sku})</span>
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-3">
                        <span>Harga Jual: {formatRupiah(u.price)}</span>
                        <span>•</span>
                        <span className="font-bold flex items-center gap-1">
                          Stok Saat Ini:{" "}
                          <span className={isLow ? "text-red-600 font-black" : "text-emerald-800"}>
                            {u.stockQuantity} Unit
                          </span>
                        </span>
                        {isLow && (
                          <span className="px-2 py-0.2 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            Menipis
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Input Controls */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-600">Tambah:</span>
                        <input
                          type="number"
                          placeholder="+Qty"
                          value={currentStockInput.qty || ""}
                          onChange={(e) =>
                            setStockInputs((prev) => ({
                              ...prev,
                              [u.id]: {
                                ...currentStockInput,
                                qty: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-20 px-2.5 py-1.5 rounded-xl border border-stone-300 text-xs font-bold text-center"
                          min="1"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Catatan (misal: Kulakan subuh)"
                        value={currentStockInput.note || ""}
                        onChange={(e) =>
                          setStockInputs((prev) => ({
                            ...prev,
                            [u.id]: {
                              ...currentStockInput,
                              note: e.target.value,
                            },
                          }))
                        }
                        className="w-48 px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
                      />

                      <button
                        onClick={() => handleAddStock(u)}
                        disabled={isUpdating || (currentStockInput.qty || 0) <= 0}
                        className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 shadow-2xs"
                      >
                        {isUpdating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Tambah Stok</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MASUKIN HARGA BARU (UPDATE HARGA HARIAN) */}
      {/* ========================================================================= */}
      {activeTab === "new_price" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-black text-stone-900">Perbarui Harga Harian Toko</h2>
              <p className="text-xs text-stone-500">
                Ubah harga jual atau harga modal langsung di baris barang. Perubahan otomatis tercatat di histori harga.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari komoditas untuk ubah harga..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:border-emerald-600"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Nama Barang & Satuan</th>
                  <th className="py-3 px-4">Harga Modal (HPP)</th>
                  <th className="py-3 px-4">Harga Jual Baru</th>
                  <th className="py-3 px-4">Estimasi Margin</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-stone-400">
                      Tidak ada barang yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((u) => {
                    const priceData = priceInputs[u.id] || { price: u.price, costPrice: u.costPrice || 0 };
                    const isUpdating = updatingPriceUnitId === u.id;
                    const marginRp = Math.max(0, priceData.price - priceData.costPrice);
                    const marginPct =
                      priceData.costPrice > 0 ? Math.round((marginRp / priceData.costPrice) * 100) : 100;

                    return (
                      <tr key={u.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-900 block">{u.productName}</span>
                          <span className="text-[11px] text-stone-400">
                            {u.unitName} &bull; {u.categoryName}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <span className="text-stone-400 text-xs">Rp</span>
                            <input
                              type="number"
                              value={priceData.costPrice || ""}
                              onChange={(e) =>
                                setPriceInputs((prev) => ({
                                  ...prev,
                                  [u.id]: {
                                    ...priceData,
                                    costPrice: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-24 px-2 py-1 rounded-lg border border-stone-200 text-xs font-bold"
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1">
                            <span className="text-stone-400 text-xs">Rp</span>
                            <input
                              type="number"
                              value={priceData.price || ""}
                              onChange={(e) =>
                                setPriceInputs((prev) => ({
                                  ...prev,
                                  [u.id]: {
                                    ...priceData,
                                    price: Number(e.target.value) || 0,
                                  },
                                }))
                              }
                              className="w-28 px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50/40 text-xs font-black text-emerald-950"
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-800">+{formatRupiah(marginRp)}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                              {marginPct}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleUpdatePrice(u)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>Simpan</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
