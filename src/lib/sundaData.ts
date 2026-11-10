export type LanguageCode = 'su' | 'id' | 'en';

export type TranslationContextMode =
  | 'teman_sebaya'
  | 'guru'
  | 'orang_tua'
  | 'formal'
  | 'santai'
  | 'tugas_sekolah'
  | 'artikel_formal';

export type StudentProfileLevel =
  | 'pamula'
  | 'ngarti_pasif'
  | 'ngamimitian_nyarita'
  | 'mahir';

export type WritingPolicyMode =
  | 'MODE_A_INDEPENDENT'
  | 'MODE_B_DICTIONARY_ONLY'
  | 'MODE_C_TEACHER_DEFINED';

export type WritingLabStage =
  | 'STAGE_1_DRAFT_1'
  | 'STAGE_2_ASSISTANCE'
  | 'STAGE_3_COMPARISON'
  | 'STAGE_4_DRAFT_2'
  | 'STAGE_5_ASSESSMENT_REFLECTION';

export type RevisionCategory =
  | 'Lexical Revision'
  | 'Grammar Revision'
  | 'Sentence Structure Revision'
  | 'Context and Register Revision'
  | 'Content Revision'
  | 'Organization Revision';

export interface GlossaryEntry {
  id: string;
  sundaLoma: string;
  sundaLemesSorangan: string;
  sundaLemesBatur: string;
  indonesia: string;
  english: string;
  category: string;
  partOfSpeech: string;
  exampleLoma: string;
  exampleLemes: string;
  exampleMeaningId: string;
  usageNote: string;
  sourceRef: string;
}

export interface WordBreakdownItem {
  word: string;
  meaning: string;
  register: 'Lemes (Hormat)' | 'Loma (Akrab)' | 'Umum / Netral';
  partOfSpeech: string;
  alternatives: string;
  note: string;
}

export interface TranslationProviderOutput {
  providerId: 'google_cloud_nmt' | 'babaturan_contextual' | 'sundadigi_candidate';
  providerName: string;
  badgeLabel: 'Machine Translation' | 'AI Contextual Register' | 'External Candidate';
  status: 'active' | 'demo_fallback' | 'external_link';
  translatedText: string;
  registerUsed: string;
  confidenceNote: string;
  externalUrl?: string;
}

export interface TranslationComparisonResult {
  sourceText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  contextMode: TranslationContextMode;
  primaryTranslation: string;
  literalMeaningId: string;
  providers: TranslationProviderOutput[];
  registerVariants: {
    lemesGuru: {
      text: string;
      explanation: string;
    };
    lomaTeman: {
      text: string;
      explanation: string;
    };
    neutralFormal: {
      text: string;
      explanation: string;
    };
  };
  whyThisChoice: string[];
  sentenceStructureNote: string;
  wordByWord: WordBreakdownItem[];
  needsVerification: boolean;
}

export const CONTEXT_MODE_LABELS: Record<
  TranslationContextMode,
  { label: string; registerHint: string; description: string }
> = {
  guru: {
    label: 'Percakapan dengan Guru',
    registerHint: 'Ragam Basa Hormat / Lemes',
    description: 'Menggunakan kata ganti "Abdi" dan kosakata lemes untuk menghormati guru di sekolah.',
  },
  orang_tua: {
    label: 'Percakapan dengan Orang Tua',
    registerHint: 'Ragam Basa Hormat / Lemes',
    description: 'Sopan dan hangat kepada orang tua atau keluarga yang lebih sepuh.',
  },
  teman_sebaya: {
    label: 'Percakapan dengan Teman Sebaya',
    registerHint: 'Ragam Basa Loma (Akrab)',
    description: 'Menggunakan "Urang" atau "Kuring" dengan pilihan kata akrab sehari-hari.',
  },
  tugas_sekolah: {
    label: 'Penulisan Tugas Sekolah',
    registerHint: 'Ragam Lemes / Baku Kurikulum SMA',
    description: 'Struktur kalimat rapi dan kosakata terstandar untuk karangan atau tugas kelas.',
  },
  formal: {
    label: 'Pidato / Panumbu Catur (Formal)',
    registerHint: 'Ragam Hormat Resmi',
    description: 'Digunakan saat membuka diskusi, biantara, atau memandu acara resmi.',
  },
  santai: {
    label: 'Percakapan Santai Sehari-hari',
    registerHint: 'Ragam Loma Natural',
    description: 'Gaya bicara santai di luar kelas bersama sahabat.',
  },
  artikel_formal: {
    label: 'Artikel / Teks Sastra & Berita',
    registerHint: 'Ragam Baku Jurnalistik / Sastra',
    description: 'Cocok untuk analisis warta, carpon, atau esai argumentatif.',
  },
};

