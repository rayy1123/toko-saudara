import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/response";

export async function GET(_req: NextRequest) {
  const slots = [
    {
      id: "slot-pagi-1",
      label: "Subuh - Pagi (06:00 - 09:00 WIB)",
      slotStart: "06:00",
      slotEnd: "09:00",
      description: "Sayur dan lauk paling segar langsung dari pasar induk",
      isAvailable: true,
    },
    {
      id: "slot-pagi-2",
      label: "Pagi - Siang (09:00 - 12:00 WIB)",
      slotStart: "09:00",
      slotEnd: "12:00",
      description: "Tepat waktu untuk persiapan makan siang keluarga",
      isAvailable: true,
    },
    {
      id: "slot-siang",
      label: "Siang - Sore (13:00 - 16:00 WIB)",
      slotStart: "13:00",
      slotEnd: "16:00",
      description: "Pengiriman sore santai",
      isAvailable: true,
    },
    {
      id: "slot-sore",
      label: "Sore - Petang (16:00 - 19:00 WIB)",
      slotStart: "16:00",
      slotEnd: "19:00",
      description: "Persiapan stok dapur sebelum malam",
      isAvailable: true,
    },
  ];

  return apiSuccess(slots);
}
