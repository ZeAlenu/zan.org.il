export const site = {
  name: "זה עלינו",
  line: "בונים תקומה ציונית",
  sentence:
    "זה עלינו הוא ארגון אזרחי, הפועל למען חזון תקומה ציונית של העם היהודי בארצו.",
  email: "zealenu@gmail.com",
  whatsapp: "https://chat.whatsapp.com/JiGaKG7q6gO9yF5q4Ut53b",
  x: "https://x.com/ZeAlenu",
  xHandle: "@ZeAlenu",
  mapHref: "/map",
  mapTitle: "חירות vs. ברית אדומה-ירוקה",
} as const;

export const stops = [
  { href: "/", id: "home", label: "הבית" },
  { href: "/about", id: "about", label: "מי אנחנו" },
  { href: "/vision", id: "vision", label: "החזון" },
  { href: "/join", id: "join", label: "הצטרפות" },
  { href: "/contact", id: "contact", label: "קשר" },
] as const;

export type StopId = (typeof stops)[number]["id"];
