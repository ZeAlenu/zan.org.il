export const site = {
  name: "זה עלינו",
  line: "בונים תקומה ציונית",
  sentence:
    "זה עלינו הוא ארגון אזרחי, הפועל למען חזון תקומה ציונית של העם היהודי בארצו.",
  email: "zealenu@gmail.com",
  whatsapp: "https://chat.whatsapp.com/JiGaKG7q6gO9yF5q4Ut53b",
  x: "https://x.com/ZeAlenu",
  xHandle: "@ZeAlenu",
  host: "zan.org.il",
  mapHref: "/redgreen",
  mapLiberty: "חירות",
  mapOther: "ברית אדומה-ירוקה",
  mapTitle: "חירות vs. ברית אדומה-ירוקה",
  mapKicker: "מלחמת התרבות בת 3800 השנים.",
  mapLine:
    "מפה של דתות ואיזמים כשושלות של דפוס מגדל בבל (קולקטיביזם) מול החירות.",
  joinTitle: "הצטרפו לתנועה",
  joinLine: "ההצטרפות לזה עלינו נעשית בקבוצת הוואטסאפ.",
  joinCall: "קהילת הוואטסאפ",
  contactTitle: "יצירת קשר",
} as const;

/** Pending Maxim: arm is קהילות or זרועות. Every menu, crumb, and heading reads this. */
export const GROUP_LABELS = {
  movement: "תנועות",
  arm: "קהילות", // PENDING Maxim: קהילות | זרועות
  forum: "פורום ייעוץ",
} as const;

export const GROUP_BLURBS = {
  movement: "TODO",
  arm: "TODO",
  forum: "TODO",
} as const;

export type GroupType = keyof typeof GROUP_LABELS;

export const pages = {
  home: {
    path: "/",
    title: `${site.name} — ${site.line}`,
    headline: site.name,
    description: site.sentence,
    card: "home",
  },
  about: {
    path: "/about",
    title: `מי אנחנו — ${site.name}`,
    headline: "מי אנחנו",
    description: site.sentence,
    card: "about",
  },
  vision: {
    path: "/vision",
    title: `${site.line} — ${site.name}`,
    headline: site.line,
    description: site.sentence,
    card: "vision",
  },
  join: {
    path: "/join",
    title: `הצטרפות — ${site.name}`,
    headline: site.joinTitle,
    description: site.joinLine,
    card: "join",
  },
  contact: {
    path: "/contact",
    title: `קשר — ${site.name}`,
    headline: site.contactTitle,
    description: site.sentence,
    card: "contact",
  },
  map: {
    path: "/redgreen",
    title: `${site.mapTitle} — ${site.name}`,
    headline: site.mapTitle,
    description: site.mapLine,
    card: "map",
  },
} as const;

export type PageId = keyof typeof pages;

export function pageForPath(pathname: string): (typeof pages)[PageId] | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  return Object.values(pages).find((page) => page.path === path);
}
