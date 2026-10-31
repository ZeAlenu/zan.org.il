export type CoalitionOrg = {
  name: string;
  ring: 1 | 2 | 3;
  href: string;
  kicker: string;
  line: string;
};

export const coalitionSections = ["מטעם זה עלינו", "ארגוני ברית", "שותפים"] as const;

export const coalitionOrgs: readonly CoalitionOrg[] = [
  {
    name: "הורים למען ישראל",
    ring: 1,
    href: "https://edu.zan.org.il",
    kicker: "תנועה של זה עלינו",
    line: "חוזרים לחינוך ציוני בכיתות.",
  },
  {
    name: "השיבה שופטינו כבראשונה",
    ring: 2,
    href: "/hashiva-shoftenu",
    kicker: "ארגון ברית · מותג עצמאי",
    line: "האקתון אמנות, מחאה וחזון בנושא בג״ץ.",
  },
];

export function orgsInSection(section: (typeof coalitionSections)[number]): readonly CoalitionOrg[] {
  const ring = section === "מטעם זה עלינו" ? 1 : section === "ארגוני ברית" ? 2 : 3;
  return coalitionOrgs.filter((org) => org.ring === ring);
}

export const hashivaArchive = {
  href: "/hashiva-shoftenu",
  title: "השיבה שופטינו כבראשונה",
} as const;

export function orgKind(ring: CoalitionOrg["ring"]): "own" | "ally" | "partner" {
  if (ring === 1) return "own";
  if (ring === 2) return "ally";
  return "partner";
}
