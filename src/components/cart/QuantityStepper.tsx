import { useMemo, useCallback } from "react";
import { CatalogQuantityStepper } from "@/components/catalog/CatalogQuantityStepper";
import { useCartQuantityController } from "@/contexts/useCartQuantityController";

interface QuantityStepperProps {
  supplierItemId: string;
  quantity: number;
  label: string;
  supplier?: string;
  min?: number;
  max?: number;
  className?: string;
  canIncrease?: boolean;
}

export function QuantityStepper({
  supplierItemId,
  quantity,
  label,
  supplier,
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

  const { requestQuantity, remove, canIncrease: controllerCanIncrease, optimisticQuantity } = useCartQuantityController(
    supplierItemId,
    quantity
  );

  const handleRemove = useCallback(() => {
    if (minQuantity > 0) {
      requestQuantity(minQuantity);
      return;
    }
    remove();
  }, [minQuantity, remove, requestQuantity]);

  const handleChange = useCallback(
    (next: number) => {
      if (next <= 0) {
        handleRemove();
        return;
      }

      requestQuantity(next);
    },
    [handleRemove, requestQuantity]
  );

  const effectiveCanIncrease =
    canIncrease && controllerCanIncrease && (maxQuantity === undefined || optimisticQuantity < maxQuantity);

  return (
    <CatalogQuantityStepper
      quantity={optimisticQuantity}
      onChange={handleChange}
      onRemove={handleRemove}
      itemLabel={itemLabel}
      className={className}
      canIncrease={effectiveCanIncrease}
      minQuantity={minQuantity}
      maxQuantity={maxQuantity}
      size="sm"
      hideTrashIcon={true}
    />
  );
}

export default QuantityStepper;
