import React, { useState } from 'react';
import {
  ArrowLeftRight,
  BookMarked,
  Check,
  Copy,
  ExternalLink,
  FileText,
  History,
  Layers,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  CONTEXT_MODE_LABELS,
  GlossaryEntry,
  LanguageCode,
  TranslationComparisonResult,
  TranslationContextMode,
  WordBreakdownItem,
} from '../lib/sundaData';
import { translateWithMultiEngine } from '../lib/engine';

export interface SavedTranslationRecord {
  id: string;
  timestamp: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  contextMode: TranslationContextMode;
  sourceText: string;
  translatedText: string;
  favorite: boolean;
}

interface TranslatorViewProps {
  glossary: GlossaryEntry[];
  savedVocabIds: string[];
  onSaveWordToQuest: (item: WordBreakdownItem) => void;
  onGainXp: (amount: number, reason: string) => void;
  onOpenAiTutorWithSentence: (sentence: string) => void;
}

const SAMPLE_SENTENCES: { label: string; text: string; src: LanguageCode; tgt: LanguageCode; ctx: TranslationContextMode }[] = [
  {
    label: 'Contoh 1: Tujuan Belajar Budaya',
    text: 'Saya ingin belajar Bahasa Sunda karena saya ingin mengenal budaya Sunda.',
    src: 'id',
    tgt: 'su',
    ctx: 'guru',
  },
  {
    label: 'Contoh 2: Berangkat Sekolah',
    text: 'Saya akan pergi ke sekolah bersama teman.',
    src: 'id',
    tgt: 'su',
    ctx: 'teman_sebaya',
  },
  {
    label: 'Contoh 3: Makan di Rumah vs Kantin',
    text: 'Saya sudah makan di rumah sebelum pergi ke sekolah.',
    src: 'id',
    tgt: 'su',
    ctx: 'orang_tua',
  },
  {
    label: 'Contoh 4: Bertanya Tugas kepada Guru',
    text: 'Saya ingin bertanya mengenai tugas Bahasa Sunda hari ini.',
    src: 'id',
    tgt: 'su',
    ctx: 'guru',
  },
];

const LANG_NAMES: Record<LanguageCode, string> = {
  id: 'Bahasa Indonesia (id)',
  su: 'Basa Sunda (su)',
  en: 'English — Pengayaan (en)',
};

