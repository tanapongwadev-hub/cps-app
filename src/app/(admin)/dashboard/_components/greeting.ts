import { Sun, Sunset, Moon, CloudSun } from "lucide-react";

export type Greeting = {
  th: string;
  en: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
};

export function getGreeting(now: Date): Greeting {
  const h = now.getHours();
  if (h >= 5 && h < 11) {
    return { th: "สวัสดีตอนเช้า", en: "Good morning", Icon: CloudSun, tint: "from-amber-400/20 to-orange-300/10" };
  }
  if (h >= 11 && h < 13) {
    return { th: "สวัสดีตอนเที่ยง", en: "Good noon", Icon: Sun, tint: "from-amber-300/20 to-yellow-200/10" };
  }
  if (h >= 13 && h < 17) {
    return { th: "สวัสดีตอนบ่าย", en: "Good afternoon", Icon: Sun, tint: "from-sky-300/20 to-blue-200/10" };
  }
  if (h >= 17 && h < 19) {
    return { th: "สวัสดีตอนเย็น", en: "Good evening", Icon: Sunset, tint: "from-orange-400/20 to-rose-300/10" };
  }
  return { th: "สวัสดีตอนกลางคืน", en: "Good night", Icon: Moon, tint: "from-indigo-500/20 to-purple-400/10" };
}

const THAI_DAY = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_MONTH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function formatThaiDate(now: Date): string {
  const day = now.getDate();
  const dow = THAI_DAY[now.getDay()];
  const month = THAI_MONTH[now.getMonth()];
  const year = now.getFullYear() + 543; // Buddhist Era
  return `วัน${dow}ที่ ${day} ${month} ${year}`;
}
