/**
 * Arrow Right Icon Component
 * Used for navigation and continue buttons
 * Automatically flips to point left in RTL layouts
 */

interface ArrowRightIconProps {
  className?: string;
  size?: number;
}

export const ArrowRightIcon = ({ className = 'w-5 h-5', size }: ArrowRightIconProps) => {
  return (
    <svg
      className={`${className} rtl:rotate-180`}
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
};
