import React, { useState, useCallback, useRef } from 'react';
import { Language } from './types';
import { LANGUAGES } from './constants';
import { translateText, getPronunciation } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audio';
import SwapIcon from './components/icons/SwapIcon';
import CopyIcon from './components/icons/CopyIcon';
import CheckIcon from './components/icons/CheckIcon';
import SpeakerIcon from './components/icons/SpeakerIcon';
import SpinnerIcon from './components/icons/SpinnerIcon';


const App: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<Language>(Language.ENGLISH);
  const [targetLang, setTargetLang] = useState<Language>(Language.TAGALOG);
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [pronouncing, setPronouncing] = useState<'source' | 'target' | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }
    if (sourceLang === targetLang) {
        setError("Source and target languages cannot be the same.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setOutputText('');

    try {
      const translated = await translateText(inputText, sourceLang, targetLang);
      setOutputText(translated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, sourceLang, targetLang]);

  const handleSwapLanguages = () => {
    if (sourceLang === targetLang) return;
    const currentSource = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(currentSource);
    
    const currentInput = inputText;
    setInputText(outputText);
    setOutputText(currentInput);
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handlePronounce = async (text: string, type: 'source' | 'target') => {
    if (!text.trim() || pronouncing) return;

    if (!audioCtxRef.current) {
        // Fix: Cast window to any to access webkitAudioContext for broader browser support.
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const audioCtx = audioCtxRef.current;

    setPronouncing(type);
    setError(null);

    try {
        const base64Audio = await getPronunciation(text);
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
        source.onended = () => {
            setPronouncing(null);
        };
    } catch (err) {
        setError((err as Error).message);
        setPronouncing(null);
    }
  };


  const handleSourceLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    if (newLang === targetLang) {
      setTargetLang(sourceLang);
    }
    setSourceLang(newLang);
  };

  const handleTargetLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
     if (newLang === sourceLang) {
      setSourceLang(targetLang);
    }
    setTargetLang(newLang);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-sky-400">Translator App</h1>
          <p className="text-slate-400 mt-2 text-lg">English • Tagalog • Aklanon</p>
        </header>

        <main className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-start">
            {/* Source Language Column */}
            <div className="flex flex-col h-full">
              <select
                value={sourceLang}
                onChange={handleSourceLangChange}
                className="bg-slate-700 text-white p-3 rounded-lg mb-4 w-full focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
              <div className="relative w-full h-48 md:h-64 flex-grow">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text to translate..."
                  className="w-full h-full bg-slate-900 text-slate-200 p-4 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                />
                {inputText && (
                  <button 
                    onClick={() => handlePronounce(inputText, 'source')}
                    disabled={!!pronouncing}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition"
                    aria-label="Pronounce source text"
                  >
                    {pronouncing === 'source' ? <SpinnerIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
            
            {/* Swap Button */}
            <div className="flex items-center justify-center h-full pt-14">
              <button
                onClick={handleSwapLanguages}
                className="p-3 rounded-full bg-slate-700 text-sky-400 hover:bg-sky-500 hover:text-white transition-all duration-300 transform hover:rotate-180 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500"
                aria-label="Swap languages"
              >
                <SwapIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Target Language Column */}
            <div className="flex flex-col h-full">
              <select
                value={targetLang}
                onChange={handleTargetLangChange}
                className="bg-slate-700 text-white p-3 rounded-lg mb-4 w-full focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
              <div className="relative w-full h-48 md:h-64 flex-grow">
                <textarea
                  value={outputText}
                  readOnly
                  placeholder="Translation will appear here..."
                  className="w-full h-full bg-slate-900 text-slate-200 p-4 rounded-lg resize-none cursor-default"
                />
                {outputText && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button 
                      onClick={() => handlePronounce(outputText, 'target')}
                      disabled={!!pronouncing}
                      className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition"
                      aria-label="Pronounce translated text"
                    >
                      {pronouncing === 'target' ? <SpinnerIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={handleCopy}
                      className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
                      aria-label="Copy translated text"
                    >
                      {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleTranslate}
              disabled={isLoading || !inputText.trim()}
              className="px-8 py-4 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="mr-3" />
                  Translating...
                </>
              ) : (
                'Translate'
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;