export type RawItem = {
  supplierId: string;
  sourceUrl?: string;
  payload: unknown;
};

export type NormalizedItem = {
  supplierId: string;
  supplierSku: string;
  name: string;
  brand?: string;
  packSize?: string;
  gtin?: string;
  categoryPath?: string[];
  imageUrl?: string;
  availabilityText?: string;
  sourceUrl?: string;
  dataProvenance: 'api'|'csv'|'sitemap'|'manual';
  provenanceConfidence: number;
  rawHash: string;
};

export interface SupplierAdapter {
  key: string;
  pull(): Promise<RawItem[]>;
  normalize(rows: RawItem[]): Promise<NormalizedItem[]>;
}
