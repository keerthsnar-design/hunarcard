import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceStoryInput({ onTranscript, currentText = '', maxLength = 140 }) {
  const { lang, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  // If browser does not support Speech Recognition, hide completely
  if (!isSupported) {
    return null;
  }

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set language based on active language selection
      if (lang === 'kn') {
        recognition.lang = 'kn-IN';
      } else if (lang === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          const combined = currentText ? `${currentText} ${transcript}` : transcript;
          onTranscript(combined.slice(0, maxLength));
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start error:', err);
      setIsListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`btn btn-sm ${isListening ? 'btn-danger-soft' : 'btn-secondary'}`}
      style={{
        padding: '0.25rem 0.65rem',
        minHeight: '32px',
        fontSize: '0.8rem',
        fontWeight: 700,
        borderRadius: 'var(--radius-full)'
      }}
      title={isListening ? 'Click to stop listening' : 'Click to speak your story'}
      aria-label={isListening ? 'Listening' : 'Speak your story'}
    >
      <span>{isListening ? t('listeningBtn', '🔴 Listening...') : t('speakBtn', '🎙️ Speak')}</span>
    </button>
  );
}
