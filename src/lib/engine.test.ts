import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRankAndXP,
  canUseAiInWritingLab,
  canUseTranslatorInWritingLab,
  evaluateDiagnosticProfile,
  evaluateWritingRubric,
  generateDraftComparison,
  submitDraft1ToStage2,
  totalRubricScore,
  translateWithMultiEngine,
  transliterateToAksaraSunda,
  WritingLabSessionState,
} from './engine';

test('Priority 1 & 3: Multi-engine translator works independently of SundaDigi and provides register comparison', () => {
  const resGuru = translateWithMultiEngine(
    'Saya ingin belajar Bahasa Sunda karena saya ingin mengenal budaya Sunda.',
    'id',
    'su',
    'guru'
  );

  assert.equal(resGuru.providers.length, 3);
  assert.equal(resGuru.providers[0].providerId, 'babaturan_contextual');
  assert.equal(resGuru.providers[1].providerId, 'google_cloud_nmt');
  assert.equal(resGuru.providers[2].providerId, 'sundadigi_candidate');
  assert.ok(resGuru.primaryTranslation.includes('Abdi'));
  assert.ok(resGuru.registerVariants.lomaTeman.text.includes('Kuring'));
  assert.ok(resGuru.wordByWord.length >= 4);
  assert.ok(resGuru.whyThisChoice.length >= 2);

  const resTeman = translateWithMultiEngine(
    'Saya ingin belajar Bahasa Sunda karena saya ingin mengenal budaya Sunda.',
    'id',
    'su',
    'teman_sebaya'
  );
  assert.ok(resTeman.primaryTranslation.includes('Kuring'));
});

test('Priority 2: Writing Lab strictly locks Translator and AI in Stage 1 (Draft 1) and Stage 4 (Draft 2)', () => {
  const stage1Trans = canUseTranslatorInWritingLab('STAGE_1_DRAFT_1', 'MODE_A_INDEPENDENT');
  const stage1Ai = canUseAiInWritingLab('STAGE_1_DRAFT_1', 'MODE_A_INDEPENDENT');
  assert.equal(stage1Trans.allowed, false);
  assert.equal(stage1Ai.allowed, false);

  const stage2Trans = canUseTranslatorInWritingLab('STAGE_2_ASSISTANCE', 'MODE_A_INDEPENDENT');
  const stage2Ai = canUseAiInWritingLab('STAGE_2_ASSISTANCE', 'MODE_A_INDEPENDENT');
  assert.equal(stage2Trans.allowed, true);
  assert.equal(stage2Ai.allowed, true);

  const stage4Trans = canUseTranslatorInWritingLab('STAGE_4_DRAFT_2', 'MODE_A_INDEPENDENT');
  const stage4Ai = canUseAiInWritingLab('STAGE_4_DRAFT_2', 'MODE_A_INDEPENDENT');
  assert.equal(stage4Trans.allowed, false);
  assert.equal(stage4Ai.allowed, false);
});

test('Priority 2: Submitting Draft 1 validates word count, locks Draft 1 immutably, and transitions to Stage 2', () => {
  const initialSession: WritingLabSessionState = {
    assignmentId: 'asg-1',
    studentName: 'Dinda Putri',
    studentClass: 'XI-2 SMAN 2 Tambun Selatan',
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
  };

  // Too short should fail
  const failRes = submitDraft1ToStage2(initialSession, 'Abdi ka sakola.', 8);
  assert.equal(failRes.ok, false);
  assert.equal(failRes.nextState.currentStage, 'STAGE_1_DRAFT_1');

  // Valid Draft 1
  const validDraft1 =
    'Poé Senén kuring indit ka SMAN 2 Tambun Selatan bareng babaturan. Kuring tuang di kantin sakola tuluy balik ka imah.';
  const okRes = submitDraft1ToStage2(initialSession, validDraft1, 8, '2026-11-10T08:00:00Z');
  assert.equal(okRes.ok, true);
  assert.equal(okRes.nextState.currentStage, 'STAGE_2_ASSISTANCE');
  assert.equal(okRes.nextState.draft1Locked, true);
  assert.equal(okRes.nextState.draft1Text, validDraft1);

  // Attempting to overwrite locked Draft 1 must fail
  const overwriteRes = submitDraft1ToStage2(okRes.nextState, 'Tulisan baru yang mencoba menimpa Draft 1 yang sudah dikunci.', 5);
  assert.equal(overwriteRes.ok, false);
  assert.equal(overwriteRes.nextState.draft1Text, validDraft1);
});

test('Priority 2: AI comparison and same-rubric evaluation detect register improvements from Draft 1 to Draft 2', () => {
  const draft1 =
    'Poé Senén kuring indit ka SMAN 2 Tambun Selatan bareng babaturan. Kuring tuang di kantin.';
  const comparison = generateDraftComparison(draft1, 'Lemes (Hormat)');
  assert.ok(comparison.aiVersionText.includes('abdi'));
  assert.ok(comparison.suggestions.length >= 3);

  const draft2 =
    'Nalika dinten Senén munggaran lebet ka SMAN 2 Tambun Selatan, abdi mios ka sakola sareng réréncangan. Abdi neda di kantin sakola kalayan bingah pisan sateuacan wangsul ka rorompok.';
  const score1 = evaluateWritingRubric(draft1);
  const score2 = evaluateWritingRubric(draft2);

  assert.ok(totalRubricScore(score2) > totalRubricScore(score1));
  assert.ok(score2.undakUsuk > score1.undakUsuk);
});

test('Gamification, Diagnostic & Aksara Sunda transliteration work accurately', () => {
  const rank = calculateRankAndXP(520);
  assert.equal(rank.rankName, 'Pangucap');
  assert.ok(rank.level >= 4);

  const diag = evaluateDiagnosticProfile(2, 4);
  assert.equal(diag.profile, 'ngarti_pasif');

  const aksara = transliterateToAksaraSunda('abdi diajar basa sunda');
  assert.equal(aksara, 'ᮃᮘ᮪ᮓᮤ ᮓᮤᮃᮏᮁ ᮘᮞ ᮞᮥᮔ᮪ᮓ');
});