export const INITIAL_GLOSSARY: GlossaryEntry[] = [
  {
    id: 'g-1',
    sundaLoma: 'kuring / urang',
    sundaLemesSorangan: 'abdi / simkuring',
    sundaLemesBatur: '-',
    indonesia: 'saya / aku',
    english: 'I / me',
    category: 'Salam dan Perkenalan',
    partOfSpeech: 'Pronomina (Kata Ganti)',
    exampleLoma: 'Kuring rék indit ka sakola bareng babaturan.',
    exampleLemes: 'Abdi badé mios ka sakola sareng réréncangan.',
    exampleMeaningId: 'Saya akan pergi ke sekolah bersama teman.',
    usageNote: 'Gunakan "Abdi" saat berbicara kepada guru atau orang tua. "Kuring" atau "Urang" alami untuk teman sebaya atau narasi carpon.',
    sourceRef: 'Kamus Basa Sunda R.A. Danadibrata & Pedoman Undak-Usuk Basa SMA',
  },
  {
    id: 'g-2',
    sundaLoma: 'manéh',
    sundaLemesSorangan: '-',
    sundaLemesBatur: 'anjeun / salira / bapa / ibu',
    indonesia: 'kamu / Anda',
    english: 'you',
    category: 'Salam dan Perkenalan',
    partOfSpeech: 'Pronomina (Kata Ganti)',
    exampleLoma: 'Manéh geus ngerjakeun pancén basa Sunda?',
    exampleLemes: 'Anjeun parantos midamel pancén basa Sunda?',
    exampleMeaningId: 'Apakah kamu sudah mengerjakan tugas bahasa Sunda?',
    usageNote: 'Jangan gunakan "manéh" kepada guru atau orang tua; gunakan "Bapa/Ibu" atau "Anjeun".',
    sourceRef: 'Pedoman Undak-Usuk Basa Sunda Fase E/F',
  },
  {
    id: 'g-3',
    sundaLoma: 'indit',
    sundaLemesSorangan: 'mios',
    sundaLemesBatur: 'angkat',
    indonesia: 'pergi / berangkat',
    english: 'go / depart',
    category: 'Aktivitas Sehari-hari',
    partOfSpeech: 'Verba (Kata Kerja)',
    exampleLoma: 'Urang indit ti imah jam genep isuk-isuk.',
    exampleLemes: 'Abdi mios ti rorompok tabuh genep énjing-énjing, dupi Bapa Guru angkat tabuh sabaraha?',
    exampleMeaningId: 'Saya berangkat dari rumah pukul enam pagi.',
    usageNote: 'Perhatikan perbedaan lemes keur sorangan ("mios") dan lemes keur batur ("angkat"). Namun dalam percakapan siswa SMA sehari-hari, "Abdi badé angkat ka sakola" sering digunakan dan dapat dijelaskan konteksnya.',
    sourceRef: 'Tatabasa Sunda & Kurikulum Merdeka Jawa Barat',
  },
  {
    id: 'g-4',
    sundaLoma: 'dahar',
    sundaLemesSorangan: 'neda',
    sundaLemesBatur: 'tuang',
    indonesia: 'makan',
    english: 'eat',
    category: 'Makanan dan Minuman',
    partOfSpeech: 'Verba (Kata Kerja)',
    exampleLoma: 'Hayu urang dahar sangu timbel di kantin.',
    exampleLemes: 'Abdi parantos neda di rorompok, mangga Ibu Guru bilih badé tuang heula.',
    exampleMeaningId: 'Saya sudah makan di rumah, silakan Ibu Guru bila ingin makan dahulu.',
    usageNote: 'Kesalahan paling umum siswa adalah menyebut "Abdi badé tuang". Untuk diri sendiri gunakan "neda", sedangkan "tuang" khusus untuk menghormati orang lain.',
    sourceRef: 'Kandaga Kecap Undak-Usuk Basa SMA',
  },
  {
    id: 'g-5',
    sundaLoma: 'balik',
    sundaLemesSorangan: 'wangsul',
    sundaLemesBatur: 'mulih',
    indonesia: 'pulang',
    english: 'return home',
    category: 'Perjalanan',
    partOfSpeech: 'Verba (Kata Kerja)',
    exampleLoma: 'Sabada sakola kuring langsung balik ka imah.',
    exampleLemes: 'Sabada sakola abdi langsung wangsul ka rorompok.',
    exampleMeaningId: 'Setelah sekolah saya langsung pulang ke rumah.',
    usageNote: '"Wangsul" digunakan untuk diri sendiri dalam ragam lemes; "mulih" untuk orang yang dihormati.',
    sourceRef: 'Kamus Utama Basa Sunda',
  },
  {
    id: 'g-6',
    sundaLoma: 'nanya',
    sundaLemesSorangan: 'naros / tumaros',
    sundaLemesBatur: 'mariksa',
    indonesia: 'bertanya',
    english: 'ask',
    category: 'Sekolah',
    partOfSpeech: 'Verba (Kata Kerja)',
    exampleLoma: 'Kuring rék nanya ngeunaan matéri sisindiran.',
    exampleLemes: 'Punten Bapa, abdi badé tumaros perkawis matéri sisindiran.',
    exampleMeaningId: 'Maaf Pak, saya ingin bertanya tentang materi sisindiran.',
    usageNote: 'Sangat berguna saat meminta penjelasan kepada guru di kelas.',
    sourceRef: 'Modul Ajar Basa Sunda SMAN 2 Tambun Selatan',
  },
  {
    id: 'g-7',
    sundaLoma: 'imah',
    sundaLemesSorangan: 'rorompok',
    sundaLemesBatur: 'bumi',
    indonesia: 'rumah',
    english: 'house / home',
    category: 'Rumah',
    partOfSpeech: 'Nomina (Kata Benda)',
    exampleLoma: 'Imah kuring aya di Tambun Kidul.',
    exampleLemes: 'Rorompok abdi perenahna di Tambun Kidul, dupi bumi Ibu Guru di mana?',
    exampleMeaningId: 'Rumah saya berada di Tambun Selatan, sedangkan rumah Ibu Guru di mana?',
    usageNote: '"Rorompok" merendahkan diri secara sopan untuk rumah sendiri; "bumi" untuk rumah orang lain.',
    sourceRef: 'Kamus Undak-Usuk Basa Sunda',
  },
  {
    id: 'g-8',
    sundaLoma: 'babaturan',
    sundaLemesSorangan: 'réréncangan',
    sundaLemesBatur: 'réréncangan',
    indonesia: 'teman / sahabat',
    english: 'friend / companion',
    category: 'Sekolah',
    partOfSpeech: 'Nomina (Kata Benda)',
    exampleLoma: 'Babaturan sakelas kuring bageur pisan.',
    exampleLemes: 'Réréncangan sakelas abdi sarénghép pisan.',
    exampleMeaningId: 'Teman sekelas saya sangat ramah dan baik.',
    usageNote: 'Nama aplikasi BABATURAN diambil dari kata ini—berarti sahabat belajar.',
    sourceRef: 'Kamus Basa Sunda',
  },
  {
    id: 'g-9',
    sundaLoma: 'diajar',
    sundaLemesSorangan: 'diajar',
    sundaLemesBatur: 'diajar',
    indonesia: 'belajar',
    english: 'learn / study',
    category: 'Sekolah',
    partOfSpeech: 'Verba (Kata Kerja)',
    exampleLoma: 'Urang keur diajar nulis aksara Sunda.',
    exampleLemes: 'Abdi nuju diajar nyerat aksara Sunda.',
    exampleMeaningId: 'Saya sedang belajar menulis aksara Sunda.',
    usageNote: 'Kata "diajar" bersifat netral dan dapat dipakai di ragam loma maupun lemes.',
    sourceRef: 'Kurikulum Basa Sunda SMA',
  },
  {
    id: 'g-10',
    sundaLoma: 'nyaho / apal',
    sundaLemesSorangan: 'terang',
    sundaLemesBatur: 'uninga',
    indonesia: 'tahu / mengetahui',
    english: 'know / understand',
    category: 'Perasaan dan Emosi',
    partOfSpeech: 'Verba (Kata Kerja)',
    exampleLoma: 'Kuring can apal hartina kecap éta.',
    exampleLemes: 'Abdi teu acan terang hartosna kecap éta, manawi Ibu uninga?',
    exampleMeaningId: 'Saya belum tahu arti kata itu, barangkali Ibu mengetahui?',
    usageNote: 'Gunakan "terang" untuk diri sendiri dan "uninga" untuk orang yang lebih tua/guru.',
    sourceRef: 'Kandaga Kecap Basa Sunda',
  },
  {
    id: 'g-11',
    sundaLoma: 'datang',
    sundaLemesSorangan: 'dongkap',
    sundaLemesBatur: 'sumping',
    indonesia: 'datang / tiba',
    english: 'arrive / come',
    category: 'Perjalanan',
    partOfSpeech: 'Verba (Kata Kerja)',
    exampleLoma: 'Manéh datang ka sakola jam sabaraha?',
    exampleLemes: 'Abdi dongkap ka sakola tabuh genep, hatur nuhun Bapa parantos sumping.',
    exampleMeaningId: 'Saya tiba di sekolah pukul enam, terima kasih Bapak sudah datang.',
    usageNote: '"Wilujeng sumping" berarti Selamat datang (menghormati tamu).',
    sourceRef: 'Pedoman Tatakrama Basa Sunda',
  },
  {
    id: 'g-12',
    sundaLoma: 'bisa',
    sundaLemesSorangan: 'tiasa',
    sundaLemesBatur: 'tiasa / iasa',
    indonesia: 'bisa / dapat',
    english: 'can / able to',
    category: 'Aktivitas Sehari-hari',
    partOfSpeech: 'Verba Bantu',
    exampleLoma: 'Kuring geus bisa nyarita basa Sunda saeutik-saeutik.',
    exampleLemes: 'Alhamdulillah, abdi parantos tiasa nyarios basa Sunda sakedik-sakedik.',
    exampleMeaningId: 'Alhamdulillah, saya sudah bisa berbicara bahasa Sunda sedikit demi sedikit.',
    usageNote: '"Tiasa" adalah bentuk lemes dari "bisa".',
    sourceRef: 'Modul Basa Sunda SMA',
  },
];

