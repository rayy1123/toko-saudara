import { runAuthTests } from "./auth.test";
import { runPricingTests } from "./pricing.test";
import { runInventoryTests } from "./inventory.test";
import { runCheckoutTests } from "./checkout.test";
import { runSecurityTests } from "./security.test";
import { runStorefrontTests } from "./customer-storefront.test";
import { runAccountingPosTests } from "./accounting-pos.test";

interface TestSuite {
  name: string;
  fn: () => Promise<void>;
}

const SUITES: TestSuite[] = [
  { name: "Autentikasi & RBAC (auth.test.ts)", fn: runAuthTests },
  { name: "Otoritas Harga & Promosi (pricing.test.ts)", fn: runPricingTests },
  { name: "Ledger Inventori & Ambang Stok (inventory.test.ts)", fn: runInventoryTests },
  { name: "Transaksi Checkout & State Machine (checkout.test.ts)", fn: runCheckoutTests },
  { name: "Keamanan, BOLA/IDOR & Hak Akses (security.test.ts)", fn: runSecurityTests },
  { name: "Customer Storefront Data & Katalog (customer-storefront.test.ts)", fn: runStorefrontTests },
  { name: "Akumulasi Penjualan, Pembelian & Pengeluaran (accounting-pos.test.ts)", fn: runAccountingPosTests },
];

async function runAll() {
  console.log("===============================================================");
  console.log("   TOKO SAUDARA — AUTOMATED TEST SUITE RUNNER");
  console.log("   Dari Pasar ke Rumah (Online Grocery & Fresh Produce)");
  console.log("===============================================================");

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  const results: Array<{ name: string; status: "PASS" | "FAIL"; duration: number; error?: string }> = [];

  for (const suite of SUITES) {
    const suiteStart = Date.now();
    try {
      await suite.fn();
      const duration = Date.now() - suiteStart;
      results.push({ name: suite.name, status: "PASS", duration });
      passed++;
    } catch (err: any) {
      const duration = Date.now() - suiteStart;
      console.error(`\n  ✖ GAGAL: ${suite.name}`);
      console.error(`    ${err.message || err}\n`);
      results.push({ name: suite.name, status: "FAIL", duration, error: err.message || String(err) });
      failed++;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n===============================================================");
  console.log("                   RINGKASAN HASIL PENGUJIAN                   ");
  console.log("===============================================================");

  results.forEach((r, idx) => {
    const symbol = r.status === "PASS" ? "✓ PASS" : "✖ FAIL";
    console.log(`  ${idx + 1}. [${symbol}] ${r.name} (${r.duration}ms)`);
  });

  console.log("---------------------------------------------------------------");
  console.log(`  Total Suite : ${SUITES.length}`);
  console.log(`  Lolos (Pass): ${passed}`);
  console.log(`  Gagal (Fail): ${failed}`);
  console.log(`  Waktu Total : ${totalTime} detik`);
  console.log("===============================================================\n");

  if (failed > 0) {
    console.error("Beberapa pengujian gagal. Memeriksa kembali error di atas...");
    process.exit(1);
  } else {
    console.log("Semua pengujian lolos 100%! Sistem siap digunakan dengan aman.\n");
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error("Fatal error running test suite:", err);
  process.exit(1);
});
