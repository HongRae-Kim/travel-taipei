module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/backend.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "backendApiBaseUrl",
    ()=>backendApiBaseUrl,
    "backendUrl",
    ()=>backendUrl
]);
const DEFAULT_BACKEND_API_BASE_URL = "http://localhost:8080";
function backendApiBaseUrl() {
    const configured = process.env.BACKEND_API_BASE_URL?.trim();
    if (!configured) {
        return DEFAULT_BACKEND_API_BASE_URL;
    }
    return configured.replace(/\/$/, "");
}
function backendUrl(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${backendApiBaseUrl()}${normalizedPath}`;
}
}),
"[project]/src/lib/proxy.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "proxyGet",
    ()=>proxyGet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$backend$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/backend.ts [app-route] (ecmascript)");
;
;
const DEFAULT_HEADERS = {
    Accept: "application/json"
};
async function proxyGet(path, searchParams) {
    const query = searchParams?.toString();
    const target = query ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$backend$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["backendUrl"])(path)}?${query}` : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$backend$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["backendUrl"])(path);
    try {
        const response = await fetch(target, {
            method: "GET",
            headers: DEFAULT_HEADERS,
            cache: "no-store"
        });
        const contentType = response.headers.get("content-type") ?? "";
        const isJson = contentType.includes("application/json");
        const body = isJson ? await response.json() : {
            success: false,
            message: "백엔드 응답을 JSON으로 파싱할 수 없습니다."
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(body, {
            status: response.status
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            message: "백엔드 서버에 연결할 수 없습니다. BACKEND_API_BASE_URL과 서버 상태를 확인해주세요."
        }, {
            status: 502
        });
    }
}
}),
"[project]/src/app/api/travel/weather/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$proxy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/proxy.ts [app-route] (ecmascript)");
;
async function GET() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$proxy$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["proxyGet"])("/api/weather");
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e0a75881._.js.map