export interface RoleplayScenario {
  id: string;
  level: 1 | 2 | 3 | 4;
  levelLabel: string;
  title: string;
  contextDescription: string;
  aiPersona: string;
  recommendedRegister: 'Loma (Akrab)' | 'Lemes (Hormat)';
  openingLineSunda: string;
  openingLineMeaning: string;
  easyHints: string[];
  normalKeywords: string[];
  sampleResponses: {
    text: string;
    register: string;
    feedback: string;
    respectMeter: 'Merenah' | 'Perlu Dilereskeun' | 'Perlu Konteks';
  }[];
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'rp-1',
    level: 1,
    levelLabel: 'Level 1 — Daily Conversation',
    title: 'Patepang di Kantin Sakola (Menyapa Teman Baru)',
    contextDescription: 'Kamu bertemu teman sekelas baru bernama Raka saat jam istirahat di kantin SMAN 2 Tambun Selatan. Sapa dan tanyakan kabarnya!',
    aiPersona: 'Raka (Teman Sebaya Kelas XI)',
    recommendedRegister: 'Loma (Akrab)',
    openingLineSunda: 'Sampurasun! Éh, anjeun murid anyar di kelas XI-2 nya? Nepangkeun, ngaran kuring Raka. Kumaha daramang?',
    openingLineMeaning: 'Sampurasun! Eh, kamu siswa baru di kelas XI-2 ya? Perkenalkan, nama saya Raka. Bagaimana kabarnya?',
    easyHints: [
      'Jawab "Rampés!" untuk membalas "Sampurasun".',
      'Sebutkan kabar baik: "Pangéstu, alhamdulillah cageur."',
      'Perkenalkan namamu dengan ramah.',
    ],
    normalKeywords: ['Rampés', 'Pangéstu / Alhamdulillah', 'Ngaran kuring / Wasta abdi', 'Resep wanoh'],
    sampleResponses: [
      {
        text: 'Rampés Raka! Alhamdulillah pangéstu. Muhun, ngaran kuring Dinda, pindahan ti Bekasi Kulon.',
        register: 'Loma / Campuran Sopan',
        feedback: 'Merenah pisan! Balasan "Rampés" dan "Pangéstu" sangat tepat untuk membuka obrolan akrab dengan teman baru.',
        respectMeter: 'Merenah',
      },
      {
        text: 'Rampés! Abdi badé tuang heula di kantin nya.',
        register: 'Kurang Tepat (Tuang untuk diri sendiri)',
        feedback: 'Hati-hati penggunaan kata "tuang" adalah lemes untuk orang lain. Untuk diri sendiri gunakan "neda" (lemes) atau "dahar" (loma bersama teman).',
        respectMeter: 'Perlu Dilereskeun',
      },
    ],
  },
  {
    id: 'rp-2',
    level: 2,
    levelLabel: 'Level 2 — School Conversation',
    title: 'Nyuhunkeun Widhi ka Bapa Guru (Meminta Izin & Bertanya Tugas)',
    contextDescription: 'Kamu menghadap Pak Dedi (Guru Bahasa Sunda) di ruang guru untuk menanyakan tenggat waktu tugas Carpon dan meminta izin mengikuti rapat OSIS.',
    aiPersona: 'Bapa Dedi, M.Pd. (Guru Basa Sunda)',
    recommendedRegister: 'Lemes (Hormat)',
    openingLineSunda: 'Mangga lebet. Aya peryogi naon, Jang/Neng? Katingalna mani daria pisan.',
    openingLineMeaning: 'Silakan masuk. Ada keperluan apa, Nak? Kelihatannya serius sekali.',
    easyHints: [
      'Awali dengan "Punten Bapa" (Maaf/Permisi Pak).',
      'Gunakan "Abdi badé tumaros..." (Saya ingin bertanya...).',
      'Gunakan "nyuhunkeun widi" untuk meminta izin.',
    ],
    normalKeywords: ['Punten Bapa', 'Abdi badé tumaros', 'Pancén Carpon', 'Nyuhunkeun widi'],
    sampleResponses: [
      {
        text: 'Punten Bapa, abdi badé tumaros perkawis pancén nyerat carpon, kaleresan abdi ogé badé nyuhunkeun widi margi aya kumpulan OSIS.',
        register: 'Lemes (Hormat)',
        feedback: 'Luar biasa! Pilihan kata "Punten Bapa", "abdi badé tumaros", dan "nyuhunkeun widi" sangat santun sesuai undak-usuk basa kepada guru.',
        respectMeter: 'Merenah',
      },
      {
        text: 'Pa Dedi, kuring rék nanya tugas carpon dikumpulkeun iraha nya?',
        register: 'Loma (Terlalu Santai untuk Guru)',
        feedback: 'Kalimat ini dapat dipahami, tetapi kata "kuring rék nanya" termasuk ragam loma (untuk teman sebaya). Kepada guru, sebaiknya gunakan "Abdi badé tumaros".',
        respectMeter: 'Perlu Konteks',
      },
    ],
  },
  {
    id: 'rp-3',
    level: 3,
    levelLabel: 'Level 3 — Social and Cultural Conversation',
    title: 'Natamu ka Bumi Nini di Bandung (Berkunjung ke Rumah Sesepuh)',
    contextDescription: 'Saat liburan sekolah, kamu berkunjung ke rumah Nini (nenek/sesepuh keluarga) di Bandung dan menceritakan pengalaman belajar Bahasa Sunda di Bekasi.',
    aiPersona: 'Nini Ratna (Sesepuh Keluarga)',
    recommendedRegister: 'Lemes (Hormat)',
    openingLineSunda: 'Alhamdulillah incu Nini parantos sumping ti Bekasi! Sok calik heula, kumaha di perjalanan téh lancar? Nini bungah pisan.',
    openingLineMeaning: 'Alhamdulillah cucu Nenek sudah tiba dari Bekasi! Silakan duduk dulu, bagaimana perjalanannya lancar? Nenek senang sekali.',
    easyHints: [
      'Gunakan "Hatur nuhun Nini" dan ceritakan kamu baru tiba ("Abdi nembé dongkap").',
      'Ceritakan bahwa kamu sedang belajar Bahasa Sunda di sekolah ("Abdi nuju diajar basa Sunda di sakola").',
    ],
    normalKeywords: ['Hatur nuhun Nini', 'Alhamdulillah lancar', 'Abdi nembé dongkap', 'Diajar basa Sunda'],
    sampleResponses: [
      {
        text: 'Hatur nuhun Nini, alhamdulillah di perjalanan lancar. Abdi nembé dongkap, ayeuna abdi nuju rajin diajar basa Sunda di sakola.',
        register: 'Lemes (Hormat)',
        feedback: 'Sangat santun dan hangat! Penggunaan "nembé dongkap" untuk diri sendiri setelah Nini menggunakan "sumping" menunjukkan pemahaman undak-usuk yang matang.',
        respectMeter: 'Merenah',
      },
    ],
  },
  {
    id: 'rp-4',
    level: 4,
    levelLabel: 'Level 4 — Advanced Conversation',
    title: 'Sawala Panumbu Catur: Ngamumulé Basa Indung di Era AI',
    contextDescription: 'Kamu menjadi Panumbu Catur (moderator diskusi kelas XII) yang memandu debat tentang peran teknologi AI dalam melestarikan Bahasa Sunda di kalangan remaja.',
    aiPersona: 'Kang Fajar (Narasumber & Budayawan Muda)',
    recommendedRegister: 'Lemes (Hormat)',
    openingLineSunda: 'Hatur nuhun ka sadérék Panumbu Catur. Numutkeun pamendak simkuring, AI tiasa janten jembatan kanggé nonoman Bekasi sangkan teu sieun salah nyarios Sunda. Kumaha pamendak sadérék?',
    openingLineMeaning: 'Terima kasih kepada moderator. Menurut pendapat saya, AI bisa menjadi jembatan bagi remaja Bekasi agar tidak takut salah berbicara Sunda. Bagaimana pendapat Anda?',
    easyHints: [
      'Gunakan ungkapan diskusi formal: "Hatur nuhun kana pamendakna" dan "Simkuring sapuk (setuju) margi..."',
      'Ajukan pertanyaan lanjutan kepada peserta diskusi.',
    ],
    normalKeywords: ['Simkuring sapuk', 'Pamendak anu saé', 'Ngamumulé basa indung', 'Para pamilon sawala'],
    sampleResponses: [
      {
        text: 'Hatur nuhun kana pamendakna Kang Fajar. Simkuring sapuk pisan, margi téknologi AI tiasa ngabantos siswa latihan mandiri sateuacan nyarios langsung di masarakat.',
        register: 'Hormat Formal (Sawala)',
        feedback: 'Sempurna! Gaya bahasa Panumbu Catur kelas XII sangat terstruktur dengan diksi "pamendakna", "simkuring sapuk", dan "ngabantos".',
        respectMeter: 'Merenah',
      },
    ],
  },
];

