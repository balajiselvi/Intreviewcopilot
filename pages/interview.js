import { useCallback, useEffect, useRef, useState } from 'react';
import { classifyGenerationFailure } from '../lib/generationGuard';
import { buildBoundedHistory, isClearlyIncompleteFragment, isTruncatedScenarioSetup, removeSubmittedSnapshot } from '../lib/interviewContext';
import {
  canStartTurn,
  deriveOperatorState,
  getOrCreateLiveSessionId,
  historyForGeneration,
  nextResetSnapshot,
  rotateLiveSessionId,
  shouldReuseQuestionRow
} from '../lib/liveSessionOperator';
import {
  attachLiveSessionErrorShield,
  invokeSpeechCallback,
  safeCloseAudioConfig,
  safeDisposeRecognizer,
  stopMediaTracks
} from '../lib/speechSessionGuard';
import { createSpeechTurnDetector, looksLikeContinuationShape } from '../lib/speechTurnDetector';

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';

// MUI Components
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Switch,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';

// MUI Icons
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import HearingIcon from '@mui/icons-material/Hearing';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PersonIcon from '@mui/icons-material/Person';
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SpeakerNotesIcon from '@mui/icons-material/SpeakerNotes';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import SwapVertIcon from '@mui/icons-material/SwapVert';

// Third-party Libraries
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import throttle from 'lodash.throttle';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import ReactMarkdown from 'react-markdown';
import ScrollToBottom from 'react-scroll-to-bottom';

// Local Imports
import SettingsDialog from '../components/SettingsDialog';
import AnswerQualityPanel from '../components/AnswerQualityPanel';
import { setAIResponse } from '../redux/aiResponseSlice';
import { addToHistory, clearHistory, updateLatestQuestion } from '../redux/historySlice';
import { clearTranscription, setTranscription } from '../redux/transcriptionSlice';
import { getConfig, setConfig as saveConfig } from '../utils/config';

function debounce(func, timeout = 100) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

// Whole-utterance-only phrases -- an exact match to one of these carries no substantive
// ask on its own. Deliberately does NOT include recovery-signal phrases ("I'm blank", "where
// was I") -- those ARE a genuine request for the copilot's help and must keep flowing through
// to chat.js's isRecoverySignal handling, not get silenced here.
const FILLER_PHRASES = new Set([
  "hmm", "hmmm", "uh", "uhh", "okay", "ok", "yes", "yeah", "yep", "right", "correct",
  "go ahead", "continue", "carry on", "please continue", "next question", "i see",
  "alright", "fine", "sure", "exactly", "understood", "thats right", "thats the question",
  // "and so on" splits into "so on" by this function's own clause-splitter (which treats
  // standalone "and" as a separator) before the phrase check ever runs -- keep both forms.
  "and so on", "so on"
]);

// Auto-submit fires on every silence gap, so a bare interviewer acknowledgement ("Okay.",
// "Yes, that's the question.", "Hmm, okay, go ahead.") must not trigger a full AI generation --
// this is a copilot for ANSWERING questions, not a conversational participant. The previous
// version of this check only did an exact-string match against a flat phrase list (so "Yes,
// that's the question." never matched anything and fell through to askOpenAI) plus a crude
// `length < 12` fallback that would have just as easily swallowed a genuine short question
// ("why IAG?" is 9 characters). This instead splits the utterance into clauses the same way
// isCompoundQuestion does server-side, and only suppresses when EVERY clause is an exact
// filler-phrase match -- a single substantive clause anywhere ("...but why did you choose IAG
// over ARA?") is enough to let the whole utterance through.
function isNonSubstantiveFiller(rawText = "") {
  const clauses = rawText
    .toLowerCase()
    .split(/[.?!,]+|\band\b/)
    .map((s) => s.replace(/[^a-z0-9\s]/g, "").trim())
    .filter(Boolean);
  if (clauses.length === 0) return true;
  return clauses.every((clause) => FILLER_PHRASES.has(clause));
}

function getLiveInterviewSessionId() {
  try {
    if (typeof sessionStorage === "undefined") {
      return `live_${Date.now().toString(36)}_nosess`;
    }
    return getOrCreateLiveSessionId(sessionStorage);
  } catch {
    return `live_${Date.now().toString(36)}_nosess`;
  }
}

