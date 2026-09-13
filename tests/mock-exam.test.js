// 模試モードの計算部分のテストです。
// 画面の見た目には関係なく、「残り時間の計算」と「採点」だけを確かめます。

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOCK_EXAM_QUESTION_COUNT,
  MOCK_EXAM_LIMIT_SECONDS,
  remainingSeconds,
  formatRemaining,
  gradeMockExam,
} from '../js/mock-exam.js';

// ---------------------------------------------------------------------------
// 決まりごと
// ---------------------------------------------------------------------------

test('模試は50問・75分', () => {
  assert.equal(MOCK_EXAM_QUESTION_COUNT, 50);
  assert.equal(MOCK_EXAM_LIMIT_SECONDS, 75 * 60);
});

// ---------------------------------------------------------------------------
// 残り時間の計算
// ---------------------------------------------------------------------------

test('始めた直後の残り時間は制限時間そのもの', () => {
  assert.equal(remainingSeconds(1000, 1000), 4500);
});

test('1分たつと残り時間が60秒減る', () => {
  assert.equal(remainingSeconds(0, 60 * 1000), 4500 - 60);
});

test('制限時間を過ぎても残り時間はマイナスにならない', () => {
  assert.equal(remainingSeconds(0, 99999 * 1000), 0);
});

test('制限時間はあとから変えられる(短い模試を作れるように)', () => {
  assert.equal(remainingSeconds(0, 10 * 1000, 60), 50);
});

test('端末の時計が巻き戻っても、制限時間を超える値は返さない', () => {
  // 時刻合わせなどで時計が戻ることがある。
  // そのとき「残り時間が増える」と本番の練習にならないので上限で止める
  assert.equal(remainingSeconds(10000, 0), 4500);
});

test('残り時間はMM:SSの形で表示される', () => {
  assert.equal(formatRemaining(4500), '75:00');
  assert.equal(formatRemaining(65), '01:05');
  assert.equal(formatRemaining(0), '00:00');
});

test('残り時間がマイナスでも00:00と表示される', () => {
  assert.equal(formatRemaining(-30), '00:00');
});

// ---------------------------------------------------------------------------
// 採点
// ---------------------------------------------------------------------------

// 採点のテストで使う、小さな問題セットと分野一覧
const questions = [
  { id: 'history-001', category: 'history' },
  { id: 'history-002', category: 'history' },
  { id: 'chemistry-001', category: 'chemistry' },
  { id: 'chemistry-002', category: 'chemistry' },
];
const categories = [
  { id: 'history', name: '茶の歴史' },
  { id: 'chemistry', name: '茶の化学' },
  { id: 'brewing', name: '茶の淹れ方' },
];

test('全問正解なら100%になる', () => {
  const results = new Map([
    ['history-001', true],
    ['history-002', true],
    ['chemistry-001', true],
    ['chemistry-002', true],
  ]);
  const graded = gradeMockExam(questions, results, categories);
  assert.equal(graded.total, 4);
  assert.equal(graded.correct, 4);
  assert.equal(graded.accuracyPercent, 100);
});

test('答えなかった問題は不正解として数える', () => {
  // 4問中1問しか答えていない。残り3問は時間切れなどで未回答。
  // 本番のマークシートも空欄は点にならないので、それに合わせている
  const results = new Map([['history-001', true]]);
  const graded = gradeMockExam(questions, results, categories);
  assert.equal(graded.correct, 1);
  assert.equal(graded.accuracyPercent, 25);
});

test('分野別の正答率が出る', () => {
  const results = new Map([
    ['history-001', true],
    ['history-002', false],
    ['chemistry-001', true],
    ['chemistry-002', true],
  ]);
  const graded = gradeMockExam(questions, results, categories);
  const history = graded.byCategory.find((r) => r.categoryId === 'history');
  const chemistry = graded.byCategory.find((r) => r.categoryId === 'chemistry');
  assert.equal(history.categoryName, '茶の歴史');
  assert.equal(history.correct, 1);
  assert.equal(history.total, 2);
  assert.equal(history.accuracyPercent, 50);
  assert.equal(chemistry.accuracyPercent, 100);
});

test('出題されなかった分野は一覧に出さない', () => {
  const graded = gradeMockExam(questions, new Map(), categories);
  assert.equal(
    graded.byCategory.some((r) => r.categoryId === 'brewing'),
    false
  );
});

test('分野別の並びは categories.json の順番どおりになる', () => {
  // 画面に出す順番がホーム画面と食い違わないようにするため
  const graded = gradeMockExam(questions, new Map(), categories);
  assert.deepEqual(
    graded.byCategory.map((r) => r.categoryId),
    ['history', 'chemistry']
  );
});

test('問題が0問でも落ちない', () => {
  const graded = gradeMockExam([], new Map(), categories);
  assert.equal(graded.total, 0);
  assert.equal(graded.correct, 0);
  assert.equal(graded.accuracyPercent, 0);
  assert.deepEqual(graded.byCategory, []);
});

test('採点しても、渡した記録は書き換えられない', () => {
  // 元のデータを壊さないことを確かめる
  const results = new Map([['history-001', true]]);
  gradeMockExam(questions, results, categories);
  assert.equal(results.size, 1);
  assert.equal(questions.length, 4);
});
