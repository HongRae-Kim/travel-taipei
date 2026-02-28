import { NextResponse } from "next/server";

type TranslateRequest = {
  text?: string;
};

type GoogleTranslateResponse = [
  Array<[string, string, ...unknown[]]>,
  ...unknown[],
];

const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const MAX_TEXT_LENGTH = 800;

function parseTranslatedText(payload: unknown) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    return null;
  }
  const sentences = payload[0] as GoogleTranslateResponse[0];
  const translated = sentences
    .map((item) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
    .join("")
    .trim();
  return translated || null;
}

export async function POST(request: Request) {
  let body: TranslateRequest;
  try {
    body = (await request.json()) as TranslateRequest;
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 본문(JSON)을 파싱하지 못했습니다." },
      { status: 400 }
    );
  }

  const sourceText = body.text?.trim() ?? "";
  if (!sourceText) {
    return NextResponse.json(
      { success: false, message: "번역할 한국어 문장을 입력해주세요." },
      { status: 400 }
    );
  }
  if (sourceText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { success: false, message: `한 번에 ${MAX_TEXT_LENGTH}자 이하로 입력해주세요.` },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    client: "gtx",
    sl: "ko",
    tl: "zh-TW",
    dt: "t",
    q: sourceText,
  });

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: "번역 서버에 연결하지 못했습니다." },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as unknown;
    const translatedText = parseTranslatedText(payload);
    if (!translatedText) {
      return NextResponse.json(
        { success: false, message: "번역 결과를 해석하지 못했습니다." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        sourceText,
        translatedText,
        sourceLang: "ko",
        targetLang: "zh-TW",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "번역 요청 중 네트워크 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
