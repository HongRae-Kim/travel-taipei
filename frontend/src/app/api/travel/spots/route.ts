import { proxyGet } from "@/lib/proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return proxyGet("/api/spots", searchParams);
}
