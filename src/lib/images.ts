export const PLACEHOLDER_IMAGE = '/placeholder.svg';
export const UNAVAILABLE_IMAGE = '/unavailable.svg';

export function resolveImage(image?: string, availabilityStatus?: string) {
  if (image) return image;
  return availabilityStatus === 'UNKNOWN' ? UNAVAILABLE_IMAGE : PLACEHOLDER_IMAGE;
}
