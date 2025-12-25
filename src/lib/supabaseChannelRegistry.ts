/**
 * Supabase Channel Registry
 *
 * Centralized registry for tracking active Supabase Realtime channels.
 * Ensures all channels are properly cleaned up during logout to prevent:
 * - Memory leaks
 * - Zombie WebSocket connections
 * - Battery drain on mobile devices
 * - Potential security issues from channels receiving data after logout
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { logger } from './logger';

class SupabaseChannelRegistry {
  private channels: Set<RealtimeChannel> = new Set();
  private channelMetadata: Map<RealtimeChannel, { name: string; createdAt: Date }> = new Map();

  /**
   * Register a channel to be tracked
   * @param channel - The Supabase Realtime channel to track
   * @param name - Optional descriptive name for debugging
   */
  register(channel: RealtimeChannel, name?: string): void {
    this.channels.add(channel);
    this.channelMetadata.set(channel, {
      name: name || channel.topic || 'unknown',
      createdAt: new Date(),
    });

    if (import.meta.env.DEV) {
      logger.debug(`📡 Supabase channel registered: ${name || channel.topic}`, {
        totalChannels: this.channels.size,
      });
    }
  }

  /**
   * Unregister a channel (called from useEffect cleanup)
   * @param channel - The channel to unregister
   */
  unregister(channel: RealtimeChannel): void {
    const metadata = this.channelMetadata.get(channel);
    this.channels.delete(channel);
    this.channelMetadata.delete(channel);

    if (import.meta.env.DEV) {
      logger.debug(`📡 Supabase channel unregistered: ${metadata?.name || 'unknown'}`, {
        totalChannels: this.channels.size,
      });
    }
  }

  /**
   * Remove a specific channel and unsubscribe
   * @param channel - The channel to remove
   */
  async remove(channel: RealtimeChannel): Promise<void> {
    const metadata = this.channelMetadata.get(channel);

    try {
      await supabase.removeChannel(channel);
      this.channels.delete(channel);
      this.channelMetadata.delete(channel);

      if (import.meta.env.DEV) {
        logger.debug(`📡 Supabase channel removed: ${metadata?.name || 'unknown'}`);
      }
    } catch (error) {
      logger.error(`Failed to remove Supabase channel: ${metadata?.name || 'unknown'}`, error);
    }
  }

  /**
   * Remove all tracked channels (called during logout)
   * This is synchronous and ensures all channels are closed before navigation
   */
  async removeAll(): Promise<void> {
    const channelCount = this.channels.size;

    if (channelCount === 0) {
      if (import.meta.env.DEV) {
        logger.debug('📡 No Supabase channels to remove');
      }
      return;
    }

    logger.info(`📡 Removing ${channelCount} Supabase channel(s)...`);

    const removalPromises: Promise<void>[] = [];

    // Remove all channels in parallel for speed
    for (const channel of this.channels) {
      const metadata = this.channelMetadata.get(channel);

      const promise = supabase.removeChannel(channel)
        .then(() => {
          if (import.meta.env.DEV) {
            logger.debug(`  ✓ Removed: ${metadata?.name || channel.topic}`);
          }
        })
        .catch((error) => {
          logger.error(`  ✗ Failed to remove: ${metadata?.name || channel.topic}`, error);
        });

      removalPromises.push(promise);
    }

    // Wait for all channels to be removed
    await Promise.allSettled(removalPromises);

    // Clear the registry
    this.channels.clear();
    this.channelMetadata.clear();

    logger.info(`✅ All Supabase channels removed`);
  }

  /**
   * Get current channel count (for debugging)
   */
  getChannelCount(): number {
    return this.channels.size;
  }

  /**
   * Get all channel names (for debugging)
   */
  getChannelNames(): string[] {
    return Array.from(this.channelMetadata.values()).map(m => m.name);
  }

  /**
   * Log current channels (for debugging)
   */
  logChannels(): void {
    if (this.channels.size === 0) {
      logger.debug('📡 No active Supabase channels');
      return;
    }

    logger.debug(`📡 Active Supabase channels (${this.channels.size}):`);
    for (const [channel, metadata] of this.channelMetadata) {
      const age = Date.now() - metadata.createdAt.getTime();
      logger.debug(`  - ${metadata.name} (age: ${Math.round(age / 1000)}s)`);
    }
  }
}

// Export singleton instance
export const channelRegistry = new SupabaseChannelRegistry();
