import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Compass,
  Flame,
  MessageCircle,
  Mic,
  Send,
  ShieldAlert,
  Sparkles,
  Swords,
  Volume2,
} from 'lucide-react';
import {
  AKSARA_SUNDA_DATA,
  CULTURAL_TOPICS,
  CURRICULUM_MODULES,
  GlossaryEntry,
  ROLEPLAY_SCENARIOS,
  StudentProfileLevel,
  UNDAK_USUK_CHALLENGES,
  WordBreakdownItem,
} from '../lib/sundaData';
import { transliterateToAksaraSunda } from '../lib/engine';
import { BabaturanMascot } from './BabaturanMascot';

export type StudioSubTab =
  | 'ai_tutor'
  | 'hayu_nyarita'
  | 'undak_usuk'
  | 'kandaga_kecap'
  | 'kurikulum_aksara'
  | 'budaya_sunda';

interface LearningStudioViewProps {
  activeSubTab: StudioSubTab;
  onSelectSubTab: (tab: StudioSubTab) => void;
  studentProfile: StudentProfileLevel;
  glossary: GlossaryEntry[];
  extractedVocab: WordBreakdownItem[];
  initialTutorPrompt?: string;
  onGainXp: (amount: number, reason: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'babaturan';
  text: string;
  timestamp: string;
}

export const LearningStudioView: React.FC<LearningStudioViewProps> = ({
  activeSubTab,
  onSelectSubTab,
  studentProfile,
  glossary,
  extractedVocab,
  initialTutorPrompt,
  onGainXp,
}) => {
  // 1. AI Tutor State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'babaturan',
      text: 'Sampurasun! Tepangkeun, abdi BABATURAN — sahabat diajar basa Sunda anjeun di SMAN 2 Tambun Selatan. Teu kedah sieun salah nya! Anjeun tiasa naroskeun arti kecap, cara ngabédakeun basa Loma jeung Lemes, atanapi latihan nyusun kalimah.',
      timestamp: '08:00',
    },
  ]);
  const [tutorInput, setTutorInput] = useState<string>(
    initialTutorPrompt || 'Bagaimana cara mengatakan saya mau pergi ke sekolah dalam bahasa Sunda?'
  );
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialTutorPrompt && initialTutorPrompt.trim()) {
      setTutorInput(initialTutorPrompt);
    }
  }, [initialTutorPrompt]);

  // 2. Roleplay (Hayu Nyarita) State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    ROLEPLAY_SCENARIOS[0].id
  );
  const [assistMode, setAssistMode] = useState<'easy' | 'normal' | 'challenge'>('easy');
  const [roleplayInput, setRoleplayInput] = useState<string>('');
  const [roleplayHistory, setRoleplayHistory] = useState<
    {
      speaker: string;
      sunda: string;
      meaning: string;
      respectMeter?: 'Merenah' | 'Perlu Dilereskeun' | 'Perlu Konteks';
      feedback?: string;
    }[]
  >([
    {
      speaker: ROLEPLAY_SCENARIOS[0].aiPersona,
      sunda: ROLEPLAY_SCENARIOS[0].openingLineSunda,
      meaning: ROLEPLAY_SCENARIOS[0].openingLineMeaning,
    },
  ]);

  // 3. Undak-Usuk Battle State
  const [uuIndex, setUuIndex] = useState<number>(0);
  const [selectedUuOption, setSelectedUuOption] = useState<string | null>(null);

  // 4. Kandaga Kecap (Vocabulary Quest) State
  const [vocabCategory, setVocabCategory] = useState<string>('Semua');
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [masteredIds, setMasteredIds] = useState<string[]>(['g-1']);

  // 5. Kurikulum & Aksara Sunda State
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    CURRICULUM_MODULES[0].id
  );
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [latinForAksara, setLatinForAksara] = useState<string>('abdi diajar basa sunda');

  // 6. Cultural Explorer State
  const [selectedCultureId, setSelectedCultureId] = useState<string>(
    CULTURAL_TOPICS[0].id
  );
  const [cultureQuizAnswer, setCultureQuizAnswer] = useState<number | null>(null);

  const handleSendTutorMessage = async (
    actionType:
      | 'general'
      | 'translate'
      | 'explain'
      | 'examples'
      | 'practice'
      | 'to_loma'
      | 'to_lemes' = 'general',
    overrideMessage?: string
  ) => {
    const msgToSend = (overrideMessage !== undefined ? overrideMessage : tutorInput).trim();
    if (!msgToSend) return;

    const userEntry: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: msgToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setChatMessages((prev) => [...prev, userEntry]);
    if (overrideMessage === undefined) setTutorInput('');
    setIsTutorLoading(true);

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgToSend,
          actionType,
          studentProfile,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { reply: string };
        setChatMessages((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: 'babaturan',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        onGainXp(15, 'Berdiskusi & Belajar bersama BABATURAN AI Tutor');
      }
    } finally {
      setIsTutorLoading(false);
    }
  };

  const activeScenario =
    ROLEPLAY_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    ROLEPLAY_SCENARIOS[0];

  const handleSelectScenario = (scenarioId: string) => {
    const found =
      ROLEPLAY_SCENARIOS.find((s) => s.id === scenarioId) || ROLEPLAY_SCENARIOS[0];
    setSelectedScenarioId(found.id);
    setRoleplayHistory([
      {
        speaker: found.aiPersona,
        sunda: found.openingLineSunda,
        meaning: found.openingLineMeaning,
      },
    ]);
    setRoleplayInput('');
  };

  const handleSendRoleplayResponse = async (textOverride?: string) => {
    const text = (textOverride !== undefined ? textOverride : roleplayInput).trim();
    if (!text) return;

    setRoleplayInput('');
    try {
      const res = await fetch('/api/roleplay/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: activeScenario.id,
          studentMessage: text,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          characterReplySunda: string;
          characterReplyMeaning: string;
          respectMeter: 'Merenah' | 'Perlu Dilereskeun' | 'Perlu Konteks';
          feedback: string;
        };

        setRoleplayHistory((prev) => [
          ...prev,
          {
            speaker: 'Anjeun (Siswa)',
            sunda: text,
            meaning: 'Respons latihan percakapan siswa',
            respectMeter: data.respectMeter,
            feedback: data.feedback,
          },
          {
            speaker: activeScenario.aiPersona,
            sunda: data.characterReplySunda,
            meaning: data.characterReplyMeaning,
          },
        ]);
        onGainXp(25, `Berlatih Percakapan Hayu Nyarita (${activeScenario.title})`);
      }
    } catch {
      // Fallback
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'id-ID';
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    }
  };

  const activeUuQuestion = UNDAK_USUK_CHALLENGES[uuIndex];
  const activeCurriculumMod =
    CURRICULUM_MODULES.find((m) => m.id === selectedModuleId) ||
    CURRICULUM_MODULES[0];
  const activeCultureTopic =
    CULTURAL_TOPICS.find((c) => c.id === selectedCultureId) ||
    CULTURAL_TOPICS[0];

  const categories = ['Semua', ...Array.from(new Set(glossary.map((g) => g.category)))];
  const filteredGlossary =
    vocabCategory === 'Semua'
      ? glossary
      : glossary.filter((g) => g.category === vocabCategory);

  return (
    <div className="space-y-6">
      {/* Studio Sub-Navigation Segmented Bar */}
      <div
        className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-wrap items-center gap-1.5"
        role="tablist"
        aria-label="Modul Studio Belajar BABATURAN"
      >
        {[
          { id: 'ai_tutor', label: 'Ngobrol AI Tutor', icon: Sparkles },
          { id: 'hayu_nyarita', label: 'Hayu Nyarita! (Roleplay)', icon: MessageCircle },
          { id: 'undak_usuk', label: 'Undak-Usuk Battle', icon: Swords },
          { id: 'kandaga_kecap', label: 'Kandaga Kecap (Kosakata)', icon: Flame },
          { id: 'kurikulum_aksara', label: 'Kurikulum SMA & Aksara Sunda', icon: BookOpen },
          { id: 'budaya_sunda', label: 'Budaya Sunda Explorer', icon: Compass },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectSubTab(tab.id as StudioSubTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: NGOBROL AI TUTOR */}
      {activeSubTab === 'ai_tutor' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <BabaturanMascot
              mood="ramah"
              size="md"
              caption="Tanyakan kosakata, tata bahasa, atau minta BABATURAN mengubah kalimatmu ke Ragam Loma atau Lemes!"
            />
            <div className="text-xs text-slate-500">
              Profil Adaptif Aktif: <span className="font-semibold text-slate-800">{studentProfile.toUpperCase()}</span>
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {msg.sender === 'user' ? 'Anjeun (Siswa)' : 'BABATURAN AI Tutor'} · {msg.timestamp}
                </div>
                <div
                  className={`max-w-2xl p-4 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#059669] text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* 6 Pedagogical Quick Action Buttons (Section 7 Requirement) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500 mr-1">Tombol Aksi Cepat:</span>
            {[
              { id: 'translate', label: 'Translate' },
              { id: 'explain', label: 'Explain' },
              { id: 'examples', label: 'Give Examples' },
              { id: 'practice', label: 'Practice This Sentence' },
              { id: 'to_loma', label: 'Change to Loma' },
              { id: 'to_lemes', label: 'Change to Lemes' },
            ].map((act) => (
              <button
                key={act.id}
                type="button"
                disabled={isTutorLoading}
                onClick={() =>
                  handleSendTutorMessage(
                    act.id as
                      | 'translate'
                      | 'explain'
                      | 'examples'
                      | 'practice'
                      | 'to_loma'
                      | 'to_lemes',
                    tutorInput || 'Saya ingin pergi ke sekolah bersama teman.'
                  )
                }
                className="px-3 py-1.5 text-xs font-semibold text-[#065F46] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex gap-3">
            <label htmlFor="ai-tutor-input" className="sr-only">
              Ketik pertanyaan untuk BABATURAN AI Tutor
            </label>
            <input
              id="ai-tutor-input"
              type="text"
              value={tutorInput}
              onChange={(e) => setTutorInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTutorMessage('general')}
              placeholder="Tanyakan sesuatu (misal: Apa bedanya 'neda' dan 'tuang'?)"
              className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]"
            />
            <button
              type="button"
              disabled={isTutorLoading}
              onClick={() => handleSendTutorMessage('general')}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>{isTutorLoading ? 'Memproses...' : 'Kirim'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: HAYU NYARITA! (ROLEPLAY CONVERSATION SIMULATOR) */}
      {activeSubTab === 'hayu_nyarita' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Scenario Selector */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                Simulator Percakapan Situasional
              </p>
              <h2 className="text-lg font-bold text-slate-900">
                Pilih Skenario Hayu Nyarita!
              </h2>
            </div>

            <div className="space-y-2.5">
              {ROLEPLAY_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    sc.id === activeScenario.id
                      ? 'bg-[#ECFDF5] border-[#059669] text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#059669]">{sc.levelLabel}</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{sc.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Lawan Bicara: {sc.aiPersona} · {sc.recommendedRegister}
                  </p>
                </button>
              ))}
            </div>

            {/* Assistance Level Selector */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Tingkat Bantuan (Scaffolding):
              </p>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: 'easy', label: 'Easy Mode' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'challenge', label: 'Challenge' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setAssistMode(m.id as 'easy' | 'normal' | 'challenge')
                    }
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      assistMode === m.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Active Roleplay Stage */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500">
                  {activeScenario.levelLabel} · Target: {activeScenario.recommendedRegister}
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  {activeScenario.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {activeScenario.contextDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => speakText(activeScenario.openingLineSunda)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#065F46] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Dengarkan Dialog</span>
              </button>
            </div>

            {/* Dialogue Stream */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {roleplayHistory.map((turn, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    turn.speaker.includes('Anjeun')
                      ? 'bg-emerald-50/70 border-emerald-200 ml-6'
                      : 'bg-slate-50 border-slate-200 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-800">{turn.speaker}</span>
                    {turn.respectMeter && (
                      <span
                        className={`font-semibold ${
                          turn.respectMeter === 'Merenah'
                            ? 'text-[#059669]'
                            : 'text-amber-700'
                        }`}
                      >
                        Indikator Kesantunan: {turn.respectMeter}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{turn.sunda}</p>
                  {assistMode === 'easy' && (
                    <p className="text-xs text-slate-600 mt-1">Arti: {turn.meaning}</p>
                  )}
                  {turn.feedback && (
                    <p className="text-xs text-[#065F46] bg-white/80 p-2.5 rounded-lg mt-2 border border-emerald-200">
                      <span className="font-semibold">Umpan Balik BABATURAN:</span> {turn.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Scaffolding Hints Based on Mode */}
            {assistMode === 'easy' && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <p className="text-xs font-semibold text-amber-900">
                  Petunjuk Easy Mode & Contoh Respons Cepat:
                </p>
                <ul className="text-xs text-slate-700 list-disc pl-4 space-y-1">
                  {activeScenario.easyHints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeScenario.sampleResponses.map((sr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendRoleplayResponse(sr.text)}
                      className="text-left px-3 py-1.5 text-xs font-medium bg-white border border-amber-300 hover:bg-amber-100 rounded-lg text-slate-800 transition-colors"
                    >
                      Gunakan: "{sr.text}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {assistMode === 'normal' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold">Kata Kunci Normal Mode:</span>{' '}
                {activeScenario.normalKeywords.join(' · ')}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={roleplayInput}
                onChange={(e) => setRoleplayInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendRoleplayResponse()}
                placeholder="Ketik balasan Bahasa Sunda kamu di sini..."
                aria-label="Ketik balasan simulasi percakapan"
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
              <button
                type="button"
                onClick={() => handleSendRoleplayResponse()}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap"
              >
                Kirim Respons
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UNDAK-USUK BATTLE */}
      {activeSubTab === 'undak_usuk' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                Undak-Usuk Battle · Tantangan Konteks Sosial Nyata ({uuIndex + 1}/
                {UNDAK_USUK_CHALLENGES.length})
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                {activeUuQuestion.challengeType}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {UNDAK_USUK_CHALLENGES.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setUuIndex(idx);
                    setSelectedUuOption(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    idx === uuIndex
                      ? 'bg-[#059669] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tantangan {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 text-sm">
            <p className="text-xs text-slate-500">
              Pembicara: <span className="font-semibold text-slate-800">{activeUuQuestion.speaker}</span> · Lawan Bicara:{' '}
              <span className="font-semibold text-slate-800">{activeUuQuestion.interlocutor}</span>
            </p>
            <p className="text-slate-700">Situasi: {activeUuQuestion.situation}</p>
            <p className="font-bold text-slate-900 pt-2 text-base">
              {activeUuQuestion.questionPrompt}
            </p>
          </div>

          <div className="space-y-3">
            {activeUuQuestion.options.map((opt) => {
              const isChosen = selectedUuOption === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isChosen
                      ? opt.isCorrect
                        ? 'bg-emerald-50 border-[#059669]'
                        : 'bg-amber-50 border-amber-400'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{opt.text}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUuOption(opt.id);
                        if (opt.isCorrect) {
                          onGainXp(20, 'Menjawab Tepat Tantangan Undak-Usuk Battle');
                        }
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                    >
                      Pilih Jawaban Ini
                    </button>
                  </div>

                  {isChosen && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs space-y-1">
                      <p className="font-semibold text-slate-900">
                        Status: {opt.isCorrect ? 'Merenah (Tepat Sesuai Konteks)' : 'Perlu Dilereskeun'} · {opt.registerLabel}
                      </p>
                      <p className="text-slate-700 leading-relaxed">{opt.explanation}</p>
                      <p className="text-[#065F46] font-medium">
                        Catatan Perbaikan: {opt.correctedWordHint}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: KANDAGA KECAP (VOCABULARY QUEST) */}
      {activeSubTab === 'kandaga_kecap' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                Vocabulary Quest · Spaced Repetition Tiga Bahasa (Sunda · Indonesia · Inggris)
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                Kandaga Kecap & Koleksi Kosakata Pribadi
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setVocabCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    vocabCategory === cat
                      ? 'bg-[#059669] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Extracted Words from Translator */}
          {extractedVocab.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <p className="text-xs font-semibold text-[#065F46]">
                Kosakata Hasil Ekstraksi Translator Kamu ({extractedVocab.length} kata):
              </p>
              <div className="flex flex-wrap gap-3">
                {extractedVocab.map((v) => (
                  <div
                    key={v.word}
                    className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs"
                  >
                    <span className="font-bold text-slate-900">{v.word}</span> = {v.meaning} (
                    {v.register})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flashcards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlossary.map((g) => {
              const isFlipped = flippedCardId === g.id;
              const isMastered = masteredIds.includes(g.id);
              return (
                <div
                  key={g.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {g.category} · {g.partOfSpeech}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakText(g.sundaLemesSorangan !== '-' ? g.sundaLemesSorangan : g.sundaLoma)}
                        aria-label={`Dengarkan kosakata ${g.sundaLoma}`}
                        className="text-[#059669] hover:underline inline-flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Audio</span>
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      Loma: {g.sundaLoma}
                    </h3>
                    <p className="text-xs text-[#065F46] font-medium mt-1">
                      Lemes Sorangan: {g.sundaLemesSorangan} · Lemes Batur: {g.sundaLemesBatur}
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-2">
                      ID: {g.indonesia} · EN: {g.english}
                    </p>

                    {isFlipped && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1.5 text-slate-700">
                        <p>
                          <span className="font-semibold">Contoh Loma:</span> "{g.exampleLoma}"
                        </p>
                        <p>
                          <span className="font-semibold">Contoh Lemes:</span> "{g.exampleLemes}"
                        </p>
                        <p className="text-slate-500">{g.usageNote}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setFlippedCardId(isFlipped ? null : g.id)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                    >
                      {isFlipped ? 'Tutup Contoh' : 'Lihat Contoh Kalimat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isMastered) {
                          setMasteredIds((prev) => [...prev, g.id]);
                          onGainXp(10, `Menguasai kosakata ${g.sundaLoma}`);
                        }
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        isMastered
                          ? 'bg-emerald-100 text-[#065F46]'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      {isMastered ? 'Dikuasai ✓' : 'Tandai Dikuasai'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: KURIKULUM SMA & AKSARA SUNDA CORNER */}
      {activeSubTab === 'kurikulum_aksara' && (
        <div className="space-y-6">
          {/* SMA Curriculum Hub */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-[#059669]">
                  SMA Curriculum Learning Hub · Capaian Pembelajaran Fase E & Fase F
                </p>
                <h2 className="text-xl font-bold text-slate-900">
                  Materi Bahasa & Sastra Sunda SMA
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {CURRICULUM_MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setSelectedModuleId(mod.id);
                      setSelectedQuizAnswer(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      mod.id === activeCurriculumMod.id
                        ? 'bg-[#059669] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {mod.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <p className="text-xs text-slate-500">
                    {activeCurriculumMod.fase} · Kode: {activeCurriculumMod.cpCode}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activeCurriculumMod.title} — {activeCurriculumMod.subtitle}
                  </h3>
                  <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                    {activeCurriculumMod.summaryExplanation}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-[#065F46]">
                    Kutipan Teks Basa Sunda:
                  </p>
                  <p className="text-sm font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                    "{activeCurriculumMod.excerptSunda}"
                  </p>
                  <p className="text-xs text-slate-600 pt-2 border-t border-slate-200 whitespace-pre-line">
                    Terjemahan Indonesia: "{activeCurriculumMod.excerptTranslationId}"
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <p className="text-xs font-semibold text-[#065F46]">
                    Kuis Formatif Materi:
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {activeCurriculumMod.quizQuestion.question}
                  </p>
                  <div className="space-y-2">
                    {activeCurriculumMod.quizQuestion.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedQuizAnswer(idx);
                          if (idx === activeCurriculumMod.quizQuestion.correctIndex) {
                            onGainXp(20, `Menyelesaikan Kuis ${activeCurriculumMod.title}`);
                          }
                        }}
                        className={`w-full text-left p-2.5 text-xs font-medium rounded-lg border transition-colors ${
                          selectedQuizAnswer === idx
                            ? idx === activeCurriculumMod.quizQuestion.correctIndex
                              ? 'bg-[#059669] text-white border-[#059669]'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {selectedQuizAnswer !== null && (
                    <p className="text-xs text-slate-700 pt-1">
                      {activeCurriculumMod.quizQuestion.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Aksara Sunda Corner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                Aksara Sunda Corner · Unicode Baku (Swara, Ngalagena, Rarangken & Angka)
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                Simulator Transliterasi Latin ke Aksara Sunda
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label
                  htmlFor="aksara-latin-input"
                  className="block text-xs font-semibold text-slate-600"
                >
                  Ketik Kata / Kalimat Latin Basa Sunda:
                </label>
                <input
                  id="aksara-latin-input"
                  type="text"
                  value={latinForAksara}
                  onChange={(e) => setLatinForAksara(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['abdi diajar basa sunda', 'sampurasun rampés', 'wilujeng énjing guru'].map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setLatinForAksara(preset)}
                        className="px-2.5 py-1 text-xs bg-slate-200/70 hover:bg-slate-200 text-slate-700 rounded-md"
                      >
                        {preset}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-emerald-200 flex flex-col justify-center">
                <span className="text-xs font-semibold text-[#065F46]">
                  Hasil Aksara Sunda Unicode:
                </span>
                <p
                  className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-wide"
                  data-testid="aksara-sunda-output"
                >
                  {transliterateToAksaraSunda(latinForAksara)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {AKSARA_SUNDA_DATA.slice(0, 14).map((ak) => (
                <div
                  key={ak.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-1"
                >
                  <p className="text-2xl font-bold text-[#065F46]">{ak.glyph}</p>
                  <p className="text-xs font-bold text-slate-900">{ak.latin}</p>
                  <p className="text-[11px] text-slate-500">
                    {ak.exampleWordSunda} ({ak.exampleWordAksara})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SUNDANESE CULTURE EXPLORER */}
      {activeSubTab === 'budaya_sunda' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-[#059669]">
                Sundanese Culture Explorer · Falsafah, Seni, Paribasa & Tradisi Pasundan
              </p>
              <h2 className="text-xl font-bold text-slate-900">
                Eksplorasi Kearifan Lokal & Budaya Sunda
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {CULTURAL_TOPICS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCultureId(c.id);
                    setCultureQuizAnswer(null);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    c.id === activeCultureTopic.id
                      ? 'bg-[#059669] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.title.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-3">
              <p className="text-xs text-slate-500">
                {activeCultureTopic.category} · {activeCultureTopic.sundaTerm}
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                {activeCultureTopic.title}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                {activeCultureTopic.summary}
              </p>
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800">
                <span className="font-semibold">Nilai Karakter & Relevansi Siswa SMA:</span>{' '}
                {activeCultureTopic.philosophicalValue}
              </div>
            </div>

            <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-[#059669]">
                Tantangan Eksplorasi Budaya:
              </p>
              <p className="text-sm font-bold text-slate-900">
                {activeCultureTopic.quizChallenge.question}
              </p>
              <div className="space-y-2">
                {activeCultureTopic.quizChallenge.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCultureQuizAnswer(idx);
                      if (idx === activeCultureTopic.quizChallenge.correctIndex) {
                        onGainXp(20, `Menyelesaikan Misi Budaya ${activeCultureTopic.title}`);
                      }
                    }}
                    className={`w-full text-left p-2.5 text-xs font-medium rounded-lg border transition-colors ${
                      cultureQuizAnswer === idx
                        ? idx === activeCultureTopic.quizChallenge.correctIndex
                          ? 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {cultureQuizAnswer !== null && (
                <p className="text-xs text-slate-700 pt-1">
                  {activeCultureTopic.quizChallenge.explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