export interface UndakUsukQuestion {
  id: string;
  challengeType:
    | 'Loma or Lemes?'
    | 'Choose the Best Expression'
    | 'Fix the Conversation'
    | 'Who Are You Talking To?'
    | 'Undak-Usuk Detective';
  speaker: string;
  interlocutor: string;
  situation: string;
  questionPrompt: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    registerLabel: string;
    explanation: string;
    correctedWordHint: string;
  }[];
}

export const UNDAK_USUK_CHALLENGES: UndakUsukQuestion[] = [
  {
    id: 'uu-1',
    challengeType: 'Choose the Best Expression',
    speaker: 'Siswa Kelas XI',
    interlocutor: 'Ibu Guru Basa Sunda',
    situation: 'Menyampaikan bahwa kamu sudah makan siang di kantin dan menanyakan apakah Ibu Guru sudah makan.',
    questionPrompt: 'Manakah kalimat yang paling merenah (tepat secara undak-usuk basa) untuk diucapkan kepada Ibu Guru?',
    options: [
      {
        id: 'opt-a',
        text: 'Ibu, abdi parantos neda di kantin. Dupi Ibu parantos tuang?',
        isCorrect: true,
        registerLabel: 'Lemes Merenah (Neda = Diri Sendiri, Tuang = Orang Lain)',
        explanation: 'Tepat sekali! Dalam undak-usuk basa Sunda, kata kerja lemes untuk diri sendiri adalah "neda", sedangkan untuk menghormati Ibu Guru adalah "tuang".',
        correctedWordHint: 'Tidak ada yang perlu diperbaiki.',
      },
      {
        id: 'opt-b',
        text: 'Ibu, abdi parantos tuang di kantin. Dupi Ibu parantos neda?',
        isCorrect: false,
        registerLabel: 'Terbalik (Lemes Keur Batur dipakai untuk diri sendiri)',
        explanation: 'Ini kesalahan yang paling sering terjadi! "Tuang" tidak boleh dipakai untuk diri sendiri ("abdi"). Gunakan "neda" untuk diri sendiri dan "tuang" untuk Ibu Guru.',
        correctedWordHint: 'Ubah "abdi parantos tuang" menjadi "abdi parantos neda".',
      },
      {
        id: 'opt-c',
        text: 'Ibu, kuring geus dahar di kantin. Ari Ibu geus dahar?',
        isCorrect: false,
        registerLabel: 'Ragam Loma (Hanya untuk teman sebaya)',
        explanation: 'Kalimat ini menggunakan ragam loma ("kuring", "geus dahar"). Cocok untuk berbicara dengan sahabat dekat, tetapi kurang sopan jika ditujukan kepada guru.',
        correctedWordHint: 'Ganti "kuring geus dahar" menjadi "abdi parantos neda".',
      },
    ],
  },
  {
    id: 'uu-2',
    challengeType: 'Undak-Usuk Detective',
    speaker: 'Galih (Siswa SMA)',
    interlocutor: 'Bapa Kepala Sakola',
    situation: 'Galih ingin mengatakan bahwa ia baru saja pulang dari perpustakaan dan rumahnya berada di Tambun.',
    questionPrompt: 'Deteksi kata yang perlu diperbaiki dalam kalimat Galih: "Punten Bapa, abdi nembé mulih ti perpustakaan, dupi bumi abdi di Tambun."',
    options: [
      {
        id: 'opt-a',
        text: 'Ganti "mulih" menjadi "wangsul", dan "bumi abdi" menjadi "rorompok abdi".',
        isCorrect: true,
        registerLabel: 'Koreksi Lemes Sorangan vs Lemes Batur',
        explanation: 'Hebat! "Mulih" (pulang) dan "bumi" (rumah) adalah ragam lemes untuk orang lain. Untuk diri sendiri, gunakan "wangsul" dan "rorompok".',
        correctedWordHint: 'Kalimat merenah: "Punten Bapa, abdi nembé wangsul ti perpustakaan, dupi rorompok abdi di Tambun."',
      },
      {
        id: 'opt-b',
        text: 'Ganti "abdi" menjadi "manéh" agar lebih akrab.',
        isCorrect: false,
        registerLabel: 'Tidak Sesuai Konteks',
        explanation: '"Manéh" berarti "kamu" dalam ragam loma, bukan kata ganti orang pertama.',
        correctedWordHint: 'Pertahankan "abdi", perbaiki "mulih" dan "bumi".',
      },
      {
        id: 'opt-c',
        text: 'Kalimat tersebut sudah 100% tepat tanpa perlu perbaikan.',
        isCorrect: false,
        registerLabel: 'Masih Tercampur Lemes Batur',
        explanation: 'Meskipun terdengar halus, menggunakan "mulih" dan "bumi" untuk diri sendiri termasuk hyper-correction (lemes keur batur dipakai untuk diri sendiri).',
        correctedWordHint: 'Gunakan "wangsul" dan "rorompok" untuk diri sendiri.',
      },
    ],
  },
  {
    id: 'uu-3',
    challengeType: 'Who Are You Talking To?',
    speaker: 'Rina',
    interlocutor: '?',
    situation: 'Rina berkata: "Éh Din, isukan urang rék indit latihan angklung tabuh tilu soré. Manéh milu teu?"',
    questionPrompt: 'Berdasarkan pilihan kosakata ("urang", "rék indit", "manéh milu teu"), kepada siapakah Rina berbicara?',
    options: [
      {
        id: 'opt-a',
        text: 'Teman sebaya / sahabat dekat di ekstrakurikuler',
        isCorrect: true,
        registerLabel: 'Ragam Basa Loma (Akrab)',
        explanation: 'Benar! Penggunaan "urang", "rék indit", dan "manéh" menunjukkan keakraban yang wajar dan alami antar sahabat sebaya.',
        correctedWordHint: 'Sesuai konteks pertemanan.',
      },
      {
        id: 'opt-b',
        text: 'Pelatih ekstrakurikuler yang berusia sepuh',
        isCorrect: false,
        registerLabel: 'Kurang Sopan untuk Orang Tua',
        explanation: 'Kepada pelatih atau orang yang lebih tua, Rina akan menggunakan "Abdi badé mios" dan "Bapa/Ibu badé ngiring?".',
        correctedWordHint: 'Gunakan ragam lemes untuk pelatih.',
      },
      {
        id: 'opt-c',
        text: 'Pidato resmi di depan seluruh guru SMA',
        isCorrect: false,
        registerLabel: 'Bukan Ragam Formal',
        explanation: 'Dalam pidato resmi (biantara), digunakan sapaan "Hadirin anu ku simkuring dipihormat".',
        correctedWordHint: 'Gunakan ragam hormat resmi.',
      },
    ],
  },
  {
    id: 'uu-4',
    challengeType: 'Fix the Conversation',
    speaker: 'Adit',
    interlocutor: 'Bapa Guru Wali Kelas',
    situation: 'Adit ingin menyampaikan bahwa ayahnya sedang sakit sehingga belum bisa datang ke sekolah hari ini.',
    questionPrompt: 'Pilih kalimat yang menghormati orang tua sekaligus sopan kepada Bapak Guru:',
    options: [
      {
        id: 'opt-a',
        text: 'Punten Bapa, pun bapa nuju udur janten teu acan tiasa sumping ka sakola dinten ieu.',
        isCorrect: true,
        registerLabel: 'Ragam Lemes Merenah',
        explanation: 'Tepat! "Pun bapa" adalah cara sopan menyebut ayah sendiri kepada orang lain, dan "sumping" / "udur" menghormati kondisi ayah.',
        correctedWordHint: 'Kalimat sudah sangat merenah.',
      },
      {
        id: 'opt-b',
        text: 'Punten Bapa, bapa kuring keur gering jadi can bisa datang ka sakola poé ieu.',
        isCorrect: false,
        registerLabel: 'Ragam Loma',
        explanation: 'Kalimat ini menggunakan ragam loma ("gering", "datang", "poé ieu") yang kurang pas saat berbicara formal kepada wali kelas.',
        correctedWordHint: 'Ganti dengan "pun bapa nuju udur" dan "teu acan tiasa sumping".',
      },
    ],
  },
];

