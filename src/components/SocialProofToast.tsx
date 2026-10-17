"use client";

import React, { useState, useEffect } from "react";
import { ShoppingBag, CheckCircle, Clock, X } from "lucide-react";

interface SocialProof {
  name: string;
  location: string;
  item: string;
  timeAgo: string;
}

const SAMPLE_PROOFS: SocialProof[] = [
  {
    name: "Ibu Maya",
    location: "Kramat Jati",
    item: "Beras Pandan Wangi 5kg",
    timeAgo: "2 menit lalu",
  },
  {
    name: "Pak Dimas",
    location: "Kec. Makasar",
    item: "1kg Telur Ayam & Bayam Hijau",
    timeAgo: "4 menit lalu",
  },
  {
    name: "Ibu Rini",
    location: "Pasar Rebo",
    item: "Cabai Merah Keriting & Bumbu",
    timeAgo: "7 menit lalu",
  },
  {
    name: "Ibu Endang",
    location: "Jatinegara",
    item: "Minyak Goreng 2L & Tempe",
    timeAgo: "11 menit lalu",
  },
  {
    name: "Pak Hendra",
    location: "Ciracas",
    item: "Paket Sayur Masak & Bawang",
    timeAgo: "15 menit lalu",
  },
];

export function SocialProofToast() {
  const [currentProof, setCurrentProof] = useState<SocialProof | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show initial proof after 4 seconds
    const initialTimer = setTimeout(() => {
      const randomItem = SAMPLE_PROOFS[Math.floor(Math.random() * SAMPLE_PROOFS.length)];
      setCurrentProof(randomItem);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }, 4000);

    // Show subsequent proofs every 25 seconds
    const interval = setInterval(() => {
      const randomItem = SAMPLE_PROOFS[Math.floor(Math.random() * SAMPLE_PROOFS.length)];
      setCurrentProof(randomItem);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }, 28000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (!currentProof || !isVisible || dismissed) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 z-40 max-w-xs animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-saudara-green-200 shadow-xl flex items-center gap-3 relative">
        <div className="w-10 h-10 rounded-xl bg-saudara-green-100 text-saudara-green-800 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5 text-saudara-green-700" />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[11px] font-extrabold text-stone-900 leading-tight truncate">
            {currentProof.name} di {currentProof.location}
          </p>
          <p className="text-[11px] text-stone-600 truncate mt-0.5 font-medium">
            Membeli {currentProof.item}
          </p>
          <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-emerald-600" /> {currentProof.timeAgo} • Diantar Toko
          </p>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-stone-300 hover:text-stone-500 p-0.5"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
