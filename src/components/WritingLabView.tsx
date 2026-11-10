import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  Unlock,
} from 'lucide-react';
import {
  canUseAiInWritingLab,
  canUseTranslatorInWritingLab,
  countWords,
  evaluateWritingRubric,
  generateDraftComparison,
  submitDraft1ToStage2,
  totalRubricScore,
  translateWithMultiEngine,
  WritingLabAssignment,
  WritingLabSessionState,
} from '../lib/engine';
import {
  GlossaryEntry,
  STUDENT_REFLECTION_QUESTIONS,
  WritingLabStage,
} from '../lib/sundaData';

interface WritingLabViewProps {
  assignment: WritingLabAssignment;
  session: WritingLabSessionState;
  glossary: GlossaryEntry[];
  onUpdateSession: (next: WritingLabSessionState) => void;
  onGainXp: (amount: number, reason: string) => void;
}

const STAGE_STEPS: {
  stage: WritingLabStage;
  stepLabel: string;
  title: string;
  subtitle: string;
}[] = [
  {
    stage: 'STAGE_1_DRAFT_1',
    stepLabel: 'Tahap 1',
    title: 'Draft 1 — Independent Writing',
    subtitle: 'Menulis sendiri tanpa AI atau translator',
  },
  {
    stage: 'STAGE_2_ASSISTANCE',
    stepLabel: 'Tahap 2',
    title: 'Translator + AI Assistance',
    subtitle: 'Memahami kosakata & alternatif kalimat',
  },
  {
    stage: 'STAGE_3_COMPARISON',
    stepLabel: 'Tahap 3',
    title: 'AI Version Comparison',
    subtitle: 'Bandingkan Draft 1 vs versi alternatif AI',
  },
  {
    stage: 'STAGE_4_DRAFT_2',
    stepLabel: 'Tahap 4',
    title: 'Draft 2 — Independent Revision',
    subtitle: 'Menulis ulang berdasarkan keputusan sendiri',
  },
  {
    stage: 'STAGE_5_ASSESSMENT_REFLECTION',
    stepLabel: 'Assessment & Reflection',
    title: 'Rubrik Setara & Refleksi Siswa',
    subtitle: 'Evaluasi Draft 1 vs Draft 2 & refleksi',
  },
];

