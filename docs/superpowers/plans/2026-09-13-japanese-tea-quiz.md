# 日本茶インストラクター1次試験 クイズアプリ 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 妻が2026年11月8日の日本茶インストラクター第一次試験（五肢択一）に向けて、スマホで反復練習できるクイズアプリを2日で完成させる。

**Architecture:** 既存の完成済みアプリ `pharmacy quiz` を丸ごとコピーし、薬剤師専用機能を削除して日本茶用に作り替える。出題エンジンは選択肢の個数に依存しない作りなので五肢択一はそのまま動く。新規に作るのは「模試モード」と「※テキストで要確認バッジ」の2つだけ。

**Tech Stack:** 素のHTML / CSS / JavaScript（ESモジュール）、ビルド工程なし。テストは Node.js 標準の `node --test`。PWA（manifest + service worker）。公開は GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-09-13-japanese-tea-quiz-design.md`

## Global Constraints

- 作業ディレクトリ: `C:\Users\kokky\OneDrive\デスクトップ\.claude\japanese tea`
- コピー元: `C:\Users\kokky\OneDrive\デスクトップ\.claude\pharmacy quiz`
- 選択肢は**必ずちょうど5つ**（本番が五肢択一のため）。4つも6つも検査で弾く。
- 問題データに `difficulty` フィールドは**使わない**。
- 分野IDは次の10種のみ: `history` `industry` `teaching` `cultivation` `manufacturing` `health` `chemistry` `brewing` `utilization` `inspection`
- **記憶だけで数値（含有率・年代・温度・時間・品種名・統計値）を書かない。** 1分野につき最低2〜3本の公開資料に実際にアクセスしてから作問する。
- 裏が取れた問題は `verified: true` ＋ `source`（name / url / confirmedDate）。取れなかったものは `verified: false` として出題し、画面に「※テキストで要確認」バッジを出す。**除外はしない。**
- 保存キーの接頭辞は `pharmacyQuiz.` から `teaQuiz.` に変える。
- コメントは初心者が読み返せるよう、各処理に日本語で多めに書く（既存ファイルの書き方に合わせる）。
- 目標問数（合計400問）: history 55 / manufacturing 55 / industry 50 / cultivation 45 / chemistry 40 / health 40 / inspection 35 / brewing 35 / utilization 25 / teaching 20
- コミットメッセージ末尾に必ず付ける: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

---

## File Structure

**新規に作るファイル**

| パス | 役割 |
|---|---|
| `js/mock-exam.js` | 模試モードの計算のみ（残り時間・採点）。画面には触らない |
| `tests/mock-exam.test.js` | 上のテスト |
| `data/categories.json` | 10分野の id と name |
| `data/questions.json` | 問題データ本体 |

**コピーしてから中身を書き替えるファイル**

| パス | 変更内容 |
|---|---|
| `index.html` | タイトル変更。難易度画面・利用者画面・共有画面・先生用画面を削除。模試ボタンと模試画面を追加 |
| `css/style.css` | `--cat-*` を10分野の色に差し替え。要確認バッジと残り時間表示のスタイルを追加 |
| `js/app.js` | report系importを削除。`DIFFICULTIES`/`SHARE_OPTIONS` 削除。利用者画面・先生用画面の関数を削除。疑義照会の2段階出題を削除。出題プールを全問に変更。模試モードを追加 |
| `js/storage.js` | 保存キーの接頭辞を `teaQuiz.` に変更。共有レベル関連を削除 |
| `js/validate-questions.js` | 日本茶用に全面書き替え |
| `js/quiz-engine.js` | `filterQuestions` から `difficulty` を削除 |
| `js/stats.js` | 変更なし（そのまま使える） |
| `service-worker.js` | キャッシュ名とファイル一覧を更新 |
| `manifest.json` | 名前・色を日本茶用に |
| `package.json` | 名前を `japanese-tea-quiz` に |

**コピーしないもの**

`.git` `node_modules` `.guideline-cache` `.law-cache` `.pmda-cache` `.pmda-if` `.superpowers` `.worktrees` `docs/` `js/report-code.js` `js/report-sync.js` `tests/report-code.test.js` `tests/report-sync.test.js` `data/` `tools/`（`add-question.mjs` と `shuffle-choices.mjs` を除く） `README.md`

---

## Task 1: 土台づくり（コピーと不要ファイルの削除）

**Files:**
- Create: `japanese tea/` 配下一式（コピー）
- Delete: 上記「コピーしないもの」

**Interfaces:**
- Consumes: なし（最初のタスク）
- Produces: 後続すべてのタスクが編集する対象ファイル群。`node --test` が動く状態。

- [x] **Step 1: 必要なファイルだけをコピーする**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
SRC="/c/Users/kokky/OneDrive/デスクトップ/.claude/pharmacy quiz"
mkdir -p css js icons tests tools data
cp "$SRC/index.html" .
cp "$SRC/manifest.json" "$SRC/service-worker.js" "$SRC/dev-server.js" "$SRC/package.json" "$SRC/.gitignore" "$SRC/.nojekyll" .
cp "$SRC/css/style.css" css/
cp "$SRC/js/app.js" "$SRC/js/quiz-engine.js" "$SRC/js/storage.js" "$SRC/js/stats.js" "$SRC/js/validate-questions.js" js/
cp "$SRC/icons/icon.svg" icons/
cp "$SRC/tests/quiz-engine.test.js" "$SRC/tests/stats.test.js" "$SRC/tests/storage.test.js" "$SRC/tests/validate-questions.test.js" tests/
cp "$SRC/tools/add-question.mjs" "$SRC/tools/shuffle-choices.mjs" tools/
```

- [x] **Step 2: コピーされたか確認する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
test -f index.html && test -f js/app.js && test -f css/style.css && echo "OK: 主要ファイルあり"
test ! -d node_modules && test ! -d .git && echo "OK: 不要物なし"
```

期待: 両方とも OK が出る。

- [x] **Step 3: report系への参照が残っていないか探す**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
grep -rn "report-code\|report-sync\|report-endpoint" --include="*.js" --include="*.html" --include="*.json" .
```

期待: `index.html`（report画面のHTML）と `js/app.js`（import文）だけがヒットする。これらは Task 3 で消す。

- [x] **Step 4: package.json の名前を変える**

`package.json` の `"name": "pharmacy-quiz-app"` を `"name": "japanese-tea-quiz"` に書き替える。他の項目は触らない。

- [x] **Step 5: git リポジトリを作って最初のコミットをする**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git init
git add -A
git commit -m "chore: pharmacy quiz をコピーして日本茶クイズの土台を作る

既存の完成済みアプリから、日本茶でも使える部分だけを持ってきた。
薬剤師専用の機能はコピーしていない。削除は次のタスクで行う。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: 10分野の定義と、問題データの検査機能

**Files:**
- Create: `data/categories.json`
- Create: `data/questions.json`（この時点では空配列 `[]`）
- Rewrite: `js/validate-questions.js`
- Rewrite: `tests/validate-questions.test.js`

**Interfaces:**
- Consumes: Task 1 が用意したファイル群
- Produces:
  - `VALID_CATEGORY_IDS: string[]`（10要素）
  - `REQUIRED_CHOICE_COUNT: number`（= 5）
  - `validateQuestion(q): string[]` … エラーメッセージの配列。問題なければ空配列
  - `validateQuestions(questions): {id: string, errors: string[]}[]` … エラーのある問題だけ返す
  - `data/categories.json` … `[{id, name}]` の配列。Task 3・6・7・8 が参照する

> **実行時の追記(2026-09-13):** コピー元の `tests/validate-questions.test.js` には
> 「正解の位置が特定の場所に偏っていない」という自動テストが入っていた。
> 計画では Task 7/8 で手動コマンドとして数える予定だったが、自動テストの方が確実なので
> 下のテストファイルに五肢択一版として引き継ぐ。手動コマンドは補助扱いにする。

- [x] **Step 1: 失敗するテストを書く**

`tests/validate-questions.test.js` を次の内容で**丸ごと置き換える**。

