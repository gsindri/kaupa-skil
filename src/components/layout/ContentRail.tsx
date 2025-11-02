import { PropsWithChildren } from "react";

interface ContentRailProps extends PropsWithChildren {
  includeRailPadding?: boolean;
}

export function ContentRail({
  children,
  includeRailPadding = true
}: ContentRailProps) {
  return (
    <div className={includeRailPadding ? "pl-[var(--layout-rail,72px)]" : undefined}>
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "var(--page-max)",
          paddingInline: "var(--page-gutter)"
        }}
      >
        {children}
      </div>
    </div>
  );
}
