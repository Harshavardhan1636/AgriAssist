/**
 * Text-to-Speech Utility for AgriAssist
 * Supports multiple languages for accessibility
 */

// Language mapping for speech synthesis
const LANGUAGE_MAP: Record<string, string> = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'te': 'te-IN',
  'ta': 'ta-IN',
  'ml': 'ml-IN'
};

// Check if speech synthesis is supported
export const isSpeechSynthesisSupported = (): boolean => {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  } catch (error) {
    console.error('Error checking speech synthesis support:', error);
    return false;
  }
};

// Get available voices for a specific language
export const getVoicesForLanguage = (languageCode: string): SpeechSynthesisVoice[] => {
  if (!isSpeechSynthesisSupported()) return [];
  
  try {
    // Ensure voices are loaded
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // If voices aren't loaded yet, return empty array
      return [];
    }
    
    const langCode = LANGUAGE_MAP[languageCode] || languageCode;
    return voices.filter(voice => {
      try {
        return voice.lang.startsWith(langCode);
      } catch (error) {
        console.error('Error filtering voice by language:', error);
        return false;
      }
    });
  } catch (error) {
    console.error('Error getting voices for language:', error);
    return [];
  }
};

// Speak text with language-specific voice
export const speakText = (text: string, languageCode: string = 'en'): void => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  try {
    // Validate input
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text provided for speech synthesis');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language
    const langCode = LANGUAGE_MAP[languageCode] || 'en-US';
    utterance.lang = langCode;
    
    // Try to find a suitable voice
    const voices = getVoicesForLanguage(languageCode);
    if (voices.length > 0) {
      // Prefer female voices if available
      const femaleVoice = voices.find(voice => {
        try {
          const lowerName = voice.name.toLowerCase();
          return lowerName.includes('female') || 
                 lowerName.includes('woman') ||
                 lowerName.includes('girl') ||
                 lowerName.includes('lady');
        } catch (error) {
          console.error('Error checking voice name:', error);
          return false;
        }
      });
      utterance.voice = femaleVoice || voices[0];
    }
    
    // Set speech parameters
    utterance.rate = 0.9; // Slightly slower for better understanding
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Event handlers with better error handling
    utterance.onstart = () => {
      console.log('Speech started for language:', languageCode);
    };
    
    utterance.onend = () => {
      console.log('Speech ended successfully');
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event);
      // Try again with default voice if there was an error
      if (utterance.voice) {
        console.log('Retrying with default voice for language:', langCode);
        try {
          window.speechSynthesis.cancel();
          const retryUtterance = new SpeechSynthesisUtterance(text);
          retryUtterance.lang = langCode;
          retryUtterance.rate = 0.9;
          retryUtterance.pitch = 1.0;
          retryUtterance.volume = 1.0;
          retryUtterance.onend = () => console.log('Retry speech ended successfully');
          retryUtterance.onerror = (retryEvent) => {
            console.error('Retry speech error:', retryEvent);
            // Final fallback - try without specifying voice
            try {
              window.speechSynthesis.cancel();
              const finalUtterance = new SpeechSynthesisUtterance(text);
              finalUtterance.lang = langCode;
              finalUtterance.rate = 0.9;
              finalUtterance.onend = () => console.log('Final fallback speech ended');
              finalUtterance.onerror = (finalEvent) => {
                console.error('Final fallback speech error:', finalEvent);
                // Ultimate fallback - try with no language specification
                try {
                  window.speechSynthesis.cancel();
                  const ultimateUtterance = new SpeechSynthesisUtterance(text);
                  ultimateUtterance.rate = 0.9;
                  ultimateUtterance.onend = () => console.log('Ultimate fallback speech ended');
                  ultimateUtterance.onerror = (ultimateEvent) => {
                    console.error('Ultimate fallback speech error:', ultimateEvent);
                  };
                  window.speechSynthesis.speak(ultimateUtterance);
                } catch (ultimateError) {
                  console.error('Ultimate fallback also failed:', ultimateError);
                }
              };
              window.speechSynthesis.speak(finalUtterance);
            } catch (finalError) {
              console.error('Final fallback also failed:', finalError);
            }
          };
          window.speechSynthesis.speak(retryUtterance);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          // Final fallback
          try {
            window.speechSynthesis.cancel();
            const fallbackUtterance = new SpeechSynthesisUtterance(text);
            fallbackUtterance.lang = langCode;
            fallbackUtterance.rate = 0.9;
            fallbackUtterance.onend = () => console.log('Fallback speech ended');
            fallbackUtterance.onerror = (fallbackEvent) => {
              console.error('Fallback speech error:', fallbackEvent);
            };
            window.speechSynthesis.speak(fallbackUtterance);
          } catch (fallbackError) {
            console.error('Fallback speech also failed:', fallbackError);
          }
        }
      } else {
        // No voice was set, try with minimal configuration
        try {
          window.speechSynthesis.cancel();
          const fallbackUtterance = new SpeechSynthesisUtterance(text);
          fallbackUtterance.lang = langCode;
          fallbackUtterance.rate = 0.9;
          fallbackUtterance.onend = () => console.log('Minimal fallback speech ended');
          fallbackUtterance.onerror = (fallbackEvent) => {
            console.error('Minimal fallback speech error:', fallbackEvent);
            // Ultimate fallback - try with no language specification
            try {
              window.speechSynthesis.cancel();
              const ultimateUtterance = new SpeechSynthesisUtterance(text);
              ultimateUtterance.rate = 0.9;
              ultimateUtterance.onend = () => console.log('Ultimate fallback speech ended');
              ultimateUtterance.onerror = (ultimateEvent) => {
                console.error('Ultimate fallback speech error:', ultimateEvent);
              };
              window.speechSynthesis.speak(ultimateUtterance);
            } catch (ultimateError) {
              console.error('Ultimate fallback also failed:', ultimateError);
            }
          };
          window.speechSynthesis.speak(fallbackUtterance);
        } catch (fallbackError) {
          console.error('Minimal fallback speech also failed:', fallbackError);
        }
      }
    };
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Error speaking text:', error);
    // Final fallback: try with minimal configuration
    try {
      window.speechSynthesis.cancel();
      const fallbackUtterance = new SpeechSynthesisUtterance(text || '');
      fallbackUtterance.lang = LANGUAGE_MAP[languageCode] || 'en-US';
      fallbackUtterance.rate = 0.9;
      fallbackUtterance.onend = () => console.log('Final fallback speech ended');
      fallbackUtterance.onerror = (fallbackEvent) => {
        console.error('Final fallback speech error:', fallbackEvent);
      };
      window.speechSynthesis.speak(fallbackUtterance);
    } catch (fallbackError) {
      console.error('Final fallback speech also failed:', fallbackError);
    }
  }
};