```javascript
// 問題データの形が正しいかを見張るテストです。
// 問題を手で書き足したときのうっかりミス(選択肢が4つしかない、
// 分野名の打ち間違い、IDの重複など)を、ここで自動的に見つけます。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('分野は10種類ある', () => {
  assert.equal(VALID_CATEGORY_IDS.length, 10);
});

test('選択肢の必要数は5つ(本番が五肢択一のため)', () => {
  assert.equal(REQUIRED_CHOICE_COUNT, 5);
});

test('正しい問題ならエラーが出ない', () => {
  assert.deepEqual(validateQuestion(makeValidQuestion()), []);
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

test('correctIndex が範囲外だとエラーになる', () => {
  const errors = validateQuestion(makeValidQuestion({ correctIndex: 5 }));
  assert.ok(errors.some((e) => e.includes('correctIndex')));
});

test('verified が true なのに出典URLがないとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({
      source: { name: '資料名', confirmedDate: '2026-09-13' },
    })
  );
  assert.ok(errors.some((e) => e.includes('source.url')));
});

test('verified が true なのに確認日の形が違うとエラーになる', () => {
  const errors = validateQuestion(
    makeValidQuestion({
      source: { name: '資料名', url: 'https://example.com', confirmedDate: '2026/09/13' },
    })
  );
  assert.ok(errors.some((e) => e.includes('confirmedDate')));
});

test('verified が false なら出典がなくてもよい', () => {
  const q = makeValidQuestion({ verified: false });
  delete q.source;
  assert.deepEqual(validateQuestion(q), []);
});

test('IDが重複しているとエラーになる', () => {
  const results = validateQuestions([makeValidQuestion(), makeValidQuestion()]);
  assert.equal(results.length, 1);
  assert.ok(results[0].errors.some((e) => e.includes('重複')));
});

test('categories.json の並びと VALID_CATEGORY_IDS が一致している', async () => {
  const raw = await readFile(new URL('../data/categories.json', import.meta.url), 'utf8');
  const categories = JSON.parse(raw);
  assert.deepEqual(
    categories.map((c) => c.id),
    VALID_CATEGORY_IDS
  );
});

test('data/questions.json に形式エラーが1件もない', async () => {
  const raw = await readFile(new URL('../data/questions.json', import.meta.url), 'utf8');
  const results = validateQuestions(JSON.parse(raw));
  // エラーがあったら、どの問題がなぜ駄目かを画面に出す
  assert.deepEqual(results, [], JSON.stringify(results, null, 2));
});
```

- [x] **Step 2: テストを実行して失敗することを確認する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test tests/validate-questions.test.js
```

期待: FAIL。`REQUIRED_CHOICE_COUNT` が export されていないこと、`data/categories.json` が無いことでこける。

- [x] **Step 3: data/categories.json を作る**

```json
[
  { "id": "history",       "name": "茶の歴史" },
  { "id": "industry",      "name": "茶業のあらまし" },
  { "id": "teaching",      "name": "伝え方の基本" },
  { "id": "cultivation",   "name": "茶の栽培" },
  { "id": "manufacturing", "name": "茶の製造法" },
  { "id": "health",        "name": "茶の健康科学" },
  { "id": "chemistry",     "name": "茶の化学" },
  { "id": "brewing",       "name": "茶の淹れ方" },
  { "id": "utilization",   "name": "茶の利用" },
  { "id": "inspection",    "name": "茶の品質審査と鑑定" }
]
```

- [x] **Step 4: data/questions.json を空の配列で作る**

```json
[]
```

- [x] **Step 5: js/validate-questions.js を丸ごと置き換える**

```javascript
// 1問分のデータが正しい形になっているかを調べる部品です。
// 問題を書き足したときのうっかりミス(選択肢の数が違う、分野名の打ち間違い、
// 出典の書き忘れなど)に気づけるようにするためのものです。

// 出題10分野の正式なID。
// data/categories.json と同じ並び・同じ内容にしておく必要があり、
// ずれていないかはテストで見張っている。
// 分野名を打ち間違えると、その問題はホーム画面からも正答率画面からも消えてしまい、
// しかもエラーが出ないため、ここで必ず照合する。
export const VALID_CATEGORY_IDS = [
  'history',
  'industry',
  'teaching',
  'cultivation',
  'manufacturing',
  'health',
  'chemistry',
  'brewing',
  'utilization',
  'inspection',
];

// 本番の第一次試験は「五肢択一」なので、選択肢はちょうど5つでなければならない。
// 4つや6つの問題が混ざると本番の練習にならないため、数までそろえて見張る。
export const REQUIRED_CHOICE_COUNT = 5;

// 日付が YYYY-MM-DD の形かどうかを調べるための型
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// http か https で始まるURLかどうかを調べるための型
const URL_PATTERN = /^https?:\/\//i;

export function validateQuestion(q) {
  const errors = [];

  // IDの確認
  if (typeof q.id !== 'string' || q.id.length === 0) {
    errors.push('id が文字列で入っていません');
  }

  // 分野の確認。決められた10種のどれかであること
  if (!VALID_CATEGORY_IDS.includes(q.category)) {
    errors.push(`category が正しくありません(${VALID_CATEGORY_IDS.join(' / ')} のいずれか)`);
  }

  // 問題文の確認
  if (typeof q.question !== 'string' || q.question.length === 0) {
    errors.push('question が文字列で入っていません');
  }

  // 選択肢の確認。ちょうど5つであること
  if (!Array.isArray(q.choices) || q.choices.length !== REQUIRED_CHOICE_COUNT) {
    errors.push(`choices はちょうど${REQUIRED_CHOICE_COUNT}個の配列である必要があります(本番は五肢択一)`);
  }

  // 同じ選択肢が2つ以上ないことの確認。
  // 同じ文が並んでいると、どちらを選んでも正解になってしまう場合がある
  if (Array.isArray(q.choices)) {
    const unique = new Set(q.choices);
    if (unique.size !== q.choices.length) {
      errors.push('同じ選択肢が2つ以上あります');
    }
  }

  // 正解番号の確認。選択肢の範囲内に収まっていること
  if (
    !Number.isInteger(q.correctIndex) ||
    !Array.isArray(q.choices) ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.choices.length
  ) {
    errors.push('correctIndex が choices の範囲内の数字ではありません');
  }

  // 解説の確認
  if (typeof q.explanation !== 'string' || q.explanation.length === 0) {
    errors.push('explanation が文字列で入っていません');
  }

  // 裏取り済みかどうかの印の確認
  if (typeof q.verified !== 'boolean') {
    errors.push('verified が true / false で入っていません');
  }

  /*
    裏が取れた(verified: true)と主張する問題には、必ず出典を付けさせる。

    なぜここまで厳しくするか:
      テキストを取り込めないため、問題の内容は公開資料に頼っている。
      「確認した」と印だけ付けて出典を書かない問題を許すと、
      後から誰も確かめられなくなり、誤った知識を覚える事故につながる。
      出典が書けないなら verified: false にして、
      画面に「テキストで要確認」と出すのが正しい扱い。
  */
  if (q.verified === true) {
    if (!q.source || typeof q.source.name !== 'string' || q.source.name.length === 0) {
      errors.push('verified が true の問題には source.name が必要です');
    }
    if (!q.source || !URL_PATTERN.test(q.source.url ?? '')) {
      errors.push('verified が true の問題には source.url(http または https)が必要です');
    }
    if (!q.source || !DATE_PATTERN.test(q.source.confirmedDate ?? '')) {
      errors.push('verified が true の問題には source.confirmedDate(YYYY-MM-DD)が必要です');
    }
  }

  return errors;
}

export function validateQuestions(questions) {
  const results = [];
  // 同じIDの問題が2つあると、解答履歴が混ざってしまうので見張る
  const seenIds = new Set();

  for (const q of questions) {
    const errors = validateQuestion(q);
    if (seenIds.has(q.id)) {
      errors.push(`id「${q.id}」が重複しています`);
    } else {
      seenIds.add(q.id);
    }
    // エラーがある問題だけを結果に加える
    if (errors.length > 0) {
      results.push({ id: q.id, errors });
    }
  }
  return results;
}
```

- [x] **Step 6: テストを実行して全部通ることを確認する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test tests/validate-questions.test.js
```

