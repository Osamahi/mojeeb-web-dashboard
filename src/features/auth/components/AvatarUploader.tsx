/**
 * AvatarUploader Component
 * Handles profile avatar upload with image cropping functionality
 *
 * Features:
 * - Display current avatar with gradient fallback
 * - File selection with validation (5MB max, JPEG/PNG/WebP only)
 * - Image cropping modal with circular crop
 * - Upload to backend with loading states
 * - Delete avatar functionality
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button } from '@/components/ui/Button';
import { useUploadAvatarMutation } from '../hooks/useProfileMutations';
import { useAuthStore } from '../stores/authStore';
import { cn } from '@/lib/utils';

export interface AvatarUploaderProps {
  className?: string;
}

export function AvatarUploader({ className }: AvatarUploaderProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const uploadMutation = useUploadAvatarMutation();

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert(t('settings.avatarInvalidType'));
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t('settings.avatarTooLarge'));
      return;
    }

    // Read file and show crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setImageFile(file);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    event.target.value = '';
  }, [t]);

  // Create cropped image blob
  const getCroppedImage = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to crop size
      canvas.width = crop.width;
      canvas.height = crop.height;

      // Draw cropped image
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.9
        );
      });
    },
    []
  );

  // Handle crop confirmation
  const handleCropConfirm = useCallback(async () => {
    if (!completedCrop || !imageRef.current || !imageFile) return;

    console.log('✂️ [AvatarUploader] Starting crop and upload');
    console.log('   Crop dimensions:', completedCrop);

    try {
      // Get cropped image blob
      const croppedBlob = await getCroppedImage(imageRef.current, completedCrop);
      console.log('✅ [AvatarUploader] Image cropped successfully');
      console.log('   Blob size:', (croppedBlob.size / 1024).toFixed(2), 'KB');

      // Create File from blob (preserve original extension)
      const croppedFile = new File([croppedBlob], imageFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload to backend
      console.log('📤 [AvatarUploader] Uploading cropped image to backend');
      const result = await uploadMutation.mutateAsync(croppedFile);
      console.log('✅ [AvatarUploader] Upload mutation completed');
      console.log('   Returned user:', result);
      console.log('   Returned avatar URL:', result.avatarUrl);

      // Close modal and reset state
      console.log('🔄 [AvatarUploader] Closing modal and resetting state');
      setShowCropModal(false);
      setImageSrc('');
      setImageFile(null);
      setCompletedCrop(null);

      // Force a re-render by checking the current user
      const currentUser = useAuthStore.getState().user;
      console.log('🔍 [AvatarUploader] Current user in store after upload:');
      console.log('   User ID:', currentUser?.id);
      console.log('   Avatar URL:', currentUser?.avatarUrl);
    } catch (error) {
      console.error('[AvatarUploader] Crop error:', error);
    }
  }, [completedCrop, imageFile, uploadMutation, getCroppedImage]);

  // Handle crop cancel
  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setImageSrc('');
    setImageFile(null);
    setCompletedCrop(null);
  }, []);

  const isLoading = uploadMutation.isPending;

  // Log when user avatar changes
  useEffect(() => {
    console.log('👤 [AvatarUploader] User prop changed');
    console.log('   User ID:', user?.id);
    console.log('   User name:', user?.name);
    console.log('   Avatar URL:', user?.avatarUrl);
    console.log('   Avatar URL length:', user?.avatarUrl?.length || 0);
  }, [user?.avatarUrl]);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Avatar Display */}
      <div className="relative">
        <Avatar
          key={user?.avatarUrl || 'no-avatar'}
          src={user?.avatarUrl}
          name={user?.name || user?.email}
          size="xl"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Change Photo Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
      >
        {t('settings.changePhoto')}
      </Button>

      {/* Crop Modal */}
      <BaseModal
        isOpen={showCropModal}
        onClose={handleCropCancel}
        title={t('settings.cropImage')}
        subtitle={t('settings.cropImageSubtitle')}
        maxWidth="lg"
        isLoading={uploadMutation.isPending}
        closable={!uploadMutation.isPending}
      >
        <div className="space-y-4">
          {/* Crop Area */}
          <div className="flex justify-center bg-neutral-50 rounded-lg p-4">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  className="max-h-[400px] object-contain"
                />
              </ReactCrop>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCropCancel}
              disabled={uploadMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCropConfirm}
              disabled={!completedCrop || uploadMutation.isPending}
              isLoading={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? t('common.uploading') : t('common.upload')}
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
