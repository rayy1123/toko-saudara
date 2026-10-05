import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN"); // Only Owner/Admin can view logs
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const actorRole = searchParams.get("actorRole") || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const where: any = {};
    if (action && action !== "ALL") {
      where.action = action;
    }
    if (actorRole && actorRole !== "ALL") {
      where.actor = { role: actorRole };
    }

    const events = await prisma.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    const parsedEvents = events.map((ev) => {
      let parsedMeta: any = {};
      try {
        if (ev.metadata) {
          parsedMeta = JSON.parse(ev.metadata);
        }
      } catch {}

      return {
        id: ev.id,
        action: ev.action,
        resourceType: ev.resourceType,
        resourceId: ev.resourceId,
        metadata: parsedMeta,
        createdAt: ev.createdAt,
        actor: {
          id: ev.actor?.id || ev.actorUserId,
          email: ev.actor?.email || parsedMeta.actorEmail || "Sistem / Petugas",
          name: ev.actor?.profile?.name || parsedMeta.actorName || ev.actor?.email || "Petugas",
          role: ev.actor?.role || parsedMeta.actorRole || "STAFF",
        },
      };
    });

    return apiSuccess(parsedEvents);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat log aktivitas", 500);
  }
}
