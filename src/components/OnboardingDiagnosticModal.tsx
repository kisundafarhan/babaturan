import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { evaluateDiagnosticProfile } from '../lib/engine';
import { StudentProfileLevel } from '../lib/sundaData';

interface OnboardingDiagnosticModalProps {
  isOpen: boolean;
  currentProfile: StudentProfileLevel;
  onClose: () => void;
  onSelectProfile: (profile: StudentProfileLevel, bonusXp: number) => void;
}

const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'dq-1',
    skill: 'Penguasaan Kosakata & Sapaan',
    question: 'Jika seseorang menyapa dengan ucapan "Sampurasun!", apakah balasan yang tepat dalam Bahasa Sunda?',
    options: ['Rampés!', 'Hatur nuhun!', 'Punten!'],
    correctIndex: 0,
  },
  {
    id: 'dq-2',
    skill: 'Pemahaman Undak-Usuk Basa (Lemes Sorangan vs Batur)',
    question: 'Kalimat manakah yang tepat untuk mengatakan "Saya sudah makan di rumah" kepada Bapak Guru?',
    options: [
      'Abdi parantos neda di rorompok.',
      'Abdi parantos tuang di bumi.',
      'Kuring geus dahar di imah.',
    ],
    correctIndex: 0,
  },
  {
    id: 'dq-3',
    skill: 'Pemahaman Kalimat & Terjemahan',
    question: 'Apa arti dari kalimat: "Kuring rék indit ka sakola bareng babaturan"?',
    options: [
      'Saya akan pergi ke sekolah bersama teman.',
      'Saya baru pulang dari sekolah sendirian.',
      'Teman saya sedang belajar di perpustakaan.',
    ],
    correctIndex: 0,
  },
  {
    id: 'dq-4',
    skill: 'Konteks Komunikasi & Ragam Basa',
    question: 'Kapan penggunaan kata ganti "Kuring" atau "Urang" dianggap tepat dan alami?',
    options: [
      'Saat mengobrol akrab dengan teman sebaya (Ragam Basa Loma).',
      'Saat meminta izin resmi kepada Kepala Sekolah.',
      'Kata "Kuring" selalu salah dalam semua situasi.',
    ],
    correctIndex: 0,
  },
];

export const OnboardingDiagnosticModal: React.FC<OnboardingDiagnosticModalProps> = ({
  isOpen,
  currentProfile,
  onClose,
  onSelectProfile,
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [diagResult, setDiagResult] = useState<ReturnType<
    typeof evaluateDiagnosticProfile
  > | null>(null);

  if (!isOpen) return null;

  const handleRunDiagnostic = () => {
    let correct = 0;
    for (const q of DIAGNOSTIC_QUESTIONS) {
      if (answers[q.id] === q.correctIndex) correct += 1;
    }
    const evaluated = evaluateDiagnosticProfile(
      correct,
      DIAGNOSTIC_QUESTIONS.length
    );
    setDiagResult(evaluated);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diag-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-lg space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-semibold text-[#059669]">
              Pembelajaran Berdiferensiasi · SMAN 2 Tambun Selatan
            </p>
            <h2 id="diag-modal-title" className="text-xl font-bold text-slate-900">
              Pilih Profil Kemampuan Awal atau Ikuti Asesmen Diagnostik Singkat
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal diagnostik"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Differentiated Profiles */}
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2.5">
            Pilihan Langsung Empat Profil Kemampuan Siswa:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'pamula' as StudentProfileLevel,
                title: 'A. Pamula — Saya Belum Bisa Bahasa Sunda',
                desc: 'Mulai dari kosakata sehari-hari, sapaan, bantuan terjemahan Indonesia, dan kalimat pendek.',
              },
              {
                id: 'ngarti_pasif' as StudentProfileLevel,
                title: 'B. Ngarti Tapi Can Bisa Nyarita',
                desc: 'Paham percakapan tetapi belum berani bicara. Fokus mengubah bahasa pasif menjadi aktif.',
              },
              {
                id: 'ngamimitian_nyarita' as StudentProfileLevel,
                title: 'C. Ngamimitian Nyarita — Saya Bisa Sedikit',
                desc: 'Memperluas kosakata, melatih kelancaran Loma vs Lemes sesuai konteks, dan bercerita.',
              },
              {
                id: 'mahir' as StudentProfileLevel,
                title: 'D. Mahir — Ingin Meningkatkan Kemampuan',
                desc: 'Diskusi kompleks, Panumbu Catur, analisis sastra Sunda (Carpon, Wawacan), dan peribahasa.',
              },
            ].map((p) => {
              const active = currentProfile === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectProfile(p.id, 15);
                    onClose();
                  }}
                  className={`text-left p-3.5 rounded-xl border transition-colors ${
                    active
                      ? 'bg-[#ECFDF5] border-[#059669] text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Diagnostic Mini Quiz */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <p className="text-xs font-semibold text-[#059669]">
            Atau Kerjakan 4 Soal Diagnostic Assessment untuk Rekomendasi Otomatis:
          </p>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {DIAGNOSTIC_QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <p className="text-xs text-slate-500">
                  Soal {idx + 1} · {q.skill}
                </p>
                <p className="text-xs font-bold text-slate-900">{q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                      }
                      className={`text-left p-2 text-xs rounded-lg border transition-colors ${
                        answers[q.id] === oIdx
                          ? 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {diagResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <p className="text-xs font-bold text-[#065F46]">
                Hasil Diagnostik: {diagResult.title}
              </p>
              <p className="text-xs text-slate-800">{diagResult.recommendationId}</p>
              <button
                type="button"
                onClick={() => {
                  onSelectProfile(diagResult.profile, 30);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#059669] rounded-lg"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terapkan Profil Ini (+30 XP)</span>
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleRunDiagnostic}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Lihat Hasil Rekomendasi Diagnostik
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
