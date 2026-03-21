const { execSync } = require('child_process');

// Topics pool for random selection
const TOPICS = [
    // --- Positive / Warm ---
    "患者さんの「ありがとう」が心に染みた日",
    "晴れた日の中庭散歩、風が気持ちよかった",
    "新人さんが初めて採血成功した時の笑顔",
    "退院する患者さんを見送った背中",
    "食堂のカレーが美味しかった、ただそれだけの幸せ",
    "休憩室で同僚と盛り上がった、推しの話",
    // --- 生活・家事 (Chores) ---
    "洗濯機の音が止まるのを待つ時間",
    "ボタンが取れかけたお気に入りのシャツ",
    "部屋の隅から出てきた、いつかのレシート",
    "観葉植物（サボテン）に水をやる朝",
    "冷蔵庫の奥で賞味期限が切れたドレッシング",
    "久しぶりにアイロンをかけたら、少し焦げた匂い",
    "スーパーで買った、いつもより少し高い卵",

    // --- 身体・感覚 (Body & Senses) ---
    "どうしても起き上がれない、雨の日の朝",
    "湿布の匂いが少しだけ残る、シフト明けの夜",
    "新しいシャンプー、前のと少し匂いが違う",
    "足のむくみがひどくて、壁に足を上げて寝る夜",
    "深爪してしまって、指先が少し痛い",
    "久しぶりに太陽を浴びて、目がしぱしぱする",

    // --- 趣味・インドア (Hobbies & Indoor) ---
    "読みかけのまま止まっている漫画の続き",
    "スマホのカメラロールにある、ピントの合っていない写真",
    "何度も観た映画を、BGM代わりに流す夜",
    "夜中に突然作りたくなった、簡単なパスタ",
    "推しの配信を見逃して、アーカイブを追う休日",

    // --- 風景・街 (Scenery & Town) ---
    "バス停で待つ間、前の人の背中をぼんやり見る",
    "夕飯のいい匂いが漂ってくる、帰り道の住宅街",
    "公園で見かけた猫が、こっちを見ずに逃げた",
    "雨上がりのアスファルトの匂い",
    "自動販売機の下で光っていた小銭",

    // --- 感情・独り言 (Emotions) ---
    "「疲れた」と口に出したら、本当に疲れてしまった気がした",
    "誰とも話さなかった休日の終わり",
    "来月のシフト表を見て、小さくため息をつく",
    "街ですれ違った人の香水の匂いが、昔の友達に似ていた",

    // --- 実務・専門・気づき (Professional & Practical) ---
    "口腔ケアの技術、実は奥が深いということ",
    "「寄り添う」ということの本当の意味",
    "介助者の腰を守る、基本の「き」",
    "多職種連携、一言の掛け合いで変わる現場",
    "忙しい時こそ、10秒だけ目を閉じて深呼吸",
    "新人指導、教えることで自分が一番学んでいる",
    "手洗い・消毒が当たり前になった、私たちの日常",
    "患者さんのご家族との、短いけれど大切な会話",
    "自分をいたわる、夜勤明けのご褒美ルーティン"
];

function getDailyTopic() {
    // Ideally, we could use the date to pick a specific seasonal topic,
    // but for now, random selection from the pool is sufficient.
    const randomIndex = Math.floor(Math.random() * TOPICS.length);
    return TOPICS[randomIndex];
}

function main() {
    try {
        const topic = getDailyTopic();
        console.log(`[Daily note Generator] Selected topic: "${topic}"`);

        // Execute the main generation script
        console.log(`Running generation script...`);
        execSync(`node scripts/generate-note-draft.cjs "${topic}"`, { stdio: 'inherit' });

        console.log(`[Daily note Generator] Done.`);
    } catch (error) {
        console.error("Error in daily generation:", error);
        process.exit(1);
    }
}

main();