export interface CurriculumModule {
  id: string;
  fase: 'Fase E (Kelas X)' | 'Fase F (Kelas XI)' | 'Fase F (Kelas XII)';
  title: string;
  subtitle: string;
  cpCode: string;
  objectives: string[];
  summaryExplanation: string;
  excerptSunda: string;
  excerptTranslationId: string;
  keyVocabulary: { word: string; meaning: string; register: string }[];
  quizQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  reflectionPrompt: string;
}

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 'mod-carpon',
    fase: 'Fase F (Kelas XI)',
    title: 'Carita Pondok (Carpon)',
    subtitle: 'Menganalisis unsur intrinsik dan menulis kisah keseharian remaja dalam Bahasa Sunda.',
    cpCode: 'CP-XI-01',
    objectives: [
      'Memahami struktur dan unsur intrinsik Carita Pondok (téma, palaku, latar, galur, amanat).',
      'Menerjemahkan dan mengapresiasi diksi khas dalam carpon Sunda modern.',
      'Menulis carpon pendek tentang pengalaman sekolah dengan pilihan ragam bahasa yang konsisten.',
    ],
    summaryExplanation:
      'Carita Pondok (Carpon) adalah karya sastra prosa modern dalam Bahasa Sunda yang menceritakan satu peristiwa utama secara padat (biasanya 5.000–10.000 kata atau dapat dibaca sekali duduk). Dalam dialog carpon, penulis menggunakan undak-usuk basa sesuai hubungan antartokoh.',
    excerptSunda:
      'Isuk-isuk di SMAN 2 Tambun Selatan, halimun ipis masih kénéh nyimbutan lapangan upacara. Raka ngaléngkah gancang bari mawa buku catetan basa Sunda. "Duh, mugia dinten ieu abdi tiasa macakeun carpon di payuneun kelas kalayan lancar," gerentes haténa.',
    excerptTranslationId:
      'Pagi-pagi di SMAN 2 Tambun Selatan, kabut tipis masih menyelimuti lapangan upacara. Raka melangkah cepat sambil membawa buku catatan bahasa Sunda. "Duh, semoga hari ini saya bisa membacakan cerpen di depan kelas dengan lancar," bisik hatinya.',
    keyVocabulary: [
      { word: 'Halimun ipis', meaning: 'Kabut tipis', register: 'Sastra / Umum' },
      { word: 'Nyimbutan', meaning: 'Menyelimuti', register: 'Umum' },
      { word: 'Gerentes haté', meaning: 'Bisikan hati / batin', register: 'Sastra' },
      { word: 'Di payuneun', meaning: 'Di hadapan / di depan', register: 'Lemes' },
    ],
    quizQuestion: {
      question: 'Apa fungsi penggunaan kata "abdi" dan "di payuneun" dalam kutipan batin tokoh Raka di atas?',
      options: [
        'Menunjukkan sikap hormat dan kesungguhan Raka saat membayangkan tampil di depan guru dan kelas.',
        'Menunjukkan bahwa Raka sedang marah kepada temannya.',
        'Menandakan bahwa cerita berlatar zaman kerajaan kuno.',
      ],
      correctIndex: 0,
      explanation: 'Diksi "abdi" dan "di payuneun" mencerminkan kesantunan tokoh saat bersiap tampil di situasi kelas formal.',
    },
    reflectionPrompt: 'Pengalaman sekolah apa yang paling berkesan bagimu untuk dijadikan ide cerita pendek (carpon)?',
  },
  {
    id: 'mod-sisindiran',
    fase: 'Fase F (Kelas XI)',
    title: 'Sisindiran (Paparikan, Rarakitan, Wawangsalan)',
    subtitle: 'Seni merangkai cangkang (sampiran) dan eusi (isi) untuk menyampaikan nasihat dan humor.',
    cpCode: 'CP-XI-03',
    objectives: [
      'Membedakan bentuk Paparikan, Rarakitan, dan Wawangsalan berdasarkan aturan purwakanti (rima) dan jumlah suku kata (engang).',
      'Menyusun sisindiran bertema silih asih, piwuruk (nasihat belajar), dan sésébréd (humor sopan).',
    ],
    summaryExplanation:
      'Sisindiran adalah puisi tradisional Sunda yang memiliki cangkang (sampiran) dan eusi (isi). Setiap baris (padalisan) umumnya terdiri atas 8 suku kata (engang) dengan pola rima a-b-a-b.',
    excerptSunda:
      'Ka Bekasi meuli manggu, (8-u)\nDibawa ka Tambun Kidul. (8-u)\nLamun hayang jadi maju, (8-u)\nDiajar ulah ngan saukur kidul/ngedul. (8-u)',
    excerptTranslationId:
      'Ke Bekasi membeli manggis,\nDibawa ke Tambun Selatan.\nKalau ingin menjadi maju,\nBelajar jangan bermalas-malasan.',
    keyVocabulary: [
      { word: 'Cangkang', meaning: 'Sampiran (baris 1-2)', register: 'Istilah Sastra' },
      { word: 'Eusi', meaning: 'Isi / makna utama (baris 3-4)', register: 'Istilah Sastra' },
      { word: 'Piwuruk', meaning: 'Nasihat / petuah bijak', register: 'Lemes / Sastra' },
      { word: 'Ngedul', meaning: 'Malas', register: 'Loma' },
    ],
    quizQuestion: {
      question: 'Berapa jumlah suku kata (engang) standar dalam setiap baris (padalisan) paparikan dan rarakitan?',
      options: ['8 suku kata (engang)', '12 suku kata (engang)', '4 suku kata (engang)'],
      correctIndex: 0,
      explanation: 'Aturan patokan sisindiran (paparikan & rarakitan) adalah 8 engang (suku kata) setiap padalisan (baris).',
    },
    reflectionPrompt: 'Coba buat satu bait sisindiran piwuruk (nasihat) tentang semangat belajar bersama teman!',
  },
  {
    id: 'mod-panumbu-catur',
    fase: 'Fase F (Kelas XI)',
    title: 'Panumbu Catur (Moderator Diskusi)',
    subtitle: 'Memandu jalannya sawala (diskusi/seminar) menggunakan Bahasa Sunda ragam hormat.',
    cpCode: 'CP-XI-05',
    objectives: [
      'Menguasai struktur kalimat pembuka, pengantar materi, pengaturan tanya-jawab, dan penutup diskusi.',
      'Menggunakan ragam basa hormat secara konsisten saat menyapa pangjejer (pemateri) dan pamilon (peserta).',
    ],
    summaryExplanation:
      'Panumbu catur bertugas mengatur lalu lintas pembicaraan dalam diskusi (sawala) agar berjalan tertib, santun, dan tepat waktu.',
    excerptSunda:
      'Wilujeng énjing ka sadérék sadayana. Hatur nuhun ka pangjejer anu parantos medar matéri kalayan jéntré. Salajengna, simkuring muka termin patarosan kanggo tilu urang pamilon.',
    excerptTranslationId:
      'Selamat pagi kepada rekan-rekan sekalian. Terima kasih kepada pemateri yang telah memaparkan materi dengan jelas. Selanjutnya, saya membuka sesi pertanyaan untuk tiga orang peserta.',
    keyVocabulary: [
      { word: 'Panumbu catur', meaning: 'Moderator diskusi', register: 'Formal' },
      { word: 'Pangjejer', meaning: 'Pemateri / Narasumber', register: 'Formal' },
      { word: 'Pamilon', meaning: 'Peserta diskusi', register: 'Formal' },
      { word: 'Medar', meaning: 'Memaparkan / menguraikan', register: 'Lemes / Formal' },
    ],
    quizQuestion: {
      question: 'Apakah istilah Bahasa Sunda untuk menyebut "narasumber / pemateri" dalam sebuah diskusi?',
      options: ['Pangjejer', 'Panumbu catur', 'Girang serat'],
      correctIndex: 0,
      explanation: 'Pangjejer adalah pemateri/narasumber, Panumbu catur adalah moderator, dan Girang serat adalah notulis.',
    },
    reflectionPrompt: 'Kalimat pembuka apa yang paling membuatmu percaya diri saat menjadi moderator di depan kelas?',
  },
  {
    id: 'mod-argumentasi',
    fase: 'Fase F (Kelas XII)',
    title: 'Teks Argumentasi & Wawacan Budaya',
    subtitle: 'Menyusun pendapat logis berbasis fakta tentang pelestarian budaya Sunda di era modern.',
    cpCode: 'CP-XII-02',
    objectives: [
      'Menyusun argumen yang didukung data dan alasan logis menggunakan konjungsi kausalitas Bahasa Sunda.',
      'Mengaitkan nilai kearifan lokal ("Someah Hade ka Semah", "Silih Asah Silih Asih Silih Asuh") dengan tantangan generasi muda.',
    ],
    summaryExplanation:
      'Teks argumentasi bertujuan meyakinkan pembaca melalui gagasan utama, bukti faktual, dan kesimpulan yang objektif menggunakan ragam basa lemes/baku.',
    excerptSunda:
      'Ngamumulé basa Sunda di lingkungan sakola multicultural sapertos di Kabupaten Bekasi sanés perkawis anu mustahil. Ku ayana téknologi digital, para siswa tiasa diajar undak-usuk basa sacara mandiri tur taya rasa sieun.',
    excerptTranslationId:
      'Melestarikan bahasa Sunda di lingkungan sekolah multikultural seperti di Kabupaten Bekasi bukanlah hal yang mustahil. Dengan adanya teknologi digital, para siswa dapat belajar undak-usuk basa secara mandiri dan tanpa rasa takut.',
    keyVocabulary: [
      { word: 'Ngamumulé', meaning: 'Melestarikan / merawat dengan cinta', register: 'Umum / Sastra' },
      { word: 'Sanés perkawis', meaning: 'Bukan perkara / bukan hal', register: 'Lemes' },
      { word: 'Taya rasa sieun', meaning: 'Tanpa rasa takut', register: 'Umum' },
    ],
    quizQuestion: {
      question: 'Apa arti dari kata kerja "Ngamumulé" dalam konteks kebudayaan Sunda?',
      options: [
        'Merawat, menjaga, dan melestarikan warisan budaya dengan penuh kepedulian.',
        'Melupakan tradisi lama demi budaya asing.',
        'Menghafal kamus tanpa mempraktikkannya.',
      ],
      correctIndex: 0,
      explanation: '"Ngamumulé" berarti memelihara dan melestarikan warisan berharga agar tetap hidup.',
    },
    reflectionPrompt: 'Menurutmu, apa langkah paling nyata yang bisa dilakukan siswa SMA di Bekasi agar Bahasa Sunda tetap digunakan?',
  },
];

