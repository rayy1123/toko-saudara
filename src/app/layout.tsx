import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { ToastContainer } from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Toko Saudara — Dari Pasar Ke Rumah",
  description:
    "Belanja sayur mayur, bumbu dapur, buah, dan sembako kualitas pasar tradisional diantar langsung ke rumah Anda. Kios Toko Saudara Pasar Kramat Jati Jakarta Timur. Timbangan pas & jujur.",
  keywords: [
    "toko saudara",
    "sayur kramat jati",
    "pasar kramat jati",
    "sembako jakarta timur",
    "bumbu dapur",
    "dari pasar ke rumah",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-saudara-cream-50 text-saudara-charcoal antialiased">
        <StoreProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <CartDrawer />
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
