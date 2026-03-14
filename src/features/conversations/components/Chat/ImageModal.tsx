/**
 * Image Modal Component
 * Full-size media viewer with subtle corner close button.
 * Supports carousel navigation for multiple images/videos.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { MessageAttachment } from '../../types';
import { isVideoAttachment } from '../../types';

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

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // Carousel navigation handlers
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

  const modal = (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
          className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Close button — subtle top-right corner */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/80 hover:bg-neutral-100 transition-colors shadow-sm border border-neutral-200/50"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4 text-neutral-600" />
          </button>

          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-neutral-900/60 text-white text-xs font-medium rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Previous button */}
          {hasMultipleImages && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/80 hover:bg-neutral-100 transition-colors shadow-sm border border-neutral-200/50"
              title={t('image_modal.previous')}
            >
              <ChevronLeft className="w-5 h-5 text-neutral-700" />
            </button>
          )}

          {/* Next button */}
          {hasMultipleImages && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white/80 hover:bg-neutral-100 transition-colors shadow-sm border border-neutral-200/50"
              title={t('image_modal.next')}
            >
              <ChevronRight className="w-5 h-5 text-neutral-700" />
            </button>
          )}

          {/* Media — square container for images, natural aspect for video */}
          {imageError ? (
            <div className="aspect-square flex items-center justify-center bg-neutral-50 w-full">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600">{t('image_modal.load_error')}</p>
              </div>
            </div>
          ) : isVideoAttachment(currentImage) ? (
            <video
              src={currentImage.url}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[90vh] object-contain bg-neutral-50"
              onClick={(e) => e.stopPropagation()}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="aspect-square w-full max-h-[85vh] bg-neutral-50 flex items-center justify-center p-4">
              <img
                src={currentImage.url}
                alt={currentImage.filename || t('image_modal.image_title', { number: currentIndex + 1 })}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={() => setImageError(true)}
              />
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
