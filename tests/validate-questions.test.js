// 問題データの形が正しいかを見張るテストです。
// 問題を手で書き足したときのうっかりミス(選択肢が4つしかない、
// 分野名の打ち間違い、IDの重複など)を、ここで自動的に見つけます。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateQuestion,
  validateQuestions,
  VALID_CATEGORY_IDS,
  REQUIRED_CHOICE_COUNT,
} from '../js/validate-questions.js';

// テスト用に「正しい問題」を1つ作る関数。
// 引数で一部だけ上書きできるようにしておくと、
// 「選択肢だけ壊した問題」などを短く書ける
function makeValidQuestion(overrides = {}) {
  return {
    id: 'chemistry-001',
    category: 'chemistry',
    question: 'テスト用の問題文',
    choices: ['選択肢あ', '選択肢い', '選択肢う', '選択肢え', '選択肢お'],
    correctIndex: 0,
    explanation: 'テスト用の解説',
    source: {
      name: 'テスト用の資料名',
      url: 'https://example.com/doc',
      confirmedDate: '2026-09-13',
    },
    verified: true,
    ...overrides,
  };
}

// 実際の問題データを読み込む小さな道具。
// 複数のテストで使うので、1か所にまとめておく
function loadQuestions() {
  const raw = readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8');
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// 決まりごとの確認
// ---------------------------------------------------------------------------

test('分野は10種類ある', () => {
  assert.equal(VALID_CATEGORY_IDS.length, 10);
});

test('選択肢の必要数は5つ(本番が五肢択一のため)', () => {
  assert.equal(REQUIRED_CHOICE_COUNT, 5);
});

test('決められた10分野はすべて通る', () => {
  for (const categoryId of VALID_CATEGORY_IDS) {
    const errors = validateQuestion(makeValidQuestion({ category: categoryId }));
    assert.deepEqual(errors, [], `${categoryId} でエラーが出ました`);
  }
});

// ---------------------------------------------------------------------------
// 1問ずつの検査
// ---------------------------------------------------------------------------

test('正しい問題ならエラーが出ない', () => {
  assert.deepEqual(validateQuestion(makeValidQuestion()), []);
});

test('idが空だとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ id: '' }));
  assert.ok(errors.some((e) => e.includes('id')));
});

test('選択肢が4つだとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({ choices: ['あ', 'い', 'う', 'え'], correctIndex: 0 })
  );
  assert.ok(errors.some((e) => e.includes('choices')));
});

test('選択肢が6つでもエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({ choices: ['あ', 'い', 'う', 'え', 'お', 'か'], correctIndex: 0 })
  );
  assert.ok(errors.some((e) => e.includes('choices')));
});

test('同じ選択肢が2つあるとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({ choices: ['あ', 'あ', 'う', 'え', 'お'] })
  );
  assert.ok(errors.some((e) => e.includes('同じ選択肢')));
});

test('分野IDが10種以外だとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ category: 'cancer' }));
  assert.ok(errors.some((e) => e.includes('category')));
});

test('correctIndexが範囲外だとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ correctIndex: 5 }));
  assert.ok(errors.some((e) => e.includes('correctIndex')));
});

test('correctIndexがマイナスだとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ correctIndex: -1 }));
  assert.ok(errors.some((e) => e.includes('correctIndex')));
});

test('correctIndexが小数だとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ correctIndex: 1.5 }));
  assert.ok(errors.some((e) => e.includes('correctIndex')));
});

test('correctIndexが数字でないとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ correctIndex: NaN }));
  assert.ok(errors.some((e) => e.includes('correctIndex')));
});

test('問題文が空だとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ question: '' }));
  assert.ok(errors.some((e) => e.includes('question')));
});

test('解説が空だとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ explanation: '' }));
  assert.ok(errors.some((e) => e.includes('explanation')));
});

test('verifiedが書かれていないとエラーになる', () => {
  const q = makeValidQuestion();
  delete q.verified;
  const errors = validateQuestion(q);
  assert.ok(errors.some((e) => e.includes('verified')));
});

test('verifiedが真偽値でないとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ verified: 'true' }));
  assert.ok(errors.some((e) => e.includes('verified')));
});

