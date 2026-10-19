function escape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const ltr =
  /https?:\/\/[^\s<>"']+|\d[\d.]*\s*[×x]\s*\d[\d.]*|[A-Za-z\u0400-\u04FF0-9]+(?:[.\-'+][A-Za-z\u0400-\u04FF0-9]+)*(?:\s+[A-Za-z\u0400-\u04FF0-9]+(?:[.\-'+][A-Za-z\u0400-\u04FF0-9]+)*)*(?:…|\.{3})?/g;

export function withLtr(text: string): string {
  let html = "";
  let last = 0;
  for (const match of text.matchAll(ltr)) {
    const index = match.index ?? 0;
    html += escape(text.slice(last, index));
    html += `<span dir="ltr">${escape(match[0])}</span>`;
    last = index + match[0].length;
  }
  html += escape(text.slice(last));
  return html;
}

export function statementIsLong(statement: string): boolean {
  return statement.length > 240 || statement.split("\n").length > 4;
}
