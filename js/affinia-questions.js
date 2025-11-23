// affinia-questions.js
// イントロ文・質問文・選択肢の定義

window.AFFINIA_TEXT = {
    title: "Affinia AIタイプ診断",
    subtitle: "16のマスコットが導く、あなたの本当の性格",
    intro: "いくつかの質問に答えるだけで、\nあなたの性格にぴったりのマスコットが見つかります。\n直感で答えてくださいね。",
    startButton: "診断をはじめる",
    questionCountLabel: "Q.",
    nextButton: "次へ",
    resultButton: "結果を見る",
    loading: "診断中..."
};

// 質問リスト
// type: 評価軸 (EI: 外向/内向, SN: 感覚/直観, TF: 思考/感情, JP: 判断/知覚)
// weight: 正の値なら左側(E/S/T/J), 負の値なら右側(I/N/F/P)に加算されるイメージ、
// または回答(1-5)に対して {1: -2, 2: -1, 3: 0, 4: 1, 5: 2} のようにスコアリングする。
// ここではシンプルに:
// axis: 'EI', 'SN', 'TF', 'JP'
// factor: 1 (Agree = E/S/T/J), -1 (Agree = I/N/F/P)
window.AFFINIA_QUESTIONS = [
    {
        id: 1,
        text: "初対面の人と話すのは得意な方だ",
        axis: "EI",
        factor: 1 // Agree -> Extrovert
    },
    {
        id: 2,
        text: "休日は家でゆっくり過ごすより、外に出かけたい",
        axis: "EI",
        factor: 1
    },
    {
        id: 3,
        text: "大人数のパーティよりも、少人数で語り合う方が好きだ",
        axis: "EI",
        factor: -1 // Agree -> Introvert
    },
    {
        id: 4,
        text: "物事を考えるとき、現実的なデータよりも「可能性」や「未来」を重視する",
        axis: "SN",
        factor: -1 // Agree -> Intuition (N)
    },
    {
        id: 5,
        text: "説明書はしっかり読んでから使い始めるタイプだ",
        axis: "SN",
        factor: 1 // Agree -> Sensing (S)
    },
    {
        id: 6,
        text: "空想にふけっていて、周りの声が聞こえないことがある",
        axis: "SN",
        factor: -1
    },
    {
        id: 7,
        text: "決断するときは、自分の気持ちより論理的な正しさを優先する",
        axis: "TF",
        factor: 1 // Agree -> Thinking (T)
    },
    {
        id: 8,
        text: "友人が悩んでいるとき、解決策を出すよりまずは共感してあげたい",
        axis: "TF",
        factor: -1 // Agree -> Feeling (F)
    },
    {
        id: 9,
        text: "議論の場では、感情的にならず冷静に意見を言える",
        axis: "TF",
        factor: 1
    },
    {
        id: 10,
        text: "旅行の計画は、分単位できっちり立てたい",
        axis: "JP",
        factor: 1 // Agree -> Judging (J)
    },
    {
        id: 11,
        text: "部屋が散らかっていると落ち着かない",
        axis: "JP",
        factor: 1
    },
    {
        id: 12,
        text: "締め切りギリギリにならないとやる気が出ない",
        axis: "JP",
        factor: -1 // Agree -> Perceiving (P)
    }
];
