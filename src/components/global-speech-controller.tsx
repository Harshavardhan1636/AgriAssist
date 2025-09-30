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
      const speaking = isSpeaking();
      const paused = isPaused();
      
      setIsSpeakingState(speaking);
      setIsPausedState(paused);
      
      if (!speaking) {
        setCurrentText('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePauseResume = () => {
    if (isPausedState) {
      resumeSpeech();
    } else {
      pauseSpeech();
    }
  };

  const handleStop = () => {
    stopSpeech();
    setIsSpeakingState(false);
    setIsPausedState(false);
    setCurrentText('');
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