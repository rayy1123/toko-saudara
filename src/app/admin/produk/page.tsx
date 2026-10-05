"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Boxes,
  PlusCircle,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductUnit {
  id: string;
  unitName: string;
  unitCode: string;
  quantityValue: number;
  quantityUnit: string;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFresh: boolean;
  harvestInfo: string | null;
  category: Category;
  units: ProductUnit[];
}

export default function AdminProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Modal Product State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    categoryId: "",
    description: "",
    imageUrl: "",
    isFresh: false,
    harvestInfo: "",
    initialUnitName: "1 Kilogram",
    initialUnitCode: "kg",
    initialPrice: "",
    initialCostPrice: "",
    initialStock: "10",
    initialThreshold: "5",
  });

  // Modal Unit State (for adding variant to existing product)
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState({
    unitName: "",
    unitCode: "kg",
    quantityValue: "1",
    quantityUnit: "kg",
    price: "",
    costPrice: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
  });

  // Editing Unit State
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitForm, setEditUnitForm] = useState({
    price: "",
    stockQuantity: "",
    lowStockThreshold: "",
  });

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/v1/admin/products"),
        fetch("/api/v1/categories"),
      ]);

      const prodJson = await prodRes.json();
      const catJson = await catRes.json();

      if (prodJson.data) setProducts(prodJson.data);
      if (catJson.data) setCategories(catJson.data);
    } catch {
      showToast("error", "Gagal memuat data produk & kategori");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "" || p.category?.id === selectedCategory;
    return matchSearch && matchCategory;
  });

  function openCreateProductModal() {
    setEditingProductId(null);
    setProductForm({
      sku: `PROD-${Date.now().toString().slice(-4)}`,
      name: "",
      categoryId: categories[0]?.id || "",
      description: "",
      imageUrl: "",
      isFresh: true,
      harvestInfo: "Segar datang pagi hari",
      initialUnitName: "1 Kilogram",
      initialUnitCode: "kg",
      initialPrice: "15000",
      initialCostPrice: "10000",
      initialStock: "20",
      initialThreshold: "5",
    });
    setIsProductModalOpen(true);
  }

  function openEditProductModal(p: Product) {
    setEditingProductId(p.id);
    setProductForm({
      sku: p.sku,
      name: p.name,
      categoryId: p.category.id,
      description: p.description || "",
      imageUrl: p.imageUrl || "",
      isFresh: p.isFresh,
      harvestInfo: p.harvestInfo || "",
      initialUnitName: "",
      initialUnitCode: "",
      initialPrice: "",
      initialCostPrice: "",
      initialStock: "",
      initialThreshold: "",
    });
    setIsProductModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingProductId) {
        // Edit existing product
        const res = await fetch(`/api/v1/admin/products/${editingProductId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: productForm.sku,
            name: productForm.name,
            categoryId: productForm.categoryId,
            description: productForm.description,
            imageUrl: productForm.imageUrl,
            isFresh: productForm.isFresh,
            harvestInfo: productForm.harvestInfo,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Gagal memperbarui produk");
        showToast("success", "Produk berhasil diperbarui!");
      } else {
        // Create new product with initial unit
        const units = productForm.initialPrice
          ? [
              {
                unitName: productForm.initialUnitName || "1 Kilogram",
                unitCode: productForm.initialUnitCode || "kg",
                quantityValue: 1.0,
                quantityUnit: productForm.initialUnitCode || "kg",
                price: Number(productForm.initialPrice),
                costPrice: productForm.initialCostPrice ? Number(productForm.initialCostPrice) : null,
                stockQuantity: Number(productForm.initialStock) || 0,
                lowStockThreshold: Number(productForm.initialThreshold) || 5,
              },
            ]
          : [];

        const res = await fetch("/api/v1/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sku: productForm.sku,
            name: productForm.name,
            categoryId: productForm.categoryId,
            description: productForm.description,
            imageUrl: productForm.imageUrl,
            isFresh: productForm.isFresh,
            harvestInfo: productForm.harvestInfo,
            units,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Gagal membuat produk baru");
        showToast("success", "Produk baru berhasil ditambahkan!");
      }

      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  }

  // Open unit addition modal
  function openAddUnitModal(productId: string) {
    setTargetProductId(productId);
    setUnitForm({
      unitName: "",
      unitCode: "kg",
      quantityValue: "1",
      quantityUnit: "kg",
      price: "",
      costPrice: "",
      stockQuantity: "10",
      lowStockThreshold: "5",
    });
    setIsUnitModalOpen(true);
  }

  async function handleSaveUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetProductId) return;

    try {
      const res = await fetch(`/api/v1/admin/products/${targetProductId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitName: unitForm.unitName,
          unitCode: unitForm.unitCode,
          quantityValue: Number(unitForm.quantityValue) || 1,
          quantityUnit: unitForm.quantityUnit,
          price: Number(unitForm.price),
          costPrice: unitForm.costPrice ? Number(unitForm.costPrice) : null,
          stockQuantity: Number(unitForm.stockQuantity) || 0,
          lowStockThreshold: Number(unitForm.lowStockThreshold) || 5,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal menambahkan varian satuan");

      showToast("success", "Varian satuan berhasil ditambahkan!");
      setIsUnitModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  }

  async function handleQuickUpdateUnit(unitId: string) {
    try {
      const res = await fetch(`/api/v1/admin/product-units/${unitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(editUnitForm.price),
          stockQuantity: Number(editUnitForm.stockQuantity),
          lowStockThreshold: Number(editUnitForm.lowStockThreshold),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal memperbarui unit");

      showToast("success", "Unit berhasil diperbarui!");
      setEditingUnitId(null);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  }

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
          <h1 className="text-2xl font-bold text-stone-900">Kelola Produk &amp; Varian</h1>
          <p className="text-sm text-stone-500">
            Daftar komoditas pasar, harga per varian satuan, dan pengaturan kesegaran
          </p>
        </div>

        <button
          onClick={openCreateProductModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk Baru
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk, SKU, atau deskripsi..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Info Segar</th>
                <th className="py-3 px-4">Varian Satuan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400 text-sm">
                    Memuat produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400 text-sm">
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isExpanded = expandedProductId === p.id;
                  return (
                    <tr key={p.id} className="group hover:bg-stone-50/50 transition flex-col">
                      <td colSpan={5} className="p-0">
                        <div className="flex items-center justify-between p-4 border-b border-stone-100">
                          {/* Left: Product summary */}
                          <div className="flex items-center gap-3.5 min-w-[260px]">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-12 h-12 object-cover rounded-xl border border-stone-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center shrink-0">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-sm">{p.name}</span>
                                {p.isFresh && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                    <Sparkles className="w-3 h-3 text-emerald-600" /> Segar
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-400 font-mono">SKU: {p.sku}</div>
                            </div>
                          </div>

                          {/* Category */}
                          <div className="hidden sm:block text-xs font-medium text-stone-700">
                            <span className="px-2.5 py-1 bg-stone-100 rounded-lg">{p.category?.name}</span>
                          </div>

                          {/* Harvest Info */}
                          <div className="hidden md:block text-xs text-stone-500 max-w-[180px] truncate">
                            {p.harvestInfo || "—"}
                          </div>

                          {/* Units count */}
                          <div className="text-xs text-stone-600 font-medium">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                              {p.units?.length || 0} Varian
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditProductModal(p)}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                              title="Edit Produk"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded-lg transition"
                            >
                              <Boxes className="w-3.5 h-3.5" />
                              Varian
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Units Details */}
                        {isExpanded && (
                          <div className="bg-stone-50/70 p-4 border-b border-stone-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                                <Boxes className="w-4 h-4 text-emerald-700" />
                                Satuan &amp; Varian Harga untuk {p.name}
                              </h4>
                              <button
                                onClick={() => openAddUnitModal(p.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Tambah Varian
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {p.units.map((u) => {
                                const isEditingThis = editingUnitId === u.id;
                                const isLow = u.stockQuantity <= u.lowStockThreshold;

                                return (
                                  <div
                                    key={u.id}
                                    className={`p-3.5 rounded-xl border transition ${
                                      isLow
                                        ? "bg-amber-50/60 border-amber-200"
                                        : "bg-white border-stone-200"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="font-bold text-stone-900 text-xs">{u.unitName}</p>
                                        <p className="text-[10px] text-stone-400 font-mono uppercase">
                                          Kode: {u.unitCode} ({u.quantityValue} {u.quantityUnit})
                                        </p>
                                      </div>
                                      {!isEditingThis && (
                                        <button
                                          onClick={() => {
                                            setEditingUnitId(u.id);
                                            setEditUnitForm({
                                              price: String(u.price),
                                              stockQuantity: String(u.stockQuantity),
                                              lowStockThreshold: String(u.lowStockThreshold),
                                            });
                                          }}
                                          className="text-stone-400 hover:text-stone-700 p-1"
                                          title="Ubah Cepat Harga/Stok"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>

                                    {isEditingThis ? (
                                      <div className="mt-2.5 pt-2.5 border-t border-stone-100 space-y-2">
                                        <div>
                                          <label className="text-[10px] font-semibold text-stone-500">Harga Jual (Rp)</label>
                                          <input
                                            type="number"
                                            value={editUnitForm.price}
                                            onChange={(e) =>
                                              setEditUnitForm({ ...editUnitForm, price: e.target.value })
                                            }
                                            className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-[10px] font-semibold text-stone-500">Stok</label>
                                            <input
                                              type="number"
                                              value={editUnitForm.stockQuantity}
                                              onChange={(e) =>
                                                setEditUnitForm({ ...editUnitForm, stockQuantity: e.target.value })
                                              }
                                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] font-semibold text-stone-500">Min Alert</label>
                                            <input
                                              type="number"
                                              value={editUnitForm.lowStockThreshold}
                                              onChange={(e) =>
                                                setEditUnitForm({ ...editUnitForm, lowStockThreshold: e.target.value })
                                              }
                                              className="w-full px-2 py-1 bg-white border border-stone-300 rounded text-xs"
                                            />
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-1">
                                          <button
                                            onClick={() => handleQuickUpdateUnit(u.id)}
                                            className="flex-1 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
                                          >
                                            Simpan
                                          </button>
                                          <button
                                            onClick={() => setEditingUnitId(null)}
                                            className="px-2 py-1 bg-stone-200 text-stone-700 rounded text-xs"
                                          >
                                            Batal
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-2 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-stone-500">Harga Jual:</span>
                                          <span className="font-bold text-emerald-800">{formatRupiah(u.price)}</span>
                                        </div>
                                        {u.costPrice && (
                                          <div className="flex items-center justify-between text-[11px] text-stone-400">
                                            <span>Modal:</span>
                                            <span>{formatRupiah(u.costPrice)}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                          <span className="text-stone-500">Stok:</span>
                                          <span
                                            className={`font-semibold ${
                                              isLow ? "text-amber-700 font-bold" : "text-stone-800"
                                            }`}
                                          >
                                            {u.stockQuantity} (Batas: {u.lowStockThreshold})
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingProductId ? "Ubah Data Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">SKU Produk</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kategori</label>
                  <select
                    required
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cabai Rawit Merah Domba"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">URL Foto Produk</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <input
                  type="checkbox"
                  id="isFreshToggle"
                  checked={productForm.isFresh}
                  onChange={(e) => setProductForm({ ...productForm, isFresh: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="isFreshToggle" className="text-xs text-stone-700 font-medium cursor-pointer">
                  Produk Segar Harian (Tandai label segar &amp; info petik panen)
                </label>
              </div>

              {productForm.isFresh && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Info Panen / Segar</label>
                  <input
                    type="text"
                    placeholder="e.g. Panen subuh pk 04.30 dari kebun Ciwidey"
                    value={productForm.harvestInfo}
                    onChange={(e) => setProductForm({ ...productForm, harvestInfo: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan mutu, asal komoditas, atau tips memasak..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              {/* Initial Unit section only for creation */}
              {!editingProductId && (
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
                  <span className="text-xs font-bold text-emerald-900 block">Varian Satuan Perdana</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-600">Nama Satuan</label>
                      <input
                        type="text"
                        placeholder="1 Kilogram"
                        value={productForm.initialUnitName}
                        onChange={(e) => setProductForm({ ...productForm, initialUnitName: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-600">Kode Satuan</label>
                      <input
                        type="text"
                        placeholder="kg / ikat / pcs"
                        value={productForm.initialUnitCode}
                        onChange={(e) => setProductForm({ ...productForm, initialUnitCode: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-600">Harga Jual (Rp)</label>
                      <input
                        type="number"
                        placeholder="15000"
                        value={productForm.initialPrice}
                        onChange={(e) => setProductForm({ ...productForm, initialPrice: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-600">Harga Modal (Rp)</label>
                      <input
                        type="number"
                        placeholder="11000"
                        value={productForm.initialCostPrice}
                        onChange={(e) => setProductForm({ ...productForm, initialCostPrice: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-stone-600">Stok Awal</label>
                      <input
                        type="number"
                        value={productForm.initialStock}
                        onChange={(e) => setProductForm({ ...productForm, initialStock: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-stone-600">Ambang Min. Stok</label>
                      <input
                        type="number"
                        value={productForm.initialThreshold}
                        onChange={(e) => setProductForm({ ...productForm, initialThreshold: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  {editingProductId ? "Simpan Perubahan" : "Buat Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Unit Variant */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900">Tambah Varian Satuan Baru</h3>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Satuan / Varian</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 500 Gram (1/2 kg) atau 1 Ikat"
                  value={unitForm.unitName}
                  onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Kode Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="kg / g / ikat / pcs"
                    value={unitForm.unitCode}
                    onChange={(e) => setUnitForm({ ...unitForm, unitCode: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nilai Kuantitas</label>
                  <input
                    type="number"
                    step="any"
                    value={unitForm.quantityValue}
                    onChange={(e) => setUnitForm({ ...unitForm, quantityValue: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={unitForm.price}
                    onChange={(e) => setUnitForm({ ...unitForm, price: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    placeholder="18000"
                    value={unitForm.costPrice}
                    onChange={(e) => setUnitForm({ ...unitForm, costPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    value={unitForm.stockQuantity}
                    onChange={(e) => setUnitForm({ ...unitForm, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Batas Minimum</label>
                  <input
                    type="number"
                    value={unitForm.lowStockThreshold}
                    onChange={(e) => setUnitForm({ ...unitForm, lowStockThreshold: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                >
                  Simpan Varian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
