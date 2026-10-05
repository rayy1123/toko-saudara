"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  Clock,
  Truck,
  ShieldCheck,
  User,
  Menu,
  X,
  Tag,
  Package,
  Layers,
  Home,
  CheckCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, subtotal, setIsCartOpen, user, loginAs, logout } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/kategori?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Kategori", href: "/kategori" },
    { label: "Pesanan Saya", href: "/pesanan" },
  ];

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* Top Banner: Jam Operasional & Kontak */}
      <div className="bg-saudara-green-900 text-saudara-cream-50 text-xs py-2 px-4 border-b border-saudara-green-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="inline-flex items-center gap-1 bg-saudara-green-700/80 px-2.5 py-0.5 rounded-md text-[11px] font-bold text-saudara-cream-100">
              <Clock className="w-3 h-3 text-saudara-orange-400" /> Jam Buka: 15:30 WIB - 06:00 WIB
            </span>
            <span className="hidden md:inline text-saudara-green-300">•</span>
            <span className="hidden md:inline flex items-center gap-1 text-saudara-green-200">
              <Truck className="w-3 h-3 text-saudara-green-400" />
              Pengantaran Dilakukan Saat Jam Operasional (Kramat Jati Jakarta Timur)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-saudara-cream-100">
            <span>Kios Toko Saudara Pasar Kramat Jati</span>
            <span className="hidden sm:inline">|</span>
            <a
              href="https://wa.me/6282246193969"
              target="_blank"
              rel="noopener noreferrer"
              className="text-saudara-orange-400 hover:text-saudara-orange-300 font-bold flex items-center gap-1"
            >
              WA: 082246193969
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-saudara-cream-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Logo & Brand (Lebih Besar & Sangat Terlihat) */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group py-1">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden drop-shadow-md group-hover:scale-105 transition-transform bg-white flex items-center justify-center p-0.5 border-2 border-saudara-green-600/40 ring-2 ring-saudara-green-100 shadow-xs">
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
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-saudara-green-900 leading-none">
                Toko Saudara
              </span>
              <span className="text-xs sm:text-sm font-bold text-saudara-orange-600 tracking-wide mt-1">
                Dari Pasar Ke Rumah
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-lg items-center relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari sayur subuh, cabai, telur, bumbu dapur, sembako..."
              className="w-full pl-10 pr-20 py-2.5 bg-saudara-cream-50 hover:bg-white focus:bg-white border border-saudara-cream-200 focus:border-saudara-green-600 rounded-full text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-saudara-green-500/20 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 bg-saudara-green-700 hover:bg-saudara-green-800 text-white rounded-full text-xs font-semibold transition-colors"
            >
              Cari
            </button>
          </form>

          {/* Right Action Icons: Cart & Account */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Account Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-sm font-medium rounded-xl hover:bg-saudara-cream-100 text-saudara-charcoal transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-saudara-green-100 text-saudara-green-800 flex items-center justify-center font-bold text-xs">
                  {user ? user.name.charAt(0) : <User className="w-4 h-4" />}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-none truncate max-w-[120px]">
                    {user ? user.name.split(" ")[0] : "Akun"}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {user ? (user.role === "ADMIN" ? "Admin" : "Pelanggan") : "Masuk / Daftar"}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden lg:block" />
              </button>

              {/* User Dropdown */}
              {isUserDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-saudara-cream-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setIsUserDropdownOpen(false)}
                >
                  {user ? (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-400">Akun Aktif</p>
                      <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  ) : (
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Selamat datang di Toko Saudara!</p>
                      <Link
                        href="/masuk"
                        className="mt-2 block text-center text-xs market-btn-primary py-1.5"
                      >
                        Masuk ke Akun
                      </Link>
                    </div>
                  )}

                  <div className="py-1">
                    <Link
                      href="/pesanan"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-saudara-cream-50"
                    >
                      <Package className="w-4 h-4 text-saudara-green-600" />
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/kategori"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-saudara-cream-50"
                    >
                      <Layers className="w-4 h-4 text-saudara-orange-600" />
                      Semua Kategori
                    </Link>
                  </div>

                  {/* Admin & Account Actions */}
                  <div className="pt-2 pb-1 px-4 border-t border-gray-100 bg-saudara-cream-50/60">
                    <div className="flex flex-col gap-1">
                      <Link
                        href="/admin"
                        className="text-left text-xs text-saudara-green-900 font-bold hover:text-saudara-orange-600 py-1 flex items-center justify-between"
                      >
                        <span>Portal Admin & Kasir</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </Link>
                      {user && (
                        <button
                          onClick={logout}
                          className="text-left text-xs text-red-600 hover:font-bold py-1 flex items-center gap-1 mt-0.5 pt-1 border-t border-gray-200"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Keluar Akun</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Header Button / Pill */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-saudara-green-700 hover:bg-saudara-green-800 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm group"
              aria-label="Buka keranjang belanja"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-saudara-cream-100 group-hover:scale-110 transition-transform" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-saudara-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] text-saudara-green-200 font-medium leading-none">
                  Keranjang
                </span>
                <span className="text-xs font-bold leading-tight mt-0.5">
                  {totalItems > 0 ? formatRupiah(subtotal) : "Rp 0"}
                </span>
              </div>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-saudara-cream-100 text-gray-700"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Navigation Bar (Desktop) */}
        <nav className="hidden md:block bg-saudara-cream-50 border-t border-saudara-cream-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center space-x-1 sm:space-x-6 text-xs sm:text-sm font-medium text-gray-700 py-2.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors py-1 px-2.5 rounded-lg ${
                      isActive
                        ? "text-saudara-green-800 font-bold bg-saudara-green-100/60"
                        : "hover:text-saudara-green-700 hover:bg-saudara-cream-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 py-1">
              <span className="flex items-center gap-1 font-semibold text-saudara-green-800">
                <Clock className="w-3.5 h-3.5 text-saudara-orange-600" /> Buka: 15:30 - 06:00 WIB • Pasar Kramat Jati
              </span>
            </div>
          </div>
        </nav>

        {/* Mobile Search & Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-saudara-cream-200 px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sayur, bumbu, telur..."
                className="w-full pl-9 pr-16 py-2 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-sm focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-saudara-green-700 text-white rounded-lg text-xs font-semibold"
              >
                Cari
              </button>
            </form>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                    pathname === link.href
                      ? "bg-saudara-green-100 text-saudara-green-800 font-bold"
                      : "text-gray-700 hover:bg-saudara-cream-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Floating Cart Pill (Fixed Bottom for Mobile) */}
      {totalItems > 0 && pathname !== "/keranjang" && pathname !== "/checkout" && (
        <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 z-40 sm:left-auto sm:right-6 pointer-events-none">
          <div className="pointer-events-auto max-w-sm sm:max-w-none mx-auto bg-saudara-green-800 text-white rounded-2xl shadow-xl border border-saudara-green-700 p-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-4 transition-all hover:bg-saudara-green-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-saudara-orange-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                {totalItems}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-saudara-green-200 uppercase tracking-wider font-semibold">
                  Keranjang Belanja
                </span>
                <span className="text-sm font-extrabold text-white">
                  {formatRupiah(subtotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-colors"
              >
                Intip
              </button>
              <Link
                href="/keranjang"
                className="px-3.5 py-1.5 bg-saudara-orange-600 hover:bg-saudara-orange-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
              >
                Bayar
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-saudara-cream-200 py-1.5 px-3 flex items-center justify-around text-[10px] text-gray-600 shadow-md">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 ${
            pathname === "/" ? "text-saudara-green-700 font-bold" : "hover:text-saudara-green-700"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Beranda</span>
        </Link>
        <Link
          href="/kategori"
          className={`flex flex-col items-center gap-0.5 ${
            pathname.startsWith("/kategori") ? "text-saudara-green-700 font-bold" : "hover:text-saudara-green-700"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Kategori</span>
        </Link>
        <Link
          href="/pesanan"
          className={`flex flex-col items-center gap-0.5 ${
            pathname.startsWith("/pesanan") ? "text-saudara-green-700 font-bold" : "hover:text-saudara-green-700"
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Pesanan</span>
        </Link>
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center gap-0.5 relative text-saudara-green-800 font-semibold"
        >
          <ShoppingBag className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 right-1 bg-saudara-orange-600 text-white rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center font-bold">
              {totalItems}
            </span>
          )}
          <span>Keranjang</span>
        </button>
      </div>
    </>
  );
}
