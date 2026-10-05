import { prisma } from "./prisma";

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    return await prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load category:", err);
    return null;
  }
}

export async function getProducts(options?: {
  categorySlug?: string;
  query?: string;
  isFresh?: boolean;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "name";
}) {
  try {
    const where: any = { isActive: true };

    if (options?.categorySlug) {
      where.category = { slug: options.categorySlug };
    }

    if (options?.isFresh !== undefined) {
      where.isFresh = options.isFresh;
    }

    if (options?.query) {
      where.OR = [
        { name: { contains: options.query } },
        { description: { contains: options.query } },
        { harvestInfo: { contains: options.query } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      take: options?.limit,
      include: {
        category: true,
        units: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
      orderBy: options?.sort === "newest" ? { createdAt: "desc" } : { name: "asc" },
    });

    if (options?.sort === "price_asc") {
      products.sort((a, b) => {
        const pA = a.units[0]?.price ?? 0;
        const pB = b.units[0]?.price ?? 0;
        return pA - pB;
      });
    } else if (options?.sort === "price_desc") {
      products.sort((a, b) => {
        const pA = a.units[0]?.price ?? 0;
        const pB = b.units[0]?.price ?? 0;
        return pB - pA;
      });
    }

    return products;
  } catch (err) {
    console.error("Failed to load products:", err);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        units: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load product by slug:", err);
    return null;
  }
}

export async function getFreshArrivals(limit = 4) {
  try {
    return await prisma.product.findMany({
      where: { isActive: true, isFresh: true },
      take: limit,
      include: {
        category: true,
        units: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Failed to load fresh arrivals:", err);
    return [];
  }
}

export async function getBundlePackages(limit = 3) {
  try {
    return await prisma.product.findMany({
      where: {
        isActive: true,
        category: { slug: "paket-hemat" },
      },
      take: limit,
      include: {
        category: true,
        units: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load bundle packages:", err);
    return [];
  }
}

export async function getDailyPriceTicker() {
  return [
    {
      name: "Cabai Merah Keriting",
      marketPrice: "Rp 44.000 / kg",
      trend: "down",
      trendText: "-Rp 2.000 (Stabil)",
      note: "Panen Garut melimpah",
    },
    {
      name: "Bawang Merah Brebes",
      marketPrice: "Rp 34.000 / kg",
      trend: "up",
      trendText: "+Rp 1.000 (Pasar Pagi)",
      note: "Kering gantung super",
    },
    {
      name: "Telur Ayam Negeri",
      marketPrice: "Rp 28.500 / kg",
      trend: "stable",
      trendText: "Harga Tetap",
      note: "Stok peternak aman",
    },
    {
      name: "Bayam Hijau Segar",
      marketPrice: "Rp 3.500 / ikat",
      trend: "stable",
      trendText: "Segar Subuh",
      note: "Petik Ciwidey",
    },
    {
      name: "Beras Pandan Wangi",
      marketPrice: "Rp 78.000 / 5kg",
      trend: "stable",
      trendText: "Harga HET Pasar",
      note: "Pulen alami Cianjur",
    },
  ];
}

export async function getDeliveryAreas() {
  try {
    return await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: { shippingFee: "asc" },
    });
  } catch (err) {
    console.error("Failed to load delivery areas:", err);
    return [];
  }
}

export async function getOrders(userId?: string) {
  try {
    return await prisma.order.findMany({
      where: userId ? { userId } : {},
      include: {
        items: true,
        delivery: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Failed to load orders:", err);
    return [];
  }
}

export async function getOrderById(id: string) {
  try {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        delivery: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (err) {
    console.error("Failed to load order:", err);
    return null;
  }
}
