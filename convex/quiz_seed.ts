import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seedQuestions = mutation({
    args: {},
    handler: async (ctx) => {
        const questions = [
    {
        "qid": "vital-001",
        "prompt": "成人の正常な呼吸数の範囲（1分間）として最も適切なものはどれですか？",
        "choices": [
            "8〜10回",
            "12〜20回",
            "25〜30回",
            "40〜50回"
        ],
        "correctIndex": 1,
        "explanation": "成人の正常な安静時の呼吸数は一般的に毎分12〜20回とされています。12回未満を徐呼吸、20回以上を頻呼吸と呼びます。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "ethics-001",
        "prompt": "看護助手が患者のプライバシー情報を知った場合、どのように対応すべきですか？",
        "choices": [
            "同僚との共有であれば問題ない",
            "SNSで名前を伏せて発信する",
            "業務上必要な場合を除き、外部に漏らしてはならない",
            "患者本人の許可があれば誰に話しても良い"
        ],
        "correctIndex": 2,
        "explanation": "守秘義務は全ての医療従事者に課せられています。患者の個人情報は業務上正当な理由がある場合を除き、第三者に漏らしてはいけません。",
        "category": "倫理・法規",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "tech-001",
        "prompt": "車椅子からベッドへの移乗介助時、車椅子の位置で最も基本的なものはどれですか？",
        "choices": [
            "ベッドに対して直角に置く",
            "ベッドの足側に置く",
            "患者の健側（動きやすい側）がベッドに近くなるよう斜めに置く",
            "患者の患側（不自由な側）がベッドに近くなるよう斜めに置く"
        ],
        "correctIndex": 2,
        "explanation": "移乗介助の基本は、患者の「健側（動きやすい側）」を移動先に近づけることです。ベッドに対して20〜30度程度の角度（斜め）に配置するのが基本です。",
        "category": "介助技術",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "vital-002",
        "prompt": "血圧測定で「収縮期血圧」とは何を指しますか？",
        "choices": [
            "心臓が膨らんだ時の血圧",
            "心臓が収縮して血液を送り出した時の血圧",
            "血管が最も細くなった時の血圧",
            "脈拍が止まった時の血圧"
        ],
        "correctIndex": 1,
        "explanation": "収縮期血圧（最高血圧）は、心臓が収縮して血液を動脈に送り出した時の最も高い圧力のことです。",
        "category": "バイタルサイン",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "safety-001",
        "prompt": "ベッドから車椅子へ移乗する際、転倒事故を防ぐために最初に行うべきことは何ですか？",
        "choices": [
            "患者の腕を引っ張る",
            "車椅子のブレーキがかかっているか確認する",
            "すぐに立ち上がらせる",
            "靴を脱がせる"
        ],
        "correctIndex": 1,
        "explanation": "安全管理の第一歩は、車椅子のブレーキ（ストッパー）が確実にかかっていることを確認することです。ブレーキが甘いと移乗時に車椅子が動き、転倒の原因になります。",
        "category": "安全管理",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "comm-001",
        "prompt": "認知症で同じ質問を繰り返す患者への対応として、最も適切なものはどれですか？",
        "choices": [
            "「さっき言いましたよ」と注意する",
            "無視して業務を続ける",
            "その都度、穏やかに答えるか、不安の背景を考える",
            "質問を止めるように諭す"
        ],
        "correctIndex": 2,
        "explanation": "認知症の方は不安から質問を繰り返すことがあります。否定せず、安心感を与えられるような穏やかな対応が求められます。",
        "category": "コミュニケーション",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "infection-001",
        "prompt": "標準予防策（スタンダード・プリコーション）において、手洗いを行うタイミングとして不適切なものはどれですか？",
        "choices": [
            "ケアの前",
            "ケアの後",
            "手袋を外した後",
            "自分の昼休憩が終わった後のみ"
        ],
        "correctIndex": 3,
        "explanation": "標準予防策では、患者ごとに、ケアの前後、体液に触れた後、手袋を外した後など、頻繁な手洗いが基本です。休憩後だけでは不十分です。",
        "category": "感染管理",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "ethics-002",
        "prompt": "患者から「どうしてもお礼を受け取ってほしい」とお金を渡された場合の対応として適切なものはどれですか？",
        "choices": [
            "ありがたく頂戴する",
            "こっそりポケットに入れる",
            "「規則で受け取れません」と丁寧に辞退し、報告する",
            "他のみんなと分けるからいいよと言う"
        ],
        "correctIndex": 2,
        "explanation": "医療機関では患者からの金品授受は原則禁止されています。丁重にお断りし、必要であれば上司に報告するのが正解です。",
        "category": "倫理・法規",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "tech-002",
        "prompt": "食事介助を行う際の姿勢で、誤嚥（ごえん）のリスクを減らすために重要なのはどれですか？",
        "choices": [
            "喉が伸びるように上を向かせる",
            "顎を軽く引いた姿勢を保つ",
            "完全に真横に寝かせる",
            "早口で話しかけながら食べさせる"
        ],
        "correctIndex": 1,
        "explanation": "嚥下（飲み込み）をしやすくするためには、顎を軽く引いた姿勢（軽度前屈位）をとることが重要です。顎が上がると気道が開き、誤嚥しやすくなります。",
        "category": "介助技術",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "safety-002",
        "prompt": "点滴スタンドを使用している患者の歩行介助で、気をつけるべきことは何ですか？",
        "choices": [
            "点滴バッグを心臓より低い位置に保つ",
            "点滴バッグを心臓より高い位置に保つ",
            "点滴のチューブをわざと引っ張る",
            "速度を勝手に見る"
        ],
        "correctIndex": 1,
        "explanation": "重力を利用して滴下させている場合、バッグを心臓より低い位置にすると血液が逆流したり滴下が止まったりします。常に心臓より高い位置に保つ必要があります。",
        "category": "安全管理",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "bt",
        "prompt": "BT（ビーティー） (びーてぃー) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温（Body Temperature）",
            "脈拍",
            "血圧"
        ],
        "correctIndex": 0,
        "explanation": "BT（ビーティー）は体温（Body Temperature）を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "bp",
        "prompt": "BP（ビーピー） (びーぴー) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温",
            "血圧（Blood Pressure）",
            "血糖値"
        ],
        "correctIndex": 1,
        "explanation": "BP（ビーピー）は血圧（Blood Pressure）を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "pr",
        "prompt": "PR（ピーアール） (ぴーあーる) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温",
            "呼吸数",
            "脈拍（Pulse Rate）"
        ],
        "correctIndex": 2,
        "explanation": "PR（ピーアール）は脈拍（Pulse Rate）を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "spo2",
        "prompt": "SpO2（エスピーオーツー） (えすぴーおーつー) の意味として最も適切なものはどれですか？",
        "choices": [
            "経皮的動脈血酸素飽和度",
            "血液型",
            "血糖値"
        ],
        "correctIndex": 0,
        "explanation": "SpO2（エスピーオーツー）は経皮的動脈血酸素飽和度を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "rr",
        "prompt": "RR（アールアール） (あーるあーる) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温",
            "呼吸数（Respiratory Rate）",
            "心拍数"
        ],
        "correctIndex": 1,
        "explanation": "RR（アールアール）は呼吸数（Respiratory Rate）を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "ton",
        "prompt": "頓服（とんぷく） (とんぷく) の意味として最も適切なものはどれですか？",
        "choices": [
            "1日3回飲む薬",
            "必要な時だけ服用する薬",
            "毎食後に飲む薬"
        ],
        "correctIndex": 1,
        "explanation": "頓服（とんぷく）は必要な時だけ服用する薬を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "naifuku",
        "prompt": "内服（ないふく） (ないふく) の意味として最も適切なものはどれですか？",
        "choices": [
            "薬を塗ること",
            "薬を注射すること",
            "薬を飲むこと"
        ],
        "correctIndex": 2,
        "explanation": "内服（ないふく）は薬を飲むことを指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "gaiyou",
        "prompt": "外用（がいよう） (がいよう) の意味として最も適切なものはどれですか？",
        "choices": [
            "注射する薬",
            "皮膚や粘膜に塗る薬",
            "飲む薬"
        ],
        "correctIndex": 1,
        "explanation": "外用（がいよう）は皮膚や粘膜に塗る薬を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "zuigai",
        "prompt": "頭蓋（ずがい） (ずがい) の意味として最も適切なものはどれですか？",
        "choices": [
            "背骨",
            "頭の骨",
            "骨盤"
        ],
        "correctIndex": 1,
        "explanation": "頭蓋（ずがい）は頭の骨を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "kyoubu",
        "prompt": "胸部（きょうぶ） (きょうぶ) の意味として最も適切なものはどれですか？",
        "choices": [
            "お腹の部分",
            "背中の部分",
            "胸の部分"
        ],
        "correctIndex": 2,
        "explanation": "胸部（きょうぶ）は胸の部分を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "fukubu",
        "prompt": "腹部（ふくぶ） (ふくぶ) の意味として最も適切なものはどれですか？",
        "choices": [
            "お腹の部分",
            "胸の部分",
            "腰の部分"
        ],
        "correctIndex": 0,
        "explanation": "腹部（ふくぶ）はお腹の部分を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "shisei",
        "prompt": "四肢（しし） (しし) の意味として最も適切なものはどれですか？",
        "choices": [
            "両手両足",
            "胴体",
            "頭部"
        ],
        "correctIndex": 0,
        "explanation": "四肢（しし）は両手両足を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "kea",
        "prompt": "ガーゼ (がーぜ) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温を測る器具",
            "傷口を覆う布",
            "血圧を測る器具"
        ],
        "correctIndex": 1,
        "explanation": "ガーゼは傷口を覆う布を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "sonde",
        "prompt": "ゾンデ (ぞんで) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温計",
            "注射針",
            "胃や鼻に入れる管"
        ],
        "correctIndex": 2,
        "explanation": "ゾンデは胃や鼻に入れる管を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "stretcher",
        "prompt": "ストレッチャー (すとれっちゃー) の意味として最も適切なものはどれですか？",
        "choices": [
            "ベッド柵",
            "患者を運ぶ車輪付きベッド",
            "車椅子"
        ],
        "correctIndex": 1,
        "explanation": "ストレッチャーは患者を運ぶ車輪付きベッドを指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "seishin",
        "prompt": "清拭（せいしき） (せいしき) の意味として最も適切なものはどれですか？",
        "choices": [
            "体を拭いて清潔にすること",
            "入浴すること",
            "歯を磨くこと"
        ],
        "correctIndex": 0,
        "explanation": "清拭（せいしき）は体を拭いて清潔にすることを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "haisesu",
        "prompt": "排泄（はいせつ） (はいせつ) の意味として最も適切なものはどれですか？",
        "choices": [
            "尿や便を出すこと",
            "薬を飲むこと",
            "食事を摂ること"
        ],
        "correctIndex": 0,
        "explanation": "排泄（はいせつ）は尿や便を出すことを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "taii",
        "prompt": "体位（たいい） (たいい) の意味として最も適切なものはどれですか？",
        "choices": [
            "体の姿勢",
            "体温",
            "体重"
        ],
        "correctIndex": 0,
        "explanation": "体位（たいい）は体の姿勢を指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "kanshoku",
        "prompt": "観察（かんさつ） (かんさつ) の意味として最も適切なものはどれですか？",
        "choices": [
            "リハビリをすること",
            "患者の状態を注意深く見ること",
            "薬を投与すること"
        ],
        "correctIndex": 1,
        "explanation": "観察（かんさつ）は患者の状態を注意深く見ることを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "shokujikaijokan",
        "prompt": "食事介助（しょくじかいじょ） (しょくじかいじょ) の意味として最も適切なものはどれですか？",
        "choices": [
            "食事のお手伝いをすること",
            "食事を作ること",
            "食事を運ぶこと"
        ],
        "correctIndex": 0,
        "explanation": "食事介助（しょくじかいじょ）は食事のお手伝いをすることを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "ido",
        "prompt": "移動（いどう） (いどう) の意味として最も適切なものはどれですか？",
        "choices": [
            "入浴すること",
            "場所を変えること",
            "食事すること"
        ],
        "correctIndex": 1,
        "explanation": "移動（いどう）は場所を変えることを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "tenteki",
        "prompt": "点滴（てんてき） (てんてき) の意味として最も適切なものはどれですか？",
        "choices": [
            "塗り薬",
            "血管に薬や栄養を少しずつ入れること",
            "飲み薬"
        ],
        "correctIndex": 1,
        "explanation": "点滴（てんてき）は血管に薬や栄養を少しずつ入れることを指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "shoujou",
        "prompt": "症状（しょうじょう） (しょうじょう) の意味として最も適切なものはどれですか？",
        "choices": [
            "検査の方法",
            "病気の現れ方・状態",
            "薬の名前"
        ],
        "correctIndex": 1,
        "explanation": "症状（しょうじょう）は病気の現れ方・状態を指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "kinkyuu",
        "prompt": "緊急（きんきゅう） (きんきゅう) の意味として最も適切なものはどれですか？",
        "choices": [
            "ゆっくり対応できる状態",
            "予定された処置",
            "急いで対応が必要な状態"
        ],
        "correctIndex": 2,
        "explanation": "緊急（きんきゅう）は急いで対応が必要な状態を指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "ansei",
        "prompt": "安静（あんせい） (あんせい) の意味として最も適切なものはどれですか？",
        "choices": [
            "体を休めて動かないこと",
            "歩くこと",
            "運動すること"
        ],
        "correctIndex": 0,
        "explanation": "安静（あんせい）は体を休めて動かないことを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "rinsh",
        "prompt": "臨床（りんしょう） (りんしょう) の意味として最も適切なものはどれですか？",
        "choices": [
            "図書館",
            "実際の医療現場",
            "研究室"
        ],
        "correctIndex": 1,
        "explanation": "臨床（りんしょう）は実際の医療現場を指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "中級",
        "isPublished": true
    },
    {
        "qid": "kanja",
        "prompt": "患者（かんじゃ） (かんじゃ) の意味として最も適切なものはどれですか？",
        "choices": [
            "医師",
            "病気やケガで治療を受ける人",
            "看護師"
        ],
        "correctIndex": 1,
        "explanation": "患者（かんじゃ）は病気やケガで治療を受ける人を指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "nyuuin",
        "prompt": "入院（にゅういん） (にゅういん) の意味として最も適切なものはどれですか？",
        "choices": [
            "病院に泊まって治療を受けること",
            "退院すること",
            "通院すること"
        ],
        "correctIndex": 0,
        "explanation": "入院（にゅういん）は病院に泊まって治療を受けることを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "taiin",
        "prompt": "退院（たいいん） (たいいん) の意味として最も適切なものはどれですか？",
        "choices": [
            "病院から家に帰ること",
            "病院に入ること",
            "転院すること"
        ],
        "correctIndex": 0,
        "explanation": "退院（たいいん）は病院から家に帰ることを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "kaigo",
        "prompt": "介護（かいご） (かいご) の意味として最も適切なものはどれですか？",
        "choices": [
            "手術をすること",
            "日常生活の手助けをすること",
            "検査をすること"
        ],
        "correctIndex": 1,
        "explanation": "介護（かいご）は日常生活の手助けをすることを指します。現場でよく使われる重要な用語です。",
        "category": "処置・ケア",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "thermometer",
        "prompt": "体温計 (たいおんけい) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温を測定する医療器具",
            "点滴スタンド",
            "聴診器",
            "血圧測定器"
        ],
        "correctIndex": 0,
        "explanation": "体温計は体温を測定する医療器具を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "medication-001",
        "prompt": "与薬（よやく） (よやく) の意味として最も適切なものはどれですか？",
        "choices": [
            "バイタルサイン測定",
            "患者に薬を投与すること。",
            "採血"
        ],
        "correctIndex": 1,
        "explanation": "与薬（よやく）は患者に薬を投与すること。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "abdomen",
        "prompt": "腹部 (ふくぶ) の意味として最も適切なものはどれですか？",
        "choices": [
            "お腹のこと。胃、腸、肝臓など消化器系の臓器や、その他多くの臓器が位置する体の部分。",
            "四肢",
            "骨盤"
        ],
        "correctIndex": 0,
        "explanation": "腹部はお腹のこと。胃、腸、肝臓など消化器系の臓器や、その他多くの臓器が位置する体の部分。を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "s-lamp",
        "prompt": "吸引器 (きゅういんき) の意味として最も適切なものはどれですか？",
        "choices": [
            "気道内の分泌物などを吸い取るための医療器具",
            "点滴スタンド",
            "聴診器"
        ],
        "correctIndex": 0,
        "explanation": "吸引器は気道内の分泌物などを吸い取るための医療器具を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "med-001",
        "prompt": "与薬（よやく） (よやく) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温測定",
            "採血",
            "薬を患者に投与すること。"
        ],
        "correctIndex": 2,
        "explanation": "与薬（よやく）は薬を患者に投与すること。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "abdomen-anatomy",
        "prompt": "腹部 (ふくぶ) の意味として最も適切なものはどれですか？",
        "choices": [
            "お腹の部分のこと。",
            "上肢",
            "背部"
        ],
        "correctIndex": 0,
        "explanation": "腹部はお腹の部分のこと。を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "syr",
        "prompt": "シリンジ (しりんじ) の意味として最も適切なものはどれですか？",
        "choices": [
            "ガーゼ",
            "注射器",
            "鑷子（ピンセット）"
        ],
        "correctIndex": 1,
        "explanation": "シリンジは注射器を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "temp",
        "prompt": "体温 (たいおん) の意味として最も適切なものはどれですか？",
        "choices": [
            "体の温度のこと。腋窩（わきの下）、口腔、直腸などで測定する。",
            "呼吸数",
            "血圧"
        ],
        "correctIndex": 0,
        "explanation": "体温は体の温度のこと。腋窩（わきの下）、口腔、直腸などで測定する。を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "medication-order",
        "prompt": "処方箋（しょほうせん） (しょほうせん) の意味として最も適切なものはどれですか？",
        "choices": [
            "医師が患者に投与する薬の種類、量、用法などを指示する文書。",
            "検査結果報告書",
            "点滴指示書"
        ],
        "correctIndex": 0,
        "explanation": "処方箋（しょほうせん）は医師が患者に投与する薬の種類、量、用法などを指示する文書。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "kekkanshou",
        "prompt": "血管（けっかん） (けっかん) の意味として最も適切なものはどれですか？",
        "choices": [
            "筋肉",
            "血液が流れる管のこと。動脈、静脈、毛細血管などがある。",
            "骨格"
        ],
        "correctIndex": 1,
        "explanation": "血管（けっかん）は血液が流れる管のこと。動脈、静脈、毛細血管などがある。を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "iv-catheter",
        "prompt": "IVカテーテル (アイブイカテーテル) の意味として最も適切なものはどれですか？",
        "choices": [
            "吸引チューブ",
            "点滴を行う際に血管に挿入する細い管のこと。",
            "酸素マスク"
        ],
        "correctIndex": 1,
        "explanation": "IVカテーテルは点滴を行う際に血管に挿入する細い管のこと。を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "body-temperature-check",
        "prompt": "体温測定 (たいおんそくてい) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温計を用いて、体温を測ること。",
            "脈拍測定",
            "血圧測定"
        ],
        "correctIndex": 0,
        "explanation": "体温測定は体温計を用いて、体温を測ること。を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "med-injection",
        "prompt": "与薬（よやく） (よやく) の意味として最も適切なものはどれですか？",
        "choices": [
            "バイタルサイン測定",
            "体位変換",
            "薬剤を患者に投与すること。",
            "食事介助"
        ],
        "correctIndex": 2,
        "explanation": "与薬（よやく）は薬剤を患者に投与すること。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "kekkansho",
        "prompt": "血管床 (けっかんしょう) の意味として最も適切なものはどれですか？",
        "choices": [
            "呼吸器系のこと。",
            "消化管のこと。",
            "血管が分布している組織や領域のこと。"
        ],
        "correctIndex": 2,
        "explanation": "血管床は血管が分布している組織や領域のこと。を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "iv-pump",
        "prompt": "輸液ポンプ (ゆえきぽんぷ) の意味として最も適切なものはどれですか？",
        "choices": [
            "吸引器",
            "点滴の速度を一定に保つ医療機器",
            "血圧計",
            "酸素マスク"
        ],
        "correctIndex": 1,
        "explanation": "輸液ポンプは点滴の速度を一定に保つ医療機器を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "body-temperature",
        "prompt": "体温 (たいおん) の意味として最も適切なものはどれですか？",
        "choices": [
            "体の温度。健康状態を知るための重要な指標。",
            "呼吸数",
            "血圧"
        ],
        "correctIndex": 0,
        "explanation": "体温は体の温度。健康状態を知るための重要な指標。を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "med-injection-2",
        "prompt": "注射（ちゅうしゃ） (ちゅうしゃ) の意味として最も適切なものはどれですか？",
        "choices": [
            "服薬",
            "点滴",
            "薬剤を体内に注入する行為。皮下、筋肉、静脈など、投与経路は様々。"
        ],
        "correctIndex": 2,
        "explanation": "注射（ちゅうしゃ）は薬剤を体内に注入する行為。皮下、筋肉、静脈など、投与経路は様々。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "mizuchi",
        "prompt": "四肢（しし） (しし) の意味として最も適切なものはどれですか？",
        "choices": [
            "人間の手足のこと",
            "体幹",
            "頭頸部"
        ],
        "correctIndex": 0,
        "explanation": "四肢（しし）は人間の手足のことを指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "oxygen-mask",
        "prompt": "酸素マスク (さんそますく) の意味として最も適切なものはどれですか？",
        "choices": [
            "患者に酸素を投与するための医療器具。",
            "点滴スタンド",
            "聴診器"
        ],
        "correctIndex": 0,
        "explanation": "酸素マスクは患者に酸素を投与するための医療器具。を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "body-temperature-check-2",
        "prompt": "体温測定 (たいおんそくてい) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温を測ること。",
            "呼吸回数測定",
            "脈拍測定",
            "血圧測定"
        ],
        "correctIndex": 0,
        "explanation": "体温測定は体温を測ること。を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "med-injection-3",
        "prompt": "注射（ちゅうしゃ） (ちゅうしゃ) の意味として最も適切なものはどれですか？",
        "choices": [
            "吸入（きゅうにゅう）",
            "点滴（てんてき）",
            "薬剤を注射器で体内に注入すること。"
        ],
        "correctIndex": 2,
        "explanation": "注射（ちゅうしゃ）は薬剤を注射器で体内に注入すること。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "hiraku-kotsuban",
        "prompt": "骨盤（こつばん） (こつばん) の意味として最も適切なものはどれですか？",
        "choices": [
            "体の下部に位置し、脊椎と下肢をつなぐ骨格構造。",
            "肋骨",
            "頭蓋骨"
        ],
        "correctIndex": 0,
        "explanation": "骨盤（こつばん）は体の下部に位置し、脊椎と下肢をつなぐ骨格構造。を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "iv-pump-setting",
        "prompt": "輸液ポンプ (ゆえきぽんぷ) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温計",
            "吸引カテーテル",
            "点滴の滴下速度を一定に保つための医療機器。",
            "酸素マスク"
        ],
        "correctIndex": 2,
        "explanation": "輸液ポンプは点滴の滴下速度を一定に保つための医療機器。を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "body-temperature-check-3",
        "prompt": "体温測定 (たいおんそくてい) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温を測ること。発熱や低体温の有無を評価するために行う。",
            "呼吸回数測定",
            "血圧測定"
        ],
        "correctIndex": 0,
        "explanation": "体温測定は体温を測ること。発熱や低体温の有無を評価するために行う。を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "med-injection-4",
        "prompt": "注射（ちゅうしゃ） (ちゅうしゃ) の意味として最も適切なものはどれですか？",
        "choices": [
            "点滴",
            "罨法",
            "薬剤を体内に注入すること。"
        ],
        "correctIndex": 2,
        "explanation": "注射（ちゅうしゃ）は薬剤を体内に注入すること。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "shinzo",
        "prompt": "心臓 (しんぞう) の意味として最も適切なものはどれですか？",
        "choices": [
            "肝臓",
            "肺",
            "血液を全身に送り出すポンプの役割を果たす臓器。"
        ],
        "correctIndex": 2,
        "explanation": "心臓は血液を全身に送り出すポンプの役割を果たす臓器。を指します。現場でよく使われる重要な用語です。",
        "category": "解剖",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "infusion-pump",
        "prompt": "輸液ポンプ (ゆえきぽんぷ) の意味として最も適切なものはどれですか？",
        "choices": [
            "カテーテル",
            "パルスオキシメーター",
            "吸引器",
            "点滴の速度を一定に保つための医療機器。"
        ],
        "correctIndex": 3,
        "explanation": "輸液ポンプは点滴の速度を一定に保つための医療機器。を指します。現場でよく使われる重要な用語です。",
        "category": "医療器具",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "body-temperature-check-4",
        "prompt": "体温測定 (たいおんそくてい) の意味として最も適切なものはどれですか？",
        "choices": [
            "体温を測ること。体温計を用いて、腋窩、口腔、直腸などで測定する。",
            "呼吸回数測定",
            "血圧測定"
        ],
        "correctIndex": 0,
        "explanation": "体温測定は体温を測ること。体温計を用いて、腋窩、口腔、直腸などで測定する。を指します。現場でよく使われる重要な用語です。",
        "category": "バイタルサイン",
        "difficulty": "初級",
        "isPublished": true
    },
    {
        "qid": "med-injection-5",
        "prompt": "与薬（よやく） (よやく) の意味として最も適切なものはどれですか？",
        "choices": [
            "体位変換",
            "薬剤を患者に投与すること。",
            "食事介助"
        ],
        "correctIndex": 1,
        "explanation": "与薬（よやく）は薬剤を患者に投与すること。を指します。現場でよく使われる重要な用語です。",
        "category": "薬剤",
        "difficulty": "初級",
        "isPublished": true
    }
];

        let count = 0;
        for (const q of questions) {
            const existing = await ctx.db
                .query("quizQuestions")
                .withIndex("by_qid", (query) => query.eq("qid", q.qid))
                .first();

            const data = { ...q, updatedAt: Date.now() };
            if (existing) {
                await ctx.db.patch(existing._id, data);
            } else {
                await ctx.db.insert("quizQuestions", data);
            }
            count++;
        }
        return { count };
    },
});
