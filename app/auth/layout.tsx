import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-stage min-h-dvh text-on-surface">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10 pt-[calc(env(safe-area-inset-top)+20px)]">
        {children}
      </div>
    </div>
  );
}
