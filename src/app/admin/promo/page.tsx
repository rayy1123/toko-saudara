"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
  Power,
  PowerOff,
  Sparkles,
  ArrowRight,
  TrendingUp,
  DollarSign,
  PackagePlus,
  Layers,
  ShoppingBag,
  Boxes,
} from "lucide-react";

interface ProductUnitOption {
  id: string;
  productName: string;
  unitName: string;
  price: number;
}

interface PromoItemInput {
  productUnitId: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  productName?: string;
  unitName?: string;
  normalPrice?: number;
  promoPrice?: number;
}

interface Promotion {
  id: string;
  name: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  scope: "ALL" | "SPECIFIC_ITEMS";
  items: PromoItemInput[];
}

export default function AdminPromoPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "Diskon Khusus Pelanggan Langganan",
    code: "LANGGANAN",
    type: "FIXED" as "PERCENTAGE" | "FIXED",
    value: 0,
    minOrderAmount: 25000,
    maxDiscount: 0,
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: "",
    isActive: true,
    scope: "SPECIFIC_ITEMS" as "ALL" | "SPECIFIC_ITEMS",
  });

  const [selectedItems, setSelectedItems] = useState<PromoItemInput[]>([]);

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotify = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [promosRes, prodsRes] = await Promise.all([
        fetch("/api/v1/admin/promotions"),
        fetch("/api/v1/products?limit=150"),
      ]);

      const promosJson = await promosRes.json();
      const prodsJson = await prodsRes.json();

      if (promosJson.data) {
        setPromotions(promosJson.data);
      }

      if (prodsJson.data) {
        const units: ProductUnitOption[] = [];
        prodsJson.data.forEach((p: any) => {
          if (p.units && Array.isArray(p.units)) {
            p.units.forEach((u: any) => {
              units.push({
                id: u.id,
                productName: p.name,
                unitName: u.unitName,
                price: u.price,
              });
            });
          }
        });
        setProductUnits(units);
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

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      type: "FIXED",
      value: 0,
      minOrderAmount: 25000,
      maxDiscount: 0,
      startsAt: new Date().toISOString().slice(0, 10),
      endsAt: "",
      isActive: true,
      scope: "SPECIFIC_ITEMS",
    });

    // Seed initial row if units available
    if (productUnits.length > 0) {
      const first = productUnits[0];
      setSelectedItems([
        {
          productUnitId: first.id,
          discountType: "FIXED",
          discountValue: 5000,
          productName: first.productName,
          unitName: first.unitName,
          normalPrice: first.price,
        },
      ]);
    } else {
      setSelectedItems([]);
    }

    setShowModal(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      code: p.code,
      type: p.type,
      value: p.value,
      minOrderAmount: p.minOrderAmount,
      maxDiscount: p.maxDiscount || 0,
      startsAt: p.startsAt ? p.startsAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      endsAt: p.endsAt ? p.endsAt.slice(0, 10) : "",
      isActive: p.isActive,
      scope: p.scope || (p.items?.length > 0 ? "SPECIFIC_ITEMS" : "ALL"),
    });

    if (p.items && p.items.length > 0) {
      setSelectedItems(
        p.items.map((it) => ({
          productUnitId: it.productUnitId,
          discountType: it.discountType || "FIXED",
          discountValue: it.discountValue,
          productName: it.productName,
          unitName: it.unitName,
          normalPrice: it.normalPrice,
          promoPrice: it.promoPrice,
        }))
      );
    } else if (productUnits.length > 0) {
      const first = productUnits[0];
      setSelectedItems([
        {
          productUnitId: first.id,
          discountType: "FIXED",
          discountValue: 3000,
          productName: first.productName,
          unitName: first.unitName,
          normalPrice: first.price,
        },
      ]);
    } else {
      setSelectedItems([]);
    }

    setShowModal(true);
  };

  const addDiscountedItemRow = () => {
    if (productUnits.length === 0) return;
    const defaultUnit = productUnits[0];
    setSelectedItems((prev) => [
      ...prev,
      {
        productUnitId: defaultUnit.id,
        discountType: "FIXED",
        discountValue: 3000,
        productName: defaultUnit.productName,
        unitName: defaultUnit.unitName,
        normalPrice: defaultUnit.price,
      },
    ]);
  };

  const updateItemRow = (index: number, field: keyof PromoItemInput, val: any) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };

      if (field === "productUnitId") {
        const selected = productUnits.find((u) => u.id === val);
        if (selected) {
          updated[index].productName = selected.productName;
          updated[index].unitName = selected.unitName;
          updated[index].normalPrice = selected.price;
        }
      }
      return updated;
    });
  };

  const removeItemRow = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showNotify("error", "Nama promo dan kode kupon wajib diisi");
      return;
    }

    if (formData.scope === "SPECIFIC_ITEMS" && selectedItems.length === 0) {
      showNotify("error", "Tambahkan minimal 1 barang tertentu yang mendapatkan potongan harga");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: Number(formData.value) || 0,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscount: Number(formData.maxDiscount) > 0 ? Number(formData.maxDiscount) : null,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : new Date().toISOString(),
        endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
        isActive: formData.isActive,
        scope: formData.scope,
        items:
          formData.scope === "SPECIFIC_ITEMS"
            ? selectedItems.map((it) => ({
                productUnitId: it.productUnitId,
                discountType: it.discountType,
                discountValue: Number(it.discountValue) || 0,
              }))
            : [],
      };

      const url = editingId
        ? `/api/v1/admin/promotions/${editingId}`
        : "/api/v1/admin/promotions";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal menyimpan kupon promo");
      }

      showNotify(
        "success",
        `Kode promo "${payload.code}" berhasil ${editingId ? "diperbarui" : "dibuat"}!`
      );
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showNotify("error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (p: Promotion) => {
    try {
      const res = await fetch(`/api/v1/admin/promotions/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) {
        showNotify("success", `Voucher ${p.code} sekarang ${!p.isActive ? "AKTIF" : "NON-AKTIF"}`);
        loadData();
      }
    } catch {
      showNotify("error", "Gagal mengubah status promo");
    }
  };

  const handleDelete = async (p: Promotion) => {
    if (!confirm(`Hapus voucher promo "${p.code}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/promotions/${p.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotify("success", `Voucher ${p.code} berhasil dihapus`);
        loadData();
      }
    } catch {
      showNotify("error", "Gagal menghapus voucher");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saudara-orange-100 text-saudara-orange-800 text-xs font-bold mb-2">
            <Tag className="w-3.5 h-3.5" />
            Promo Diskon Barang Tertentu &amp; Langganan
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Kelola Promo Barang Tertentu
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Tentukan barang tertentu (misal: Beras, Cabai, Minyak) dan atur sendiri berapa besar potongan harganya khusus pelanggan langganan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/kelola-barang"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
          >
            <PackagePlus className="w-3.5 h-3.5" /> Input Barang &amp; Harga
          </Link>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Buat Promo Barang Baru
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Promos List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-black text-base text-stone-900">Daftar Promo &amp; Potongan Barang</h2>
          <button
            onClick={loadData}
            className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Segarkan
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Memuat daftar promo barang...
          </div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Belum ada promo yang dibuat. Klik &quot;Buat Promo Barang Baru&quot; di atas untuk menentukan barang dan potongannya.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {promotions.map((p) => {
              const isSpecific = p.scope === "SPECIFIC_ITEMS" || (p.items && p.items.length > 0);
              return (
                <div
                  key={p.id}
                  className={`p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition ${
                    p.isActive ? "hover:bg-stone-50" : "bg-stone-50/60 opacity-60"
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-base text-stone-900 bg-stone-100 px-3 py-1 rounded-xl border border-stone-200">
                        {p.code}
                      </span>
                      <span className="font-black text-sm text-stone-900">{p.name}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isSpecific
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {isSpecific ? "🎯 Potongan Barang Tertentu" : "🌐 Seluruh Belanjaan"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {p.isActive ? "AKTIF" : "NON-AKTIF"}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 flex items-center gap-2">
                      <span>Min. Belanja: {formatRupiah(p.minOrderAmount)}</span>
                      {p.endsAt && (
                        <>
                          <span>•</span>
                          <span>Berlaku s/d: {new Date(p.endsAt).toLocaleDateString("id-ID")}</span>
                        </>
                      )}
                    </div>

                    {/* Specific items chips */}
                    {isSpecific && p.items && p.items.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        <span className="text-[11px] font-bold text-stone-600 block">
                          Barang yang Dipotong Harganya oleh Admin ({p.items.length} komoditas):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {p.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium"
                            >
                              <span className="font-bold">{it.productName}</span>
                              <span className="text-[10px] text-stone-500">({it.unitName})</span>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-extrabold text-[10px]">
                                {it.discountType === "PERCENTAGE"
                                  ? `Diskon ${it.discountValue}%`
                                  : `Potong -${formatRupiah(it.discountValue)}`}
                              </span>
                              {it.promoPrice !== undefined && it.promoPrice > 0 && (
                                <span className="text-[10px] text-stone-400 font-mono">
                                  (Jadi {formatRupiah(it.promoPrice)})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleStatus(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        p.isActive
                          ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {p.isActive ? (
                        <>
                          <PowerOff className="w-3.5 h-3.5" /> Non-aktifkan
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5" /> Aktifkan
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 border border-stone-200"
                      title="Ubah Barang & Potongan Promo"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(p)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 border border-stone-200"
                      title="Hapus Promo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL BUAT / UBAH PROMO BARANG TERTENTU */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-700" />
                {editingId ? "Ubah Promo & Potongan Barang" : "Buat Promo Potongan Barang Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Nama Promo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Diskon Khusus Langganan Setia"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kode Kupon / Voucher *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: LANGGANAN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono font-bold uppercase focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Target Promo Scope */}
              <div className="space-y-2">
                <label className="font-bold text-stone-700 block">Target Potongan Harga *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scope: "SPECIFIC_ITEMS" })}
                    className={`p-3 rounded-2xl border text-left transition ${
                      formData.scope === "SPECIFIC_ITEMS"
                        ? "border-emerald-800 bg-emerald-50/70 ring-2 ring-emerald-600/20 font-bold text-emerald-950"
                        : "border-stone-200 hover:border-stone-300 text-stone-600"
                    }`}
                  >
                    <span className="block text-sm">🎯 Barang Tertentu Pilihan Admin</span>
                    <span className="text-[11px] font-normal text-stone-500">
                      Hanya barang yang ditentukan admin yang terpotong harganya.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scope: "ALL" })}
                    className={`p-3 rounded-2xl border text-left transition ${
                      formData.scope === "ALL"
                        ? "border-emerald-800 bg-emerald-50/70 ring-2 ring-emerald-600/20 font-bold text-emerald-950"
                        : "border-stone-200 hover:border-stone-300 text-stone-600"
                    }`}
                  >
                    <span className="block text-sm">🌐 Semua Belanjaan (Global)</span>
                    <span className="text-[11px] font-normal text-stone-500">
                      Potongan otomatis memotong total belanja keseluruhan.
                    </span>
                  </button>
                </div>
              </div>

              {/* JIKA PILIH SPECIFIC_ITEMS: DAFTAR BARANG YANG DITENTUKAN ADMIN */}
              {formData.scope === "SPECIFIC_ITEMS" && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block text-xs">
                        Tentukan Barang &amp; Nominal Potongannya:
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Admin bebas menentukan barang mana saja dan berapa potongannya per barang.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={addDiscountedItemRow}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Barang Diskon
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {selectedItems.length === 0 ? (
                      <div className="py-6 text-center text-xs text-stone-400">
                        Belum ada barang yang dipilih. Klik tombol &quot;Tambah Barang Diskon&quot; di atas.
                      </div>
                    ) : (
                      selectedItems.map((item, idx) => {
                        const unitObj = productUnits.find((u) => u.id === item.productUnitId);
                        const normalPrice = unitObj?.price || item.normalPrice || 0;
                        const promoPrice =
                          item.discountType === "PERCENTAGE"
                            ? Math.max(0, normalPrice - (normalPrice * item.discountValue) / 100)
                            : Math.max(0, normalPrice - item.discountValue);

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-white rounded-xl border border-stone-200 space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <select
                                value={item.productUnitId}
                                onChange={(e) => updateItemRow(idx, "productUnitId", e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold bg-white"
                              >
                                {productUnits.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.productName} ({u.unitName}) — Harga Normal: {formatRupiah(u.price)}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => removeItemRow(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Hapus dari promo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <select
                                  value={item.discountType}
                                  onChange={(e) => updateItemRow(idx, "discountType", e.target.value)}
                                  className="px-2 py-1 rounded-lg border border-stone-200 text-xs bg-white font-bold"
                                >
                                  <option value="FIXED">Potongan Tetap (Rp)</option>
                                  <option value="PERCENTAGE">Persentase (%)</option>
                                </select>

                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-stone-500">
                                    {item.discountType === "FIXED" ? "Rp" : "%"}
                                  </span>
                                  <input
                                    type="number"
                                    value={item.discountValue || ""}
                                    onChange={(e) =>
                                      updateItemRow(idx, "discountValue", Number(e.target.value) || 0)
                                    }
                                    placeholder="Nominal Potongan"
                                    className="w-28 px-2 py-1 rounded-lg border border-emerald-300 font-bold text-xs bg-emerald-50/40 text-emerald-950"
                                    min="1"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="text-[11px] font-bold text-stone-600 flex items-center gap-2">
                                <span className="line-through text-stone-400">
                                  {formatRupiah(normalPrice)}
                                </span>
                                <ArrowRight className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-800 text-xs font-black">
                                  Jadi {formatRupiah(promoPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* JIKA PILIH ALL: POTONGAN GLOBAL */}
              {formData.scope === "ALL" && (
                <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Tipe Diskon Global</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white"
                    >
                      <option value="PERCENTAGE">Persentase (%)</option>
                      <option value="FIXED">Nominal Tetap (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Nilai Potongan {formData.type === "PERCENTAGE" ? "(%)" : "(Rp)"}
                    </label>
                    <input
                      type="number"
                      value={formData.value || ""}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold"
                      min="1"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Syarat Minimal Belanja (Rp)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount || ""}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) || 0 })}
                    placeholder="25000"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
                    min="0"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">Bisa diatur 0 jika tanpa batas minimal.</p>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tanggal Mulai Berlaku</label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-600"
                />
                <label htmlFor="isActiveToggle" className="font-bold text-stone-800 cursor-pointer">
                  Aktifkan promo ini segera untuk pelanggan
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-xs"
                >
                  {isSubmitting ? "Menyimpan Promo..." : editingId ? "Simpan Perubahan Promo" : "Terbitkan Promo Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
