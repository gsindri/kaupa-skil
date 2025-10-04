import { useMemo } from "react";
import { CatalogQuantityStepper } from "@/components/catalog/CatalogQuantityStepper";

interface QuantityStepperProps {
  quantity: number;
  onChange: (qty: number) => void;
  label: string;
  supplier?: string;
  onRemove?: () => void;
  min?: number;
  max?: number;
  className?: string;
  canIncrease?: boolean;
}

export function QuantityStepper({
  quantity,
  onChange,
  label,
  supplier,
  onRemove,
  min = 0,
  max,
  className,
  canIncrease = true,
}: QuantityStepperProps) {
  const itemLabel = useMemo(() => {
    if (supplier) {
      return `${label} from ${supplier}`;
    }
    return label;
  }, [label, supplier]);

  const minQuantity = Number.isFinite(min) ? Math.max(0, Math.floor(min)) : 0;
  const maxQuantity =
    max !== undefined && Number.isFinite(max) ? Math.max(minQuantity, Math.floor(max)) : undefined;

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
      return;
    }

    const fallback = minQuantity > 0 ? minQuantity : 0;
    onChange(fallback);
  };

  const handleChange = (next: number) => {
    if (next <= 0) {
      handleRemove();
      return;
    }

    const bounded = maxQuantity !== undefined ? Math.min(next, maxQuantity) : next;
    onChange(bounded);
  };

  const effectiveCanIncrease = canIncrease && (maxQuantity === undefined || quantity < maxQuantity);

  return (
    <CatalogQuantityStepper
      quantity={quantity}
      onChange={handleChange}
      onRemove={handleRemove}
      itemLabel={itemLabel}
      className={className}
      canIncrease={effectiveCanIncrease}
      minQuantity={minQuantity}
      maxQuantity={maxQuantity}
      size="sm"
    />
  );
}

export default QuantityStepper;