期待: PASS（14件すべて）。

- [x] **Step 7: コミット**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add data/categories.json data/questions.json js/validate-questions.js tests/validate-questions.test.js
git commit -m "feat: 出題10分野を定義し、問題データの検査を日本茶用に作り替える

本番が五肢択一なので、選択肢がちょうど5つあることを検査で強制する。
裏が取れたと印を付けた問題には出典URLと確認日を必須にした。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: 薬剤師専用の機能を削除する

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `js/storage.js`
- Modify: `js/quiz-engine.js`
- Modify: `tests/storage.test.js`
- Modify: `tests/quiz-engine.test.js`

**Interfaces:**
- Consumes: Task 2 の `data/categories.json`
- Produces:
  - `filterQuestions(questions, { categoryId })` … `difficulty` 引数を廃止
  - `js/storage.js` … 保存キー接頭辞が `teaQuiz.`、`SHARE_LEVELS` / `DEFAULT_SHARE_LEVEL` / 共有レベルの読み書きを廃止
  - `startQuiz({ categoryId })` … 分野を選んだ直後に出題を始める（難易度画面を経由しない）

- [ ] **Step 1: index.html から不要な画面を消す**

次の4つの `<section>` を丸ごと削除する。

- `<section id="difficulty-screen">`
- `<section id="profile-screen">`
- `<section id="share-ask-screen">`
- `<section id="report-screen">`

ヘッダーの `<button id="profile-chip">` も削除する（`streak-display` は残す）。
結果画面の `<button id="other-difficulty-button">別の難易度を選ぶ</button>` も削除する。

- [ ] **Step 2: index.html のタイトルと文言を変える**

- `<title>薬学実習クイズ</title>` → `<title>日本茶インストラクター試験クイズ</title>`
- `<h1>薬学実習クイズ</h1>` → `<h1>日本茶インストラクター試験</h1>`
- ホーム画面の `<h2>カテゴリーを選んでください</h2>` → `<h2>分野を選んでください</h2>`
- `<button id="weak-point-button">弱点復習モードで始める</button>` → `<button id="weak-point-button">間違えた問題だけ復習する</button>`
- 正答率画面の `<h2>カテゴリー別 正答率</h2>` → `<h2>分野別 正答率</h2>`

- [ ] **Step 3: js/app.js から不要なコードを消す**

削除する import:

```javascript
import { encodeReport, encodeSummaryReport, decodeAnyReport, parsePastedReports } from './report-code.js';
import {
  needsSending,
  deleteReport,
  lastSentKey,
  sendReport,
  fetchReports,
  TEACHER_KEY_STORAGE,
} from './report-sync.js';
```

削除する定数: `SHARE_OPTIONS`、`DIFFICULTIES`

削除する変数: `allQuestionsIncludingUnverified`、`reportEndpoint`、`selectedCategory`、`sessionUsedCategory`

削除する関数（すべて丸ごと）:
`renderQueryStep1` `onQueryStep1` `renderQueryStep2` `onQueryStep2`
`openDifficultyScreen` `renderDifficultyScreen`
`renderProfileChip` `renderProfileScreen` `onAddProfile` `openShareAskScreen`
`hideExportOutput` `buildExportText` `onExport` `onCopyExport`
`buildReportCode` `renderSendStatus` `readLastSent` `writeLastSent` `syncReport`
`renderShareOptions` `changeShareLevel`
`readTeacherKey` `writeTeacherKey` `renderReportScreen` `onLoadReports`
`onPasteReports` `onClearReports` `renderReports` `summarizeFromHistory`
`summarizeFromCounts` `renderReportSummary` `renderReportCategoryTable`
`renderReportWrongList` `buildTable` `openTeacherScreenIfRequested`

`init()` と `setupNav()` の中にある、上で消した関数への呼び出し・イベント登録もすべて削除する。

- [ ] **Step 4: renderQuestion から疑義照会の分岐を消す**

`js/app.js` の `renderQuestion()` 内、次の部分を削除する。

```javascript
  // 疑義照会の問題は「必要か不要か」を先に選ぶ2段階の形式なので、別の作り方をする
  if (question.type === 'query') {
    document.getElementById('question-text').classList.add('is-query');
    renderQueryStep1(question);
    return;
  }
  document.getElementById('question-text').classList.remove('is-query');
```

- [ ] **Step 5: 分野を選んだらすぐ出題するようにする**

`renderHome()` 内の

```javascript
    button.addEventListener('click', () => openDifficultyScreen(category));
```

を次に書き替える。

```javascript
    // 分野を選んだら、そのまま10問の出題を始める。
    // 本番の試験に難易度の区分はないため、難易度を選ぶ画面は設けていない
    button.addEventListener('click', () => startQuiz({ categoryId: category.id }));
```

`startQuiz` を次のとおり書き替える。

```javascript
function startQuiz({ categoryId } = {}) {
  const pool = filterQuestions(allQuestions, { categoryId });

  // 結果画面の見出しに出す分野名を用意しておく
  const categoryName = categories.find((c) => c.id === categoryId)?.name ?? '';

  beginSession({
    pool,
    emptyMessage: 'この分野にはまだ問題がありません。',
    starter: () => startQuiz({ categoryId }),
    label: categoryName,
  });
}
```

`beginSession` から `fromCategory` 引数と `sessionUsedCategory` の代入を削除する。

- [ ] **Step 6: showScreen から消した画面の分岐を消す**

`showScreen()` 内、次の行を削除する。

```javascript
  if (screenId === 'difficulty-screen') tabToHighlight = 'home-screen';
  if (screenId === 'profile-screen' || screenId === 'report-screen' || screenId === 'share-ask-screen') {
    tabToHighlight = null;
  }
```

```javascript
  if (screenId === 'difficulty-screen') renderDifficultyScreen();
  if (screenId === 'profile-screen') renderProfileScreen();
  if (screenId === 'report-screen') renderReportScreen();
```

- [ ] **Step 7: loadData を書き替える**

```javascript
async function loadData() {
  const [questionsRes, categoriesRes] = await Promise.all([
    fetch('data/questions.json'),
    fetch('data/categories.json'),
  ]);
  /*
    裏が取れていない問題(verified: false)も出題する。

    薬のアプリでは未確認の問題を隠していたが、この試験対策では方針が逆。
    テキストを取り込めない以上、公開資料だけでは埋まらない範囲が必ず残る。
    隠してしまうと試験範囲に穴ができるので、出題したうえで
    「テキストで要確認」の印を付け、妻が手元のテキストで照らし合わせられるようにする。
  */
  allQuestions = await questionsRes.json();
  categories = await categoriesRes.json();
}
```

- [ ] **Step 8: quiz-engine.js から難易度を消す**

`filterQuestions` を次のとおり書き替える。

```javascript
// 分野で問題を絞り込む関数。
// categoryId を省いた場合は、すべての問題を返す
export function filterQuestions(questions, { categoryId } = {}) {
  return questions.filter((q) => {
    // 分野が指定されていて、この問題が別の分野ならスキップ
    if (categoryId && q.category !== categoryId) return false;
    return true;
  });
}
```

- [ ] **Step 9: storage.js の保存キーと共有機能を直す**

- `PROFILES_KEY` `CURRENT_PROFILE_KEY` `HISTORY_KEY` `BOOKMARK_KEY` `STREAK_KEY` の文字列を `pharmacyQuiz.` から `teaQuiz.` に変える
- `SHARE_KEY` と `LAST_SENT_KEY` の定数を削除する
- `SHARE_LEVELS` と `DEFAULT_SHARE_LEVEL` の export を削除する
- 共有レベルを読み書きするメソッド（`getShareLevel` `setShareLevel` など）を削除する
- `DEFAULT_PROFILE_NAME` を `'利用者1'` から `'わたし'` に変える
- ファイル冒頭のコメントに次を追記する

