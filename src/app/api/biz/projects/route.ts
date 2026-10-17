import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * GET /api/biz/projects?page=1&page_size=10 — paginated recent projects
 * (PRODUCT-SPEC §4). PC2: Prisma-backed, scoped to the session user's own
 * projects, newest first. Timestamps stay epoch-ms to match the PC1 client.
 */
export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json(
      { error: "no_session", message: "Sign in to list projects." },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const sizeParam = url.searchParams.get("page_size");

  const page = pageParam && /^\d+$/.test(pageParam) ? parseInt(pageParam, 10) : 1;
  const rawSize =
    sizeParam && /^\d+$/.test(sizeParam) ? parseInt(sizeParam, 10) : 10;
  const pageSize = Math.min(50, Math.max(1, rawSize));

  const total = await db.project.count({ where: { userId: user.id } });
  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { _count: { select: { messages: true } } },
  });

  return NextResponse.json({
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.createdAt.getTime(),
      updatedAt: project.updatedAt.getTime(),
      messageCount: project._count.messages,
    })),
    page,
    pageSize,
    total,
  });
}