// ---------------------------------------------------------------------------
// 出典の検査。
// 「裏が取れた」と印を付けた問題には、必ず出典を書かせる
// ---------------------------------------------------------------------------

test('verifiedがtrueなのに出典URLがないとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({
      source: { name: '資料名', confirmedDate: '2026-09-13' },
    })
  );
  assert.ok(errors.some((e) => e.includes('source.url')));
});

test('verifiedがtrueなのに出典名がないとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({
      source: { url: 'https://example.com', confirmedDate: '2026-09-13' },
    })
  );
  assert.ok(errors.some((e) => e.includes('source.name')));
});

test('verifiedがtrueなのに確認日の形が違うとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({
      source: { name: '資料名', url: 'https://example.com', confirmedDate: '2026/09/13' },
    })
  );
  assert.ok(errors.some((e) => e.includes('confirmedDate')));
});

test('出典URLがhttpやhttpsで始まらないとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({
      source: { name: '資料名', url: 'example.com', confirmedDate: '2026-09-13' },
    })
  );
  assert.ok(errors.some((e) => e.includes('source.url')));
});

test('verifiedがfalseなら出典がなくてもよい', () => {
  const q = makeValidQuestion({ verified: false });
  delete q.source;
  assert.deepEqual(validateQuestion(q), []);
});

// ---------------------------------------------------------------------------
// 全体の検査
// ---------------------------------------------------------------------------

test('IDが重複しているとエラーになる', () => {
  const results = validateQuestions([makeValidQuestion(), makeValidQuestion()]);
  assert.equal(results.length, 1);
  assert.ok(results[0].errors.some((e) => e.includes('重複')));
});

test('IDが重複していなければ通る', () => {
  const results = validateQuestions([
    makeValidQuestion({ id: 'chemistry-001' }),
    makeValidQuestion({ id: 'chemistry-002' }),
  ]);
  assert.deepEqual(results, []);
});

// ---------------------------------------------------------------------------
// 実際の問題データの検査
// ---------------------------------------------------------------------------

test('categories.jsonの並びとVALID_CATEGORY_IDSが一致している', () => {
  const raw = readFileSync(new URL('../data/categories.json', import.meta.url), 'utf8');
  const categories = JSON.parse(raw);
  assert.deepEqual(
    categories.map((c) => c.id),
    VALID_CATEGORY_IDS
  );
});

test('categories.jsonのすべての分野に名前がついている', () => {
  const raw = readFileSync(new URL('../data/categories.json', import.meta.url), 'utf8');
  const categories = JSON.parse(raw);
  for (const category of categories) {
    assert.ok(
      typeof category.name === 'string' && category.name.length > 0,
      `${category.id} に name がありません`
    );
  }
});

test('data/questions.jsonに形式エラーが1件もない', () => {
  const results = validateQuestions(loadQuestions());
  // エラーがあったら、どの問題がなぜ駄目かを画面に出す
  assert.deepEqual(results, [], JSON.stringify(results, null, 2));
});

test('正解の位置が特定の場所に偏っていない', () => {
  /*
    位置で答えを覚えてしまうのを防ぐためのテストです。

    アプリは表示のたびに選択肢を並び替えるので、遊ぶぶんには偏っていても困りません。
    ただしデータそのものが「ほぼ1番目が正解」のような作りだと、
    作問時に無意識の癖が出ている証拠なので、そこを見張ります。

    問題が少ないうちは、たまたま偏ることがあります。
    50問未満のときは判定せず、数がそろってから見るようにしています。
  */
  const questions = loadQuestions();
  if (questions.length < 50) return;

  const counts = new Array(REQUIRED_CHOICE_COUNT).fill(0);
  for (const q of questions) counts[q.correctIndex] += 1;

  const expected = questions.length / REQUIRED_CHOICE_COUNT;
  counts.forEach((count, position) => {
    assert.ok(
      count > expected * 0.7 && count < expected * 1.3,
      `正解が${position + 1}番目の問題が${count}問と偏っています(目安は${Math.round(expected)}問前後)`
    );
  });
});
