import { PropsWithChildren } from "react";

export function ContentRail({ children }: PropsWithChildren) {
  return (
    <div className="pl-[var(--layout-rail,72px)]">
      <div className="mx-auto w-full max-w-screen-2xl px-5 md:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
