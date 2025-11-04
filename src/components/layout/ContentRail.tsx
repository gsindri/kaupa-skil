import { PropsWithChildren, type Ref } from "react";

interface ContentRailProps extends PropsWithChildren {
  includeRailPadding?: boolean;
  contentRef?: Ref<HTMLDivElement>;
}

export function ContentRail({
  children,
  includeRailPadding = true,
  contentRef
}: ContentRailProps) {
  return (
    <div className={includeRailPadding ? "pl-[var(--layout-rail,72px)]" : undefined}>
      <div
        ref={contentRef}
        className="content-container"
      >
        {children}
      </div>
    </div>
  );
}
