export const enum MsgType {
  PING = 'PING',
  REQUEST_ORIGIN_PERMISSION = 'REQUEST_ORIGIN_PERMISSION',
  SYNC_PRICE = 'SYNC_PRICE',
  BEGIN_CAPTURE = 'BEGIN_CAPTURE',
  CAPTURE_RESULT = 'CAPTURE_RESULT'
}

export interface ExtensionMessage {
  type: MsgType;
  [key: string]: any;
}

export function isPriceLike(obj: any): obj is { priceDisplay: number } {
  return obj && typeof obj.priceDisplay === 'number';
}
