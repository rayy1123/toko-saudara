"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  Clock,
  Phone,
  MapPin,
  Truck,
} from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="bg-saudara-green-900 text-saudara-cream-50 pt-10 pb-24 md:pb-10 border-t border-saudara-green-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Value Badges Banner (Hanya Timbangan Pas & Jam Operasional Pasar Kramat Jati) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8 border-b border-saudara-green-800">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-saudara-green-800 flex items-center justify-center shrink-0 text-saudara-orange-500">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Timbangan Pas &amp; Jujur</h4>
              <p className="text-xs text-saudara-cream-200 mt-1">
                Setiap gram ditimbang transparan dengan timbangan digital tera resmi.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-saudara-green-800 flex items-center justify-center shrink-0 text-saudara-green-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Jam Buka: 15:30 WIB - 06:00 WIB</h4>
              <p className="text-xs text-saudara-cream-200 mt-1">
                Pengantaran dilakukan saat jam operasional toko ke area Kramat Jati Jakarta Timur.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Toko Saudara"
                className="w-10 h-10 object-contain rounded-xl bg-white/10 p-1"
              />
              <span className="font-black text-xl text-white tracking-tight">Toko Saudara</span>
            </div>
            <p className="text-xs text-saudara-cream-200 leading-relaxed">
              Kios Toko Saudara Pasar Kramat Jati Jakarta Timur. Belanja sayur mayur dan kebutuhan dapur mudah tanpa repot.
            </p>
            <div className="text-xs text-saudara-orange-400 font-bold">
              Dari Pasar Ke Rumah
            </div>
          </div>

          {/* Jam Antar & Area Pengiriman */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-saudara-green-300">
              Slot Pengantaran
            </h5>
            <div className="space-y-2 text-xs text-saudara-cream-200">
              <div className="flex items-center gap-2 font-medium">
                <Truck className="w-4 h-4 text-saudara-orange-400 shrink-0" />
                <span>Pengantaran Dilakukan Saat Jam Operasional (15:30 - 06:00 WIB)</span>
              </div>
              <div className="pt-2">
                <span className="text-[11px] text-saudara-green-300 font-semibold block mb-1">
                  Area Layanan:
                </span>
                <p className="text-xs text-saudara-cream-100 font-medium">
                  Kramat Jati Jakarta Timur &amp; Sekitarnya
                </p>
              </div>
            </div>
          </div>

          {/* Hubungi Toko */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-saudara-green-300">
              Lokasi &amp; Kontak
            </h5>
            <div className="space-y-2.5 text-xs text-saudara-cream-200">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-saudara-orange-400 shrink-0 mt-0.5" />
                <span>Kios Toko Saudara, Pasar Kramat Jati, Jakarta Timur</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-saudara-green-400 shrink-0" />
                <a
                  href="https://wa.me/6282246193969"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-saudara-orange-300 font-bold"
                >
                  WhatsApp: 082246193969
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-saudara-green-800/80 text-center text-[11px] text-saudara-green-300">
          &copy; {new Date().getFullYear()} Toko Saudara &bull; Dari Pasar Ke Rumah &bull; Pasar Kramat Jati Jakarta Timur
        </div>
      </div>
    </footer>
  );
}
