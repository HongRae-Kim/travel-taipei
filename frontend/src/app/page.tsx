"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

type PhraseResponse = {
  id: number;
  category: string;
  korean: string;
  chinese: string;
  pronunciation: string;
};

type WeatherForecastItem = {
  date: string;
  minTemp: number;
  maxTemp: number;
  description: string;
  iconUrl: string;
};

type TranslationResult = {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
};

type FamilyMember = {
  id: string;
  name: string;
  dailyBudgetTwd: number;
};

type ExpenseCategory = "food" | "transport" | "stay" | "activity" | "shopping" | "other";

type FamilyExpenseRecord = {
  id: string;
  memberId: string;
  note: string;
  category: ExpenseCategory;
  amountKrw: number;
  amountTwd: number;
  createdAt: string;
};

type SpotFilters = {
  type: "restaurant" | "cafe" | "attraction";
  radius: string;
  openNow: boolean;
  minRating: string;
};

const INITIAL_FILTERS: SpotFilters = {
  type: "restaurant",
  radius: "5000",
  openNow: false,
  minRating: "",
};

const PHRASE_CATEGORIES = [
  { value: "airport", label: "✈️ 공항" },
  { value: "transport", label: "🚇 교통" },
  { value: "hotel", label: "🏨 숙소" },
  { value: "restaurant", label: "🍜 음식점" },
  { value: "shopping", label: "🛍 쇼핑" },
  { value: "emergency", label: "🚨 긴급" },
];

const QUICK_TRANSLATE_SAMPLES = [
  "안녕하세요. 한국에서 왔어요.",
  "이 근처 추천 음식점이 어디예요?",
  "지하철역까지 어떻게 가나요?",
  "카드 결제 가능한가요?",
];

type Tab = "home" | "phrase" | "translate" | "spot" | "budget";

const TAB_ITEMS: Array<{ tab: Tab; icon: string; label: string }> = [
  { tab: "home", icon: "🏠", label: "홈" },
  { tab: "phrase", icon: "💬", label: "회화" },
  { tab: "translate", icon: "🈶", label: "번역" },
  { tab: "spot", icon: "📍", label: "장소" },
  { tab: "budget", icon: "💰", label: "예산" },
];

const STORAGE_KEYS = {
  familyPlan: "travelTaipei:familyPlan",
  familyExpenses: "travelTaipei:familyExpenses",
  phrasesPrefix: "travelTaipei:phrases:",
  spotsPrefix: "travelTaipei:spots:",
  spotDetailPrefix: "travelTaipei:spotDetail:",
  translatePrefix: "travelTaipei:translate:ko-zhTW:",
};

const WEEKDAY_KO = [
  "일요일",
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
];

const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  { id: "member-self", name: "나", dailyBudgetTwd: 1500 },
  { id: "member-family", name: "가족", dailyBudgetTwd: 1500 },
];

const SHARED_MEMBER_ID = "__shared__";

const EXPENSE_CATEGORY_META: Array<{ value: ExpenseCategory; label: string; icon: string; ratio: number }> = [
  { value: "food", label: "식비", icon: "🍜", ratio: 0.35 },
  { value: "transport", label: "교통", icon: "🚌", ratio: 0.18 },
  { value: "stay", label: "숙박", icon: "🏨", ratio: 0.22 },
  { value: "activity", label: "관광/체험", icon: "🎟", ratio: 0.12 },
  { value: "shopping", label: "쇼핑", icon: "🛍", ratio: 0.08 },
  { value: "other", label: "기타", icon: "🧾", ratio: 0.05 },
];

function readStorage<T>(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op: localStorage can fail in private mode or quota exceeded.
  }
}

function makeSpotsCacheKey(nextFilters: SpotFilters, loc: { lat: number; lng: number } | null) {
  const lat = loc ? loc.lat.toFixed(3) : "none";
  const lng = loc ? loc.lng.toFixed(3) : "none";
  return `${STORAGE_KEYS.spotsPrefix}${nextFilters.type}:${nextFilters.radius}:${nextFilters.openNow}:${nextFilters.minRating || "all"}:${lat}:${lng}`;
}

