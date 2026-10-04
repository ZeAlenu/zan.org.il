import raw from "./chart.json";

export type NodeAttr = "COL" | "LIB" | "MIX";
export type EdgeColor = NodeAttr | "ISL" | "JEW";
export type Kind = "stem" | "pipe" | "fracture" | "feed" | "weak" | "flow";

export type ChartNode = {
  id: string;
  title: string;
  short: string;
  tag: string;
  subtitle: string;
  note: string;
  attr: NodeAttr;
  ink?: "ISL" | "JEW";
  layer: number;
  row: number;
  dead?: boolean;
  root?: boolean;
};

export type ChartEdge = {
  from: string;
  to: string;
  color: EdgeColor;
  kind: Kind;
  label?: string;
  emphasis?: boolean;
};

export const NODES = raw.nodes as ChartNode[];
export const EDGES = raw.edges as ChartEdge[];

const NODE_BY_ID = new Map(NODES.map((node) => [node.id, node]));

export function nodeOf(id: string): ChartNode {
  const node = NODE_BY_ID.get(id);
  if (!node) {
    throw new Error(`missing node ${id}`);
  }
  return node;
}

export const LAYER_GROUPS: ReadonlyArray<{ label: string; from: number; to: number }> = [
  { label: "שורשים", from: 0, to: 0 },
  { label: "התגלמות", from: 1, to: 1 },
  { label: "דתות", from: 2, to: 4 },
  { label: "מודרנה", from: 5, to: 7 },
  { label: "איזמים 19", from: 8, to: 9 },
  { label: "איזמים המאה ה־20", from: 10, to: 10 },
  { label: "העת הנוכחית", from: 11, to: 11 },
];

export type Frame = {
  id: string;
  label: string;
  tooltip: string;
  members: string[];
  /** Centers the title over this member instead of the whole frame. */
  labelOver?: string;
  marks?: string[];
  look: "redGreen" | "liberty" | "exile";
};

export const FRAMES: Frame[] = [
  {
    id: "frame-exile",
    label: "2000 שנות גלות",
    tooltip: "מחורבן הבית בשנת 70 ועד הקמת ישראל. היהדות חיה כקהילה סגורה, מעל הקו.",
    members: [
      "exile_rome",
      "exile_medieval",
      "exile_poland",
      "exile_emancipation",
      "exile_pogroms",
      "exile_holocaust",
    ],
    labelOver: "exile_rome",
    look: "exile",
  },
  {
    id: "frame-red-green",
    label: "ברית אדומה־ירוקה",
    tooltip:
      "התכנסות טקטית של שמאל פרוגרסיבי, ווק, ואסלאמיזם פוליטי. הווק הוא הזרוע התרבותית של הצד האדום. הקפלניזם הוא הפנים הישראליות שלה.",
    members: ["pol_religion", "progressivism", "woke", "kaplanism"],
    marks: ["🍉"],
    look: "redGreen",
  },
  {
    id: "frame-liberty",
    label: "ברית החירות",
    tooltip: "הציוויליזציה המתגוננת והציונות הלאומית שיוצאת מישראל. כחול כדגל ישראל, פסים כדגל ארצות הברית.",
    members: ["zionism_national", "liberty_remnant"],
    marks: ["🇮🇱", "🇺🇸"],
    look: "liberty",
  },
];

export function kindLabel(kind: Kind): string {
  switch (kind) {
    case "stem":
      return "שושלת ישירה";
    case "pipe":
      return "צינור ראשי";
    case "fracture":
      return "פולמוס / שבר";
    case "feed":
      return "הזנה, לא זהות";
    case "weak":
      return "חלש";
    case "flow":
      return "השפעה";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

export function attrWord(attr: NodeAttr): string {
  switch (attr) {
    case "COL":
      return "קולקטיב / מגדל";
    case "LIB":
      return "חירות";
    case "MIX":
      return "מעורב";
    default: {
      const unreachable: never = attr;
      return unreachable;
    }
  }
}
