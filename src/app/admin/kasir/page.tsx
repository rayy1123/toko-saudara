"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  Calculator,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  Banknote,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  X,
  ScanBarcode,
} from "lucide-react";

interface ProductUnit {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  unitName: string;
  unitCode: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
}

interface CartItem {
  unitId: string;
  productName: string;
  unitName: string;
  price: number;
  stockQuantity: number;
  quantity: number;
}

interface CompletedReceiptModal {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  grandTotal: number;
  cashTendered: number;
  changeReturned: number;
  paymentMethod: string;
  items: CartItem[];
  receiptUrl: string;
  createdAt: string;
}

export default function AdminKasirPage() {
  const [products, setProducts] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Cashier Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("Pelanggan Toko (Walk-in)");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH");
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt Modal State
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceiptModal | null>(null);

  // Load active products & units
  const loadProducts = () => {
    setLoading(true);
    fetch("/api/v1/products?limit=150")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          const flatUnits: ProductUnit[] = [];
          data.data.forEach((p: any) => {
            if (p.units && Array.isArray(p.units)) {
              p.units.forEach((u: any) => {
                flatUnits.push({
                  id: u.id,
                  productId: p.id,
                  productName: p.name,
                  categoryName: p.category?.name || "Umum",
                  unitName: u.unitName,
                  unitCode: u.unitCode,
                  price: u.price,
                  stockQuantity: u.stockQuantity,
                  imageUrl: p.imageUrl,
                });
              });
            }
          });
          setProducts(flatUnits);
        }
      })
      .catch((err) => console.error("Error loading products for POS:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.categoryName)))];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      q === "" ||
      p.productName.toLowerCase().includes(q) ||
      p.unitName.toLowerCase().includes(q);
    const matchCategory = selectedCategory === "all" || p.categoryName === selectedCategory;
    return matchQuery && matchCategory;
  });

  const addToCart = (unit: ProductUnit) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.unitId === unit.id);
      if (existing) {
        return prev.map((it) =>
          it.unitId === unit.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          unitId: unit.id,
          productName: unit.productName,
          unitName: unit.unitName,
          price: unit.price,
          stockQuantity: unit.stockQuantity,
          quantity: 1,
        },
      ];
    });
  };

  // Barcode / Scanner / Enter key handling
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredProducts.length > 0) {
      e.preventDefault();
      addToCart(filteredProducts[0]);
      setSearchQuery("");
    }
  };

  const updateQuantity = (unitId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.unitId === unitId) {
            const nextQty = Math.max(1, it.quantity + delta);
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  const removeItem = (unitId: string) => {
    setCart((prev) => prev.filter((it) => it.unitId !== unitId));
  };

  const totalBelanja = cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const kembalian = Math.max(0, (cashTendered || 0) - totalBelanja);

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount);
  };

  const handleCheckoutPOS = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "CASH" && cashTendered < totalBelanja) {
      alert("Nominal uang tunai yang diterima kurang dari total tagihan!");
      return;
    }

    setIsSubmitting(true);
    const cartSnapshot = [...cart];
    const tendered = paymentMethod === "CASH" ? cashTendered : totalBelanja;
    const change = Math.max(0, tendered - totalBelanja);

    try {
      const payload = {
        customerName: customerName.trim() || "Pelanggan Toko",
        customerPhone: customerPhone.trim() || "-",
        paymentMethod,
        cashTendered: tendered,
        items: cart.map((it) => ({
          productUnitId: it.unitId,
          quantity: it.quantity,
          customPrice: it.price,
        })),
      };

      const res = await fetch("/api/v1/admin/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal memproses transaksi kasir");
      }

      // Set completed receipt for modal preview
      setCompletedReceipt({
        orderNumber: json.data.orderNumber,
        customerName: json.data.customerName,
        customerPhone: customerPhone.trim() || undefined,
        grandTotal: json.data.grandTotal,
        cashTendered: tendered,
        changeReturned: change,
        paymentMethod,
        items: cartSnapshot,
        receiptUrl: json.data.receiptUrl,
        createdAt: new Date().toISOString(),
      });

      // Reset cart for next customer
      setCart([]);
      setCashTendered(0);
      setCustomerName("Pelanggan Toko (Walk-in)");
      setCustomerPhone("");
      loadProducts();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!completedReceipt) return;
    const phone = (completedReceipt.customerPhone || "").replace(/[^0-9]/g, "");
    const targetPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;

    const itemListText = completedReceipt.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.productName} (${it.unitName}) x${it.quantity} = Rp ${(
            it.price * it.quantity
          ).toLocaleString("id-ID")}`
      )
      .join("\n");

    const message =
      `*STRUK KASIR RESMI — TOKO SAUDARA*\n` +
      `_Dari Pasar ke Rumah_\n\n` +
      `No. Struk: *${completedReceipt.orderNumber}*\n` +
      `Waktu: ${new Date(completedReceipt.createdAt).toLocaleString("id-ID")}\n` +
      `Pelanggan: ${completedReceipt.customerName}\n\n` +
      `*Daftar Belanjaan:*\n${itemListText}\n\n` +
      `*TOTAL: Rp ${completedReceipt.grandTotal.toLocaleString("id-ID")}*\n` +
      `Bayar: ${completedReceipt.paymentMethod} (Rp ${completedReceipt.cashTendered.toLocaleString("id-ID")})\n` +
      (completedReceipt.changeReturned > 0
        ? `Kembalian: Rp ${completedReceipt.changeReturned.toLocaleString("id-ID")}\n\n`
        : "\n") +
      `Lihat e-receipt digital:\n${window.location.origin}${completedReceipt.receiptUrl}\n\n` +
      `_Matur nuhun telah belanja di Toko Saudara!_`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5" />
            Sistem Kasir Toko & Pasar (POS)
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Kasir Toko Saudara</h1>
          <p className="text-xs text-stone-500 mt-1">
            Pencatat penjualan pembeli langsung di kios/pasar, scanner barcode &amp; hitung kembalian cepat, terhubung ke inventori dan e-receipt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/kelola-barang"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
          >
            + Input Barang &amp; Stok
          </Link>
          <button
            onClick={loadProducts}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
            title="Segarkan Produk"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Ketik nama sayur/sembako atau scan barcode lalu tekan Enter..."
                className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-stone-200 focus:border-emerald-600 text-sm focus:outline-hidden"
                autoFocus
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] text-stone-400 font-mono">
                <ScanBarcode className="w-3.5 h-3.5 text-stone-500" /> Enter = Pilih
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition ${
                    selectedCategory === cat
                      ? "bg-emerald-800 text-white font-bold"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {cat === "all" ? "Semua Kategori" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Units Grid */}
          <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
            {loading ? (
              <div className="py-12 text-center text-stone-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                Memuat daftar produk toko...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Tidak ada produk yang cocok dengan pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-1">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      disabled={isOutOfStock}
                      className={`p-3 text-left rounded-2xl border transition-all flex flex-col justify-between group active:scale-98 ${
                        isOutOfStock
                          ? "bg-stone-50 border-stone-200 opacity-50 cursor-not-allowed"
                          : "border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 bg-white"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-stone-900 line-clamp-1 group-hover:text-emerald-900">
                          {p.productName}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {p.unitName}
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-baseline justify-between">
                        <span className="font-black text-xs text-emerald-900">
                          {formatRupiah(p.price)}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            p.stockQuantity <= 3 ? "text-red-600" : "text-stone-400"
                          }`}
                        >
                          {p.stockQuantity > 0 ? `Sisa ${p.stockQuantity}` : "Habis"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cashier Register & Ticket (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h2 className="font-black text-base text-stone-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              Keranjang Kasir ({cart.length} item)
            </h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-red-600 hover:underline font-semibold"
              >
                Hapus Semua
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                Keranjang kasir masih kosong. Klik produk di sebelah kiri atau ketik nama lalu tekan Enter.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.unitId}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-stone-100 text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-stone-900 truncate">{item.productName}</div>
                    <div className="text-[11px] text-stone-500">
                      {formatRupiah(item.price)} / {item.unitName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.unitId, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-stone-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.unitId, 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.unitId)}
                      className="w-6 h-6 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Metadata Input */}
          <div className="space-y-2 pt-2 border-t border-stone-200 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">Nama Pembeli</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Pelanggan Toko"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">No. WhatsApp (Kirim Struk)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812xxxx (Opsional)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 text-xs">
            <label className="text-[11px] font-bold text-stone-600 block">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "CASH", label: "Tunai (Cash)" },
                { id: "QRIS", label: "QRIS" },
                { id: "TRANSFER", label: "Transfer" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    paymentMethod === m.id
                      ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Amount & Change Calculation */}
          {paymentMethod === "CASH" && (
            <div className="space-y-2 text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-700">Uang Diterima:</span>
                <input
                  type="number"
                  value={cashTendered || ""}
                  onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-36 text-right px-3 py-1.5 rounded-xl border border-stone-300 font-bold text-sm bg-white"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex items-center gap-1.5 justify-end pt-1 flex-wrap">
                <button
                  onClick={() => handleQuickCash(totalBelanja)}
                  className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-bold hover:bg-stone-100"
                >
                  Uang Pas
                </button>
                <button
                  onClick={() => handleQuickCash(20000)}
                  className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-bold hover:bg-stone-100"
                >
                  20.000
                </button>
                <button
                  onClick={() => handleQuickCash(50000)}
                  className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-bold hover:bg-stone-100"
                >
                  50.000
                </button>
                <button
                  onClick={() => handleQuickCash(100000)}
                  className="px-2 py-1 bg-white border border-stone-200 rounded-lg text-[10px] font-bold hover:bg-stone-100"
                >
                  100.000
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-600">Kembalian:</span>
                <span className="font-black text-sm text-emerald-800">
                  {formatRupiah(kembalian)}
                </span>
              </div>
            </div>
          )}

          {/* Grand Total & Action */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-black text-sm text-stone-700">TOTAL BELANJA:</span>
              <span className="font-black text-2xl text-emerald-900">
                {formatRupiah(totalBelanja)}
              </span>
            </div>

            <button
              onClick={handleCheckoutPOS}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>Menyimpan &amp; Menerbitkan Struk...</>
              ) : (
                <>
                  <Printer className="w-4 h-4" /> Bayar &amp; Cetak E-Receipt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* COMPLETED TRANSACTION MODAL WITH THERMAL RECEIPT PREVIEW */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-emerald-800 font-black text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Transaksi Kasir Berhasil!
              </div>
              <button
                onClick={() => setCompletedReceipt(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Preview Box */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 font-mono text-xs space-y-3">
              <div className="text-center space-y-0.5 border-b border-dashed border-stone-300 pb-2">
                <span className="font-bold text-sm text-stone-900 block font-sans">TOKO SAUDARA</span>
                <span className="text-[10px] text-stone-500 block font-sans">Kios Toko Saudara Pasar Kramat Jati Jakarta Timur</span>
                <span className="text-[10px] text-stone-400 block">{completedReceipt.orderNumber}</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">Pelanggan:</span>
                  <span className="font-bold">{completedReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Waktu:</span>
                  <span>{new Date(completedReceipt.createdAt).toLocaleTimeString("id-ID")} WIB</span>
                </div>
              </div>

              <div className="border-t border-dashed border-stone-300 pt-2 space-y-1.5">
                {completedReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {it.productName} ({it.unitName}) x{it.quantity}
                    </span>
                    <span className="font-bold">
                      {formatRupiah(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-stone-800 pt-2 space-y-1 text-xs">
                <div className="flex justify-between font-black text-stone-900">
                  <span>TOTAL:</span>
                  <span className="text-sm">{formatRupiah(completedReceipt.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600 text-[11px]">
                  <span>Bayar ({completedReceipt.paymentMethod}):</span>
                  <span>{formatRupiah(completedReceipt.cashTendered)}</span>
                </div>
                {completedReceipt.changeReturned > 0 && (
                  <div className="flex justify-between font-bold text-emerald-800 text-[11px]">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(completedReceipt.changeReturned)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={completedReceipt.receiptUrl}
                  target="_blank"
                  className="py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" /> Cetak Struk
                </Link>

                <button
                  onClick={handleShareWhatsApp}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" /> Kirim WhatsApp
                </button>
              </div>

              <button
                onClick={() => setCompletedReceipt(null)}
                className="w-full py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-bold text-xs"
              >
                + Transaksi Kasir Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
