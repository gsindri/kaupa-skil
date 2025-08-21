export interface PricePayload {
  url: string;
  source: 'network' | 'dom';
  priceDisplay: number;
  currency?: string;
  pack?: string;
  unit?: string;
  packSize?: number;
  pricePerUnit?: number;
  vatFlag?: 'incl' | 'excl' | 'unknown';
  ts: string;
}

declare global {
  interface Window {
    __KpsExtPresent?: boolean;
  }
}

export {};