```javascript
// 【利用者について】
// このアプリを使うのは1人だけなので、利用者を切り替える画面は設けていない。
// ただし保存の仕組み自体は利用者ごとに分ける作りのまま残してある。
// ここを書き替えると、すでに保存されている学習記録の置き場所が変わり、
// 記録が消えたように見える事故が起きるため、あえて触らない。
```

- [ ] **Step 10: 消した機能のテストを外す**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
grep -n "share\|Share\|difficulty\|pharmacyQuiz" tests/storage.test.js tests/quiz-engine.test.js
```

ヒットしたテストを削除するか、`teaQuiz.` / 難易度なしの形に直す。

- [ ] **Step 11: テストを実行して全部通ることを確認する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test
```

期待: PASS。

- [ ] **Step 12: 残骸が無いか確認する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
grep -rn "report\|difficulty\|profile-screen\|share\|pharmacyQuiz\|疑義照会\|PMDA" --include="*.js" --include="*.html" . | grep -v node_modules
```

期待: 何もヒットしない（`storage.js` の profile 関連のコメントと関数名だけは残ってよい）。

- [ ] **Step 13: コミット**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add -A
git commit -m "refactor: 薬剤師専用の機能を削除する

先生への成績共有、先生用の集計画面、利用者の切り替え画面、
疑義照会の2段階出題、難易度の区分を削除した。
保存キーの接頭辞を teaQuiz. に変更。

利用者を分ける仕組みは storage.js の内部にそのまま残した。
書き替えると保存済みの学習記録の置き場所が変わり、
記録が消えたように見える事故が起きるため。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: 「※テキストで要確認」バッジ

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`（`renderQuestion` と `finishAnswer`）
- Modify: `css/style.css`

**Interfaces:**
- Consumes: Task 3 の `loadData()`（全問を `allQuestions` に入れる）
- Produces: 画面上の要素 `#verify-badge`。`verified !== true` の問題を表示中のみ見える

- [ ] **Step 1: index.html にバッジの置き場所を足す**

`<section id="quiz-screen">` の中、`<h2 id="question-text"></h2>` の**直前**に挿入する。

```html
      <!-- 公開資料で裏が取れなかった問題に出す注意書き。
           手元のテキストで照らし合わせてもらうためのもの -->
      <p id="verify-badge" class="verify-badge" hidden>※ テキストで要確認</p>
```

- [ ] **Step 2: renderQuestion でバッジの出し入れをする**

`renderQuestion()` 内、`document.getElementById('question-text').textContent = question.question;` の**直後**に挿入する。

```javascript
  /*
    公開資料で裏が取れなかった問題には注意書きを出す。

    テキストを取り込めないため、どうしても公開資料だけでは
    確かめきれない論点が残る。それを隠して出題すると、
    間違った内容をそのまま覚えてしまう恐れがある。
    「ここは自分のテキストで確かめてね」と伝えるための印。
  */
  document.getElementById('verify-badge').hidden = question.verified === true;
```

- [ ] **Step 3: finishAnswer の出典表示を書き替える**

`finishAnswer()` 内の出典表示部分を次のとおり置き換える。

```javascript
  // 出典を表示する。URLがある場合はクリックできるリンクにする
  const sourceContainer = document.getElementById('feedback-source');
  sourceContainer.textContent = ''; // 前の問題の表示をクリアする

  if (question.verified !== true) {
    // 裏が取れていない問題は、出典の代わりに確認のお願いを出す
    sourceContainer.textContent =
      '※ この問題は公開資料で裏付けが取れていません。手元のテキストで確かめてください。';
  } else {
    const sourceName = question.source?.name ?? '不明';
    const sourceUrl = question.source?.url ?? '';
    // http/httpsのURLだけをリンクにする(他の形式のURLが紛れ込んでも実行されないようにするため)
    const isSafeUrl = /^https?:\/\//i.test(sourceUrl);

    sourceContainer.append(`出典: ${sourceName}`);
    if (isSafeUrl) {
      sourceContainer.append('(');
      const link = document.createElement('a');
      link.href = sourceUrl;
      link.textContent = sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      sourceContainer.append(link);
      sourceContainer.append(')');
    }
  }
```

- [ ] **Step 4: css/style.css にバッジの見た目を足す**

ファイル末尾に追記する。

```css
/* 公開資料で裏が取れていない問題に出す注意書き。
   目には入るが、問題文より目立たない濃さにしている */
.verify-badge {
  display: inline-block;
  margin: 0 0 8px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--cat-default);
  background: transparent;
  color: var(--cat-default);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 5: ブラウザで動きを確かめる**

`data/questions.json` に確認用として次の2問だけを入れる。

```json
[
  {
    "id": "history-001",
    "category": "history",
    "question": "確認用(裏取り済み)。この問題にはバッジが出ないこと。",
    "choices": ["あ", "い", "う", "え", "お"],
    "correctIndex": 0,
    "explanation": "確認用",
    "source": { "name": "確認用", "url": "https://example.com", "confirmedDate": "2026-09-13" },
    "verified": true
  },
  {
    "id": "history-002",
    "category": "history",
    "question": "確認用(裏取りなし)。この問題にはバッジが出ること。",
    "choices": ["あ", "い", "う", "え", "お"],
    "correctIndex": 1,
    "explanation": "確認用",
    "verified": false
  }
]
```

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
npm start
```

ブラウザで開き、「茶の歴史」を選んで2問とも表示する。
期待: 1問目にはバッジが出ず、2問目には「※ テキストで要確認」が出る。2問目の解説欄に「公開資料で裏付けが取れていません」と出る。

- [ ] **Step 6: 確認用の問題を消して空に戻す**

`data/questions.json` を `[]` に戻す。

- [ ] **Step 7: テストを実行する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test
```

期待: PASS。

- [ ] **Step 8: コミット**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add -A
git commit -m "feat: 裏付けの取れていない問題に「テキストで要確認」の印を出す

テキストを取り込めないため、公開資料だけでは確かめきれない論点が残る。
隠して出題すると間違った内容を覚えてしまうので、出題したうえで
印を付け、手元のテキストで照らし合わせてもらう。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: 模試モード

**Files:**
- Create: `js/mock-exam.js`
- Create: `tests/mock-exam.test.js`
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `css/style.css`

**Interfaces:**
- Consumes: `filterQuestions` / `pickRandomQuestions`（quiz-engine.js）、`applyCategoryColor` と `categories`（app.js）
- Produces:
  - `MOCK_EXAM_QUESTION_COUNT: number` = 50
  - `MOCK_EXAM_LIMIT_SECONDS: number` = 4500
  - `remainingSeconds(startedAtMs: number, nowMs: number, limitSeconds?: number): number`
  - `formatRemaining(seconds: number): string` … `"MM:SS"` 形式
  - `gradeMockExam(questions, resultsById: Map<string, boolean>, categories): { total, correct, accuracyPercent, byCategory: {categoryId, categoryName, total, correct, accuracyPercent}[] }`

- [ ] **Step 1: 失敗するテストを書く**

`tests/mock-exam.test.js` を新規作成する。

```javascript
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

test('模試は50問・75分', () => {
  assert.equal(MOCK_EXAM_QUESTION_COUNT, 50);
  assert.equal(MOCK_EXAM_LIMIT_SECONDS, 75 * 60);
});

test('始めた直後の残り時間は制限時間そのもの', () => {
  assert.equal(remainingSeconds(1000, 1000), 4500);
});

test('1分たつと残り時間が60秒減る', () => {
  assert.equal(remainingSeconds(0, 60 * 1000), 4500 - 60);
});

test('制限時間を過ぎても残り時間はマイナスにならない', () => {
  assert.equal(remainingSeconds(0, 99999 * 1000), 0);
});

test('残り時間はMM:SSの形で表示される', () => {
  assert.equal(formatRemaining(4500), '75:00');
  assert.equal(formatRemaining(65), '01:05');
  assert.equal(formatRemaining(0), '00:00');
});

