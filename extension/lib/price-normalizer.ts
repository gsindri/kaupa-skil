import type { PricePayload } from '../types';
import type { RawPrice } from './selector-library';

const SYMBOL_MAP: Record<string, string> = {
  '€': 'EUR',
  '£': 'GBP',
  '$': 'USD',
  'kr': 'ISK',
  'ISK': 'ISK'
};

export function parseCurrencySymbol(text: string): string | undefined {
  for (const [sym, code] of Object.entries(SYMBOL_MAP)) {
    if (text.includes(sym)) return code;
  }
  const m = text.match(/\b[A-Z]{3}\b/);
  return m?.[0];
}

function normalizeDecimal(str: string): string {
  return str.replace(/\s/g, '').replace(',', '.');
}

function parsePrice(text: string): number {
  const m = text.match(/[\d.,]+/);
  return m ? parseFloat(normalizeDecimal(m[0])) : NaN;
}

export function parsePack(text: string): { unit: string; packSize: number } | undefined {
  let m = text.match(/case of (\d+)/i);
  if (m) return { unit: 'case', packSize: Number(m[1]) };
  m = text.match(/(\d+)\s*x/i);
  if (m) return { unit: 'unit', packSize: Number(m[1]) };
  m = text.match(/(\d+)\s*kg/i);
  if (m) return { unit: 'kg', packSize: Number(m[1]) };
  m = text.match(/(\d+)\s*g/i);
  if (m) return { unit: 'g', packSize: Number(m[1]) };
  m = text.match(/(\d+)\s*ml/i);
  if (m) return { unit: 'ml', packSize: Number(m[1]) };
  m = text.match(/(\d+)\s*l/i);
  if (m) return { unit: 'l', packSize: Number(m[1]) };
  return undefined;
}

export function inferVatFlag(text: string): 'incl' | 'excl' | 'unknown' {
  if (/incl/i.test(text) && /vat|tax/i.test(text)) return 'incl';
  if (/excl/i.test(text) && /vat|tax/i.test(text)) return 'excl';
  return 'unknown';
}

export function normalize(raw: RawPrice, source: 'network' | 'dom', url: string): PricePayload {
  const priceDisplay = parsePrice(raw.priceText);
  const currency = raw.currencyText || parseCurrencySymbol(raw.priceText) || undefined;
  const packInfo = raw.packText ? parsePack(raw.packText) : undefined;
  const pricePerUnit = packInfo ? +(priceDisplay / packInfo.packSize).toFixed(2) : undefined;
  const vatFlag = inferVatFlag(raw.priceText + ' ' + (raw.packText || ''));
  return {
    url,
    source,
    priceDisplay,
    currency,
    pack: raw.packText,
    unit: packInfo?.unit,
    packSize: packInfo?.packSize,
    pricePerUnit,
    vatFlag,
    ts: new Date().toISOString()
  };
}
