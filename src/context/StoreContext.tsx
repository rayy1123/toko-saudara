"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItemType {
  productUnitId: string;
  productId: string;
  name: string;
  unitName: string;
  unitCode: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  slug: string;
  stockQuantity?: number;
}

export interface PromoType {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  name: string;
  maxDiscount?: number | null;
  minOrderAmount?: number;
  itemBreakdowns?: Array<{
    productUnitId: string;
    productName: string;
    unitName: string;
    discountPerUnit: number;
    quantity: number;
    subtotalDiscount: number;
  }>;
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "ADMIN" | "COURIER";
  addressLine: string;
  district: string;
  city: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

export interface StoreContextType {
  cart: CartItemType[];
  totalItems: number;
  subtotal: number;
  addToCart: (item: Omit<CartItemType, "quantity">, quantity?: number) => void;
  updateQuantity: (productUnitId: string, quantity: number) => void;
  removeFromCart: (productUnitId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedPromo: PromoType | null;
  discountAmount: number;
  applyPromo: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromo: () => void;
  user: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
  loginAs: (role: "customer" | "admin" | "guest") => void;
  logout: () => void;
  toasts: ToastItem[];
  showToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Initialize as empty guest state by default
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoType | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("saudara_cart");
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCart(Array.isArray(parsed) ? parsed : []);
        } catch {
          setCart([]);
        }
      } else {
        setCart([]);
      }

