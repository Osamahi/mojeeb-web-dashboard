/**
 * Message Composer Component
 * ChatGPT-inspired two-line minimal design
 * Line 1: Clean input field
 * Line 2: Attachment, Emoji, Mode Toggle ... Send
 */

import { useState, KeyboardEvent, useRef, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp, Loader2, Smile, Paperclip, Bot, User, X, AlertCircle, Mic, Music } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { chatToasts } from '../../utils/chatToasts';
import { chatApiService } from '../../services/chatApiService';
import type { MediaAttachment } from '../../types';
import { VoiceRecorder } from './VoiceRecorder';

// Constants
const MAX_TEXTAREA_HEIGHT_PX = 120;
const EMOJI_PICKER_WIDTH = 350;
const EMOJI_PICKER_HEIGHT = 400;
const MAX_MESSAGE_LENGTH = 5000; // Backend limit
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_AUDIO_SIZE_MB = 5; // Backend audio limit
const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 10;
const MAX_AUDIO = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm', 'audio/wav', 'audio/aac', 'audio/flac'];
const THUMBNAIL_SIZE_PX = 80;

/**
 * Sanitizes message input by removing potentially dangerous characters
 * and normalizing whitespace
 */
const sanitizeMessage = (msg: string): string => {
  // Trim and normalize whitespace (multiple spaces, tabs, etc.)
  let sanitized = msg.trim().replace(/\s+/g, ' ');

  // Remove zero-width characters that could be used maliciously
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
};

interface MessageComposerProps {
  onSendMessage: (message: string, attachments?: string) => Promise<void>;
  isSending: boolean;
  isAIMode?: boolean;
  onModeToggle?: () => void;
  placeholder?: string;
  conversationId: string;
  agentId?: string;
}

/**
 * Upload state for individual images (ChatGPT-style upload-on-select)
 */
interface UploadedImage {
  id: string;                    // Unique identifier for tracking
  file: File;                    // Original file
  previewUrl: string;            // Local preview URL (createObjectURL)
  attachment?: MediaAttachment;  // Backend response (URL, Type, Filename)
  progress: number;              // Upload progress (0-100)
  error?: string;                // Error message if upload failed
  isUploading: boolean;          // Whether currently uploading
}

/**
 * Upload state for individual audio files (ChatGPT-style upload-on-select)
 */
interface UploadedAudio {
  id: string;                    // Unique identifier for tracking
  file: File;                    // Original file
  attachment?: MediaAttachment;  // Backend response (URL, Type, Filename)
  progress: number;              // Upload progress (0-100)
  error?: string;                // Error message if upload failed
  isUploading: boolean;          // Whether currently uploading
}

