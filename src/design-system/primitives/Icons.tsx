import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const SunIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
  </svg>
);

export const MoonIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
  </svg>
);

export const ArrowUpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 19V5m-6 6 6-6 6 6" />
  </svg>
);

export const ArrowDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14m6-6-6 6-6-6" />
  </svg>
);

export const RetryIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 1 0 2.6-6.3" />
    <path d="M3 4v4h4" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PlayIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8.5 5.8v12.4c0 .9 1 1.5 1.8 1L20 13c.7-.5.7-1.5 0-2L10.3 4.8c-.8-.5-1.8.1-1.8 1Z" />
  </svg>
);

export const CarouselIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="7" width="13" height="13" rx="3" />
    <path d="M8.5 4H17a3 3 0 0 1 3 3v8.5" />
  </svg>
);

export const ImageIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="9.5" cy="9.5" r="1.6" />
    <path d="m5 17 4.5-4.5a1.4 1.4 0 0 1 2 0L17 18" />
  </svg>
);

export const HeartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20.3 4.9 13a4.6 4.6 0 0 1 0-6.4 4.3 4.3 0 0 1 6.2 0l.9 1 .9-1a4.3 4.3 0 0 1 6.2 0 4.6 4.6 0 0 1 0 6.4L12 20.3Z" />
  </svg>
);

export const CommentIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 0-3.2 6.4L20 19.5l-.9-3A7.9 7.9 0 0 0 20 12Z" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const VerifiedIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 1.8 14.8 4l3.5-.3 1 3.4 3 1.9-1.3 3.2 1.3 3.2-3 1.9-1 3.4-3.5-.3L12 22l-2.8-2.2-3.5.3-1-3.4-3-1.9L3 11.6 1.7 8.4l3-1.9 1-3.4 3.5.3L12 1.8Z" />
    <path d="m8.5 12 2.4 2.4 4.6-4.8" stroke="var(--ds-surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
