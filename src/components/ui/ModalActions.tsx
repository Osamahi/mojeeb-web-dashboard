/**
 * Reusable Modal Actions Component
 * Provides consistent button layouts for modal dialogs
 */

import { Button } from './Button';

interface ModalActionButton {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface ModalActionsProps {
  primary: ModalActionButton;
  secondary?: ModalActionButton;
  layout?: 'horizontal' | 'vertical';
  useButtonComponent?: boolean; // Use shadcn Button component vs raw buttons
}

export const ModalActions = ({
  primary,
  secondary,
  layout = 'vertical',
  useButtonComponent = false,
}: ModalActionsProps) => {
  const containerClass = layout === 'horizontal'
    ? 'flex gap-3'
    : 'space-y-3';

  const buttonSizeClass = layout === 'horizontal' ? 'flex-1' : 'w-full';

  // Using shadcn Button component (for ExitIntentModal style)
  if (useButtonComponent) {
    return (
      <div className={containerClass}>
        <Button
          onClick={primary.onClick}
          disabled={primary.disabled}
          className={`${buttonSizeClass} h-11`}
        >
          {primary.label}
        </Button>
        {secondary && (
          <Button
            onClick={secondary.onClick}
            disabled={secondary.disabled}
            variant={secondary.variant === 'outline' ? 'outline' : 'default'}
            className={`${buttonSizeClass} h-11`}
          >
            {secondary.label}
          </Button>
        )}
      </div>
    );
  }

  // Using raw buttons (for SimpleConfirmModal / DemoCallModal style)
  const getPrimaryButtonClass = () => {
    const baseClass = `${buttonSizeClass} px-4 py-3.5 text-base font-medium rounded-xl transition-colors`;

    if (primary.variant === 'secondary') {
      return `${baseClass} text-neutral-900 hover:bg-neutral-50`;
    }

    return `${baseClass} bg-black text-white hover:bg-neutral-800`;
  };

  const getSecondaryButtonClass = () => {
    const baseClass = `${buttonSizeClass} px-4 py-3 text-sm font-medium rounded-xl transition-colors`;
    return `${baseClass} text-neutral-600 hover:text-neutral-900`;
  };

  return (
    <div className={containerClass}>
      <button
        onClick={primary.onClick}
        disabled={primary.disabled}
        className={getPrimaryButtonClass()}
      >
        {primary.label}
      </button>
      {secondary && (
        <button
          onClick={secondary.onClick}
          disabled={secondary.disabled}
          className={getSecondaryButtonClass()}
        >
          {secondary.label}
        </button>
      )}
    </div>
  );
};