test('残り時間がマイナスでも00:00と表示される', () => {
  assert.equal(formatRemaining(-30), '00:00');
});

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
  // 4問中1問しか答えていない。残り3問は時間切れなどで未回答
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
  assert.equal(history.accuracyPercent, 50);
  assert.equal(history.categoryName, '茶の歴史');
  assert.equal(chemistry.accuracyPercent, 100);
});

test('出題されなかった分野は一覧に出さない', () => {
  const graded = gradeMockExam(questions, new Map(), categories);
  assert.equal(graded.byCategory.some((r) => r.categoryId === 'brewing'), false);
});

test('問題が0問でも落ちない', () => {
  const graded = gradeMockExam([], new Map(), categories);
  assert.equal(graded.total, 0);
  assert.equal(graded.accuracyPercent, 0);
  assert.deepEqual(graded.byCategory, []);
});
```

- [ ] **Step 2: テストを実行して失敗することを確認する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test tests/mock-exam.test.js
```

期待: FAIL。`js/mock-exam.js` が存在しないためモジュールが読めない。

- [ ] **Step 3: js/mock-exam.js を作る**

```javascript
// 模試モードの計算だけを行う部品です。
// 画面の見た目には一切関わりません。そのぶんテストで確かめやすくしてあります。

/*
  1回の模試で出す問題数と、制限時間。

  本番の第一次試験の出題数は、協会の受験要項に書かれておらず公開されていない。
  そこで「もし本番が100問150分だったら」と同じペース配分(1問あたり90秒)になる
  50問75分を既定とした。問題が十分たまったら100問版を足してもよい。
*/
export const MOCK_EXAM_QUESTION_COUNT = 50;
export const MOCK_EXAM_LIMIT_SECONDS = 75 * 60;

// 始めた時刻と今の時刻から、残り何秒かを求める。
// 時計は端末のものを使うので、ミリ秒をもらって秒に直している
export function remainingSeconds(startedAtMs, nowMs, limitSeconds = MOCK_EXAM_LIMIT_SECONDS) {
  const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);
  // 時間切れのあとにマイナスの数字が出ないよう、0で止める
  return Math.max(0, limitSeconds - elapsedSeconds);
}

// 残り秒数を「75:00」のような見やすい形にする
export function formatRemaining(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const rest = String(safe % 60).padStart(2, '0');
  return `${minutes}:${rest}`;
}

/*
  模試の答案を採点する。

  resultsById は「問題のID → 正解だったか(true/false)」の対応表。
  表に載っていない問題は、時間切れなどで答えなかったものなので不正解として数える。
  本番のマークシートも、空欄は当然点にならないため、それに合わせている。
*/
export function gradeMockExam(questions, resultsById, categories) {
  let correct = 0;
  for (const q of questions) {
    if (resultsById.get(q.id) === true) correct += 1;
  }

  // 分野ごとの成績。今回出題されなかった分野は一覧に出さない
  const byCategory = categories
    .map((category) => {
      const inCategory = questions.filter((q) => q.category === category.id);
      const categoryCorrect = inCategory.filter((q) => resultsById.get(q.id) === true).length;
      return {
        categoryId: category.id,
        categoryName: category.name,
        total: inCategory.length,
        correct: categoryCorrect,
        accuracyPercent:
          inCategory.length === 0 ? 0 : Math.round((categoryCorrect / inCategory.length) * 100),
      };
    })
    .filter((row) => row.total > 0);

  return {
    total: questions.length,
    correct,
    accuracyPercent: questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100),
    byCategory,
  };
}
```

- [ ] **Step 4: テストを実行して全部通ることを確認する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test tests/mock-exam.test.js
```

期待: PASS（12件すべて）。

- [ ] **Step 5: コミット（計算部分だけ先に入れる）**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add js/mock-exam.js tests/mock-exam.test.js
git commit -m "feat: 模試モードの計算部分(残り時間と採点)を追加

本番の出題数は公式非公開のため、100問150分と同じペース配分になる
50問75分を既定とした。未回答は本番のマークシートと同じく不正解として数える。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: index.html に模試のボタンと画面を足す**

ホーム画面の `weak-point-button` の**直後**に追加する。

```html
      <!-- 本番と同じように、時間を計って通しで解くモード -->
      <button id="mock-exam-button">本番形式の模試に挑戦する（50問・75分）</button>
```

クイズ画面の `<div class="quiz-topbar">` の中、`<p id="quiz-progress"></p>` の直後に追加する。

```html
        <!-- 模試のときだけ出る残り時間。ふだんの出題では隠しておく -->
        <p id="mock-timer" class="mock-timer" hidden></p>
```

`<section id="result-screen">` の `<h3 class="section-title" id="result-review-title">` の**直前**に追加する。

```html
      <!-- 模試のときだけ出る、分野別の成績表 -->
      <div id="mock-category-result" hidden>
        <h3 class="section-title">分野別の成績</h3>
        <div id="mock-category-list"></div>
      </div>
```

- [ ] **Step 7: js/app.js に模試モードをつなぎ込む**

import に追加する。

```javascript
import {
  MOCK_EXAM_QUESTION_COUNT,
  remainingSeconds,
  formatRemaining,
  gradeMockExam,
} from './mock-exam.js';
```

変数を追加する（他の `let` 宣言の並びに置く）。

```javascript
// 今が模試モードかどうか。模試のときは途中で正誤や解説を出さない
let isMockExam = false;
// 模試を始めた時刻(ミリ秒)。残り時間の計算に使う
let mockStartedAtMs = 0;
// 1秒ごとに残り時間を書き替えるためのタイマーの番号。止めるときに使う
let mockTimerId = null;
```

模試を始める関数を追加する。

```javascript
/*
  模試モードを始める。

  ふだんの出題との違いは3つ。
    1. 分野を選ばず、全分野からまとめて出す
    2. 1問ごとの正誤と解説を出さない(本番と同じ)
    3. 残り時間を表示し、0になったら自動で採点する
*/
function startMockExam() {
  const pool = filterQuestions(allQuestions, {});
  if (pool.length === 0) {
    // 問題が1問も無いときは、始めずに案内だけ出す
    isMockExam = false;
    beginSession({
      pool: [],
      emptyMessage: 'まだ問題がありません。',
      starter: startMockExam,
      label: '模試',
    });
    return;
  }

  isMockExam = true;
  currentSession = pickRandomQuestions(pool, MOCK_EXAM_QUESTION_COUNT);
  currentIndex = 0;
  sessionCorrectCount = 0;
  answeredInSession = new Map();
  emptySessionMessage = 'まだ問題がありません。';
  lastQuizStarter = startMockExam;
  sessionLabel = `模試（${currentSession.length}問）`;

  mockStartedAtMs = Date.now();
  startMockTimer();
  showScreen('quiz-screen');
}

// 1秒ごとに残り時間を書き替える。0になったら自動で結果画面へ進む
function startMockTimer() {
  const timer = document.getElementById('mock-timer');
  timer.hidden = false;

  function tick() {
    const left = remainingSeconds(mockStartedAtMs, Date.now());
    timer.textContent = `残り ${formatRemaining(left)}`;
    // 残り5分を切ったら色を変えて知らせる
    timer.classList.toggle('is-urgent', left <= 5 * 60);
    if (left <= 0) {
      stopMockTimer();
      showScreen('result-screen');
    }
  }

  tick(); // すぐ1回表示してから、以降は1秒ごと
  mockTimerId = setInterval(tick, 1000);
}

// タイマーを止めて、残り時間の表示を隠す
function stopMockTimer() {
  if (mockTimerId !== null) {
    clearInterval(mockTimerId);
    mockTimerId = null;
  }
  const timer = document.getElementById('mock-timer');
  timer.hidden = true;
  timer.classList.remove('is-urgent');
}

// 模試を途中でやめる。別の画面へ移るときに呼ぶ
function endMockExam() {
  isMockExam = false;
  stopMockTimer();
}
```

`finishAnswer` の中、成績を記録したあと・解説パネルを出す処理の**直前**に追加する。

```javascript
  // 模試のときは、1問ごとの正誤も解説も出さずに次へ進む(本番と同じ形)
  if (isMockExam) {
    onNextQuestion();
    return;
  }
