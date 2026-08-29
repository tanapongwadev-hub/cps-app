import { env } from "@/config/env";

export function resolveProductImage(imagePath: string | null | undefined): string | null {
  if (!imagePath?.trim()) return null;

  const trimmed = imagePath.trim();
  if (/^(https?:|data:|blob:)/i.test(trimmed) || trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const baseUrl = env.api.baseUrl.replace(/\/$/, "");
  const origin = baseUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/api\/?$/, "");

  return !origin || origin.startsWith("/") ? normalized : `${origin}${normalized}`;
}
