import { proxyGet } from "@/lib/proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  return proxyGet(`/api/phrases/${category}`);
}
