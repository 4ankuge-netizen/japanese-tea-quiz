// 出題する問題を選んだり、正解かどうかを判定したりするための部品です。
// 画面の見た目(HTML)には一切関わらず、データの計算だけを行います。

// 分野で問題を絞り込む関数。
// categoryId を省いた場合(または空の場合)は、すべての問題を返す。
//
// 本番の試験に難易度の区分はないため、この試験対策アプリでは
// 難易度による絞り込みは用意していない
export function filterQuestions(questions, { categoryId } = {}) {
  return questions.filter((q) => {
    // 分野が指定されていて、この問題が別の分野ならスキップ
    if (categoryId && q.category !== categoryId) return false;
    // 合致したのでこの問題を含める
    return true;
  });
}

// 直近で間違えた問題だけを取り出す(弱点復習モード用)
// wrongQuestionIds には問題のIDの配列が入ります
export function getWeakPointQuestions(questions, wrongQuestionIds) {
  // IDの配列をセット(集合)に変換して、高速に検索できるようにします
  const wrongSet = new Set(wrongQuestionIds);
  // 間違えた問題IDに含まれる問題だけを返します
  return questions.filter((q) => wrongSet.has(q.id));
}

// 選んだ選択肢が正解かどうかを判定する
// selectedIndex は選んだ選択肢の番号(0から始まります)
export function checkAnswer(question, selectedIndex) {
  // 選んだ番号が正解の番号と同じかどうかをチェック
  return selectedIndex === question.correctIndex;
}

// 問題プールの中から、指定した数だけランダムに選ぶ。
// プールが増えても1回の出題は決まった問題数で終わるようにするためのもの。
// プールの数が足りないときは、ある分だけ返す。
export function pickRandomQuestions(questions, count, randomFn = Math.random) {
  // shuffle は元の配列を書き換えずに新しい配列を返すので、プール自体は無事
  return shuffle(questions, randomFn).slice(0, count);
}

// 1問分の選択肢を並び替えて、正解が何番目に移ったかも一緒に返す。
// 表示のたびに呼ぶことで、選択肢の位置を覚えて答えるのを防ぐ。
// 元の問題データは書き換えない。
export function shuffleChoices(question, randomFn = Math.random) {
  // 「どれが正解か」の目印を付けたまま並び替え、後から位置を調べる
  const marked = question.choices.map((text, index) => ({
    text,
    isCorrect: index === question.correctIndex,
  }));
  const shuffled = shuffle(marked, randomFn);
  return {
    choices: shuffled.map((item) => item.text),
    correctIndex: shuffled.findIndex((item) => item.isCorrect),
  };
}

// 配列の中身をランダムな順番に並べ替える(Fisher-Yatesシャッフル)
// randomFn を差し替えられるようにして、テストのときは結果が毎回変わらないようにしている
export function shuffle(array, randomFn = Math.random) {
  // 元の配列を変更しないように、コピーを作ります
  const result = array.slice();
  // 配列の最後から2番目の要素まで、順番にシャッフルします
  for (let i = result.length - 1; i > 0; i--) {
    // 0 から i までのランダムな位置を選びます
    const j = Math.floor(randomFn() * (i + 1));
    // 現在の位置とランダムに選んだ位置の要素を入れ替えます
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
