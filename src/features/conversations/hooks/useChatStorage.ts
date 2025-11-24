/**
 * Chat Storage Adapter Pattern
 * Provides storage-agnostic interface for ChatEngine
 * Supports multiple storage backends: React state, Zustand, LocalStorage, IndexedDB, etc.
 */

import { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import type { ChatMessage } from '../types/conversation.types';

/**
 * Storage adapter interface
 * All storage implementations must conform to this interface
 */
export interface ChatStorageAdapter {
  /** Get all messages */
  messages: ChatMessage[];

  /** Replace all messages */
  setMessages: (messages: ChatMessage[]) => void;

  /** Add single message */
  addMessage: (message: ChatMessage) => void;

  /** Update specific message by ID */
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  /** Remove message by ID */
  removeMessage: (id: string) => void;

  /** Clear all messages */
  clearMessages: () => void;
}

/**
 * Local React State Adapter
 * For ephemeral chat sessions (e.g., TestChat in Studio)
 * Messages cleared on component unmount
 */
export function useLocalChatStorage(): ChatStorageAdapter {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  return {
    messages,
    setMessages,

    addMessage: (message: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    },

    updateMessage: (id: string, updates: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === id ? { ...message, ...updates } : message
        )
      );
    },

    removeMessage: (id: string) => {
      setMessages((prev) => prev.filter((message) => message.id !== id));
    },

    clearMessages: () => {
      setMessages([]);
    },
  };
}

/**
 * Zustand Store Adapter
 * For persistent chat sessions (e.g., main Conversations feature)
 * Messages persist across navigation and component mounts
 */
export function useZustandChatStorage(): ChatStorageAdapter {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const removeMessage = useChatStore((state) => state.removeMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);

  return {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
  };
}
