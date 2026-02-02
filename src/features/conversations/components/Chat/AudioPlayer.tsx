/**
 * Audio Player Component
 * Minimal design with waveform visualization
 * Matches ChatGPT/WhatsApp aesthetic
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { CHAT_BUBBLE_COLORS, MINIMAL_COLORS } from '../../constants/chatBubbleColors';

interface AudioPlayerProps {
  url: string;
  filename?: string;
  isAssistantMessage?: boolean; // Black bg for assistant, white for user
  className?: string;
}

export function AudioPlayer({
  url,
  filename,
  isAssistantMessage = false,
  className
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract waveform data from audio file
  const extractWaveform = async (audioUrl: string, signal?: AbortSignal) => {
    let audioContext: AudioContext | null = null;
    try {
      const response = await fetch(audioUrl, { signal });

      // Check if aborted after fetch
      if (signal?.aborted) return;

      const arrayBuffer = await response.arrayBuffer();

      // Check if aborted after arrayBuffer
      if (signal?.aborted) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }
      audioContext = new AudioContextClass();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Check if aborted after decode
      if (signal?.aborted) return;

      // Get the raw audio data (first channel)
      const rawData = audioBuffer.getChannelData(0);
      const samples = 40; // Number of bars to display
      const blockSize = Math.floor(rawData.length / samples);
      const waveform: number[] = [];

      // Calculate amplitude for each block
      for (let i = 0; i < samples; i++) {
        const start = blockSize * i;
        let sum = 0;

        // Calculate RMS (Root Mean Square) for this block
        for (let j = 0; j < blockSize; j++) {
          const val = rawData[start + j] || 0;
          sum += val * val;
        }

        const rms = Math.sqrt(sum / blockSize);
        // Normalize to 0-100 range with minimum height of 15%
        const normalized = Math.max(rms * 200, 15);
        waveform.push(Math.min(normalized, 100));
      }

      // Only update state if not aborted
      if (!signal?.aborted) {
        setWaveformData(waveform);
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (signal?.aborted) return;

      if (import.meta.env.DEV) {
        console.error('Error extracting waveform:', error);
      }
      // Fallback to static waveform
      if (!signal?.aborted) {
        setWaveformData(Array.from({ length: 40 }, (_, i) => Math.sin(i * 0.5) * 40 + 50));
      }
    } finally {
      // ALWAYS close audio context in finally block
      if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close();
      }
    }
  };

  // Handle audio metadata loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  // Handle audio time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current || hasError) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Audio playback error:', error);
      }
      setHasError(true);
    }
  };

  // Handle audio end
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  };

  // Handle audio error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || hasError) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  // Extract waveform on mount
  useEffect(() => {
    const controller = new AbortController();

    extractWaveform(url, controller.signal);

    return () => {
      controller.abort();
    };
  }, [url]);

  // Pause when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Color scheme based on message type
  const bubbleColors = isAssistantMessage ? CHAT_BUBBLE_COLORS.assistant : CHAT_BUBBLE_COLORS.user;
  const bgColor = bubbleColors.backgroundColor;
  const textColor = bubbleColors.color;
  const borderColor = bubbleColors.borderColor;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3',
        className
      )}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {/* Play Button + Waveform (centered) */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button - Centered with waveform */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading || hasError}
          className="flex-shrink-0 flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isPlaying ? t('audio_player.pause') : t('audio_player.play')}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: textColor }} />
          ) : hasError ? (
            <AlertCircle className="w-6 h-6" style={{ color: MINIMAL_COLORS.grey300 }} />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" style={{ color: MINIMAL_COLORS.black }} fill={MINIMAL_COLORS.black} />
          ) : (
            <Play className="w-6 h-6 ml-0.5" style={{ color: MINIMAL_COLORS.black }} fill={MINIMAL_COLORS.black} />
          )}
        </button>

        {/* Real waveform visualization */}
        <div
          className="flex-1 h-8 flex items-center gap-0.5 cursor-pointer"
          onClick={handleProgressClick}
        >
          {/* Real audio waveform bars */}
          {(waveformData.length > 0 ? waveformData : Array.from({ length: 40 }, () => 50)).map((height, i) => {
            const isActive = (i / 40) * 100 < progress;

            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all"
                style={{
                  height: `${height}%`,
                  backgroundColor: isActive
                    ? MINIMAL_COLORS.brandGreen
                    : isAssistantMessage
                    ? MINIMAL_COLORS.grey500
                    : MINIMAL_COLORS.borderLight,
                  opacity: isActive ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Single timer below - shows duration when stopped, current time when playing */}
      <div
        className="text-xs"
        style={{ color: textColor }}
      >
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </div>
    </div>
  );
}
