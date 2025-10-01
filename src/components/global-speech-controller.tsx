'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Square, Pause, Play } from 'lucide-react';
import { isSpeaking, isPaused, pauseSpeech, resumeSpeech, stopSpeech } from '@/lib/tts-utils';

export function GlobalSpeechController() {
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const [currentText, setCurrentText] = useState('');

  // Update speaking state
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const speaking = isSpeaking();
        const paused = isPaused();
        
        setIsSpeakingState(speaking);
        setIsPausedState(paused);
        
        if (!speaking) {
          setCurrentText('');
        }
      } catch (error) {
        console.error('Error updating speech state:', error);
        // Reset state on error
        setIsSpeakingState(false);
        setIsPausedState(false);
        setCurrentText('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePauseResume = () => {
    try {
      if (isPausedState) {
        resumeSpeech();
      } else {
        pauseSpeech();
      }
    } catch (error) {
      console.error('Error pausing/resuming speech:', error);
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

  if (!isSpeakingState) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg flex items-center gap-2 z-50">
      <Button 
        size="sm" 
        variant="ghost" 
        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"
        onClick={handlePauseResume}
      >
        {isPausedState ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>
      <span className="text-sm max-w-xs truncate">
        {currentText.substring(0, 30)}...
      </span>
      <Button 
        size="sm" 
        variant="ghost" 
        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary/80"
        onClick={handleStop}
      >
        <Square className="h-4 w-4" />
      </Button>
    </div>
  );
}