/**
 * Chat API Service - Backend API Calls
 * For operations requiring business logic (AI generation, image upload)
 */

import api from '@/lib/api';
import type { ChatMessage, SendMessageWithAIRequest } from '../types';
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
        messageType: request.messageType || 1,
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
        messageType: params.messageType || 1,
        attachments: params.attachments,
      });

      return data;
    } catch (error) {
      logger.error('Error sending message', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Upload media (images/files)
   */
  async uploadMedia(params: {
    file: File;
    conversationId: string;
    messageId: string;
  }): Promise<{ url: string; type: string; filename: string }> {
    try {
      const formData = new FormData();
      formData.append('File', params.file); // Capital 'F' for backend
      formData.append('ConversationId', params.conversationId);
      formData.append('MessageId', params.messageId);

      const { data } = await api.post<{
        success: boolean;
        attachment: { url: string; type: string; filename: string };
      }>('/api/chat/upload-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!data.success) {
        throw new Error('Upload failed');
      }

      return data.attachment;
    } catch (error) {
      logger.error('Error uploading media', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Upload multiple images and return attachments JSON
   */
  async uploadImages(params: {
    files: File[];
    conversationId: string;
    messageId: string;
  }): Promise<string> {
    try {
      const uploadPromises = params.files.map((file) =>
        this.uploadMedia({
          file,
          conversationId: params.conversationId,
          messageId: params.messageId,
        })
      );

      const attachments = await Promise.all(uploadPromises);

      return JSON.stringify({ images: attachments });
    } catch (error) {
      logger.error('Error uploading images', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

export const chatApiService = new ChatApiService();