export default memo(function MessageComposer({
  onSendMessage,
  isSending,
  isAIMode = true,
  onModeToggle,
  placeholder = 'Type your message...',
  conversationId,
  agentId,
}: MessageComposerProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLocalSending, setIsLocalSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // ChatGPT-style upload-on-select: Track uploaded images with progress
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // ChatGPT-style upload-on-select: Track uploaded audio with progress
  const [uploadedAudio, setUploadedAudio] = useState<UploadedAudio[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea (optimized with useCallback)
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Force reflow before reading scrollHeight (iOS Safari fix)
    textarea.style.height = 'auto';
    void textarea.offsetHeight; // Force reflow

    const newHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX);
    textarea.style.height = `${newHeight}px`;

    // iOS Safari needs explicit overflow handling
    textarea.style.overflowY = newHeight >= MAX_TEXTAREA_HEIGHT_PX ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [uploadedImages]);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Mobile keyboard viewport handling using Visual Viewport API
  // More reliable than setTimeout - responds to actual keyboard appearance
  useEffect(() => {
    // Only apply on mobile devices
    if (!window.visualViewport || window.innerWidth >= 768) return;

    const handleViewportResize = () => {
      // Calculate keyboard height by comparing window height to visual viewport
      const keyboardHeight = window.innerHeight - (window.visualViewport?.height || window.innerHeight);

      // Keyboard is likely open if viewport shrunk by >100px
      if (keyboardHeight > 100) {
        // Use requestAnimationFrame for smooth, jank-free scrolling
        // Better than setTimeout as it syncs with browser paint cycle
        requestAnimationFrame(() => {
          textareaRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end', // Position at bottom (above keyboard), not center
            inline: 'nearest'
          });
        });
      }
    };

    // Listen to Visual Viewport resize events (keyboard open/close)
    window.visualViewport.addEventListener('resize', handleViewportResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = async () => {
    // Sanitize and validate message
    const sanitizedMessage = sanitizeMessage(message);

    // Check if already sending
    if (isSending || isLocalSending) return;

    // Check if any images are still uploading
    const hasUploadingImages = uploadedImages.some(img => img.isUploading);
    if (hasUploadingImages) {
      toast.error(t('conversations.wait_images_uploading'));
      return;
    }

    // Check if any audio is still uploading
    const hasUploadingAudio = uploadedAudio.some(aud => aud.isUploading);
    if (hasUploadingAudio) {
      toast.error(t('conversations.wait_audio_uploading'));
      return;
    }

    // Check if any images failed to upload
    const hasFailedImages = uploadedImages.some(img => img.error);
    if (hasFailedImages) {
      toast.error(t('conversations.images_upload_failed'));
      return;
    }

    // Check if any audio failed to upload
    const hasFailedAudio = uploadedAudio.some(aud => aud.error);
    if (hasFailedAudio) {
      toast.error(t('conversations.audio_upload_failed'));
      return;
    }

    // Allow empty message if there are attachments (WhatsApp-style voice messages)
    const hasAttachments = uploadedImages.length > 0 || uploadedAudio.length > 0;
    if (!sanitizedMessage && !hasAttachments) {
      // Empty message with no attachments - do nothing
      return;
    }

    // Check length limit (only if there's a message)
    if (sanitizedMessage && sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      chatToasts.messageTooLong(MAX_MESSAGE_LENGTH);
      return;
    }

    try {
      let attachmentsJson: string | undefined = undefined;

      // Build attachments JSON with both images and audio
      const successfulImageUploads = uploadedImages
        .filter(img => img.attachment && !img.error)
        .map(img => img.attachment!);

      const successfulAudioUploads = uploadedAudio
        .filter(aud => aud.attachment && !aud.error)
        .map(aud => aud.attachment!);

      if (successfulImageUploads.length > 0 || successfulAudioUploads.length > 0) {
        const wrapper: { images?: MediaAttachment[]; audio?: MediaAttachment[] } = {};
        if (successfulImageUploads.length > 0) wrapper.images = successfulImageUploads;
        if (successfulAudioUploads.length > 0) wrapper.audio = successfulAudioUploads;

        attachmentsJson = JSON.stringify(wrapper);
        logger.info('Using pre-uploaded attachments', {
          images: successfulImageUploads.length,
          audio: successfulAudioUploads.length
        });
      }

      // Clear composer state immediately (optimistic update)
      setMessage('');
      setUploadedImages([]);
      setUploadedAudio([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Send the message with attachments (non-blocking for UI)
      setIsLocalSending(true);
      onSendMessage(sanitizedMessage, attachmentsJson).finally(() => {
        setIsLocalSending(false);
      });
    } catch (error) {
      logger.error('Failed to send message', error, {
        messageLength: sanitizedMessage.length,
        component: 'MessageComposer',
        isAIMode,
      });
      chatToasts.sendError();
      // Don't clear message on error - let user retry
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    let pastedText = e.clipboardData.getData('text/plain');

    // Sanitize pasted text
    pastedText = sanitizeMessage(pastedText);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBefore = message.substring(0, cursorPosition);
    const textAfter = message.substring(textarea.selectionEnd);

    const newMessage = textBefore + pastedText + textAfter;

    // Check if exceeds limit
    if (newMessage.length > MAX_MESSAGE_LENGTH) {
      chatToasts.pasteTruncated(MAX_MESSAGE_LENGTH);
      const truncated = newMessage.substring(0, MAX_MESSAGE_LENGTH);
      setMessage(truncated);
    } else {
      setMessage(newMessage);
    }

    // Restore cursor position
    setTimeout(() => {
      const newPosition = Math.min(
        cursorPosition + pastedText.length,
        MAX_MESSAGE_LENGTH
      );
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  /**
   * ChatGPT-style upload-on-select:
   * Upload images immediately when user selects them (background upload)
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (uploadedImages.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPEG and PNG are supported.`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File too large: ${file.name}. Maximum ${MAX_FILE_SIZE_MB}MB allowed.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Generate a temporary message ID for all uploads in this batch
    const tempMessageId = crypto.randomUUID();

    // Create initial upload entries with preview URLs and unique IDs
    const newUploads: UploadedImage[] = validFiles.map(file => ({
      id: crypto.randomUUID(), // Unique ID for tracking
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      isUploading: true,
    }));

    // Add to state immediately (show preview with progress)
    setUploadedImages(prev => [...prev, ...newUploads]);

    logger.info(`Starting upload-on-select for ${validFiles.length} image(s)`);

    // Upload each file in background (using index to match with newUploads)
    newUploads.forEach(async (uploadedImage) => {
      try {
        logger.info(`Starting upload for ${uploadedImage.file.name}`, { id: uploadedImage.id });

        // Simulated smooth progress animation (ChatGPT-style)
        // Fast animation provides visual feedback even for instant uploads
        let simulatedProgress = 0;
        let realProgressReceived = false;
        const progressInterval = setInterval(() => {
          if (!realProgressReceived && simulatedProgress < 95) {
            // Exponential slowdown: fast at start, slower near end
            const increment = (95 - simulatedProgress) * 0.1; // 10% of remaining
            simulatedProgress = Math.min(simulatedProgress + increment, 95);

            setUploadedImages(prev =>
              prev.map(img =>
                img.id === uploadedImage.id ? { ...img, progress: Math.round(simulatedProgress) } : img
              )
            );
          }
        }, 50); // Update every 50ms (smooth 20fps animation)

        const attachment = await chatApiService.uploadImageWithProgress({
          file: uploadedImage.file,
          conversationId,
          messageId: tempMessageId,
          onProgress: (progress) => {
            // Real progress from server - use it immediately
            realProgressReceived = true;
            clearInterval(progressInterval); // Stop simulated progress

            logger.info(`Progress update: ${progress}%`, { id: uploadedImage.id, fileName: uploadedImage.file.name });
            setUploadedImages(prev =>
              prev.map(img =>
                img.id === uploadedImage.id ? { ...img, progress } : img
              )
            );
          },
        });

        // Clear interval in case upload completed without progress events
        clearInterval(progressInterval);

        // Upload successful - update with attachment data
        logger.info(`Upload complete: ${uploadedImage.file.name}`, { id: uploadedImage.id });
        setUploadedImages(prev =>
          prev.map(img =>
            img.id === uploadedImage.id
              ? { ...img, attachment, progress: 100, isUploading: false }
              : img
          )
        );
      } catch (error) {
        // Upload failed - mark with error
        logger.error(`Upload failed: ${uploadedImage.file.name}`, error, { id: uploadedImage.id });
        setUploadedImages(prev =>
          prev.map(img =>
            img.id === uploadedImage.id
              ? { ...img, error: 'Upload failed', isUploading: false, progress: 0 }
              : img
          )
        );

        toast.error(`Failed to upload ${uploadedImage.file.name}`);
      }
    });

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = uploadedImages[index];
    if (imageToRemove) {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    logger.info('Removed image', { index });
  };

  /**
   * ChatGPT-style audio upload-on-select
   */
  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (uploadedAudio.length + files.length > MAX_AUDIO) {
      toast.error(`Maximum ${MAX_AUDIO} audio files allowed`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only MP3, M4A, OGG, WebM, WAV, AAC, FLAC are supported.`);
        continue;
      }

      // Check file size (5MB for audio)
      if (file.size > MAX_AUDIO_SIZE_BYTES) {
        toast.error(`File too large: ${file.name}. Maximum ${MAX_AUDIO_SIZE_MB}MB allowed.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      // Reset file input
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
      return;
    }

    // Generate a temporary message ID for all uploads in this batch
    const tempMessageId = crypto.randomUUID();

    // Create initial upload entries
    const newUploads: UploadedAudio[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      isUploading: true,
    }));

    // Add to state immediately (show preview with progress)
    setUploadedAudio(prev => [...prev, ...newUploads]);

    logger.info(`Starting upload-on-select for ${validFiles.length} audio file(s)`);

    // Upload each file in background
    newUploads.forEach(async (uploadedAudioFile) => {
      try {
        logger.info(`Starting audio upload for ${uploadedAudioFile.file.name}`, { id: uploadedAudioFile.id });

        const attachment = await chatApiService.uploadAudioWithProgress({
          file: uploadedAudioFile.file,
          conversationId,
          messageId: tempMessageId,
          onProgress: (progress) => {
            logger.info(`Audio progress update: ${progress}%`, {
              id: uploadedAudioFile.id,
              fileName: uploadedAudioFile.file.name
            });
            setUploadedAudio(prev =>
              prev.map(aud =>
                aud.id === uploadedAudioFile.id ? { ...aud, progress } : aud
              )
            );
          },
        });

        // Upload successful
        logger.info(`Audio upload complete: ${uploadedAudioFile.file.name}`, { id: uploadedAudioFile.id });
        setUploadedAudio(prev =>
          prev.map(aud =>
            aud.id === uploadedAudioFile.id
              ? { ...aud, attachment, progress: 100, isUploading: false }
              : aud
          )
        );
      } catch (error) {
        // Upload failed
        logger.error(`Audio upload failed: ${uploadedAudioFile.file.name}`, error, { id: uploadedAudioFile.id });
        setUploadedAudio(prev =>
          prev.map(aud =>
            aud.id === uploadedAudioFile.id
              ? { ...aud, error: 'Upload failed', isUploading: false, progress: 0 }
              : aud
          )
        );

        toast.error(`Failed to upload ${uploadedAudioFile.file.name}`);
      }
    });

    // Reset file input
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const handleRemoveAudio = (index: number) => {
    setUploadedAudio(prev => prev.filter((_, i) => i !== index));
    logger.info('Removed audio', { index });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleAudioButtonClick = () => {
    // Start voice recording instead of file upload
    setIsRecording(true);
  };

  /**
   * Handle recording completion - convert blob to file, upload, and AUTO-SEND
   */
  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsRecording(false);

    // Convert blob to File - use the blob's actual MIME type (Gemini-compatible)
    const mimeType = audioBlob.type; // Get actual MIME type from VoiceRecorder
    const extension = mimeType.split('/')[1] || 'mp4'; // Extract extension (mp4, ogg, aac, etc.)
    const fileName = `voice-${Date.now()}.${extension}`;
    const audioFile = new File([audioBlob], fileName, { type: mimeType });

    // Generate temporary message ID
    const tempMessageId = crypto.randomUUID();

    logger.info('Starting voice recording upload', { fileName, size: audioFile.size });

    // Upload the audio file
    try {
      const attachment = await chatApiService.uploadAudioWithProgress({
        file: audioFile,
        conversationId,
        messageId: tempMessageId,
        onProgress: (progress) => {
          logger.info(`Voice upload progress: ${progress}%`);
        },
      });

      // Upload successful - AUTO-SEND the voice message immediately
      logger.info('Voice recording upload complete - auto-sending message', { fileName });

      // Build attachments JSON with the voice recording
      const attachmentsJson = JSON.stringify({
        audio: [attachment]
      });

      // Send empty message with voice attachment (WhatsApp-style)
      await onSendMessage('', attachmentsJson);

      logger.info('Voice message sent successfully');
      toast.success(t('conversations.voice_message_sent'));

    } catch (error) {
      // Upload failed
      logger.error('Voice recording upload failed', error, { fileName });
      toast.error(t('conversations.voice_send_failed'));
    }
  };

  /**
   * Handle recording cancellation
   */
  const handleRecordingCancel = () => {
    setIsRecording(false);
  };

  // Show voice recorder when recording
  if (isRecording) {
    return (
      <VoiceRecorder
        onRecordingComplete={handleRecordingComplete}
        onCancel={handleRecordingCancel}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-white',
        'border border-neutral-300',
        'rounded-3xl',
        'p-4',
        'hover:border-neutral-400',
        'focus-within:border-neutral-500',
        'focus-within:shadow-sm',
        'transition-all duration-200',
        'relative'
      )}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        aria-label={t('message_composer.upload_images_aria')}
      />

      {/* Hidden Audio Input */}
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleAudioSelect}
        className="hidden"
        aria-label={t('message_composer.upload_audio_aria')}
      />

      {/* Image Previews - ChatGPT Style with Upload Progress */}
      {uploadedImages.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {uploadedImages.map((uploadedImage, index) => (
            <div
              key={`${uploadedImage.file.name}-${index}`}
              className="relative flex-shrink-0 group"
              style={{ width: `${THUMBNAIL_SIZE_PX}px`, height: `${THUMBNAIL_SIZE_PX}px` }}
            >
              {/* Image Thumbnail */}
              <img
                src={uploadedImage.previewUrl}
                alt={`Selected image ${index + 1}`}
                className={cn(
                  "w-full h-full object-cover rounded-lg border",
                  uploadedImage.error ? "border-red-300" : "border-neutral-200",
                  uploadedImage.isUploading && "opacity-70"
                )}
              />

              {/* Uploading Overlay with Progress */}
              {uploadedImage.isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/50 rounded-lg">
                  <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                  <span className="text-white text-xs font-medium">
                    {uploadedImage.progress}%
                  </span>
                </div>
              )}

              {/* Error Overlay */}
              {uploadedImage.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveImage(index)}
                disabled={uploadedImage.isUploading}
                className={cn(
                  'absolute top-1 right-1',
                  'w-5 h-5',
                  'bg-neutral-800/70',
                  'text-white',
                  'rounded-full',
                  'flex items-center justify-center',
                  'hover:bg-neutral-950/90',
                  'transition-colors',
                  uploadedImage.isUploading && 'opacity-50 cursor-not-allowed'
                )}
                aria-label={`Remove image ${index + 1}`}
                title={uploadedImage.error ? t('conversations.remove_failed_image') : t('conversations.remove_image')}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audio Previews - Show uploaded audio files with progress */}
      {uploadedAudio.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {uploadedAudio.map((uploadedAudioFile, index) => (
            <div
              key={uploadedAudioFile.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border",
                uploadedAudioFile.error ? "border-red-300 bg-red-50" : "border-neutral-200 bg-neutral-50"
              )}
            >
              {/* Audio Icon */}
              <Music className="w-5 h-5 text-neutral-500 flex-shrink-0" />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-900 truncate">
                  {uploadedAudioFile.file.name}
                </div>
                <div className="text-xs text-neutral-500">
                  {(uploadedAudioFile.file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>

              {/* Upload Progress */}
              {uploadedAudioFile.isUploading && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                  <span className="text-xs font-medium text-neutral-600 min-w-[3ch]">
                    {uploadedAudioFile.progress}%
                  </span>
                </div>
              )}

              {/* Error Indicator */}
              {uploadedAudioFile.error && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs text-red-600">{t('conversations.upload_failed')}</span>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveAudio(index)}
                disabled={uploadedAudioFile.isUploading}
                className={cn(
                  "p-1.5 rounded-md",
                  "text-neutral-500 hover:text-neutral-700",
                  "hover:bg-neutral-200",
                  "transition-colors",
                  uploadedAudioFile.isUploading && "opacity-50 cursor-not-allowed"
                )}
                aria-label={`Remove audio ${index + 1}`}
                title={uploadedAudioFile.error ? t('conversations.remove_failed_audio') : t('conversations.remove_audio')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Line 1: Input Field */}
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={
          uploadedImages.some(img => img.isUploading)
            ? `Uploading ${uploadedImages.filter(img => img.isUploading).length} image(s)...`
            : placeholder
        }
        disabled={isSending || isLocalSending}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={1}
        inputMode="text"
        enterKeyHint="send"
        className={cn(
          'w-full',
          'bg-transparent',
          'border-0',
          'outline-none',
          'resize-none',
          'text-sm',
          'text-neutral-950',
          'placeholder:text-neutral-400',
          'mb-2',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        style={{
          minHeight: '32px',
          maxHeight: `${MAX_TEXTAREA_HEIGHT_PX}px`,
          fontSize: '16px', // Prevent iOS zoom on focus
        }}
        aria-label={t('message_composer.input_aria_label')}
        aria-multiline="true"
        aria-describedby="char-count"
      />

      {/* Character count (show when approaching limit) */}
      {message.length > MAX_MESSAGE_LENGTH * 0.8 && (
        <div
          id="char-count"
          className="text-xs text-neutral-500 mb-2 text-right"
          aria-live="polite"
        >
          {message.length} / {MAX_MESSAGE_LENGTH}
        </div>
      )}

      {/* Line 2: Actions Bar */}
      <div className="flex items-center justify-between">
        {/* Left: Action Icons */}
        <div className="flex items-center gap-2 relative">
          {/* Attachment Button */}
          <button
            onClick={handleAttachmentClick}
            className={cn(
              'p-2 rounded-lg',
              'text-neutral-500',
              'hover:bg-neutral-100',
              'hover:text-neutral-700',
              'transition-all duration-150',
              (isSending || isLocalSending) && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={t('message_composer.attach_images_aria')}
            title={t('message_composer.attach_images_title')}
            disabled={isSending || isLocalSending}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn(
                'p-2 rounded-lg',
                'text-neutral-500',
                'hover:bg-neutral-100',
                'hover:text-neutral-700',
                'transition-all duration-150',
                showEmojiPicker && 'bg-neutral-100 text-neutral-700'
              )}
              aria-label={t('conversations.add_emoji')}
              title={t('conversations.add_emoji')}
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-2 z-50"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.15))',
                }}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={EMOJI_PICKER_WIDTH}
                  height={EMOJI_PICKER_HEIGHT}
                  searchPlaceHolder={t('conversations.search_emoji')}
                />
              </div>
            )}
          </div>

          {/* AI/Human Mode Toggle Switch */}
          {onModeToggle && (
            <div className="flex items-center gap-2">
              {/* Label */}
              <div className="flex items-center gap-1.5">
                {isAIMode ? (
                  <>
                    <Bot className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs font-medium text-neutral-700">AI</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-brand-cyan" />
                    <span className="text-xs font-medium text-brand-cyan">Human</span>
                  </>
                )}
              </div>

              {/* Toggle Switch */}
              <button
                onClick={onModeToggle}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2',
                  isAIMode ? 'bg-neutral-300' : 'bg-brand-cyan'
                )}
                role="switch"
                aria-checked={!isAIMode}
                aria-label={`Toggle mode. Currently ${isAIMode ? 'AI' : 'Human'} mode`}
                title={`Click to switch to ${isAIMode ? 'Human' : 'AI'} mode`}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
                    isAIMode ? 'translate-x-1' : 'translate-x-6'
                  )}
                />
              </button>
            </div>
          )}
        </div>

        {/* Right: Send/Microphone Button - WhatsApp-style toggle */}
        <button
          onClick={message.trim() ? handleSend : handleAudioButtonClick}
          disabled={message.trim() ? (!message.trim() || isSending || isLocalSending) : false}
          className={cn(
            'rounded-full w-10 h-10',
            'flex items-center justify-center',
            'flex-shrink-0',
            'transition-all duration-200',
            message.trim() && !isSending && !isLocalSending
              ? 'bg-neutral-950 text-white hover:bg-neutral-800 hover:scale-105'
              : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
          )}
          title={
            message.trim()
              ? isSending || isLocalSending
                ? t('message_composer.sending')
                : uploadedImages.some(img => img.isUploading) || uploadedAudio.some(aud => aud.isUploading)
                ? t('message_composer.wait_for_uploads')
                : t('message_composer.send_message_hint')
              : t('message_composer.attach_audio_hint')
          }
          aria-label={message.trim() ? t('message_composer.send_message_aria') : t('message_composer.attach_audio_aria')}
        >
          {message.trim() ? (
            isSending || isLocalSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowUp className="w-5 h-5" />
            )
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
});
