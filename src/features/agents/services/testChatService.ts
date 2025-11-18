/**
 * Test Chat Service
 * API calls for testing agent responses
 * TODO: Implement actual backend endpoint integration
 */

import { apiClient } from '@/lib/apiClient';
import { logger } from '@/lib/logger';

export interface TestMessageRequest {
  agentId: string;
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface TestMessageResponse {
  message: string;
  timestamp: string;
}

class TestChatService {
  /**
   * Send a test message to the agent
   * @param request - Test message request
   * @returns Agent's response
   */
  async sendMessage(request: TestMessageRequest): Promise<TestMessageResponse> {
    try {
      // TODO: Replace with actual backend endpoint
      // const response = await apiClient.post<TestMessageResponse>(
      //   `/api/agents/${request.agentId}/test-message`,
      //   {
      //     message: request.message,
      //     conversationHistory: request.conversationHistory,
      //   }
      // );

      // Placeholder response for now
      logger.info('Test message sent', { agentId: request.agentId, message: request.message });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        message: `Test response: I received your message "${request.message}". The backend test endpoint will be implemented soon.`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to send test message', error);
      throw error;
    }
  }

  /**
   * Stream test message (for real-time streaming responses)
   * @param request - Test message request
   * @param onChunk - Callback for each chunk of the response
   */
  async streamMessage(
    request: TestMessageRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      // TODO: Implement streaming endpoint
      // This would use Server-Sent Events (SSE) or WebSocket
      logger.info('Stream message started', { agentId: request.agentId });

      // Placeholder: simulate streaming
      const fullResponse = `Streaming test response: I received "${request.message}". Streaming will be implemented with the backend.`;
      const words = fullResponse.split(' ');

      for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onChunk(word + ' ');
      }
    } catch (error) {
      logger.error('Failed to stream test message', error);
      throw error;
    }
  }
}

export const testChatService = new TestChatService();
