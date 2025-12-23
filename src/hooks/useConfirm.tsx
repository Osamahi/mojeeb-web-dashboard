/**
 * useConfirm Hook
 * Provides a Promise-based API for confirmation dialogs
 * Replaces window.confirm() with a professional, branded dialog
 *
 * Usage:
 * ```tsx
 * const confirm = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item? This action cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'danger',
 *   });
 *
 *   if (confirmed) {
 *     await deleteItem();
 *   }
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info';
}

interface DialogState extends ConfirmOptions {
  open: boolean;
  resolve: (value: boolean) => void;
}

export const useConfirm = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    resolve: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
    dialogState.resolve(false);
  }, [dialogState]);

  const handleConfirm = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
    dialogState.resolve(true);
  }, [dialogState]);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      open={dialogState.open}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      variant={dialogState.variant}
    />
  );

  return {
    confirm,
    ConfirmDialogComponent,
  };
};
