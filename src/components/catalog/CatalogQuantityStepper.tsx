import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogQuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  onRemove?: () => void;
  itemLabel: string;
  className?: string;
  canIncrease?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  size?: "sm" | "md";
  increaseButtonRef?: RefObject<HTMLButtonElement>;
}

type StepDirection = "inc" | "dec";

const HOLD_DELAY_MS = 320;
const HOLD_INTERVAL_MS = 120;

export function CatalogQuantityStepper({
  quantity,
  onChange,
  onRemove,
  itemLabel,
  className,
  canIncrease = true,
  minQuantity = 0,
  maxQuantity,
  size = "md",
  increaseButtonRef,
}: CatalogQuantityStepperProps) {
  const holdTimeoutRef = useRef<number>();
  const holdIntervalRef = useRef<number>();
  const latestQuantity = useRef(quantity);
  const pendingQuantitiesRef = useRef<number[]>([]);
  const resolvedQuantitiesRef = useRef<Set<number>>(new Set());
  const [optimisticQuantity, setOptimisticQuantity] = useState(quantity);

  const effectiveMax = typeof maxQuantity === "number" ? Math.max(minQuantity, maxQuantity) : undefined;
  const clampToBounds = useCallback(
    (value: number) => {
      if (value <= 0) {
        return 0;
      }

      const clampedMax = effectiveMax !== undefined ? Math.min(value, effectiveMax) : value;
      return Math.max(minQuantity, clampedMax);
    },
    [effectiveMax, minQuantity],
  );

  const effectiveCanIncrease = canIncrease && (effectiveMax === undefined || optimisticQuantity < effectiveMax);

  useEffect(() => {
    const pendingQuantities = pendingQuantitiesRef.current;
    const resolvedQuantities = resolvedQuantitiesRef.current;

    if (pendingQuantities.length === 0) {
      if (resolvedQuantities.delete(quantity)) {
        return;
      }

      latestQuantity.current = quantity;
      setOptimisticQuantity(quantity);
      return;
    }

    const pendingCount = pendingQuantities.length;
    const matchIndex = pendingQuantities.lastIndexOf(quantity);

    if (matchIndex === -1) {
      if (resolvedQuantities.delete(quantity)) {
        return;
      }

      if (pendingQuantities.length > 0) {
        for (const value of pendingQuantities) {
          resolvedQuantities.add(value);
        }
        pendingQuantities.splice(0, pendingQuantities.length);
      }

      latestQuantity.current = quantity;
      setOptimisticQuantity(quantity);
      return;
    }

    const resolvedEntries = pendingQuantities.splice(0, matchIndex + 1);

    if (resolvedEntries.length > 1) {
      for (let index = 0; index < resolvedEntries.length - 1; index += 1) {
        resolvedQuantities.add(resolvedEntries[index]);
      }
    }

    if (matchIndex === pendingCount - 1) {
      resolvedQuantities.delete(quantity);
      latestQuantity.current = quantity;
      setOptimisticQuantity(quantity);
      return;
    }

    resolvedQuantities.add(quantity);
  }, [quantity]);

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = undefined;
    }
    if (holdIntervalRef.current) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = undefined;
    }
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const applyQuantity = useCallback(
    (next: number) => {
      const boundedNext = clampToBounds(next);
      const current = latestQuantity.current;
      const pendingQuantities = pendingQuantitiesRef.current;
      const resolvedQuantities = resolvedQuantitiesRef.current;
      const allowRemoval = onRemove !== undefined || minQuantity <= 0;

      const markResolved = (values: number[]) => {
        for (const value of values) {
          resolvedQuantities.add(value);
        }
      };

      if (boundedNext <= 0) {
        if (!allowRemoval) {
          const fallback = Math.max(1, minQuantity);
          if (current !== fallback) {
            latestQuantity.current = fallback;
            resolvedQuantities.delete(fallback);
            pendingQuantities.push(fallback);
            setOptimisticQuantity(fallback);
            onChange(fallback);
            pendingQuantities.pop();
          } else {
            setOptimisticQuantity(fallback);
          }
          return;
        }

        if (current > 0) {
          if (pendingQuantities.length > 0) {
            markResolved(pendingQuantities);
            pendingQuantities.splice(0, pendingQuantities.length);
          }

          resolvedQuantities.add(current);
          resolvedQuantities.delete(0);

          pendingQuantities.push(0);
          latestQuantity.current = 0;
          setOptimisticQuantity(0);
          if (onRemove) {
            onRemove();
          } else {
            onChange(0);
          }
          pendingQuantities.pop();
        }
        return;
      }

      if (boundedNext !== current) {
        latestQuantity.current = boundedNext;
        resolvedQuantities.delete(boundedNext);
        pendingQuantities.push(boundedNext);
        setOptimisticQuantity(boundedNext);
        onChange(boundedNext);
        return;
      }

      setOptimisticQuantity(boundedNext);
    },
    [clampToBounds, minQuantity, onChange, onRemove],
  );

  const step = useCallback(
    (direction: StepDirection, magnitude = 1) => {
      const current = latestQuantity.current;
      if (direction === "inc" && !effectiveCanIncrease) {
        return;
      }
      const delta = direction === "inc" ? magnitude : -magnitude;
      const next = clampToBounds(current + delta);
      applyQuantity(next);
    },
    [applyQuantity, clampToBounds, effectiveCanIncrease],
  );

  const scheduleHold = useCallback(
    (direction: StepDirection) => {
      if (direction === "inc" && !effectiveCanIncrease) {
        return;
      }
      stopHold();
      holdTimeoutRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          step(direction);
        }, HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
      window.addEventListener("pointerup", stopHold, { once: true });
    },
    [effectiveCanIncrease, step, stopHold],
  );

  const handleClick = useCallback(
    (direction: StepDirection, event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const magnitude = event.metaKey || event.ctrlKey ? 10 : event.shiftKey ? 5 : 1;
      step(direction, magnitude);
    },
    [step],
  );

  const sizeStyles =
    size === "sm"
      ? {
          root:
            "h-9 gap-1 rounded-md border-border/60 bg-background/90 px-1.5 py-0.5 text-xs text-foreground shadow-sm",
          button:
            "h-8 w-8 rounded-md border border-border/60 bg-card/80 text-foreground",
          count: "min-w-[2.25rem] text-center text-sm",
        }
      : {
          root:
            "gap-2 rounded-full border border-border/70 bg-background/95 px-2 py-1 text-sm font-medium text-foreground shadow-sm",
          button:
            "h-10 w-10 rounded-full border border-border/60 bg-card/90 text-foreground",
          count: "min-w-[2.75rem] text-center text-sm font-semibold",
        };

  return (
    <div
      role="group"
      aria-label={`Quantity controls for ${itemLabel}`}
      className={cn(
        "inline-flex items-center backdrop-blur",
        sizeStyles.root,
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "catalog-card__stepper-btn transition-transform duration-150 ease-out",
          sizeStyles.button,
          "hover:-translate-y-0.5 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
        )}
        aria-label={`Decrease quantity of ${itemLabel}`}
        onPointerDown={() => {
          scheduleHold("dec");
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={event => handleClick("dec", event)}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span
        className={cn(
          "catalog-card__stepper-count tabular-nums",
          sizeStyles.count,
        )}
        aria-live="polite"
      >
        {optimisticQuantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "catalog-card__stepper-btn transition-transform duration-150 ease-out",
          sizeStyles.button,
          "hover:-translate-y-0.5 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
        )}
        aria-label={`Increase quantity of ${itemLabel}`}
        disabled={!effectiveCanIncrease}
        ref={increaseButtonRef}
        onPointerDown={() => {
          scheduleHold("inc");
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={event => handleClick("inc", event)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

export default CatalogQuantityStepper;
