/**
 * Checkmark Icon Component
 * Simple checkmark without circle - used for checkbox states
 */

interface CheckmarkIconProps {
  className?: string;
  size?: number;
}

export const CheckmarkIcon = ({ className = 'w-3 h-3', size }: CheckmarkIconProps) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
};
