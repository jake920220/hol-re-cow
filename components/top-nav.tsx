import { BellIcon, MenuIcon } from "@/components/icons";

type TopNavProps = {
  title: string;
  subtitle?: string;
};

export function TopNav({ title, subtitle }: TopNavProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="w-full max-w-[430px] rounded-[28px] border border-outline-variant/40 bg-surface/92 px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-high text-primary">
              <MenuIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold tracking-[0.28em] text-tertiary uppercase">
                Holre-cow
              </p>
              <h1 className="truncate text-lg font-semibold text-on-surface">
                {title}
              </h1>
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-high text-on-surface-variant transition hover:text-primary"
          >
            <BellIcon className="h-5 w-5" />
          </button>
        </div>
        {subtitle ? (
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
