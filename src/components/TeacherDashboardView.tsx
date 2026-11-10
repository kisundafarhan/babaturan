import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import {
  evaluateWritingRubric,
  totalRubricScore,
  WritingLabAssignment,
  WritingLabSessionState,
} from '../lib/engine';
import {
  GlossaryEntry,
  RevisionCategory,
  STUDENT_REFLECTION_QUESTIONS,
  WritingPolicyMode,
} from '../lib/sundaData';

interface TeacherDashboardViewProps {
  assignment: WritingLabAssignment;
  session: WritingLabSessionState;
  glossary: GlossaryEntry[];
  onUpdateAssignment: (next: WritingLabAssignment) => void;
  onUpdateSession: (next: WritingLabSessionState) => void;
  onAddGlossaryEntry: (entry: GlossaryEntry) => void;
}

const REVISION_TAXONOMY_CATEGORIES: RevisionCategory[] = [
  'Lexical Revision',
  'Grammar Revision',
  'Sentence Structure Revision',
  'Context and Register Revision',
  'Content Revision',
  'Organization Revision',
];

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  assignment,
  session,
  glossary,
  onUpdateAssignment,
  onUpdateSession,
  onAddGlossaryEntry,
}) => {
  const [teacherSubTab, setTeacherSubTab] = useState<
    'research_evidence' | 'assignment_setup' | 'glossary_manager'
  >('research_evidence');

  // New Glossary Form State
  const [newLoma, setNewLoma] = useState<string>('');
  const [newLemesSorangan, setNewLemesSorangan] = useState<string>('');
  const [newLemesBatur, setNewLemesBatur] = useState<string>('');
  const [newIdMeaning, setNewIdMeaning] = useState<string>('');
  const [newUsageNote, setNewUsageNote] = useState<string>('');
  const [glossaryNotice, setGlossaryNotice] = useState<string | null>(null);

  const d1Score = session.draft1Rubric || evaluateWritingRubric(session.draft1Text || 'Poé Senén kuring indit ka sakola.');
  const d2Score =
    session.draft2Rubric ||
    evaluateWritingRubric(
      session.draft2Text ||
        'Nalika dinten Senén munggaran lebet ka SMAN 2 Tambun Selatan, abdi mios ka sakola sareng réréncangan.'
    );

  const acceptedCount = session.revisionSuggestions.filter(
    (r) => r.decision === 'accepted'
  ).length;
  const rejectedCount = session.revisionSuggestions.filter(
    (r) => r.decision === 'rejected'
  ).length;

  const handleExportResearchCsv = () => {
    const headers = [
      'Student_Name',
      'Class',
      'Policy_Mode',
      'Draft1_Text',
      'AI_Comparison_Text',
      'Draft2_Text',
      'Draft1_Total_Score',
      'Draft2_Total_Score',
      'Accepted_AI_Suggestions',
      'Rejected_AI_Suggestions',
      'Translation_Assist_Count',
      'AI_Assist_Count',
      'Reflection_Summary',
    ];

    const reflectionCombined = Object.entries(session.reflections)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');

    const row = [
      session.studentName,
      session.studentClass,
      session.policyMode,
      `"${(session.draft1Text || '').replace(/"/g, '""')}"`,
      `"${(session.aiComparisonText || '').replace(/"/g, '""')}"`,
      `"${(session.draft2Text || '').replace(/"/g, '""')}"`,
      totalRubricScore(d1Score),
      totalRubricScore(d2Score),
      acceptedCount,
      rejectedCount,
      session.assistanceLogs.filter((l) => l.type === 'TRANSLATION_ASSISTANCE').length,
      session.assistanceLogs.filter((l) => l.type === 'AI_WRITING_ASSISTANCE').length,
      `"${reflectionCombined.replace(/"/g, '""')}"`,
    ];

    const csvContent = `${headers.join(',')}\n${row.join(',')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BABATURAN_Research_Evidence_${session.studentName.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddGlossary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoma.trim() || !newIdMeaning.trim()) {
      setGlossaryNotice('Mohon isi minimal kata Loma dan arti Bahasa Indonesianya.');
      return;
    }
    const entry: GlossaryEntry = {
      id: `g-custom-${Date.now()}`,
      sundaLoma: newLoma.trim(),
      sundaLemesSorangan: newLemesSorangan.trim() || newLoma.trim(),
      sundaLemesBatur: newLemesBatur.trim() || newLemesSorangan.trim() || '-',
      indonesia: newIdMeaning.trim(),
      english: 'Contextual Sundanese term',
      category: 'Glosarium Guru',
      partOfSpeech: 'Kosakata Kurikulum',
      exampleLoma: `Conto kalimah nganggo kecap ${newLoma.trim()}.`,
      exampleLemes: `Conto kalimah lemes nganggo kecap ${newLemesSorangan.trim() || newLoma.trim()}.`,
      exampleMeaningId: `Contoh kalimat menggunakan kata ${newIdMeaning.trim()}.`,
      usageNote: newUsageNote.trim() || 'Diverifikasi oleh Guru Bahasa Sunda.',
      sourceRef: 'Glosarium Sekolah SMAN 2 Tambun Selatan',
    };
    onAddGlossaryEntry(entry);
    setNewLoma('');
    setNewLemesSorangan('');
    setNewLemesBatur('');
    setNewIdMeaning('');
    setNewUsageNote('');
    setGlossaryNotice(`Kosakata "${entry.sundaLoma}" berhasil ditambahkan ke Glosarium Translator!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#059669]">
            Ruang Guru & Research Evidence Dashboard · SMAN 2 Tambun Selatan
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Panel Manajemen Pembelajaran & Bukti Penelitian Menulis
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Evaluasi perkembangan keterampilan menulis siswa dari Draft 1 (Mandiri) → Perbandingan AI → Draft 2 (Revisi Mandiri) beserta analisis taksonomi revisi dan refleksi metakognitif.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportResearchCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Laporan Bukti Belajar (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-wrap gap-2">
        {[
          {
            id: 'research_evidence',
            label: 'Research Evidence Dashboard (Draft 1 vs AI vs Draft 2)',
            icon: FileSpreadsheet,
          },
          {
            id: 'assignment_setup',
            label: 'Pengaturan Kebijakan Tugas & AI Lock (Mode A/B/C)',
            icon: Settings,
          },
          {
            id: 'glossary_manager',
            label: 'Database Glosarium Bahasa Sunda Sekolah',
            icon: Users,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = teacherSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setTeacherSubTab(
                  t.id as 'research_evidence' | 'assignment_setup' | 'glossary_manager'
                )
              }
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: RESEARCH EVIDENCE DASHBOARD */}
      {teacherSubTab === 'research_evidence' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <p className="text-xs text-slate-500">Pertanyaan Penelitian Utama</p>
              <p className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                Pengaruh Draft 1 Tanpa AI + Perbandingan Versi Chatbot terhadap Revisi Mandiri (Draft 2)
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs tabular-nums">
              <p className="text-xs text-slate-500">Perbandingan Rubrik Setara</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totalRubricScore(d1Score)}{' '}
                <span className="text-sm font-normal text-slate-400">→</span>{' '}
                <span className="text-[#059669]">{totalRubricScore(d2Score)}</span>
                <span className="text-xs font-normal text-slate-500"> / 100</span>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Selisih: +{Math.max(0, totalRubricScore(d2Score) - totalRubricScore(d1Score))} poin (5 indikator)
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs tabular-nums">
              <p className="text-xs text-slate-500">Keputusan Kritis Siswa atas Saran AI</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {acceptedCount} Diterima · {rejectedCount} Ditolak
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Dari total {session.revisionSuggestions.length} poin catatan revisi
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs tabular-nums">
              <p className="text-xs text-slate-500">Log Bantuan Tahap 2</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {
                  session.assistanceLogs.filter(
                    (l) => l.type === 'TRANSLATION_ASSISTANCE'
                  ).length
                }{' '}
                Trans ·{' '}
                {
                  session.assistanceLogs.filter(
                    (l) => l.type === 'AI_WRITING_ASSISTANCE'
                  ).length
                }{' '}
                AI
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Tercatat terpisah setelah Draft 1 dikunci
              </p>
            </div>
          </div>

          {/* 3-Column Evidence Comparison: Draft 1 vs AI Version vs Draft 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Bukti Artefak Menulis Siswa: {session.studentName} ({session.studentClass})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  1. DRAFT 1 — Written Independently Without AI
                </p>
                <p className="text-sm text-slate-900 leading-relaxed">
                  {session.draft1Text ||
                    'Poé Senén kuring indit ka SMAN 2 Tambun Selatan bareng babaturan. Kuring tuang di kantin sakola tuluy balik ka imah.'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <p className="text-xs font-semibold text-amber-800">
                  2. AI-GENERATED VERSION — FOR COMPARISON ONLY
                </p>
                <p className="text-sm text-slate-900 leading-relaxed">
                  {session.aiComparisonText ||
                    'Nalika dinten Senén munggaran lebet ka SMAN 2 Tambun Selatan, abdi mios ti rorompok sareng réréncangan...'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <p className="text-xs font-semibold text-[#065F46]">
                  3. DRAFT 2 — Student Revised Writing
                </p>
                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {session.draft2Text ||
                    'Belum dikumpulkan oleh siswa (atau gunakan tombol di Writing Lab Tahap 4).'}
                </p>
              </div>
            </div>
          </div>

          {/* Revision Taxonomy Breakdown & Teacher Verification */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Klasifikasi Jenis Revisi (Revision Taxonomy)
              </h3>
              <p className="text-xs text-slate-600">
                Pengelompokan jenis revisi untuk analisis penelitian guru:
              </p>
              <div className="space-y-2.5">
                {REVISION_TAXONOMY_CATEGORIES.map((cat) => {
                  const count = session.revisionSuggestions.filter(
                    (r) => r.category === cat
                  ).length;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <span className="font-semibold text-slate-800">{cat}</span>
                      <span className="tabular-nums text-slate-600">
                        {count} temuan dianalisis
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Verifikasi & Catatan Evaluasi Guru
              </h3>
              <p className="text-xs text-slate-600">
                Catatan Metodologis: Jangan menyimpulkan bahwa AI menyebabkan peningkatan kemampuan hanya berdasarkan selisih skor rubrik. Gunakan riwayat revisi dan refleksi siswa di bawah ini sebagai bukti triangulasi.
              </p>
              <textarea
                rows={3}
                value={session.teacherComment}
                onChange={(e) =>
                  onUpdateSession({ ...session, teacherComment: e.target.value })
                }
                placeholder="Tuliskan catatan observasi guru atas perkembangan undak-usuk dan kemandirian revisi siswa..."
                aria-label="Catatan observasi guru"
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Status: {session.teacherVerified ? 'Terverifikasi Guru ✓' : 'Menunggu Verifikasi Guru'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSession({
                      ...session,
                      teacherVerified: !session.teacherVerified,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {session.teacherVerified
                      ? 'Batalkan Verifikasi'
                      : 'Sahkan Penilaian & Bukti Belajar'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Student Reflections Display */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Rekaman Jawaban 8 Pertanyaan Refleksi Siswa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STUDENT_REFLECTION_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <p className="font-semibold text-slate-800">{q.question}</p>
                  <p className="text-slate-600">
                    {session.reflections[q.id] || 'Belum diisi oleh siswa.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENT POLICY SETUP */}
      {teacherSubTab === 'assignment_setup' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <p className="text-xs font-semibold text-[#059669]">
              11.1 Teacher Assignment Setup · Kontrol Kebijakan AI & Translator
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Pengaturan Kebijakan Tugas Menulis (Berlaku di Frontend & Backend)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                mode: 'MODE_A_INDEPENDENT' as WritingPolicyMode,
                title: 'Mode A — Independent Writing (Default)',
                desc: 'Siswa wajib menyusun Draft 1 tanpa AI dan tanpa mesin penerjemah. Dikunci penuh di server.',
              },
              {
                mode: 'MODE_B_DICTIONARY_ONLY' as WritingPolicyMode,
                title: 'Mode B — Dictionary Allowed',
                desc: 'Siswa boleh melihat glosarium kata tunggal, tetapi generator AI dan penerjemah kalimat dikunci.',
              },
              {
                mode: 'MODE_C_TEACHER_DEFINED' as WritingPolicyMode,
                title: 'Mode C — Teacher-Defined Assistance',
                desc: 'Guru mengizinkan akses alat bantu sejak tahap awal untuk latihan terbimbing.',
              },
            ].map((item) => {
              const active = session.policyMode === item.mode;
              return (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => {
                    onUpdateAssignment({ ...assignment, policyMode: item.mode });
                    onUpdateSession({ ...session, policyMode: item.mode });
                  }}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    active
                      ? 'bg-[#ECFDF5] border-[#059669] text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TRANSLATION GLOSSARY MANAGER */}
      {teacherSubTab === 'glossary_manager' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <p className="text-xs font-semibold text-[#059669]">
              6.5 Translation Glossary · Konsistensi Kosakata Terjemahan
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Tambah Istilah ke Glosarium Bahasa Sunda Sekolah
            </h2>
          </div>

          <form onSubmit={handleAddGlossary} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              value={newLoma}
              onChange={(e) => setNewLoma(e.target.value)}
              placeholder="Kata Loma (mis: saré)"
              aria-label="Kata Sunda Ragam Loma"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              value={newLemesSorangan}
              onChange={(e) => setNewLemesSorangan(e.target.value)}
              placeholder="Lemes Sorangan (mis: mondok)"
              aria-label="Kata Sunda Lemes Sorangan"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              value={newLemesBatur}
              onChange={(e) => setNewLemesBatur(e.target.value)}
              placeholder="Lemes Batur (mis: kulem)"
              aria-label="Kata Sunda Lemes Batur"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              value={newIdMeaning}
              onChange={(e) => setNewIdMeaning(e.target.value)}
              placeholder="Arti Indonesia (mis: tidur)"
              aria-label="Arti Bahasa Indonesia"
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan ke Glosarium</span>
            </button>
          </form>

          {glossaryNotice && (
            <p className="text-xs font-medium text-[#065F46] bg-emerald-50 p-3 rounded-lg">
              {glossaryNotice}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
