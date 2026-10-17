import { NextResponse } from "next/server";
import { listProjects } from "@/lib/store";

/**
 * GET /api/biz/projects?page=1&page_size=10 — paginated recent projects
 * (PRODUCT-SPEC §4). PC1: file-backed store; PC2: Prisma.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const sizeParam = url.searchParams.get("page_size");

  const page = pageParam && /^\d+$/.test(pageParam) ? parseInt(pageParam, 10) : 1;
  const pageSize =
    sizeParam && /^\d+$/.test(sizeParam) ? parseInt(sizeParam, 10) : 10;

  const result = await listProjects(page, pageSize);
  return NextResponse.json(result);
}
