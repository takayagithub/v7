// affinia-compat.js
// 相性ロジックとテキスト定義 (Dynamic Version)

// 相性カテゴリ定義
window.AFFINIA_COMPAT_CATEGORIES = {
    BEST: { label: "運命のパートナー", class: "compat-best", desc: "お互いの足りない部分を補い合える、最高の組み合わせです。" },
    GOOD: { label: "気の合う仲間", class: "compat-good", desc: "価値観が似ていて、一緒にいて居心地が良い関係です。" },
    WORK: { label: "切磋琢磨する関係", class: "compat-work", desc: "刺激を与え合い、成長できる関係ですが、衝突することもあります。" },
    DIFF: { label: "新しい発見がある", class: "compat-diff", desc: "全く違う視点を持っています。理解し合うには努力が必要ですが、学ぶことも多いです。" }
};

window.AFFINIA_COMPAT_LOGIC = {
    // 動的相性診断
    calculate: function (type1, type2) {
        if (!type1 || !type2) return null;

        const data = window.AFFINIA_COMPAT_DATA;
        let matchCount = 0;
        let dynamicsText = [];
        let adviceText = [];

        const axes = ['EI', 'SN', 'TF', 'PJ'];
        const axisNames = ['エネルギー', '認識', '判断', '戦術'];

        for (let i = 0; i < 4; i++) {
            const t1 = type1[i];
            const t2 = type2[i];
            const axis = axes[i];

            if (t1 === t2) {
                matchCount++;
                dynamicsText.push(data.AXIS_DYNAMICS[axis].same[t1]);
            } else {
                // t1 vs t2 (e.g. E vs I)
                // Key is always "EI" or "IE" based on t1+t2
                // But our data structure is AXIS_DYNAMICS.EI.diff.EI (Me=E, You=I)
                // So we construct the key dynamically
                const key = t1 + t2; // e.g. "EI"
                // Check if direct key exists, otherwise reverse? 
                // Actually our data has "EI" and "IE" keys in diff, so direct access works if we mapped it right.
                // Let's check data structure: AXIS_DYNAMICS.EI.diff.EI exists.

                if (data.AXIS_DYNAMICS[axis].diff[key]) {
                    dynamicsText.push(data.AXIS_DYNAMICS[axis].diff[key]);
                }
            }
        }

        // Determine Category
        let categoryKey = "DIFF";
        if (matchCount === 4) categoryKey = "GOOD"; // Same type
        else if (matchCount === 3) categoryKey = "GOOD";
        else if (matchCount === 0) categoryKey = "BEST"; // Duality
        else if (matchCount === 2) categoryKey = "WORK";
        else categoryKey = "DIFF";

        // Special case: Same type is GOOD but has specific nuance
        if (type1 === type2) {
            adviceText.push("自分を見ているようで気恥ずかしいかもしれませんが、最高の理解者になれます。");
        }

        return {
            category: categoryKey,
            label: window.AFFINIA_COMPAT_CATEGORIES[categoryKey].label,
            class: window.AFFINIA_COMPAT_CATEGORIES[categoryKey].class,
            desc: window.AFFINIA_COMPAT_CATEGORIES[categoryKey].desc,
            dynamics: dynamicsText,
            score: Math.round((matchCount / 4) * 100) // Simple score
        };
    },

    // 変身ガイド生成
    generateTransformation: function (currentType, targetType) {
        if (currentType === targetType) return null;

        const data = window.AFFINIA_COMPAT_DATA;
        let steps = [];
        const axes = ['EI', 'SN', 'TF', 'PJ'];

        for (let i = 0; i < 4; i++) {
            const c = currentType[i];
            const t = targetType[i];
            const axis = axes[i];

            if (c !== t) {
                // Need to change from c to t
                const key = "to" + t; // e.g. toE
                if (data.TRANSFORMATION_ADVICE[axis][key]) {
                    steps.push({
                        axis: axis,
                        from: c,
                        to: t,
                        text: data.TRANSFORMATION_ADVICE[axis][key]
                    });
                }
            }
        }

        return steps;
    }
};
