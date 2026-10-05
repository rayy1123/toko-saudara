import assert from "node:assert/strict";
import {
  getCategories,
  getCategoryBySlug,
  getProducts,
  getProductBySlug,
  getFreshArrivals,
  getBundlePackages,
  getDailyPriceTicker,
} from "../src/lib/data";

export async function runStorefrontTests() {
  console.log("\n--- Menjalankan tests/customer-storefront.test.ts ---");

  // 1. Get Categories
  console.log("  [TEST] Mengambil semua kategori pasar aktif");
  const categories = await getCategories();
  assert.ok(categories.length >= 6, "Kategori harus minimal 6");
  const sayurCat = categories.find((c) => c.slug === "sayur-segar");
  assert.ok(sayurCat, "Kategori sayur-segar harus ditemukan");

  // 2. Get Products by Category
  console.log("  [TEST] Filter produk berdasarkan kategori sayur-segar");
  const sayurProducts = await getProducts({ categorySlug: "sayur-segar" });
  assert.ok(sayurProducts.length >= 2, "Harus ada minimal 2 sayur segar");
  assert.ok(sayurProducts.every((p) => p.units.length > 0), "Setiap produk harus memiliki unit");

  // 3. Search Products
  console.log("  [TEST] Pencarian produk dengan kata kunci 'bayam'");
  const searchResults = await getProducts({ query: "bayam" });
  assert.ok(searchResults.length >= 1, "Pencarian bayam harus menghasilkan produk");
  assert.ok(
    searchResults[0].name.toLowerCase().includes("bayam"),
    "Nama produk hasil pencarian harus mengandung bayam"
  );

  // 4. Product Detail by Slug
  console.log("  [TEST] Mengambil detail produk spesifik berdasarkan slug");
  const bayamDetail = await getProductBySlug("bayam-hijau-segar");
  assert.ok(bayamDetail, "Detail bayam-hijau-segar harus ditemukan");
  assert.equal(bayamDetail.isFresh, true, "Bayam harus bertanda isFresh: true");
  assert.ok(bayamDetail.harvestInfo, "Harus memiliki harvestInfo");
  assert.ok(bayamDetail.units.length >= 2, "Bayam harus memiliki minimal 2 opsi unit");

  // 5. Fresh Arrivals & Bundles
  console.log("  [TEST] Pengambilan produk segar subuh & paket hemat");
  const fresh = await getFreshArrivals(4);
  assert.ok(fresh.length > 0, "Harus ada produk segar subuh");
  assert.ok(fresh.every((p) => p.isFresh), "Semua produk segar harus isFresh: true");

  const bundles = await getBundlePackages();
  assert.ok(bundles.length > 0, "Harus ada paket hemat dapur");

  // 6. Price Ticker
  console.log("  [TEST] Data ticker harga komoditas pasar harian");
  const ticker = await getDailyPriceTicker();
  assert.ok(ticker.length >= 5, "Harus ada minimal 5 komoditas ticker harga");
  assert.ok(ticker.some((t) => t.name.includes("Cabai")), "Ticker harus memuat Cabai");

  console.log("  ✓ Semua pengujian customer-storefront.test.ts berhasil!");
}

if (process.argv[1]?.endsWith("customer-storefront.test.ts")) {
  runStorefrontTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
