export type CoalitionOrg = {
  name: string;
  ring: 2 | 3;
};

export const coalitionSections = ["מטעם זה עלינו", "ארגוני ברית", "שותפים"] as const;

export const coalitionOrgs: readonly CoalitionOrg[] = [];

export function orgsInSection(section: (typeof coalitionSections)[number]): readonly CoalitionOrg[] {
  if (section === "ארגוני ברית") return coalitionOrgs.filter((org) => org.ring === 2);
  if (section === "שותפים") return coalitionOrgs.filter((org) => org.ring === 3);
  return [];
}

export const hashivaArchive = {
  href: "/hashiva-shoftenu",
  title: "השיבה שופטינו כבראשונה",
} as const;
