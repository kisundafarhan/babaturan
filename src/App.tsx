import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Compass,
  FileEdit,
  Flame,
  GraduationCap,
  Home,
  Languages,
  MessageCircle,
  Sparkles,
  Swords,
} from 'lucide-react';
import {
  GlossaryEntry,
  INITIAL_GLOSSARY,
  StudentProfileLevel,
  WordBreakdownItem,
} from './lib/sundaData';
import {
  calculateRankAndXP,
  WritingLabAssignment,
  WritingLabSessionState,
} from './lib/engine';
import { BabaturanMascot } from './components/BabaturanMascot';
import { TranslatorView } from './components/TranslatorView';
import { WritingLabView } from './components/WritingLabView';
import {
  LearningStudioView,
  StudioSubTab,
} from './components/LearningStudioView';
import { TeacherDashboardView } from './components/TeacherDashboardView';
import { OnboardingDiagnosticModal } from './components/OnboardingDiagnosticModal';

export type MainView =
  | 'beranda'
  | 'translator'
  | 'writing_lab'
  | 'studio_belajar'
  | 'ruang_guru';

const PROFILE_LABELS: Record<
  StudentProfileLevel,
  { title: string; nextStepSunda: string; nextStepId: string }
> = {
  pamula: {
    title: 'A. Pamula — Saya Belum Bisa Bahasa Sunda',
    nextStepSunda: 'Hayu mimitian ti Translator Kontekstual jeung Kandaga Kecap sapopoé!',
    nextStepId:
      'Gunakan fitur Perbandingan Terjemahan untuk memahami bedanya kata ganti "Abdi" (lemes) dan "Kuring" (loma).',
  },
  ngarti_pasif: {
    title: 'B. Ngarti Tapi Can Bisa Nyarita (Paham Pasif)',
    nextStepSunda: 'Anjeun geus ngarti hartina! Ayeuna hayu wani nyarita di simulasi Hayu Nyarita.',
    nextStepId:
      'Latih keberanian berbicara menggunakan Easy Mode pada simulator percakapan Hayu Nyarita Level 1 & 2.',
  },
  ngamimitian_nyarita: {
    title: 'C. Ngamimitian Nyarita — Saya Bisa Sedikit',
    nextStepSunda: 'Sae pisan! Asah ketepatan Undak-Usuk Battle jeung mimitian nulis Draft 1 di Writing Lab.',
    nextStepId:
      'Uji ketepatan memilih lemes keur sorangan vs lemes keur batur, lalu kerjakan tugas mandiri di Writing Lab.',
  },
  mahir: {
    title: 'D. Mahir — Siap Diskusi Sastra & Panumbu Catur',
    nextStepSunda: 'Luar biasa! Cobian matéri Fase F (Panumbu Catur, Carpon, Argumentasi) jeung Aksara Sunda.',
    nextStepId:
      'Eksplorasi modul sastra Sunda Kelas XI/XII, transliterasi Aksara Sunda Unicode, dan penulisan reflektif.',
  },
};

