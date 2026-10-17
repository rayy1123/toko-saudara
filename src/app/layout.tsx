import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { ToastContainer } from "@/components/ToastContainer";
import { SocialProofToast } from "@/components/SocialProofToast";

export const metadata: Metadata = {
  title: "Toko Saudara — Dari Pasar Ke Rumah",
  description:
    "Belanja sayur mayur, bumbu dapur, buah, dan sembako kualitas pasar tradisional diantar langsung ke rumah Anda. Kios Toko Saudara Pasar Kramat Jati Jakarta Timur. Buka 15:30 - 06:00 WIB. Timbangan pas & jujur.",
  keywords: [
    "toko saudara",
    "sayur kramat jati",
    "pasar kramat jati",
    "sembako jakarta timur",
    "bumbu dapur",
    "dari pasar ke rumah",
    "pasar induk kramat jati",
  ],
  openGraph: {
    title: "Toko Saudara — Dari Pasar Ke Rumah",
    description: "Belanja sayur & sembako segar Pasar Kramat Jati Jakarta Timur diantar langsung ke rumah (15:30 - 06:00 WIB).",
    url: "https://tokosaudara.id",
    siteName: "Toko Saudara",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Toko Saudara - Pasar Kramat Jati",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Toko Saudara — Dari Pasar Ke Rumah",
    description: "Kios Toko Saudara Pasar Kramat Jati Jakarta Timur. Buka 15:30 - 06:00 WIB.",
    images: ["/logo.png"],
  },
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
          <SocialProofToast />
        </StoreProvider>
      </body>
    </html>
  );
}