export interface AksaraItem {
  id: string;
  type: 'swara' | 'ngalagena' | 'angka' | 'rarangken';
  glyph: string;
  latin: string;
  name: string;
  exampleWordSunda: string;
  exampleWordAksara: string;
  exampleMeaning: string;
}

export const AKSARA_SUNDA_DATA: AksaraItem[] = [
  { id: 'ak-a', type: 'swara', glyph: 'ᮃ', latin: 'a', name: 'Swara A', exampleWordSunda: 'abdi', exampleWordAksara: 'ᮃᮘ᮪ᮓᮤ', exampleMeaning: 'saya (lemes)' },
  { id: 'ak-i', type: 'swara', glyph: 'ᮄ', latin: 'i', name: 'Swara I', exampleWordSunda: 'imah', exampleWordAksara: 'ᮄᮙᮂ', exampleMeaning: 'rumah (loma)' },
  { id: 'ak-u', type: 'swara', glyph: 'ᮅ', latin: 'u', name: 'Swara U', exampleWordSunda: 'urang', exampleWordAksara: 'ᮅᮛᮀ', exampleMeaning: 'kita / saya' },
  { id: 'ak-e-acute', type: 'swara', glyph: 'ᮆ', latin: 'é', name: 'Swara É (Taling)', exampleWordSunda: 'énjing', exampleWordAksara: 'ᮆᮔ᮪ᮏᮤᮀ', exampleMeaning: 'pagi / besok' },
  { id: 'ak-o', type: 'swara', glyph: 'ᮇ', latin: 'o', name: 'Swara O', exampleWordSunda: 'obor', exampleWordAksara: 'ᮇᮘᮧᮁ', exampleMeaning: 'obor' },
  { id: 'ak-e', type: 'swara', glyph: 'ᮈ', latin: 'e', name: 'Swara E (Pepet)', exampleWordSunda: 'ema', exampleWordAksara: 'ᮈᮙ', exampleMeaning: 'ibu' },
  { id: 'ak-eu', type: 'swara', glyph: 'ᮉ', latin: 'eu', name: 'Swara Eu', exampleWordSunda: 'eunteung', exampleWordAksara: 'ᮉᮔ᮪ᮒᮩᮀ', exampleMeaning: 'cermin' },
  { id: 'ak-ka', type: 'ngalagena', glyph: 'ᮊ', latin: 'ka', name: 'Ngalagena Ka', exampleWordSunda: 'kuring', exampleWordAksara: 'ᮊᮥᮛᮤᮀ', exampleMeaning: 'saya (loma)' },
  { id: 'ak-ga', type: 'ngalagena', glyph: 'ᮌ', latin: 'ga', name: 'Ngalagena Ga', exampleWordSunda: 'guru', exampleWordAksara: 'ᮌᮥᮛᮥ', exampleMeaning: 'guru' },
  { id: 'ak-nga', type: 'ngalagena', glyph: 'ᮍ', latin: 'nga', name: 'Ngalagena Nga', exampleWordSunda: 'ngaran', exampleWordAksara: 'ᮍᮛᮔ᮪', exampleMeaning: 'nama' },
  { id: 'ak-ca', type: 'ngalagena', glyph: 'ᮎ', latin: 'ca', name: 'Ngalagena Ca', exampleWordSunda: 'carpon', exampleWordAksara: 'ᮎᮁᮕᮧᮔ᮪', exampleMeaning: 'cerita pendek' },
  { id: 'ak-ja', type: 'ngalagena', glyph: 'ᮏ', latin: 'ja', name: 'Ngalagena Ja', exampleWordSunda: 'jawa barat', exampleWordAksara: 'ᮏᮝ ᮘᮛᮒ᮪', exampleMeaning: 'Jawa Barat' },
  { id: 'ak-nya', type: 'ngalagena', glyph: 'ᮑ', latin: 'nya', name: 'Ngalagena Nya', exampleWordSunda: 'nyarita', exampleWordAksara: 'ᮑᮛᮤᮒ', exampleMeaning: 'berbicara' },
  { id: 'ak-ta', type: 'ngalagena', glyph: 'ᮒ', latin: 'ta', name: 'Ngalagena Ta', exampleWordSunda: 'tiasa', exampleWordAksara: 'ᮒᮤᮃᮞ', exampleMeaning: 'bisa (lemes)' },
  { id: 'ak-da', type: 'ngalagena', glyph: 'ᮓ', latin: 'da', name: 'Ngalagena Da', exampleWordSunda: 'diajar', exampleWordAksara: 'ᮓᮤᮃᮏᮁ', exampleMeaning: 'belajar' },
  { id: 'ak-na', type: 'ngalagena', glyph: 'ᮔ', latin: 'na', name: 'Ngalagena Na', exampleWordSunda: 'neda', exampleWordAksara: 'ᮔᮨᮓ', exampleMeaning: 'makan (lemes)' },
  { id: 'ak-pa', type: 'ngalagena', glyph: 'ᮕ', latin: 'pa', name: 'Ngalagena Pa', exampleWordSunda: 'punten', exampleWordAksara: 'ᮕᮥᮔ᮪ᮒᮨᮔ᮪', exampleMeaning: 'permisi / maaf' },
  { id: 'ak-ba', type: 'ngalagena', glyph: 'ᮘ', latin: 'ba', name: 'Ngalagena Ba', exampleWordSunda: 'babaturan', exampleWordAksara: 'ᮘᮘᮒᮥᮛᮔ᮪', exampleMeaning: 'teman / sahabat' },
  { id: 'ak-ma', type: 'ngalagena', glyph: 'ᮙ', latin: 'ma', name: 'Ngalagena Ma', exampleWordSunda: 'manéh', exampleWordAksara: 'ᮙᮔᮦᮂ', exampleMeaning: 'kamu (loma)' },
  { id: 'ak-ya', type: 'ngalagena', glyph: 'ᮚ', latin: 'ya', name: 'Ngalagena Ya', exampleWordSunda: 'yaktos', exampleWordAksara: 'ᮚᮊ᮪ᮒᮧᮞ᮪', exampleMeaning: 'benar / sungguh' },
  { id: 'ak-ra', type: 'ngalagena', glyph: 'ᮛ', latin: 'ra', name: 'Ngalagena Ra', exampleWordSunda: 'rampés', exampleWordAksara: 'ᮛᮙ᮪ᮕᮦᮞ᮪', exampleMeaning: 'balasan sampurasun' },
  { id: 'ak-la', type: 'ngalagena', glyph: 'ᮜ', latin: 'la', name: 'Ngalagena La', exampleWordSunda: 'lemes', exampleWordAksara: 'ᮜᮨᮙᮨᮞ᮪', exampleMeaning: 'halus / sopan' },
  { id: 'ak-wa', type: 'ngalagena', glyph: 'ᮝ', latin: 'wa', name: 'Ngalagena Wa', exampleWordSunda: 'wangsul', exampleWordAksara: 'ᮝᮀᮞᮥᮜ᮪', exampleMeaning: 'pulang (lemes)' },
  { id: 'ak-sa', type: 'ngalagena', glyph: 'ᮞ', latin: 'sa', name: 'Ngalagena Sa', exampleWordSunda: 'sakola', exampleWordAksara: 'ᮞᮊᮧᮜ', exampleMeaning: 'sekolah' },
  { id: 'ak-ha', type: 'ngalagena', glyph: 'ᮠ', latin: 'ha', name: 'Ngalagena Ha', exampleWordSunda: 'hatur nuhun', exampleWordAksara: 'ᮠᮒᮥᮁ ᮔᮥᮠᮥᮔ᮪', exampleMeaning: 'terima kasih' },
  { id: 'ak-num-1', type: 'angka', glyph: '᮱', latin: '1', name: 'Angka Hiji (1)', exampleWordSunda: 'hiji', exampleWordAksara: '|᮱|', exampleMeaning: 'satu' },
  { id: 'ak-num-2', type: 'angka', glyph: '᮲', latin: '2', name: 'Angka Dua (2)', exampleWordSunda: 'dua', exampleWordAksara: '|᮲|', exampleMeaning: 'dua' },
  { id: 'ak-num-3', type: 'angka', glyph: '᮳', latin: '3', name: 'Angka Tilu (3)', exampleWordSunda: 'tilu', exampleWordAksara: '|᮳|', exampleMeaning: 'tiga' },
];