export default function App() {
  const [activeView, setActiveView] = useState<MainView>('beranda');
  const [studioSubTab, setStudioSubTab] = useState<StudioSubTab>('ai_tutor');
  const [studentProfile, setStudentProfile] =
    useState<StudentProfileLevel>('ngarti_pasif');
  const [xp, setXp] = useState<number>(340);
  const [streakDays] = useState<number>(5);
  const [lastXpToast, setLastXpToast] = useState<string | null>(null);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState<boolean>(false);

  // Shared Glossary & Extracted Vocabulary State
  const [glossary, setGlossary] = useState<GlossaryEntry[]>(INITIAL_GLOSSARY);
  const [extractedVocab, setExtractedVocab] = useState<WordBreakdownItem[]>([
    {
      word: 'Abdi',
      meaning: 'Saya',
      register: 'Lemes (Hormat)',
      partOfSpeech: 'Pronomina',
      alternatives: 'Kuring / Urang (Loma)',
      note: 'Digunakan saat berbicara sopan kepada guru atau orang tua.',
    },
  ]);

  // AI Tutor pre-filled sentence from Translator
  const [tutorSentenceSeed, setTutorSentenceSeed] = useState<string>('');

  // Writing Lab State (Strictly separated from ordinary Translator)
  const [assignment, setAssignment] = useState<WritingLabAssignment>({
    id: 'asg-sman2-01',
    title: 'Pangalaman Munggaran Asup ka SMAN 2 Tambun Selatan',
    cpReference: 'Fase F · Kelas XI · Menulis Naratif & Carpon',
    promptInstructionSunda:
      'Tuliskeun pangalaman anjeun nalika munggaran asup ka SMA nganggo basa Sunda anu merenah.',
    promptInstructionId:
      'Tuliskan pengalaman pertamamu saat masuk SMA (suasana pagi, bertemu teman baru, dan belajar di kelas). Pada Tahap 1, tuliskan secara mandiri tanpa AI maupun translator.',
    targetRegister: 'Lemes (Hormat)',
    minWords: 8,
    policyMode: 'MODE_A_INDEPENDENT',
    allowTranslatorInStage1: false,
    allowAiInStage1: false,
  });

  const [writingSession, setWritingSession] = useState<WritingLabSessionState>({
    assignmentId: 'asg-sman2-01',
    studentName: 'Dinda Putri',
    studentClass: 'XI-2 · SMAN 2 Tambun Selatan',
    currentStage: 'STAGE_1_DRAFT_1',
    policyMode: 'MODE_A_INDEPENDENT',
    draft1Text: '',
    draft1SubmittedAt: null,
    draft1Locked: false,
    assistanceLogs: [],
    aiComparisonText: '',
    aiComparisonGeneratedAt: null,
    revisionSuggestions: [],
    draft2Text: '',
    draft2SubmittedAt: null,
    draft1Rubric: null,
    draft2Rubric: null,
    reflections: {},
    reflectionSubmittedAt: null,
    teacherVerified: false,
    teacherComment: '',
  });

  const rankInfo = calculateRankAndXP(xp);

  const handleGainXp = (amount: number, reason: string) => {
    setXp((prev) => prev + amount);
    setLastXpToast(`+${amount} XP · ${reason}`);
  };

  const handleSaveWordToQuest = (item: WordBreakdownItem) => {
    setExtractedVocab((prev) => {
      if (prev.some((w) => w.word.toLowerCase() === item.word.toLowerCase())) {
        return prev;
      }
      return [item, ...prev];
    });
    handleGainXp(10, `Menyimpan kosakata "${item.word}" ke Kandaga Kecap`);
  };

  const handleOpenAiTutorWithSentence = (sentence: string) => {
    setTutorSentenceSeed(sentence);
    setStudioSubTab('ai_tutor');
    setActiveView('studio_belajar');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Navigation Bar Contract (frontend-design §2) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('beranda');
          }}
          className="text-xl font-bold tracking-tight text-[#065F46] font-display whitespace-nowrap shrink-0"
        >
          BABATURAN
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          aria-label="Navigasi Utama"
        >
          {[
            { id: 'beranda', label: 'Beranda' },
            { id: 'translator', label: 'Translator' },
            { id: 'writing_lab', label: 'Writing Lab' },
            { id: 'studio_belajar', label: 'Studio Belajar' },
            { id: 'ruang_guru', label: 'Ruang Guru' },
          ].map((link) => {
            const active = activeView === link.id;
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(link.id as MainView);
                }}
                className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                  active
                    ? 'text-[#065F46] font-semibold border-b-2 border-[#059669]'
                    : 'hover:text-slate-900'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsDiagnosticOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Tes Diagnostik
          </button>
        </div>
      </header>

      {/* Workspace Status & Quick Module Switcher Sub-Toolbar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-900">
              Babaturan Diajar Basa Sunda
            </span>
            <span aria-hidden="true">·</span>
            <span>SMAN 2 Tambun Selatan</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#065F46] font-medium">
              Rank: {rankInfo.rankName} (Lv.{rankInfo.level} · {rankInfo.currentXp} XP)
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-medium">
              Streak: {streakDays} Hari
            </span>
          </div>

          {lastXpToast && (
            <div
              className="text-xs font-semibold text-[#065F46]"
              role="status"
              aria-live="polite"
            >
              {lastXpToast}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Container (1440px desktop baseline with max-w-7xl) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 pb-24 md:pb-12">
        {activeView === 'beranda' && (
          <div className="space-y-8">
            {/* Hero Split Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 7 cols: Greeting, Tagline, Primary Entry Points */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-[#059669]">
                    Learn · Translate · Practice · Speak · Preserve
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance leading-tight">
                    Diajar, Tarjamahkeun, Wani Nyarita, Ngamumulé Basa Sunda.
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                    Sampurasun, <span className="font-semibold text-slate-900">Dinda Putri</span>! BABATURAN hadir sebagai sahabat belajar yang ramah dan bebas rasa takut salah. Dari menerjemahkan dengan perbandingan konteks Loma vs Lemes, berlatih bicara, hingga menyusun karangan mandiri di Writing Lab.
                  </p>
                </div>

                {/* Primary Action Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveView('translator')}
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap"
                  >
                    <Languages className="w-4 h-4" />
                    <span>Buka BABATURAN Translator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('writing_lab')}
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <FileEdit className="w-4 h-4 text-[#059669]" />
                    <span>Masuk ke 5-Stage Writing Lab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudioSubTab('hayu_nyarita');
                      setActiveView('studio_belajar');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold text-[#065F46] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hayu Nyarita! (Roleplay)</span>
                  </button>
                </div>
              </div>

              {/* Right 5 cols: Adaptive AI Profile, Mascot & "Saterusna kedah diajar naon?" */}
              <div className="lg:col-span-5 bg-[#ECFDF5]/60 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <BabaturanMascot
                    mood="semangat"
                    size="lg"
                  />
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Rank RPG Saat Ini</span>
                    <span className="text-lg font-bold text-[#065F46]">
                      {rankInfo.rankName}
                    </span>
                    <span className="text-xs text-slate-600 block">
                      {rankInfo.rankSubtitle}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 tabular-nums">
                    <span>Level {rankInfo.level} Progress</span>
                    <span>
                      {rankInfo.currentXp} / {rankInfo.nextLevelXp} XP ({rankInfo.progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-emerald-200">
                    <div
                      className="h-full bg-[#059669] transition-all"
                      style={{ width: `${rankInfo.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Adaptive Recommendation Card */}
                <div className="bg-white border border-emerald-200/80 rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#059669]">
                      Saterusna kedah diajar naon?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDiagnosticOpen(true)}
                      className="text-slate-500 hover:text-slate-900 underline"
                    >
                      Ubah Profil
                    </button>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {PROFILE_LABELS[studentProfile].title}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {PROFILE_LABELS[studentProfile].nextStepId}
                  </p>
                </div>
              </div>
            </section>

            {/* Three Architectural Pillars Spotlight (Highlighting the 3 Priorities) */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[#059669]">
                    Tiga Pilar Inovasi Utama BABATURAN
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Ekosistem Pembelajaran & Instrumen Bukti Proses Belajar
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  Klik kartu fitur di bawah untuk langsung mempraktikkan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pillar 1 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#059669]">
                      01. Multi-Engine Translator Mandiri
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      Translator Internal + Google Cloud NMT Adapter
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tidak bergantung tunggal pada SundaDigi. Menggunakan mesin kontekstual internal berbasis glosarium SMA dan Google Cloud Translation API adapter, sementara SundaDigi tersedia sebagai rujukan kandidat resmi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('translator')}
                    className="self-start text-xs font-semibold text-[#059669] hover:underline"
                  >
                    Coba Multi-Engine Translator →
                  </button>
                </div>

                {/* Pillar 2 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#059669]">
                      02. Pemisahan Tegas Writing Lab (5 Tahap)
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      Draft 1 Mandiri → Bantuan → Perbandingan AI → Draft 2
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Tidak mencampur penerjemah biasa dengan tugas menulis. Siswa menulis Draft 1 tanpa AI, membuka bantuan terukur di Tahap 2, membandingkan versi alternatif di Tahap 3, menulis ulang Draft 2, dan dinilai dengan rubrik setara.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('writing_lab')}
                    className="self-start text-xs font-semibold text-[#059669] hover:underline"
                  >
                    Mulai Alur 5-Tahap Writing Lab →
                  </button>
                </div>

                {/* Pillar 3 */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#059669]">
                      03. Inovasi Perbandingan Hasil Terjemahan
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">
                      Bandingkan Terjemahan Mesin vs Ragam Loma & Lemes
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Satu kalimat Bahasa Indonesia diterjemahkan mesin, lalu BABATURAN membandingkan pilihan kosakata Loma (teman) vs Lemes (guru/orang tua) dan menjelaskan mengapa kata tersebut digunakan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('translator')}
                    className="self-start text-xs font-semibold text-[#059669] hover:underline"
                  >
                    Lihat Perbandingan Terjemahan →
                  </button>
                </div>
              </div>
            </section>

            {/* Complete 8-Module Quick Launch Grid */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Peta Petualangan Belajar (BABATURAN Adventure Modules)
                  </h2>
                  <p className="text-xs text-slate-600">
                    Pilih modul belajar interaktif untuk mengumpulkan XP dan mengasah keterampilan berbahasa Sunda.
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  Misi Harian: Selesaikan 1 Perbandingan Terjemahan & 1 Tantangan Undak-Usuk (+35 XP)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: 'Ngobrol AI Tutor',
                    subtitle: 'Tanya jawab kosakata, tata bahasa, & ubah kalimat Loma/Lemes',
                    icon: Sparkles,
                    action: () => {
                      setStudioSubTab('ai_tutor');
                      setActiveView('studio_belajar');
                    },
                  },
                  {
                    title: 'Hayu Nyarita! (Roleplay)',
                    subtitle: 'Simulator percakapan 4 level (Kantin, Ruang Guru, Nini, Panumbu Catur)',
                    icon: MessageCircle,
                    action: () => {
                      setStudioSubTab('hayu_nyarita');
                      setActiveView('studio_belajar');
                    },
                  },
                  {
                    title: 'Undak-Usuk Battle',
                    subtitle: 'Latihan detektif konteks sosial: memilih Loma, Lemes Sorangan, & Lemes Batur',
                    icon: Swords,
                    action: () => {
                      setStudioSubTab('undak_usuk');
                      setActiveView('studio_belajar');
                    },
                  },
                  {
                    title: 'Kandaga Kecap (Vocabulary Quest)',
                    subtitle: 'Flashcard 3 bahasa & koleksi kosakata hasil ekstraksi Translator',
                    icon: Flame,
                    action: () => {
                      setStudioSubTab('kandaga_kecap');
                      setActiveView('studio_belajar');
                    },
                  },
                  {
                    title: 'Kurikulum SMA & Aksara Sunda',
                    subtitle: 'Materi Fase E/F (Carpon, Sisindiran, Panumbu Catur) & Simulator Aksara',
                    icon: BookOpen,
                    action: () => {
                      setStudioSubTab('kurikulum_aksara');
                      setActiveView('studio_belajar');
                    },
                  },
                  {
                    title: 'Sundanese Culture Explorer & Ruang Guru',
                    subtitle: 'Eksplorasi Angklung, Kujang, Paribasa & Dashboard Bukti Penelitian Guru',
                    icon: Compass,
                    action: () => {
                      setStudioSubTab('budaya_sunda');
                      setActiveView('studio_belajar');
                    },
                  },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      type="button"
                      onClick={card.action}
                      className="text-left p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors flex items-start gap-3.5"
                    >
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[#059669] shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{card.title}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {card.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Earned Badges Strip */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-800">Badge Terkumpul:</span>
                  <span>
                    First Sundanese Word · First Translation · Brave Speaker · Vocabulary Explorer · Writing Improver
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('ruang_guru')}
                  className="inline-flex items-center gap-1.5 font-semibold text-[#059669] hover:underline"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Buka Ruang Guru & Research Evidence Dashboard</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {activeView === 'translator' && (
          <TranslatorView
            glossary={glossary}
            savedVocabIds={extractedVocab.map((v) => v.word.toLowerCase())}
            onSaveWordToQuest={handleSaveWordToQuest}
            onGainXp={handleGainXp}
            onOpenAiTutorWithSentence={handleOpenAiTutorWithSentence}
          />
        )}

        {activeView === 'writing_lab' && (
          <WritingLabView
            assignment={assignment}
            session={writingSession}
            glossary={glossary}
            onUpdateSession={setWritingSession}
            onGainXp={handleGainXp}
          />
        )}

        {activeView === 'studio_belajar' && (
          <LearningStudioView
            activeSubTab={studioSubTab}
            onSelectSubTab={setStudioSubTab}
            studentProfile={studentProfile}
            glossary={glossary}
            extractedVocab={extractedVocab}
            initialTutorPrompt={tutorSentenceSeed}
            onGainXp={handleGainXp}
          />
        )}

        {activeView === 'ruang_guru' && (
          <TeacherDashboardView
            assignment={assignment}
            session={writingSession}
            glossary={glossary}
            onUpdateAssignment={setAssignment}
            onUpdateSession={setWritingSession}
            onAddGlossaryEntry={(entry) => setGlossary((prev) => [entry, ...prev])}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (<= 15% viewport height cap) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-2 py-1.5 grid grid-cols-5 gap-1"
        aria-label="Navigasi Mobile"
      >
        {[
          { id: 'beranda', label: 'Beranda', icon: Home },
          { id: 'translator', label: 'Translator', icon: Languages },
          { id: 'writing_lab', label: 'Writing Lab', icon: FileEdit },
          { id: 'studio_belajar', label: 'Belajar', icon: Sparkles },
          { id: 'ruang_guru', label: 'Guru', icon: GraduationCap },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id as MainView)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-medium ${
                active ? 'text-[#059669] font-semibold' : 'text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            BABATURAN — Babaturan Diajar Basa Sunda · Dikembangkan untuk pembelajaran Bahasa Sunda SMA (Konteks Implementasi SMAN 2 Tambun Selatan, Kab. Bekasi).
          </p>
          <p>
            Privasi & Etika AI: Teks siswa diproses secara aman melalui server; AI berperan sebagai pendamping belajar, bukan pengganti berpikir mandiri.
          </p>
        </div>
      </footer>

      {/* Onboarding & Diagnostic Assessment Modal */}
      <OnboardingDiagnosticModal
        isOpen={isDiagnosticOpen}
        currentProfile={studentProfile}
        onClose={() => setIsDiagnosticOpen(false)}
        onSelectProfile={(prof, bonusXp) => {
          setStudentProfile(prof);
          handleGainXp(bonusXp, `Memperbarui profil belajar ke ${prof.toUpperCase()}`);
        }}
      />
    </div>
  );
}
