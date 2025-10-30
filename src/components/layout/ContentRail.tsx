import { PropsWithChildren } from "react";

export function ContentRail({ children }: PropsWithChildren) {
  return (
    <div className="pl-[var(--layout-rail,72px)]">
      <div 
        className="mx-auto w-full" 
        style={{ 
          maxWidth: 'var(--page-max)', 
          paddingInline: 'var(--page-gutter)' 
        }}
      >
        {children}
      </div>
    </div>
  );
}
