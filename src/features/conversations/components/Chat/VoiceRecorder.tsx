/**
 * Voice Recorder Component
 * ChatGPT-style voice recording with live waveform
 * X (cancel) | Waveform + Timer | ✓ (send)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MINIMAL_COLORS } from '../../constants/chatBubbleColors';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  className?: string;
}

export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  className
}: VoiceRecorderProps) {
  const [duration, setDuration] = useState(0);

  // Use ref for waveform to avoid state update delays
  const waveformRef = useRef<number[]>(Array(60).fill(3));
  const barsRef = useRef<HTMLDivElement>(null); // Direct DOM manipulation for performance

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isCancellingRef = useRef<boolean>(false); // Track if user is cancelling
  const frameCountRef = useRef<number>(0); // Debug: count frames
  const mediaStreamRef = useRef<MediaStream | null>(null); // Keep track of media stream for cleanup
  const isCleanedUpRef = useRef<boolean>(false); // Prevent double cleanup
  const mimeTypeRef = useRef<string>('audio/webm'); // Store recording MIME type

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Animate waveform using FREQUENCY DATA for better voice visualization
  const animateWaveform = useCallback(() => {
    if (!analyserRef.current || !barsRef.current) {
      return;
    }

    // Use FREQUENCY data (works better with microphone input)
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average amplitude across all frequencies
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Convert to percentage (0-255 -> 0-100) with amplification
    const volume = Math.min((average / 255) * 200, 100);
    const amplitude = Math.max(volume, 3); // Minimum 3% height

    frameCountRef.current++;

    // Update waveform array
    waveformRef.current.shift(); // Remove first element
    waveformRef.current.push(amplitude); // Add new amplitude at end

    // DIRECT DOM MANIPULATION - No React re-renders!
    // Update all bar heights directly for smooth 60 FPS animation
    const bars = barsRef.current.children;
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i] as HTMLElement;
      bar.style.height = `${waveformRef.current[i]}%`;
    }

    animationFrameRef.current = requestAnimationFrame(animateWaveform);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    // Reset cleanup flag for new recording
    isCleanedUpRef.current = false;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Store stream reference for cleanup
      mediaStreamRef.current = stream;

      // Setup Web Audio API for waveform visualization
      const audioContext = new AudioContext();

      // Resume audio context if suspended (Chrome security requirement)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      // Create a gain node set to 0 to mute the output (no feedback)
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0;

      // Configure analyser for voice visualization
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      // CRITICAL CONNECTION: source → analyser → gainNode (muted) → destination
      // Connecting to destination (even muted) keeps the audio graph processing
      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start waveform animation
      animateWaveform();

      // Setup MediaRecorder with Gemini-compatible format

      // Try formats in order of preference (all Gemini-compatible)
      let mimeType = 'audio/webm;codecs=opus'; // Fallback

      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'; // Best: Supported by Gemini + all browsers
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'; // Good: Supported by Gemini
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac'; // Good: Supported by Gemini
      }

      // Store MIME type for blob creation
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Only send recording if not cancelling
        if (!isCancellingRef.current) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeRef.current });
          onRecordingComplete(audioBlob);
        }

        cleanup();
        // Reset the cancelling flag after cleanup
        isCancellingRef.current = false;
      };

      // Start recording
      mediaRecorder.start();

      // Start timer using Date.now() for accuracy
      startTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 100); // Update every 100ms for smoother display, but only show full seconds

    } catch (error) {
      console.error('[VoiceRecorder] Failed to start recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
      onCancel();
    }
  }, [animateWaveform, onRecordingComplete, onCancel]);

  // Stop recording and send
  const handleSend = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Cleanup happens in onstop handler
    }
  };

  // Cancel recording
  const handleCancel = () => {
    isCancellingRef.current = true; // Mark as cancelling

    // Stop the media recorder - this will trigger onstop which handles cleanup
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // If recorder is already stopped, do cleanup manually
      cleanup();
    }

    // Notify parent component
    onCancel();
  };

  // Cleanup resources
  const cleanup = () => {
    // Prevent double cleanup (React Strict Mode issue)
    if (isCleanedUpRef.current) {
      return;
    }

    isCleanedUpRef.current = true; // Mark as cleaned up

    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop media recorder if still active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // ALWAYS stop all media stream tracks to remove the red recording indicator
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    // Clear media recorder reference
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }

    // Disconnect analyser
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setDuration(0);
    waveformRef.current = Array(60).fill(3);
    frameCountRef.current = 0;
    // DO NOT reset isCancellingRef here - it needs to stay true for the onstop handler
  };

  // Start recording on mount - ONLY ONCE
  useEffect(() => {
    let mounted = true;

    if (mounted) {
      startRecording();
    }

    return () => {
      mounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-3xl border',
        className
      )}
      style={{
        backgroundColor: MINIMAL_COLORS.grey900,
        borderColor: MINIMAL_COLORS.grey700,
      }}
    >
      {/* Cancel Button (X) */}
      <button
        onClick={handleCancel}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: MINIMAL_COLORS.grey700,
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#404040'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = MINIMAL_COLORS.grey700}
        aria-label="Cancel recording"
        title="Cancel recording"
      >
        <X className="w-5 h-5" style={{ color: MINIMAL_COLORS.white }} />
      </button>

      {/* Waveform Visualization - Amplitude bars */}
      <div ref={barsRef} className="flex-1 flex items-center gap-[2px] h-12">
        {Array.from({ length: 60 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 rounded-full"
            style={{
              height: '3%', // Initial height, updated via direct DOM manipulation
              minHeight: '4px',
              maxHeight: '100%',
              backgroundColor: MINIMAL_COLORS.white,
            }}
          />
        ))}
      </div>

      {/* Timer */}
      <div
        className="flex-shrink-0 text-sm font-medium min-w-[3ch] tabular-nums"
        style={{ color: MINIMAL_COLORS.white }}
      >
        {formatTime(duration)}
      </div>

      {/* Send Button (✓) */}
      <button
        onClick={handleSend}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{
          backgroundColor: MINIMAL_COLORS.white,
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = MINIMAL_COLORS.grey100}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = MINIMAL_COLORS.white}
        aria-label="Send recording"
        title="Send recording"
      >
        <Check className="w-5 h-5" style={{ color: MINIMAL_COLORS.grey900 }} />
      </button>
    </div>
  );
}
