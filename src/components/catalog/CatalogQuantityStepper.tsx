import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CatalogQuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  onRemove: () => void;
  itemLabel: string;
  className?: string;
  canIncrease?: boolean;
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
}: CatalogQuantityStepperProps) {
  const holdTimeoutRef = useRef<number>();
  const holdIntervalRef = useRef<number>();
  const latestQuantity = useRef(quantity);
  const [optimisticQuantity, setOptimisticQuantity] = useState(quantity);

  useEffect(() => {
    latestQuantity.current = quantity;
    setOptimisticQuantity(quantity);
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
      const current = latestQuantity.current;
      if (next <= 0) {
        if (current > 0) {
          latestQuantity.current = 0;
          setOptimisticQuantity(0);
          onRemove();
        }
        return;
      }

      if (next !== current) {
        latestQuantity.current = next;
        setOptimisticQuantity(next);
        onChange(next);
        return;
      }

      setOptimisticQuantity(next);
    },
    [onChange, onRemove],
  );

  const step = useCallback(
    (direction: StepDirection, magnitude = 1) => {
      const current = latestQuantity.current;
      if (direction === "inc" && !canIncrease) {
        return;
      }
      const delta = direction === "inc" ? magnitude : -magnitude;
      const next = Math.max(0, current + delta);
      applyQuantity(next);
    },
    [applyQuantity, canIncrease],
  );

  const scheduleHold = useCallback(
    (direction: StepDirection) => {
      if (direction === "inc" && !canIncrease) {
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
    [canIncrease, step, stopHold],
  );

  const handleClick = useCallback(
    (direction: StepDirection, event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const magnitude = event.metaKey || event.ctrlKey ? 10 : event.shiftKey ? 5 : 1;
      step(direction, magnitude);
    },
    [step],
  );

  return (
    <div
      role="group"
      aria-label={`Quantity controls for ${itemLabel}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-2 py-1 text-sm font-medium text-foreground shadow-sm backdrop-blur",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "catalog-card__stepper-btn h-10 w-10 rounded-full border border-border/60 bg-card/90 text-foreground transition-transform duration-150 ease-out",
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
        className="catalog-card__stepper-count min-w-[2.75rem] text-center text-sm font-semibold tabular-nums"
        aria-live="polite"
      >
        {optimisticQuantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "catalog-card__stepper-btn h-10 w-10 rounded-full border border-border/60 bg-card/90 text-foreground transition-transform duration-150 ease-out",
          "hover:-translate-y-0.5 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
        )}
        aria-label={`Increase quantity of ${itemLabel}`}
        disabled={!canIncrease}
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
