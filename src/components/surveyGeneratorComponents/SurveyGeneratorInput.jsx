import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, SendHorizontal } from 'lucide-react';

const SurveyGeneratorInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [listening, setListening] = useState(false);
  const [bars, setBars] = useState(new Array(20).fill(1));

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const silenceStartTimeRef = useRef(null);
  const textareaRef = useRef(null);

  const GREEN_COLOR = '#5DA781';

  const handleInput = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const updateAudioBars = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const barValues = [];
    let total = 0;

    for (let i = 0; i < bars.length; i++) {
      const val = dataArrayRef.current[i];
      total += val;
      barValues.push(Math.max(2, val / 2));
    }

    setBars(barValues);

    const avg = total / bars.length;
    const silenceThreshold = 10;
    const now = Date.now();

    if (avg < silenceThreshold) {
      if (!silenceStartTimeRef.current) {
        silenceStartTimeRef.current = now;
      } else if (now - silenceStartTimeRef.current > 3000) {
        stopAll();
        return;
      }
    } else {
      silenceStartTimeRef.current = null;
    }

    animationRef.current = requestAnimationFrame(updateAudioBars);
  };

  const startVisualizer = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);

      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      updateAudioBars();
    } catch (err) {
      alert('Accès au micro refusé: ' + err.message);
      setListening(false);
    }
  };

  const stopVisualizer = () => {
    cancelAnimationFrame(animationRef.current);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
    silenceStartTimeRef.current = null;

    setBars(new Array(20).fill(1));
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconnaissance vocale non supportée');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
      setMessage(transcript.trim());
    };

    recognition.onerror = (event) => {
      console.error('Erreur reconnaissance vocale', event.error);
      stopAll();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopAll = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Recognition already stopped');
      }
      recognitionRef.current = null;
    }

    stopVisualizer();
    setListening(false);
  };

  const handleVoiceToggle = async () => {
    if (!listening) {
      try {
        await startVisualizer();
        startRecognition();
        setListening(true);
      } catch (err) {
        console.error('Erreur micro:', err);
      }
    } else {
      stopAll();
    }
  };

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  return (
    <div className="w-full space-y-3">
      {/* Audio visualizer */}
      {listening && (
        <div className="flex items-end justify-center gap-1 h-16 bg-gray-100 rounded-lg p-4">
          {bars.map((height, i) => (
            <div
              key={i}
              className="w-1 rounded-full transition-all duration-100"
              style={{
                height: `${height}px`,
                backgroundColor: GREEN_COLOR,
              }}
            />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-3 items-end bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        {/* Mic button */}
        <button
          onClick={handleVoiceToggle}
          disabled={isLoading}
          className="flex-shrink-0 p-2 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: listening ? GREEN_COLOR : 'transparent',
            color: listening ? 'white' : '#999',
          }}
          onMouseEnter={(e) => {
            if (!listening && !isLoading) {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }
          }}
          onMouseLeave={(e) => {
            if (!listening) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
          title={listening ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement'}
        >
          {listening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Décrivez le questionnaire que vous souhaitez générer..."
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-transparent text-gray-800 border-none outline-none resize-none max-h-40 text-sm placeholder-gray-400 disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className="flex-shrink-0 p-2 rounded-lg transition-all duration-200 text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: message.trim() && !isLoading ? GREEN_COLOR : '#ccc',
          }}
          title="Envoyer (Entrée)"
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Tip */}
      <p className="text-xs text-gray-500 text-center">
        <span className="font-medium">Entrée</span> pour envoyer • <span className="font-medium">Shift+Entrée</span> pour une nouvelle ligne
      </p>
    </div>
  );
};

export default SurveyGeneratorInput;