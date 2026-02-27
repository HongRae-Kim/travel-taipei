import { NextResponse } from "next/server";
import { backendUrl } from "@/lib/backend";

const DEFAULT_HEADERS = {
  Accept: "application/json",
};

export async function proxyGet(path: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString();
  const target = query ? `${backendUrl(path)}?${query}` : backendUrl(path);

  try {
    const response = await fetch(target, {
      method: "GET",
      headers: DEFAULT_HEADERS,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const body = isJson
      ? await response.json()
      : {
          success: false,
          message: "백엔드 응답을 JSON으로 파싱할 수 없습니다.",
        };

    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "백엔드 서버에 연결할 수 없습니다. BACKEND_API_BASE_URL과 서버 상태를 확인해주세요.",
      },
      { status: 502 }
    );
  }
}