export const TranslatorView: React.FC<TranslatorViewProps> = ({
  glossary,
  savedVocabIds,
  onSaveWordToQuest,
  onGainXp,
  onOpenAiTutorWithSentence,
}) => {
  const [sourceLang, setSourceLang] = useState<LanguageCode>('id');
  const [targetLang, setTargetLang] = useState<LanguageCode>('su');
  const [contextMode, setContextMode] = useState<TranslationContextMode>('guru');
  const [sourceText, setSourceText] = useState<string>(
    'Saya ingin belajar Bahasa Sunda karena saya ingin mengenal budaya Sunda.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [result, setResult] = useState<TranslationComparisonResult>(() =>
    translateWithMultiEngine(
      'Saya ingin belajar Bahasa Sunda karena saya ingin mengenal budaya Sunda.',
      'id',
      'su',
      'guru',
      glossary
    )
  );

  // Translation Learning Mode state (5.6)
  const [learningModeActive, setLearningModeActive] = useState<boolean>(false);
  const [hideTranslationForRecall, setHideTranslationForRecall] = useState<boolean>(false);
  const [studentRecallAttempt, setStudentRecallAttempt] = useState<string>('');
  const [recallFeedback, setRecallFeedback] = useState<string | null>(null);

  // History state (5.8)
  const [history, setHistory] = useState<SavedTranslationRecord[]>([
    {
      id: 'hist-1',
      timestamp: '10 Nov 2026 · 08:15',
      sourceLang: 'id',
      targetLang: 'su',
      contextMode: 'guru',
      sourceText: 'Saya ingin belajar Bahasa Sunda karena saya ingin mengenal budaya Sunda.',
      translatedText:
        'Abdi hoyong diajar basa Sunda margi abdi hoyong mikawanoh budaya Sunda kalayan langkung jero.',
      favorite: true,
    },
  ]);
  const [historyFilter, setHistoryFilter] = useState<string>('');

  // Document translation helper (5.9)
  const [docFilename, setDocFilename] = useState<string | null>(null);

  const handleTranslate = async (
    overrideText?: string,
    overrideSrc?: LanguageCode,
    overrideTgt?: LanguageCode,
    overrideCtx?: TranslationContextMode
  ) => {
    const textToUse = overrideText !== undefined ? overrideText : sourceText;
    const srcToUse = overrideSrc || sourceLang;
    const tgtToUse = overrideTgt || targetLang;
    const ctxToUse = overrideCtx || contextMode;

    if (!textToUse.trim()) {
      setValidationError('Masukkan kalimat yang ingin diterjemahkan terlebih dahulu.');
      return;
    }
    setValidationError(null);

    // Zero-latency deterministic multi-engine update first
    const instantResult = translateWithMultiEngine(
      textToUse.trim(),
      srcToUse,
      tgtToUse,
      ctxToUse,
      glossary
    );
    setResult(instantResult);
    addHistoryItem(
      textToUse.trim(),
      instantResult.primaryTranslation,
      srcToUse,
      tgtToUse,
      ctxToUse
    );
    onGainXp(15, 'Menggunakan Perbandingan Terjemahan Kontekstual');

    setIsLoading(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToUse.trim(),
          sourceLang: srcToUse,
          targetLang: tgtToUse,
          contextMode: ctxToUse,
          customGlossary: glossary,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as TranslationComparisonResult;
        setResult(data);
      }
    } catch {
      // Instant result already displayed
    } finally {
      setIsLoading(false);
    }
  };

  const addHistoryItem = (
    srcTxt: string,
    tgtTxt: string,
    sLang: LanguageCode,
    tLang: LanguageCode,
    ctx: TranslationContextMode
  ) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.sourceText !== srcTxt);
      return [
        {
          id: `hist-${Date.now()}`,
          timestamp: 'Baru saja',
          sourceLang: sLang,
          targetLang: tLang,
          contextMode: ctx,
          sourceText: srcTxt,
          translatedText: tgtTxt,
          favorite: false,
        },
        ...filtered,
      ].slice(0, 12);
    });
  };

  const handleSwapLanguages = () => {
    const nextSrc = targetLang;
    const nextTgt = sourceLang;
    const nextText = result.primaryTranslation || sourceText;
    setSourceLang(nextSrc);
    setTargetLang(nextTgt);
    setSourceText(nextText);
    handleTranslate(nextText, nextSrc, nextTgt, contextMode);
  };

  const handleSpeak = (text: string, lang: LanguageCode) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'id-ID';
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (content.trim()) {
        const snippet = content.slice(0, 600);
        setSourceText(snippet);
        handleTranslate(snippet, sourceLang, targetLang, contextMode);
      }
    };
    reader.readAsText(file);
  };

  const checkStudentRecall = () => {
    if (!studentRecallAttempt.trim()) {
      setRecallFeedback('Tuliskan kalimat hasil ingatanmu terlebih dahulu.');
      return;
    }
    const targetWords = result.primaryTranslation
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .split(/\s+/);
    const attemptWords = studentRecallAttempt
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .split(/\s+/);
    const matched = targetWords.filter((w) => attemptWords.includes(w)).length;
    const ratio = targetWords.length > 0 ? matched / targetWords.length : 0;

    if (ratio >= 0.7) {
      setRecallFeedback(
        `Sae pisan! Kamu berhasil mengingat ${matched} dari ${targetWords.length} kata kunci secara tepat (+20 XP).`
      );
      onGainXp(20, 'Menyelesaikan Latihan Tulis Ulang Tanpa Melihat Terjemahan');
      setHideTranslationForRecall(false);
    } else {
      setRecallFeedback(
        `Sudah cukup baik (${matched}/${targetWords.length} kata cocok). Bandingkan lagi pilihan kata ganti dan verba lemes/lomanya: "${result.primaryTranslation}"`
      );
      setHideTranslationForRecall(false);
    }
  };

  const filteredHistory = history.filter(
    (h) =>
      h.sourceText.toLowerCase().includes(historyFilter.toLowerCase()) ||
      h.translatedText.toLowerCase().includes(historyFilter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#059669] mb-1">
              Fitur Inti 01 · Arsitektur Multi-Mesin Mandiri (Independent from Writing Lab)
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
              BABATURAN Translator — Tarjamahkeun, Pahami, Diajar!
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Menerjemahkan Bahasa Sunda, Indonesia, dan Inggris dengan membandingkan hasil mesin penerjemah (Google Cloud NMT Adapter) dan analisis Undak-Usuk Basa kontekstual BABATURAN.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Terjemahkan Dokumen (.txt)</span>
              <input
                type="file"
                accept=".txt,.md"
                onChange={handleDocumentUpload}
                className="sr-only"
                aria-label="Unggah dokumen teks untuk diterjemahkan"
              />
            </label>
            <button
              type="button"
              onClick={() => setLearningModeActive((v) => !v)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                learningModeActive
                  ? 'bg-[#059669] text-white'
                  : 'bg-emerald-50 text-[#065F46] hover:bg-emerald-100'
              }`}
            >
              {learningModeActive ? 'Mode Belajar Aktif' : 'Aktifkan Translation Learning Mode'}
            </button>
          </div>
        </div>

        {docFilename && (
          <p className="mt-3 text-xs text-slate-600">
            Dokumen dimuat: <span className="font-medium text-slate-900">{docFilename}</span> · Paragraf dipertahankan secara berurutan (catatan: PDF hasil scan memerlukan OCR terpisah).
          </p>
        )}

        {/* Quick Sample Sentences */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Coba Kalimat Cepat:</span>
          {SAMPLE_SENTENCES.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setSourceLang(sample.src);
                setTargetLang(sample.tgt);
                setContextMode(sample.ctx);
                setSourceText(sample.text);
                handleTranslate(sample.text, sample.src, sample.tgt, sample.ctx);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Translator Dual-Pane Workspace */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Controls Row: Source Lang, Swap, Target Lang, Context Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label
              htmlFor="source-lang-select"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Bahasa Sumber
            </label>
            <select
              id="source-lang-select"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as LanguageCode)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              {Object.entries(LANG_NAMES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapLanguages}
              aria-label="Tukar bahasa sumber dan tujuan"
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="target-lang-select"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Bahasa Tujuan
            </label>
            <select
              id="target-lang-select"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as LanguageCode)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              {Object.entries(LANG_NAMES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="context-mode-select"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Konteks Komunikasi (Undak-Usuk Basa)
            </label>
            <select
              id="context-mode-select"
              value={contextMode}
              onChange={(e) => {
                const nextCtx = e.target.value as TranslationContextMode;
                setContextMode(nextCtx);
                handleTranslate(sourceText, sourceLang, targetLang, nextCtx);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-emerald-50/70 border border-emerald-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#059669]"
            >
              {Object.entries(CONTEXT_MODE_LABELS).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label} — {info.registerHint}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input & Output Text Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Textarea */}
          <div className="flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Teks Sumber ({sourceLang.toUpperCase()})</span>
                <span>{sourceText.length} karakter</span>
              </div>
              <label htmlFor="translator-source-input" className="sr-only">
                Teks Sumber Penerjemah
              </label>
              <textarea
                id="translator-source-input"
                rows={4}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Ketik kalimat Bahasa Indonesia, Sunda, atau Inggris..."
                className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {validationError && (
              <p className="text-xs text-red-600 mt-2" role="alert">
                {validationError}
              </p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSpeak(sourceText, sourceLang)}
                  aria-label="Dengarkan teks sumber"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSourceText('');
                    setValidationError(null);
                  }}
                  aria-label="Hapus teks sumber"
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTranslate()}
                disabled={isLoading}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap"
              >
                {isLoading ? 'Menerjemahkan...' : 'Terjemahkan & Bandingkan'}
              </button>
            </div>
          </div>

          {/* Primary Output Box */}
          <div className="flex flex-col justify-between bg-[#ECFDF5]/60 border border-emerald-200 rounded-xl p-4">
            <div>
              <div className="flex items-center justify-between text-xs text-[#065F46] mb-2">
                <span>
                  Hasil Utama ({targetLang.toUpperCase()}) · {CONTEXT_MODE_LABELS[contextMode].registerHint}
                </span>
                {result.needsVerification && (
                  <span className="text-amber-700 font-medium">
                    Perlu Diperiksa Kembali (Pengayaan Inggris)
                  </span>
                )}
              </div>

              {hideTranslationForRecall ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Hasil terjemahan disembunyikan untuk latihan menulis ulang mandiri!
                  </p>
                  <button
                    type="button"
                    onClick={() => setHideTranslationForRecall(false)}
                    className="text-xs font-semibold text-[#059669] underline"
                  >
                    Tampilkan Kembali Hasil Terjemahan
                  </button>
                </div>
              ) : (
                <>
                  <p
                    className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed"
                    data-testid="primary-translation-output"
                  >
                    {result.primaryTranslation}
                  </p>
                  <p className="text-xs text-slate-600 mt-3">
                    Arti Bahasa Indonesia: <span className="text-slate-800 font-medium">{result.literalMeaningId}</span>
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSpeak(result.primaryTranslation, targetLang)}
                  aria-label="Dengarkan hasil terjemahan"
                  className="p-2 text-[#065F46] hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(result.primaryTranslation)}
                  aria-label="Salin hasil terjemahan"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#065F46] hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onOpenAiTutorWithSentence(result.primaryTranslation)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#065F46] bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analisis Lebih Lanjut di AI Tutor</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRIORITY 3 INNOVATION: Fitur Perbandingan Hasil Terjemahan & Mengapa Pilihan Bahasa Itu Digunakan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-medium text-[#059669]">
              Inovasi Prioritas · Perbandingan Mesin Penerjemah vs Undak-Usuk Basa
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Perbandingan Hasil Terjemahan & Alasan Pemilihan Kosakata
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Machine Translation · AI Explanation · Alternative Registers
          </span>
        </div>

        {/* 3 Register Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-[#059669] mb-1">
                01. Ragam Basa Hormat / Lemes (Kepada Guru & Orang Tua)
              </p>
              <p className="text-base font-semibold text-slate-900 leading-snug mt-2">
                "{result.registerVariants.lemesGuru.text}"
              </p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {result.registerVariants.lemesGuru.explanation}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContextMode('guru')}
              className="mt-4 self-start text-xs font-semibold text-[#059669] hover:underline"
            >
              Gunakan Versi Lemes Ini
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1">
                02. Ragam Basa Loma (Kepada Teman Sebaya / Akrab)
              </p>
              <p className="text-base font-semibold text-slate-900 leading-snug mt-2">
                "{result.registerVariants.lomaTeman.text}"
              </p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {result.registerVariants.lomaTeman.explanation}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setContextMode('teman_sebaya')}
              className="mt-4 self-start text-xs font-semibold text-amber-700 hover:underline"
            >
              Gunakan Versi Loma Ini
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">
                03. Hasil Mesin Penerjemah Umum (Google Cloud NMT Adapter)
              </p>
              <p className="text-base font-semibold text-slate-900 leading-snug mt-2">
                "{result.registerVariants.neutralFormal.text}"
              </p>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {result.registerVariants.neutralFormal.explanation}
              </p>
            </div>
            <span className="mt-4 text-xs text-slate-500">
              Label: Machine Translation (Tanpa Filter Konteks Lawan Bicara)
            </span>
          </div>
        </div>

        {/* Mengapa Pilihan Bahasa Itu Digunakan? */}
        <div className="bg-[#FFFBEB] border border-amber-200 rounded-xl p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Mengapa Pilihan Kosakata Ini Digunakan? (Penjelasan Pedagogis BABATURAN)
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed list-disc pl-4">
            {result.whyThisChoice.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-600 pt-2 border-t border-amber-200/60">
            <span className="font-semibold text-slate-800">Struktur Kalimat:</span>{' '}
            {result.sentenceStructureNote}
          </p>
        </div>

        {/* Multi-Provider Adapter Status (Priority 1) */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#059669]" />
            <h3 className="text-sm font-semibold text-slate-900">
              Status Mesin Penerjemah Aktif (100% Berfungsi Tanpa API Key Eksternal Tambahan)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.providers.map((prov) => (
              <div
                key={prov.providerId}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{prov.providerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {prov.badgeLabel} · {prov.registerUsed}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {prov.confidenceNote}
                  </p>
                </div>
                {prov.externalUrl && (
                  <a
                    href={prov.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669] hover:underline"
                  >
                    <span>Buka SundaDigi Translator Resmi</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Translation Learning Mode (5.6) */}
      {learningModeActive && (
        <div className="bg-white border border-emerald-300 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-[#059669]">
                5.6 Translation Learning Mode · Belajar Aktif dari Hasil Terjemahan
              </p>
              <h2 className="text-lg font-bold text-slate-900">
                Latihan Tulis Ulang Mandiri Tanpa Melihat Hasil Terjemahan
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setHideTranslationForRecall(true);
                setRecallFeedback(null);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              Sembunyikan Hasil & Mulai Uji Ingatan
            </button>
          </div>

          <p className="text-xs text-slate-600">
            Langkah Belajar: (1) Baca terjemahan di atas · (2) Pahami kosakata pada tabel per kata · (3) Klik tombol sembunyikan, lalu ketik ulang kalimat Bahasa Sundanya di bawah ini:
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={studentRecallAttempt}
              onChange={(e) => setStudentRecallAttempt(e.target.value)}
              placeholder="Ketik ulang kalimat Bahasa Sunda dari ingatanmu..."
              aria-label="Ketik ulang kalimat Bahasa Sunda dari ingatan"
              className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
            <button
              type="button"
              onClick={checkStudentRecall}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap"
            >
              Periksa Tulisan Saya
            </button>
          </div>

          {recallFeedback && (
            <p className="text-xs font-medium text-[#065F46] bg-emerald-50 p-3 rounded-lg">
              {recallFeedback}
            </p>
          )}
        </div>
      )}

      {/* Word-by-Word Breakdown & Vocabulary Extraction (5.4 & 5.7) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Analisis Kosakata Per Kata (Word-by-Word Translator)
            </h2>
            <p className="text-xs text-slate-600">
              Klik "Simpan ke Kosakata" untuk menambahkan kata ke koleksi pribadi dan melatihnya di Kandaga Kecap.
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {result.wordByWord.length} kata dianalisis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 pr-4">Kata</th>
                <th className="py-3 px-4">Arti</th>
                <th className="py-3 px-4">Ragam Basa & Kelas Kata</th>
                <th className="py-3 px-4">Alternatif Ungkapan</th>
                <th className="py-3 px-4">Keterangan Konteks</th>
                <th className="py-3 pl-4 text-right">Koleksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {result.wordByWord.map((item) => {
                const isSaved = savedVocabIds.includes(item.word.toLowerCase());
                return (
                  <tr key={item.word} className="hover:bg-slate-50/80">
                    <td className="py-3 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                      {item.word}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{item.meaning}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {item.register} · {item.partOfSpeech}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{item.alternatives}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">{item.note}</td>
                    <td className="py-3 pl-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSaveWordToQuest(item)}
                        disabled={isSaved}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          isSaved
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-[#065F46] hover:bg-emerald-100'
                        }`}
                      >
                        <BookMarked className="w-3.5 h-3.5" />
                        <span>{isSaved ? 'Tersimpan' : 'Simpan ke Kosakata'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Translation History (5.8) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Riwayat Terjemahan Pribadi Siswa
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              placeholder="Cari riwayat terjemahan..."
              aria-label="Cari riwayat terjemahan"
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
              >
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">
            Belum ada riwayat terjemahan yang cocok.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((h) => (
              <div
                key={h.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="text-xs text-slate-500">
                    {h.sourceLang.toUpperCase()} → {h.targetLang.toUpperCase()} ·{' '}
                    {CONTEXT_MODE_LABELS[h.contextMode].label} · {h.timestamp}
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{h.sourceText}</p>
                  <p className="text-sm font-semibold text-[#065F46]">{h.translatedText}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceLang(h.sourceLang);
                      setTargetLang(h.targetLang);
                      setContextMode(h.contextMode);
                      setSourceText(h.sourceText);
                      handleTranslate(h.sourceText, h.sourceLang, h.targetLang, h.contextMode);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Muat Ulang
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
