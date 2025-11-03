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
        className="mx-auto w-full"
        style={{
          maxWidth: "var(--page-max)",
          paddingInline: "var(--page-gutter)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
