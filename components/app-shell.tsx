import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";

type AppShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AppShell({ children, title, subtitle }: AppShellProps) {
  return (
    <div className="app-shell-backdrop min-h-dvh bg-background text-on-surface">
      <TopNav title={title} subtitle={subtitle} />
      <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-32 pt-32">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