function isExpenseCategory(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORY_META.some((item) => item.value === value);
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function getTodayOpeningInfo(openingHours: string[]) {
  const dayLabel = WEEKDAY_KO[new Date().getDay()];
  const line = openingHours.find((entry) => entry.startsWith(dayLabel));
  if (!line) {
    return { status: "정보 없음", detail: "오늘 영업시간 정보를 찾지 못했습니다." };
  }
  if (line.includes("휴무")) {
    return { status: "오늘 휴무", detail: line };
  }
  if (line.includes("24시간")) {
    return { status: "24시간 영업", detail: line };
  }
  return { status: "영업 정보", detail: line };
}

function travelTime(distanceKm: number) {
  const walkMin = Math.max(1, Math.round((distanceKm / 4.5) * 60));
  const transitMin = Math.max(5, Math.round((distanceKm / 22) * 60));
  return { walkMin, transitMin };
}

function typeLabel(type: string) {
  if (type === "restaurant") return "맛집";
  if (type === "cafe") return "카페";
  return "관광지";
}

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

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // 날씨 / 환율
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [forecast, setForecast] = useState<WeatherForecastItem[]>([]);
  const [exchange, setExchange] = useState<ExchangeRateResponse | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [krwInput, setKrwInput] = useState("10000");

  // 회화
  const [phrases, setPhrases] = useState<PhraseResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("airport");
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [translateInput, setTranslateInput] = useState("안녕하세요. 한국에서 왔어요.");
  const [translatedText, setTranslatedText] = useState("");
  const [loadingTranslate, setLoadingTranslate] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // 장소
  const [spots, setSpots] = useState<SpotResponse[]>([]);
  const [spotDetail, setSpotDetail] = useState<SpotDetailResponse | null>(null);
  const [filters, setFilters] = useState<SpotFilters>(INITIAL_FILTERS);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const sheetDragYRef = useRef(0);
  const sheetTouchStartY = useRef<number | null>(null);
  const sheetCanDrag = useRef(false);
  const lightboxOpenedAt = useRef(0);
  const lightboxImages = spotDetail?.photoUrls ?? [];
  const [tripStartDate, setTripStartDate] = useState(() => toIsoDate(new Date()));
  const [tripDays, setTripDays] = useState("3");
  const [customTotalBudgetInput, setCustomTotalBudgetInput] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(DEFAULT_FAMILY_MEMBERS);
  const [familyExpenses, setFamilyExpenses] = useState<FamilyExpenseRecord[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberDailyBudgetInput, setNewMemberDailyBudgetInput] = useState("1500");
  const [selectedExpenseMemberId, setSelectedExpenseMemberId] = useState(DEFAULT_FAMILY_MEMBERS[0].id);
  const [expenseCategoryInput, setExpenseCategoryInput] = useState<ExpenseCategory>("food");
  const [expenseKrwInput, setExpenseKrwInput] = useState("");
  const [expenseNoteInput, setExpenseNoteInput] = useState("");
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    void loadSummary();
    void searchSpots(INITIAL_FILTERS);
    void loadPhrases("airport");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cachedFamilyPlan = readStorage<{
      tripStartDate?: string;
      tripDays: string;
      customTotalBudgetInput?: string;
      familyMembers: FamilyMember[];
    }>(
      STORAGE_KEYS.familyPlan
    );
    if (cachedFamilyPlan?.familyMembers?.length) {
      const normalizedMembers = cachedFamilyPlan.familyMembers
        .map((member) => ({
          id: member.id || `${Date.now()}-${Math.random()}`,
          name: member.name?.trim() || "가족 구성원",
          dailyBudgetTwd: Number(member.dailyBudgetTwd) > 0 ? Number(member.dailyBudgetTwd) : 0,
        }))
        .slice(0, 12);
      if (normalizedMembers.length > 0) {
        setFamilyMembers(normalizedMembers);
        setSelectedExpenseMemberId(normalizedMembers[0].id);
      }
      if (cachedFamilyPlan.tripStartDate && parseIsoDate(cachedFamilyPlan.tripStartDate)) {
        setTripStartDate(cachedFamilyPlan.tripStartDate);
      }
      if (cachedFamilyPlan.tripDays) {
        setTripDays(cachedFamilyPlan.tripDays);
      }
      if (typeof cachedFamilyPlan.customTotalBudgetInput === "string") {
        setCustomTotalBudgetInput(cachedFamilyPlan.customTotalBudgetInput);
      }
    } else {
      const legacyBudget = readStorage<{ dailyBudgetTwd: string }>("travelTaipei:budget");
      if (legacyBudget?.dailyBudgetTwd && Number(legacyBudget.dailyBudgetTwd) > 0) {
        setFamilyMembers((prev) =>
          prev.map((member) => ({
            ...member,
            dailyBudgetTwd: Number(legacyBudget.dailyBudgetTwd),
          }))
        );
      }
    }

    const cachedFamilyExpenses = readStorage<FamilyExpenseRecord[]>(STORAGE_KEYS.familyExpenses);
    if (cachedFamilyExpenses) {
      setFamilyExpenses(
        cachedFamilyExpenses
          .map((expense) => {
            const nextCategory = isExpenseCategory(String(expense.category))
              ? expense.category
              : "other";
            const amountKrw = Number(expense.amountKrw);
            const amountTwd = Number(expense.amountTwd);
            return {
              id: expense.id || `expense-${Date.now()}-${Math.round(Math.random() * 1000)}`,
              memberId: expense.memberId || DEFAULT_FAMILY_MEMBERS[0].id,
              note: expense.note?.trim() || "기타 지출",
              category: nextCategory,
              amountKrw: Number.isFinite(amountKrw) && amountKrw > 0 ? amountKrw : 0,
              amountTwd: Number.isFinite(amountTwd) && amountTwd > 0 ? amountTwd : 0,
              createdAt: expense.createdAt || new Date().toISOString(),
            };
          })
          .filter((expense) => expense.amountKrw > 0 && expense.amountTwd > 0)
      );
    } else {
      const legacyExpenses = readStorage<Array<Omit<FamilyExpenseRecord, "memberId">>>(
        "travelTaipei:expenses"
      );
      if (legacyExpenses?.length) {
        setFamilyExpenses(
          legacyExpenses.map((expense) => ({
            ...expense,
            memberId: DEFAULT_FAMILY_MEMBERS[0].id,
            category: "other",
          }))
        );
      }
    }

    const updateNetworkState = () => setIsOnline(window.navigator.onLine);
    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);
    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
    };
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.familyPlan, {
      tripStartDate,
      tripDays,
      customTotalBudgetInput,
      familyMembers,
    });
  }, [tripStartDate, tripDays, customTotalBudgetInput, familyMembers]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.familyExpenses, familyExpenses);
  }, [familyExpenses]);

  useEffect(() => {
    if (familyMembers.length === 0) return;
    if (selectedExpenseMemberId === SHARED_MEMBER_ID) return;
    if (!familyMembers.some((member) => member.id === selectedExpenseMemberId)) {
      setSelectedExpenseMemberId(familyMembers[0].id);
    }
  }, [familyMembers, selectedExpenseMemberId]);

  useEffect(() => {
    if (!copiedMessage) return;
    const timer = window.setTimeout(() => setCopiedMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedMessage]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const len = lightboxImages.length;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")
        setLightboxIndex((p) => (p === null ? null : (p - 1 + len) % len));
      else if (e.key === "ArrowRight")
        setLightboxIndex((p) => (p === null ? null : (p + 1) % len));
      else if (e.key === "Escape") setLightboxIndex(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, lightboxImages.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex]);

  // ── API 호출 ──────────────────────────────────────────────────────────

  async function loadSummary() {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const [weatherData, forecastData, exchangeData] = await Promise.all([
        requestApi<WeatherResponse>("/api/travel/weather"),
        requestApi<WeatherForecastItem[]>("/api/travel/weather/forecast"),
        requestApi<ExchangeRateResponse>("/api/travel/exchange-rates"),
      ]);
      setWeather(weatherData);
      setForecast(forecastData);
      setExchange(exchangeData);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "정보를 불러오지 못했습니다.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadPhrases(category: string) {
    setLoadingPhrases(true);
    try {
      const data = await requestApi<PhraseResponse[]>(`/api/travel/phrases/${category}`);
      setPhrases(data);
      writeStorage(`${STORAGE_KEYS.phrasesPrefix}${category}`, data);
    } catch {
      const cached = readStorage<PhraseResponse[]>(`${STORAGE_KEYS.phrasesPrefix}${category}`);
      if (cached) {
        setPhrases(cached);
      } else {
        setPhrases([]);
      }
    } finally {
      setLoadingPhrases(false);
    }
  }

  function handleCategoryChange(category: string) {
    setSelectedCategory(category);
    void loadPhrases(category);
  }

  async function translateKoreanToTraditionalChinese(input?: string) {
    const sourceText = (input ?? translateInput).trim();
    if (!sourceText) {
      setTranslatedText("");
      setTranslateError("번역할 한국어 문장을 입력해주세요.");
      return;
    }

    setLoadingTranslate(true);
    setTranslateError(null);
    const translateCacheKey = `${STORAGE_KEYS.translatePrefix}${sourceText}`;
    try {
      const response = await fetch("/api/travel/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });

      const payload = (await response.json()) as ApiEnvelope<TranslationResult>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "번역 요청에 실패했습니다.");
      }
      setTranslatedText(payload.data.translatedText);
      writeStorage(translateCacheKey, payload.data);
    } catch (error) {
      const cached = readStorage<TranslationResult>(translateCacheKey);
      if (cached?.translatedText) {
        setTranslatedText(cached.translatedText);
        setTranslateError("오프라인 캐시 번역을 표시 중입니다.");
      } else {
        setTranslatedText("");
        setTranslateError(error instanceof Error ? error.message : "번역 요청에 실패했습니다.");
      }
    } finally {
      setLoadingTranslate(false);
    }
  }

  function applySampleSentence(sentence: string) {
    setTranslateInput(sentence);
    void translateKoreanToTraditionalChinese(sentence);
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessage(`${label} 복사 완료`);
    } catch {
      setCopiedMessage("복사에 실패했습니다.");
    }
  }

  function addFamilyMember() {
    const name = newMemberName.trim();
    const dailyBudget = Number(newMemberDailyBudgetInput);
    if (!name) {
      setBudgetError("구성원 이름을 입력해주세요.");
      return;
    }
    if (!Number.isFinite(dailyBudget) || dailyBudget <= 0) {
      setBudgetError("구성원 일일 예산(TWD)을 올바르게 입력해주세요.");
      return;
    }
    setFamilyMembers((prev) => {
      if (prev.length >= 12) {
        setBudgetError("가족 구성원은 최대 12명까지 등록할 수 있습니다.");
        return prev;
      }
      const member: FamilyMember = {
        id: `member-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        name,
        dailyBudgetTwd: Math.round(dailyBudget),
      };
      setSelectedExpenseMemberId(member.id);
      return [...prev, member];
    });
    setNewMemberName("");
    setNewMemberDailyBudgetInput("1500");
    setBudgetError(null);
  }

  function updateFamilyMemberBudget(memberId: string, rawBudget: string) {
    const nextBudget = Number(rawBudget);
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, dailyBudgetTwd: Number.isFinite(nextBudget) && nextBudget > 0 ? Math.round(nextBudget) : 0 }
          : member
      )
    );
  }

  function removeFamilyMember(memberId: string) {
    setFamilyMembers((prev) => {
      if (prev.length <= 1) {
        setBudgetError("최소 1명의 구성원은 필요합니다.");
        return prev;
      }
      const filtered = prev.filter((member) => member.id !== memberId);
      if (selectedExpenseMemberId === memberId) {
        setSelectedExpenseMemberId(filtered[0]?.id ?? "");
      }
      setFamilyExpenses((expenses) => expenses.filter((expense) => expense.memberId !== memberId));
      setBudgetError(null);
      return filtered;
    });
  }

  function addFamilyExpense() {
    if (
      selectedExpenseMemberId !== SHARED_MEMBER_ID &&
      !familyMembers.some((member) => member.id === selectedExpenseMemberId)
    ) {
      setBudgetError("지출을 기록할 가족 구성원을 먼저 선택해주세요.");
      return;
    }
    const amountKrw = Number(expenseKrwInput);
    if (!Number.isFinite(amountKrw) || amountKrw <= 0) {
      setBudgetError("지출 금액(원)을 올바르게 입력해주세요.");
      return;
    }
    const baseRate = exchange?.baseRate && exchange.baseRate > 0 ? exchange.baseRate : 42;
    const amountTwd = Number((amountKrw / baseRate).toFixed(2));

    setFamilyExpenses((prev) => [
      {
        id: `expense-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        memberId: selectedExpenseMemberId,
        note: expenseNoteInput.trim() || "기타 지출",
        category: expenseCategoryInput,
        amountKrw,
        amountTwd,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setExpenseKrwInput("");
    setExpenseNoteInput("");
    setExpenseCategoryInput("food");
    setBudgetError(null);
  }

  function removeFamilyExpense(expenseId: string) {
    setFamilyExpenses((prev) => prev.filter((item) => item.id !== expenseId));
  }

  function clearFamilyExpenses() {
    setFamilyExpenses([]);
    setBudgetError(null);
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setSpotError("이 브라우저는 위치 감지를 지원하지 않습니다.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocating(false);
        void searchSpotsWithLocation(loc, filters);
      },
      () => {
        setSpotError("위치 권한이 거부됐습니다. 브라우저 설정에서 허용해주세요.");
        setLocating(false);
      }
    );
  }

  async function searchSpotsWithLocation(
    loc: { lat: number; lng: number } | null,
    nextFilters: SpotFilters
  ) {
    setLoadingSpots(true);
    setSpotError(null);
    const cacheKey = makeSpotsCacheKey(nextFilters, loc);
    try {
      const params = new URLSearchParams({
        type: nextFilters.type,
        radius: nextFilters.radius || "5000",
        openNow: String(nextFilters.openNow),
      });
      if (loc) {
        params.set("lat", String(loc.lat));
        params.set("lng", String(loc.lng));
      }
      if (nextFilters.minRating.trim()) {
        params.set("minRating", nextFilters.minRating.trim());
      }
      const data = await requestApi<SpotResponse[]>(`/api/travel/spots?${params.toString()}`);
      setSpots(data);
      writeStorage(cacheKey, data);
      setSpotDetail(null);
      setSelectedSpotId(null);
    } catch (error) {
      const cached = readStorage<SpotResponse[]>(cacheKey);
      if (cached) {
        setSpots(cached);
        setSpotError("네트워크 오류로 오프라인 캐시 목록을 표시합니다.");
      } else {
        setSpots([]);
        setSpotError(error instanceof Error ? error.message : "장소 목록 조회에 실패했습니다.");
      }
    } finally {
      setLoadingSpots(false);
    }
  }

  function searchSpots(nextFilters = filters) {
    return searchSpotsWithLocation(userLocation, nextFilters);
  }

  function closeDetail() {
    sheetDragYRef.current = 0;
    setSheetDragY(0);
    sheetTouchStartY.current = null;
    sheetCanDrag.current = false;
    setSelectedSpotId(null);
    setSpotDetail(null);
  }

  function openLightbox(index: number) {
    lightboxOpenedAt.current = Date.now();
    setLightboxIndex(index);
  }

  function closeLightboxFromBackdrop() {
    // On some mobile browsers a ghost click right after opening can close immediately.
    if (Date.now() - lightboxOpenedAt.current < 220) return;
    setLightboxIndex(null);
  }

  function handleSheetTouchStart(e: React.TouchEvent<HTMLElement>) {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return;
    const sheet = e.currentTarget;
    sheetTouchStartY.current = e.touches[0].clientY;
    sheetCanDrag.current = sheet.scrollTop <= 0;
    sheetDragYRef.current = 0;
  }

  function handleSheetTouchMove(e: React.TouchEvent<HTMLElement>) {
    if (sheetTouchStartY.current === null) return;
    const sheet = e.currentTarget;
    const deltaY = e.touches[0].clientY - sheetTouchStartY.current;
    if (!sheetCanDrag.current) {
      if (sheet.scrollTop <= 0 && deltaY > 0) {
        sheetCanDrag.current = true;
      } else {
        return;
      }
    }
    if (deltaY <= 0) {
      sheetDragYRef.current = 0;
      setSheetDragY(0);
      return;
    }
    // Prevent background rubber-band scroll while dragging the sheet down.
    e.preventDefault();
    const nextDragY = Math.min(deltaY, 260);
    sheetDragYRef.current = nextDragY;
    setSheetDragY(nextDragY);
  }

  function handleSheetTouchEnd() {
    if (!sheetCanDrag.current) return;
    const shouldClose = sheetDragYRef.current > 90;
    sheetTouchStartY.current = null;
    sheetCanDrag.current = false;
    if (shouldClose) {
      closeDetail();
      return;
    }
    sheetDragYRef.current = 0;
    setSheetDragY(0);
  }

  async function loadSpotDetail(spotId: string) {
    setLoadingDetail(true);
    setDetailError(null);
    sheetDragYRef.current = 0;
    setSheetDragY(0);
    setSelectedSpotId(spotId);
    const detailCacheKey = `${STORAGE_KEYS.spotDetailPrefix}${filters.type}:${spotId}`;
    try {
      const detail = await requestApi<SpotDetailResponse>(
        `/api/travel/spots/${spotId}?type=${filters.type}`
      );
      setSpotDetail(detail);
      writeStorage(detailCacheKey, detail);
    } catch (error) {
      const cached = readStorage<SpotDetailResponse>(detailCacheKey);
      if (cached) {
        setSpotDetail(cached);
        setDetailError("오프라인 캐시 상세정보를 표시합니다.");
      } else {
        setSpotDetail(null);
        setDetailError(error instanceof Error ? error.message : "장소 상세 조회에 실패했습니다.");
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  const spotCountLabel = useMemo(() => {
    if (loadingSpots) return "조회 중...";
    return `${spots.length}개 장소`;
  }, [loadingSpots, spots.length]);

  const familyBudgetSummary = useMemo(() => {
    const days = Math.max(1, Number.parseInt(tripDays, 10) || 1);
    const totalDailyBudget = familyMembers.reduce((sum, member) => sum + member.dailyBudgetTwd, 0);
    const autoTotalTripBudget = totalDailyBudget * days;
    const manualTotalBudget = Number(customTotalBudgetInput);
    const hasCustomTotalBudget = Number.isFinite(manualTotalBudget) && manualTotalBudget > 0;
    const totalTripBudget = hasCustomTotalBudget ? Math.round(manualTotalBudget) : autoTotalTripBudget;
    const totalDailyPlanBudget = totalTripBudget / days;
    const spentTwd = familyExpenses.reduce((sum, expense) => sum + expense.amountTwd, 0);
    const spentKrw = familyExpenses.reduce((sum, expense) => sum + expense.amountKrw, 0);
    const remainTwd = Number((totalTripBudget - spentTwd).toFixed(2));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsedStartDate = parseIsoDate(tripStartDate) ?? new Date(today);
    parsedStartDate.setHours(0, 0, 0, 0);
    const offsetDays = Math.floor((today.getTime() - parsedStartDate.getTime()) / 86400000);
    const rawTripDay = offsetDays + 1;
    const currentTripDay = rawTripDay < 1 ? 0 : Math.min(rawTripDay, days);
    const daysLeft = rawTripDay < 1 ? days : Math.max(0, days - rawTripDay + 1);
    const usagePercent = totalTripBudget > 0 ? Math.max(0, (spentTwd / totalTripBudget) * 100) : 0;
    const dailyAllowanceTwd = daysLeft > 0 ? remainTwd / daysLeft : 0;
    return {
      days,
      startDate: parsedStartDate,
      totalDailyBudget,
      totalDailyPlanBudget,
      autoTotalTripBudget,
      totalTripBudget,
      hasCustomTotalBudget,
      spentTwd: Number(spentTwd.toFixed(2)),
      spentKrw: Math.round(spentKrw),
      remainTwd,
      currentTripDay,
      daysLeft,
      usagePercent,
      dailyAllowanceTwd,
    };
  }, [tripStartDate, tripDays, customTotalBudgetInput, familyMembers, familyExpenses]);

  const memberExpenseSummary = useMemo(() => {
    const map = new Map<string, { spentTwd: number; spentKrw: number; expenseCount: number }>();
    for (const member of familyMembers) {
      map.set(member.id, { spentTwd: 0, spentKrw: 0, expenseCount: 0 });
    }
    const memberCount = Math.max(1, familyMembers.length);
    for (const expense of familyExpenses) {
      if (expense.memberId === SHARED_MEMBER_ID) {
        const splitTwd = expense.amountTwd / memberCount;
        const splitKrw = expense.amountKrw / memberCount;
        for (const member of familyMembers) {
          const current = map.get(member.id);
          if (!current) continue;
          current.spentTwd += splitTwd;
          current.spentKrw += splitKrw;
          current.expenseCount += 1;
        }
        continue;
      }
      const current = map.get(expense.memberId);
      if (!current) continue;
      current.spentTwd += expense.amountTwd;
      current.spentKrw += expense.amountKrw;
      current.expenseCount += 1;
    }
    return map;
  }, [familyExpenses, familyMembers]);

  const expenseCategorySummary = useMemo(() => {
    const categoryMap = new Map<
      ExpenseCategory,
      { spentTwd: number; spentKrw: number; count: number }
    >();
    for (const meta of EXPENSE_CATEGORY_META) {
      categoryMap.set(meta.value, { spentTwd: 0, spentKrw: 0, count: 0 });
    }
    for (const expense of familyExpenses) {
      const current = categoryMap.get(expense.category);
      if (!current) continue;
      current.spentTwd += expense.amountTwd;
      current.spentKrw += expense.amountKrw;
      current.count += 1;
    }
    const totalSpent = familyExpenses.reduce((sum, expense) => sum + expense.amountTwd, 0);
    return EXPENSE_CATEGORY_META.map((meta) => {
      const value = categoryMap.get(meta.value) ?? { spentTwd: 0, spentKrw: 0, count: 0 };
      const spentRatio = totalSpent > 0 ? (value.spentTwd / totalSpent) * 100 : 0;
      return { ...meta, ...value, spentRatio, planRatio: meta.ratio };
    }).sort((a, b) => b.spentTwd - a.spentTwd);
  }, [familyExpenses]);

  const memberSpendRanking = useMemo(
    () =>
      familyMembers
        .map((member) => {
          const spent = memberExpenseSummary.get(member.id) ?? { spentTwd: 0, spentKrw: 0, expenseCount: 0 };
          const memberTripBudget = member.dailyBudgetTwd * familyBudgetSummary.days;
          const remain = memberTripBudget - spent.spentTwd;
          return { member, spent, memberTripBudget, remain };
        })
        .sort((a, b) => b.spent.spentTwd - a.spent.spentTwd),
    [familyMembers, memberExpenseSummary, familyBudgetSummary.days]
  );

  const tripDayPlan = useMemo(() => {
    const spentByDate = new Map<string, number>();
    for (const expense of familyExpenses) {
      const created = new Date(expense.createdAt);
      if (Number.isNaN(created.getTime())) continue;
      const dateKey = toIsoDate(created);
      spentByDate.set(dateKey, (spentByDate.get(dateKey) ?? 0) + expense.amountTwd);
    }
    const days = familyBudgetSummary.days;
    const startDate = parseIsoDate(tripStartDate) ?? familyBudgetSummary.startDate;
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const key = toIsoDate(date);
      const spentTwd = spentByDate.get(key) ?? 0;
      const plannedTwd = familyBudgetSummary.totalDailyPlanBudget;
      return {
        key,
        day: index + 1,
        label: formatDateLabel(date),
        plannedTwd,
        spentTwd,
        remainTwd: plannedTwd - spentTwd,
      };
    });
  }, [tripStartDate, familyExpenses, familyBudgetSummary.days, familyBudgetSummary.startDate, familyBudgetSummary.totalDailyPlanBudget]);

  const todayOpeningInfo = useMemo(
    () => (spotDetail ? getTodayOpeningInfo(spotDetail.openingHours) : null),
    [spotDetail]
  );

  // ── UI ───────────────────────────────────────────────────────────────

  return (
    <div className="ui-shell">

      {/* 라이트박스 */}
      {lightboxIndex !== null && lightboxImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={closeLightboxFromBackdrop}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            const len = lightboxImages.length;
            if (delta > 50) setLightboxIndex((p) => (p === null ? null : (p - 1 + len) % len));
            else if (delta < -50) setLightboxIndex((p) => (p === null ? null : (p + 1) % len));
            touchStartX.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxImages[lightboxIndex]}
            alt="확대 이미지"
            className="no-touch-menu max-h-[90dvh] max-w-[80vw] select-none rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />

          {/* 닫기 */}
          <button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>

          {/* 이전 / 다음 — 이미지가 2장 이상일 때만 */}
          {lightboxImages.length > 1 && (
            <>
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-2xl text-white hover:bg-white/35 sm:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((p) => (p === null ? null : (p - 1 + lightboxImages.length) % lightboxImages.length));
                }}
              >
                ‹
              </button>
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-2xl text-white hover:bg-white/35 sm:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((p) => (p === null ? null : (p + 1) % lightboxImages.length));
                }}
              >
                ›
              </button>
              {/* 인덱스 */}
              <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/90">
                {lightboxIndex + 1} / {lightboxImages.length}
              </p>
            </>
          )}
        </div>
      )}

      {/* 헤더 */}
      <header className="ui-header safe-top-inset sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇹🇼</span>
            <span className="bg-gradient-to-r from-teal-800 to-cyan-800 bg-clip-text text-base font-black tracking-tight text-transparent">
              Travel Taipei
            </span>
          </div>
          {/* 데스크탑 탭 */}
          <nav className="hidden items-center gap-2 rounded-full border border-white/60 bg-white/60 p-1 sm:flex">
            {TAB_ITEMS.map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`ui-tab ${activeTab === tab ? "ui-tab-active" : ""}`}
              >
                {icon} {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="mx-auto max-w-5xl px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:pb-10 sm:pt-6">
        {!isOnline && (
          <div className="ui-panel mb-4 rounded-2xl border-amber-300/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
            현재 오프라인 상태입니다. 저장된 캐시 데이터를 우선 보여줍니다.
          </div>
        )}
        {copiedMessage && (
          <div className="ui-panel mb-4 rounded-2xl border-emerald-300/70 bg-emerald-50/85 px-4 py-3 text-sm text-emerald-700">
            {copiedMessage}
          </div>
        )}

        {/* ── 홈 탭 ── */}
        {activeTab === "home" && (
          <div className="grid grid-cols-1 gap-4">
            <section className="ui-hero ui-appear rounded-3xl p-4 text-white sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Live Travel Snapshot
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black leading-tight sm:text-3xl">
                    Taipei Trip<br className="sm:hidden" /> Control Panel
                  </h1>
                  <p className="mt-1 text-xs text-white/85 sm:text-sm">
                    날씨, 환율, 장소 추천을 한 화면에서 관리하세요.
                  </p>
                </div>
                <div className="hidden shrink-0 rounded-2xl border border-white/40 bg-white/20 px-4 py-2 text-right sm:block">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">Updated</p>
                  <p className="text-sm font-semibold">
                    {new Date().toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                  </p>
                </div>
              </div>
            </section>
            {summaryError && (
              <div className="ui-panel ui-appear rounded-2xl border-rose-300/70 bg-rose-50/85 px-4 py-3 text-sm text-rose-700">
                {summaryError}
              </div>
            )}

            {/* 날씨 */}
            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800">타이베이 현재 날씨</h2>
                <button
                  onClick={() => void loadSummary()}
                  className="rounded-lg border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-white"
                >
                  새로고침
                </button>
              </div>
              {loadingSummary ? (
                <p className="mt-4 text-sm text-slate-400">불러오는 중...</p>
              ) : weather ? (
                <>
                  <div className="mt-4 flex items-center gap-4">
                    {weather.iconUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={weather.iconUrl} alt={weather.description} className="h-16 w-16" />
                    )}
                    <div>
                      <p className="text-4xl font-black">{weather.temperature.toFixed(1)}°C</p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{weather.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    {[
                      { label: "체감", value: `${weather.feelsLike.toFixed(1)}°C` },
                      { label: "습도", value: `${weather.humidity}%` },
                      { label: "풍속", value: `${weather.windSpeed.toFixed(1)}m/s` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-50 py-2">
                        <p className="text-slate-400">{item.label}</p>
                        <p className="mt-0.5 font-bold text-slate-700">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-400">날씨 데이터 없음</p>
              )}
            </section>

            {/* 5일 예보 */}
            {forecast.length > 0 && (
              <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
                <h2 className="font-bold text-slate-700">5일 예보</h2>
                <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
                  {forecast.map((day) => (
                    <div
                      key={day.date}
                      className="flex w-24 shrink-0 flex-col items-center rounded-xl border border-white/70 bg-white/70 py-3 text-center"
                    >
                      <p className="text-xs font-semibold text-slate-400">
                        {new Date(day.date + "T00:00:00").toLocaleDateString("ko-KR", {
                          month: "numeric",
                          day: "numeric",
                          weekday: "short",
                        })}
                      </p>
                      {day.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={day.iconUrl} alt={day.description} className="h-10 w-10" />
                      ) : (
                        <div className="h-10 w-10" />
                      )}
                      <p className="text-xs text-slate-500">{day.description}</p>
                      <div className="mt-1 flex gap-1 text-xs font-bold">
                        <span className="text-blue-500">{day.minTemp.toFixed(0)}°</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-orange-400">{day.maxTemp.toFixed(0)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 환율 */}
            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <h2 className="font-bold text-slate-700">환율 · KRW ↔ TWD</h2>
              {loadingSummary ? (
                <p className="mt-4 text-sm text-slate-400">불러오는 중...</p>
              ) : exchange ? (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <p className="text-2xl font-black">
                    {exchange.baseRate.toFixed(2)}
                    <span className="ml-1 text-sm font-semibold text-slate-400">원 = 1 TWD</span>
                  </p>

                  {/* 계산기 */}
                  <div className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-white/70 bg-white/70 px-3 py-2.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={krwInput}
                        onChange={(e) => setKrwInput(e.target.value)}
                        className="min-w-0 w-full bg-transparent text-base text-right font-bold outline-none"
                        min={0}
                      />
                      <span className="shrink-0 text-sm font-semibold text-slate-400">원</span>
                    </div>
                    <span className="shrink-0 text-slate-300">→</span>
                    <div className="flex min-w-0 flex-1 items-center gap-1 rounded-xl border border-teal-300/70 bg-teal-50/75 px-3 py-2.5">
                      <span className="min-w-0 w-full truncate text-right text-base font-bold text-teal-800">
                        {exchange.baseRate > 0 && krwInput
                          ? (parseFloat(krwInput) / exchange.baseRate).toFixed(2)
                          : "0.00"}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-teal-600">TWD</span>
                    </div>
                  </div>

                  {/* 빠른 금액 버튼 — grid로 균등 배분, 절대 overflow 없음 */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 5000, 10000, 50000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setKrwInput(String(v))}
                        className="rounded-lg border border-white/70 bg-white/75 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        {v.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400">기준일 {exchange.date}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">환율 데이터 없음</p>
              )}
            </section>

          </div>
        )}

        {/* ── 회화 탭 ── */}
        {activeTab === "phrase" && (
          <div className="grid grid-cols-1 gap-4">
            {/* 카테고리 칩 */}
            <div className="flex flex-wrap gap-2">
              {PHRASE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={`ui-chip px-4 py-1.5 text-sm font-semibold transition ${
                    selectedCategory === cat.value
                      ? "ui-chip-active text-teal-900"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 문구 목록 */}
            <div className="grid grid-cols-1 gap-2">
              {loadingPhrases ? (
                <p className="py-10 text-center text-sm text-slate-400">불러오는 중...</p>
              ) : (
                phrases.map((phrase) => (
                  <div
                    key={phrase.id}
                    className="ui-panel ui-appear rounded-2xl p-4"
                  >
                    <p className="text-sm text-slate-500">{phrase.korean}</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{phrase.chinese}</p>
                    <p className="mt-1 text-sm font-semibold text-teal-700">{phrase.pronunciation}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── 번역 탭 ── */}
        {activeTab === "translate" && (
          <div className="grid grid-cols-1 gap-4">
            <section className="ui-hero ui-appear rounded-3xl p-4 text-white sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Korean → Traditional Chinese
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight sm:text-2xl">
                한국어를 대만 번체 중국어로
                <br className="sm:hidden" /> 바로 번역
              </h2>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">
                택시, 식당, 길찾기에서 바로 보여줄 문장을 빠르게 만들 수 있어요.
              </p>
            </section>

            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">번역할 한국어 문장</h3>
                <span className="text-xs font-semibold text-slate-400">
                  {translateInput.trim().length}/800
                </span>
              </div>

              <textarea
                value={translateInput}
                onChange={(e) => setTranslateInput(e.target.value)}
                placeholder="예) 이 근처에서 야시장 가려면 어떻게 가나요?"
                className="mt-3 h-36 w-full resize-none rounded-2xl border border-white/70 bg-white/80 p-3 text-sm leading-relaxed text-slate-800 outline-none ring-teal-400/40 transition focus:ring"
                maxLength={800}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_TRANSLATE_SAMPLES.map((sample) => (
                  <button
                    key={sample}
                    onClick={() => applySampleSentence(sample)}
                    className="ui-chip px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-white"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => void translateKoreanToTraditionalChinese()}
                  disabled={loadingTranslate}
                  className="rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-4 py-2 text-sm font-semibold text-white transition hover:from-teal-600 hover:to-cyan-600 disabled:opacity-60"
                >
                  {loadingTranslate ? "번역 중..." : "번역하기"}
                </button>
              </div>
            </section>

            {translateError && (
              <div className="ui-panel rounded-2xl border-rose-300/70 bg-rose-50/85 px-4 py-3 text-sm text-rose-700">
                {translateError}
              </div>
            )}

            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                번역 결과 (繁體中文)
              </p>
              {loadingTranslate ? (
                <p className="mt-3 text-sm text-slate-400">번역 결과를 가져오는 중...</p>
              ) : translatedText ? (
                <>
                  <p className="mt-3 text-2xl font-bold leading-relaxed text-slate-900">
                    {translatedText}
                  </p>
                  <button
                    onClick={() => void copyText(translatedText, "번역 결과")}
                    className="mt-2 text-sm font-semibold text-teal-700 underline"
                  >
                    번역 결과 복사
                  </button>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  한국어 문장을 입력한 뒤 <strong>번역하기</strong>를 눌러주세요.
                </p>
              )}
            </section>
          </div>
        )}

        {/* ── 예산 탭 ── */}
        {activeTab === "budget" && (
          <div className="grid grid-cols-1 gap-4">
            <section className="ui-hero ui-appear rounded-3xl p-4 text-white sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Family Budget Planner
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight sm:text-2xl">
                가족 단위 여행 일정표
                <br className="sm:hidden" /> 예산 트래커
              </h2>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">
                구성원별 지출, 카테고리 비중, 일자별 예산 페이스를 한 화면에서 확인하세요.
              </p>
            </section>

            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800">예산 요약</h2>
                <button
                  onClick={clearFamilyExpenses}
                  className="text-xs font-semibold text-slate-400 underline"
                >
                  지출 전체 초기화
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-center">
                  <p className="text-xs text-slate-500">구성원</p>
                  <p className="text-base font-black text-slate-800">{familyMembers.length}명</p>
                </div>
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-center">
                  <p className="text-xs text-slate-500">여행 일정</p>
                  <p className="text-base font-black text-slate-800">{familyBudgetSummary.days}일</p>
                </div>
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                  <p className="text-xs text-blue-600">총 예산</p>
                  <p className="text-base font-black text-blue-700">
                    {Math.round(familyBudgetSummary.totalTripBudget).toLocaleString()} TWD
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-blue-500">
                    {familyBudgetSummary.hasCustomTotalBudget ? "직접 설정" : "구성원 합산"}
                  </p>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-center ${familyBudgetSummary.remainTwd >= 0 ? "bg-emerald-50" : "bg-rose-50"}`}
                >
                  <p
                    className={`text-xs ${familyBudgetSummary.remainTwd >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    남은 예산
                  </p>
                  <p
                    className={`text-base font-black ${familyBudgetSummary.remainTwd >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {Math.round(familyBudgetSummary.remainTwd).toLocaleString()} TWD
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/70 bg-white/75 px-3 py-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>예산 사용률</span>
                  <span>{Math.min(999, familyBudgetSummary.usagePercent).toFixed(1)}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full ${
                      familyBudgetSummary.usagePercent <= 100 ? "bg-gradient-to-r from-emerald-500 to-cyan-600" : "bg-gradient-to-r from-amber-500 to-rose-600"
                    }`}
                    style={{ width: `${Math.min(100, familyBudgetSummary.usagePercent)}%` }}
                  />
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-500 sm:grid-cols-3">
                  <p>
                    총 사용액: <span className="font-bold text-slate-700">{familyBudgetSummary.spentTwd.toLocaleString()} TWD</span>
                  </p>
                  <p>
                    환산: <span className="font-bold text-slate-700">{familyBudgetSummary.spentKrw.toLocaleString()} 원</span>
                  </p>
                  <p>
                    잔여 일일 권장:{" "}
                    <span className="font-bold text-slate-700">
                      {Math.round(familyBudgetSummary.dailyAllowanceTwd).toLocaleString()} TWD/일
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-white/70 bg-white/75 px-3 py-3 text-xs text-slate-600">
                <p>
                  여행 시작일:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDateLabel(familyBudgetSummary.startDate)}
                  </span>
                </p>
                <p className="mt-1">
                  현재 일정:{" "}
                  <span className="font-semibold text-slate-800">
                    {familyBudgetSummary.currentTripDay > 0
                      ? `${familyBudgetSummary.currentTripDay}일차 진행 중`
                      : "여행 시작 전"}
                  </span>
                  {" · "}
                  남은 일수:{" "}
                  <span className="font-semibold text-slate-800">
                    {familyBudgetSummary.daysLeft}일
                  </span>
                </p>
              </div>
            </section>

            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <h3 className="font-bold text-slate-800">여행 일정 설정</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px_180px_auto]">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-500">시작일</span>
                  <input
                    type="date"
                    value={tripStartDate}
                    onChange={(e) => setTripStartDate(e.target.value)}
                    className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-500">여행 일수</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={tripDays}
                    onChange={(e) => setTripDays(e.target.value)}
                    className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-slate-500">총 예산(TWD)</span>
                  <input
                    type="number"
                    min={1}
                    value={customTotalBudgetInput}
                    onChange={(e) => setCustomTotalBudgetInput(e.target.value)}
                    className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                    placeholder="비우면 자동 계산"
                  />
                </label>
                <button
                  onClick={() => setCustomTotalBudgetInput("")}
                  disabled={!customTotalBudgetInput}
                  className="mt-6 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
                >
                  자동 계산 사용
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                자동 계산값: {Math.round(familyBudgetSummary.autoTotalTripBudget).toLocaleString()} TWD
                (구성원 일일 예산 합계 × 여행 일수)
              </p>
            </section>

            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <h3 className="font-bold text-slate-800">가족 구성원별 예산</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_170px_auto]">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                  placeholder="구성원 이름"
                />
                <input
                  type="number"
                  min={1}
                  value={newMemberDailyBudgetInput}
                  onChange={(e) => setNewMemberDailyBudgetInput(e.target.value)}
                  className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                  placeholder="일일예산(TWD)"
                />
                <button
                  onClick={addFamilyMember}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  구성원 추가
                </button>
              </div>

              <div className="mt-3 grid gap-2">
                {memberSpendRanking.map(({ member, spent, memberTripBudget, remain }) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-white/70 bg-white/75 px-3 py-2"
                  >
                    <div className="grid items-center gap-2 sm:grid-cols-[100px_130px_1fr_auto]">
                      <p className="truncate text-sm font-bold text-slate-800">{member.name}</p>
                      <input
                        type="number"
                        min={1}
                        value={member.dailyBudgetTwd}
                        onChange={(e) => updateFamilyMemberBudget(member.id, e.target.value)}
                        className="rounded-lg border border-white/70 bg-white px-2 py-1 text-sm outline-none ring-teal-400/40 focus:ring"
                      />
                      <div>
                        <p className="text-xs text-slate-600">
                          사용 {Math.round(spent.spentTwd).toLocaleString()} / 예산 {Math.round(memberTripBudget).toLocaleString()} TWD
                        </p>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                          <div
                            className={`h-1.5 rounded-full ${remain >= 0 ? "bg-teal-600" : "bg-rose-500"}`}
                            style={{ width: `${Math.min(100, memberTripBudget > 0 ? (spent.spentTwd / memberTripBudget) * 100 : 0)}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeFamilyMember(member.id)}
                        className="text-xs font-semibold text-slate-400 underline"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      남은 예산 {Math.round(remain).toLocaleString()} TWD · 기록 {spent.expenseCount}건
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
              <h3 className="font-bold text-slate-800">지출 기록</h3>
              <p className="mt-1 text-xs text-slate-500">
                가족 공통으로 기록하면 구성원별 통계에 균등 분배됩니다.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[170px_130px_160px_1fr_auto]">
                <select
                  value={selectedExpenseMemberId}
                  onChange={(e) => setSelectedExpenseMemberId(e.target.value)}
                  className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                >
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                  <option value={SHARED_MEMBER_ID}>가족 공통(균등 분배)</option>
                </select>
                <select
                  value={expenseCategoryInput}
                  onChange={(e) => setExpenseCategoryInput(e.target.value as ExpenseCategory)}
                  className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                >
                  {EXPENSE_CATEGORY_META.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={expenseKrwInput}
                  onChange={(e) => setExpenseKrwInput(e.target.value)}
                  className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                  placeholder="지출 금액 (KRW)"
                />
                <input
                  type="text"
                  value={expenseNoteInput}
                  onChange={(e) => setExpenseNoteInput(e.target.value)}
                  className="rounded-xl border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none ring-teal-400/40 focus:ring"
                  placeholder="지출 메모 (예: 가족 점심)"
                />
                <button
                  onClick={addFamilyExpense}
                  className="rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-3 py-2 text-sm font-semibold text-white"
                >
                  추가
                </button>
              </div>

              {budgetError && (
                <p className="mt-2 text-sm font-semibold text-rose-600">{budgetError}</p>
              )}

              <div className="mt-3 grid gap-2">
                {familyExpenses.length === 0 ? (
                  <p className="text-sm text-slate-400">아직 기록된 가족 지출이 없습니다.</p>
                ) : (
                  familyExpenses.slice(0, 12).map((expense) => {
                    const memberName =
                      expense.memberId === SHARED_MEMBER_ID
                        ? "가족 공통"
                        : familyMembers.find((member) => member.id === expense.memberId)?.name ?? "구성원";
                    const category =
                      EXPENSE_CATEGORY_META.find((item) => item.value === expense.category) ??
                      EXPENSE_CATEGORY_META[EXPENSE_CATEGORY_META.length - 1];
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between rounded-xl border border-white/70 bg-white/75 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            [{memberName}] {expense.note}
                          </p>
                          <p className="text-xs text-slate-400">
                            {category.icon} {category.label} ·{" "}
                            {new Date(expense.createdAt).toLocaleString("ko-KR", {
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="ml-3 text-right">
                          <p className="text-sm font-bold text-slate-800">{expense.amountTwd.toLocaleString()} TWD</p>
                          <p className="text-xs text-slate-400">{expense.amountKrw.toLocaleString()} 원</p>
                          <button
                            onClick={() => removeFamilyExpense(expense.id)}
                            className="text-[11px] font-semibold text-slate-400 underline"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
                <h3 className="font-bold text-slate-800">카테고리별 지출 분석</h3>
                <div className="mt-3 grid gap-2">
                  {expenseCategorySummary.map((category) => (
                    <div
                      key={category.value}
                      className="rounded-xl border border-white/70 bg-white/75 px-3 py-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <p className="font-semibold text-slate-700">
                          {category.icon} {category.label}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {category.count}건 · {category.spentRatio.toFixed(1)}%
                        </p>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-600"
                          style={{ width: `${Math.min(100, category.spentRatio)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        사용 {Math.round(category.spentTwd).toLocaleString()} TWD · 권장{" "}
                        {Math.round(familyBudgetSummary.totalTripBudget * category.planRatio).toLocaleString()} TWD
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="ui-panel ui-appear rounded-2xl p-4 sm:p-5">
                <h3 className="font-bold text-slate-800">일정표 일차별 예산 페이스</h3>
                <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {tripDayPlan.map((day) => (
                    <div
                      key={day.key}
                      className="rounded-xl border border-white/70 bg-white/75 px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">
                          Day {day.day} · {day.label}
                        </p>
                        <p
                          className={`text-xs font-semibold ${day.remainTwd >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {day.remainTwd >= 0 ? "여유" : "초과"}{" "}
                          {Math.round(Math.abs(day.remainTwd)).toLocaleString()} TWD
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        계획 {Math.round(day.plannedTwd).toLocaleString()} · 사용 {Math.round(day.spentTwd).toLocaleString()} TWD
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── 장소 탭 ── */}
        {activeTab === "spot" && (
          <div className="grid grid-cols-1 gap-4">
            {/* 필터 바 */}
            <div className="ui-panel ui-appear rounded-2xl p-4">
              <div className="scrollbar-none flex gap-2 overflow-x-auto pb-0.5">
                {(["restaurant", "cafe", "attraction"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      const next = { ...filters, type: t };
                      setFilters(next);
                      void searchSpots(next);
                    }}
                    className={`ui-chip shrink-0 px-3 py-1.5 text-sm font-semibold transition ${
                      filters.type === t
                        ? "ui-chip-active text-teal-900"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    {typeLabel(t)}
                  </button>
                ))}

                <select
                  value={filters.radius}
                  onChange={(e) => setFilters((prev) => ({ ...prev, radius: e.target.value }))}
                  className="ui-chip shrink-0 px-3 py-1.5 text-sm font-semibold text-slate-600"
                >
                  <option value="1000">1km</option>
                  <option value="3000">3km</option>
                  <option value="5000">5km</option>
                  <option value="10000">10km</option>
                </select>

                <select
                  value={filters.minRating}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minRating: e.target.value }))}
                  className="ui-chip shrink-0 px-3 py-1.5 text-sm font-semibold text-slate-600"
                >
                  <option value="">평점 전체</option>
                  <option value="3.5">3.5+</option>
                  <option value="4.0">4.0+</option>
                  <option value="4.5">4.5+</option>
                </select>

                <label className="ui-chip flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={filters.openNow}
                    onChange={(e) => setFilters((prev) => ({ ...prev, openNow: e.target.checked }))}
                    className="accent-teal-600"
                  />
                  영업 중
                </label>
              </div>

              <div className="mt-3 grid gap-2 sm:flex sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <button
                    onClick={() => void detectLocation()}
                    disabled={locating}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 sm:w-auto sm:justify-start ${
                      userLocation
                        ? "border border-teal-300/80 bg-teal-100/70 text-teal-800"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    📍 {locating ? "감지 중..." : userLocation ? "위치 감지됨" : "현재 위치"}
                  </button>
                  <button
                    onClick={() => void searchSpots()}
                    className="w-full rounded-xl bg-gradient-to-r from-teal-700 to-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:from-teal-600 hover:to-cyan-600 sm:w-auto"
                  >
                    조회
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="text-xs text-slate-400">{spotCountLabel}</span>
                  {(userLocation || filters.minRating || filters.openNow) && (
                    <button
                      onClick={() => {
                        setFilters(INITIAL_FILTERS);
                        setUserLocation(null);
                        void searchSpotsWithLocation(null, INITIAL_FILTERS);
                      }}
                      className="text-xs font-semibold text-slate-400 underline"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>
            </div>

            {spotError && (
              <div className="ui-panel rounded-2xl border-rose-300/70 bg-rose-50/85 px-4 py-3 text-sm text-rose-700">
                {spotError}
              </div>
            )}

            {/* 장소 목록 + 상세 */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_380px]">
              {/* 목록 */}
              <div className="grid grid-cols-1 gap-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
                {loadingSpots ? (
                  <p className="ui-panel rounded-2xl py-10 text-center text-sm text-slate-400">
                    장소를 불러오는 중...
                  </p>
                ) : spots.length === 0 ? (
                  <p className="ui-panel rounded-2xl py-10 text-center text-sm text-slate-400">
                    조건에 맞는 장소가 없습니다.
                  </p>
                ) : (
                  spots.map((spot) => (
                    <article
                      key={spot.id}
                      className={`ui-panel flex gap-3 rounded-2xl p-4 text-left transition ${
                        selectedSpotId === spot.id
                          ? "border-teal-400 ring-1 ring-teal-300"
                          : "hover:border-slate-300"
                      }`}
                    >
                      <button
                        onClick={() => void loadSpotDetail(spot.id)}
                        className="flex w-full gap-3 text-left"
                      >
                        {/* 썸네일 */}
                        <div className="shrink-0">
                          {spot.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={spot.photoUrl}
                              alt={spot.name}
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                              {spot.type === "restaurant" ? "🍜" : spot.type === "cafe" ? "☕" : "🏛"}
                            </div>
                          )}
                        </div>

                        {/* 정보 */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-bold">{spot.name}</p>
                            <span className="shrink-0 text-sm font-semibold text-amber-600">
                              ★ {spot.rating?.toFixed(1) ?? "-"}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{spot.address}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              {spot.distanceKm.toFixed(2)}km
                            </span>
                            {userLocation && (() => {
                              const { walkMin, transitMin } = travelTime(spot.distanceKm);
                              return (
                                <>
                                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                                    🚶 {walkMin}분
                                  </span>
                                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-600">
                                    🚌 {transitMin}분
                                  </span>
                                </>
                              );
                            })()}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {spot.reason}
                            </span>
                          </div>
                        </div>
                      </button>
                    </article>
                  ))
                )}
              </div>

              {/* 상세 패널: 모바일=바텀시트, 데스크탑=사이드패널 */}
              {selectedSpotId && (
                <>
                  {/* 모바일 딤 오버레이 */}
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
                    onClick={closeDetail}
                  />

                  <aside
                    style={{ transform: sheetDragY > 0 ? `translateY(${sheetDragY}px)` : undefined }}
                    className="
                    ui-panel animate-slide-up overflow-y-auto
                    fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] rounded-t-3xl
                    transition-transform duration-200 ease-out
                    lg:static lg:inset-auto lg:z-auto lg:max-h-[calc(100vh-220px)] lg:animate-none lg:rounded-2xl lg:transition-none
                  "
                    onTouchStart={handleSheetTouchStart}
                    onTouchMove={handleSheetTouchMove}
                    onTouchEnd={handleSheetTouchEnd}
                    onTouchCancel={handleSheetTouchEnd}
                  >
                    {/* 핸들 + 닫기 (모바일만) */}
                    <div className="sticky top-0 z-10 flex touch-none items-center justify-center rounded-t-3xl bg-white/80 px-4 pb-2 pt-3 backdrop-blur-sm lg:hidden">
                      <div className="h-1 w-10 rounded-full bg-slate-200" />
                      <button
                        className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                        onClick={closeDetail}
                      >
                        ✕
                      </button>
                    </div>

                    {loadingDetail ? (
                      <p className="p-6 text-sm text-slate-400">상세 정보를 불러오는 중...</p>
                    ) : detailError ? (
                      <p className="p-6 text-sm text-rose-600">{detailError}</p>
                    ) : spotDetail ? (
                      <>
                        {/* 대표 사진 */}
                        {spotDetail.photoUrls[0] ? (
                          <button
                            className="relative w-full touch-manipulation"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openLightbox(0);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openLightbox(0);
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={spotDetail.photoUrls[0]}
                              alt={spotDetail.name}
                              className="no-touch-menu pointer-events-none h-48 w-full select-none object-cover lg:rounded-t-2xl"
                              draggable={false}
                            />
                            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                              🔍 클릭해서 확대
                            </span>
                          </button>
                        ) : (
                          <div className="flex h-28 items-center justify-center bg-slate-100 text-4xl lg:rounded-t-2xl">
                            {spotDetail.type === "restaurant" ? "🍜" : spotDetail.type === "cafe" ? "☕" : "🏛"}
                          </div>
                        )}

                        <div className="p-4 pb-28 lg:pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-lg font-bold">{spotDetail.name}</p>
                            <span className="shrink-0 text-sm font-bold text-amber-600">
                              ★ {spotDetail.rating?.toFixed(1) ?? "-"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{spotDetail.address}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => void copyText(`${spotDetail.name} - ${spotDetail.address}`, "장소 정보")}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                            >
                              주소 복사
                            </button>
                          </div>

                          {spotDetail.phone && (
                            <a
                              href={`tel:${spotDetail.phone}`}
                              className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-teal-600"
                            >
                              📞 {spotDetail.phone}
                            </a>
                          )}

                          {spotDetail.website && (
                            <a
                              href={spotDetail.website}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-teal-600 underline"
                            >
                              🔗 웹사이트
                            </a>
                          )}

                          {spotDetail.openingHours.length > 0 && (
                            <div className="mt-3 rounded-xl border border-white/70 bg-white/70 p-3">
                              <p className="text-xs font-bold text-slate-400">영업 시간</p>
                              {todayOpeningInfo && (
                                <div className="mt-1.5 rounded-lg bg-slate-100 px-2.5 py-2">
                                  <p className="text-xs font-semibold text-slate-500">{todayOpeningInfo.status}</p>
                                  <p className="mt-0.5 text-xs font-bold text-slate-700">{todayOpeningInfo.detail}</p>
                                </div>
                              )}
                              <ul className="mt-1 grid gap-0.5">
                                {spotDetail.openingHours.map((line) => (
                                  <li key={line} className="text-xs text-slate-600">{line}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 가는 길 */}
                          <div className="mt-3 rounded-xl border border-white/70 bg-white/70 p-3">
                            <p className="text-xs font-bold text-slate-400">가는 길</p>
                            {userLocation && (() => {
                              const matched = spots.find((s) => s.id === selectedSpotId);
                              if (!matched) return null;
                              const { walkMin, transitMin } = travelTime(matched.distanceKm);
                              return (
                                <div className="mt-2 flex gap-2">
                                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                    🚶 도보 {walkMin}분
                                  </span>
                                  <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                                    🚌 대중교통 {transitMin}분
                                  </span>
                                </div>
                              );
                            })()}
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  `${spotDetail.lat},${spotDetail.lng}`
                                )}&query_place_id=${encodeURIComponent(spotDetail.id)}`}
                                className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white"
                              >
                                🗺 구글맵에서 보기
                              </a>
                              <a
                                href={
                                  userLocation
                                    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                                        `${userLocation.lat},${userLocation.lng}`
                                      )}&destination=${encodeURIComponent(
                                        `${spotDetail.lat},${spotDetail.lng}`
                                      )}&destination_place_id=${encodeURIComponent(spotDetail.id)}`
                                    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                        `${spotDetail.lat},${spotDetail.lng}`
                                      )}&destination_place_id=${encodeURIComponent(spotDetail.id)}`
                                }
                                className="flex items-center justify-center gap-1 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white"
                              >
                                🧭 길 안내
                              </a>
                            </div>
                          </div>

                          {/* 추가 사진 */}
                          {spotDetail.photoUrls.length > 1 && (
                            <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto pb-1">
                              {spotDetail.photoUrls.slice(1).map((url, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openLightbox(i + 1);
                                  }}
                                  onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openLightbox(i + 1);
                                  }}
                                  onContextMenu={(e) => e.preventDefault()}
                                  className="shrink-0 touch-manipulation"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={`${spotDetail.name} ${i + 2}`}
                                    className="no-touch-menu pointer-events-none h-20 w-20 select-none rounded-xl object-cover transition hover:opacity-80"
                                    draggable={false}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}
                  </aside>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 모바일 하단 탭바 */}
      <nav className="safe-bottom-nav fixed bottom-0 left-0 right-0 z-30 border-t border-white/60 bg-slate-50/85 backdrop-blur sm:hidden">
        <div className="grid grid-cols-5">
          {TAB_ITEMS.map(({ tab, icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-0.5 py-3 text-xs font-semibold transition ${
                activeTab === tab ? "text-teal-700" : "text-slate-500"
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
              {activeTab === tab && (
                <span className="mt-0.5 h-1 w-4 rounded-full bg-gradient-to-r from-teal-700 to-cyan-700" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
