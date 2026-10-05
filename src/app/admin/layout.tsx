"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  TrendingUp,
  BarChart3,
  MapPin,
  Clock,
  LogOut,
  Menu,
  X,
  Store,
  ShieldCheck,
  ChevronRight,
  User,
  Calculator,
  Receipt,
  CircleDollarSign,
  Layers,
  PackagePlus,
  Tag,
  ShieldAlert,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Ringkasan Dasbor", icon: LayoutDashboard },
  { href: "/admin/log-aktivitas", label: "Log Aktivitas Kasir", icon: ShieldAlert },
  { href: "/admin/kasir", label: "Kasir / Catat Jual", icon: Calculator },
  { href: "/admin/kelola-barang", label: "Input Barang, Stok & Harga", icon: PackagePlus },
  { href: "/admin/promo", label: "Kelola Promo & Diskon", icon: Tag },
  { href: "/admin/pesanan", label: "Pesanan & E-Receipt", icon: ShoppingBag },
  { href: "/admin/pembelian", label: "Pembelian / Kulakan", icon: Boxes },
  { href: "/admin/pengeluaran", label: "Pengeluaran Operasional", icon: Receipt },
  { href: "/admin/keuangan", label: "Akumulasi & Laba Rugi", icon: BarChart3 },
  { href: "/admin/produk", label: "Katalog Produk", icon: Package },
  { href: "/admin/inventori", label: "Cek Stok & Barang", icon: Layers },
  { href: "/admin/harga", label: "Update Harga Harian", icon: TrendingUp },
  { href: "/admin/area", label: "Area Pengiriman", icon: MapPin },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; text: string }>({
    isOpen: true,
    text: "Buka Toko (15:30 - 06:00 WIB)",
  });
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string }>({
    name: "Petugas Toko Saudara",
    email: "admin@tokosaudara.id",
    role: "ADMIN",
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Check market opening hours (15:30 - 06:00 WIB)
    const currentHour = new Date().getHours();
    const isOpen = currentHour >= 15 || currentHour < 6;
    setStoreStatus({
      isOpen,
      text: isOpen ? "Buka Toko (15:30 - 06:00 WIB)" : "Toko Tutup (Buka 15:30 WIB)",
    });

    if (pathname === "/admin/login") {
      setIsAuthChecking(false);
      return;
    }

    // Verify session authentication
    fetch("/api/v1/auth/me")
      .then((r) => {
        if (!r.ok) {
          throw new Error("Unauthorized");
        }
        return r.json();
      })
      .then((d) => {
        if (d.data && (d.data.role === "ADMIN" || d.data.role === "CASHIER")) {
          setAdminUser({
            name: d.data.profile?.name || (d.data.role === "ADMIN" ? "Pemilik Toko Saudara" : "Kasir Toko Saudara"),
            email: d.data.email || "",
            role: d.data.role,
          });
          setIsAuthChecking(false);
        } else {
          router.push("/admin/login");
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [pathname, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs text-center space-y-2">
          <div className="w-8 h-8 rounded-full border-4 border-emerald-700 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-700">Memeriksa hak akses portal toko...</p>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
    router.refresh();
  }

  // Filter menu based on role (Kasir dapat otoritas kasir, ubah harga, masuk barang, cek stok)
  const isCashier = adminUser.role === "CASHIER";
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (isCashier) {
      return [
        "/admin/kasir",
        "/admin/kelola-barang",
        "/admin/pembelian",
        "/admin/inventori",
        "/admin/produk",
        "/admin/pesanan",
      ].includes(item.href);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-emerald-900 text-white px-4 py-3 flex items-center justify-between shadow sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5 shrink-0 shadow-xs">
            <video
              src="/video-toko-saudara.mp4"
              autoPlay
              loop
              muted
              playsInline
              poster="/logo.png"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="font-extrabold text-base leading-tight">Toko Saudara</div>
            <div className="text-[10px] text-emerald-300">Pasar Kramat Jati • Admin</div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-emerald-800 text-emerald-100 hover:bg-emerald-700"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar for Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-white flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white p-0.5 shadow-md shrink-0 border border-emerald-700">
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
            <div>
              <h1 className="font-black text-lg leading-tight tracking-tight">Toko Saudara</h1>
              <p className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pasar Kramat Jati
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-emerald-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Store Status */}
        <div className="px-4 py-3 mx-4 my-3 bg-emerald-950/60 rounded-xl border border-emerald-800/80 flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            {storeStatus.isOpen && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                storeStatus.isOpen ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
          </span>
          <div className="text-xs">
            <div className="font-medium text-emerald-100 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              {storeStatus.isOpen ? "Toko Aktif" : "Di Luar Jam"}
            </div>
            <div className="text-[11px] text-emerald-300/80">{storeStatus.text}</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-emerald-100 hover:bg-emerald-800/60 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-200" : "text-emerald-300"}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-300" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Logout */}
        <div className="p-4 border-t border-emerald-800 bg-emerald-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-emerald-800 rounded-full flex items-center justify-center shrink-0 border border-emerald-700">
              <User className="w-4 h-4 text-emerald-200" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">{adminUser.name}</p>
              </div>
              <span className="inline-block px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-700 text-emerald-100 mt-0.5">
                {adminUser.role === "CASHIER" ? "🛒 Kasir Toko" : "👑 Pemilik Toko"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-800/80 hover:bg-red-900/80 hover:border-red-700 text-emerald-200 hover:text-red-100 text-xs font-medium rounded-lg border border-emerald-700 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto max-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
