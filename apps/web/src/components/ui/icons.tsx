/**
 * Inline SVG icon set.
 *
 * The design system forbids emoji as iconography (`docs/design/components.md`
 * §5), and `lucide-react` / `shadcn/ui` are still pending installation, so the
 * few icons the welcome screen needs are kept here as dependency-free SVG.
 * Every icon is decorative: it inherits `currentColor` and is always hidden from
 * assistive technology, because the surrounding control carries the label.
 */

/** Props shared by every icon of the set. */
export type IconProps = {
  /** Class names applied to the `<svg>` element (size, visibility, spacing). */
  className?: string;
};

const ICON_BASE_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/**
 * Sun icon: the affordance that switches to the dark theme.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function SunIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={20} height={20} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

/**
 * Moon icon: the affordance that switches back to the light theme.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={20} height={20} className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

/**
 * Right arrow icon: marks the skip action as a forward navigation.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Left chevron icon: previous slide button affordance.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={24} height={24} className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

/**
 * Right chevron icon: next slide button affordance.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={24} height={24} className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/**
 * Alert triangle icon: communicates an error or warning state.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * Home icon: Feed navigation destination.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={24} height={24} className={className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

/**
 * Plus icon: Create new post action.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={24} height={24} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * User icon: Profile navigation and account menu affordance.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function UserIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={24} height={24} className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/**
 * Shield icon: Admin navigation destination.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={24} height={24} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/**
 * Search icon: Buscador affordance in the filter bar.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={20} height={20} className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

/**
 * Sliders icon: Filter panel toggler affordance (mobile).
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function SlidersIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={20} height={20} className={className}>
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="6" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="4" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="8" y2="3" />
      <line x1="1" x2="7" y1="14" y2="14" />
      <line x1="9" x2="15" y1="12" y2="12" />
      <line x1="17" x2="23" y1="16" y2="16" />
    </svg>
  );
}

/**
 * Lock icon: Communicates draft or hidden visibility state on a post card.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function LockIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={14} height={14} className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * Calendar icon: Date filter affordance.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={20} height={20} className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}


export function XIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={20} height={20} className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/**
 * Left arrow icon: Navigation back action affordance.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

/**
 * Tag icon: Keyword/hashtag list affordance.
 *
 * @param props - Icon props.
 * @returns The SVG element.
 */
export function TagIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l4.58-4.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <path d="M14.5 4h-5L7 2H2v16h20V4z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} width={16} height={16} className={className}>
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...ICON_BASE_PROPS} className={className}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

