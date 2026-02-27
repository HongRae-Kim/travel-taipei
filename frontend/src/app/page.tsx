"use client";

import { useEffect, useMemo, useState } from "react";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type WeatherResponse = {
  city: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  iconUrl: string;
  windSpeed: number;
};

type ExchangeRateResponse = {
  currency: string;
  baseRate: number;
  buyRate: number;
  sellRate: number;
  date: string;
};

type SpotResponse = {
  id: string;
  name: string;
  type: string;
  rating: number | null;
  address: string;
  photoUrl: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  reason: string;
};

type SpotDetailResponse = {
  id: string;
  name: string;
  type: string;
  rating: number | null;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string[];
  photoUrls: string[];
  lat: number;
  lng: number;
};

type SpotFilters = {
  type: "restaurant" | "cafe" | "attraction";
  lat: string;
  lng: string;
  radius: string;
  openNow: boolean;
  minRating: string;
};

const INITIAL_FILTERS: SpotFilters = {
  type: "restaurant",
  lat: "",
  lng: "",
  radius: "5000",
  openNow: false,
  minRating: "",
};

async function requestApi<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("응답 파싱에 실패했습니다.");
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "요청에 실패했습니다.");
  }

  return payload.data;
}

function typeLabel(type: string) {
  if (type === "restaurant") return "맛집";
  if (type === "cafe") return "카페";
  return "관광지";
}

