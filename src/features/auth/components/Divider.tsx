/**
 * Minimal Divider Component
 * Horizontal divider with centered text
 * Used across auth pages to separate sections
 */

interface DividerProps {
  text?: string;
}

export const Divider = ({ text = 'Or continue with' }: DividerProps) => {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neutral-200"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-white text-neutral-500">{text}</span>
      </div>
    </div>
  );
};