```

`onNextQuestion` を次のとおり書き替える。

```javascript
function onNextQuestion() {
  currentIndex += 1;
  // 最後の問題まで解き終えたら、1問目に戻さず結果画面を出す
  if (currentIndex >= currentSession.length) {
    if (isMockExam) stopMockTimer();
    showScreen('result-screen');
    return;
  }
  renderQuestion();
}
```

`renderResult` の末尾に追加する。

```javascript
  // 模試のときだけ、分野別の成績表を出す。
  // どの分野に穴があるかが一目で分かるようにするため
  const mockResult = document.getElementById('mock-category-result');
  if (isMockExam) {
    const graded = gradeMockExam(currentSession, answeredInSession, categories);
    const list = document.getElementById('mock-category-list');
    list.innerHTML = '';
    graded.byCategory.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'stats-item';
      applyCategoryColor(item, row.categoryId);
      const name = document.createElement('span');
      name.textContent = row.categoryName;
      const score = document.createElement('span');
      score.textContent = `${row.correct} / ${row.total}問　${row.accuracyPercent}%`;
      item.append(name, score);
      list.appendChild(item);
    });
    mockResult.hidden = false;
  } else {
    mockResult.hidden = true;
  }
```

`setupNav()` の中、ナビゲーションのボタンが押されたときの処理の先頭で `endMockExam()` を呼ぶ。
`back-home-button` のイベント処理でも `endMockExam()` を呼ぶ。

`init()` の中で模試ボタンをつなぐ。

```javascript
  document.getElementById('mock-exam-button').addEventListener('click', startMockExam);
```

- [ ] **Step 8: css/style.css に残り時間の見た目を足す**

ファイル末尾に追記する。

```css
/* 模試の残り時間。ふだんの出題では隠している */
.mock-timer {
  margin: 0;
  font-variant-numeric: tabular-nums; /* 数字の幅をそろえて、1秒ごとにガタつかせない */
  font-weight: 700;
  color: var(--cat-default);
}

/* 残り5分を切ったら赤くして知らせる */
.mock-timer.is-urgent {
  color: #C1544C;
}
```

- [ ] **Step 9: ブラウザで模試の動きを確かめる**

`data/questions.json` に確認用の問題を3問入れる（分野を2種類にする）。

```json
[
  { "id": "history-001", "category": "history", "question": "確認用1", "choices": ["あ","い","う","え","お"], "correctIndex": 0, "explanation": "確認用", "verified": false },
  { "id": "history-002", "category": "history", "question": "確認用2", "choices": ["あ","い","う","え","お"], "correctIndex": 1, "explanation": "確認用", "verified": false },
  { "id": "chemistry-001", "category": "chemistry", "question": "確認用3", "choices": ["あ","い","う","え","お"], "correctIndex": 2, "explanation": "確認用", "verified": false }
]
```

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
npm start
```

確かめること:

1. 「本番形式の模試に挑戦する」を押すと、残り時間が「残り 75:00」と出て1秒ずつ減る
2. 選択肢を押しても正誤・解説が出ず、すぐ次の問題に進む
3. 3問解き終わると結果画面に進み、「分野別の成績」に茶の歴史と茶の化学が出る
4. ホームに戻ると残り時間の表示が消える
5. ふだんの出題（分野を選ぶ）では残り時間が出ず、正誤と解説がちゃんと出る

- [ ] **Step 10: 確認用の問題を消して空に戻す**

`data/questions.json` を `[]` に戻す。

- [ ] **Step 11: テストを実行する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test
```

期待: PASS。

- [ ] **Step 12: コミット**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add -A
git commit -m "feat: 模試モードを画面につなぎ込む

全分野から50問を出し、75分を計る。本番と同じく途中で正誤も解説も出さず、
終わってからまとめて採点して分野別の成績を表示する。
残り5分を切るとタイマーが赤くなる。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: 日本茶らしい見た目とPWAの設定

**Files:**
- Modify: `css/style.css`
- Modify: `manifest.json`
- Modify: `index.html`（theme-color のみ）
- Modify: `service-worker.js`
- Modify: `icons/icon.svg`

**Interfaces:**
- Consumes: Task 2 の分野ID10種
- Produces: `--cat-history` 〜 `--cat-inspection` の10色（明るい画面用・暗い画面用の両方）

- [ ] **Step 1: css/style.css の分野色を差し替える**

`:root` の中にある `--cat-cancer` から `--cat-prescription-query` までの12行を、次の10行に置き換える。日本の伝統色から、茶に縁のある色を選んでいる。

```css
  --cat-history: #8D6449;        /* 煎茶(せんちゃ) 歴史なので落ち着いた茶 */
  --cat-industry: #4A5A7B;       /* 鉄紺(てつこん) 統計・産業なので硬い青 */
  --cat-teaching: #C05780;       /* 桃(もも) 人に伝える分野なので明るい色 */
  --cat-cultivation: #5A8F3C;    /* 若草(わかくさ) 畑の緑 */
  --cat-manufacturing: #B8821F;  /* 山吹(やまぶき) 火入れの色 */
  --cat-health: #C1544C;         /* 紅(くれない) からだの分野 */
  --cat-chemistry: #2B7FA8;      /* 縹(はなだ) 理科系の青 */
  --cat-brewing: #1F8A70;        /* 常磐緑(ときわみどり) 湯呑みの中の色 */
  --cat-utilization: #7B62A8;    /* 藤紫(ふじむらさき) 食べる茶・加工品 */
  --cat-inspection: #96344B;     /* 臙脂(えんじ) 審査・鑑定の厳しさ */
  --cat-default: var(--green-500); /* 万一分野が増えたときの予備 */
```

- [ ] **Step 2: 暗い画面用の色も差し替える**

`@media (prefers-color-scheme: dark)` の中にある `--cat-cancer` 〜 `--cat-prescription-query` の12行を、次の10行に置き換える。暗い背景でも読めるよう、明るめにしてある。

```css
    --cat-history: #BE9376;
    --cat-industry: #8C9BBD;
    --cat-teaching: #E58AAD;
    --cat-cultivation: #8FC26F;
    --cat-manufacturing: #DDAB4B;
    --cat-health: #E9857D;
    --cat-chemistry: #62B4D8;
    --cat-brewing: #4FBFA3;
    --cat-utilization: #A991D8;
    --cat-inspection: #E08D9F;
