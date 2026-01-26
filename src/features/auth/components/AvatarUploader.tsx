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
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { BaseModal } from '@/components/ui/BaseModal';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { useUploadAvatarMutation } from '../hooks/useProfileMutations';
import { useAuthStore } from '../stores/authStore';
import { cn } from '@/lib/utils';

export interface AvatarUploaderProps {
  className?: string;
  layout?: 'stacked' | 'row';
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  showButton?: boolean;
}

export function AvatarUploader({
  className,
  layout = 'stacked',
  buttonVariant = 'ghost',
  buttonSize = 'sm',
  showButton = true,
}: AvatarUploaderProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const uploadMutation = useUploadAvatarMutation();

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
  const createImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  }, []);

  const getCroppedImage = useCallback(
    async (imageSrc: string, cropArea: Area): Promise<Blob> => {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
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
    [createImage]
  );

  // Handle crop confirmation
  const handleCropConfirm = useCallback(async () => {
    if (!croppedAreaPixels || !imageFile || !imageSrc) return;

    console.log('✂️ [AvatarUploader] Starting crop and upload');
    console.log('   Crop dimensions:', croppedAreaPixels);

    try {
      // Get cropped image blob
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
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
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      // Force a re-render by checking the current user
      const currentUser = useAuthStore.getState().user;
      console.log('🔍 [AvatarUploader] Current user in store after upload:');
      console.log('   User ID:', currentUser?.id);
      console.log('   Avatar URL:', currentUser?.avatarUrl);
    } catch (error) {
      console.error('[AvatarUploader] Crop error:', error);
    }
  }, [croppedAreaPixels, imageFile, imageSrc, uploadMutation, getCroppedImage]);

  // Handle crop cancel
  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setImageSrc('');
    setImageFile(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
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
    <div
      className={cn(
        layout === 'row'
          ? 'flex items-center justify-between gap-4'
          : 'flex flex-col items-center gap-3',
        className
      )}
    >
      {/* Avatar Display */}
      <div className={cn('relative', layout === 'row' && 'flex items-center')}>
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
      {showButton && (
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {t('settings.changePhoto')}
        </Button>
      )}

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
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="relative h-80 w-full overflow-hidden rounded-xl bg-neutral-900/5">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-700">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-brand-cyan"
              aria-label="Zoom"
            />
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
              disabled={!croppedAreaPixels || uploadMutation.isPending}
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
