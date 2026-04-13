"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PlusSquareIcon, UserIcon } from "@/components/icons";

const items = [
  { href: "/feed", label: "피드", Icon: HomeIcon },
  { href: "/create", label: "작성", Icon: PlusSquareIcon },
  { href: "/mypage", label: "마이", Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="flex w-full max-w-[430px] items-center justify-between rounded-[28px] border border-outline-variant/40 bg-surface/94 px-5 py-3 shadow-[0_-18px_40px_rgba(0,0,0,0.24)] backdrop-blur-md">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase transition ${
                active
                  ? "bg-primary-container text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
