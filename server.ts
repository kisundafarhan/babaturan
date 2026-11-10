import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  canUseAiInWritingLab,
  canUseTranslatorInWritingLab,
  generateDraftComparison,
  translateWithMultiEngine,
} from './src/lib/engine';
import {
  INITIAL_GLOSSARY,
  LanguageCode,
  ROLEPLAY_SCENARIOS,
  TranslationContextMode,
  WritingLabStage,
  WritingPolicyMode,
} from './src/lib/sundaData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function fetchGoogleCloudTranslation(
  text: string,
  source: LanguageCode,
  target: LanguageCode
): Promise<string | undefined> {
  const apiKey = process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return undefined;
  }
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source,
        target,
        format: 'text',
      }),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as {
      data?: { translations?: { translatedText?: string }[] };
    };
    return data?.data?.translations?.[0]?.translatedText;
  } catch {
    return undefined;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // 1. Provider & API Configuration Status
  app.get('/api/providers/status', (_req, res) => {
    const hasGemini = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    );
    const hasGoogleCloudTranslate = Boolean(
      process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY &&
        process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY.trim() !== ''
    );
    const hasSundaDigi = Boolean(
      process.env.SUNDADIGI_API_KEY && process.env.SUNDADIGI_API_KEY.trim() !== ''
    );

    res.json({
      providers: [
        {
          id: 'babaturan_contextual',
          name: 'BABATURAN Internal Contextual & Lexicon Engine',
          status: 'active',
          description:
            'Mesin penerjemah kontekstual internal berbasis Undak-Usuk Basa Sunda (Loma, Lemes Sorangan, Lemes Batur) dan Glosarium Kurikulum SMA.',
        },
        {
          id: 'google_cloud_nmt',
          name: 'Google Cloud Translation API (su / id / en)',
          status: hasGoogleCloudTranslate ? 'active' : 'demo_adapter',
          description: hasGoogleCloudTranslate
            ? 'Terhubung langsung ke Google Cloud Translation NMT v2.'
            : 'Berjalan dalam mode Adapter NMT Internal (tambahkan GOOGLE_CLOUD_TRANSLATE_API_KEY untuk NMT Cloud produksi).',
        },
        {
          id: 'sundadigi_candidate',
          name: 'SundaDigi Translator (Kandidat Integrasi Khusus Sunda)',
          status: hasSundaDigi ? 'active' : 'external_reference',
          description:
            'Kandidat integrasi khusus bahasa Sunda. Tanpa scraping: menyediakan tautan rujukan resmi ke sundadigi.com/translator.',
          externalUrl: 'https://sundadigi.com/translator',
        },
        {
          id: 'gemini_ai_layer',
          name: 'Gemini AI Contextual & Pedagogical Analyzer',
          status: hasGemini ? 'active' : 'demo_fallback',
          description: hasGemini
            ? 'Aktif menganalisis perbandingan terjemahan, alasan kosakata, dan Writing Lab.'
            : 'Mode Demo Edukatif Aktif (otomatis menggunakan analisis linguistik terstruktur).',
        },
      ],
    });
  });

  // 1b. Backend Policy Verification Endpoint for Writing Lab Lock Audit
  app.post('/api/writing-lab/check-policy', (req, res) => {
    const {
      writingLabStage = 'STAGE_1_DRAFT_1',
      writingLabPolicy = 'MODE_A_INDEPENDENT',
    } = req.body as {
      writingLabStage?: WritingLabStage;
      writingLabPolicy?: WritingPolicyMode;
    };
    const translatorCheck = canUseTranslatorInWritingLab(
      writingLabStage,
      writingLabPolicy
    );
    const aiCheck = canUseAiInWritingLab(writingLabStage, writingLabPolicy);
    res.json({
      stage: writingLabStage,
      policy: writingLabPolicy,
      translatorAllowed: translatorCheck.allowed,
      aiAllowed: aiCheck.allowed,
      enforcedHttpCodeOnBypass: translatorCheck.allowed ? 200 : 403,
      reason: translatorCheck.reason,
    });
  });

  // 2. Multi-Engine Contextual Translation & Comparison Endpoint
  app.post('/api/translate', async (req, res) => {
    try {
      const {
        text,
        sourceLang = 'id',
        targetLang = 'su',
        contextMode = 'guru',
        writingLabStage,
        writingLabPolicy = 'MODE_A_INDEPENDENT',
        customGlossary = INITIAL_GLOSSARY,
      } = req.body as {
        text?: string;
        sourceLang?: LanguageCode;
        targetLang?: LanguageCode;
        contextMode?: TranslationContextMode;
        writingLabStage?: WritingLabStage;
        writingLabPolicy?: WritingPolicyMode;
        customGlossary?: typeof INITIAL_GLOSSARY;
      };

      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Teks sumber tidak boleh kosong.' });
        return;
      }

      // Enforce Priority 2 Backend Lock if called from Writing Lab Stage 1 or Stage 4
      if (writingLabStage) {
        const check = canUseTranslatorInWritingLab(writingLabStage, writingLabPolicy);
        if (!check.allowed) {
          res.status(403).json({
            error: check.reason,
            lockedByWritingLab: true,
          });
          return;
        }
      }

      const cloudNmtText = await fetchGoogleCloudTranslation(
        text.trim(),
        sourceLang,
        targetLang
      );

      const baseResult = translateWithMultiEngine(
        text.trim(),
        sourceLang,
        targetLang,
        contextMode,
        customGlossary,
        cloudNmtText
      );

      const ai = getGeminiClient();
      if (ai && text.trim().length > 3) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Analisis dan terjemahkan kalimat berikut untuk siswa SMA yang belajar Bahasa Sunda:
Teks Sumber (${sourceLang}): "${text.trim()}"
Bahasa Tujuan: ${targetLang}
Konteks Komunikasi: ${contextMode}

Berikan hasil dalam format JSON yang membandingkan:
1. Terjemahan Ragam Basa Hormat/Lemes (untuk Guru/Orang Tua, perhatikan perbedaan lemes keur sorangan seperti abdi/mios/neda/wangsul vs lemes keur batur seperti angkat/tuang/mulih).
2. Terjemahan Ragam Basa Loma (untuk teman sebaya, menggunakan kuring/urang, indit/dahar/balik).
3. Terjemahan Mesin Netral (gaya NMT umum).
4. Alasan pemilihan kosakata (mengapa kata tersebut dipilih dibanding alternatifnya).`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  primaryTranslation: { type: Type.STRING },
                  literalMeaningId: { type: Type.STRING },
                  lemesGuruText: { type: Type.STRING },
                  lemesGuruExplanation: { type: Type.STRING },
                  lomaTemanText: { type: Type.STRING },
                  lomaTemanExplanation: { type: Type.STRING },
                  neutralMachineText: { type: Type.STRING },
                  whyThisChoice: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  sentenceStructureNote: { type: Type.STRING },
                },
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text.trim());
            if (parsed.primaryTranslation) {
              baseResult.primaryTranslation = parsed.primaryTranslation;
              baseResult.providers[0].translatedText = parsed.primaryTranslation;
            }
            if (parsed.literalMeaningId) {
              baseResult.literalMeaningId = parsed.literalMeaningId;
            }
            if (parsed.lemesGuruText) {
              baseResult.registerVariants.lemesGuru.text = parsed.lemesGuruText;
            }
            if (parsed.lemesGuruExplanation) {
              baseResult.registerVariants.lemesGuru.explanation = parsed.lemesGuruExplanation;
            }
            if (parsed.lomaTemanText) {
              baseResult.registerVariants.lomaTeman.text = parsed.lomaTemanText;
            }
            if (parsed.lomaTemanExplanation) {
              baseResult.registerVariants.lomaTeman.explanation = parsed.lomaTemanExplanation;
            }
            if (parsed.neutralMachineText && !cloudNmtText) {
              baseResult.registerVariants.neutralFormal.text = parsed.neutralMachineText;
              baseResult.providers[1].translatedText = parsed.neutralMachineText;
            }
            if (Array.isArray(parsed.whyThisChoice) && parsed.whyThisChoice.length > 0) {
              baseResult.whyThisChoice = parsed.whyThisChoice;
            }
            if (parsed.sentenceStructureNote) {
              baseResult.sentenceStructureNote = parsed.sentenceStructureNote;
            }
          }
        } catch {
          // Keep deterministic baseResult if Gemini call fails or times out
        }
      }

      res.json(baseResult);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan pada layanan penerjemah.',
      });
    }
  });

  // 3. BABATURAN AI Tutor Endpoint
  app.post('/api/tutor/chat', async (req, res) => {
    try {
      const {
        message,
        actionType = 'general',
        studentProfile = 'pamula',
        writingLabStage,
        writingLabPolicy = 'MODE_A_INDEPENDENT',
      } = req.body as {
        message?: string;
        actionType?: 'general' | 'translate' | 'explain' | 'examples' | 'practice' | 'to_loma' | 'to_lemes';
        studentProfile?: string;
        writingLabStage?: WritingLabStage;
        writingLabPolicy?: WritingPolicyMode;
      };

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
        return;
      }

      if (writingLabStage) {
        const check = canUseAiInWritingLab(writingLabStage, writingLabPolicy);
        if (!check.allowed) {
          res.status(403).json({
            error: check.reason,
            lockedByWritingLab: true,
          });
          return;
        }
      }

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Profil Siswa: ${studentProfile}. Aksi khusus: ${actionType}. Pertanyaan/Kalimat Siswa: "${message.trim()}"`,
            config: {
              systemInstruction: `Anda adalah BABATURAN (Babaturan Diajar Basa Sunda), sahabat belajar Bahasa Sunda yang ramah, sabar, suportif, dan tidak menghakimi untuk siswa SMAN 2 Tambun Selatan, Kabupaten Bekasi.
Aturan utama:
1. Gunakan Bahasa Indonesia sebagai jembatan penjelasan, dan sertakan contoh Bahasa Sunda secara bertahap.
2. Gunakan "Abdi" untuk contoh orang pertama dalam ragam lemes, dan jelaskan bahwa "Kuring/Urang" tepat digunakan dalam ragam loma (bersama teman sebaya).
3. Bedakan dengan jelas antara lemes keur sorangan (abdi, mios, neda, wangsul, rorompok) dan lemes keur batur (anjeun/Bapa/Ibu, angkat, tuang, mulih, bumi).
4. Berikan apresiasi atas keberanian siswa dan akhiri dengan satu pertanyaan pemantik singkat agar siswa berlatih.`,
            },
          });

          if (response.text) {
            res.json({
              reply: response.text,
              source: 'gemini_ai',
            });
            return;
          }
        } catch {
          // Fall back to curated pedagogical response below
        }
      }

      // Deterministic high-quality pedagogical response
      const clean = message.trim();
      const comp = translateWithMultiEngine(clean, 'id', 'su', 'guru');
      let reply = '';

      if (actionType === 'to_loma') {
        reply = `Dina **Ragam Basa Loma** (akrab jeung babaturan sebaya), kalimah éta tiasa diucapkeun:\n\n**"${comp.registerVariants.lomaTeman.text}"**\n\n**Catetan BABATURAN:**\n- Gunakan **kuring / urang** (saya) dan kata kerja loma seperti **indit** (pergi), **dahar** (makan), atau **balik** (pulang).\n- Ragam ini sangat alami dipakai saat ngobrol di kantin atau diskusi kelompok bersama teman sekelas.`;
      } else if (actionType === 'to_lemes') {
        reply = `Dina **Ragam Basa Hormat / Lemes** (sopan ka Bapa/Ibu Guru atanapi sepuh), kalimah anu merenah nyaéta:\n\n**"${comp.registerVariants.lemesGuru.text}"**\n\n**Catetan Undak-Usuk Basa:**\n- Gunakan **Abdi** untuk diri sendiri.\n- Pastikan menggunakan *lemes keur sorangan* (seperti **mios**, **neda**, **wangsul**, **rorompok**), bukan *lemes keur batur* (**angkat**, **tuang**, **mulih**, **bumi**).`;
      } else if (actionType === 'examples') {
        reply = `Hayu urang tingali conto kalimah dina dua situasi komunikasi anu béda:\n\n1. **Ka Bapa/Ibu Guru (Ragam Lemes):**\n   *"Punten Bapa, abdi badé tumaros perkawis pancén carpon dinten ieu."*\n   (Permisi Pak, saya ingin bertanya mengenai tugas cerpen hari ini.)\n\n2. **Ka Babaturan Sakelas (Ragam Loma):**\n   *"Éh Raka, kuring rék nanya ngeunaan tugas carpon poé ieu."*\n   (Eh Raka, aku mau tanya tentang tugas cerpen hari ini.)\n\nAyeuna, situasi mana anu paling sering anjeun tepungan di sakola?`;
      } else {
        reply = `Hatur nuhun parantos wani naros! Urang bahas babarengan nya:\n\nKalimah/Patarosan anjeun: *"${clean}"*\n\n- **Versi Ragam Lemes (ka Guru/Sepuh):**\n  "${comp.registerVariants.lemesGuru.text}"\n- **Versi Ragam Loma (ka Babaturan):**\n  "${comp.registerVariants.lomaTeman.text}"\n\n**Penjelasan Kosakata Utama:**\n${comp.wordByWord
          .slice(0, 4)
          .map((w) => `- **${w.word}** = ${w.meaning} (${w.register})`)
          .join('\n')}\n\nKumaha, aya kecap anu hoyong urang latih deui dina kalimah anjeun sorangan?`;
      }

      res.json({
        reply,
        source: 'babaturan_pedagogical_engine',
      });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Gagal memproses pesan AI Tutor.',
      });
    }
  });

  // 4. Roleplay Conversation Simulator Endpoint
  app.post('/api/roleplay/respond', async (req, res) => {
    try {
      const { scenarioId, studentMessage } = req.body as {
        scenarioId?: string;
        studentMessage?: string;
      };

      const scenario =
        ROLEPLAY_SCENARIOS.find((s) => s.id === scenarioId) || ROLEPLAY_SCENARIOS[0];
      const msg = (studentMessage || '').trim();
      const lower = msg.toLowerCase();

      // Check Undak-Usuk appropriateness
      const hasHyperCorrection =
        lower.includes('abdi') && (lower.includes('tuang') || lower.includes('mulih'));
      const usesLomaToTeacher =
        scenario.recommendedRegister === 'Lemes (Hormat)' &&
        (lower.includes('manéh') || lower.includes('maneh') || lower.includes('kuring rék'));

      let respectMeter: 'Merenah' | 'Perlu Dilereskeun' | 'Perlu Konteks' = 'Merenah';
      let feedback =
        'Merenah pisan! Pilihan kosakata dan sapaanmu sudah sesuai dengan konteks lawan bicara.';
      let characterReplySunda =
        scenario.recommendedRegister === 'Lemes (Hormat)'
          ? 'Alhamdulillah, hatur nuhun parantos nyarios kalayan sopan tur jéntré. Mangga, aya deui anu tiasa dibantos?'
          : 'Wah, mantap pisan! Hayu atuh urang tuluykeun ngobrol basa Sunda unggal poé di kelas nya!';
      let characterReplyMeaning =
        scenario.recommendedRegister === 'Lemes (Hormat)'
          ? 'Alhamdulillah, terima kasih sudah berbicara dengan sopan dan jelas. Silakan, ada lagi yang bisa dibantu?'
          : 'Wah, mantap sekali! Ayo kita lanjutkan mengobrol bahasa Sunda setiap hari di kelas ya!';

      if (hasHyperCorrection) {
        respectMeter = 'Perlu Dilereskeun';
        feedback =
          'Perhatikan kata kerja lemes: "tuang" atau "mulih" digunakan khusus untuk menghormati orang lain. Untuk diri sendiri ("abdi"), gunakan "neda" (makan) atau "wangsul" (pulang).';
        characterReplySunda =
          'Hatur nuhun parantos nyobian nyarios lemes! Saeutik catetan: upami kanggo diri sorangan mah nganggo kecap "neda" atanapi "wangsul" nya.';
        characterReplyMeaning =
          'Terima kasih sudah mencoba berbicara lemes! Sedikit catatan: kalau untuk diri sendiri gunakan kata "neda" atau "wangsul" ya.';
      } else if (usesLomaToTeacher) {
        respectMeter = 'Perlu Konteks';
        feedback =
          'Kalimatmu sudah dapat dipahami maknanya, tetapi karena kamu sedang berbicara kepada Guru/Sesepuh, ubah "kuring/manéh" menjadi ragam lemes "abdi / Bapa / Ibu".';
        characterReplySunda =
          'Mangga, Bapa ngartos maksad anjeun. Nanging upami nyarios ka guru, langkung saé nganggo kecap "abdi badé tumaros" nya.';
        characterReplyMeaning =
          'Silakan, Bapak mengerti maksudmu. Namun jika berbicara kepada guru, lebih baik gunakan "abdi badé tumaros" ya.';
      }

      res.json({
        characterReplySunda,
        characterReplyMeaning,
        respectMeter,
        feedback,
      });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Gagal memproses respons simulasi.',
      });
    }
  });

  // 5. Writing Lab Stage 3 Comparison Endpoint
  app.post('/api/writing-lab/compare', async (req, res) => {
    try {
      const {
        draft1Text,
        targetRegister = 'Lemes (Hormat)',
        writingLabStage,
        writingLabPolicy = 'MODE_A_INDEPENDENT',
      } = req.body as {
        draft1Text?: string;
        targetRegister?: 'Lemes (Hormat)' | 'Loma (Akrab)';
        writingLabStage?: WritingLabStage;
        writingLabPolicy?: WritingPolicyMode;
      };

      if (!draft1Text || !draft1Text.trim()) {
        res.status(400).json({ error: 'Draft 1 belum tersedia untuk dibandingkan.' });
        return;
      }

      if (writingLabStage === 'STAGE_1_DRAFT_1') {
        const check = canUseAiInWritingLab(writingLabStage, writingLabPolicy);
        if (!check.allowed) {
          res.status(403).json({
            error:
              'Perbandingan versi AI tidak dapat diakses sebelum Draft 1 dikumpulkan dan dikunci.',
          });
          return;
        }
      }

      const comparison = generateDraftComparison(draft1Text.trim(), targetRegister);
      res.json(comparison);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Gagal menghasilkan perbandingan Writing Lab.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BABATURAN Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
