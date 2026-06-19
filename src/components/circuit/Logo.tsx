type Props = {
  size?: number;
};

export function Logo({ size = 28 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logic Lab logo"
    >
      <defs>
        <linearGradient id="ll-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#ll-grad)" />
      <path
        d="M9 9 H15 A6 6 0 0 1 15 21 H9 Z"
        fill="hsl(var(--background))"
        stroke="hsl(var(--background))"
        strokeWidth="0.6"
      />
      <line x1="5" y1="12" x2="9" y2="12" stroke="hsl(var(--background))" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="5" y1="18" x2="9" y2="18" stroke="hsl(var(--background))" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="21" y1="15" x2="26" y2="15" stroke="hsl(var(--background))" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="26" cy="15" r="1.4" fill="hsl(var(--background))" />
    </svg>
  );
}