export default function Home() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [exchange, setExchange] = useState<ExchangeRateResponse | null>(null);
  const [spots, setSpots] = useState<SpotResponse[]>([]);
  const [spotDetail, setSpotDetail] = useState<SpotDetailResponse | null>(null);

  const [filters, setFilters] = useState<SpotFilters>(INITIAL_FILTERS);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    void loadSummary();
    void searchSpots(INITIAL_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSummary() {
    setLoadingSummary(true);
    setSummaryError(null);

    try {
      const [weatherData, exchangeData] = await Promise.all([
        requestApi<WeatherResponse>("/api/travel/weather"),
        requestApi<ExchangeRateResponse>("/api/travel/exchange-rates"),
      ]);
      setWeather(weatherData);
      setExchange(exchangeData);
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : "요약 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoadingSummary(false);
    }
  }

  async function searchSpots(nextFilters = filters) {
    setLoadingSpots(true);
    setSpotError(null);

    try {
      const params = new URLSearchParams({
        type: nextFilters.type,
        radius: nextFilters.radius || "5000",
        openNow: String(nextFilters.openNow),
      });

      if (nextFilters.lat.trim()) {
        params.set("lat", nextFilters.lat.trim());
      }
      if (nextFilters.lng.trim()) {
        params.set("lng", nextFilters.lng.trim());
      }
      if (nextFilters.minRating.trim()) {
        params.set("minRating", nextFilters.minRating.trim());
      }

      const data = await requestApi<SpotResponse[]>(`/api/travel/spots?${params.toString()}`);
      setSpots(data);
      setSpotDetail(null);
      setSelectedSpotId(null);
    } catch (error) {
      setSpots([]);
      setSpotError(error instanceof Error ? error.message : "장소 목록 조회에 실패했습니다.");
    } finally {
      setLoadingSpots(false);
    }
  }

  async function loadSpotDetail(spotId: string) {
    setLoadingDetail(true);
    setDetailError(null);
    setSelectedSpotId(spotId);

    try {
      const detail = await requestApi<SpotDetailResponse>(
        `/api/travel/spots/${spotId}?type=${filters.type}`
      );
      setSpotDetail(detail);
    } catch (error) {
      setSpotDetail(null);
      setDetailError(error instanceof Error ? error.message : "장소 상세 조회에 실패했습니다.");
    } finally {
      setLoadingDetail(false);
    }
  }

  const spotCountLabel = useMemo(() => {
    if (loadingSpots) {
      return "불러오는 중";
    }
    return `${spots.length}개 장소`;
  }, [loadingSpots, spots.length]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#fee8d6_0%,transparent_35%),radial-gradient(circle_at_100%_10%,#dff3ec_0%,transparent_40%),linear-gradient(180deg,#f6f8fb_0%,#f4efe7_100%)] px-5 py-8 text-slate-900 md:px-10">
      <main className="mx-auto w-full max-w-6xl">
        <section className="rounded-3xl border border-white/60 bg-white/75 p-6 shadow-[0_18px_55px_-30px_rgba(20,24,40,.35)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Travel Taipei</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Frontend API 연결 대시보드</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
                백엔드 환율/날씨/장소추천 API를 한 화면에서 호출하고 결과를 바로 확인할 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => {
                void loadSummary();
                void searchSpots();
              }}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 md:w-auto"
            >
              전체 새로고침
            </button>
          </div>
        </section>

        {summaryError ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {summaryError}
          </p>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_16px_40px_-30px_rgba(0,0,0,.35)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">오늘의 환율</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">KRW ↔ TWD</span>
            </div>
            {loadingSummary ? (
              <p className="mt-5 text-sm text-slate-500">환율 정보를 불러오는 중...</p>
            ) : exchange ? (
              <div className="mt-5 grid gap-3">
                <p className="text-3xl font-black">
                  {exchange.baseRate.toFixed(2)} <span className="text-sm font-semibold text-slate-500">기준가</span>
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-100/80 p-3">매수: {exchange.buyRate.toFixed(2)}</div>
                  <div className="rounded-xl bg-slate-100/80 p-3">매도: {exchange.sellRate.toFixed(2)}</div>
                </div>
                <p className="text-xs text-slate-500">기준일: {exchange.date}</p>
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">환율 데이터 없음</p>
            )}
          </article>

          <article className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_16px_40px_-30px_rgba(0,0,0,.35)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold">타이베이 날씨</h2>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">실시간</span>
            </div>
            {loadingSummary ? (
              <p className="mt-5 text-sm text-slate-500">날씨 정보를 불러오는 중...</p>
            ) : weather ? (
              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{weather.city}</p>
                  <p className="mt-1 text-3xl font-black">{weather.temperature.toFixed(1)}°C</p>
                  <p className="mt-1 text-sm text-slate-600">
                    체감 {weather.feelsLike.toFixed(1)}°C · 습도 {weather.humidity}% · 풍속 {weather.windSpeed.toFixed(1)}m/s
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{weather.description}</p>
                </div>
                {weather.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={weather.iconUrl} alt={weather.description} className="h-18 w-18 rounded-xl bg-slate-100 p-1" />
                ) : null}
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">날씨 데이터 없음</p>
            )}
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-[0_16px_40px_-30px_rgba(0,0,0,.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">장소추천 API</h2>
              <p className="mt-1 text-sm text-slate-600">필터를 바꿔가며 `/api/spots` 결과를 바로 확인할 수 있습니다.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{spotCountLabel}</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-6">
            <label className="grid gap-1 text-sm">
              타입
              <select
                value={filters.type}
                onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value as SpotFilters["type"] }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <option value="restaurant">restaurant</option>
                <option value="cafe">cafe</option>
                <option value="attraction">attraction</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              위도(lat)
              <input
                value={filters.lat}
                onChange={(event) => setFilters((prev) => ({ ...prev, lat: event.target.value }))}
                placeholder="예: 25.0330"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              경도(lng)
              <input
                value={filters.lng}
                onChange={(event) => setFilters((prev) => ({ ...prev, lng: event.target.value }))}
                placeholder="예: 121.5654"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              반경(m)
              <input
                value={filters.radius}
                onChange={(event) => setFilters((prev) => ({ ...prev, radius: event.target.value }))}
                placeholder="5000"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              최소 평점
              <input
                value={filters.minRating}
                onChange={(event) => setFilters((prev) => ({ ...prev, minRating: event.target.value }))}
                placeholder="4.0"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={(event) => setFilters((prev) => ({ ...prev, openNow: event.target.checked }))}
              />
              영업 중만
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => void searchSpots()}
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              추천 다시 조회
            </button>
            <button
              onClick={() => {
                setFilters(INITIAL_FILTERS);
                void searchSpots(INITIAL_FILTERS);
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              필터 초기화
            </button>
          </div>

          {spotError ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{spotError}</p>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="grid gap-3">
              {loadingSpots ? (
                <p className="rounded-xl bg-slate-100 px-4 py-6 text-sm text-slate-500">장소 목록을 불러오는 중...</p>
              ) : spots.length === 0 ? (
                <p className="rounded-xl bg-slate-100 px-4 py-6 text-sm text-slate-500">조건에 맞는 장소가 없습니다.</p>
              ) : (
                spots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => void loadSpotDetail(spot.id)}
                    className={`grid gap-2 rounded-2xl border px-4 py-4 text-left transition ${
                      selectedSpotId === spot.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{typeLabel(spot.type)}</p>
                        <p className="mt-1 text-base font-bold">{spot.name}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        ⭐ {spot.rating?.toFixed(1) ?? "-"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{spot.address}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
                        거리 {spot.distanceKm.toFixed(2)}km
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-800">{spot.reason}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">상세 정보</h3>
              {loadingDetail ? (
                <p className="mt-4 text-sm text-slate-500">상세 정보를 불러오는 중...</p>
              ) : detailError ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {detailError}
                </p>
              ) : spotDetail ? (
                <div className="mt-4 grid gap-3">
                  <p className="text-lg font-bold">{spotDetail.name}</p>
                  <p className="text-sm text-slate-600">{spotDetail.address}</p>
                  <p className="text-sm text-slate-600">평점: {spotDetail.rating?.toFixed(1) ?? "-"}</p>
                  <p className="text-sm text-slate-600">전화: {spotDetail.phone ?? "정보 없음"}</p>
                  <a
                    href={spotDetail.website ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={`text-sm font-semibold ${
                      spotDetail.website ? "text-teal-700 underline" : "pointer-events-none text-slate-400"
                    }`}
                  >
                    웹사이트 열기
                  </a>
                  {spotDetail.openingHours.length > 0 ? (
                    <ul className="grid gap-1 rounded-xl bg-slate-100/90 p-3 text-xs text-slate-600">
                      {spotDetail.openingHours.slice(0, 3).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">목록에서 장소를 선택하면 상세가 표시됩니다.</p>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
