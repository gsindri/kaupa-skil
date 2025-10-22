import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
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
  const targetQuantityRef = useRef(quantity);
  const pendingDirectionRef = useRef<StepDirection | null>(null);
  const [optimisticQuantity, setOptimisticQuantity] = useState(quantity);
  const [inputValue, setInputValue] = useState(() => `${quantity}`);
  const [isInputFocused, setIsInputFocused] = useState(false);

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
  const allowRemoval = onRemove !== undefined || minQuantity <= 0;

  useEffect(() => {
    const normalized = Number.isFinite(quantity) ? quantity : 0;
    const pendingDirection = pendingDirectionRef.current;
    const target = targetQuantityRef.current;

    if (pendingDirection === "inc" && normalized < target) {
      return;
    }

    if (pendingDirection === "dec" && normalized > target) {
      return;
    }

    latestQuantity.current = normalized;
    targetQuantityRef.current = normalized;
    if (pendingDirection !== null) {
      pendingDirectionRef.current = null;
    }

    setOptimisticQuantity(normalized);
    if (!isInputFocused) {
      setInputValue(String(normalized));
    }
  }, [isInputFocused, quantity]);

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
      const previous = latestQuantity.current;
      const allowRemoval = onRemove !== undefined || minQuantity <= 0;

      if (boundedNext <= 0) {
        if (!allowRemoval) {
          const fallback = Math.max(1, minQuantity);
          if (latestQuantity.current === fallback) {
            targetQuantityRef.current = fallback;
            pendingDirectionRef.current = null;
            setOptimisticQuantity(fallback);
            setInputValue(String(fallback));
            return;
          }
          latestQuantity.current = fallback;
          targetQuantityRef.current = fallback;
          if (fallback > previous) {
            pendingDirectionRef.current = "inc";
          } else if (fallback < previous) {
            pendingDirectionRef.current = "dec";
          } else {
            pendingDirectionRef.current = null;
          }
          setOptimisticQuantity(fallback);
          setInputValue(String(fallback));
          onChange(fallback);
          return;
        }

        latestQuantity.current = 0;
        targetQuantityRef.current = 0;
        pendingDirectionRef.current = "dec";
        setOptimisticQuantity(0);
        setInputValue("0");
        if (onRemove) {
          onRemove();
        } else {
          onChange(0);
        }
        return;
      }

      latestQuantity.current = boundedNext;
      targetQuantityRef.current = boundedNext;
      if (boundedNext > previous) {
        pendingDirectionRef.current = "inc";
      } else if (boundedNext < previous) {
        pendingDirectionRef.current = "dec";
      } else {
        pendingDirectionRef.current = null;
      }
      setOptimisticQuantity(boundedNext);
      setInputValue(String(boundedNext));
      onChange(boundedNext);
    },
    [clampToBounds, minQuantity, onChange, onRemove],
  );

  const step = useCallback(
    (direction: StepDirection, magnitude = 1) => {
      const current = latestQuantity.current;

      if (direction === "inc") {
        const canStep = canIncrease && (effectiveMax === undefined || current < effectiveMax);
        if (!canStep) {
          return;
        }
      }

      const delta = direction === "inc" ? magnitude : -magnitude;
      const next = clampToBounds(current + delta);

      if (next === current) {
        return;
      }

      applyQuantity(next);
    },
    [applyQuantity, clampToBounds, canIncrease, effectiveMax],
  );

  const scheduleHold = useCallback(
    (direction: StepDirection) => {
      if (direction === "inc") {
        const current = latestQuantity.current;
        const canStep = canIncrease && (effectiveMax === undefined || current < effectiveMax);
        if (!canStep) {
          return;
        }
      }

      stopHold();
      holdTimeoutRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          step(direction);
        }, HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
      window.addEventListener("pointerup", stopHold, { once: true });
    },
    [canIncrease, effectiveMax, step, stopHold],
  );

  const handleClick = useCallback(
    (direction: StepDirection, event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const magnitude = event.metaKey || event.ctrlKey ? 10 : event.shiftKey ? 5 : 1;
      step(direction, magnitude);
    },
    [step],
  );

  const commitInputValue = useCallback(() => {
    const parsed = Number.parseInt(inputValue, 10);
    if (Number.isNaN(parsed)) {
      setInputValue(`${optimisticQuantity}`);
      return;
    }

    applyQuantity(parsed);
  }, [applyQuantity, inputValue, optimisticQuantity]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value.replace(/[^0-9]/g, "");
      if (!raw.length) {
        setInputValue("");
        return;
      }
      setInputValue(raw);
    },
    [],
  );

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commitInputValue();
        (event.currentTarget as HTMLInputElement).blur();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setInputValue(`${optimisticQuantity}`);
        (event.currentTarget as HTMLInputElement).blur();
      }
    },
    [commitInputValue, optimisticQuantity],
  );

  const sizeStyles =
    size === "sm"
      ? {
          root:
            "h-full min-h-[2.25rem] overflow-hidden rounded-full border border-border/60 bg-background/95 text-[13px] font-medium text-foreground shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-1 focus-within:ring-offset-background",
          button:
            "flex h-full min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-none bg-transparent text-foreground first:rounded-l-full last:rounded-r-full",
          countWrapper:
            "relative flex h-full flex-1 items-center justify-center bg-transparent px-2",
          count:
            "catalog-card__stepper-count h-[2.25rem] min-w-[3rem] text-center text-sm font-medium leading-[2.25rem] text-foreground",
        }
      : {
          root:
            "h-full min-h-[2.5rem] overflow-hidden rounded-full border border-border/60 bg-background text-sm font-medium text-foreground shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-1 focus-within:ring-offset-background",
          button:
            "flex h-full min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-none bg-transparent text-foreground first:rounded-l-full last:rounded-r-full",
          countWrapper:
            "relative flex h-full flex-1 items-center justify-center bg-transparent px-3",
          count:
            "catalog-card__stepper-count h-[2.5rem] min-w-[3.25rem] text-center text-base font-medium leading-[2.5rem] text-foreground",
        };

  const showRemoveIcon = allowRemoval && optimisticQuantity <= Math.max(1, minQuantity || 0);
  const decrementLabel = showRemoveIcon
    ? `Remove ${itemLabel} from cart`
    : `Decrease quantity of ${itemLabel}`;

  return (
    <div
      role="group"
      aria-label={`Quantity controls for ${itemLabel}`}
      className={cn(
        "inline-flex w-full items-stretch backdrop-blur",
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
        aria-label={decrementLabel}
        onPointerDown={() => {
          scheduleHold("dec");
        }}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={event => handleClick("dec", event)}
      >
        {showRemoveIcon ? (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Minus className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
      <div
        className={cn(
          "relative flex-1",
          sizeStyles.countWrapper,
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => {
            setIsInputFocused(false);
            commitInputValue();
          }}
          aria-label={`Quantity for ${itemLabel}`}
          className={cn(
            "w-full appearance-none bg-transparent tabular-nums text-center text-foreground outline-none",
            sizeStyles.count,
          )}
        />
        <span className="sr-only" aria-live="polite">
          {optimisticQuantity}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "catalog-card__stepper-btn transition-transform duration-150 ease-out",
          sizeStyles.button,
          "hover:-translate-y-0.5 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1",
          !effectiveCanIncrease && "opacity-60",
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
