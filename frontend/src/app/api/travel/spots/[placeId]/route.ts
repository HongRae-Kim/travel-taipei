import { proxyGet } from "@/lib/proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const { placeId } = await params;
  return proxyGet(`/api/spots/${placeId}`, searchParams);
}
