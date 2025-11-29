
import React from "react";
import { Link } from "react-router-dom";
import { HeildaLogo } from "@/components/branding/HeildaLogo";

export default function AuthCard({
  title,
  description,
  children
}: React.PropsWithChildren<{ title: string; description?: string }>) {
  return (
    <main className="min-h-screen grid place-items-center bg-slate-50">
      <div className="w-full max-w-md mt-[-8rem]">
        <div className="rounded-2xl p-px bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg">
          <div className="rounded-2xl bg-white dark:bg-card p-8">
            <header className="mb-6 text-center">
              <Link to="/" className="inline-block">
                <HeildaLogo className="h-[28px] w-auto" variant="auto" />
              </Link>
              <h1 className="mt-6 text-lg font-semibold text-gray-900">{title}</h1>
              <span className="mt-2 block h-[2px] w-8 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 mx-auto" />
              {description && <p className="mt-4 text-sm text-gray-600">{description}</p>}
            </header>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
