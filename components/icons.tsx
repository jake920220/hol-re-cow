import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    />
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </BaseIcon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 18h8" />
      <path d="M6.5 16.5h11a2 2 0 0 0 .6-3.9l-.6-.2V10a5.5 5.5 0 1 0-11 0v2.4l-.6.2a2 2 0 0 0 .6 3.9" />
    </BaseIcon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.8V19h11v-8.2" />
    </BaseIcon>
  );
}

export function PlusSquareIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12h7" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </BaseIcon>
  );
}
