
import { deliveryCalculator } from '@/services/DeliveryCalculator';

export interface SupplierRule {
  supplierId: string;
  name: string;
  freeThresholdExVat: number;
  flatFee: number;
  cutoff: string;
  deliveryDays: string[];
}

// Mock supplier rules - replace with actual data
const mockSupplierRules: SupplierRule[] = [
  {
    supplierId: 'costco',
    name: 'Costco',
    freeThresholdExVat: 25000,
    flatFee: 2500,
    cutoff: '14:00',
    deliveryDays: ['Mon', 'Wed', 'Fri']
  },
  {
    supplierId: 'metro',
    name: 'Metro',
    freeThresholdExVat: 30000,
    flatFee: 3000,
    cutoff: '12:00',
    deliveryDays: ['Tue', 'Thu']
  }
];

export function getSupplierRule(supplierId: string): SupplierRule | null {
  return mockSupplierRules.find(rule => rule.supplierId === supplierId) || null;
}

export function estimateFee(supplierId: string, subtotalExVat: number): number {
  const rule = getSupplierRule(supplierId);
  if (!rule) return 0;
  
  return subtotalExVat >= rule.freeThresholdExVat ? 0 : rule.flatFee;
}

export function calculateBreakEven(
  currentPrice: number,
  cheaperPrice: number,
  deliveryFee: number
): number {
  const unitSavings = currentPrice - cheaperPrice;
  if (unitSavings <= 0) return 0;
  
  return Math.ceil(deliveryFee / unitSavings);
}

export function getDeliveryHint(supplierId: string): string | null {
  const rule = getSupplierRule(supplierId);
  if (!rule) return null;
  
  const today = new Date();
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'short' });
  
  const nextDeliveryDay = rule.deliveryDays.find(day => 
    rule.deliveryDays.indexOf(day) > rule.deliveryDays.indexOf(currentDay)
  ) || rule.deliveryDays[0];
  
  return `Order by ${rule.cutoff} for ${nextDeliveryDay}`;
}
