const DEFAULT_BACKEND_API_BASE_URL = "http://localhost:8080";

export function backendApiBaseUrl() {
  const configured = process.env.BACKEND_API_BASE_URL?.trim();
  if (!configured) {
    return DEFAULT_BACKEND_API_BASE_URL;
  }
  return configured.replace(/\/$/, "");
}

export function backendUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${backendApiBaseUrl()}${normalizedPath}`;
}