export interface CulturalTopic {
  id: string;
  category: string;
  title: string;
  sundaTerm: string;
  summary: string;
  philosophicalValue: string;
  quizChallenge: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const CULTURAL_TOPICS: CulturalTopic[] = [
  {
    id: 'cul-1',
    category: 'Nilai Kehidupan & Falsafah',
    title: 'Silih Asah, Silih Asih, Silih Asuh',
    sundaTerm: 'Три Tangtu & Falsafah Hirup',
    summary:
      'Pedoman hidup masyarakat Sunda dalam membangun komunitas pembelajar: saling mencerdaskan (Silih Asah), saling menyayangi dengan tulus (Silih Asih), dan saling membimbing/menjaga (Silih Asuh).',
    philosophicalValue: 'Menjadi fondasi utama mengapa BABATURAN hadir sebagai sahabat belajar yang tidak menghakimi kesalahan teman.',
    quizChallenge: {
      question: 'Manakah bagian dari falsafah Sunda yang berarti "saling berbagi ilmu dan saling mencerdaskan"?',
      options: ['Silih Asah', 'Silih Asih', 'Silih Asuh'],
      correctIndex: 0,
      explanation: 'Asah berarti mempertajam pengetahuan dan akal budi bersama-sama.',
    },
  },
  {
    id: 'cul-2',
    category: 'Alat Musik Tradisional',
    title: 'Angklung & Harmoni Awi (Bambu)',
    sundaTerm: 'Warisan Budaya Takbenda UNESCO',
    summary:
      'Alat musik multitonal dari bambu yang dimainkan dengan cara digoyangkan. Satu angklung hanya mewakili satu nada, sehingga sebuah lagu hanya bisa tercipta melalui kerja sama dan harmoni banyak pemain.',
    philosophicalValue: 'Mengajarkan gotong royong, kedisiplinan mendengar, dan keselarasan sosial.',
    quizChallenge: {
      question: 'Mengapa permainan Angklung melambangkan nilai kerja sama masyarakat Sunda?',
      options: [
        'Karena setiap pemain memegang satu nada yang harus dibunyikan tepat pada gilirannya untuk membentuk melodi utuh.',
        'Karena angklung hanya boleh dimainkan sendirian di atas panggung.',
        'Karena terbuat dari logam berat yang harus diangkat bersama.',
      ],
      correctIndex: 0,
      explanation: 'Tanpa koordinasi dan saling menghargai giliran antar pemain, melodi angklung tidak akan terbentuk.',
    },
  },
  {
    id: 'cul-3',
    category: 'Paribasa & Babasan Sunda',
    title: 'Hade Gogog Hade Tagog',
    sundaTerm: 'Tatakrama Basa jeung Paripolah',
    summary:
      'Peribahasa Sunda yang berarti "baik tutur katanya (gogog), baik pula sikap dan perilakunya (tagog)". Kesantunan berbahasa dalam undak-usuk basa selalu berjalan beriringan dengan sikap tubuh yang menghormati sesama.',
    philosophicalValue: 'Mengingatkan siswa bahwa belajar undak-usuk basa bukan sekadar hafalan ujian, melainkan pembentukan karakter.',
    quizChallenge: {
      question: 'Apa makna dari paribasa "Hadé gogog hadé tagog"?',
      options: [
        'Santun dalam bertutur kata serta sopan dalam tingkah laku.',
        'Berbicara keras agar didengar semua orang.',
        'Hanya sopan ketika berada di depan guru saja.',
      ],
      correctIndex: 0,
      explanation: 'Gogog merujuk pada ucapan/tutur bahasa, sedangkan tagog merujuk pada pembawaan diri/sikap.',
    },
  },
  {
    id: 'cul-4',
    category: 'Simbol & Pusaka',
    title: 'Kujang Pajajaran & Identitas Pasundan',
    sundaTerm: 'Pusaka Lambang Kawicaksanaan',
    summary:
      'Kujang awalnya merupakan perkakas pertanian masyarakat Sunda kuno yang berkembang menjadi simbol ketajaman pikiran, keberanian membela kebenaran, dan keseimbangan antara manusia, alam, serta Sang Pencipta.',
    philosophicalValue: 'Menginspirasi generasi muda untuk memiliki ketajaman berpikir kritis dan berakar pada budaya lokal.',
    quizChallenge: {
      question: 'Kujang pada mulanya berakar dari kehidupan masyarakat Sunda di bidang apa?',
      options: ['Pertanian / Perladangan (Huma)', 'Pelayaran Samudra', 'Pertambangan Batu Bara'],
      correctIndex: 0,
      explanation: 'Kujang berakar dari tradisi masyarakat agraris/peladang Sunda sebelum menjadi simbol filosofis.',
    },
  },
];

export const STUDENT_REFLECTION_QUESTIONS: { id: string; question: string; placeholder: string }[] = [
  {
    id: 'q1',
    question: '1. Apa hal penting yang saya pelajari ketika menulis Draft 1 secara mandiri tanpa AI/Translator?',
    placeholder: 'Misal: Saya menyadari kosakata mana yang sudah saya kuasai dan bagian kalimat mana yang masih ragu...',
  },
  {
    id: 'q2',
    question: '2. Apa perbedaan paling penting antara tulisan asli saya (Draft 1) dan versi alternatif BABATURAN?',
    placeholder: 'Misal: Versi BABATURAN menggunakan ragam lemes untuk diri sendiri seperti "abdi" dan "wangsul"...',
  },
  {
    id: 'q3',
    question: '3. Kosakata atau struktur kalimat Bahasa Sunda apa yang baru saya pelajari dari proses perbandingan ini?',
    placeholder: 'Sebutkan 2-3 kata atau ungkapan baru yang kamu pahami maknanya...',
  },
  {
    id: 'q4',
    question: '4. Perbaikan apa yang saya putuskan untuk dilakukan pada Draft 2?',
    placeholder: 'Jelaskan perubahan kata, ejaan, atau undak-usuk basa yang kamu terapkan...',
  },
  {
    id: 'q5',
    question: '5. Apakah saya memahami alasan linguistik/konteks di balik perubahan tersebut?',
    placeholder: 'Jelaskan mengapa pilihan kata di Draft 2 lebih tepat sesuai lawan bicara/tujuan teks...',
  },
  {
    id: 'q6',
    question: '6. Apakah saran AI selalu benar atau harus diterima semuanya? Mengapa?',
    placeholder: 'Misal: Tidak selalu, karena ada pengalaman pribadi saya di Draft 1 yang harus tetap dipertahankan...',
  },
  {
    id: 'q7',
    question: '7. Bagian mana dalam menulis Bahasa Sunda yang masih terasa sulit bagi saya?',
    placeholder: 'Misal: Membedakan kata kerja lemes keur sorangan dan lemes keur batur...',
  },
  {
    id: 'q8',
    question: '8. Apakah saya merasa lebih percaya diri menulis Bahasa Sunda setelah melalui tahapan Writing Lab ini?',
    placeholder: 'Ceritakan perubahan rasa percaya dirimu...',
  },
];
