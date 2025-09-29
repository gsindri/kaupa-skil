import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SupplierLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

export function SupplierLogo({ name, logoUrl, className }: SupplierLogoProps) {
  const [error, setError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    setError(false);
    setAspectRatio(null);
  }, [logoUrl]);

  const hasLogo = !!logoUrl && !error;
  const normalizedRatio = hasLogo && aspectRatio && aspectRatio > 0 ? aspectRatio : 1;
  const orientation =
    normalizedRatio > 1.2 ? "landscape" : normalizedRatio < 0.8 ? "portrait" : "square";
  const aspectStyle: CSSProperties = { aspectRatio: normalizedRatio };

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0]!)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-5 min-w-[0.75rem] max-w-[3.5rem] items-center justify-center overflow-hidden rounded-md bg-muted",
        className,
      )}
      aria-hidden="true"
      data-orientation={orientation}
      style={aspectStyle}
    >
      {hasLogo ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          loading="lazy"
          className="block h-full w-full object-contain"
          onLoad={event => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth && naturalHeight) {
              setAspectRatio(naturalWidth / naturalHeight);
            }
          }}
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-[10px] font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}

export default SupplierLogo;
