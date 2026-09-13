// 1問分のデータが正しい形になっているかを調べる部品です。
// 問題を書き足したときのうっかりミス(選択肢の数が違う、分野名の打ち間違い、
// 出典の書き忘れなど)に気づけるようにするためのものです。

// 出題10分野の正式なID。
// data/categories.json と同じ並び・同じ内容にしておく必要があり、
// ずれていないかはテストで見張っている。
//
// 分野名を打ち間違えると、その問題はホーム画面からも正答率画面からも
// 消えてしまい、しかもエラーが出ない。気づかないまま「作ったはずの問題が
// 出てこない」ということになるため、ここで必ず照合する。
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
    errors.push(
      `choices はちょうど${REQUIRED_CHOICE_COUNT}個の配列である必要があります(本番は五肢択一)`
    );
  }

  // 同じ選択肢が2つ以上ないことの確認。
  // 同じ文が並んでいると、正解でない方を選んでも「合っている」ことになり、
  // 問題として成立しなくなる
  if (Array.isArray(q.choices)) {
    const unique = new Set(q.choices);
    if (unique.size !== q.choices.length) {
      errors.push('同じ選択肢が2つ以上あります');
    }
  }

  // 正解番号の確認。
  // 整数であること、かつ選択肢の範囲内に収まっていることの両方を見る。
  // Number.isInteger は 1.5 も NaN も弾いてくれる
  if (
    !Number.isInteger(q.correctIndex) ||
    !Array.isArray(q.choices) ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.choices.length
  ) {
    errors.push('correctIndex が choices の範囲内の整数ではありません');
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
      協会のテキストは転載できないため、問題の内容は公開資料に頼っている。
      「確認した」と印だけ付けて出典を書かない問題を許すと、
      後から誰も確かめられなくなり、誤った知識をそのまま覚える事故につながる。
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