// Stop ongoing speech
export const stopSpeech = (): void => {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }
};

// Pause speech
export const pauseSpeech = (): void => {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.pause();
    } catch (error) {
      console.error('Error pausing speech:', error);
    }
  }
};

// Resume speech
export const resumeSpeech = (): void => {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.resume();
    } catch (error) {
      console.error('Error resuming speech:', error);
    }
  }
};

// Check if speech is currently playing
export const isSpeaking = (): boolean => {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    return window.speechSynthesis.speaking;
  } catch (error) {
    console.error('Error checking if speaking:', error);
    return false;
  }
};

// Check if speech is paused
export const isPaused = (): boolean => {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    return window.speechSynthesis.paused;
  } catch (error) {
    console.error('Error checking if paused:', error);
    return false;
  }
};

// Wait for voices to be loaded
export const waitForVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([]);
      return;
    }
    
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
        return;
      }
      
      // If voices aren't loaded yet, wait for the voiceschanged event
      const onVoicesChanged = () => {
        try {
          const loadedVoices = window.speechSynthesis.getVoices();
          resolve(loadedVoices);
        } catch (error) {
          console.error('Error getting loaded voices:', error);
          resolve([]);
        }
      };
      
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
      
      // Fallback timeout
      setTimeout(() => {
        try {
          resolve(window.speechSynthesis.getVoices());
        } catch (error) {
          console.error('Error getting voices after timeout:', error);
          resolve([]);
        }
      }, 5000); // Increased timeout to 5 seconds
    } catch (error) {
      console.error('Error waiting for voices:', error);
      resolve([]);
    }
  });
};