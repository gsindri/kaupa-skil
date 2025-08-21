export interface RawPrice {
  priceText: string;
  currencyText?: string;
  packText?: string;
}

const SELECTORS = [
  '[data-price]',
  '[itemprop="price"]',
  '.price',
  '.price .amount',
  '.product-price',
  '.price__current'
];

export function pickPrice(doc: Document): RawPrice | null {
  for (const sel of SELECTORS) {
    const el = doc.querySelector(sel);
    if (el && el.textContent) {
      const priceText = el.textContent.trim();
      if (!priceText) continue;
      const currencyText = (el as HTMLElement).dataset.currency || undefined;
      const packEl = el.closest('.product')?.querySelector('.pack, .unit, .uom');
      const packText = packEl?.textContent?.trim() || undefined;
      return { priceText, currencyText, packText };
    }
  }
  return null;
}
