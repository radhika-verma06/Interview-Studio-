'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
  onLiveTranscript?: (transcript: string) => void;
  initialTranscript?: string;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscriptComplete, onLiveTranscript, initialTranscript = '', disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mode, setMode] = useState<'live' | 'recorded'>('recorded');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const baseTranscript = useRef('');
  const finalSpeechTranscript = useRef('');
  const recordingActive = useRef(false);

  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      recordingActive.current = false;
      recognition.current?.stop();
      if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        mediaRecorder.current.stop();
      }
    };
  }, []);

  const getSpeechRecognition = (): SpeechRecognitionConstructor | null => {
    if (typeof window === 'undefined') return null;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  };

  const startTimer = () => {
    setRecordingTime(0);
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const handleStartRecording = async () => {
    setError(null);
    const SpeechRecognition = getSpeechRecognition();
    if (SpeechRecognition) {
      baseTranscript.current = initialTranscript.trim();
      finalSpeechTranscript.current = '';
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';
      recognizer.onresult = (event) => {
        let interim = '';
        let finalText = finalSpeechTranscript.current;
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0].transcript;
          if (event.results[index].isFinal) {
            finalText = `${finalText} ${transcript}`.trim();
          } else {
            interim = `${interim} ${transcript}`.trim();
          }
        }
        finalSpeechTranscript.current = finalText;
        const combined = [baseTranscript.current, finalText, interim].filter(Boolean).join('\n').trim();
        setLiveTranscript(combined);
        onLiveTranscript?.(combined);
      };
      recognizer.onerror = () => {
        setError('Live speech stopped. You can keep typing, or use recorded transcription.');
        recordingActive.current = false;
        setIsRecording(false);
        if (timerInterval.current) clearInterval(timerInterval.current);
      };
      recognizer.onend = () => {
        if (recordingActive.current) return;
        const combined = [baseTranscript.current, finalSpeechTranscript.current].filter(Boolean).join('\n').trim();
        if (combined) onTranscriptComplete(combined);
      };
      recognition.current = recognizer;
      recognizer.start();
      setMode('live');
      recordingActive.current = true;
      setIsRecording(true);
      setLiveTranscript(baseTranscript.current);
      startTimer();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks.current = [];
      baseTranscript.current = initialTranscript.trim();

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start(200); // Collect data frequently
      setMode('recorded');
      recordingActive.current = true;
      setIsRecording(true);
      startTimer();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const handleStopRecording = () => {
    if (recognition.current && mode === 'live') {
      recordingActive.current = false;
      setIsRecording(false);
      recognition.current.onend = null;
      recognition.current.stop();
      if (timerInterval.current) clearInterval(timerInterval.current);
      const combined = liveTranscript.trim() || [baseTranscript.current, finalSpeechTranscript.current].filter(Boolean).join('\n').trim();
      if (combined) onTranscriptComplete(combined);
      return;
    }

    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      recordingActive.current = false;
      setIsRecording(false);
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const result = await api.transcribeAudio(audioBlob);
      const combined = [baseTranscript.current, result.transcript].filter(Boolean).join('\n').trim();
      onTranscriptComplete(combined);
    } catch (err) {
      console.error(err);
      setError("Failed to transcribe audio. You can still type your answer manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700 bg-slate-900/50 relative overflow-hidden">
        {/* Glow effect when recording */}
        {isRecording && (
            <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse" />
        )}
      
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        disabled={disabled || isProcessing}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isRecording 
            ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
            : 'bg-teal-600 hover:bg-teal-500 disabled:opacity-50'
        }`}
      >
        {isRecording ? <Square className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
      </button>

      <div className="flex-1">
        {isProcessing ? (
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            <span className="text-sm font-medium animate-pulse">Transcribing with AI...</span>
          </div>
        ) : isRecording ? (
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
             <span className="text-rose-400 font-mono font-medium">{formatTime(recordingTime)}</span>
             <span className="text-sm text-slate-400">{mode === 'live' ? 'Live transcript is updating...' : 'Speak clearly...'}</span>
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium text-slate-300">Live Voice Answer</div>
            <div className="text-xs text-slate-500">Tap the mic for live transcript. Falls back to recorded transcription when needed.</div>
          </div>
        )}
        {error && <div className="mt-1 text-xs text-amber-300">{error}</div>}
      </div>
    </div>
  );
}
