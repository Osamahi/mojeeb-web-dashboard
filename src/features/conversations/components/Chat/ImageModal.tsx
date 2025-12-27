/**
 * Image Modal Component
 * Full-screen modal for viewing images with download, share, and carousel features
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Share2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { BaseModal } from '@/components/ui/BaseModal';
import type { MessageAttachment } from '../../types';
import { chatToasts } from '../../utils/chatToasts';

interface ImageModalProps {
  images: MessageAttachment[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageModal({ images, initialIndex, onClose }: ImageModalProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageError, setImageError] = useState(false);

  // Return null if no images
  if (images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // Reset error state when image changes
  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  // Carousel navigation handlers (memoized to prevent useEffect re-runs)
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasMultipleImages) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultipleImages, onClose, handlePrevious, handleNext]);

  // Download image handler
  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentImage.filename || `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      chatToasts.success(t('image_modal.download_success'));
    } catch (error) {
      chatToasts.error(t('image_modal.download_error'));
    }
  };

  // Share image handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('image_modal.share_title'),
          text: currentImage.filename || t('image_modal.share_text'),
          url: currentImage.url,
        });
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(currentImage.url);
      chatToasts.success(t('image_modal.url_copied'));
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={currentImage.filename || t('image_modal.image_title', { number: currentIndex + 1 })}
      maxWidth="2xl"
      className="bg-black/90"
      contentClassName="!p-0"
    >
      <div className="relative flex flex-col items-center -m-4">

        {/* Image counter - only show if multiple images */}
        {hasMultipleImages && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Previous button - only show if multiple images */}
        {hasMultipleImages && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title={t('image_modal.previous')}
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Next button - only show if multiple images */}
        {hasMultipleImages && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title={t('image_modal.next')}
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Image */}
        {imageError ? (
          <div className="flex items-center justify-center bg-neutral-100 rounded-lg p-8 min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
              <p className="text-neutral-600">{t('image_modal.load_error')}</p>
            </div>
          </div>
        ) : (
          <img
            src={currentImage.url}
            alt={currentImage.filename || t('image_modal.image_title', { number: currentIndex + 1 })}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onError={() => setImageError(true)}
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-100 text-black rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">{t('image_modal.download_button')}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-100 text-black rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">{t('image_modal.share_button')}</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