```

- [ ] **Step 3: manifest.json を書き替える**

```json
{
  "name": "日本茶インストラクター試験クイズ",
  "short_name": "日本茶クイズ",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#F7F4ED",
  "theme_color": "#1F8A70",
  "icons": [
    { "src": "icons/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 4: index.html の theme-color をそろえる**

`<meta name="theme-color" content="#1B2A4A">` を `<meta name="theme-color" content="#1F8A70">` に変える。

- [ ] **Step 5: service-worker.js を書き替える**

先頭の定数を次に置き換える。

```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAME = `tea-quiz-${CACHE_VERSION}`;

const APP_SHELL_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/quiz-engine.js',
  './js/storage.js',
  './js/stats.js',
  './js/mock-exam.js',
  './data/questions.json',
  './data/categories.json',
  './manifest.json',
  './icons/icon.svg',
];
```

`activate` の中、古いキャッシュを消す条件も直す。

```javascript
          .filter((key) => key.startsWith('tea-quiz-') && key !== CACHE_NAME)
```

- [ ] **Step 6: アイコンを日本茶らしくする**

`icons/icon.svg` を、湯呑みから湯気が立つ図柄に差し替える。
背景は `#1F8A70` の角丸四角、図柄は白（`#FFFFFF`）の線。
ホーム画面に小さく並んだときに何のアプリか分かればよいので、複雑な絵にしない。

- [ ] **Step 7: ブラウザで見た目を確かめる**

`data/questions.json` に、10分野すべてに1問ずつ入れた確認用データを用意する。
各問は `"question": "確認用"`、`"choices": ["あ","い","う","え","お"]`、`"correctIndex": 0`、
`"explanation": "確認用"`、`"verified": false` とし、`id` は `<分野ID>-001`、`category` は各分野IDにする。

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
npm start
```

期待: ホーム画面に10分野が並び、それぞれ別の色の印が付く。端末を暗い表示に切り替えても文字が読める。

- [ ] **Step 8: 確認用の問題を消して空に戻す**

`data/questions.json` を `[]` に戻す。

- [ ] **Step 9: テストを実行する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test
```

期待: PASS。

- [ ] **Step 10: コミット**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add -A
git commit -m "feat: 見た目を日本茶用にして、PWAの設定を更新する

10分野それぞれに日本の伝統色を割り当て、暗い表示でも読める色も用意した。
オフライン用のファイル一覧から report 関連を外し、mock-exam.js を加えた。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: 問題データ 第1弾（歴史・茶業・伝え方・栽培・製造）225問

**Files:**
- Modify: `data/questions.json`

**Interfaces:**
- Consumes: Task 2 の `validateQuestions` と `data/categories.json`
- Produces: `data/questions.json` に225問。ID は `history-001` 〜 `history-055`、`industry-001` 〜 `industry-050`、`teaching-001` 〜 `teaching-020`、`cultivation-001` 〜 `cultivation-045`、`manufacturing-001` 〜 `manufacturing-055`

**この分の目標問数**

| 分野 | ID接頭辞 | 問数 |
|---|---|---|
| 茶の歴史 | `history` | 55 |
| 茶業のあらまし | `industry` | 50 |
| 伝え方の基本 | `teaching` | 20 |
| 茶の栽培 | `cultivation` | 45 |
| 茶の製造法 | `manufacturing` | 55 |
| 合計 | | **225** |

- [ ] **Step 1: 分野ごとに公開資料を実際に読む**

**記憶だけで数値を書かない。** 分野に取りかかる前に、必ず次を行う。

1. WebSearch でその分野の公開資料を探す（**URLを推測で書かない。検索して実在を確かめる**）
2. WebFetch で**実際に開いて読む**
3. 読んだ資料の正式名称・URL・読んだ日（`2026-09-13` など）を控える

分野ごとに当たる先:

| 分野 | 当たる先 |
|---|---|
| 茶の歴史 | 日本茶インストラクター協会「日本茶基礎知識」https://www.nihoncha-inst.com/basic/basic6.html ／ 各地の茶業組合・茶の博物館が公開している年表 ／ 静岡県・京都府の茶業関連ページ |
| 茶業のあらまし | 農林水産省「茶をめぐる情勢」（最新版を検索して取得）／ 農林水産省 作物統計 ／ 日本茶業中央会 ／ FAO の世界の茶統計 |
| 伝え方の基本 | 公開資料が薄い分野。無理に作らず、**`verified: false` が多くなってよい**。協会サイトのインストラクター活動紹介ページを読む |
| 茶の栽培 | 農研機構（果樹茶業研究部門）／ 静岡県茶業研究センター ／ 鹿児島県・京都府の茶業試験研究機関 ／ 農林水産省の病害虫・農薬関連ページ |
| 茶の製造法 | 農研機構の製茶技術資料 ／ 各県茶業研究所の製茶工程解説 ／ 日本茶業中央会 |

- [ ] **Step 2: 1分野ずつ作問して追記する**

問題の書き方の決まり:

- `choices` は**ちょうど5つ**。正解1つ＋もっともらしい誤り4つ
- 誤りの選択肢は「明らかに違う」ものばかりにしない。同じ種類・同じ桁の言葉を並べる（例: 年号を問うなら他も年号、温度を問うなら他も温度）
- `correctIndex` は **0〜4 にばらつかせる**（アプリ側で毎回並び替えるが、データ自体も偏らせない）
- `explanation` には、正解の理由に加えて、間違えやすい選択肢がなぜ違うかを一言添える
- 資料で確かめた問題 … `verified: true` ＋ `source`（読んだ資料の名称・URL・読んだ日）
- 確かめきれなかった問題 … `verified: false`、`source` は書かない

1問の形（Task 2 の検査に通る形）:

```json
{
  "id": "history-001",
  "category": "history",
  "question": "問題文",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4", "選択肢5"],
  "correctIndex": 2,
  "explanation": "正解の理由。あわせて紛らわしい選択肢がなぜ違うかも書く。",
  "source": {
    "name": "資料の正式名称・該当箇所",
    "url": "https://...",
    "confirmedDate": "2026-09-13"
  },
  "verified": true
}
```

- [ ] **Step 3: 1分野書き終えるたびに検査にかける**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test tests/validate-questions.test.js
```

期待: PASS。エラーが出たら、どの問題のどこが悪いか表示されるので直す。

- [ ] **Step 4: 問数と裏取り率を数える**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --input-type=module -e "
import fs from 'fs';
const qs = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));
const byCat = {};
for (const q of qs) {
  byCat[q.category] ??= { total: 0, verified: 0 };
  byCat[q.category].total += 1;
  if (q.verified) byCat[q.category].verified += 1;
}
console.table(byCat);
console.log('合計', qs.length, '問 / 裏取り済み', qs.filter(q => q.verified).length, '問');
"
```

期待: 5分野の合計が225問。

- [ ] **Step 5: 正解番号が偏っていないか確かめる**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --input-type=module -e "
import fs from 'fs';
const qs = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));
const counts = [0,0,0,0,0];
for (const q of qs) counts[q.correctIndex] += 1;
console.log('正解番号の分布:', counts);
"
```

期待: 5つの数字がおおむね均等。どれか1つが全体の4割を超えていたら作り直す。

- [ ] **Step 6: コミット**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add data/questions.json
git commit -m "feat: 問題データ第1弾(歴史・茶業・伝え方・栽培・製造)225問を追加

各分野について公開資料に実際にあたってから作問した。
資料で確かめられた問題には出典URLと確認日を付け、
確かめきれなかった問題は verified: false として
画面に「テキストで要確認」と出す。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: 問題データ 第2弾（健康科学・化学・淹れ方・利用・品質審査）175問

**Files:**
- Modify: `data/questions.json`

**Interfaces:**
- Consumes: Task 7 と同じ
- Produces: `data/questions.json` を合計400問にする。ID は `health-001` 〜 `health-040`、`chemistry-001` 〜 `chemistry-040`、`brewing-001` 〜 `brewing-035`、`utilization-001` 〜 `utilization-025`、`inspection-001` 〜 `inspection-035`

**この分の目標問数**

| 分野 | ID接頭辞 | 問数 |
|---|---|---|
| 茶の健康科学 | `health` | 40 |
| 茶の化学 | `chemistry` | 40 |
| 茶の淹れ方 | `brewing` | 35 |
| 茶の利用 | `utilization` | 25 |
| 茶の品質審査と鑑定 | `inspection` | 35 |
| 合計 | | **175** |

- [ ] **Step 1: 分野ごとに公開資料を実際に読む**

Task 7 の Step 1 と同じ手順。**URLを推測で書かず、検索して実在を確かめてから開く。**

| 分野 | 当たる先 |
|---|---|
| 茶の健康科学 | 農研機構の茶の機能性研究 ／ 日本茶業中央会「お茶と健康」関連資料 ／ 消費者庁の機能性表示食品データベース（茶関連の届出）／ 日本茶業学会 |
| 茶の化学 | 農研機構の茶成分分析資料 ／ 文部科学省「日本食品標準成分表」の茶類の項 ／ 各県茶業研究所の成分分析資料 |
| 茶の淹れ方 | 日本茶インストラクター協会の淹れ方紹介ページ ／ 農研機構・各県茶業研究所の抽出条件に関する資料 |
| 茶の利用 | 農林水産省の茶の需要動向資料 ／ 日本茶業中央会 ／ 抹茶の食品利用に関する公開資料 |
| 茶の品質審査と鑑定 | 日本茶業中央会の審査基準 ／ 全国茶品評会の審査要領 ／ 農研機構の官能評価資料 |

- [ ] **Step 2: 1分野ずつ作問して追記する**

Task 7 の Step 2 と同じ決まりに従う。**次の分野は数値の取り違えが起きやすいので特に慎重に扱う。**

- 茶の化学 … カテキン類・カフェイン・テアニンの含有率
- 茶の淹れ方 … 茶種ごとの湯温・浸出時間・湯量
- 茶の品質審査と鑑定 … 審査盆・審査茶碗の規格、使用する茶の量と湯量

これらは**記憶で書かず、必ず読んだ資料の数値を使う**。資料が見つからなければ `verified: false` にする。

- [ ] **Step 3: 1分野書き終えるたびに検査にかける**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test tests/validate-questions.test.js
```

期待: PASS。

- [ ] **Step 4: 全体の問数と裏取り率を数える**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --input-type=module -e "
import fs from 'fs';
const qs = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'));
const byCat = {};
for (const q of qs) {
  byCat[q.category] ??= { total: 0, verified: 0 };
  byCat[q.category].total += 1;
  if (q.verified) byCat[q.category].verified += 1;
}
console.table(byCat);
console.log('合計', qs.length, '問 / 裏取り済み', qs.filter(q => q.verified).length, '問');
"
```

期待: 10分野すべてが埋まり、合計400問。

- [ ] **Step 5: 正解番号の偏りを確かめる**

Task 7 の Step 5 と同じコマンドを実行する。期待も同じ。

- [ ] **Step 6: コミット**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add data/questions.json
git commit -m "feat: 問題データ第2弾(健康科学・化学・淹れ方・利用・品質審査)175問を追加

これで10分野すべてが埋まり、合計400問になった。
含有率・湯温・浸出時間・審査用具の規格は取り違えが起きやすいため、
読んだ資料の数値だけを使い、資料が無いものは verified: false とした。

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: スマホでの動作確認と公開

**Files:**
- Create: `README.md`
- Modify: `service-worker.js`（キャッシュ版番号を上げる）

**Interfaces:**
- Consumes: Task 1〜8 のすべて
- Produces: GitHub Pages の公開URL

- [ ] **Step 1: 全テストを実行する**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
node --test
```

期待: PASS（全ファイル）。

- [ ] **Step 2: PCのブラウザで一通り触る**

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
npm start
```

確かめること:

1. ホームに10分野が並び、それぞれ「全◯問」が正しい数になっている
2. 分野を選ぶと10問出る。選択肢は5つある
3. 同じ問題を2回出すと、選択肢の並びが変わっている
4. 正解・不正解のあとに解説と出典が出る。出典URLが押せる
5. `verified: false` の問題に「※ テキストで要確認」が出る
6. わざと間違えてから「間違えた問題だけ復習する」を押すと、その問題が出る
7. 模試を始めると残り時間が減り、途中で解説が出ず、終わると分野別の成績が出る
8. 「正答率」画面に10分野の正答率が出る
9. ブックマークが付け外しできる

- [ ] **Step 3: README.md を書く**

次の内容を含める。

- このアプリが何か（日本茶インストラクター第一次試験の対策）
- 試験日（2026年11月8日）と出題形式（マークシートによる五肢択一）
- 使い方（スマホのブラウザで開く、ホーム画面に追加する）
- 問題データの追加のしかた（`data/questions.json` に追記して `node --test` で検査）
- 「※ テキストで要確認」バッジの意味
- 設計書と実装計画へのリンク

- [ ] **Step 4: キャッシュの版番号を上げる**

`service-worker.js` の `CACHE_VERSION` を `'v1'` から `'v2'` に上げる。
問題データを入れたあとなので、古い空のデータが端末に残らないようにする。

- [ ] **Step 5: コミットして GitHub に上げる**

**注意: ここから先はユーザーの確認を取ってから実行する。** リポジトリを作って公開する操作なので、勝手に進めない。

```bash
cd "/c/Users/kokky/OneDrive/デスクトップ/.claude/japanese tea"
git add -A
git commit -m "docs: READMEを追加し、キャッシュの版番号を上げる

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
gh repo create japanese-tea-quiz --private --source=. --push
```

- [ ] **Step 6: GitHub Pages を有効にする**

リポジトリの Settings → Pages で、Source を `Deploy from a branch`、Branch を `main` / `/ (root)` にする。
`.nojekyll` を置いてあるのでビルド工程は不要。

- [ ] **Step 7: スマホの実機で確かめる**

公開URLをスマホで開き、次を確かめる。

1. 画面が縦に収まっていて、横スクロールが出ない
2. 選択肢のボタンが指で押しやすい大きさになっている
3. ブラウザのメニューから「ホーム画面に追加」ができる
4. 機内モードにしても、ホーム画面のアイコンから開いて問題が解ける

- [ ] **Step 8: URLを妻に渡す**

---

## Self-Review

**1. 設計書の網羅性チェック**

| 設計書の項目 | 対応タスク |
|---|---|
| 2. 出題10分野 | Task 2（categories.json / VALID_CATEGORY_IDS） |
| 3. 品質方針（資料を読んでから作問） | Task 7 Step 1・Task 8 Step 1 |
| 3. verified: false は除外せず印を付ける | Task 3 Step 7（loadData）・Task 4 |
| 3.5 作問数の配分 | Task 7・Task 8 の表 |
| 4.3 コピーする／捨てる | Task 1 |
| 4.4 消す機能（利用者・共有・疑義照会・難易度） | Task 3 |
| 4.4 storage の保存構造は温存 | Task 3 Step 9 |
| 4.5 残す機能 | Task 3 で消さずに残す＋Task 9 Step 2 で確認 |
| 4.6 A 模試モード | Task 5 |
| 4.6 B 要確認バッジ | Task 4 |
| 4.7 通常は10問 | 既存の `QUESTIONS_PER_SESSION = 10` を変更しない（Task 3 で触らない） |
| 5. 問題データの形 | Task 2 Step 5・Task 7 Step 2 |
| 6. 自動チェック7項目 | Task 2 Step 1・Step 5 |
| 7. 日程 | Task 1〜6（1日目）／Task 7〜9（2日目） |
| 8. 公開方法 | Task 9 |

漏れなし。

**2. placeholder チェック**

「TBD」「後で」「適切に」「同様に」の類なし。すべての手順に実際のコードまたは実行コマンドを書いた。
Task 6 Step 6（アイコン）のみ図柄の指定が言葉によるが、これは絵であり、背景色・図柄・色を指定済みなので実行可能と判断する。

**3. 名前の一致チェック**

- `VALID_CATEGORY_IDS` / `REQUIRED_CHOICE_COUNT` … Task 2 Step 5 で定義、Task 2 Step 1 のテストで使用 … 一致
- `validateQuestion` / `validateQuestions` … Task 2 Step 5 で定義、Task 7・8 の検査で使用 … 一致
- `MOCK_EXAM_QUESTION_COUNT` / `remainingSeconds` / `formatRemaining` / `gradeMockExam` … Task 5 Step 3 で定義、Step 1 のテストと Step 7 の呼び出しで使用 … 一致
- `MOCK_EXAM_LIMIT_SECONDS` … Task 5 Step 3 で定義。Step 1 のテストで使用。Step 7 の import には含めない（`remainingSeconds` の既定値として内部で使われるため）… 一致
- `filterQuestions(questions, { categoryId })` … Task 3 Step 8 で難易度を廃止。Task 3 Step 5・Task 5 Step 7 の呼び出しも `categoryId` のみ … 一致
- `applyCategoryColor(element, categoryId)` … 既存、Task 5 Step 7 で使用 … 一致
- `endMockExam()` … Task 5 Step 7 で定義、同 Step の `setupNav` / `back-home-button` で使用 … 一致
- `#verify-badge` … Task 4 Step 1 で作成、Step 2 で参照 … 一致
- `#mock-timer` / `#mock-category-result` / `#mock-category-list` / `#mock-exam-button` … Task 5 Step 6 で作成、Step 7 で参照 … 一致
- 分野ID10種 … Task 2・6・7・8 で同じ綴り … 一致
