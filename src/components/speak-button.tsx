'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Volume2, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speakText, stopSpeech, isSpeaking, isPaused, pauseSpeech, resumeSpeech } from '@/lib/tts-utils';
import { useI18n } from '@/context/i18n-context';

interface SpeakButtonProps {
  text: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: ReactNode;
}

export function SpeakButton({ text, className, size = 'sm', variant = 'outline', children }: SpeakButtonProps) {
  const { locale } = useI18n();
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const [currentText, setCurrentText] = useState('');

  // Handle speech state changes
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        if (isSpeakingState && !isSpeaking()) {
          setIsSpeakingState(false);
          setIsPausedState(false);
          setCurrentText('');
        }
      } catch (error) {
        console.error('Error checking speech state:', error);
        // Reset state on error
        setIsSpeakingState(false);
        setIsPausedState(false);
        setCurrentText('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSpeakingState]);

  const handleSpeak = () => {
    try {
      if (isSpeakingState && currentText === text) {
        if (isPausedState) {
          resumeSpeech();
          setIsPausedState(false);
        } else {
          pauseSpeech();
          setIsPausedState(true);
        }
      } else if (isSpeakingState) {
        stopSpeech();
        setTimeout(() => {
          speakText(text, locale);
          setIsSpeakingState(true);
          setIsPausedState(false);
          setCurrentText(text);
        }, 100);
      } else {
        speakText(text, locale);
        setIsSpeakingState(true);
        setIsPausedState(false);
        setCurrentText(text);
      }
    } catch (error) {
      console.error('Error handling speech:', error);
      // Reset state on error
      setIsSpeakingState(false);
      setIsPausedState(false);
      setCurrentText('');
    }
  };

  const handleStop = () => {
    try {
      stopSpeech();
      setIsSpeakingState(false);
      setIsPausedState(false);
      setCurrentText('');
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  // If text is empty, don't show the button
  if (!text) return null;

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={isSpeakingState ? handleSpeak : handleStop}
    >
      {isSpeakingState ? (
        isPausedState ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <Pause className="h-4 w-4" />
        )
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
      {children && <span className="ml-2">{children}</span>}
      {!children && <span className="sr-only">Listen</span>}
    </Button>
  );
}