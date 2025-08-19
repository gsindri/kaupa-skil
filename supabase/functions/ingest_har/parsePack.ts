export function parsePack(s: string) {
  const t = (s || "").toLowerCase().replace(/\s+/g, "");
  const mX = t.match(/^(\d+)x(\d+(?:[\.,]\d+)?)(l|kg|g)$/);
  if (mX) {
    const n = Number(mX[1]);
    let per = Number(mX[2].replace(",", "."));
    let unit = mX[3];
    if (unit === "g") {
      per = per / 1000;
      unit = "kg";
    }
    return { qty: n * per, unit: unit === "kg" ? "kg" : "L" };
  }
  const singleMatch = t.match(/^(\d+(?:[\.,]\d+)?)(l|kg|g)$/);
  if (singleMatch) {
    let qty = Number(singleMatch[1].replace(",", "."));
    let unit = singleMatch[2];
    if (unit === "g") {
      qty = qty / 1000;
      unit = "kg";
    }
    return { qty, unit: unit === "kg" ? "kg" : "L" };
  }
  return { qty: 1, unit: "each" };
}
