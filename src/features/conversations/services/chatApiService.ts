/**
 * Chat API Service - Backend API Calls
 * For operations requiring business logic (AI generation, image upload)
 */

import api from '@/lib/api';
import type { ChatMessage, SendMessageWithAIRequest, MediaAttachment } from '../types';
import { MessageType } from '../types';
import { logger } from '@/lib/logger';

class ChatApiService {
  /**
   * Send message with AI response generation
   * Backend will save user message + generate AI response
   */
  async sendMessageWithAI(request: SendMessageWithAIRequest): Promise<ChatMessage> {
    try {
      const { data } = await api.post<ChatMessage>('/api/chat/generate-response', {
        conversationId: request.conversationId,
        message: request.message,
        agentId: request.agentId,
        messageType: request.messageType || MessageType.Text,
        attachments: request.attachments,
        source: request.source,
        platformConversationId: request.platformConversationId,
      });

      return data;
    } catch (error) {
      logger.error('Error sending message with AI', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send message without AI (admin/human mode)
   * Backend will save message only, no AI generation
   */
  async sendMessage(params: {
    conversationId: string;
    message: string;
    senderRole: number;
    senderId?: string;
    messageType?: number;
    attachments?: string;
  }): Promise<ChatMessage> {
    try {
      const { data } = await api.post<ChatMessage>('/api/chat/message', {
        conversationId: params.conversationId,
        message: params.message,
        senderRole: params.senderRole,
        senderId: params.senderId,
        messageType: params.messageType || MessageType.Text,
        attachments: params.attachments,
      });

      return data;
    } catch (error) {
      logger.error('Error sending message', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Upload single image to backend and return MediaAttachment
   */
  async uploadImage(params: {
    file: File;
    conversationId: string;
    messageId: string;
  }): Promise<MediaAttachment> {
    try {
      const formData = new FormData();
      formData.append('File', params.file); // Capital 'F' for backend
      formData.append('ConversationId', params.conversationId);
      formData.append('MessageId', params.messageId);

      const { data } = await api.post<{
        success: boolean;
        attachment: MediaAttachment;
      }>('/api/chat/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!data.success) {
        throw new Error('Image upload failed');
      }

      return data.attachment;
    } catch (error) {
      logger.error('Error uploading image', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Upload single image with progress tracking (ChatGPT-style)
   * For upload-on-select pattern
   */
  async uploadImageWithProgress(params: {
    file: File;
    conversationId: string;
    messageId: string;
    onProgress?: (progress: number) => void;
  }): Promise<MediaAttachment> {
    try {
      // Start with 1% to show upload has begun
      if (params.onProgress) {
        params.onProgress(1);
      }

      const formData = new FormData();
      formData.append('File', params.file);
      formData.append('ConversationId', params.conversationId);
      formData.append('MessageId', params.messageId);

      const { data } = await api.post<{
        success: boolean;
        attachment: MediaAttachment;
      }>('/api/chat/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && params.onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            params.onProgress(percentCompleted);
          }
        },
      });

      if (!data.success) {
        throw new Error('Image upload failed');
      }

      return data.attachment;
    } catch (error) {
      logger.error('Error uploading image with progress', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Upload single audio file to backend and return MediaAttachment
   */
  async uploadAudio(params: {
    file: File;
    conversationId: string;
    messageId: string;
    duration?: number; // Optional audio duration in seconds
  }): Promise<MediaAttachment> {
    try {
      const formData = new FormData();
      formData.append('File', params.file); // Capital 'F' for backend
      formData.append('ConversationId', params.conversationId);
      formData.append('MessageId', params.messageId);

      if (params.duration) {
        formData.append('Duration', params.duration.toString());
      }

      const { data } = await api.post<{
        success: boolean;
        attachment: MediaAttachment;
      }>('/api/chat/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!data.success) {
        throw new Error('Audio upload failed');
      }

      return data.attachment;
    } catch (error) {
      logger.error('Error uploading audio', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Upload single audio file with progress tracking
   * For upload-on-select pattern
   */
  async uploadAudioWithProgress(params: {
    file: File;
    conversationId: string;
    messageId: string;
    duration?: number;
    onProgress?: (progress: number) => void;
  }): Promise<MediaAttachment> {
    try {
      // Start with 1% to show upload has begun
      if (params.onProgress) {
        params.onProgress(1);
      }

      const formData = new FormData();
      formData.append('File', params.file);
      formData.append('ConversationId', params.conversationId);
      formData.append('MessageId', params.messageId);

      if (params.duration) {
        formData.append('Duration', params.duration.toString());
      }

      const { data } = await api.post<{
        success: boolean;
        attachment: MediaAttachment;
      }>('/api/chat/upload-audio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && params.onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            params.onProgress(percentCompleted);
          }
        },
      });

      if (!data.success) {
        throw new Error('Audio upload failed');
      }

      return data.attachment;
    } catch (error) {
      logger.error('Error uploading audio with progress', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Upload multiple audio files and images, return combined attachments JSON
   * Format: { "Images": [...], "Audio": [...] }
   */
  async uploadMultimediaAndBuildJSON(params: {
    imageFiles?: File[];
    audioFiles?: File[];
    conversationId: string;
    messageId: string;
  }): Promise<string> {
    try {
      const imageAttachments: MediaAttachment[] = [];
      const audioAttachments: MediaAttachment[] = [];

      // Upload images
      if (params.imageFiles && params.imageFiles.length > 0) {
        const imagePromises = params.imageFiles.map((file) =>
          this.uploadImage({
            file,
            conversationId: params.conversationId,
            messageId: params.messageId,
          })
        );
        imageAttachments.push(...(await Promise.all(imagePromises)));
      }

      // Upload audio
      if (params.audioFiles && params.audioFiles.length > 0) {
        const audioPromises = params.audioFiles.map((file) =>
          this.uploadAudio({
            file,
            conversationId: params.conversationId,
            messageId: params.messageId,
          })
        );
        audioAttachments.push(...(await Promise.all(audioPromises)));
      }

      // Build AttachmentsWrapper JSON
      const wrapper: { Images?: MediaAttachment[]; Audio?: MediaAttachment[] } = {};
      if (imageAttachments.length > 0) wrapper.Images = imageAttachments;
      if (audioAttachments.length > 0) wrapper.Audio = audioAttachments;

      const json = JSON.stringify(wrapper);
      return json;
    } catch (error) {
      logger.error('Error uploading multimedia', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Delete a conversation
   * Backend handles authorization (SuperAdmin or agent owner)
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await api.delete(`/api/conversations/${conversationId}`);
      logger.info('Conversation deleted successfully', { conversationId });
    } catch (error) {
      logger.error('Error deleting conversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();