      const savedUser = localStorage.getItem("saudara_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Clear legacy demo customer so no fake account is stuck
          if (parsed?.id === "customer-siti-id") {
            localStorage.removeItem("saudara_user");
            setUser(null);
          } else {
            setUser(parsed);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      const savedPromo = localStorage.getItem("saudara_promo");
      if (savedPromo) {
        try {
          setAppliedPromo(JSON.parse(savedPromo));
        } catch {
          setAppliedPromo(null);
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("saudara_cart", JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not save cart to localStorage:", e);
    }
  }, [cart, isHydrated]);

  // Save promo to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (appliedPromo) {
        localStorage.setItem("saudara_promo", JSON.stringify(appliedPromo));
      } else {
        localStorage.removeItem("saudara_promo");
      }
    } catch (e) {
      console.warn("Could not save promo:", e);
    }
  }, [appliedPromo, isHydrated]);

  const showToast = (message: string, type: "success" | "info" | "warning" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToCart = (item: Omit<CartItemType, "quantity">, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productUnitId === item.productUnitId);
      if (existing) {
        return prev.map((i) =>
          i.productUnitId === item.productUnitId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    showToast(`✓ Ditambahkan ke keranjang: ${item.name} (${item.unitName})`);
  };

  const updateQuantity = (productUnitId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productUnitId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.productUnitId === productUnitId ? { ...i, quantity } : i))
    );
  };

  const removeFromCart = (productUnitId: string) => {
    setCart((prev) => {
      const found = prev.find((i) => i.productUnitId === productUnitId);
      if (found) {
        showToast(`Dihapus dari keranjang: ${found.name}`, "info");
      }
      return prev.filter((i) => i.productUnitId !== productUnitId);
    });
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Calculate discount based on active promo
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.itemBreakdowns && appliedPromo.itemBreakdowns.length > 0) {
      const discountMap = new Map(
        appliedPromo.itemBreakdowns.map((b) => [b.productUnitId, b.discountPerUnit])
      );
      for (const item of cart) {
        const perUnit = discountMap.get(item.productUnitId);
        if (perUnit) {
          discountAmount += perUnit * item.quantity;
        }
      }
      if (appliedPromo.maxDiscount && appliedPromo.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, appliedPromo.maxDiscount);
      }
    } else if (appliedPromo.type === "PERCENTAGE") {
      let calculated = (subtotal * appliedPromo.value) / 100;
      if (appliedPromo.maxDiscount && appliedPromo.maxDiscount > 0) {
        calculated = Math.min(calculated, appliedPromo.maxDiscount);
      }
      discountAmount = calculated;
    } else if (appliedPromo.type === "FIXED") {
      discountAmount = Math.min(appliedPromo.value, subtotal);
    }
  }

  const applyPromo = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: "Masukkan kode voucher" };
    }

    // 1. First attempt to validate via server API to support dynamic admin item-specific promos
    try {
      const itemsPayload = cart.map((i) => ({
        productUnitId: i.productUnitId,
        unitPrice: i.price,
        quantity: i.quantity,
        productName: i.name,
        unitName: i.unitName,
      }));

      const res = await fetch("/api/v1/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          subtotal,
          items: itemsPayload,
        }),
      });

      const json = await res.json();

      if (res.ok && json.data) {
        const promo: PromoType = {
          code: json.data.code,
          name: json.data.name,
          type: json.data.type,
          value: json.data.value,
          maxDiscount: json.data.maxDiscount,
          minOrderAmount: json.data.minOrderAmount,
          itemBreakdowns: json.data.itemBreakdowns || [],
        };
        setAppliedPromo(promo);
        showToast(`✓ Voucher ${promo.code} aktif! Potongan Rp ${json.data.discount.toLocaleString("id-ID")}`);
        return { success: true, message: `Voucher ${promo.code} aktif!` };
      }

      if (json.error?.message) {
        return { success: false, message: json.error.message };
      }
    } catch {}

    // 2. Client fallback for built-in promos
    if (cleanCode === "LANGGANAN") {
      if (subtotal < 30000) {
        return { success: false, message: "Minimal belanja Rp 30.000 untuk voucher LANGGANAN" };
      }
      const promo: PromoType = {
        code: "LANGGANAN",
        name: "Diskon Khusus Pelanggan Langganan Setia (15%)",
        type: "PERCENTAGE",
        value: 15,
        maxDiscount: 20000,
        minOrderAmount: 30000,
      };
      setAppliedPromo(promo);
      showToast("Voucher LANGGANAN aktif! Diskon 15% khusus pelanggan langganan");
      return { success: true, message: "Voucher LANGGANAN aktif!" };
    }

    if (cleanCode === "PASARPAGI") {
      if (subtotal < 30000) {
        return { success: false, message: "Minimal belanja Rp 30.000 untuk voucher PASARPAGI" };
      }
      const promo: PromoType = {
        code: "PASARPAGI",
        name: "Promo Pasar Pagi Diskon 10%",
        type: "PERCENTAGE",
        value: 10,
        maxDiscount: 15000,
        minOrderAmount: 30000,
      };
      setAppliedPromo(promo);
      showToast("Voucher PASARPAGI berhasil digunakan! Diskon 10%");
      return { success: true, message: "Voucher PASARPAGI aktif!" };
    }

    if (cleanCode === "HEMATONGKIR") {
      if (subtotal < 25000) {
        return { success: false, message: "Minimal belanja Rp 25.000 untuk voucher HEMATONGKIR" };
      }
      const promo: PromoType = {
        code: "HEMATONGKIR",
        name: "Potongan Ongkir Rp 5.000",
        type: "FIXED",
        value: 5000,
        minOrderAmount: 25000,
      };
      setAppliedPromo(promo);
      showToast("Voucher HEMATONGKIR berhasil digunakan! Diskon Rp 5.000");
      return { success: true, message: "Voucher HEMATONGKIR aktif!" };
    }

    return {
      success: false,
      message: `Kode voucher "${cleanCode}" tidak ditemukan atau belum aktif`,
    };
  };

  const removePromo = () => {
    setAppliedPromo(null);
    showToast("Voucher promo dibatalkan", "info");
  };

  const setCurrentUser = (u: UserType | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem("saudara_user", JSON.stringify(u));
      } else {
        localStorage.removeItem("saudara_user");
      }
    } catch {}
  };

  const loginAs = (role: "customer" | "admin" | "guest") => {
    if (role === "admin") {
      const adminUser: UserType = {
        id: "admin-saudara-id",
        name: "Bang Saudara (Admin Toko)",
        email: "admin@tokosaudara.id",
        phone: "081234567890",
        role: "ADMIN",
        addressLine: "Pasar Simpang Dago Kios No. 12",
        district: "Coblong",
        city: "Kota Bandung",
      };
      setCurrentUser(adminUser);
      showToast("Masuk sebagai Admin Toko Saudara");
    } else {
      setCurrentUser(null);
      showToast("Beralih ke mode Pengunjung (Guest)", "info");
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    showToast("Anda telah keluar akun", "info");
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        totalItems,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        appliedPromo,
        discountAmount,
        applyPromo,
        removePromo,
        user,
        setCurrentUser,
        loginAs,
        logout,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
