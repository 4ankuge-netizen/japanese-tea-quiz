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

/*
  始めた時刻と今の時刻から、残り何秒かを求める。
  時計は端末のものを使うので、ミリ秒でもらって秒に直している。

  上と下の両方で止めているのは、次の理由。
    下(0で止める) … 時間切れのあとにマイナスの数字が出ないようにするため
    上(制限時間で止める) … 時刻合わせなどで端末の時計が巻き戻ったときに、
                           残り時間が増えてしまうと本番の練習にならないため
*/
export function remainingSeconds(startedAtMs, nowMs, limitSeconds = MOCK_EXAM_LIMIT_SECONDS) {
  const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);
  const left = limitSeconds - elapsedSeconds;
  return Math.min(limitSeconds, Math.max(0, left));
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

  渡された問題や記録は書き換えない(読むだけ)。
*/
export function gradeMockExam(questions, resultsById, categories) {
  let correct = 0;
  for (const q of questions) {
    if (resultsById.get(q.id) === true) correct += 1;
  }

  // 分野ごとの成績。
  // categories の順番のまま並べるので、ホーム画面の並びと食い違わない。
  // 今回出題されなかった分野は、0問と表示しても意味がないので一覧から外す
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
