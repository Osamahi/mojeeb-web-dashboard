/**
 * Check Circle Icon Component
 * Green checkmark in a circle - used for success states
 */

interface CheckCircleIconProps {
  className?: string;
  size?: number;
}

export const CheckCircleIcon = ({ className = 'w-5 h-5 text-green-600', size }: CheckCircleIconProps) => {
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
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
};