export default function InterviewPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const transcriptionFromStore = useSelector(state => state.transcription);
  const aiResponseFromStore = useSelector(state => state.aiResponse);
  const history = useSelector(state => state.history);
  const theme = useTheme();

  const initialConfig = useRef(getConfig()).current;

  const [systemRecognizer, setSystemRecognizer] = useState(null);
  const [micRecognizer, setMicRecognizer] = useState(null);
  const systemRecognizerRef = useRef(null);
  const micRecognizerRef = useRef(null);
  const stopInFlightRef = useRef({ system: false, microphone: false });
  const [systemAutoMode, setSystemAutoMode] = useState(initialConfig.systemAutoMode !== undefined ? initialConfig.systemAutoMode : true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isSystemAudioActive, setIsSystemAudioActive] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [isManualMode, setIsManualMode] = useState(initialConfig.isManualMode !== undefined ? initialConfig.isManualMode : false);
  const [micTranscription, setMicTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [queuedTurnCount, setQueuedTurnCount] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [aiResponseSortOrder, setAiResponseSortOrder] = useState('newestAtTop');
  const [isPipWindowActive, setIsPipWindowActive] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugContext, setDebugContext] = useState(null);

  const pipWindowRef = useRef(null);
  const documentPipWindowRef = useRef(null);
  const documentPipIframeRef = useRef(null);
  const systemInterimTranscription = useRef('');
  const micInterimTranscription = useRef('');
  const finalTranscript = useRef({ system: '', microphone: '' });
  const isManualModeRef = useRef(isManualMode);
  const systemAutoModeRef = useRef(systemAutoMode);
  const throttledDispatchSetAIResponseRef = useRef(null);
  const activeRequestRef = useRef(null);
  const isProcessingRef = useRef(false);
  const historyRef = useRef(history);
  const pendingAnalysisRef = useRef(null);
  const pendingContextRef = useRef(null);
  const lastAskRef = useRef({ text: "", source: "microphone" });
  const sessionEpochRef = useRef(0);
  const speechTurnsRef = useRef({ system: null, microphone: null });
  const pendingSpeechQueueRef = useRef([]);
  const drainQueuedSpeechTurnRef = useRef(() => {});
  const askOpenAIRef = useRef(null);
  const ingestSpeechRef = useRef(null);
  const debugEnabledRef = useRef(false);
  const speechLogRef = useRef([]);

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSettingsSaved = () => {
    const newConfig = getConfig();
    setSystemAutoMode(newConfig.systemAutoMode !== undefined ? newConfig.systemAutoMode : true);
    setIsManualMode(newConfig.isManualMode !== undefined ? newConfig.isManualMode : false);
  };

  useEffect(() => { isManualModeRef.current = isManualMode; }, [isManualMode]);
  useEffect(() => { systemAutoModeRef.current = systemAutoMode; }, [systemAutoMode]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => {
    if (router.isReady) setDebugEnabled(router.query.debug === "1");
  }, [router.isReady, router.query.debug]);
  useEffect(() => { debugEnabledRef.current = debugEnabled; }, [debugEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!debugEnabled) {
      try {
        delete window.__interviewIngestSpeech;
        delete window.__interviewSpeechDebug;
        delete window.__interviewSpeechLog;
      } catch { /* ignore */ }
      return undefined;
    }
    window.__interviewIngestSpeech = (kind, text, source) => ingestSpeechRef.current?.(kind, text, source);
    window.__interviewSpeechDebug = (source = "microphone") => speechTurnsRef.current[source]?._debug?.() || null;
    window.__interviewSpeechLog = speechLogRef.current;
    return () => {
      try {
        delete window.__interviewIngestSpeech;
        delete window.__interviewSpeechDebug;
        delete window.__interviewSpeechLog;
      } catch { /* ignore */ }
    };
  }, [debugEnabled]);

  useEffect(() => {
    throttledDispatchSetAIResponseRef.current = throttle((payload) => {
      dispatch(setAIResponse(payload));
    }, 250, { leading: true, trailing: true });

    return () => {
      if (throttledDispatchSetAIResponseRef.current && typeof throttledDispatchSetAIResponseRef.current.cancel === 'function') {
        throttledDispatchSetAIResponseRef.current.cancel();
      }
    };
  }, [dispatch]);

  useEffect(() => attachLiveSessionErrorShield((error) => {
    console.error('Live session non-fatal error:', error);
  }), []);

  useEffect(() => () => {
    try { speechTurnsRef.current.system?.reset(); } catch { /* ignore */ }
    try { speechTurnsRef.current.microphone?.reset(); } catch { /* ignore */ }
    activeRequestRef.current?.abort();
    try {
      stopMediaTracks(systemRecognizerRef.current?._sourceMediaStream);
      if (typeof systemRecognizerRef.current?._audioCleanup === 'function') {
        systemRecognizerRef.current._audioCleanup();
      }
    } catch (error) {
      console.error('System audio unmount cleanup failed:', error);
    }
    try {
      stopMediaTracks(micRecognizerRef.current?._sourceMediaStream);
      if (typeof micRecognizerRef.current?._audioCleanup === 'function') {
        micRecognizerRef.current._audioCleanup();
      }
    } catch (error) {
      console.error('Microphone unmount cleanup failed:', error);
    }
  }, []);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const stopRecording = async (source) => {
    if (stopInFlightRef.current[source]) return;
    stopInFlightRef.current[source] = true;
    const recognizer = source === 'system' ? systemRecognizerRef.current : micRecognizerRef.current;
    try {
      if (recognizer && typeof recognizer.stopContinuousRecognitionAsync === 'function') {
        await invokeSpeechCallback(recognizer.stopContinuousRecognitionAsync, recognizer, {
          swallowError: true,
          timeoutMs: 8000
        });
      }
      if (recognizer?.audioConfig?.privSource?.privStream instanceof MediaStream) {
        stopMediaTracks(recognizer.audioConfig.privSource.privStream);
      }
      stopMediaTracks(recognizer?._sourceMediaStream);
      if (typeof recognizer?._audioCleanup === 'function') {
        try {
          recognizer._audioCleanup();
        } catch (cleanupError) {
          console.error(`Error cleaning ${source} audio pipeline:`, cleanupError);
        }
      }
      await safeCloseAudioConfig(recognizer?.audioConfig);
      await safeDisposeRecognizer(recognizer);
    } catch (error) {
      console.error(`Error stopping ${source} recognition:`, error);
      showSnackbar(`${source === 'system' ? 'Tab audio' : 'Microphone'} stopped. You can start it again.`, 'warning');
    } finally {
      if (source === 'system') {
        systemRecognizerRef.current = null;
        setIsSystemAudioActive(false);
        setSystemRecognizer(null);
      } else {
        micRecognizerRef.current = null;
        setIsMicrophoneActive(false);
        setMicRecognizer(null);
      }
      stopInFlightRef.current[source] = false;
      try { speechTurnsRef.current[source]?.stopPending(); } catch { /* ignore */ }
    }
  };

  const handleClearSystemTranscription = () => {
    finalTranscript.current.system = '';
    systemInterimTranscription.current = '';
    speechTurnsRef.current.system?.reset();
    dispatch(clearTranscription());
  };

  const handleClearMicTranscription = () => {
    finalTranscript.current.microphone = '';
    micInterimTranscription.current = '';
    speechTurnsRef.current.microphone?.reset();
    setMicTranscription('');
  };

  const syncTranscriptDisplay = (source, text, finalText) => {
    const spoken = String(text || "").trim();
    const committedFinal = String(finalText || "").trim();
    finalTranscript.current[source] = committedFinal ? `${committedFinal} ` : '';
    if (source === 'system') {
      systemInterimTranscription.current = spoken.slice(committedFinal.length).trim();
      dispatch(setTranscription(spoken));
    } else {
      micInterimTranscription.current = spoken.slice(committedFinal.length).trim();
      setMicTranscription(spoken);
    }
  };

  const pushSpeechLog = (event) => {
    if (!debugEnabledRef.current) return;
    const row = { ...event };
    speechLogRef.current.push(row);
    if (speechLogRef.current.length > 80) speechLogRef.current.splice(0, speechLogRef.current.length - 80);
    try {
      console.debug("[speech-turn]", row.type, {
        utteranceId: row.utteranceId,
        reason: row.reason,
        waitMs: row.waitMs,
        text: row.text || row.finalText
      });
    } catch { /* ignore */ }
  };

  const getTurnDetector = (source) => {
    if (speechTurnsRef.current[source]) return speechTurnsRef.current[source];
    const detector = createSpeechTurnDetector({
      shouldHold: (text) => isClearlyIncompleteFragment(text) || isTruncatedScenarioSetup(text, {}) || looksLikeContinuationShape(text),
      onDiagnostic: pushSpeechLog,
      onTranscript(text) {
        syncTranscriptDisplay(source, text, detector.getFinalText());
      },
      onFinalize({ text, utteranceId }) {
        if (isNonSubstantiveFiller(text)) {
          detector.reset();
          return;
        }
        if (isProcessingRef.current) {
          const queue = pendingSpeechQueueRef.current;
          const existing = queue.findIndex((item) => item.utteranceId === utteranceId);
          const row = { text, utteranceId, source };
          if (existing >= 0) queue[existing] = row;
          else queue.push(row);
          setQueuedTurnCount(queue.length);
          pushSpeechLog({ type: "queue-while-busy", utteranceId, text, source });
          return;
        }
        lastAskRef.current = { ...(lastAskRef.current || {}), utteranceId, text, source };
        askOpenAIRef.current?.(text, source, { utteranceId });
      },
      onRevoked({ utteranceId, wasCommitted }) {
        pendingSpeechQueueRef.current = pendingSpeechQueueRef.current.filter(
          (item) => item.utteranceId !== utteranceId
        );
        setQueuedTurnCount(pendingSpeechQueueRef.current.length);
        if (lastAskRef.current?.utteranceId !== utteranceId) return;
        lastAskRef.current = { ...lastAskRef.current, revoked: true };
        if (wasCommitted) {
          dispatch(updateLatestQuestion({ utteranceId, status: "superseded" }));
        }
        const controller = activeRequestRef.current;
        if (!controller) {
          isProcessingRef.current = false;
          setIsProcessing(false);
          drainQueuedSpeechTurnRef.current();
          return;
        }
        activeRequestRef.current = null;
        try { controller.abort(); } catch (abortError) {
          console.error(`Failed to abort superseded ${source} request:`, abortError);
        }
        isProcessingRef.current = false;
        setIsProcessing(false);
        drainQueuedSpeechTurnRef.current();
      }
    });
    speechTurnsRef.current[source] = detector;
    return detector;
  };

  const ingestSpeech = (kind, text, source) => {
    const detector = getTurnDetector(source);
    detector.setBaseSilenceMs((Number(getConfig().silenceTimerDuration) || 1.2) * 1000);
    const auto = (source === 'system' && systemAutoModeRef.current)
      || (source === 'microphone' && !isManualModeRef.current);
    detector.setAutoSubmit(auto);
    if (kind === 'interim') detector.noteInterim(text);
    else if (kind === 'final') detector.noteFinal(text);
    else if (kind === 'start') detector.noteSpeechStart();
    else if (kind === 'end') detector.noteSpeechEnd();
  };
  ingestSpeechRef.current = ingestSpeech;

  const drainQueuedSpeechTurn = () => {
    const queued = pendingSpeechQueueRef.current.shift();
    setQueuedTurnCount(pendingSpeechQueueRef.current.length);
    if (!queued?.text) return;
    pushSpeechLog({ type: "drain-queued-turn", utteranceId: queued.utteranceId, text: queued.text, source: queued.source });
    queueMicrotask(() => {
      if (isProcessingRef.current) return;
      askOpenAIRef.current?.(queued.text, queued.source, { utteranceId: queued.utteranceId });
    });
  };
  drainQueuedSpeechTurnRef.current = drainQueuedSpeechTurn;

  const handleManualInputChange = (value, source) => {
    if (source === 'system') {
      dispatch(setTranscription(value));
      finalTranscript.current.system = value;
    } else {
      setMicTranscription(value);
      finalTranscript.current.microphone = value;
    }
  };

  const handleManualSubmit = (source) => {
    if (!canStartTurn({ isProcessing: isProcessingRef.current })) {
      showSnackbar('Please wait for the current response to finish.', 'info');
      return;
    }
    const textToSubmit = source === 'system' ? transcriptionFromStore : micTranscription;
    if (textToSubmit.trim()) {
      const detector = speechTurnsRef.current[source];
      if (detector) {
        detector.setAutoSubmit(false);
        detector.stopPending();
      }
      pendingSpeechQueueRef.current = pendingSpeechQueueRef.current.filter((item) => item.source !== source);
      setQueuedTurnCount(pendingSpeechQueueRef.current.length);
      askOpenAI(textToSubmit.trim(), source, { utteranceId: detector?.getUtteranceId() || null, manual: true });
    } else {
      showSnackbar('Input is empty.', 'warning');
    }
  };

  const handleKeyPress = (e, source) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isProcessingRef.current) return;
      handleManualSubmit(source);
    }
  };

  const handleCombineAndSubmit = () => {
    if (!canStartTurn({ isProcessing: isProcessingRef.current })) {
      showSnackbar('Please wait for the current response to finish.', 'info');
      return;
    }
    if (selectedQuestions.length === 0) {
      showSnackbar('No questions selected to combine.', 'warning');
      return;
    }
    const questionHistory = history.filter(e => e.type === 'question').slice().reverse();
    const questionTexts = selectedQuestions.map(selectedIndexInReversedArray => {
      return questionHistory[selectedIndexInReversedArray]?.text;
    }).filter(text => text);

    if (questionTexts.length === 0) {
      showSnackbar('Could not retrieve selected question texts.', 'warning');
      return;
    }

    const combinedText = questionTexts.join('\n\n---\n\n');
    askOpenAI(combinedText, 'combined');
    if (isProcessingRef.current) setSelectedQuestions([]);
  };

  // Converts a MediaStream into an Azure Speech SDK push-stream AudioConfig by downmixing to
  // mono 16kHz 16-bit PCM via the Web Audio API. Passing a raw MediaStream straight into
  // SpeechSDK.AudioConfig.fromStreamInput() is only reliable for microphone-shaped (mono)
  // input -- getDisplayMedia's tab/system audio is commonly stereo and/or a different sample
  // rate, which the SDK fails to recognize from SILENTLY (no error thrown, no transcription
  // ever produced) rather than raising an error, which is why this looked like "not listening"
  // with no diagnostic to go on.
  const createSystemAudioConfig = (mediaStream) => {
    const pushStream = SpeechSDK.AudioInputStream.createPushStream(
      SpeechSDK.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
    );

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextCtor();
    const sourceNode = audioContext.createMediaStreamSource(mediaStream);
    const processorNode = audioContext.createScriptProcessor(4096, 1, 1);
    // ScriptProcessorNode only reliably fires onaudioprocess once connected through to the
    // destination in some browsers -- route through a silent (gain=0) node so nothing is
    // actually played back, which would otherwise create an audio feedback loop with the
    // shared tab's own sound.
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    const inputSampleRate = audioContext.sampleRate;
    const targetSampleRate = 16000;
    const ratio = inputSampleRate / targetSampleRate;

    processorNode.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const outputLength = Math.floor(inputData.length / ratio);
      const output = new Int16Array(outputLength);
      for (let i = 0; i < outputLength; i++) {
        const sample = inputData[Math.floor(i * ratio)];
        const clamped = Math.max(-1, Math.min(1, sample));
        output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      }
      pushStream.write(output.buffer);
    };

    sourceNode.connect(processorNode);
    processorNode.connect(silentGain);
    silentGain.connect(audioContext.destination);

    const cleanup = () => {
      try {
        processorNode.disconnect();
        sourceNode.disconnect();
        silentGain.disconnect();
        pushStream.close();
        audioContext.close();
      } catch (cleanupError) {
        console.error('Error cleaning up system audio pipeline:', cleanupError);
      }
    };

    return { audioConfig: SpeechSDK.AudioConfig.fromStreamInput(pushStream), cleanup };
  };

  const createRecognizer = async (mediaStream, source) => {
    const currentConfig = getConfig();
    if (!currentConfig.azureToken || !currentConfig.azureRegion) {
      showSnackbar('Azure Speech credentials missing. Please set them in Settings.', 'error');
      stopMediaTracks(mediaStream);
      return null;
    }

    let audioConfig;
    let audioCleanup = null;
    try {
      if (source === 'system') {
        const converted = createSystemAudioConfig(mediaStream);
        audioConfig = converted.audioConfig;
        audioCleanup = converted.cleanup;
      } else {
        audioConfig = SpeechSDK.AudioConfig.fromStreamInput(mediaStream);
      }
    } catch (configError) {
      console.error(`Error creating AudioConfig for ${source}:`, configError);
      showSnackbar(`Error setting up audio for ${source}. You can try again.`, 'error');
      stopMediaTracks(mediaStream);
      return null;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(currentConfig.azureToken, currentConfig.azureRegion);
    speechConfig.speechRecognitionLanguage = currentConfig.azureLanguage;

    // Phrase segmentation, not turn-end. Azure emits a FINAL after this much silence
    // inside one human question; lib/speechTurnDetector.js is the turn boundary.
    speechConfig.setProperty("Speech_SegmentationSilenceTimeoutMs", "500");
    speechConfig.setProperty("SpeechServiceConnection_InitialSilenceTimeoutMs", "3000");

    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    // Referenced by stopRecording() -- the source stream and the (system-audio-only) Web
    // Audio pipeline cleanup aren't reachable through the SDK's own audioConfig internals
    // once the push-stream conversion is in play.
    recognizer._sourceMediaStream = mediaStream;
    recognizer._audioCleanup = audioCleanup;

    recognizer.recognizing = (s, e) => {
      try {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          ingestSpeech('interim', e.result.text, source);
        }
      } catch (eventError) {
        console.error(`recognizing handler failed for ${source}:`, eventError);
      }
    };

    recognizer.recognized = (s, e) => {
      try {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
          ingestSpeech('final', e.result.text, source);
        }
      } catch (eventError) {
        console.error(`recognized handler failed for ${source}:`, eventError);
      }
    };

    recognizer.speechStartDetected = () => {
      try {
        ingestSpeech('start', '', source);
      } catch (eventError) {
        console.error(`speechStartDetected handler failed for ${source}:`, eventError);
      }
    };

    recognizer.speechEndDetected = () => {
      try {
        ingestSpeech('end', '', source);
      } catch (eventError) {
        console.error(`speechEndDetected handler failed for ${source}:`, eventError);
      }
    };

    recognizer.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason} for ${source}`);
      if (e.reason === SpeechSDK.CancellationReason.Error) {
        console.error(`CANCELED: ErrorCode=${e.errorCode}`);
        console.error(`CANCELED: ErrorDetails=${e.errorDetails}`);
        showSnackbar(`Speech recognition error for ${source}. Capture stopped; you can start it again.`, 'error');
      }
      if (!stopInFlightRef.current[source]) {
        stopRecording(source);
      }
    };

    recognizer.sessionStopped = (s, e) => {
      console.log(`Session stopped event for ${source}.`);
      if (!stopInFlightRef.current[source]) {
        stopRecording(source);
      }
    };

    try {
      await invokeSpeechCallback(recognizer.startContinuousRecognitionAsync, recognizer, { timeoutMs: 15000 });
      return recognizer;
    } catch (error) {
      console.error(`Error starting ${source} continuous recognition:`, error);
      showSnackbar(`Failed to start ${source} recognition. You can try again.`, 'error');
      try {
        if (typeof audioCleanup === 'function') audioCleanup();
      } catch (cleanupError) {
        console.error(`Error cleaning ${source} audio after start failure:`, cleanupError);
      }
      await safeCloseAudioConfig(audioConfig);
      await safeDisposeRecognizer(recognizer);
      stopMediaTracks(mediaStream);
      return null;
    }
  };

  const startSystemAudioRecognition = async () => {
    try {
      if (isSystemAudioActive) {
        await stopRecording('system');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        showSnackbar('Screen sharing is not supported by your browser.', 'error');
        setIsSystemAudioActive(false);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: {
          displaySurface: 'browser',
          logicalSurface: true
        }
      });

      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length === 0) {
        showSnackbar('No audio track detected. Please ensure you share a tab with audio.', 'warning');
        stopMediaTracks(mediaStream);
        return;
      }

      if (systemRecognizerRef.current) {
        await stopRecording('system');
      }

      const recognizerInstance = await createRecognizer(mediaStream, 'system');
      if (recognizerInstance) {
        systemRecognizerRef.current = recognizerInstance;
        setSystemRecognizer(recognizerInstance);
        setIsSystemAudioActive(true);
        showSnackbar('System audio recording started.', 'success');
        mediaStream.getTracks().forEach(track => {
          track.onended = () => {
            showSnackbar('Tab sharing ended.', 'info');
            stopRecording('system').catch((stopError) => {
              console.error('Error after tab sharing ended:', stopError);
            });
          };
        });
      } else {
        stopMediaTracks(mediaStream);
      }
    } catch (error) {
      console.error('System audio capture error:', error);
      if (error.name === "NotAllowedError") {
        showSnackbar('Permission denied for screen recording. Please allow access.', 'error');
      } else if (error.name === "NotFoundError") {
        showSnackbar('No suitable tab/window found to share.', 'error');
      } else if (error.name === "NotSupportedError") {
        showSnackbar('System audio capture not supported by your browser.', 'error');
      } else {
        showSnackbar('Failed to start tab audio capture. You can try again.', 'error');
      }
      setIsSystemAudioActive(false);
    }
  };

  const startMicrophoneRecognition = async () => {
    try {
      if (isMicrophoneActive) {
        await stopRecording('microphone');
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (micRecognizerRef.current) await stopRecording('microphone');

      const recognizerInstance = await createRecognizer(mediaStream, 'microphone');
      if (recognizerInstance) {
        micRecognizerRef.current = recognizerInstance;
        setMicRecognizer(recognizerInstance);
        setIsMicrophoneActive(true);
        showSnackbar('Microphone recording started.', 'success');
      } else {
        stopMediaTracks(mediaStream);
      }
    } catch (error) {
      console.error('Microphone capture error:', error);
      if (error.name === "NotAllowedError" || error.name === "NotFoundError") {
        showSnackbar('Permission denied for microphone. Please allow access.', 'error');
      } else {
        showSnackbar('Failed to access microphone. You can try again.', 'error');
      }
      setIsMicrophoneActive(false);
    }
  };

  const commitHistory = (item) => {
    dispatch(addToHistory(item));
    historyRef.current = [...historyRef.current, item];
  };

  const askOpenAI = async (text, source, meta = {}) => {
    if (!text.trim()) {
      showSnackbar('No input text to process.', 'warning');
      speechTurnsRef.current[source]?.releaseFinalize();
      return;
    }
    if (isProcessingRef.current) {
      showSnackbar('Please wait for the current response to finish.', 'info');
      return;
    }

    const currentConfig = getConfig();
    const isGeminiModel = currentConfig.aiModel?.toLowerCase().startsWith('gemini');
    const apiKey = isGeminiModel ? currentConfig.geminiKey : currentConfig.openaiKey;
    if (!apiKey) {
      showSnackbar(`${isGeminiModel ? 'Gemini' : 'OpenAI'} API key required. Please set it in Settings.`, 'error');
      speechTurnsRef.current[source]?.releaseFinalize();
      return;
    }

    const previousAsk = lastAskRef.current || {};
    const utteranceId = meta.utteranceId || previousAsk.utteranceId || null;
    const continuing = Boolean(utteranceId && previousAsk.utteranceId === utteranceId && previousAsk.revoked);
    const reuseQuestion = shouldReuseQuestionRow({
      retry: Boolean(meta.retry),
      continuing,
      utteranceId,
      lastUtteranceId: previousAsk.utteranceId,
      lastQuestionId: previousAsk.questionId
    });
    if (!meta.manual && (source === 'system' || source === 'microphone')) {
      const detector = speechTurnsRef.current[source];
      if (detector && utteranceId) detector.acknowledgeCommit(utteranceId);
    }

    const requestEpoch = sessionEpochRef.current;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setGenerationError(null);
    const retryCount = meta.retry
      ? (Number(previousAsk.retryCount) || 0) + 1
      : (continuing ? (Number(previousAsk.retryCount) || 0) : 0);
    const questionId = reuseQuestion && previousAsk.questionId
      ? previousAsk.questionId
      : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    lastAskRef.current = {
      text,
      source,
      retryCount,
      utteranceId,
      revoked: false,
      questionId
    };
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const submittedSnapshot = text;
    let streamedResponse = '';

    if (continuing) {
      dispatch(updateLatestQuestion({ utteranceId, text, status: "completed" }));
      historyRef.current = historyRef.current.map((item) => (
        item.type === "question" && item.utteranceId === utteranceId
          ? { ...item, text, status: "completed" }
          : item
      ));
    } else if (!reuseQuestion) {
      commitHistory({ type: 'question', text, timestamp, source, questionId, utteranceId, status: 'completed' });
    }
    dispatch(setAIResponse(''));

    let requestController;
    try {
      const conversationHistoryForAPI = buildBoundedHistory(historyForGeneration(historyRef.current));
      activeRequestRef.current?.abort();
      requestController = new AbortController();
      activeRequestRef.current = requestController;
      const chatBody = JSON.stringify({
        apiKey,
        model: currentConfig.aiModel,
        question: text,
        history: conversationHistoryForAPI,
        responseLength: "interview",
        customInstructions: currentConfig.gptSystemPrompt,
        candidateResume: currentConfig.candidateResume,
        jobDescription: currentConfig.jobDescription,
        company: currentConfig.company,
        interviewSessionId: getLiveInterviewSessionId(),
        source,
        questionId,
        debug: debugEnabled,
        retryCount: lastAskRef.current?.retryCount || 0,
      });
      const postChat = () => fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: requestController.signal,
        body: chatBody,
      });
      const classifyHttpFailure = async (res) => {
        let raw = "";
        try {
          const errorData = await res.json();
          raw = errorData.error || "";
        } catch {
          try {
            raw = await res.text();
          } catch {
            raw = "";
          }
        }
        return classifyGenerationFailure({ httpStatus: res.status, message: raw });
      };
      const consumeChatStream = async (okResponse) => {
        if (!okResponse.body) {
          throw Object.assign(new Error("Could not generate an answer."), {
            classified: classifyGenerationFailure({ message: "empty body" })
          });
        }
        const reader = okResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const event of events) {
            if (event.includes("event: error")) {
              let classified = classifyGenerationFailure({ message: "stream error" });
              try {
                const payload = event.split("\ndata: ")[1];
                const parsed = JSON.parse(payload || "{}");
                classified = classifyGenerationFailure({ message: parsed.error || "" });
              } catch {
                // keep generic copy — never surface raw API payloads
              }
              throw Object.assign(new Error(classified.userMessage), { classified });
            }
            if (event.includes("event: analysis")) {
              const payload = event.split("\ndata: ")[1];
              try {
                pendingAnalysisRef.current = JSON.parse(payload || "{}");
              } catch (parseError) {
                console.error("Error parsing SSE analysis event:", parseError);
              }
              continue;
            }
            if (event.includes("event: context")) {
              const payload = event.split("\ndata: ")[1];
              try {
                const parsed = JSON.parse(payload || "{}");
                pendingContextRef.current = parsed;
                setDebugContext(parsed);
              } catch (parseError) {
                console.error("Error parsing sanitized SSE context event:", parseError);
              }
              continue;
            }
            const payload = event.split("data: ")[1];
            if (!payload || payload === "[DONE]") continue;
            try {
              const chunkText = JSON.parse(payload).text || "";
              streamedResponse += chunkText;
              throttledDispatchSetAIResponseRef.current?.(streamedResponse);
            } catch (parseError) {
              console.error("Error parsing SSE chunk:", parseError);
            }
          }
        }
      };
      let response = await postChat();
      if (!response.ok) {
        const classified = await classifyHttpFailure(response);
        throw Object.assign(new Error(classified.userMessage), { classified });
      }
      await consumeChatStream(response);
      if (!streamedResponse.trim()) {
        throw Object.assign(new Error("Could not generate an answer."), {
          classified: classifyGenerationFailure({ message: "empty generation" })
        });
      }
      if (throttledDispatchSetAIResponseRef.current && typeof throttledDispatchSetAIResponseRef.current.cancel === "function") {
        throttledDispatchSetAIResponseRef.current.cancel();
      }
      dispatch(setAIResponse(streamedResponse));

      const finalTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      commitHistory({
        type: "response",
        text: streamedResponse,
        timestamp: finalTimestamp,
        answerId: `a_${Date.now()}`,
        questionId,
        source: "copilot",
        status: "completed",
        analysis: pendingAnalysisRef.current,
        context: pendingAnalysisRef.current?.contextSummary || pendingContextRef.current
      });
      pendingAnalysisRef.current = null;
      pendingContextRef.current = null;
      setGenerationError(null);

    } catch (error) {
      if (sessionEpochRef.current !== requestEpoch) return;
      const superseded = activeRequestRef.current !== requestController;
      const aborted = error?.name === "AbortError" || requestController?.signal.aborted;
      if (aborted && superseded) {
        return;
      }
      if (streamedResponse.trim()) {
        dispatch(setAIResponse(streamedResponse));
        commitHistory({
          type: "response",
          text: streamedResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: aborted ? "interrupted" : "completed",
          analysis: pendingAnalysisRef.current
        });
        pendingAnalysisRef.current = null;
      }
      if (aborted && superseded) return;
      const classified = error?.classified || classifyGenerationFailure({
        message: error?.message,
        name: error?.name
      });
      setGenerationError({ ...classified, question: text, source });
      showSnackbar(classified.userMessage, "error");
      if (!streamedResponse.trim()) {
        dispatch(setAIResponse(""));
        commitHistory({
          type: "response",
          text: classified.userMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "error",
          questionId
        });
      }
    } finally {
      if (sessionEpochRef.current !== requestEpoch) return;
      const isCurrentRequest = activeRequestRef.current === requestController;
      if (isCurrentRequest) {
        activeRequestRef.current = null;
        if ((source === 'system' && systemAutoModeRef.current) || (source === 'microphone' && !isManualModeRef.current)) {
          if (speechTurnsRef.current[source]) {
            speechTurnsRef.current[source].notifyGenerationSettled(utteranceId);
          } else {
            finalTranscript.current[source] = removeSubmittedSnapshot(
              finalTranscript.current[source],
              submittedSnapshot
            );
            if (source === 'system') {
              dispatch(setTranscription(finalTranscript.current.system + systemInterimTranscription.current));
            } else {
              setMicTranscription(finalTranscript.current.microphone + micInterimTranscription.current);
            }
          }
        }
        isProcessingRef.current = false;
        setIsProcessing(false);
        drainQueuedSpeechTurn();
      }
    }
  };
  askOpenAIRef.current = askOpenAI;

  const resetLiveInterviewSession = () => {
    if (history.length > 0 || isProcessingRef.current || generationError) {
      const confirmed = typeof window !== "undefined"
        ? window.confirm("Start a new interview session? Visible Q&A on this page will be cleared. Audio capture stays running.")
        : true;
      if (!confirmed) return;
    }
    sessionEpochRef.current += 1;
    try {
      activeRequestRef.current?.abort();
    } catch (abortError) {
      console.error("Failed to abort request during session reset:", abortError);
    }
    activeRequestRef.current = null;
    isProcessingRef.current = false;
    setIsProcessing(false);
    const snapshot = nextResetSnapshot();
    pendingSpeechQueueRef.current = snapshot.pendingSpeechQueue;
    setQueuedTurnCount(snapshot.queuedSpeechCount);
    lastAskRef.current = snapshot.lastAsk;
    pendingAnalysisRef.current = null;
    pendingContextRef.current = null;
    setGenerationError(null);
    setSelectedQuestions([]);
    setDebugContext(null);
    dispatch(clearHistory());
    historyRef.current = [];
    dispatch(setAIResponse(snapshot.aiResponse));
    try {
      if (typeof sessionStorage !== "undefined") rotateLiveSessionId(sessionStorage);
    } catch (rotateError) {
      console.error("Failed to rotate live session id:", rotateError);
    }
    showSnackbar("New interview session started.", "success");
  };

  const retryLastAsk = () => {
    const q = lastAskRef.current?.text;
    const src = lastAskRef.current?.source || "microphone";
    if (!q) return;
    askOpenAI(q, src, { retry: true });
  };

  const operatorState = deriveOperatorState({
    isProcessing,
    generationError,
    isSystemAudioActive,
    isMicrophoneActive,
    queuedSpeechCount: queuedTurnCount
  });

  const formatAndDisplayResponse = useCallback((response) => {
    if (!response) return null;
    return (
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <Box sx={{
                my: 1,
                position: 'relative',
                '& pre': {
                  borderRadius: '4px',
                  padding: '12px !important',
                  fontSize: '0.875rem',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }
              }}>
                <pre><code className={className} {...props} dangerouslySetInnerHTML={{ __html: hljs.highlight(String(children).replace(/\n$/, ''), { language: match[1], ignoreIllegals: true }).value }} /></pre>
              </Box>
            ) : (
              <code
                className={className}
                {...props}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  wordBreak: 'break-all'
                }}
              >
                {children}
              </code>
            );
          },
          p: ({ node, ...props }) => <Typography paragraph {...props} sx={{ mb: 1, fontSize: '0.95rem', wordBreak: 'break-word' }} />,
          strong: ({ node, ...props }) => <Typography component="strong" fontWeight="bold" color="primary.main" {...props} />,
          em: ({ node, ...props }) => <Typography component="em" fontStyle="italic" {...props} />,
          ul: ({ node, ...props }) => <Typography component="ul" sx={{ pl: 2.5, mb: 1, fontSize: '0.95rem', wordBreak: 'break-word' }} {...props} />,
          ol: ({ node, ...props }) => <Typography component="ol" sx={{ pl: 2.5, mb: 1, fontSize: '0.95rem', wordBreak: 'break-word' }} {...props} />,
          li: ({ node, ...props }) => <Typography component="li" sx={{ mb: 0.25, fontSize: '0.95rem', wordBreak: 'break-word' }} {...props} />,
        }}
      >
        {response}
      </ReactMarkdown>
    );
  }, []);

  const renderHistoryItem = (item, index) => {
    if (item.type !== 'response') return null;
    const Icon = SmartToyIcon;
    const title = 'AI Assistant';
    const avatarBgColor = theme.palette.secondary.light;

    return (
      <ListItem key={`response-${index}`} sx={{ alignItems: 'flex-start', px: 0, py: 1.5 }}>
        <Avatar sx={{ bgcolor: avatarBgColor, mr: 2, mt: 0.5 }}>
          <Icon sx={{ color: theme.palette.getContrastText(avatarBgColor) }} />
        </Avatar>
        <Paper variant="outlined" sx={{ p: 1.5, flexGrow: 1, bgcolor: theme.palette.background.default, borderColor: theme.palette.divider, overflowX: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {item.status === 'error' ? 'Generation failed' : item.status === 'interrupted' ? 'Interrupted' : title}
            </Typography>
            <Typography variant="caption" color="text.secondary">{item.timestamp}</Typography>
          </Box>
          {formatAndDisplayResponse(item.text)}
          {item.status === 'error' && (
            <Button
              size="small"
              sx={{ mt: 1 }}
              disabled={isProcessing}
              onClick={retryLastAsk}
            >
              Retry
            </Button>
          )}
          {item.analysis && <AnswerQualityPanel analysis={item.analysis} />}
        </Paper>
      </ListItem>
    );
  };

  const renderQuestionHistoryItem = (item, index) => {
    const Icon = item.source === 'system' ? HearingIcon : PersonIcon;
    const title = item.source === 'system' ? 'Interviewer' : 'Candidate';
    const avatarBgColor = item.source === 'system' ? theme.palette.info.light : theme.palette.success.light;

    return (
      <ListItem
        key={`question-hist-${index}`}
        secondaryAction={
          <Checkbox
            edge="end"
            checked={selectedQuestions.includes(index)}
            onChange={() => {
              setSelectedQuestions(prev =>
                prev.includes(index) ? prev.filter(x => x !== index) : [...prev, index]
              );
            }}
            color="secondary"
            size="small"
          />
        }
        disablePadding
        sx={{ py: 0.5, display: 'flex', alignItems: 'center' }}
      >
        <Avatar sx={{ bgcolor: avatarBgColor, mr: 1.5, width: 32, height: 32, fontSize: '1rem' }}>
          <Icon fontSize="small" />
        </Avatar>
        <ListItemText
          primary={
            <Typography variant="body2" noWrap sx={{ fontWeight: selectedQuestions.includes(index) ? 'bold' : 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.text}
            </Typography>
          }
          secondary={`${title} - ${item.timestamp}`}
        />
      </ListItem>
    );
  };

  const handleSortOrderToggle = () => {
    setAiResponseSortOrder(prev => prev === 'newestAtBottom' ? 'newestAtTop' : 'newestAtBottom');
  };

  const getAiResponsesToDisplay = () => {
    let responses = history.filter(item => item.type === 'response').slice();
    const currentStreamingText = aiResponseFromStore;

    if (isProcessing && currentStreamingText && currentStreamingText.trim() !== '') {
      responses.push({ text: currentStreamingText, timestamp: 'Streaming...', type: 'current_streaming' });
    }

    if (aiResponseSortOrder === 'newestAtTop') {
      return responses.reverse();
    }
    return responses;
  };

  const togglePipWindow = async () => {
    if (isPipWindowActive) {
      if (documentPipWindowRef.current && typeof documentPipWindowRef.current.close === 'function') {
        try {
          await documentPipWindowRef.current.close();
        } catch (e) { console.error("Error closing document PiP window:", e); }
      } else if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
      return;
    }

    const addResizeListener = (pipWindow) => {
      const handlePipResize = debounce(() => {
        if (!pipWindow || (pipWindow.closed)) return;
        const target = documentPipIframeRef.current ? documentPipIframeRef.current.contentWindow : pipWindow;
        if (target) {
          target.postMessage({
            type: 'PIP_RESIZE',
            payload: {
              width: pipWindow.innerWidth,
              height: pipWindow.innerHeight
            }
          }, '*');
        }
      }, 50);

      pipWindow.addEventListener('resize', handlePipResize);
      return () => pipWindow.removeEventListener('resize', handlePipResize);
    };

    if (window.documentPictureInPicture && typeof window.documentPictureInPicture.requestWindow === 'function') {
      try {
        const pipOptions = { width: 400, height: 300 };
        const requestedPipWindow = await window.documentPictureInPicture.requestWindow(pipOptions);
        documentPipWindowRef.current = requestedPipWindow;
        setIsPipWindowActive(true);

        const iframe = documentPipWindowRef.current.document.createElement('iframe');
        iframe.src = '/pip-log';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        documentPipWindowRef.current.document.body.style.margin = '0';
        documentPipWindowRef.current.document.body.style.overflow = 'hidden';
        documentPipWindowRef.current.document.body.append(iframe);
        documentPipIframeRef.current = iframe;

        const removeResizeListener = addResizeListener(documentPipWindowRef.current);

        iframe.onload = () => {
          if (documentPipIframeRef.current && documentPipIframeRef.current.contentWindow) {
            documentPipIframeRef.current.contentWindow.postMessage({
              type: 'AI_LOG_DATA',
              payload: {
                historicalResponses: history.filter(item => item.type === 'response' && item.status !== 'error'),
                currentStreamingText: isProcessing ? aiResponseFromStore : '',
                isProcessing: isProcessing,
                sortOrder: aiResponseSortOrder
              }
            }, '*');
          }
        };

        documentPipWindowRef.current.addEventListener('pagehide', () => {
          removeResizeListener();
          setIsPipWindowActive(false);
          documentPipWindowRef.current = null;
          documentPipIframeRef.current = null;
        });

        showSnackbar('Native PiP window opened.', 'success');
        return;

      } catch (err) {
        console.error('Document Picture-in-Picture API error:', err);
        showSnackbar(`Native PiP not available or failed. Trying popup. (${err.message})`, 'warning');
      }
    }

    pipWindowRef.current = window.open('/pip-log', 'AIResponsePiP', 'width=400,height=550,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no,noopener,noreferrer,popup=yes');

    if (pipWindowRef.current) {
      setIsPipWindowActive(true);
      const removeResizeListener = addResizeListener(pipWindowRef.current);

      pipWindowRef.current.onload = () => {
        if (pipWindowRef.current && !pipWindowRef.current.closed) {
          pipWindowRef.current.postMessage({
            type: 'AI_LOG_DATA',
            payload: {
              historicalResponses: history.filter(item => item.type === 'response' && item.status !== 'error'),
              currentStreamingText: isProcessing ? aiResponseFromStore : '',
              isProcessing: isProcessing,
              sortOrder: aiResponseSortOrder
            }
          }, '*');
        }
      };
      const pipCheckInterval = setInterval(() => {
        if (pipWindowRef.current && pipWindowRef.current.closed) {
          clearInterval(pipCheckInterval);
          removeResizeListener();
          setIsPipWindowActive(false);
          pipWindowRef.current = null;
        }
      }, 500);
      if (pipWindowRef.current) pipWindowRef.current._pipIntervalId = pipCheckInterval;
    } else {
      showSnackbar('Failed to open PiP window. Please check popup blocker settings.', 'error');
      setIsPipWindowActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pipWindowRef.current && pipWindowRef.current._pipIntervalId) {
        clearInterval(pipWindowRef.current._pipIntervalId);
      }
      if (documentPipWindowRef.current && typeof documentPipWindowRef.current.close === 'function') {
        try { documentPipWindowRef.current.close(); } catch (e) { /*ignore*/ }
      }
    };
  }, []);

  useEffect(() => {
    let targetWindowForMessage = null;

    if (documentPipWindowRef.current && documentPipIframeRef.current && documentPipIframeRef.current.contentWindow) {
      targetWindowForMessage = documentPipIframeRef.current.contentWindow;
    } else if (pipWindowRef.current && !pipWindowRef.current.closed) {
      targetWindowForMessage = pipWindowRef.current;
    }

    if (isPipWindowActive && targetWindowForMessage) {
      try {
        targetWindowForMessage.postMessage({
          type: 'AI_LOG_DATA',
          payload: {
            historicalResponses: history.filter(item => item.type === 'response' && item.status !== 'error'),
            currentStreamingText: isProcessing ? aiResponseFromStore : '',
            isProcessing: isProcessing,
            sortOrder: aiResponseSortOrder
          }
        }, '*');
      } catch (e) {
        console.warn("Could not post message to PiP window:", e);
      }
    }
  }, [history, aiResponseFromStore, isPipWindowActive, aiResponseSortOrder, isProcessing]);

  return (
    <>
      <Head>
        <title>Interview Copilot - Active Session</title>
      </Head>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <SmartToyIcon sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6" component="div" sx={{ color: 'text.primary', mr: 2 }}>
              Interview Copilot
            </Typography>
            <Chip
              size="small"
              color={operatorState.tone === "default" ? "default" : operatorState.tone}
              label={operatorState.label}
              sx={{ mr: 1 }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Start a new interview session. Clears visible Q&A; audio capture stays on.">
              <span>
                <IconButton color="primary" onClick={resetLiveInterviewSession} aria-label="new interview session">
                  <RestartAltIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="primary" onClick={() => setSettingsOpen(true)} aria-label="settings">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <FormControlLabel
              control={<Switch size="small" checked={debugEnabled} onChange={(event) => setDebugEnabled(event.target.checked)} />}
              label="Debug"
              sx={{ ml: 1, color: 'text.secondary' }}
            />
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2, display: 'flex', flexDirection: 'column' }}>
          <Grid container spacing={2} sx={{ flexGrow: 1 }}>
            {/* Left Panel */}
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card>
                <CardHeader title="System Audio (Interviewer)" avatar={<HearingIcon />} sx={{ pb: 1 }} />
                <CardContent>
                  <FormControlLabel
                    control={<Switch checked={systemAutoMode} onChange={e => setSystemAutoMode(e.target.checked)} color="primary" />}
                    label="Auto-Submit Question"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={transcriptionFromStore}
                    onChange={(e) => handleManualInputChange(e.target.value, 'system')}
                    onKeyDown={(e) => handleKeyPress(e, 'system')}
                    placeholder="Interviewer's speech..."
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      onClick={startSystemAudioRecognition}
                      variant="contained"
                      color={isSystemAudioActive ? 'error' : 'primary'}
                      startIcon={isSystemAudioActive ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                      sx={{ flexGrow: 1 }}
                    >
                      {isSystemAudioActive ? 'Stop System Audio' : 'Record System Audio'}
                    </Button>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', width: '100%' }}>
                      {isSystemAudioActive ? 'Recording system audio...' : 'Select "Chrome Tab" and check "Share audio" when prompted.'}
                    </Typography>
                    <Tooltip title="Clear System Transcription">
                      <IconButton onClick={handleClearSystemTranscription}><DeleteSweepIcon /></IconButton>
                    </Tooltip>
                    {!systemAutoMode && (
                      <Button
                        onClick={() => handleManualSubmit('system')}
                        variant="outlined"
                        color="primary"
                        startIcon={<SendIcon />}
                        disabled={isProcessing || !transcriptionFromStore.trim()}
                      >
                        Submit
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
              <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title="Question History"
                  avatar={<PlaylistAddCheckIcon />}
                  action={
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleCombineAndSubmit}
                      disabled={selectedQuestions.length === 0 || isProcessing}
                      startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    >
                      Ask Combined
                    </Button>
                  }
                  sx={{ pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}
                />
                <CardContent sx={{ flexGrow: 1, overflow: 'hidden', p: 0 }}>
                  <ScrollToBottom className="scroll-to-bottom" followButtonClassName="hidden-follow-button">
                    <List dense sx={{ pt: 0, px: 1 }}>
                      {history.filter(e => e.type === 'question').slice().reverse().map(renderQuestionHistoryItem)}
                    </List>
                  </ScrollToBottom>
                </CardContent>
              </Card>
              {debugEnabled && (
                <Card sx={{ mt: 2 }}>
                  <CardHeader title="Interview Context" sx={{ pb: 0 }} />
                  <CardContent>
                    <Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0 }}>
                      {debugContext ? JSON.stringify(debugContext, null, 2) : 'Submit a question to view sanitized context.'}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Center Panel */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <CardHeader
                  title="AI Assistant Log"
                  avatar={<SmartToyIcon />}
                  action={
                    <>
                      <Tooltip title={isPipWindowActive ? "Close PiP Log" : "Open PiP Log"}>
                        <IconButton onClick={togglePipWindow} size="small" color={isPipWindowActive ? "secondary" : "default"}>
                          <PictureInPictureAltIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={aiResponseSortOrder === 'newestAtTop' ? "Sort: Newest at Bottom" : "Sort: Newest on Top"}>
                        <IconButton onClick={handleSortOrderToggle} size="small">
                          {aiResponseSortOrder === 'newestAtTop' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                        </IconButton>
                      </Tooltip>
                      <Typography variant="caption" sx={{ mr: 1, fontStyle: 'italic' }}>
                        {aiResponseSortOrder === 'newestAtTop' ? "Newest First" : "Oldest First"}
                      </Typography>
                      <FormControlLabel
                        control={<Switch checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} color="primary" />}
                        label="Auto Scroll"
                        sx={{ ml: 1 }}
                      />
                    </>
                  }
                  sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
                />
                <CardContent sx={{ flexGrow: 1, overflow: 'hidden', p: 0 }}>
                  <ScrollToBottom
                    className="scroll-to-bottom"
                    mode={autoScroll ? (aiResponseSortOrder === 'newestAtTop' ? "top" : "bottom") : undefined}
                    followButtonClassName="hidden-follow-button"
                  >
                    <List sx={{ px: 2, py: 1 }}>
                      {getAiResponsesToDisplay().map(renderHistoryItem)}
                      {isProcessing && (
                        <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                          <Typography variant="caption" sx={{ ml: 1 }}>{operatorState.label}</Typography>
                        </ListItem>
                      )}
                      {!isProcessing && generationError && (
                        <ListItem sx={{ justifyContent: 'center', py: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={retryLastAsk}
                          >
                            Retry
                          </Button>
                        </ListItem>
                      )}
                    </List>
                  </ScrollToBottom>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Panel */}
            <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <CardHeader title="Your Mic (Candidate)" avatar={<PersonIcon />} sx={{ pb: 1 }} />
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <FormControlLabel
                    control={<Switch checked={isManualMode} onChange={e => setIsManualMode(e.target.checked)} color="primary" />}
                    label="Manual Input Mode"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    variant="outlined"
                    value={micTranscription}
                    onChange={(e) => handleManualInputChange(e.target.value, 'microphone')}
                    onKeyDown={(e) => handleKeyPress(e, 'microphone')}
                    placeholder="Your speech or manual input..."
                    sx={{ mb: 2, flexGrow: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                    <Button
                      onClick={startMicrophoneRecognition}
                      variant="contained"
                      color={isMicrophoneActive ? 'error' : 'primary'}
                      startIcon={isMicrophoneActive ? <MicOffIcon /> : <MicIcon />}
                      sx={{ flexGrow: 1 }}
                    >
                      {isMicrophoneActive ? 'Stop Mic' : 'Start Mic'}
                    </Button>
                    <Tooltip title="Clear Your Transcription">
                      <IconButton onClick={handleClearMicTranscription}><DeleteSweepIcon /></IconButton>
                    </Tooltip>
                    {isManualMode && (
                      <Button
                        onClick={() => handleManualSubmit('microphone')}
                        variant="outlined"
                        color="primary"
                        startIcon={<SendIcon />}
                        disabled={isProcessing || !micTranscription.trim()}
                      >
                        Submit
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSettingsSaved}
        />
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%', boxShadow: theme.shadows[6] }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
      <style jsx global>{`
        .scroll-to-bottom {
          height: 100%;
          width: 100%;
          overflow-y: auto;
        }
        .hidden-follow-button {
          display: none;
        }
        .scroll-to-bottom::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scroll-to-bottom::-webkit-scrollbar-track {
          background: ${theme.palette.background.paper};
          border-radius: 10px;
        }
        .scroll-to-bottom::-webkit-scrollbar-thumb {
          background-color: ${theme.palette.grey[400]};
          border-radius: 10px;
          border: 2px solid ${theme.palette.background.paper};
        }
        .scroll-to-bottom::-webkit-scrollbar-thumb:hover {
          background-color: ${theme.palette.grey[500]};
        }
        .scroll-to-bottom {
          scrollbar-width: thin;
          scrollbar-color: ${theme.palette.grey[400]} ${theme.palette.background.paper};
        }
      `}</style>
    </>
  );
}