export const WritingLabView: React.FC<WritingLabViewProps> = ({
  assignment,
  session,
  glossary,
  onUpdateSession,
  onGainXp,
}) => {
  const [draft1Input, setDraft1Input] = useState<string>(session.draft1Text);
  const [draft2Input, setDraft2Input] = useState<string>(session.draft2Text);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backendLockNotice, setBackendLockNotice] = useState<string | null>(null);

  // Stage 2 Assistance inputs
  const [transQuery, setTransQuery] = useState<string>(
    'Saya merasa senang bertemu teman baru dan guru di sekolah.'
  );
  const [transResultText, setTransResultText] = useState<string | null>(null);
  const [aiAssistQuery, setAiAssistQuery] = useState<string>(
    'Apakah kata "tuang" boleh dipakai untuk "abdi" dalam kalimat makan di kantin?'
  );
  const [aiAssistReply, setAiAssistReply] = useState<string | null>(null);
  const [isAssisting, setIsAssisting] = useState<boolean>(false);

  const translatorAccess = canUseTranslatorInWritingLab(
    session.currentStage,
    session.policyMode
  );
  const aiAccess = canUseAiInWritingLab(session.currentStage, session.policyMode);

  const currentStageIndex = STAGE_STEPS.findIndex(
    (s) => s.stage === session.currentStage
  );

  const canNavigateToStage = (targetStage: WritingLabStage): boolean => {
    if (targetStage === 'STAGE_1_DRAFT_1') return true;
    if (!session.draft1Locked) return false;
    if (targetStage === 'STAGE_2_ASSISTANCE' || targetStage === 'STAGE_3_COMPARISON') {
      return true;
    }
    if (targetStage === 'STAGE_4_DRAFT_2') {
      return Boolean(session.aiComparisonText);
    }
    if (targetStage === 'STAGE_5_ASSESSMENT_REFLECTION') {
      return Boolean(session.draft2SubmittedAt);
    }
    return false;
  };

  // Verify backend lock enforcement in Stage 1
  const handleVerifyBackendLock = async () => {
    try {
      const res = await fetch('/api/writing-lab/check-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writingLabStage: session.currentStage,
          writingLabPolicy: session.policyMode,
        }),
      });
      const data = (await res.json()) as {
        translatorAllowed?: boolean;
        enforcedHttpCodeOnBypass?: number;
        reason?: string;
      };
      if (!data.translatorAllowed) {
        setBackendLockNotice(
          `Proteksi Backend Terverifikasi (HTTP ${data.enforcedHttpCodeOnBypass}): ${data.reason}`
        );
      } else {
        setBackendLockNotice('Akses diizinkan sesuai kebijakan Mode C guru.');
      }
    } catch {
      setBackendLockNotice(`Proteksi Aktif: ${translatorAccess.reason}`);
    }
  };

  const handleSubmitDraft1 = () => {
    setErrorMsg(null);
    const result = submitDraft1ToStage2(
      session,
      draft1Input,
      assignment.minWords,
      new Date().toLocaleString('id-ID')
    );
    if (!result.ok) {
      setErrorMsg(result.error || 'Draft 1 belum memenuhi syarat.');
      return;
    }
    onUpdateSession(result.nextState);
    onGainXp(40, 'Menyelesaikan Draft 1 Mandiri (Independent Writing)');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunTranslationAssistance = async () => {
    if (!transQuery.trim()) return;
    setIsAssisting(true);
    try {
      const comp = translateWithMultiEngine(
        transQuery.trim(),
        'id',
        'su',
        'tugas_sekolah',
        glossary
      );
      const summary = `Lemes: "${comp.registerVariants.lemesGuru.text}" · Loma: "${comp.registerVariants.lomaTeman.text}"`;
      setTransResultText(summary);
      onUpdateSession({
        ...session,
        assistanceLogs: [
          {
            id: `log-tr-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            type: 'TRANSLATION_ASSISTANCE',
            query: transQuery.trim(),
            responseSummary: summary,
          },
          ...session.assistanceLogs,
        ],
      });
      onGainXp(10, 'Mencatat Eksplorasi Kosakata di Tahap 2 Writing Lab');
    } finally {
      setIsAssisting(false);
    }
  };

  const handleRunAiAssistance = async () => {
    if (!aiAssistQuery.trim()) return;
    setIsAssisting(true);
    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: aiAssistQuery.trim(),
          actionType: 'explain',
          writingLabStage: session.currentStage,
          writingLabPolicy: session.policyMode,
        }),
      });
      let replyText =
        'Dalam ragam lemes untuk diri sendiri ("abdi"), gunakan "neda" (makan), "mios" (berangkat), dan "wangsul" (pulang). Kata "tuang", "angkat", dan "mulih" adalah ragam lemes untuk menghormati orang lain.';
      if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        if (data.reply) replyText = data.reply;
      }
      setAiAssistReply(replyText);
      onUpdateSession({
        ...session,
        assistanceLogs: [
          {
            id: `log-ai-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            type: 'AI_WRITING_ASSISTANCE',
            query: aiAssistQuery.trim(),
            responseSummary: replyText.slice(0, 180) + '...',
          },
          ...session.assistanceLogs,
        ],
      });
      onGainXp(10, 'Meminta Penjelasan Undak-Usuk pada Tahap 2 Writing Lab');
    } finally {
      setIsAssisting(false);
    }
  };

  const handleGenerateStage3Comparison = async () => {
    const comp = generateDraftComparison(
      session.draft1Text,
      assignment.targetRegister
    );
    onUpdateSession({
      ...session,
      currentStage: 'STAGE_3_COMPARISON',
      aiComparisonText: comp.aiVersionText,
      aiComparisonGeneratedAt: new Date().toLocaleString('id-ID'),
      revisionSuggestions:
        session.revisionSuggestions.length > 0
          ? session.revisionSuggestions
          : comp.suggestions,
    });
    onGainXp(25, 'Membuka Tahap 3 Perbandingan Tulisan dengan Versi Alternatif AI');
  };

  const handleDecisionChange = (
    id: string,
    decision: 'accepted' | 'rejected',
    studentReason?: string
  ) => {
    const updated = session.revisionSuggestions.map((item) =>
      item.id === id
        ? {
            ...item,
            decision,
            studentReason:
              studentReason !== undefined ? studentReason : item.studentReason,
          }
        : item
    );
    onUpdateSession({
      ...session,
      revisionSuggestions: updated,
    });
  };

  const handleSubmitDraft2 = () => {
    setErrorMsg(null);
    const words = countWords(draft2Input);
    if (words < assignment.minWords) {
      setErrorMsg(
        `Draft 2 minimal terdiri atas ${assignment.minWords} kata (saat ini: ${words} kata).`
      );
      return;
    }
    const score1 = evaluateWritingRubric(session.draft1Text);
    const score2 = evaluateWritingRubric(draft2Input.trim());

    onUpdateSession({
      ...session,
      draft2Text: draft2Input.trim(),
      draft2SubmittedAt: new Date().toLocaleString('id-ID'),
      draft1Rubric: score1,
      draft2Rubric: score2,
      currentStage: 'STAGE_5_ASSESSMENT_REFLECTION',
    });
    onGainXp(50, 'Menyelesaikan Draft 2 Revisi Mandiri & Evaluasi Rubrik');
  };

  const handleSaveReflection = () => {
    onUpdateSession({
      ...session,
      reflectionSubmittedAt: new Date().toLocaleString('id-ID'),
    });
    onGainXp(30, 'Menyelesaikan Refleksi Pembelajaran Menulis');
  };

  return (
    <div className="space-y-8">
      {/* Header & Research Inquiry Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#059669]">
              Fitur Inti 02 · Alur Terpisah dari Penerjemah Biasa (5-Stage Pedagogical Workflow)
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              BABATURAN Writing Lab — Tulis, Bandingkeun, Revisi!
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Dirancang khusus untuk mendokumentasikan perkembangan menulis mandiri siswa: dari Draft 1 tanpa AI, eksplorasi bantuan terukur, perbandingan versi alternatif, hingga Draft 2 dan refleksi.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 shrink-0">
            <p className="font-semibold text-slate-900">Status Kebijakan Guru:</p>
            <p className="mt-0.5">
              {session.policyMode === 'MODE_A_INDEPENDENT'
                ? 'Mode A — Independent Writing (AI & Translator Terkunci di Tahap 1)'
                : session.policyMode === 'MODE_B_DICTIONARY_ONLY'
                ? 'Mode B — Hanya Glosarium Kata di Tahap 1'
                : 'Mode C — Bantuan Terbuka Sesuai Pengaturan Guru'}
            </p>
          </div>
        </div>

        {/* 5-Stage Interactive Progress Stepper */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-100"
          role="navigation"
          aria-label="Tahapan BABATURAN Writing Lab"
        >
          {STAGE_STEPS.map((s, idx) => {
            const isActive = session.currentStage === s.stage;
            const isUnlocked = canNavigateToStage(s.stage);
            const isCompleted = idx < currentStageIndex;

            return (
              <button
                key={s.stage}
                type="button"
                disabled={!isUnlocked}
                onClick={() =>
                  isUnlocked &&
                  onUpdateSession({ ...session, currentStage: s.stage })
                }
                className={`text-left p-3.5 rounded-xl border transition-colors ${
                  isActive
                    ? 'bg-[#ECFDF5] border-[#059669] text-slate-900'
                    : isCompleted
                    ? 'bg-white border-emerald-200 text-slate-800 hover:bg-slate-50'
                    : isUnlocked
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-50 border-slate-200/70 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className={isActive ? 'text-[#059669]' : ''}>{s.stepLabel}</span>
                  {isUnlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-[#059669]" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <p className="text-sm font-bold leading-snug">{s.title}</p>
                <p className="text-xs opacity-80 mt-0.5 leading-snug">{s.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500">
              Tugas Aktif · {assignment.cpReference} · Target Ragam: {assignment.targetRegister} · Minimal {assignment.minWords} kata
            </p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {assignment.title}
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-600">
            Siswa: {session.studentName} ({session.studentClass})
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Instruksi Guru (Basa Sunda):
            </p>
            <p className="text-slate-900 font-medium leading-relaxed">
              "{assignment.promptInstructionSunda}"
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Panduan Umum (Bahasa Indonesia):
            </p>
            <p className="text-slate-700 leading-relaxed">
              {assignment.promptInstructionId}
            </p>
          </div>
        </div>
      </div>

      {/* STAGE 1: DRAFT 1 — INDEPENDENT WRITING */}
      {session.currentStage === 'STAGE_1_DRAFT_1' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-amber-700">
                DRAFT 1 — Written Independently Without AI
              </p>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                Tahap 1: Tulis Draft 1 Secara Mandiri
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Tuliskan kemampuan awalmu apa adanya. Jangan takut salah—Draft 1 adalah bukti proses belajarmu dan tidak akan dinilai sebagai nilai akhir tunggal.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!session.draft1Locked && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft1Input(
                      'Poé Senén kuring indit ka SMAN 2 Tambun Selatan bareng babaturan anyar. Kuring senang pisan diajar basa Sunda di kelas. Jam istirahat kuring tuang di kantin sakola tuluy balik ka imah.'
                    )
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  Isi Contoh Tulisan Awal Siswa
                </button>
              )}
              <button
                type="button"
                onClick={handleVerifyBackendLock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Cek Status Kunci AI & Translator</span>
              </button>
            </div>
          </div>

          {/* Lock Enforcement Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">
                  Status Akses Alat Bantu pada Tahap 1:
                </p>
                <p>
                  • Translator: <span className="font-semibold">{translatorAccess.allowed ? 'Terbuka' : 'TERKUNCI'}</span> — {translatorAccess.reason}
                </p>
                <p>
                  • AI Tutor / Generator: <span className="font-semibold">{aiAccess.allowed ? 'Terbuka' : 'TERKUNCI'}</span> — {aiAccess.reason}
                </p>
              </div>
            </div>
          </div>

          {backendLockNotice && (
            <p className="text-xs font-medium text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
              {backendLockNotice}
            </p>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <label htmlFor="draft1-textarea" className="font-semibold text-slate-700">
                Editor Draft 1 (Mandiri)
              </label>
              <span className="tabular-nums">
                {countWords(draft1Input)} kata (minimal {assignment.minWords} kata)
              </span>
            </div>
            <textarea
              id="draft1-textarea"
              rows={6}
              disabled={session.draft1Locked}
              value={draft1Input}
              onChange={(e) => setDraft1Input(e.target.value)}
              placeholder="Tuliskeun pangalaman anjeun nganggo basa Sunda sakamampuh anjeun heula..."
              className="w-full p-4 text-base bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:opacity-75 leading-relaxed"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              {session.draft1Locked
                ? `Terkumpul & Dikunci pada: ${session.draft1SubmittedAt}`
                : 'Setelah dikumpulkan, Draft 1 disimpan permanen dan Tahap 2 (Bantuan Translator + AI) akan terbuka.'}
            </p>
            {session.draft1Locked ? (
              <button
                type="button"
                onClick={() =>
                  onUpdateSession({ ...session, currentStage: 'STAGE_2_ASSISTANCE' })
                }
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors"
              >
                Lanjut ke Tahap 2 (Translator + AI Assistance) →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitDraft1}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors"
              >
                Kumpulkan Draft 1 & Buka Tahap 2
              </button>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: TRANSLATOR + AI ASSISTANCE */}
      {session.currentStage === 'STAGE_2_ASSISTANCE' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                Tahap 2 · Eksplorasi Kosakata, Terjemahan & Tata Bahasa Terarah
              </p>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                Translator + AI Assistance (Tercatat untuk Bukti Belajar)
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Draft 1 kamu sudah aman terkunci. Sekarang kamu boleh menerjemahkan kalimat yang ragu, memahami kosakata, dan meminta penjelasan Undak-Usuk sebelum membandingkan versi penuh.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateStage3Comparison}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Lanjut ke Tahap 3 (AI Version Comparison) →
            </button>
          </div>

          {/* Locked Draft 1 Reference */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-600 mb-1">
              Arsip Draft 1 Kamu (Terkunci · {session.draft1SubmittedAt}):
            </p>
            <p className="text-sm text-slate-900 leading-relaxed">"{session.draft1Text}"</p>
          </div>

          {/* Dual Assistance Panels: A. Translation Assistance & B. AI Writing Assistance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel A: Translation Assistance */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
              <p className="text-xs font-semibold text-[#059669]">
                A. Translation Assistance (Bantuan Terjemahan & Kosakata)
              </p>
              <p className="text-xs text-slate-600">
                Terjemahkan kata atau kalimat dari Bahasa Indonesia ke Bahasa Sunda untuk memeriksa pilihan katamu di Draft 1.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transQuery}
                  onChange={(e) => setTransQuery(e.target.value)}
                  aria-label="Kalimat untuk diterjemahkan di Tahap 2"
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  type="button"
                  disabled={isAssisting}
                  onClick={handleRunTranslationAssistance}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap"
                >
                  Terjemahkan
                </button>
              </div>
              {transResultText && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-slate-800 leading-relaxed">
                  {transResultText}
                </div>
              )}
            </div>

            {/* Panel B: AI Writing Assistance */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
              <p className="text-xs font-semibold text-amber-700">
                B. AI Writing Assistance (Tanya Undak-Usuk & Struktur Kalimat)
              </p>
              <p className="text-xs text-slate-600">
                Tanyakan kepada BABATURAN tentang perbedaan kata loma/lemes atau cara memperbaiki kalimatmu.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiAssistQuery}
                  onChange={(e) => setAiAssistQuery(e.target.value)}
                  aria-label="Pertanyaan untuk AI Writing Assistance"
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <button
                  type="button"
                  disabled={isAssisting}
                  onClick={handleRunAiAssistance}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Tanya AI
                </button>
              </div>
              {aiAssistReply && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-slate-800 leading-relaxed">
                  {aiAssistReply}
                </div>
              )}
            </div>
          </div>

          {/* Logged Assistance History */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-slate-600 mb-2">
              Catatan Penggunaan Bantuan Tahap 2 ({session.assistanceLogs.length} aktivitas tercatat terpisah):
            </h3>
            {session.assistanceLogs.length === 0 ? (
              <p className="text-xs text-slate-500">
                Gunakan salah satu bantuan di atas atau langsung lanjut ke Tahap 3.
              </p>
            ) : (
              <div className="space-y-2">
                {session.assistanceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">
                        [{log.type === 'TRANSLATION_ASSISTANCE' ? 'Translator' : 'AI Tutor'}]
                      </span>{' '}
                      <span className="text-slate-700">"{log.query}"</span> →{' '}
                      <span className="text-[#065F46]">{log.responseSummary}</span>
                    </div>
                    <span className="text-slate-400 shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 3: AI VERSION COMPARISON */}
      {session.currentStage === 'STAGE_3_COMPARISON' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                Tahap 3 · Side-by-Side Comparison (Tiga Panel Analisis)
              </p>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                Membandingkan Tulisan Asli Siswa dengan Versi Alternatif BABATURAN
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Versi AI bukan jawaban mutlak yang harus disalin, melainkan bahan perbandingan agar kamu memahami pilihan kosakata dan struktur kalimat yang lebih merenah.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSession({ ...session, currentStage: 'STAGE_4_DRAFT_2' })
              }
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Lanjut ke Tahap 4 (Draft 2 — Independent Revision) →
            </button>
          </div>

          {/* 3-Panel Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Draft 1 */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-600">
                PANEL 1 · DRAFT 1 — Written Independently Without AI
              </p>
              <p
                className="text-base text-slate-900 leading-relaxed"
                data-testid="comparison-draft1-text"
              >
                {session.draft1Text}
              </p>
            </div>

            {/* Panel 2: AI Version */}
            <div className="p-5 rounded-xl bg-[#ECFDF5]/60 border border-emerald-200 space-y-2">
              <p className="text-xs font-semibold text-[#065F46]">
                PANEL 2 · AI-GENERATED VERSION — FOR COMPARISON ONLY
              </p>
              <p
                className="text-base text-slate-900 leading-relaxed font-medium"
                data-testid="comparison-ai-text"
              >
                {session.aiComparisonText}
              </p>
              <p className="text-xs text-slate-600 pt-2">
                Catatan Etika: Versi ini menjaga alur pengalamanmu namun menyesuaikan register ke {assignment.targetRegister}. Jangan menyalin mentah-mentah; pilih perbaikan yang kamu pahami di bawah ini.
              </p>
            </div>
          </div>

          {/* Panel 3: Revision Notes & Student Decisions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                PANEL 3 · Revision Notes — Analisis Perbedaan & Keputusan Siswa
              </h3>
              <span className="text-xs text-slate-500">
                {session.revisionSuggestions.filter((r) => r.decision !== 'pending').length}/
                {session.revisionSuggestions.length} poin ditinjau
              </span>
            </div>

            <div className="space-y-3">
              {session.revisionSuggestions.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">{item.category}</span> ·{' '}
                      <span>{item.registerNote}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecisionChange(item.id, 'accepted')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          item.decision === 'accepted'
                            ? 'bg-[#059669] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        Terima Saran
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecisionChange(item.id, 'rejected')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          item.decision === 'rejected'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        Pertahankan Versi Saya
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-100">
                      <span className="text-xs text-red-700 block">Tertulis di Draft 1:</span>
                      <span className="font-semibold text-slate-900">{item.originalSegment}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                      <span className="text-xs text-[#065F46] block">Saran Alternatif BABATURAN:</span>
                      <span className="font-semibold text-slate-900">{item.suggestedSegment}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-semibold">Penjelasan Linguistik:</span> {item.linguisticReason}
                  </p>

                  <div>
                    <input
                      type="text"
                      value={item.studentReason}
                      onChange={(e) =>
                        handleDecisionChange(
                          item.id,
                          item.decision === 'pending' ? 'accepted' : item.decision,
                          e.target.value
                        )
                      }
                      placeholder="Tuliskan alasan singkat mengapa kamu menerima atau menolak saran ini..."
                      aria-label={`Alasan keputusan untuk ${item.originalSegment}`}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 4: DRAFT 2 — INDEPENDENT REVISION */}
      {session.currentStage === 'STAGE_4_DRAFT_2' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                DRAFT 2 — Student Revised Writing
              </p>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                Tahap 4: Tulis Ulang Draft 2 Berdasarkan Pemahaman Sendiri
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Sistem tidak mengubah Draft 1 secara otomatis menjadi Draft 2. Susun kembali tulisanmu berdasarkan pemahaman kosakata dan undak-usuk basa yang sudah kamu pelajari!
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft2Input(
                  'Nalika dinten Senén munggaran lebet ka SMAN 2 Tambun Selatan, abdi mios ka sakola sareng réréncangan énggal. Abdi ngaraos bingah pisan tiasa diajar basa Sunda di kelas. Sabada istirahat sareng neda di kantin sakola, abdi wangsul ka rorompok kalayan haté anu reueus.'
                )
              }
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Isi Contoh Revisi Mandiri Siswa (Draft 2)
            </button>
          </div>

          {/* Reference Summary: Draft 1 + Accepted Revision Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Tulisan Awalmu (Draft 1 — Tetap Tersimpan Utuh):
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">"{session.draft1Text}"</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <p className="text-xs font-semibold text-[#065F46] mb-1">
                Catatan Perbaikan yang Kamu Pilih:
              </p>
              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                {session.revisionSuggestions.map((r) => (
                  <li key={r.id}>
                    <span className="font-medium">{r.originalSegment}</span> →{' '}
                    <span className="font-semibold text-[#065F46]">{r.suggestedSegment}</span> (
                    {r.decision === 'rejected' ? 'Ditolak siswa' : 'Dipilih untuk direvisi'})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <label htmlFor="draft2-textarea" className="font-semibold text-slate-700">
                Editor Draft 2 (Revisi Mandiri Siswa)
              </label>
              <span className="tabular-nums">
                {countWords(draft2Input)} kata (minimal {assignment.minWords} kata)
              </span>
            </div>
            <textarea
              id="draft2-textarea"
              rows={6}
              value={draft2Input}
              onChange={(e) => setDraft2Input(e.target.value)}
              placeholder="Tulis ulang karangan Bahasa Sunda hasil revisimu di sini..."
              className="w-full p-4 text-base bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669] leading-relaxed"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitDraft2}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors"
            >
              Simpan Draft 2 & Lihat Penilaian Rubrik Setara →
            </button>
          </div>
        </div>
      )}

      {/* STAGE 5: ASSESSMENT & REFLECTION */}
      {session.currentStage === 'STAGE_5_ASSESSMENT_REFLECTION' && (
        <div className="space-y-6">
          {/* Rubric Comparison Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-[#059669]">
                  Tahap Evaluasi · Dinilai Menggunakan Rubrik 5 Kriteria yang Sama
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Perbandingan Hasil Rubrik Draft 1 vs Draft 2
                </h2>
              </div>
              {session.draft1Rubric && session.draft2Rubric && (
                <div className="flex items-center gap-4 text-sm font-semibold tabular-nums">
                  <span className="text-slate-600">
                    Skor Draft 1: {totalRubricScore(session.draft1Rubric)}/100
                  </span>
                  <span className="text-[#059669]">
                    Skor Draft 2: {totalRubricScore(session.draft2Rubric)}/100
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  DRAFT 1 — Written Independently Without AI ({session.draft1SubmittedAt})
                </p>
                <p className="text-sm text-slate-800 leading-relaxed">"{session.draft1Text}"</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <p className="text-xs font-semibold text-[#065F46] mb-1">
                  DRAFT 2 — Student Revised Writing ({session.draft2SubmittedAt})
                </p>
                <p className="text-sm text-slate-900 font-medium leading-relaxed">
                  "{session.draft2Text}"
                </p>
              </div>
            </div>

            {session.draft1Rubric && session.draft2Rubric && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 pr-4">Dimensi Rubrik Penilaian</th>
                      <th className="py-3 px-4 text-right">Draft 1 (Maks 20)</th>
                      <th className="py-3 px-4 text-right">Draft 2 (Maks 20)</th>
                      <th className="py-3 px-4 text-right">Perkembangan</th>
                      <th className="py-3 pl-4">Catatan Umpan Balik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm tabular-nums">
                    {[
                      {
                        label: '1. Ketepatan Kosakata Basa Sunda',
                        d1: session.draft1Rubric.kosakata,
                        d2: session.draft2Rubric.kosakata,
                        note: 'Pemilihan verba dan nomina bahasa Sunda yang sesuai konteks sekolah.',
                      },
                      {
                        label: '2. Struktur Kalimat & Tata Bahasa',
                        d1: session.draft1Rubric.tataBahasa,
                        d2: session.draft2Rubric.tataBahasa,
                        note: 'Kejelasan pola SPOK (Jejer-Caritaan-Udagan-Katerangan).',
                      },
                      {
                        label: '3. Ketepatan Undak-Usuk Basa (Loma / Lemes)',
                        d1: session.draft1Rubric.undakUsuk,
                        d2: session.draft2Rubric.undakUsuk,
                        note: 'Konsistensi penggunaan lemes keur sorangan (abdi, mios, neda, wangsul).',
                      },
                      {
                        label: '4. Koherensi & Keterpaduan Gagasan',
                        d1: session.draft1Rubric.koherensi,
                        d2: session.draft2Rubric.koherensi,
                        note: 'Penggunaan kata hubung waktu (nalika, sabada, salajengna).',
                      },
                      {
                        label: '5. Kesesuaian Isi dengan Tujuan Tugas',
                        d1: session.draft1Rubric.kesesuaianIsi,
                        d2: session.draft2Rubric.kesesuaianIsi,
                        note: 'Kelengkapan cerita pengalaman masuk SMA.',
                      },
                    ].map((row) => {
                      const diff = row.d2 - row.d1;
                      return (
                        <tr key={row.label}>
                          <td className="py-3 pr-4 font-medium text-slate-900">{row.label}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{row.d1}</td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            {row.d2}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-[#059669]">
                            {diff >= 0 ? `+${diff}` : diff}
                          </td>
                          <td className="py-3 pl-4 text-xs text-slate-600 font-sans">
                            {row.note}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 8-Question Student Reflection Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-[#059669]">
                  Bukti Metakognitif Siswa · 8 Pertanyaan Refleksi
                </p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Refleksi Proses Menulis & Literasi AI Siswa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateSession({
                    ...session,
                    reflections: {
                      q1: 'Saya menyadari bahwa saya sudah tahu ide ceritanya, tetapi masih mencampur kata loma dan lemes.',
                      q2: 'Versi BABATURAN menggunakan kata ganti "abdi", "mios", "neda", dan "wangsul" secara konsisten.',
                      q3: 'Saya belajar bahwa "tuang" adalah lemes untuk orang lain, sedangkan untuk diri sendiri adalah "neda".',
                      q4: 'Saya mengganti "kuring indit" menjadi "abdi mios" dan memperbaiki "tuang" menjadi "neda".',
                      q5: 'Ya, karena tulisan ini ditujukan untuk tugas formal sekolah kepada Bapak/Ibu Guru.',
                      q6: 'Tidak selalu harus disalin semua; pengalaman pribadi saya di kantin tetap saya pertahankan dengan kalimat sendiri.',
                      q7: 'Menghafal pasangan kata kerja lemes keur sorangan dan lemes keur batur.',
                      q8: 'Saya jauh lebih percaya diri karena paham alasan di balik setiap perubahan kata.',
                    },
                  });
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Isi Contoh Refleksi Lengkap
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STUDENT_REFLECTION_QUESTIONS.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <label
                    htmlFor={`refl-${item.id}`}
                    className="block text-xs font-semibold text-slate-800"
                  >
                    {item.question}
                  </label>
                  <textarea
                    id={`refl-${item.id}`}
                    rows={2}
                    value={session.reflections[item.id] || ''}
                    onChange={(e) =>
                      onUpdateSession({
                        ...session,
                        reflections: {
                          ...session.reflections,
                          [item.id]: e.target.value,
                        },
                      })
                    }
                    placeholder={item.placeholder}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              {session.reflectionSubmittedAt ? (
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Refleksi & Bukti Belajar Tersimpan ({session.reflectionSubmittedAt}) — Siap dianalisis di Ruang Guru!
                  </span>
                </p>
              ) : (
                <span className="text-xs text-slate-500">
                  Seluruh refleksi akan dikirim ke Research Evidence Dashboard Guru.
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveReflection}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simpan Refleksi & Bukti Penelitian</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
