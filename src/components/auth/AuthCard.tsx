
import React from "react";
import { HeildaLogo } from "@/components/branding/HeildaLogo";

export default function AuthCard({
  title, 
  description, 
  children
}: React.PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/5 mt-[-8rem]">
        <header className="mb-5">
          <HeildaLogo className="h-[28px] w-auto -ml-px" />
          <h1 className="mt-3 text-lg font-semibold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}
