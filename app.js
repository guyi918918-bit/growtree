// ==================== 顾一的成长小树 ====================

const MODULES = [
    { id: 'home', name: '欢迎首页', icon: '🌳' },
    { id: 'water', name: '喝水管理', icon: '💧' },
    { id: 'beauty', name: '变美情报', icon: '💄' },
    { id: 'hot', name: '今日热点', icon: '🔥' },
    { id: 'study', name: '学习提升', icon: '📚' },
    { id: 'checkin', name: '认真打卡', icon: '✅' },
    { id: 'points', name: '积分系统', icon: '⭐' },
    { id: 'treehole', name: '与自己对话', icon: '💛' }
];

// 模块列表可由用户在「设置 → 模块管理」中重命名 / 排序 / 隐藏，
// 因此不再硬编码读取 MODULES，而是走 state.data.modules（首次从 MODULES 初始化）。
function getDefaultModules() {
    return MODULES.map(m => ({ id: m.id, name: m.name, icon: m.icon, hidden: false }));
}
function getAllModules() {
    if (!Array.isArray(state.data.modules) || !state.data.modules.length) {
        state.data.modules = getDefaultModules();
    }
    return state.data.modules;
}
function getModules() {
    const all = getAllModules();
    const visible = all.filter(m => !m.hidden);
    if (!visible.length) return [all[0] || getDefaultModules()[0]];
    return visible;
}
function getModuleById(id) {
    return getAllModules().find(m => m.id === id) || null;
}
function getModuleName(id) {
    const m = getModuleById(id);
    return m ? m.name : (id || '');
}

const API = {
    quote: 'https://v1.hitokoto.cn',
    history: 'https://api.wikimedia.org/feed/v1/wikipedia/zh/onthisday/all',
    hot: 'https://uapis.cn/api/v1/misc/hotboard',
    weather: 'https://api.open-meteo.com/v1'
};

// 每日鼓励语录：本地精选兜底 + 在线 hitokoto 刷新
const ENCOURAGE_QUOTES = {
    heal: {
        name: '情绪治愈',
        icon: '💛',
        hitokotoTypes: 'k,f', // 哲学、网络
        list: [
            { text: '拒绝内耗，把精力留给真正重要的事。', from: '' },
            { text: '与自己和解，不是放弃成长，而是不再苛责。', from: '' },
            { text: '允许一切发生，然后记得做个勇敢的人。', from: '' },
            { text: '松弛感不是躺平，是尽力之后的坦然。', from: '' },
            { text: '情绪急救的第一步：先深呼吸，再处理问题。', from: '' },
            { text: '今天的坏心情，不会决定明天的太阳。', from: '' },
            { text: '停止焦虑，你已经在该在的路上。', from: '' },
            { text: '给心灵放个假，就像给手机充电一样必要。', from: '' },
            { text: '你不必一直坚强，偶尔脆弱也是力量。', from: '' }
        ]
    },
    work: {
        name: '职场搞钱',
        icon: '💼',
        hitokotoTypes: 'f,d', // 网络、文学（职场向偏少，兜底本地）
        list: [
            { text: '人间清醒：搞钱要紧，但更要搞懂自己。', from: '' },
            { text: '职场进阶，从把每一件小事做到 120 分开始。', from: '' },
            { text: '拒绝画饼，用行动给自己发真正的年终奖。', from: '' },
            { text: '高效能不是做更多，而是把关键的事做到极致。', from: '' },
            { text: '向上生长，哪怕每天只比昨天好 1%。', from: '' },
            { text: '搞事业的路上，自律是最稳的复利。', from: '' },
            { text: '自律即自由，自由即选择权的增加。', from: '' },
            { text: '你的时间很值钱，请把它卖给未来。', from: '' },
            { text: '不要等准备好了才开始，开始了才会准备好。', from: '' }
        ]
    },
    life: {
        name: '生活态度',
        icon: '🌿',
        hitokotoTypes: 'f,d,h', // 网络、文学、影视
        list: [
            { text: '热爱生活的人，生活也会偏爱你。', from: '' },
            { text: '小确幸就藏在今天认真吃早餐的 10 分钟里。', from: '' },
            { text: '仪式感不是矫情，是对生活说“我在乎”。', from: '' },
            { text: '慢生活不是慢动作，是把心放慢。', from: '' },
            { text: '独处时光，是给自己最好的礼物。', from: '' },
            { text: '今日份开心，请主动领取。', from: '' },
            { text: '万物可爱，只要你愿意多看一眼。', from: '' },
            { text: '把日子过成诗，从认真过好今天开始。', from: '' },
            { text: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', from: '' }
        ]
    },
    classic: {
        name: '经典权威',
        icon: '📖',
        hitokotoTypes: 'd,i,k', // 文学、诗词、哲学
        list: [
            { text: '种一棵树最好的时间是十年前，其次是现在。', from: '丹比萨·莫约' },
            { text: '星光不问赶路人，时光不负有心人。', from: '大冰' },
            { text: '山不让尘，川不辞盈。', from: '人民日报' },
            { text: '追光的人，终会光芒万丈。', from: '央视文案' },
            { text: '人生没有白走的路，每一步都算数。', from: '李宗盛' },
            { text: '真正的强大，不是忘记，而是接受。', from: '莫言' },
            { text: '愿你出走半生，归来仍是少年。', from: '豆瓣高分' },
            { text: '生活不可能像你想象得那么好，但也不会像你想象得那么糟。', from: '莫泊桑' },
            { text: '那些杀不死我的，必使我更强大。', from: '尼采' }
        ]
    }
};
const QUOTE_CATEGORIES = ['heal', 'work', 'life', 'classic'];
const QUOTE_NEGATIVE_KEYWORDS = ['死','杀','自杀','痛','哭','恨','绝望','黑暗','深渊','废物','垃圾','恶心','操','他妈','滚','去死','崩溃','堕落','孤独终老','生无可恋','没意思','活着','世界尽头'];
function isQuoteNegative(text) {
    return QUOTE_NEGATIVE_KEYWORDS.some(k => text.includes(k));
}
function isQuotePositive(text) {
    const pos = ['加油','坚持','努力','相信','希望','梦想','勇敢','热爱','未来','成长','光芒','向前','更好','值得','加油','棒','优秀','成功','幸运','美好','温暖','治愈','自信','强大'];
    return pos.some(k => text.includes(k));
}
function scoreQuote(text, catKey) {
    if (!text || text.length < 4 || text.length > 120) return -1;
    if (isQuoteNegative(text)) return -1;
    let score = isQuotePositive(text) ? 2 : 0;
    if (catKey === 'work' && /钱|工作|事业|奋斗|努力|职场|成功|目标|自律|价值/.test(text)) score += 2;
    if (catKey === 'life' && /生活|热爱|开心|幸福|今天|美好|温柔|人间/.test(text)) score += 2;
    if (catKey === 'heal' && /自己|和解|放下|焦虑|情绪|平静|温柔|不必|可以/.test(text)) score += 2;
    if (catKey === 'classic' && /生命|时间|世界|人生|真理|智慧|命运/.test(text)) score += 1;
    return score;
}
function getDailyQuoteCategory(seedOffset = 0) {
    const idx = (getDailyIndex(QUOTE_CATEGORIES) + seedOffset) % QUOTE_CATEGORIES.length;
    return QUOTE_CATEGORIES[idx];
}
function getLocalQuote(catKey, seedOffset = 0) {
    const cat = ENCOURAGE_QUOTES[catKey] || ENCOURAGE_QUOTES.heal;
    const idx = (getDailyIndex(cat.list) + seedOffset) % cat.list.length;
    return { category: cat, text: cat.list[idx].text, from: cat.list[idx].from, source: 'local' };
}
async function fetchHitokotoQuote(catKey) {
    const cat = ENCOURAGE_QUOTES[catKey] || ENCOURAGE_QUOTES.heal;
    const types = (cat.hitokotoTypes || 'f,d').split(',');
    // 多试几次，挑一句正向积极的
    for (let i = 0; i < 6; i++) {
        try {
            const type = types[i % types.length];
            const res = await fetch(`${API.quote}?c=${type}&encode=json&_=${Date.now()}-${i}`);
            const data = await res.json();
            const text = data.hitokoto || '';
            const from = data.from || data.from_who || '';
            if (scoreQuote(text, catKey) >= 1) {
                return { category: cat, text, from, source: 'hitokoto' };
            }
        } catch (e) {}
    }
    return null;
}

const HOT_TYPES = {
    weibo: '微博',
    zhihu: '知乎',
    bilibili: 'B站',
    douyin: '抖音',
    xiaohongshu: '小红书',
    kuaishou: '快手',
    toutiao: '今日头条',
    baidu: '百度',
    'qq-news': '腾讯新闻',
    'netease-news': '网易新闻',
    'sina-news': '新浪新闻',
    thepaper: '澎湃',
    huxiu: '虎嗅',
    '36kr': '36氪',
    'people-daily': '人民日报',
    'cctv-news': '央视新闻',
    'guangming-daily': '光明日报',
    'china-youth': '中国青年报'
};

// 实际可用的热榜类型（uapis 接口对部分权威媒体不支持， politics 组使用可稳定返回数据的源）
const HOT_GROUPS = {
    mixed: ['weibo', 'zhihu', 'bilibili', 'baidu', 'toutiao'],
    politics: ['toutiao', 'netease-news', 'sina-news', 'thepaper', 'huxiu', '36kr']
};

// 常见纪念日（月-日）
const TODAY_HOLIDAYS = {
    '1-1': '元旦',
    '2-14': '情人节',
    '3-8': '国际妇女节',
    '3-12': '植树节',
    '4-1': '愚人节',
    '4-22': '世界地球日',
    '5-1': '国际劳动节',
    '5-4': '青年节',
    '6-1': '国际儿童节',
    '7-1': '中国共产党成立纪念日 / 香港回归纪念日',
    '8-1': '中国人民解放军建军节',
    '8-12': '国际青年日',
    '9-10': '教师节',
    '10-1': '中华人民共和国国庆节',
    '10-24': '联合国日',
    '11-11': '光棍节 / 双十一',
    '12-25': '圣诞节'
};

// 打卡项默认模板：基础打卡项 / 日常习惯 / 其他打卡项，内容取自用户的「习惯打卡系统表格.xlsx」
const DEFAULT_CHECKINS = {
    basic: [
        { name: '早上吃药', stars: 1, points: 1 },
        { name: '洗漱', stars: 1, points: 1 },
        { name: '出门前喷香水', stars: 1, points: 1 },
        { name: '洗澡后喷香水', stars: 1, points: 1 },
        { name: '每日夸夸自己', stars: 2, points: 3 }
    ],
    daily: [
        { name: '7：00前起床', stars: 2, points: 3 },
        { name: '早-收拾小猫', stars: 1, points: 1 },
        { name: '洗漱', stars: 1, points: 1 },
        { name: '化妆', stars: 2, points: 3 },
        { name: '吃早餐', stars: 1, points: 1 },
        { name: '带午餐', stars: 1, points: 1 },
        { name: '出门前喷香水', stars: 1, points: 1 },
        { name: '8：00 前出门', stars: 2, points: 3 },
        { name: '8：55 检查是否打卡', stars: 1, points: 1 },
        { name: '爬坡/锻炼10min以上', stars: 2, points: 3 },
        { name: '晚-收拾小猫', stars: 1, points: 1 },
        { name: '选好明天要穿的衣服', stars: 2, points: 3 },
        { name: '洗澡后喷香水', stars: 1, points: 1 },
        { name: '每日夸夸自己', stars: 2, points: 3 },
        { name: '23：00前睡觉', stars: 2, points: 3 }
    ],
    other: [
        { name: '收藏1条喜欢的化妆视频', stars: 2, points: 3 },
        { name: '收藏1条喜欢的穿搭', stars: 2, points: 3 },
        { name: '添加一个想要的内容心愿单', stars: 2, points: 3 },
        { name: '听10min书的解析', stars: 3, points: 6 },
        { name: '爬坡/锻炼20min以上', stars: 3, points: 6 },
        { name: '写一篇十分钟精读一本书的文案', stars: 3, points: 6 },
        { name: '做个手膜', stars: 3, points: 6 },
        { name: 'JIOJIO护理', stars: 3, points: 6 },
        { name: '读一篇十分钟精读一本书的文案', stars: 4, points: 10 },
        { name: '写一篇书法', stars: 4, points: 10 },
        { name: '爬坡/锻炼30min以上', stars: 4, points: 10 },
        { name: '爬坡/锻炼40min以上', stars: 5, points: 15 },
        { name: '剪辑一篇十分钟精读一本书的视频', stars: 5, points: 15 },
        { name: '发表十分钟精读一本书的视频', stars: 5, points: 15 }
    ]
};

// 花朵定级标准：发布习惯时通过「预设几朵花」定义任务难度，分数自动挂钩
const FLOWER_LEVELS = {
    1: { name: '简单', slogan: '轻松拿捏！', max: 1,  diff: '★☆☆☆☆', def: '无脑执行类。耗时<2分钟或属生理本能，几乎没有心理阻力。' },
    2: { name: '中等', slogan: '表现不错哦！', max: 3,  diff: '★★☆☆☆', def: '日常维持类。耗时3-5分钟或需克服微小惰性，做完不觉得累。' },
    3: { name: '坚持', slogan: '又坚持啦！', max: 6,  diff: '★★★☆☆', def: '坚持任务类。耗时10-15分钟或需专注，有轻微脑力/体力消耗。' },
    4: { name: '挑战', slogan: '太厉害了！', max: 10, diff: '★★★★☆', def: '深度突破类。耗时20-30分钟或强度较大，需较强意志力开始。' },
    5: { name: '超越', slogan: '我就是最强王者！', max: 15, diff: '★★★★★', def: '超越任务类。>30分钟高强度或极反人性，最想攻克却易放弃。' }
};
function flowerScore(n) { return (FLOWER_LEVELS[n] || FLOWER_LEVELS[3]).max; }
function flowerLevel(n) { return FLOWER_LEVELS[n] || FLOWER_LEVELS[3]; }
function flowerLevelsGuide() {
    const levels = [1, 2, 3, 4, 5].map(n => {
        const lv = FLOWER_LEVELS[n];
        return `
            <div class="flower-level-card">
                <div class="flower-level-stars">${'🌸'.repeat(n)}</div>
                <div class="flower-level-name">${n} 朵花 · ${lv.name}</div>
                <div class="flower-level-score">满分 ${lv.max} 分</div>
                <div class="flower-level-slogan">${lv.slogan}</div>
                <div class="flower-level-desc">${lv.def}</div>
            </div>
        `;
    }).join('');
    return `
        <div class="flower-levels-grid">${levels}</div>
        <div class="rule-tip">发布习惯时直接选「几朵花」即完成定级，分数自动对应，无需手动填积分。</div>
    `;
}


// 打卡分类（二级目录）默认值，用户可在「板块管理」中增删改
const DEFAULT_CHECKIN_CATEGORIES = {
    basic: '基础打卡项',
    daily: '日常习惯',
    other: '其他打卡项'
};
const DEFAULT_CATEGORY_ORDER = ['basic', 'daily', 'other'];

// 旧版默认四板块（仅用于数据迁移）
const OLD_DEFAULT_CATS = { health: '健康', beauty: '变美', study: '学习', hot: '其他' };
const OLD_DEFAULT_ITEM_NAMES = ['喝水达标','今天没吃零食','早睡（23:00前）','运动10分钟','认真护肤','搭配今日穿搭','化个精致的妆','听10分钟书','口语练习10分钟','背10个单词','看一条新闻','了解一个热点话题'];
function getCategories() {
    return state.data.categories && Object.keys(state.data.categories).length
        ? state.data.categories
        : DEFAULT_CHECKIN_CATEGORIES;
}
function getCategoryOrder() {
    const cats = getCategories();
    const order = state.data.categoryOrder || [];
    // 只保留仍存在的 key，并追加新增但未在 order 中的 key
    const alive = order.filter(k => cats[k]);
    Object.keys(cats).forEach(k => { if (!alive.includes(k)) alive.push(k); });
    return alive;
}
function getCategoryName(key) {
    return getCategories()[key] || '其他';
}
function makeCategoryKey(name) {
    // 生成安全 key：英文/数字保留，中文转拼音首字母，其他字符去重
    const pinyin = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const base = pinyin.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
    const safe = base ? base.replace(/[\u4e00-\u9fa5]/g, '') : 'cat';
    return (safe || 'cat') + '_' + Date.now().toString(36);
}
const CHECKIN_CATEGORIES = DEFAULT_CHECKIN_CATEGORIES;
const CATEGORY_ORDER = DEFAULT_CATEGORY_ORDER;

// 打卡板块横向 Tab 定义（板块置前；板块管理独立成项）
const CHECKIN_TABS = [
    { id: 'category', name: '板块', icon: '📂' },
    { id: 'schedule', name: '时间', icon: '📅' },
    { id: 'manage', name: '管理', icon: '📋' },
    { id: 'more', name: '更多', icon: '⚙️' },
    { id: 'admin', name: '板块管理', icon: '🛠️' }
];

// 积分页横向 Tab 定义（打卡日历移回打卡页；心愿并入统计页）
const POINTS_TABS = [
    { id: 'stats', name: '统计', icon: '📊' },
    { id: 'rank', name: '排位', icon: '🏅' },
    { id: 'ledger', name: '流水', icon: '🧾' },
    { id: 'achv', name: '成就', icon: '🏆' },
    { id: 'makeup', name: '补卡', icon: '🔁' }
];

// 三档难度：普通(底线) / 良好(常规) / 优秀(挑战)
const TIER_POINTS = { '普通': 10, '良好': 15, '优秀': 20 };
const TIER_ORDER = ['普通', '良好', '优秀'];

// 连击额外奖励（按 30 天软重置周期内的里程碑）
const STREAK_BONUS = { 3: 5, 7: 15, 14: 25, 21: 40, 30: 80 };
// 成长称号（与排位赛段位完全联动，min 为累计积分 = 段位起点星数 × 100）
const LEVELS = [
    { min: 0,    title: '萌芽新手', prefix: '倔强青铜', icon: '🌱', stars: 0 },
    { min: 1200, title: '自律学徒', prefix: '秩序白银', icon: '🌿', stars: 12 },
    { min: 2400, title: '坚持达人', prefix: '荣耀黄金', icon: '🌳', stars: 24 },
    { min: 3900, title: '习惯大师', prefix: '尊贵铂金', icon: '🏆', stars: 39 },
    { min: 5400, title: '掌控精英', prefix: '永恒钻石', icon: '🔷', stars: 54 },
    { min: 6900, title: '自律宗师', prefix: '至尊星耀', icon: '⭐', stars: 69 },
    { min: 8700, title: '无限巅峰', prefix: '最强王者', icon: '👑', stars: 87 }
];
// 升段鼓励语：每次晋升到新的大段位时弹出
const RANK_UP_QUOTES = {
    '倔强青铜': '每个高手都曾是笨拙的新手。你已迈出第一步，树木从此生根。',
    '秩序白银': '学徒不怕重复，今天比昨天多坚持一秒，就是蜕变。继续打磨！',
    '荣耀黄金': '你已超越多数人，坚持成了你的标签。保持节奏，树冠正在舒展。',
    '尊贵铂金': '习惯已刻入生活，你不再需要“咬牙坚持”，而是自然生长。大师之路，才刚开始。',
    '永恒钻石': '你不仅习惯优秀，更能掌控节奏、抵御干扰。像树干一样稳固，风雨不动。',
    '至尊星耀': '自律已内化为本能，你不仅自己强，还能带动他人。树已成林，你是领袖。',
    '最强王者': '没有最高，只有更高。你已是自己的王者，但潜力无界，继续向上，触摸天际。'
};
// 习惯成就墙里程碑
const ACHV_MILESTONES = [
    { days: 30, icon: '🥉', name: '30天坚持' },
    { days: 60, icon: '🥈', name: '60天坚持' },
    { days: 100, icon: '🏅', name: '100天坚持' }
];

// ==================== 排位赛 / 游戏化体系 ====================
// 段位阶梯：每大段含 Ⅲ→Ⅱ→Ⅰ 三个小段，小段所需星数不同；最强王者无限累计
const RANKS = [
    { key: 'bronze',   name: '倔强青铜', starsPerSub: 4, icon: '🥉', color: '#b87333', cap: 60 },
    { key: 'silver',   name: '秩序白银', starsPerSub: 4, icon: '🥈', color: '#9aa7b3', cap: 80 },
    { key: 'gold',     name: '荣耀黄金', starsPerSub: 5, icon: '🥇', color: '#e6b422', cap: 100 },
    { key: 'platinum', name: '尊贵铂金', starsPerSub: 5, icon: '💎', color: '#2bb6c4', cap: 120 },
    { key: 'diamond',  name: '永恒钻石', starsPerSub: 5, icon: '🔷', color: '#4aa3ff', cap: 120 },
    { key: 'star',     name: '至尊星耀', starsPerSub: 6, icon: '⭐', color: '#a86bff', cap: 120 },
    { key: 'king',     name: '最强王者', starsPerSub: 0, icon: '👑', color: '#ff4d4f', cap: 120 }
];
const ROMAN = ['Ⅲ', 'Ⅱ', 'Ⅰ']; // 小段显示（从高到低）
// 预计算每小段的起始星数（累计）
const RANK_TIERS = (() => {
    const tiers = [];
    let cursor = 0;
    for (const r of RANKS) {
        const title = (LEVELS.find(l => l.prefix === r.name) || {}).title || '';
        if (r.key === 'king') {
            tiers.push({ rankKey: r.key, rankName: r.name, roman: '', startStars: cursor, endStars: Infinity, starsToNext: null, icon: r.icon, color: r.color, title });
            break;
        }
        for (let s = 2; s >= 0; s--) {
            tiers.push({
                rankKey: r.key, rankName: r.name, roman: ROMAN[s],
                startStars: cursor, endStars: cursor + r.starsPerSub,
                starsToNext: r.starsPerSub, icon: r.icon, color: r.color, title
            });
            cursor += r.starsPerSub;
        }
    }
    return tiers;
})();
const KING_START = RANK_TIERS[RANK_TIERS.length - 1].startStars; // 87

// 星能：满 100 自动加 1 颗星（受上限约束，低段位上限<100 故无法触发）
const COURAGE_STAR = 100;
const COURAGE_PER_ITEM = 5;
const COURAGE_ALL4_BONUS = 10;

// 每日习惯完成度奖励（打卡是本分，完成度才是激励）
const DAILY_HALF_BONUS = 5;   // 完成过半
const DAILY_FULL_BONUS = 10;  // 全部完成

// 连胜加星（按全局连续打卡天数）
const WIN_STREAK_STARS = { 3: 1, 7: 2, 14: 3, 30: 5 };

// 赛季：3 个月一赛季
const SEASONS = [
    { key: 'spring', name: '春赛季', months: [3, 4, 5] },
    { key: 'summer', name: '夏赛季', months: [6, 7, 8] },
    { key: 'autumn', name: '秋赛季', months: [9, 10, 11] },
    { key: 'winter', name: '冬赛季', months: [12, 1, 2] }
];
// 赛季结算奖励（按本赛季最高段位）
const SEASON_REWARDS = {
    bronze:   { points: 50,   title: '' },
    silver:   { points: 100,  title: '白银战士' },
    gold:     { points: 200,  title: '黄金斗士' },
    platinum: { points: 400,  title: '铂金精英' },
    diamond:  { points: 600,  title: '钻石王者' },
    star:     { points: 800,  title: '星耀传说' },
    king:     { points: 1000, title: '最强王者' }
};
// 段位继承：新赛季开始时直接落到目标段位
// 规则：王者/星耀/钻石 掉 2 个大段；黄金/铂金/白银 掉 1 个大段；青铜不变
const INHERIT_TARGET = {
    bronze: 'bronze',   // 不变
    silver: 'bronze',   // 白银 → 青铜
    gold: 'silver',     // 黄金 → 白银
    platinum: 'silver', // 铂金 → 白银
    diamond: 'gold',    // 钻石 → 黄金
    star: 'platinum',   // 星耀 → 铂金
    king: 'diamond'     // 王者 → 钻石
};

// 成就定义（非重复类在此统一判定；重复类「一日圆满」单独处理）
const ACHIEVEMENTS = [
    { id: 'rookie', cat: '打卡达人', name: '初出茅庐', title: '初心者',   desc: '累计打卡 7 天',        reward: 20,  check: c => c.totalDays >= 7 },
    { id: 'steel',  cat: '打卡达人', name: '百炼成钢', title: '百炼成钢', desc: '累计打卡 100 天',       reward: 100, check: c => c.totalDays >= 100 },
    { id: 'week7',  cat: '连续王者', name: '七日之约', title: '七日之约', desc: '连续打卡 7 天',         reward: 30,  check: c => c.streak >= 7 },
    { id: 'day100', cat: '连续王者', name: '百日筑基', title: '百日筑基', desc: '连续打卡 100 天',       reward: 200, check: c => c.streak >= 100 },
    { id: 'master', cat: '全能选手', name: '全能大师', title: '全能大师', desc: '累计 30 天完成全部习惯', reward: 150, check: c => c.allFourDays >= 30 },
    { id: 'dawn',   cat: '早起冠军', name: '黎明破晓', title: '黎明破晓', desc: '连续 7 天 8:00 前首卡',  reward: 50,  check: c => c.earlyStreak >= 7 },
    { id: 'plat',   cat: '段位荣耀', name: '铂金之路', title: '铂金之路', desc: '首次达到铂金段位',      reward: 100, check: c => isHigher(c.tierKey, 'silver') && (c.tierKey === 'platinum' || isHigher(c.tierKey, 'platinum')) },
    { id: 'king',   cat: '段位荣耀', name: '登顶王者', title: '登顶王者', desc: '首次达到最强王者',      reward: 300, check: c => c.tierKey === 'king' },
    { id: 'brave',  cat: '隐藏成就', name: '星能之心', title: '星能之心', desc: '用星能白嫖 3 颗星',  reward: 50,  check: c => c.courageStars >= 3 }
];

const BOOKS = [
    {
        title: '认知觉醒',
        author: '周岭',
        platform: '微信读书 / 喜马拉雅',
        desc: '从大脑结构出发，解释焦虑、耐心与专注力的底层逻辑，帮你建立可执行的成长路径。',
        deepRead: '《认知觉醒》的核心是：人脑由本能脑、情绪脑和理智脑叠加而成。焦虑源于想同时做很多事、又想立刻看到效果；耐心不是毅力的结果，而是目光的长远。书中提出「元认知」——站在高处审视自己的念头，用「缝接知识」把新信息与旧经验挂钩，再配合「番茄钟+输出」把模糊的情绪变成清晰的行动。读完最大的改变是：不再逼自己自律，而是设计一个让好习惯更容易发生的环境。\n\n首先，我们得理解大脑的三重结构。本能脑诞生于约3.6亿年前，负责呼吸、心跳、饥饿、恐惧等最原始的生存反应，它的反应速度极快，不需要思考。情绪脑大约出现在2亿年前，让哺乳动物拥有了情感、记忆和社群行为，它让我们趋利避害，也让我们在舒适区里流连忘返。而理智脑，也就是前额叶皮层，直到约250万年前才开始发育，它负责语言、逻辑、规划、抽象思维，是人类独有的高级认知能力。问题是，理智脑虽然聪明，但力量远远弱于本能脑和情绪脑。如果把大脑比作一家公司，本能脑和情绪脑是资深老员工，占据着大部分资源和决策权；理智脑则是新来的CEO，空有头衔，常常指挥不动。这就是为什么我们明明想学习，却忍不住刷手机；明明知道要早睡，却在短视频里熬到半夜。不是因为我们意志力差，而是因为理智脑在原始欲望面前真的还很弱小。\n\n理解了这一点，我们就能放下对自己的苛责。真正的自律，不是用理智脑去压制本能脑和情绪脑，而是学会与它们合作。一个有效的方法，就是给理智脑争取时间。当冲动来临时，不要立刻行动，而是先暂停几秒，让理智脑有机会介入。这几秒钟，就是元认知启动的窗口。元认知，简单来说就是「对自己的思考过程进行思考」。它让我们从自动驾驶模式中抽离出来，像旁观者一样观察自己：我现在为什么想刷手机？是因为无聊、焦虑，还是单纯的习惯？这件事真的对我重要吗？当我有了这样的觉察，选择就变得更加自由。\n\n书中还有一个让我印象深刻的概念：模糊是行动力的大敌。我们拖延，很多时候不是因为任务太难，而是因为任务太模糊。比如「我要学英语」就是一个模糊的目标，大脑不知道从何开始，于是本能脑就选择逃避。而「今晚8点到8点半，我要用APP背20个四级单词，并跟读例句」就是一个清晰的目标，它告诉大脑具体的时间、地点、动作和标准。把模糊变成清晰，是克服拖延的关键一步。这也是为什么打卡和记录如此有效——它们把抽象的愿望转化为具体的行动痕迹。\n\n关于焦虑，周岭给出了一个精准的画像：焦虑的本质，是欲望大于能力，又极度缺乏耐心。我们想同时做很多事，又想立刻看到效果。看到别人健身三个月练出马甲线，就希望自己也能；看到别人靠副业月入过万，就怀疑自己是不是选错了路。社交媒体把这种「即时比较」放大到了极致，让每个人都活在别人的高光时刻里。破解焦虑的方法，不是压抑欲望，而是降低期待、拉长周期。书中引用了一个复利曲线：在很长一段时间里，成长看起来几乎是平的，但到达某个拐点后，会突然加速。大多数人都在拐点前放弃，然后告诉自己「我不适合」。其实，不是不适合，只是还没熬到拐点。\n\n那么，如何培养耐心？周岭提出了几个非常实用的方法。第一，面对天性，放下心理包袱，坦然接纳自己。第二，面对诱惑，学会延迟满足，变对抗为沟通。比如你可以对自己说：「看完这章书，再去刷10分钟手机。」第三，面对困难，主动改变视角，赋予行动意义。当你明白背单词是为了将来能看懂原声电影、能自信地出国旅行，而不是为了完成打卡，动力就会完全不同。\n\n此外，书中还强调了「缝接知识」的重要性。我们读了很多书、听了很多课，但生活似乎没有改变，原因之一是知识没有和已有经验连接起来。真正有效的学习，是在接触到一个新概念后，主动问自己：这个道理还能用在什么地方？我以前哪里有过类似的经历？把它写下来、讲给别人听、在实践中用一次，知识才真正属于你。这也是「费曼学习法」的精髓。\n\n最后，我想谈谈环境设计。我们总以为改变人是靠意志力，其实改变环境要容易得多。想多喝水，就把水杯放在手边；想多读书，就把手机放在另一个房间；想早起，就把闹钟放在必须下床才能关掉的地方。当你让好习惯变得容易，让坏习惯变得困难，坚持就不再是煎熬，而是一种自然流动。成长不是一场苦修，而是一场精心设计的旅程。当我们学会认识自己、理解大脑、清晰目标、耐心积累，改变就会像春天的种子一样，在不知不觉中破土而出。'
    },
    {
        title: '被讨厌的勇气',
        author: '岸见一郎 / 古贺史健',
        platform: '微信读书',
        desc: '阿德勒心理学入门，用「课题分离」告诉你：别人怎么看你，是别人的课题。',
        deepRead: '《被讨厌的勇气》是一本用对话体写就的阿德勒心理学入门书。全书围绕一位困惑的青年和一位智慧的哲人展开，青年不断提出对生活、人际、自我的疑问，哲人则用阿德勒的理论一一回应。阿德勒与弗洛伊德最大的不同在于，他反对「原因论」——即认为现在的痛苦是由过去的心理创伤造成的。相反，阿德勒主张「目的论」：一个人之所以痛苦，往往是因为他从痛苦中获得了某种好处，或者痛苦帮助他逃避了某些他不想面对的事情。比如，一个人因为童年被忽视而害怕社交，原因论会说他现在的退缩是过去的创伤所致；但阿德勒会问：他之所以选择不社交，是不是因为这样可以避免被拒绝、不用承担失败的风险？这不是在责怪受害者，而是在提醒我们：人永远有选择的自由，即使选择停留在痛苦里，也是一种选择。\n\n书中最重要的概念之一是「课题分离」。阿德勒认为，世界上几乎所有的人际烦恼，都源于我们干涉了别人的课题，或者让别人干涉了自己的课题。什么是自己的课题？就是那些最终后果由自己承担的事情。比如，你努力工作、真诚待人，这是你的课题；而别人是否喜欢你、是否认可你，那是别人的课题，你无权控制，也不应为此焦虑。当你能够清晰地区分这两者，内心就会获得一种前所未有的轻盈。你不再需要讨好所有人，不再因为别人的一个眼神、一句评价就患得患失。\n\n「被讨厌的勇气」这个书名听起来刺耳，但它说的并不是故意去惹人讨厌，而是不再把「被所有人喜欢」作为人生目标。当我们试图让每个人都满意时，其实是在活成别人期待的样子，而不是真实的自己。真正的自由，是在不伤害他人的前提下，坦然做自己。书中还谈到了「共同体感觉」——当我们不再只关注自己，而是把自己放在一个更大的共同体中，思考「我能为周围的人做什么」时，自我价值感会从内部生长出来，而不是依赖外界的认可。\n\n读这本书的过程，像是一次温柔的醒醐灌顶。它不会给你一碗廉价的鸡汤，而是逼你直面一个事实：你的人生，其实一直是你自己选择的。你现在的状态、你的情绪、你的人际关系，很大程度上是你一系列选择的累积。这听起来有点冷酷，但同时也意味着极大的希望——因为既然你可以选择现在的样子，你当然也可以选择另一种样子。阿德勒心理学不是让你变得冷漠自私，而是让你从无尽的自我消耗中解脱出来，把精力用在真正值得的事情上。'
    },
    {
        title: '非暴力沟通',
        author: '马歇尔·卢森堡',
        platform: '微信读书',
        desc: '观察、感受、需要、请求四步法，让表达既有力量又有温度，减少关系中的情绪内耗。',
        deepRead: '《非暴力沟通》是美国心理学家马歇尔·卢森堡博士的毕生心血。他在世界各地调解冲突、培训沟通技巧的过程中，总结出了一套简单却极其强大的表达方法。书名里的「非暴力」并不是指不吵架那么简单，而是指一种不含攻击、评判、指责的沟通方式。我们日常说话中充满了暴力：「你怎么总是这样？」「你从来不考虑我的感受。」「你就是太自私了。」这些话听起来是在表达不满，实际上却是在给对方贴标签、下定义，对方听了自然会防御、反击，沟通也就变成了战争。\n\n卢森堡把非暴力沟通分为四个步骤：观察、感受、需要、请求。观察是指说出你看到的事实，而不加入任何评价。比如「你这周有三天没洗碗」是观察，「你太懒了」是评论。感受是指表达你此刻真实的情绪，比如「我感到失望」「我感到孤单」「我感到担心」，而不是「我觉得你不在乎我」——后者其实还是一种评判。需要是指你内心真正看重的东西，比如秩序、尊重、陪伴、安全感。请求是指你希望他具体做什么，而且要明确、可执行、可协商。比如「我希望你今晚能把碗洗了」是请求，「我希望你改改你的毛病」则是模糊的命令。\n\n这四个步骤看似简单，实践起来却需要极大的自我觉察。因为我们从小就习惯了用评判代替观察，用指责代替表达，用命令代替请求。非暴力沟通要求我们慢下来，先看见自己的情绪，再看见情绪背后的需要。很多时候，我们并不是真的想伤害对方，而是希望被理解、被重视、被关爱。但当我们用攻击的方式表达时，对方只能接收到攻击，而接收不到爱。\n\n这本书特别适合那些总在亲密关系、亲子关系或职场中感到挫败的人。你会发现，很多争吵的根本原因不是谁对谁错，而是双方都没有被真正听见。非暴力沟通教我们做一个好的倾听者——在对方表达愤怒、委屈、焦虑时，不急着反驳、给建议、讲道理，而是试着去理解对方的感受和需要。当一个人感到被理解时，他的情绪会自然软化，解决问题的空间也就打开了。卢森堡说：「语言是窗，也可以是墙。」学会非暴力沟通，就是把一堵堵墙变成一扇扇窗，让爱和理解重新流动起来。'
    },
    {
        title: '也许你该找个人聊聊',
        author: '洛莉·戈特利布',
        platform: '微信读书 / 喜马拉雅',
        desc: '心理治疗师的真实咨询记录，关于痛苦、改变与成长，温暖得像一场深夜长谈。',
        deepRead: '《也许你该找个人聊聊》是美国心理治疗师洛莉·戈特利布写的一本心理咨询实录。它不是一本枯燥的心理学教材，而是一部充满人性温度的故事集。洛莉在书中不仅记录了四位来访者的咨询过程，也坦诚地写到了她自己因为失恋而去做心理咨询的经历。这种双重视角让读者既能看到治疗室里发生了什么，也能理解治疗师作为一个普通人，同样会经历痛苦、迷茫和脆弱。\n\n书中的四位来访者各有不同的困境。约翰是一位好莱坞编剧，外表成功、言辞刻薄，内心却承受着丧子之痛和深深的孤独；朱莉是一位年轻的大学教授，刚刚结婚却被诊断出绝症，她要在有限的时间里学会如何告别；夏洛特是一位二十多岁的女孩，反复陷入糟糕的亲密关系，她渐渐意识到这与她混乱的原生家庭有关；瑞塔是一位六十九岁的老人，一生充满遗憾，她想在生命的最后阶段寻找一点点快乐。每一个人都带着自己的故事走进治疗室，而洛莉所做的，不是给他们答案，而是陪他们一起面对那些不敢触碰的情绪。\n\n这本书最核心的观点是：痛苦不会因为被否认而消失，只会因为被承认而转化。我们很多人从小被教导要坚强、要乐观、要向前看，于是学会了压抑、回避、假装没事。但情绪就像水，堵不如疏。当一个人在安全的关系中，终于可以说出「我很害怕」「我很愤怒」「我很孤独」时，改变就已经开始了。心理咨询的神奇之处不在于治疗师说了什么金玉良言，而在于来访者第一次感到：原来我的感受是被允许的，原来我不是一个人在面对这些。\n\n洛莉还写到了心理咨询的另一个真相：治疗师并不会比你更懂你的人生。真正能带来改变的，是来访者愿意诚实面对自己。很多时候，我们之所以被困住，是因为我们一直在问错误的问题。比如「为什么这件事会发生在我身上？」不如问「这件事教会了我什么？」「我怎么才能带着这份痛苦继续生活？」改变往往不是惊天动地的，而是在一次次对话、一次次回望、一次次 tiny 的选择中，慢慢长出一个新的自己。这本书像一位温柔的朋友，适合在情绪低落的夜晚读，它会告诉你：没关系，你可以不用一直坚强。'
    },
    {
        title: '与生命和解',
        author: '叶檀',
        platform: '微信读书 / 喜马拉雅',
        desc: '财经作家叶檀在重病之后的生命体悟：成年人的痛苦，往往不是不够努力，而是不会和解。',
        deepRead: '《与生命和解》是财经作家叶檀在身患癌症晚期之后写下的一本书。叶檀曾经是中国财经媒体界响当当的名字，以犀利、勤奋、高产著称，是很多人眼中的「拼命三娘」。她常年高强度工作，每天只睡四五个小时，把身体当成可以无限透支的机器。直到癌症晚期 diagnosis 像一记重锤，把她从高速运转的人生轨道上硬生生地敲了下来。这本书不是一本励志成功学，而是一位曾经极度「成功」的人，在生命被按下暂停键之后，对自己、对努力、对人生意义的重新思考。\n\n书中最刺痛人的一个观点是：长期透支式努力，不是坚强，而是慢性自杀。我们从小被教育「吃得苦中苦，方为人上人」「年轻的时候不拼，老了会后悔」。于是我们习惯了加班、熬夜、忍耐、压抑，把身体的警报当成可以忽略的背景噪音。叶檀用亲身经历戳破了这个幻象：当健康崩塌的时候，所有的成就、财富、地位都变得轻如鸿毛。她并不是在否定努力的价值，而是在提醒我们，努力需要边界，成功需要以可持续为代价。\n\n书中提出了几个令人警醒的核心认知。第一，允许人生有漏洞，是最高级的自愈。我们总想把自己活成一个没有缺点的完人，工作要出色、家庭要和睦、身材要管理、社交要得体。但完美是一个陷阱，它让我们永远在追赶，永远觉得自己不够好。叶檀说，承认自己有做不到的事、有搞砸的时候、有需要休息的时刻，反而是一种成熟。第二，真正的成长是学会踩刹车。年轻时我们学会的是踩油门，追求更快、更高、更强；但人生到了某个阶段，我们必须学会踩刹车，知道什么时候该停、该退、该放弃。第三，别拿透支当努力。努力是良性的、可持续的投入，透支则是以牺牲未来为代价的短期爆发。很多人把透支误认为努力，最后身体和心灵一起崩溃。\n\n读完这本书最大的感受是：人生是场马拉松，续航比速度重要。叶檀在经历了生死考验之后，不再追求那种燃烧式的辉煌，而是学会了与生命和解、与身体和解、与情绪和解、与不完美的自己和解。这种和解不是消极认命，而是一种更高级的智慧——在认清生活的真相之后，依然热爱生活，但不再用消耗自己的方式去证明什么。对于每一个在快节奏里奔跑的人来说，这本书都是一记温柔的提醒：你可以努力，但请不要忘了，你之所以要努力，是为了更好地活着。'
    },
    {
        title: '活着',
        author: '余华',
        platform: '微信读书',
        desc: '福贵跌宕的一生，写尽苦难里那点不肯熄的活着的念头，平静处最戳心。',
        deepRead: '《活着》是余华的代表作，也是中国当代文学中最令人难忘的作品之一。小说讲述了福贵这个地主少爷跌宕起伏的一生。他年轻时荒唐败家，赌光了全部家产，父亲因此被气死；后来被抓去当兵，母亲也在他离家期间病逝。战争结束后回到家乡，福贵本想好好过日子，却接连遭遇人生的重创：儿子有庆为救人抽血过多而死，女儿凤霞难产而死，妻子家珍积劳成疾而死，女婿二喜在工地出意外而死，就连年幼的外孙苦根，也因为吃豆子太多被撑死了。最后，福贵只剩下了一头老牛，和他一样老、一样孤独。\n\n这本书最厉害的地方，是余华几乎没有用任何煽情的笔法，却让人读得眼眶发热。他的叙述冷静、克制，甚至近乎冷淡，仿佛苦难只是生活里一件又一件寻常事。但也正是这种冷淡，让福贵的悲剧具有了某种近乎宗教般的庄严感。余华要写的不是一个人的苦难，而是中国人千百年来在土地上、在时代洪流中，那种沉默而坚韧的生命力。福贵没有怨天尤人，没有以死相抗，他只是活着，像一根野草，被风吹倒，又自己站起来。\n\n书中最著名的一句话是：「人是为了活着本身而活着，而不是为了活着之外的任何事物。」这句话初读让人觉得有些消极，但细想却蕴含着巨大的力量。福贵的一生失去了几乎所有值得留恋的东西，但他依然活着。这不是因为他还有什么伟大的目标要实现，而是因为活着本身就是一种力量、一种本能、一种对命运最沉默也最倔强的回应。他不需要用成功、财富、名声来证明活着的意义，活着本身就是意义。\n\n读《活着》，我们不会学到如何成功，但会重新敬畏「好好活着」这四个字。现代社会总是鼓励我们追求更多、更快、更好，让我们误以为活着的意义在于不断地获取。但福贵告诉我们，活着本身就已经是一种胜利。当你感到疲惫、焦虑、觉得生活没有意义的时候，读一读这本书，你会意识到：能平平安安地活着，能吃饭、睡觉、感受阳光和风，本身就是一种莫大的幸运。这种认知不会让我们变得消极，反而会让我们从无尽的欲望中解脱出来，珍惜眼前最朴素的人和事。'
    },
    {
        title: '蛤蟆先生去看心理医生',
        author: '罗伯特·戴博德',
        platform: '微信读书',
        desc: '用童话外衣讲透心理咨询：你的情绪，大多来自童年埋下的「人生坐标」。',
        deepRead: '《蛤蟆先生去看心理医生》是英国心理学家罗伯特·戴博德写的一本心理咨询入门书。它借用了《柳林风声》里的人物，把深奥的心理学理论包装成一个温暖好读的童话。故事的主角蛤蟆先生原本是一个热情、爱冒险、喜欢吹牛的人，但突然有一天他陷入了深深的抑郁，什么都不想做，只想躲起来。朋友们担心他，建议他去看心理医生苍鹭。于是，蛤蟆先生开始了十次心理咨询，也开始了重新认识自己的旅程。\n\n书中最核心的概念是「人生坐标」和「三种自我状态」。苍鹭医生告诉蛤蟆，我们每个人在童年时期都会形成一种对自己、对他人、对世界的基本看法，这就是「人生坐标」。比如「我不好，你好」的人会觉得自己很糟糕，别人都很好，因此容易自卑、讨好；「我好，你不好」的人则会觉得自己高人一等，容易挑剔、指责别人。蛤蟆先生发现自己长期活在「我不好，你好」的坐标里，总是把别人的需求放在前面，压抑自己的愤怒和委屈，久而久之就失去了生命力。\n\n三种自我状态则是「儿童自我状态」「父母自我状态」和「成人自我状态」。儿童自我状态是指我们在压力下会退回到小时候的行为模式，比如讨好、逃避、愤怒；父母自我状态是指我们内化了父母或权威人物的声音，对自己或他人挑剔、说教；成人自我状态则是我们能基于当下的现实，理性地思考、感受和行动。苍鹭医生说，真正的心理成长，就是从儿童和父母自我状态里走出来，更多地活在成人自我状态中。这不是要否定我们的过去，而是要学会不被过去绑架。\n\n这本书最打动人的地方，是它让我们看到：很多成年后的情绪问题，根源都在童年。但更重要的不是去怪罪父母，而是意识到——现在的你已经长大了，有能力为自己的人生负责。蛤蟆先生在咨询的最后，不再等待别人来拯救他，而是开始主动做出选择，规划自己的生活。这种转变看似微小，却是一个人真正成熟的标志。看懂这本书，就像上了十节心理课，但它比任何课程都更温柔、更贴近人心。'
    },
    {
        title: '小王子',
        author: '圣埃克苏佩里',
        platform: '微信读书',
        desc: '写给大人的童话：真正重要的东西，用眼睛是看不见的。',
        deepRead: '《小王子》是法国作家圣埃克苏佩里写的一本薄薄的小书，却被誉为写给大人的童话。故事很简单：一位飞行员因为飞机故障迫降在撒哈拉沙漠，在那里他遇到了来自另一个星球的小王子。小王子讲述了自己的旅程：他离开了自己的星球，因为他和一朵骄傲的玫瑰闹了别扭；他访问了六个星球，遇到了国王、虚荣的人、酒鬼、商人、点灯人、地理学家，这些人代表了成人世界里的各种荒诞；最后他来到地球，在沙漠里遇到了狐狸，懂得了什么是「驯养」，也明白了自己对玫瑰的爱。\n\n书中最著名的句子是：「真正重要的东西，用眼睛是看不见的，只有用心才能看见。」这句话贯穿全书，也是它最深邃的哲思。小王子在他的星球上种了一朵玫瑰，这朵玫瑰骄傲、虚荣、爱撒娇，总是让他烦恼。但当他看到地球上成千上万的玫瑰时，他却哭了，因为他发现，自己那朵普通的玫瑰，因为被他浇灌、被他放在玻璃罩里、被他倾听过抱怨，而成为了世界上独一无二的存在。这不是因为玫瑰本身有多特别，而是因为他为她付出了时间和感情。\n\n狐狸教会了小王子「驯养」的含义。驯养就是建立联系，就是彼此需要，就是在千千万万的人当中，你们因为共同的经历而变得对彼此有意义。狐狸说：「你下午四点来，那么从三点起，我就开始感到幸福。」这种对关系的期待、对牵挂的珍视，是成人世界里最容易被忽略的东西。我们越来越忙，越来越习惯用效率、利益、数字去衡量一切，却忘了人与人之间最重要的，恰恰是那些没有用的、无法量化的时间。\n\n《小王子》还是一面镜子，照出了成人世界的荒谬。国王追求权力，却统治着一个空无一人的星球；虚荣的人只爱听赞美；酒鬼喝酒是为了忘记喝酒的羞愧；商人把星星当成财产，一辈子数也数不清；地理学家只记录别人告诉他的事情，却从不亲自去看。这些人物让我们会心一笑，因为他们就生活在我们身边，有时候甚至就是我们自己。这本书提醒我们，不要变成那种只看数字、只讲效率、不再感受的大人。保留一份孩子式的真诚、好奇和对美的敏感，是我们对抗世界粗糙的方式。睡前翻几页，心会软下来。'
    },
    {
        title: '人类简史',
        author: '尤瓦尔·赫拉利',
        platform: '微信读书',
        desc: '从认知革命到智人统治世界，一本书刷新你对「人类为何如此」的认知。',
        deepRead: '《人类简史》是以色列历史学家尤瓦尔·赫拉利写的一本宏大叙事作品。他从大约七万年前的认知革命开始，一路讲到农业革命、人类社会的形成、帝国的崛起、宗教的传播、科学革命、资本主义、工业革命，直至当下。这本书最让人震撼的地方，不是它讲述了多么波澜壮阔的历史，而是它提供了一种全新的视角，让我们重新审视「人到底是什么」「人类社会为什么是这样」「我们为什么活得这么累」。\n\n赫拉利最核心的洞见之一是：智人之所以能够统治地球，靠的不是强壮的身体，而是「虚构故事」的能力。大约七万年前，智人的大脑发生了一次认知革命，让我们能够想象不存在的事物，能够相信共同的故事。正是这种能力，让成千上万互不相识的人能够合作。金钱、宗教、国家、法律、公司、人权，这些我们以为是天经地义的东西，其实都是人类共同相信的「想象的现实」。一张钞票本身只是一张纸，但因为我们都相信它能换来东西，它就有了力量；一个国家本身没有实体，但因为我们都认同它的存在，它就能组织军队、征收税收。这个观点看似颠覆，却能解释很多社会现象：为什么不同文化会有不同的价值观？为什么战争和贸易都能被正当化？因为人类一直在为不同的故事而战。\n\n书中另一个著名的观点是：农业革命可能是「史上最大的骗局」。在农业出现之前，人类以采集狩猎为生，虽然生活不稳定，但平均每天工作时间更短，饮食更多样，身体也更健康。农业革命让人类能够生产更多食物，养活了更多人口，却也让人类被土地束缚，工作更辛苦，饮食更单一，社会不平等加剧。赫拉利说，不是人类驯化了小麦，而是小麦驯化了人类——我们为了照顾小麦，改变了生活方式、社会组织，甚至身体结构。这个视角提醒我们，进步并不总是带来幸福，效率的提升不一定意味着生活质量的提升。\n\n读到后面，赫拉利抛出了一个对现代人非常尖锐的问题：科技进步让我们拥有了前所未有的能力，但我们真的更幸福了吗？我们拥有了飞机、互联网、智能手机，可以随时联系任何人，获取任何信息，但我们同时也更焦虑、更孤独、更累了。赫拉利没有给出简单答案，但他让我们看到：人类一直以为自己能控制历史的方向，其实很多时候是技术和社会制度在推动着我们往前走。读这本书，你会跳出日常琐碎，用百万年的尺度重新看自己此刻的焦虑。那些让你彻夜难眠的事情，放在人类历史的尺度上，也许真的没那么重要。这种认知不是消极，而是一种解脱——让我们能够更清醒、更从容地活在当下。'
    }
];

const ENGLISH_VIDEOS = [
    { title: 'How to speak so that people want to listen', source: 'TED', link: 'https://www.bilibili.com/video/BV1Ax41117Tz', desc: 'Julian Treasure 教你说话的七大罪与四大基石，练习听力与表达节奏。' },
    { title: 'The power of vulnerability', source: 'TED', link: 'https://www.bilibili.com/video/BV1Ds411q7mz', desc: 'Brené Brown 关于脆弱与勇气的经典演讲，语速适中，适合反复跟读。' },
    { title: '每日英语听力 · 地道表达', source: '每日英语听力 App', link: 'https://dict.eudic.net/', desc: '通勤精听 + 跟读打分，从短句过渡到日常对话。' },
    { title: 'BBC 6 Minute English', source: 'B站 / 每日英语听力', link: 'https://www.bilibili.com/video/BV1c7411K7Lp', desc: '6 分钟一个话题，词汇贴近生活，适合培养英语思维。' }
];

// 每日口语一句：按日期轮换，避免每天都是同一句
const ENGLISH_SENTENCES = [
    { en: "How's it going?", zh: '最近怎么样？', ex: "A: Hey, how's it going? B: Pretty good, thanks! How about you?" },
    { en: "I'm down for that.", zh: '我同意 / 我乐意', ex: "A: Wanna grab coffee later? B: Sure, I'm down for that." },
    { en: "It's on me.", zh: '这顿我请 / 我来买单', ex: "A: Let's have dinner. B: Great, it's on me this time." },
    { en: "No big deal.", zh: '没什么大不了的 / 别在意', ex: "A: Sorry I'm late. B: No big deal, we just started." },
    { en: "That makes sense.", zh: '有道理 / 说得通', ex: "A: We should leave early to avoid traffic. B: That makes sense." },
    { en: "I'll take a rain check.", zh: '改天吧（婉拒）', ex: "A: Join us tonight? B: I'll take a rain check, busy week." }
];

const FLUCTUATION_TIPS = [
    '体重上涨1斤不一定是胖了，可能是肌肉糖原储水。看趋势，不看单点。',
    '姨妈期前后水分波动2-3斤很正常，别被数字吓到。',
    '昨晚吃咸了、睡得晚、压力大，都会让体重暂时上浮。',
    '脂肪不会一天长出来，也不会一天消失，坚持记录就能看到真实趋势。',
    '体重不变但围度变小，说明体脂率在下降，这是更好的信号。'
];

// 全局状态
const state = {
    currentModule: 'home',
    currentSubTab: {},
    _checkinMode: null,
    _checkinSelected: new Set(),
    _collapsedCategories: new Set(),
    _collapsedOther: new Set(),
    _checkInModule: 'basic',
    _waterMode: null,
    _waterSelected: new Set(),
    settings: {
        name: '顾一',
        city: '成都',
        supabaseUrl: '',
        supabaseKey: '',
        syncSpaceId: '',
        exchangeRule: '',
        theme: 'light'
    },
    data: {
        waterLogs: [],
        waterGoal: 1500,
        checkIns: [],
        points: { earned: 0, used: 0, history: [] },
        makeupLog: {},
        wishes: [],
        wishBin: [],
        praises: [],
        userQuotes: [],
        quoteGroups: [],
        dailyQuote: null,
        hotCache: {},
        apiCache: {},
        memo: '',
        checkInBin: [],
        dailyPlans: {},
        lastSyncAt: null,
        lastVisit: null,
        categories: null,
        categoryOrder: null,
        beautyInspirations: []
    },
    supabase: null,
    syncStatus: 'offline',
    _undo: null
};

// ==================== 工具函数 ====================
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function today() {
    return dateStr(new Date());
}

function dateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function now() {
    return new Date().toISOString();
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return `${dateStr} ${week}`;
}

function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatMonthLabel(iso) {
    const d = new Date(iso || now());
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
}

// 通用弹窗：替代 window.confirm / window.prompt，移动端（尤其 iOS Safari）稳定可用。
// confirm 场景返回 Promise<boolean>；prompt 场景返回 Promise<string|null>。
function uiModal(opts) {
    return new Promise(resolve => {
        const modal = document.getElementById('uiModal');
        const titleEl = document.getElementById('uiModalTitle');
        const msgEl = document.getElementById('uiModalMsg');
        const inputEl = document.getElementById('uiModalInput');
        const okBtn = document.getElementById('uiModalOk');
        const cancelBtn = document.getElementById('uiModalCancel');
        if (!modal || !okBtn || !cancelBtn) { resolve(opts.input ? null : false); return; }
        titleEl.textContent = opts.title || '';
        msgEl.textContent = opts.message || '';
        if (opts.input) {
            inputEl.style.display = '';
            inputEl.value = opts.defaultValue != null ? String(opts.defaultValue) : '';
            inputEl.placeholder = opts.placeholder || '';
        } else {
            inputEl.style.display = 'none';
            inputEl.value = '';
        }
        okBtn.textContent = opts.okText || '确定';
        cancelBtn.textContent = opts.cancelText || '取消';
        okBtn.classList.toggle('btn-danger', !!opts.isDanger);
        modal.style.display = 'flex';
        if (opts.input) setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
        const cleanup = () => {
            modal.style.display = 'none';
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            modal.onclick = null;
            inputEl.onkeydown = null;
        };
        const onOk = () => {
            const v = opts.input ? inputEl.value : true;
            cleanup();
            resolve(opts.input ? v : true);
        };
        const onCancel = () => { cleanup(); resolve(opts.input ? null : false); };
        okBtn.onclick = onOk;
        cancelBtn.onclick = onCancel;
        modal.onclick = (e) => { if (e.target === modal) onCancel(); };
        inputEl.onkeydown = (e) => { if (e.key === 'Enter') onOk(); if (e.key === 'Escape') onCancel(); };
    });
}
function uiConfirm(message, opts = {}) { return uiModal({ title: opts.title, message, okText: opts.okText, cancelText: opts.cancelText, isDanger: opts.isDanger }); }
function uiPrompt(message, defaultValue, opts = {}) { return uiModal({ title: opts.title, message, input: true, defaultValue, placeholder: opts.placeholder, okText: opts.okText }); }

// 玩家上线提示：每次刷新进入页面弹出「玩家 [xx] 已上线 🕹️」
function showPlayerOnline() {
    const el = document.getElementById('playerOnline');
    if (!el) return;
    const name = (state.settings.name || '顾一').trim() || '顾一';
    const txt = document.getElementById('playerOnlineText');
    if (txt) txt.textContent = `玩家 ${name} 已上线 🕹️`;
    el.classList.add('show');
    const timer = setTimeout(() => el.classList.remove('show'), 2800);
    el.onclick = () => { clearTimeout(timer); el.classList.remove('show'); };
}

// 成就徽章弹窗（如：Tomorrow Unlocked 明日已解锁）
function showAchievementBadge(title, sub, emoji) {
    const el = document.getElementById('achievementBadge');
    if (!el) return;
    if (title) { const t = document.getElementById('achievementBadgeTitle'); if (t) t.textContent = title; }
    if (sub) { const s = document.getElementById('achievementBadgeSub'); if (s) s.textContent = sub; }
    if (emoji) { const e = document.getElementById('achievementBadgeEmoji'); if (e) e.textContent = emoji; }
    el.classList.add('show');
    const timer = setTimeout(() => el.classList.remove('show'), 3800);
    el.onclick = () => { clearTimeout(timer); el.classList.remove('show'); };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getDailyIndex(arr) {
    const d = new Date();
    return (d.getFullYear() * 366 + (d.getMonth() + 1) * 31 + d.getDate()) % arr.length;
}

function getLunarDate(date) {
    if (typeof Lunar !== 'undefined') {
        try {
            const lunar = Lunar.fromDate(date || new Date());
            return `农历 ${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
        } catch (e) {}
    }
    return '';
}

function getLunarDateShort(date) {
    if (typeof Lunar !== 'undefined') {
        try {
            const lunar = Lunar.fromDate(date || new Date());
            return `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
        } catch (e) {}
    }
    return '';
}

function cacheKey(name, extra) {
    return `${name}:${extra || ''}`;
}

function getCache(name, extra, ttlMinutes = 120) {
    const key = cacheKey(name, extra);
    const item = state.data.apiCache[key];
    if (!item) return null;
    const age = Date.now() - item.ts;
    if (age > ttlMinutes * 60 * 1000) {
        delete state.data.apiCache[key];
        return null;
    }
    return item.data;
}

function setCache(name, extra, data) {
    state.data.apiCache[cacheKey(name, extra)] = { ts: Date.now(), data };
}

// ==================== 持久化与同步 ====================
function loadState() {
    try {
        const saved = localStorage.getItem('growtree_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.settings = { ...state.settings, ...parsed.settings };
            state.data = { ...state.data, ...parsed.data };
        }
        // 兼容旧设置：补全新增字段
        if (state.settings.exchangeRule === undefined) state.settings.exchangeRule = '';
        migrateData();
        ensureDefaults();
        recalcPoints();
        recalcCourage();
    } catch (e) {
        console.error('加载状态失败', e);
    }
}

function migrateData() {
    // settings 字段兼容
    state.settings.syncSpaceId = state.settings.syncSpaceId || '';
    // 模块列表（名称/图标/显隐/顺序）默认从静态 MODULES 初始化一次，之后由用户在设置里管理
    if (!Array.isArray(state.data.modules) || !state.data.modules.length) {
        state.data.modules = getDefaultModules();
    }

    // 老版 points.total 是可用积分，无 earned 字段
    if (state.data.points && typeof state.data.points.earned === 'undefined') {
        const oldTotal = state.data.points.total || 0;
        const oldUsed = state.data.points.used || 0;
        state.data.points.earned = oldTotal + oldUsed;
        delete state.data.points.total;
    }
    state.data.points = state.data.points || { earned: 0, used: 0, history: [] };
    if (!Array.isArray(state.data.points.history)) state.data.points.history = [];
    state.data.makeupLog = state.data.makeupLog || {};
    state.data.wishBin = state.data.wishBin || [];
    state.data.hotCache = state.data.hotCache || {};
    state.data.apiCache = state.data.apiCache || {};
    // 兼容老版：把静态默认分类迁移到用户可管理的 categories
    if (!state.data.categories || !Object.keys(state.data.categories).length) {
        state.data.categories = { ...DEFAULT_CHECKIN_CATEGORIES };
        state.data.categoryOrder = [...DEFAULT_CATEGORY_ORDER];
    }
    // 旧版四板块（健康/变美/学习/其他）→ 新版三板块（基础打卡项/日常习惯/其他打卡项）
    if (state.data.categories && Object.keys(state.data.categories).length === 4 &&
        OLD_DEFAULT_CATS.health === state.data.categories.health &&
        OLD_DEFAULT_CATS.beauty === state.data.categories.beauty &&
        OLD_DEFAULT_CATS.study === state.data.categories.study &&
        OLD_DEFAULT_CATS.hot === state.data.categories.hot) {
        // 用户自定义（非旧默认名单）的打卡项保留，归入「其他打卡项」
        const custom = state.data.checkIns.filter(c => !OLD_DEFAULT_ITEM_NAMES.includes(c.name));
        custom.forEach(c => { c.module = 'other'; c.category = '其他打卡项'; });
        state.data.checkIns = custom;
        state.data.categories = { ...DEFAULT_CHECKIN_CATEGORIES };
        state.data.categoryOrder = [...DEFAULT_CATEGORY_ORDER];
        // 随后 ensureDefaults 会按新板块补种 Excel 默认打卡项
    }
    // 兜底清理：删除任何残留的旧版默认习惯（健康/变美/学习/其他），确保只保留 Excel 三板块内容
    const oldKeys = Object.keys(OLD_DEFAULT_CATS);
    state.data.checkIns = state.data.checkIns.filter(c => !OLD_DEFAULT_ITEM_NAMES.includes(c.name) && !oldKeys.includes(c.module));
    // 清理分类：只保留当前默认三板块
    const cleanedCats = {};
    for (const k of DEFAULT_CATEGORY_ORDER) {
        if (state.data.categories[k]) cleanedCats[k] = state.data.categories[k];
        else cleanedCats[k] = DEFAULT_CHECKIN_CATEGORIES[k];
    }
    state.data.categories = cleanedCats;
    state.data.categoryOrder = [...DEFAULT_CATEGORY_ORDER];
    // 兼容老版 checkIns：补齐 category，并把三档难度转为单一可自定义积分
    state.data.checkIns.forEach(c => {
        if (!c.category) c.category = getCategories()[c.module] || '其他';
        if (typeof c.points === 'undefined') {
            if (c.tiers && c.tiers.length) {
                c.points = c.tiers.find(t => t.tier === '普通')?.points || c.tiers[0].points || 10;
            } else {
                c.points = 10;
            }
        }
    });
    state.data.checkInBin = state.data.checkInBin || [];
    state.data.userQuotes = state.data.userQuotes || [];
    state.data.dailyQuote = state.data.dailyQuote || null;
    state.data.praiseGroups = state.data.praiseGroups || [];
    state.data.quoteGroups = state.data.quoteGroups || [];
    state.data.settings = state.data.settings || { theme: state.settings && state.settings.theme ? state.settings.theme : 'light' };
    ensureGameDefaults();
}

function isQuotaError(e) {
    return e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || /quota/i.test(e.message || ''));
}

function saveState() {
    const build = () => JSON.stringify({ settings: state.settings, data: state.data });
    try {
        // 安全网：主数据接近 1.5MB 时自动清理 1 年前旧记录，避免长期使用撑满免费额度
        const est = build();
        if (est.length > 1500000) {
            const n = pruneOldData();
            if (n > 0) toast(`已自动清理 ${n} 条 1 年前的旧数据以节省云端空间`);
        }
        localStorage.setItem('growtree_state', build());
        queueSync();
    } catch (e) {
        if (isQuotaError(e)) {
            // 热榜/接口缓存可重建，先清空它们再试一次，避免整体数据丢失
            state.data.hotCache = {};
            state.data.apiCache = {};
            try {
                localStorage.setItem('growtree_state', build());
                queueSync();
                toast('本地空间不足，已清理热榜缓存，建议到设置导出备份');
                return;
            } catch (e2) {
                console.error('保存状态失败(二次)', e2);
            }
        }
        console.error('保存状态失败', e);
        toast('⚠️ 本地存储已满，部分数据可能未保存，请到设置导出备份');
    }
}

const saveStateDebounced = debounce(saveState, 600);

// 仅写本地，不触发云端上传（用于从云端拉取合并后，避免回传造成同步风暴）
function saveStateLocal() {
    try {
        localStorage.setItem('growtree_state', JSON.stringify({ settings: state.settings, data: state.data }));
    } catch (e) {
        console.error('本地保存失败', e);
    }
}

function ensureDefaults() {
    // 旧数据补全：每个打卡项默认 3 朵 🌸（坚持任务）；分数由花朵定级决定
    state.data.checkIns.forEach(c => {
        if (!c.stars) c.stars = 3;
        // 自定义积分优先；否则按花朵定级兜底（避免覆盖用户在批量积分里的设置）
        c.points = (c.customPoints != null) ? c.customPoints : flowerScore(c.stars);
    });
    // 保证默认分类存在（新用户或旧数据）
    if (!state.data.categories || !Object.keys(state.data.categories).length) {
        state.data.categories = { ...DEFAULT_CHECKIN_CATEGORIES };
        state.data.categoryOrder = [...DEFAULT_CATEGORY_ORDER];
    }
    const cats = getCategories();
    const order = getCategoryOrder();
    for (const mod of order) {
        const existing = state.data.checkIns.filter(c => c.module === mod);
        if (!existing.length && DEFAULT_CHECKINS[mod]) {
            DEFAULT_CHECKINS[mod].forEach((item, i) => {
                state.data.checkIns.push({
                    id: uuid(),
                    module: mod,
                    category: cats[mod] || '其他',
                    name: item.name,
                    points: item.points || 10,
                    stars: item.stars || 3,
                    order: i,
                    createdAt: now()
                });
            });
        }
    }
}

function getSyncId() {
    return state.settings.syncSpaceId ? String(state.settings.syncSpaceId).trim() : 'main';
}

function normalizeSupabaseUrl(url) {
    if (!url) return url;
    url = url.trim();
    // 去掉末尾的 /rest/ 或 /rest（用户常误复制 REST endpoint）
    url = url.replace(/\/(rest|graphql|auth|storage)(\/)?$/, '');
    // 去掉末尾斜杠
    url = url.replace(/\/$/, '');
    return url;
}

function validateSupabaseKey(key) {
    if (!key) return { ok: false, reason: 'empty' };
    if (/^sb_publishable_/i.test(key)) {
        return { ok: false, reason: 'publishable', text: '你粘贴的是 Publishable Key，不是 Anon Key。请改用 Supabase 项目设置里 Project API 的 "anon public" Key（通常以 eyJ... 开头）。' };
    }
    if (!/^eyJ[\w-]*\./i.test(key)) {
        return { ok: false, reason: 'format', text: 'Key 格式不像 Supabase Anon Key（通常以 eyJ... 开头），请检查是否复制完整。' };
    }
    return { ok: true };
}

async function initSupabase(pull = true) {
    if (!window.supabase) {
        state.supabase = null;
        updateSyncStatus('offline');
        toast('Supabase 组件未加载，请检查网络后刷新');
        return false;
    }
    state.settings.supabaseUrl = normalizeSupabaseUrl(state.settings.supabaseUrl);
    const keyCheck = validateSupabaseKey(state.settings.supabaseKey);
    if (!state.settings.supabaseUrl || !state.settings.supabaseKey || keyCheck.reason === 'publishable') {
        state.supabase = null;
        updateSyncStatus('offline');
        if (keyCheck.reason === 'publishable') toast(keyCheck.text);
        return false;
    }
    try {
        state.supabase = window.supabase.createClient(state.settings.supabaseUrl, state.settings.supabaseKey);
        updateSyncStatus('syncing');
        const ok = await verifySupabase();
        if (ok && pull) {
            // 连接成功后立刻从云端拉取一次，确保拿到其他设备的最新数据
            await syncFromCloud();
        }
        return ok;
    } catch (e) {
        console.error('Supabase 初始化失败', e);
        updateSyncStatus('error');
        return false;
    }
}

async function verifySupabase() {
    if (!state.supabase) { updateSyncStatus('offline'); return false; }
    try {
        const { error } = await state.supabase.from('growtree_data').select('id').limit(1);
        if (error) throw error;
        updateSyncStatus('online');
        return true;
    } catch (e) {
        console.error('Supabase 连接验证失败', e);
        updateSyncStatus('error');
        return false;
    }
}

function analyzeSupabaseError(e) {
    const raw = e ? (e.message || e.error_description || e.details || e.hint || JSON.stringify(e)) : '未知错误';
    const code = e && e.code;
    if (code === '42P01') return '数据表 growtree_data 不存在 → 请先在设置里复制建表 SQL 到 Supabase 后台执行。';
    if (code === '42501') return '权限不足(RLS) → 请在 Supabase 后台执行放行策略，或关闭该表的行级安全。';
    if (/PGRST/.test(raw)) return '数据表结构异常 → 请确认建表 SQL 已完整执行。';
    if (/JWT|invalid apikey|apikey|key/i.test(raw)) return 'API Key 无效或 URL 错误 → 请检查 Supabase 项目的 URL 与 Anon Key 是否复制完整。';
    if (/Failed to fetch|network|fetch|load|timeout/i.test(raw)) return '网络请求失败 → 请检查网络，或 Supabase 免费项目已休眠（到后台唤醒后重试）。';
    if (/upstream connect error|delayed connect error|connection refused|ECONNREFUSED|errno 111|111/i.test(raw)) return '网络到 Supabase 握手失败（偶发）→ 多为当前网络抖动或 DNS 缓存，刷新页面或稍后重试即可，本地数据不会丢失。';
    return raw;
}

// 用于判断云端拉取后本地数据是否真正发生变化（排除时间戳等元数据）
function syncDataSnapshot(d) {
    const { lastSyncAt, updatedAt, ...rest } = d || {};
    return JSON.stringify(rest);
}

// 同步容错：网络偶发抖动（如 delayed connect error: 111）不应立刻闪红，连续失败 2 次才提示
let syncFailCount = 0;
function reportSyncError(e) {
    syncFailCount++;
    console.error('云端同步失败', e);
    if (syncFailCount >= 2) {
        const reason = analyzeSupabaseError(e);
        state.lastCloudError = reason;
        updateSyncStatus('error');
        // 仅在「从正常切换到失败」时提示一次原因，避免每次轮询都弹，打扰用户
        if (!state._cloudErrorToastShown) {
            state._cloudErrorToastShown = true;
            toast('☁️ 同步失败：' + reason);
        }
    }
}
function reportSyncSuccess() {
    syncFailCount = 0;
    state._cloudErrorToastShown = false;
}

// 按 id 合并两条记录数组：保留本地独有的记录，同时补充云端独有的记录，避免同步覆盖本地新产生的数据
function mergeById(localArr, cloudArr) {
    const local = Array.isArray(localArr) ? localArr : [];
    const cloud = Array.isArray(cloudArr) ? cloudArr : [];
    const map = new Map();
    local.forEach(x => { if (x && x.id) map.set(x.id, x); });
    cloud.forEach(x => { if (x && x.id && !map.has(x.id)) map.set(x.id, x); });
    return Array.from(map.values());
}

// 静默修正赛季字段：若本地 season 与实际月份不符，直接修正（不触发结算 toast）
function ensureSeason() {
    const g = state.data.game;
    if (!g) return;
    const cur = getCurrentSeason();
    if (!g.season || g.season.id !== cur.id) {
        const t = getTierInfo(g.rankStars || 0);
        g.season = {
            id: cur.id, name: cur.name, year: cur.year,
            startStars: g.rankStars || 0,
            peakKey: t.rankKey,
            peakStars: g.rankStars || 0
        };
    }
}

async function syncFromCloud() {
    if (!state.supabase) return;
    updateSyncStatus('syncing');
    try {
        const syncId = getSyncId();
        const { data, error } = await state.supabase.from('growtree_data').select('*').eq('id', syncId).single();
        if (error) throw error;
        if (data && data.payload) {
            const cloud = data.payload;
            const cloudUpdatedAt = cloud.updatedAt;
            if (!state.data.lastSyncAt || (cloudUpdatedAt && cloudUpdatedAt > state.data.lastSyncAt)) {
                // 先记录合并前的有效数据快照，用于判断是否真的发生变化
                const before = syncDataSnapshot(state.data);
                // 先暂存本地的板块配置及其最后修改时间
                const localModules = Array.isArray(state.data.modules) ? state.data.modules : null;
                const localModulesUpdatedAt = state.data.modulesUpdatedAt || 0;
                const cloudModules = Array.isArray(cloud.modules) ? cloud.modules : null;
                const cloudModulesUpdatedAt = cloud.modulesUpdatedAt || 0;
                // updatedAt 是云端行元数据，不并入本地 state.data
                const { updatedAt, ...cloudPayload } = cloud;

                // 【关键修复】拉取前先快照本地所有「按 id 的追加型数组」。
                // 下方 state.data = {...state.data, ...cloudPayload} 会用云端整组替换嵌套数组，
                // 若不在替换前保存本地引用，后续 mergeById 实际是在「云端 vs 云端」上合并，
                // 本地新增的打卡流水/夸夸/喝水等记录会被静默丢弃（即"整数组覆盖"问题）。
                const localById = {
                    history: Array.isArray(state.data.points?.history) ? state.data.points.history : [],
                    waterLogs: Array.isArray(state.data.waterLogs) ? state.data.waterLogs : [],
                    praises: Array.isArray(state.data.praises) ? state.data.praises : [],
                    wishes: Array.isArray(state.data.wishes) ? state.data.wishes : [],
                    wishBin: Array.isArray(state.data.wishBin) ? state.data.wishBin : [],
                    userQuotes: Array.isArray(state.data.userQuotes) ? state.data.userQuotes : [],
                    praiseGroups: Array.isArray(state.data.praiseGroups) ? state.data.praiseGroups : [],
                    quoteGroups: Array.isArray(state.data.quoteGroups) ? state.data.quoteGroups : []
                };

                state.data = { ...state.data, ...cloudPayload };
                // 板块配置以「最后修改时间」为准：哪边更新就用哪边，实现跨设备同步
                if (localModules && cloudModules) {
                    if (cloudModulesUpdatedAt > localModulesUpdatedAt) {
                        state.data.modules = cloudModules;
                        state.data.modulesUpdatedAt = cloudModulesUpdatedAt;
                    } else {
                        state.data.modules = localModules;
                        state.data.modulesUpdatedAt = localModulesUpdatedAt;
                    }
                } else if (cloudModules) {
                    state.data.modules = cloudModules;
                    state.data.modulesUpdatedAt = cloudModulesUpdatedAt;
                } else if (localModules) {
                    state.data.modules = localModules;
                    state.data.modulesUpdatedAt = localModulesUpdatedAt;
                }
                migrateData();
                ensureDefaults();
                // 流水/夸夸/心愿/金句/分组/喝水/回收站：用「拉取前的本地数组」与云端取并集。
                // 本地新产生的记录绝不会被云端旧快照整组覆盖（修复此前 mergeById 因被先替换而失效的 bug）。
                state.data.points.history = mergeById(localById.history, cloud.points?.history);
                state.data.waterLogs = mergeById(localById.waterLogs, cloud.waterLogs);
                state.data.praises = mergeById(localById.praises, cloud.praises);
                state.data.wishes = mergeById(localById.wishes, cloud.wishes);
                state.data.wishBin = mergeById(localById.wishBin, cloud.wishBin);
                state.data.userQuotes = mergeById(localById.userQuotes, cloud.userQuotes);
                state.data.praiseGroups = mergeById(localById.praiseGroups, cloud.praiseGroups);
                state.data.quoteGroups = mergeById(localById.quoteGroups, cloud.quoteGroups);
                // 今日金句以云端较新的日期为准
                if (cloud.dailyQuote && cloud.dailyQuote.date > (state.data.dailyQuote?.date || '')) {
                    state.data.dailyQuote = cloud.dailyQuote;
                }
                // 赛季字段可能因跨设备不同步而跑偏，静默修正并重新计算星能/积分
                ensureSeason();
                recalcPoints();
                recalcCourage();
                // 把同步时间戳推进到云端版本，避免后续轮询重复拉同一份数据
                state.data.lastSyncAt = cloudUpdatedAt || state.data.lastSyncAt || now();
                saveStateLocal();
                const after = syncDataSnapshot(state.data);
                if (before !== after) {
                    if (isUserTyping()) {
                        // 后台轮询拉到新数据时，若用户正在输入框打字，暂存待渲染标记，
                        // 等其失焦再重绘，避免整页重建 DOM 导致光标/焦点丢失。
                        state._deferredRender = true;
                    } else {
                        render();
                    }
                    // 同步提示已收敛到顶部 cloudStatusBadge，不再弹全局 toast，避免干扰
                }
            }
        }
        updateSyncStatus('online');
        reportSyncSuccess();
    } catch (e) {
        reportSyncError(e);
    }
}

// 估算「主数据表」云端占用（字节）。以下三类不计入主表，避免重复占用免费额度：
// - apiCache / hotCache：天气 / 热榜等可随时重建的缓存
// - beautyInspirations：已单独存于 beauty_inspiration 表
function estimateCloudSize() {
    const { apiCache, hotCache, beautyInspirations, ...rest } = state.data;
    let bytes = 0;
    try { bytes = JSON.stringify(rest).length; } catch (e) { bytes = 0; }
    return bytes;
}

// 清理超过 PRUNE_DAYS 天的旧数据，防止长期使用把免费额度撑满。
// 仅裁剪「可丢弃」的时间序列：按日期的日志/夸夸/积分流水，以及按天/按周的规划缓存。
const PRUNE_DAYS = 365;
function pruneOldData() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PRUNE_DAYS);
    const cutoffStr = dateStr(cutoff);
    let removed = 0;
    // 以日期为键的对象（dailyPlans: YYYY-MM-DD；makeupLog: YYYY-Www）
    for (const key of ['dailyPlans', 'makeupLog']) {
        const obj = state.data[key];
        if (obj && typeof obj === 'object') {
            for (const k of Object.keys(obj)) {
                let keep = true;
                if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
                    keep = k >= cutoffStr;
                } else {
                    const m = /^(\d{4})-W(\d{1,2})$/.exec(k);
                    if (m) {
                        const d = new Date(+m[1], 0, 1 + (+m[2] - 1) * 7);
                        keep = d >= cutoff;
                    }
                }
                if (!keep) { delete obj[k]; removed++; }
            }
        }
    }
    // 带 date 字段的数组
    const filterByDate = (arrKey) => {
        if (!Array.isArray(state.data[arrKey])) return;
        const before = state.data[arrKey].length;
        state.data[arrKey] = state.data[arrKey].filter(x => !x.date || x.date >= cutoffStr);
        removed += before - state.data[arrKey].length;
    };
    filterByDate('waterLogs');
    filterByDate('praises');
    if (state.data.points && Array.isArray(state.data.points.history)) {
        const before = state.data.points.history.length;
        state.data.points.history = state.data.points.history.filter(h => !h.date || h.date >= cutoffStr);
        removed += before - state.data.points.history.length;
    }
    // 兜底封顶：极端情况下也限制数组长度，避免无限增长
    const cap = (arr, n) => {
        if (Array.isArray(arr) && arr.length > n) { removed += arr.length - n; arr.splice(0, arr.length - n); }
    };
    cap(state.data.waterLogs, 2000);
    cap(state.data.praises, 1000);
    cap(state.data.points && state.data.points.history, 2000);
    return removed;
}

async function syncToCloud() {
    if (!state.supabase) return;
    updateSyncStatus('syncing');
    try {
        state.data.lastSyncAt = now();
        // 将本次同步时间戳落盘，确保下次拉取时「云端是否更新」的判断准确，
        // 避免因本地 lastSyncAt 永远为空而误把云端旧数据覆盖本地修改
        saveStateLocal();
        // 云端主表只存必要数据：可重建缓存与已独立建表的灵感数据不写入，节省免费额度
        const { apiCache, hotCache, beautyInspirations, ...dataForCloud } = state.data;
        const payload = { ...dataForCloud, updatedAt: now() };
        const syncId = getSyncId();
        const { error } = await state.supabase.from('growtree_data').upsert({ id: syncId, payload, updated_at: now() });
        if (error) throw error;
        updateSyncStatus('online');
        reportSyncSuccess();
    } catch (e) {
        reportSyncError(e);
    }
}

function queueSync() {
    if (state.supabase) {
        clearTimeout(state.saveTimer);
        state.saveTimer = setTimeout(syncToCloud, 2000);
    }
}

function formatSyncTime() {
    const t = state.data.lastSyncAt;
    if (!t) return '';
    const d = new Date(t);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

// 判断用户是否正在输入框中打字（用于后台轮询重绘时避免丢焦点）
function isUserTyping() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = ae.tagName;
    return (tag === 'INPUT' || tag === 'TEXTAREA' || ae.isContentEditable)
        && !ae.readOnly && !ae.disabled;
}

function updateSyncStatus(status) {
    state.syncStatus = status;

    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncText');
    if (dot && text) {
        dot.className = 'sync-dot ' + status;
        const map = { offline: '未连接云端', online: '已同步', syncing: '同步中...', error: '同步失败' };
        text.textContent = map[status] || status;
    }

    // 顶部明显徽章
    const badge = document.getElementById('cloudStatusBadge');
    const badgeDot = document.getElementById('cloudStatusDot');
    const badgeText = document.getElementById('cloudStatusText');
    if (badgeDot && badgeText) {
        const time = formatSyncTime();
        const map2 = {
            online: { cls: 'online', label: time ? `已同步 ${time}` : '已同步' },
            offline: { cls: 'offline', label: '未连接' },
            syncing: { cls: 'syncing', label: '同步中...' },
            error: { cls: 'error', label: '同步失败 · 点此重试' }
        };
        const cfg = map2[status] || map2.offline;
        badgeDot.className = 'cloud-status-dot ' + cfg.cls;
        badgeText.textContent = cfg.label;
        if (badge) {
            badge.className = 'cloud-status-badge ' + status;
            // 失败时在徽章上悬停展示具体原因，并支持点击重试（符合"少弹窗、可自操作"偏好）
            if (status === 'error') {
                badge.title = '同步失败：' + (state.lastCloudError || '未知原因') + '\n点击可立即重试';
                badge.style.cursor = 'pointer';
            } else {
                badge.removeAttribute('title');
                badge.style.cursor = '';
            }
            // 同步完成时给徽章一个轻微高亮，让用户在无 toast 时也能感知
            if (status === 'online' && time) {
                badge.classList.add('just-synced');
                setTimeout(() => badge.classList.remove('just-synced'), 800);
            }
        }
    }
}

// ==================== 增强：连续天数 / 撤销 / 备份 ====================

// 当前连续打卡天数（从今天往前数；今天还没打卡则从昨天起算）
function getCurrentStreak() {
    const dates = [...new Set(state.data.points.history
        .filter(h => h.type !== 'makeup_fee' && h.type !== 'makeup').map(h => h.date))].sort();
    if (!dates.length) return 0;
    let streak = 0;
    const d = new Date();
    if (!dates.includes(today())) d.setDate(d.getDate() - 1);
    while (true) {
        const ds = dateStr(d);
        if (dates.includes(ds)) { streak++; d.setDate(d.getDate() - 1); }
        else break;
    }
    return streak;
}

// 带撤销的提示条
function toastUndo(message, undoFn) {
    const el = document.getElementById('toast');
    if (!el) { if (undoFn) undoFn(); return; }
    el.innerHTML = `${message} <button class="toast-undo" id="toastUndoBtn">撤销</button>`;
    el.classList.add('show');
    clearTimeout(el._undoTimer);
    el._undoTimer = setTimeout(() => { el.classList.remove('show'); el.innerHTML = ''; }, 5000);
    const btn = document.getElementById('toastUndoBtn');
    if (btn) btn.onclick = () => {
        el.classList.remove('show'); el.innerHTML = '';
        if (undoFn) { undoFn(); toast('已撤销'); }
    };
}

// 通用可撤销删除：按 id 从数组移除，支持自定义恢复
function softDeleteFromArray(arrName, id, label, restore) {
    const arr = state.data[arrName];
    const idx = arr.findIndex(x => x.id === id);
    if (idx < 0) return;
    const item = arr[idx];
    arr.splice(idx, 1);
    saveState();
    render();
    toastUndo('🗑️ ' + label + ' 已删除', () => {
        if (restore) restore(item, idx);
        else arr.splice(Math.min(idx, arr.length), 0, item);
        saveState();
        render();
    });
}

// 导出全部数据为 JSON 文件
function exportData() {
    const payload = JSON.stringify({ settings: state.settings, data: state.data }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `成长小树备份_${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('已导出备份文件');
}

// 从 JSON 文件导入（替换全部数据）
function importDataFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            if (!parsed || !parsed.data) throw new Error('文件格式不正确');
            state.settings = { ...state.settings, ...parsed.settings };
            state.data = parsed.data;
            migrateData();
            ensureDefaults();
            recalcPoints();
            saveState();
            render();
            toast('✅ 数据已导入');
        } catch (e) {
            toast('❌ 导入失败：' + e.message);
        }
    };
    reader.readAsText(file);
}

// 清除所有应用数据（保留云端/个人设置，避免重新配置 Supabase）
async function clearAllData() {
    const ok = await uiConfirm('确定要清除所有应用数据吗？\n\n所有打卡、积分、心愿、喝水记录、夸夸记录等都会被清空，但云端配置（Supabase URL/Key/同步空间ID）会保留。', { isDanger: true });
    if (!ok) return;
    const preservedSettings = { ...state.settings };
    // 重置为初始数据结构，保留设置
    state.settings = preservedSettings;
    state.data = {
        waterLogs: [],
        waterGoal: 1500,
        checkIns: [],
        points: { earned: 0, used: 0, history: [] },
        makeupLog: {},
        wishes: [],
        wishBin: [],
        praises: [],
        userQuotes: [],
        quoteGroups: [],
        dailyQuote: null,
        hotCache: {},
        apiCache: {},
        memo: '',
        checkInBin: [],
        dailyPlans: {},
        lastSyncAt: null,
        lastVisit: null,
        categories: null,
        categoryOrder: null
    };
    state.supabase = null;
    state.syncStatus = 'offline';
    migrateData();
    ensureDefaults();
    recalcPoints();
    recalcCourage();
    updateSeasonPeak();
    saveStateLocal();
    location.reload();
}

// 压缩图片为较小 base64，避免撑爆本地存储
function compressImageFile(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const max = 360;
            let { width, height } = img;
            if (width > height && width > max) { height = Math.round(height * max / width); width = max; }
            else if (height > max) { width = Math.round(width * max / height); height = max; }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            try { cb(canvas.toDataURL('image/jpeg', 0.7)); }
            catch (e) { cb(reader.result); }
        };
        img.onerror = () => cb(reader.result);
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

// ==================== 数据操作 ====================

// 确保存在一个「喝水」联动打卡项：优先在「其他打卡项」里找/创建。
function ensureWaterCheckIn() {
    const cats = getCategories();
    const otherCat = cats.other || '其他打卡项';
    let target = state.data.checkIns.find(c => /喝水/.test(c.name) && c.module === 'other');
    if (!target) {
        target = state.data.checkIns.find(c => /喝水/.test(c.name));
    }
    if (!target) {
        target = {
            id: uuid(),
            module: 'other',
            category: otherCat,
            name: '喝水 1500ml',
            stars: 2,
            points: flowerScore(2),
            order: state.data.checkIns.filter(c => c.module === 'other').length,
            createdAt: now()
        };
        state.data.checkIns.push(target);
        saveState();
    }
    return target;
}

// 同步喝水打卡状态：当日总量达标则自动完成，未达标则取消（删除/修改目标后都需要）
function syncWaterCheckIn() {
    const target = ensureWaterCheckIn();
    const todayLogs = state.data.waterLogs.filter(x => x.date === today());
    const total = todayLogs.reduce((s, x) => s + x.amount, 0);
    const hasBase = state.data.points.history.some(h => h.checkInId === target.id && h.date === today() && h.type === 'base');
    if (total >= state.data.waterGoal) {
        if (!hasBase) {
            doCheckIn(target.id, today());
            toast('💧 喝水达标，已自动打卡 +积分！');
        }
    } else {
        if (hasBase) {
            state.data.points.history = state.data.points.history.filter(h => !(h.checkInId === target.id && h.date === today() && h.type !== 'makeup'));
            recalcDailyCompletionBonus();
            recalcPoints();
            recalcCourage();
        }
    }
}

function addWater(amount) {
    state.data.waterLogs.unshift({ id: uuid(), amount: parseInt(amount), time: now(), date: today() });
    saveState();
    syncWaterCheckIn();
    render();
}

function deleteWater(id) {
    const log = state.data.waterLogs.find(x => x.id === id);
    if (!log) return;
    state.data.waterLogs = state.data.waterLogs.filter(x => x.id !== id);
    // 删除后同步「喝水 1500ml」打卡状态
    syncWaterCheckIn();
    saveState();
    render();
    toast('已撤销该条喝水记录');
}


function addPointsEntry(entry) {
    entry.id = entry.id || uuid();
    entry.time = entry.time || now();
    state.data.points.history.push(entry);
}

// 某打卡项截至 dateStr 的连续天数（含当天）
function checkInStreak(id, dateStr) {
    const dates = state.data.points.history
        .filter(h => h.checkInId === id && h.type !== 'makeup_fee' && h.date <= dateStr)
        .map(h => h.date);
    if (!dates.length) return 0;
    const uniq = [...new Set(dates)].sort();
    let streak = 1;
    for (let i = uniq.length - 2; i >= 0; i--) {
        const diff = Math.round((new Date(uniq[i + 1]) - new Date(uniq[i])) / 86400000);
        if (diff === 1) streak++; else break;
    }
    return streak;
}

// 最长连续天数（成就墙用）
function getLongestStreak(id) {
    const dates = [...new Set(state.data.points.history
        .filter(h => h.checkInId === id && h.type !== 'makeup_fee').map(h => h.date))].sort();
    if (!dates.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < dates.length; i++) {
        const diff = Math.round((new Date(dates[i]) - new Date(dates[i - 1])) / 86400000);
        if (diff === 1) cur++; else cur = 1;
        if (cur > best) best = cur;
    }
    return best;
}

function getCheckedDays() {
    return new Set(state.data.points.history.filter(h => h.type !== 'makeup_fee').map(h => h.date)).size;
}

function getLevel(earned) {
    let lv = LEVELS[0];
    for (const l of LEVELS) if (earned >= l.min) lv = l;
    return lv;
}
function getNextLevel(earned) {
    for (const l of LEVELS) if (earned < l.min) return l;
    return null;
}
// 获取某日的打卡计划（排序 + 隐藏），不影响全局打卡项
function getDailyPlan(dateStr) {
    const plan = state.data.dailyPlans[dateStr] || {};
    const all = state.data.checkIns.slice().sort((a, b) => a.order - b.order);
    const hidden = new Set(plan.hidden || []);
    let ordered = [];
    const idMap = new Map(all.map(x => [x.id, x]));
    if (plan.order && plan.order.length) {
        plan.order.forEach(id => {
            const it = idMap.get(id);
            if (it && !hidden.has(id)) ordered.push(it);
        });
    }
    // 把新增/global排序里但还没在计划中的项补到末尾
    all.forEach(it => {
        if (!ordered.find(x => x.id === it.id) && !hidden.has(it.id)) ordered.push(it);
    });
    return { items: ordered, hidden: [...hidden] };
}

function setDailyPlanOrder(dateStr, orderedIds) {
    state.data.dailyPlans[dateStr] = state.data.dailyPlans[dateStr] || {};
    state.data.dailyPlans[dateStr].order = orderedIds;
}

function getLevelProgress(earned) {
    const cur = getLevel(earned);
    const next = getNextLevel(earned);
    if (!next) return { cur, next: null, pct: 100, gap: 0 };
    const gap = next.min - earned;
    const span = next.min - cur.min;
    const pct = Math.max(0, Math.min(100, Math.round((earned - cur.min) / span * 100)));
    return { cur, next, pct, gap };
}

// ==================== 排位赛引擎 ====================
function rankIndex(key) { return RANKS.findIndex(r => r.key === key); }
function isHigher(a, b) { return rankIndex(a) > rankIndex(b); }

// 由星数推导出当前段位/小段信息（title 为对应的成长称号）
function getTierInfo(rankStars) {
    rankStars = Math.max(0, Math.floor(rankStars || 0));
    const title = (rankKey) => {
        const lv = LEVELS.find(l => l.prefix === (RANKS.find(r => r.key === rankKey) || {}).name);
        return lv ? lv.title : '';
    };
    if (rankStars >= KING_START) {
        const t = RANK_TIERS[RANK_TIERS.length - 1];
        return Object.assign({}, t, { starsInTier: rankStars - KING_START, toNext: null, isKing: true, kingStars: rankStars - KING_START, title: title(t.rankKey) });
    }
    const t = RANK_TIERS.find(x => rankStars >= x.startStars && rankStars < x.endStars) || RANK_TIERS[0];
    return Object.assign({}, t, { starsInTier: rankStars - t.startStars, toNext: t.starsToNext - (rankStars - t.startStars), isKing: false, title: title(t.rankKey) });
}
function getRankStars() { return state.data.game ? (state.data.game.rankStars || 0) : 0; }
function getCourageCap() {
    const t = getTierInfo(getRankStars());
    const r = RANKS.find(x => x.key === t.rankKey);
    return r ? r.cap : 60;
}

// 游戏数据默认字段（幂等）
function ensureGameDefaults() {
    state.data.game = state.data.game || {};
    const g = state.data.game;
    g.rankStars = g.rankStars || 0;
    g.accountedEarnedStars = (typeof g.accountedEarnedStars === 'number') ? g.accountedEarnedStars : Math.floor((state.data.points.earned || 0) / 100);
    g.courage = g.courage || 0;
    g.bonusStars = g.bonusStars || 0;
    g.courageStars = g.courageStars || 0;
    g.winStars = g.winStars || 0;
    g.winAwarded = g.winAwarded || [];
    g.allFourDates = g.allFourDates || [];
    g.allFourCourageDates = g.allFourCourageDates || [];
    g.firstCheckInTime = g.firstCheckInTime || {};
    g.achievements = g.achievements || {};
    g.titles = g.titles || [];
    g.season = g.season || null;
    g.seasonHistory = g.seasonHistory || [];
}

// 把「累计获得积分」的增量同步成星（1 星 = 100 积分），保持段位与积分挂钩但不因兑换下降
function syncEarnedStars() {
    const g = state.data.game;
    if (!g) return;
    const beforeKey = getTierInfo(g.rankStars || 0).rankKey;
    const es = Math.floor((state.data.points.earned || 0) / 100);
    if (es > (g.accountedEarnedStars || 0)) {
        g.rankStars = (g.rankStars || 0) + (es - g.accountedEarnedStars);
        g.accountedEarnedStars = es;
    }
    const afterKey = getTierInfo(g.rankStars || 0).rankKey;
    if (beforeKey !== afterKey) {
        const rank = RANKS.find(r => r.key === afterKey) || {};
        const lv = LEVELS.find(l => l.prefix === rank.name) || {};
        const rankName = rank.name;
        if (rankName && RANK_UP_QUOTES[rankName]) {
            toast(`🎉 晋升 ${rankName}${lv.title ? '·' + lv.title : ''}！${RANK_UP_QUOTES[rankName]}`);
        }
    }
}

function addStars(n) {
    const g = state.data.game;
    const beforeKey = getTierInfo(g.rankStars || 0).rankKey;
    g.rankStars = Math.max(0, (g.rankStars || 0) + n);
    const afterKey = getTierInfo(g.rankStars).rankKey;
    updateSeasonPeak();
    if (beforeKey !== afterKey) {
        const rank = RANKS.find(r => r.key === afterKey) || {};
        const lv = LEVELS.find(l => l.prefix === rank.name) || {};
        const rankName = rank.name;
        if (rankName && RANK_UP_QUOTES[rankName]) {
            toast(`🎉 晋升 ${rankName}${lv.title ? '·' + lv.title : ''}！${RANK_UP_QUOTES[rankName]}`);
        }
    }
}

// 增加星能；满 100 自动加 1 颗星（受段位上限约束，低段位上限<100 不会触发）
function awardCourage(n) {
    const g = state.data.game;
    const cap = getCourageCap();
    g.courage = Math.min(cap, (g.courage || 0) + n);
    let awarded = 0;
    while (g.courage >= COURAGE_STAR) {
        g.courage -= COURAGE_STAR;
        g.bonusStars = (g.bonusStars || 0) + 1;
        g.courageStars = (g.courageStars || 0) + 1;
        g.rankStars = (g.rankStars || 0) + 1;
        updateSeasonPeak();
        awarded++;
    }
    return awarded > 0; // 是否获得额外星
}

// 判断某天「日常习惯」板块是否全部完成
function isDailyModuleAllDone(date) {
    const dailyItems = state.data.checkIns.filter(c => c.module === 'daily');
    if (!dailyItems.length) return false;
    const doneIds = new Set(state.data.points.history
        .filter(h => h.date === date && h.type === 'base')
        .map(h => h.checkInId));
    return dailyItems.every(it => doneIds.has(it.id));
}

// 重新计算星能。
// 规则（与段位一致，按赛季）：星能只统计「当前赛季」的打卡记录，每个新赛季自动清零重算。
// 但删除习惯不会抹掉它在本赛季已贡献的星能——软删除（进回收站）只是把习惯从列表隐藏，
// 其本赛季的历史打卡记录仍保留在流水里，继续计入星能；只有从回收站「彻底删除」才会移除记录。
// 「全勤打卡」仅指：当天「日常习惯」板块全部完成。
function recalcCourage() {
    const g = state.data.game;
    const cap = getCourageCap();
    const season = getCurrentSeason();
    const seasonStart = getSeasonStart(season.key, season.year);
    const todayD = today();
    const todayBaseCount = state.data.points.history.filter(h => h.type === 'base' && h.date === todayD).length;
    const byDate = {};
    state.data.points.history.forEach(h => {
        if (h.type !== 'base') return;
        if (h.date < seasonStart) return; // 仅统计本赛季记录，旧赛季的星能随赛季更新而清零
        // 本赛季记录（含已软删除进回收站的习惯）继续计入星能，删除习惯不抹掉本赛季努力
        if (!byDate[h.date]) byDate[h.date] = { count: 0 };
        byDate[h.date].count += 1;
    });
    let total = 0;
    const activeAllFourDates = [];
    Object.entries(byDate).forEach(([date, d]) => {
        total += d.count * COURAGE_PER_ITEM;
        // 全勤打卡：当天「日常习惯」全部完成，额外 +10 星能
        if (isDailyModuleAllDone(date)) {
            total += COURAGE_ALL4_BONUS;
            activeAllFourDates.push(date);
        }
    });
    // 已兑换成星的星能要从剩余值中扣除（星星不会回收）
    total -= (g.courageStars || 0) * COURAGE_STAR;
    // 若重算后剩余星能仍满 100，继续自动兑换成星（如赛季初/大量历史记录一次性结算）
    while (total >= COURAGE_STAR) {
        total -= COURAGE_STAR;
        g.courageStars = (g.courageStars || 0) + 1;
        g.bonusStars = (g.bonusStars || 0) + 1;
        g.rankStars = (g.rankStars || 0) + 1;
        updateSeasonPeak();
    }
    g.courage = Math.max(0, Math.min(cap, total));
    g.allFourCourageDates = activeAllFourDates;
}

// 每日习惯完成度奖励 + 星能 + 全勤成就，在每次「打卡/取消打卡」后调用
// 「全勤」以「日常习惯」板块为口径：日常习惯全部完成 = 今日全勤
function recalcDailyCompletionBonus() {
    const todayD = today();
    const dailyItems = state.data.checkIns.filter(c => c.module === 'daily');
    const total = dailyItems.length;
    if (total === 0) return;
    const doneIds = new Set(state.data.points.history
        .filter(h => h.date === todayD && h.type === 'base')
        .map(h => h.checkInId));
    const done = dailyItems.filter(it => doneIds.has(it.id)).length;
    const ratio = done / total;

    // 先清除今日旧记录，再按当前完成度重新 awarding（支持取消打卡后降级）
    state.data.points.history = state.data.points.history.filter(h => !(h.date === todayD && (h.type === 'dailyhalf' || h.type === 'dailyfull')));

    if (done === total) {
        addPointsEntry({ points: DAILY_FULL_BONUS, type: 'dailyfull', date: todayD, reason: '今日全勤' });
    } else if (ratio > 0.5) {
        addPointsEntry({ points: DAILY_HALF_BONUS, type: 'dailyhalf', date: todayD, reason: '完成过半' });
    }
}

// 星能 + 一日圆满成就，在每次「打卡成功」时调用（date 为该次打卡日期）
function gameOnCheckIn(date) {
    const g = state.data.game;
    const todayD = today();
    // 记录首卡时间（仅当天），用于早起成就
    if (date === todayD && !g.firstCheckInTime[todayD]) g.firstCheckInTime[todayD] = now();

    // 1) 每完成 1 项打卡 +5 星能
    const gotStar = awardCourage(COURAGE_PER_ITEM);

    // 2) 全勤打卡：当天「日常习惯」全部完成，额外 +10 星能（每天一次）
    if (isDailyModuleAllDone(todayD) && !g.allFourCourageDates.includes(todayD)) {
        g.allFourCourageDates.push(todayD);
        const s2 = awardCourage(COURAGE_ALL4_BONUS);
        if (s2) toast('🌟 星能满 100，白嫖 +1 星！');
    }
    if (gotStar) toast('🌟 星能满 100，白嫖 +1 星！');

    // 3) 一日圆满（可重复成就）：当天首次全部习惯完成
    const total = state.data.checkIns.length;
    const done = new Set(state.data.points.history.filter(h => h.date === todayD && h.type === 'base').map(h => h.checkInId)).size;
    if (total > 0 && done === total && !g.allFourDates.includes(todayD)) {
        g.allFourDates.push(todayD);
        g.achievements['oneround'] = g.achievements['oneround'] || { unlocked: true, at: now(), count: 0 };
        g.achievements['oneround'].count = (g.achievements['oneround'].count || 0) + 1;
        toast('🌟 一日圆满！今日习惯全部完成');
    }
}

// 连胜加星（按全局连续打卡天数）
function awardWinStreak() {
    const g = state.data.game;
    const streak = getCurrentStreak();
    if (streak < 3) return;
    for (const m of [3, 7, 14, 30]) {
        const stars = WIN_STREAK_STARS[m];
        if (streak >= m && !g.winAwarded.includes(m)) {
            g.winAwarded.push(m);
            g.winStars = (g.winStars || 0) + stars;
            addStars(stars);
            toast(`🔥 连胜 ${m} 天！+${stars} 星`);
            if (m === 30 && !g.titles.includes('常胜将军')) g.titles.push('常胜将军');
        }
    }
}

// 早起连胜（连续若干天 8:00 前完成首卡）
function computeEarlyStreak() {
    const g = state.data.game;
    let streak = 0;
    const d = new Date();
    if (!g.firstCheckInTime[today()]) d.setDate(d.getDate() - 1); // 今天还没首卡则从昨天算
    while (true) {
        const ds = dateStr(d);
        const t = g.firstCheckInTime[ds];
        if (!t) break;
        if (new Date(t).getHours() < 8) { streak++; d.setDate(d.getDate() - 1); }
        else break;
    }
    return streak;
}

function buildAchvCtx() {
    const g = state.data.game;
    const t = getTierInfo(getRankStars());
    return {
        totalDays: getCheckedDays(),
        streak: getCurrentStreak(),
        allFourDays: (g.allFourDates || []).length,
        tierKey: t.rankKey,
        earlyStreak: computeEarlyStreak(),
        courageStars: g.courageStars || 0
    };
}

function checkAchievements() {
    const g = state.data.game;
    const ctx = buildAchvCtx();
    for (const a of ACHIEVEMENTS) {
        if (g.achievements[a.id] && g.achievements[a.id].unlocked) continue;
        if (a.check(ctx)) {
            g.achievements[a.id] = { unlocked: true, at: now() };
            if (a.title && !g.titles.includes(a.title)) g.titles.push(a.title);
            addPointsEntry({ points: a.reward, type: 'achv', date: today(), reason: `成就·${a.name}` });
            toast(`🏆 解锁成就「${a.name}」+${a.reward} 积分`);
        }
    }
}

// 赛季：依据当前月份得出赛季信息（冬季跨年）
function getCurrentSeason() {
    const d = new Date();
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    for (const s of SEASONS) {
        if (s.months.includes(m)) {
            let sy = y;
            if (s.key === 'winter') sy = (m === 12) ? y : y - 1;
            return { key: s.key, name: s.name, id: `${sy}-${s.key}`, year: sy };
        }
    }
    return { key: 'summer', name: '夏赛季', id: `${y}-summer`, year: y };
}
function seasonDaysLeft(season) {
    const nowD = new Date();
    const y = nowD.getFullYear(), m = nowD.getMonth();
    let end;
    if (season.key === 'spring') end = new Date(y, 4, 31);
    else if (season.key === 'summer') end = new Date(y, 7, 31);
    else if (season.key === 'autumn') end = new Date(y, 10, 30);
    else { const ey = (m === 12) ? y + 1 : y; end = new Date(ey, 1, 28); }
    return Math.max(0, Math.round((end - nowD) / 86400000));
}
// 赛季开始日期（用于星能按赛季统计）：冬季 year 已是跨年基准年
function getSeasonStart(key, year) {
    const map = {
        spring: [year, 2, 1],   // 3/1
        summer: [year, 5, 1],   // 6/1
        autumn: [year, 8, 1],   // 9/1
        winter: [year, 11, 1]   // 12/1
    };
    const [y, m, d] = map[key] || [year, 2, 1];
    const dt = new Date(y, m, d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
// 更新赛季内最高段位记录
function updateSeasonPeak() {
    const g = state.data.game, s = g.season;
    if (!s) return;
    const cur = getRankStars();
    if (cur > (s.peakStars || 0)) { s.peakStars = cur; s.peakKey = getTierInfo(cur).rankKey; }
}

function transitionSeason(cur) {
    const g = state.data.game;
    const prev = g.season;
    if (prev) {
        const peak = prev.peakKey || 'bronze';
        const reward = SEASON_REWARDS[peak] || SEASON_REWARDS.bronze;
        const peakRankObj = RANKS.find(r => r.key === peak) || RANKS[0];
        const peakLv = LEVELS.find(l => l.prefix === peakRankObj.name) || {};
        const peakNameWithTitle = peakRankObj.name + (peakLv.title ? '·' + peakLv.title : '');
        g.seasonHistory.push({
            id: prev.id, name: prev.name,
            peakKey: peak, peakName: peakNameWithTitle,
            rewardPoints: reward.points, rewardTitle: reward.title,
            endedAt: now()
        });
        if (reward.points) addPointsEntry({ points: reward.points, type: 'season', date: today(), reason: `${prev.name}结算·${reward.title || '段位奖励'}` });
        if (reward.title && !g.titles.includes(reward.title)) g.titles.push(reward.title);
        // 段位继承：按当前段位直接落到目标段位起点。只改 rankStars（掉段），不动 points.history，历史打卡积分完整保留。
        const t = getTierInfo(g.rankStars);
        const targetKey = INHERIT_TARGET[t.rankKey] || t.rankKey;
        const targetTier = RANK_TIERS.find(x => x.rankKey === targetKey && x.roman === 'Ⅲ') || RANK_TIERS.find(x => x.rankKey === targetKey) || RANK_TIERS[0];
        const demote = g.rankStars - targetTier.startStars;
        g.rankStars = targetTier.startStars;
        const demoteText = demote > 0 ? `继承后回到 ${targetTier.rankName} ${targetTier.roman}${targetTier.title ? '·' + targetTier.title : ''}` : '青铜选手继续从青铜起步';
        toast(`🎊 ${prev.name}结算！+${reward.points} 积分${reward.title ? ' · 称号「' + reward.title + '」' : ''}。${demoteText}，历史打卡积分和流水完整保留。`);
    }
    g.season = {
        id: cur.id, name: cur.name, year: cur.year,
        startStars: g.rankStars,
        peakKey: getTierInfo(g.rankStars).rankKey,
        peakStars: g.rankStars
    };
    // 星能随赛季更新清零（与段位一样）：重置本赛季星能状态，旧赛季星能不再累计
    g.courage = 0;
    g.courageStars = 0;
    g.bonusStars = 0;
    g.allFourCourageDates = [];
    recalcCourage();
}

function initGame() {
    ensureGameDefaults();
    recalcPoints();
    syncEarnedStars();
    const cur = getCurrentSeason();
    if (!state.data.game.season || state.data.game.season.id !== cur.id) {
        transitionSeason(cur);
    }
    awardWinStreak();
    checkAchievements();
    recalcPoints();
    syncEarnedStars();
    recalcCourage();
    updateSeasonPeak();
}

// 本月双倍积分日（按月份确定性"随机"）
function getDoubleDay(monthOffset = 0) {
    const d = new Date();
    const seed = d.getFullYear() * 12 + (d.getMonth() + monthOffset);
    return (seed * 7 + 3) % 28 + 1;
}
function isDoubleDay(dateStr) {
    return new Date(dateStr).getDate() === getDoubleDay(0);
}

function awardContentBonus() {
    if (state.data.points.history.some(h => h.date === today() && h.type === 'content')) return;
    addPointsEntry({ points: 3, type: 'content', date: today(), reason: '深度参与' });
    recalcPoints();
}

// 直接设置某打卡项在指定日期的「已打卡/未打卡」状态（不递归，供跨板块同步调用）
function setCheckInState(item, date, done, double) {
    const mult = double ? 2 : 1;
    const existing = state.data.points.history.find(h => h.checkInId === item.id && h.date === date && h.type === 'base');
    if (done && !existing) {
        const basePts = (parseInt(item.points) || 10) * mult;
        addPointsEntry({ checkInId: item.id, module: item.module, category: item.category, points: basePts, type: 'base', date });
        const streak = checkInStreak(item.id, date);
        const cycleStreak = ((streak - 1) % 30) + 1;
        if (STREAK_BONUS[cycleStreak] && !state.data.points.history.some(h => h.checkInId === item.id && h.date === date && h.type === 'streak')) {
            addPointsEntry({ checkInId: item.id, module: item.module, category: item.category, points: STREAK_BONUS[cycleStreak] * mult, type: 'streak', date, reason: `连续${streak}天` });
        }
    } else if (!done && existing) {
        state.data.points.history = state.data.points.history.filter(h => !(h.checkInId === item.id && h.date === date && h.type !== 'makeup'));
    }
}

// 核心：打卡 / 取消（自定义积分，无固定三档；支持指定日期）
// 同名跨板块打卡项（如「基础打卡项↔日常习惯」中的"洗漱"）会同步为相同状态
function doCheckIn(id, dateStr) {
    const item = state.data.checkIns.find(x => x.id === id);
    if (!item) return;
    const date = dateStr || today();
    const double = isDoubleDay(date);
    const mult = double ? 2 : 1;
    const baseEntry = state.data.points.history.find(h => h.checkInId === id && h.date === date && h.type === 'base');
    const nowDone = !baseEntry;
    // 先处理当前项
    setCheckInState(item, date, nowDone, double);
    // 再同步所有同名、不同板块的打卡项（双向：在基础打卡或日常习惯任一处勾选都同步）
    const linked = state.data.checkIns.filter(c => c.id !== item.id && c.name === item.name && c.module !== item.module);
    linked.forEach(l => setCheckInState(l, date, nowDone, double));
    afterCheckIn(nowDone, nowDone ? (parseInt(item.points) || 10) * mult : 0, date, item.stars, item);
}

function afterCheckIn(justDone, pts, date, stars, item) {
    const d = date || today();
    // 每日完成度奖励：无论打卡还是取消，都按当前完成度重新计算（支持降级/撤销）
    recalcDailyCompletionBonus();
    if (justDone) {
        recalcPoints();
        gameOnCheckIn(d);
        checkAchievements();
    }
    recalcPoints();
    recalcCourage();
    syncEarnedStars();
    updateSeasonPeak();
    if (justDone) awardWinStreak();
    updateSeasonPeak();
    saveState();
    render();
    if (justDone) {
        const double = isDoubleDay(d);
        const slogan = (stars && FLOWER_LEVELS[stars]) ? FLOWER_LEVELS[stars].slogan : '';
        showFloat(`+${pts}${double ? ' ×2' : ''} 积分 🎉${slogan ? ' ' + slogan : ''}`);
        vibrate();
        playDing();
        // 明日解锁徽章（日常全部完成）
        maybeShowTomorrowUnlocked(item, d);
    }
}

// （游戏化激励浮字 Start!/Combo/On Fire!/Unstoppable!/Victory! 已移除，仅保留积分浮字 + 明日解锁徽章）

// 日常打卡全部完成 → 弹出「Tomorrow Unlocked 明日已解锁」成就徽章（当天只弹一次）
function maybeShowTomorrowUnlocked(item, d) {
    if (!item || item.module !== 'daily') return;
    if (!isDailyModuleAllDone(d)) return;
    if (state.data.tomorrowUnlockedDate === d) return;
    state.data.tomorrowUnlockedDate = d;
    saveState();
    showAchievementBadge('Tomorrow Unlocked', '明日已解锁', '🔓');
}

function toggleCheckIn(id, dateStr) {
    doCheckIn(id, dateStr);
}

function addCheckIn(module, name, stars, categoryName) {
    const cats = getCategories();
    const order = getCategoryOrder();
    let catKey = module;
    // 如果提供了新的板块名称，则创建/复用板块
    if (categoryName && categoryName.trim()) {
        const cname = categoryName.trim();
        const existKey = Object.keys(cats).find(k => cats[k] === cname);
        if (existKey) {
            catKey = existKey;
        } else {
            catKey = makeCategoryKey(cname);
            cats[catKey] = cname;
            if (!order.includes(catKey)) order.push(catKey);
            state.data.categories = cats;
            state.data.categoryOrder = order;
        }
    }
    const items = state.data.checkIns.filter(c => c.module === catKey);
    const starsN = parseInt(stars) || 3;
    state.data.checkIns.push({
        id: uuid(),
        module: catKey,
        category: cats[catKey] || '其他',
        name,
        stars: starsN,
        points: flowerScore(starsN), // 分数由花朵定级决定
        order: items.length,
        createdAt: now()
    });
    saveState();
    render();
    return catKey;
}

function deleteCheckIn(id) {
    const ci = state.data.checkIns.find(x => x.id === id);
    if (!ci) return;
    ci.deletedAt = now();
    state.data.checkIns = state.data.checkIns.filter(x => x.id !== id);
    state.data.checkInBin.unshift(ci);
    saveState();
    render();
    toastUndo('🗑️ 打卡项已移入回收站', () => {
        state.data.checkIns.push(ci);
        state.data.checkInBin = state.data.checkInBin.filter(x => x.id !== id);
        saveState();
        render();
    });
}

function restoreCheckIn(id) {
    const ci = state.data.checkInBin.find(x => x.id === id);
    if (!ci) return;
    ci.deletedAt = null;
    state.data.checkIns.push(ci);
    state.data.checkInBin = state.data.checkInBin.filter(x => x.id !== id);
    saveState();
    render();
}

function purgeCheckIn(id) {
    const ci = state.data.checkInBin.find(x => x.id === id);
    if (!ci) return;
    const related = state.data.points.history.filter(h => h.checkInId === id);
    state.data.checkInBin = state.data.checkInBin.filter(x => x.id !== id);
    state.data.points.history = state.data.points.history.filter(x => x.checkInId !== id);
    recalcPoints();
    recalcCourage();
    saveState();
    render();
    toastUndo('🗑️ 打卡项已彻底删除', () => {
        state.data.checkInBin.unshift(ci);
        state.data.points.history.push(...related);
        recalcPoints();
        recalcCourage();
        saveState();
        render();
    });
}

// 编辑打卡项：自定义弹窗（第一行名称 / 第二行难度），避免 prompt 在嵌入环境被屏蔽
let _editCheckInId = null;
function editCheckIn(id) {
    const ci = state.data.checkIns.find(x => x.id === id);
    if (!ci) return;
    _editCheckInId = id;
    const modal = document.getElementById('editCheckInModal');
    const nameInput = document.getElementById('editCheckInName');
    if (nameInput) nameInput.value = ci.name || '';
    renderEditStars(ci.stars || 3);
    // 生成分组下拉选项（按板块管理中的顺序）
    const catSelect = document.getElementById('editCheckInCategory');
    if (catSelect) {
        const cats = getCategories();
        const order = getCategoryOrder();
        catSelect.innerHTML = order.map(k => `<option value="${k}" ${ci.module === k ? 'selected' : ''}>${escapeHtml(cats[k])}</option>`).join('');
    }
    if (modal) modal.classList.add('show');
}
function renderEditStars(cur) {
    const wrap = document.getElementById('editCheckInStars');
    const grade = document.getElementById('editCheckInGrade');
    if (!wrap) return;
    wrap.querySelectorAll('.cstar').forEach(sp => {
        const v = parseInt(sp.dataset.stars);
        sp.classList.toggle('on', v <= cur);
        sp.onclick = () => {
            state._editStars = v;
            renderEditStars(v);
        };
    });
    state._editStars = cur;
    if (grade) grade.textContent = `${flowerLevel(cur).name} · 满分 ${flowerLevel(cur).max}分 · ${flowerLevel(cur).slogan}`;
}
function saveEditCheckIn() {
    if (!_editCheckInId) return;
    const ci = state.data.checkIns.find(x => x.id === _editCheckInId);
    if (!ci) { closeEditCheckIn(); return; }
    const nameInput = document.getElementById('editCheckInName');
    const name = nameInput ? nameInput.value.trim() : '';
    if (name) ci.name = name;
    const s = state._editStars || ci.stars || 3;
    ci.stars = s;
    ci.points = flowerScore(s); // 分数由花朵定级决定
    // 调整分组：只改 module/category，不碰历史积分和打卡记录
    const catSelect = document.getElementById('editCheckInCategory');
    const newModule = catSelect ? catSelect.value : ci.module;
    if (newModule && newModule !== ci.module) {
        const cats = getCategories();
        ci.module = newModule;
        ci.category = cats[newModule] || ci.category;
    }
    closeEditCheckIn();
    saveState();
    render();
}
function closeEditCheckIn() {
    _editCheckInId = null;
    const modal = document.getElementById('editCheckInModal');
    if (modal) modal.classList.remove('show');
}

// 补打卡（每周 1 次，扣 50 积分，买回昨日记录保住连续）
function makeupCheckIn() {
    const weekKey = getWeekKey(today());
    if (state.data.makeupLog[weekKey] && state.data.makeupLog[weekKey] >= 1) {
        toast('本周补打卡已用完（每周 1 次）');
        return;
    }
    const available = state.data.points.earned - state.data.points.used;
    if (available < 50) { toast('可用积分不足 50，无法补打卡'); return; }
    addPointsEntry({ points: -50, type: 'makeup_fee', date: today(), reason: '补打卡手续费' });
    const y = new Date(); y.setDate(y.getDate() - 1);
    addPointsEntry({ points: 0, type: 'makeup', date: dateStr(y), reason: '补打卡' });
    state.data.makeupLog[weekKey] = (state.data.makeupLog[weekKey] || 0) + 1;
    recalcPoints();
    saveState();
    render();
    toast('✅ 已补回昨日打卡（扣除 50 积分）');
}

function getWeekKey(dateStr) {
    const d = new Date(dateStr);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
}

// 打卡飘字动画 + 震动 + 音效
function showFloat(text) {
    const el = document.createElement('div');
    el.className = 'float-points';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

// 游戏化激励浮字（与积分浮字错开位置，避免重叠）
function vibrate() {
    if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
}
function playDing() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.start(); o.stop(ctx.currentTime + 0.32);
    } catch (e) {}
}

// 兑换烟花特效
function showFireworks() {
    const colors = ['#6b8e5e', '#d4a373', '#e57373', '#ffd54f', '#64b5f6', '#ba68c8'];
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'firework-particle';
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 120;
        p.style.left = '50%';
        p.style.top = '40%';
        p.style.background = colors[i % colors.length];
        p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    }
    vibrate();
}

function recalcPoints() {
    state.data.points.earned = state.data.points.history.reduce((s, x) => s + x.points, 0);
    // 已使用积分始终由「已兑换的心愿」实时推导，避免与兑换/删除操作脱节
    state.data.points.used = state.data.wishes.filter(w => w.exchanged).reduce((s, w) => s + (w.points || 0), 0);
}

function addWish(name, points, image) {
    state.data.wishes.push({
        id: uuid(),
        name,
        points: parseInt(points) || 0,
        image: image || '',
        exchanged: false,
        exchangedAt: null,
        createdAt: now()
    });
    saveState();
    render();
}

function deleteWish(id) {
    const wish = state.data.wishes.find(x => x.id === id);
    if (!wish) return;
    const wasExchanged = !!wish.exchanged;
    if (!wasExchanged) {
        // 未兑换移入回收站
        wish.deletedAt = now();
        state.data.wishBin.unshift(wish);
    }
    // 已兑换的心愿删除后，recalcPoints 会自动把对应积分从「已使用」中剔除
    state.data.wishes = state.data.wishes.filter(x => x.id !== id);
    recalcPoints();
    saveState();
    render();
    if (wasExchanged) toast(`已退还 ${wish.points} 积分`);
    toastUndo(wasExchanged ? `🗑️ 已删除并退还 ${wish.points} 积分` : '🗑️ 心愿已移入回收站', () => {
        state.data.wishes.push(wish);
        state.data.wishBin = state.data.wishBin.filter(x => x.id !== id);
        recalcPoints();
        saveState();
        render();
    });
}

function restoreWish(id) {
    const wish = state.data.wishBin.find(x => x.id === id);
    if (!wish) return;
    wish.deletedAt = null;
    state.data.wishes.push(wish);
    state.data.wishBin = state.data.wishBin.filter(x => x.id !== id);
    saveState();
    render();
}

function purgeWish(id) {
    const w = state.data.wishBin.find(x => x.id === id);
    if (!w) return;
    state.data.wishBin = state.data.wishBin.filter(x => x.id !== id);
    saveState();
    render();
    toastUndo('🗑️ 已彻底删除', () => {
        state.data.wishBin.unshift(w);
        saveState();
        render();
    });
}

function updateWishImage(id, image) {
    const wish = state.data.wishes.find(x => x.id === id);
    if (wish) {
        wish.image = image;
        saveState();
        render();
    }
}

function exchangeWish(id) {
    const wish = state.data.wishes.find(x => x.id === id);
    if (!wish || wish.exchanged) return;
    const available = state.data.points.earned - state.data.points.used;
    if (available >= wish.points) {
        wish.exchanged = true;
        wish.exchangedAt = now();
        recalcPoints();
        saveState();
        render();
        showFireworks();
        toast(`🎉 兑换成功：${wish.name}`);
    } else {
        toast('积分不足，继续加油呀');
    }
}

function updateMemo(text) {
    state.data.memo = text;
    saveStateDebounced();
}

// ==================== 渲染 ====================
function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = getModules().map(m => `
        <div class="nav-item ${state.currentModule === m.id ? 'active' : ''}" data-action="tab" data-module="${m.id}">
            <span class="nav-icon">${escapeHtml(m.icon || '📁')}</span>
            <span>${escapeHtml(m.name)}</span>
        </div>
    `).join('');
}

function render() {
    // 任何显式重绘都视为已"消费"掉后台轮询推迟的待渲染标记
    state._deferredRender = false;
    // 当前模块若被隐藏/不存在，回退到第一个可见模块，避免空白页
    const visible = getModules();
    if (!visible.find(m => m.id === state.currentModule)) {
        state.currentModule = visible[0].id;
    }
    renderSidebar();
    const module = getModuleById(state.currentModule);
    document.getElementById('pageTitle').textContent = module ? module.name : '首页';
    const renderer = moduleRenderers[state.currentModule];
    document.getElementById('content').innerHTML = renderer ? renderer() : '';
    updateSyncStatus(state.syncStatus);
    // 首页/热点/学习/变美情报局等异步加载最新内容
    if (state.currentModule === 'home') loadHomeData();
    if (state.currentModule === 'hot') loadHotData();
    if (state.currentModule === 'beauty') loadBeautyData();
}

function subTabs(tabs, current, module) {
    return `
        <div class="tab-bar">
            ${tabs.map(t => `
                <button class="tab-btn ${current === t.id ? 'active' : ''}" data-action="tab" data-module="${module}" data-tab="${t.id}">${t.icon || ''} ${t.name}</button>
            `).join('')}
        </div>
    `;
}

// 用户自由设定的「积分兑换规则」文案（系统不再默认折算成钱）
function getExchangeRuleText() {
    const r = (state.settings.exchangeRule || '').trim();
    return r || '尚未设定 · 去「设置」填写你的积分兑换规则';
}

function pointsSummaryCard() {
    recalcPoints();
    const todayEarned = state.data.points.history.filter(x => x.date === today()).reduce((s, x) => s + x.points, 0);
    const earned = state.data.points.earned;
    const used = state.data.points.used;
    const available = earned - used;
    return `
        <div class="card points-mini">
            <div class="card-header">
                <div class="card-title">⭐ 积分统计</div>
                <span style="font-size:12px;color:var(--text-secondary)">${escapeHtml(getExchangeRuleText())}</span>
            </div>
            <div class="points-summary">
                <div class="summary-box"><div class="summary-label">今日打卡得分</div><div class="summary-value income">+${todayEarned}</div></div>
                <div class="summary-box"><div class="summary-label">合计总分</div><div class="summary-value">${earned}</div></div>
                <div class="summary-box"><div class="summary-label">已使用总分</div><div class="summary-value expense">-${used}</div></div>
                <div class="summary-box"><div class="summary-label">当前可用积分</div><div class="summary-value" style="color:var(--primary)">${available}</div></div>
            </div>
        </div>
    `;
}

// 打卡日历（紧凑）通用渲染 —— 纯内容版（外层卡片由调用方提供）
function calendarBodyHTML() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    const historyByDate = {};
    state.data.points.history.forEach(x => {
        const d = x.date;
        historyByDate[d] = (historyByDate[d] || 0) + 1;
    });
    const checkedDays = getCheckedDays();
    return `
        <div class="accordion-hint">${year}年 ${month + 1}月 · 已打卡 <strong>${checkedDays}</strong> 天</div>
        <div class="calendar calendar-compact">
            <div class="calendar-header">日</div>
            <div class="calendar-header">一</div>
            <div class="calendar-header">二</div>
            <div class="calendar-header">三</div>
            <div class="calendar-header">四</div>
            <div class="calendar-header">五</div>
            <div class="calendar-header">六</div>
            ${days.map(d => {
                if (!d) return '<div class="calendar-day empty"></div>';
                const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const count = historyByDate[ds] || 0;
                const hearts = count > 0 ? '💗'.repeat(Math.min(5, count)) : '';
                const isToday = ds === today();
                return `<div class="calendar-day ${isToday ? 'today' : ''} ${count > 0 ? 'checked' : ''}"><span class="cal-num">${d}</span><span class="cal-hearts">${hearts}</span></div>`;
            }).join('')}
        </div>
        <div class="calendar-legend">💗 越多，代表今天打卡越积极（最多 5 颗）</div>
    `;
}

// 兼容旧调用（独立页面仍可用整卡）
function calendarCardHTML() {
    return `<div class="card calendar-card">${calendarBodyHTML()}</div>`;
}


// 可折叠二级板块（手风琴）：默认收起，点击标题展开/收起；状态持久化到 state.accordion
function accordionSection(key, icon, title, bodyHTML, opts = {}) {
    state.accordion = state.accordion || {};
    const collapsed = !!state.accordion[key];
    return `
        <div class="card accordion ${collapsed ? 'collapsed' : ''}" id="acc-${key}">
            <div class="accordion-header" data-action="toggle-accordion" data-key="${key}">
                <div class="accordion-title">${icon ? icon + ' ' : ''}${title}</div>
                <div class="accordion-right">
                    ${opts.badge ? `<span class="accordion-badge">${opts.badge}</span>` : ''}
                    <span class="accordion-chevron">${collapsed ? '▸' : '▾'}</span>
                </div>
            </div>
            <div class="accordion-body">${bodyHTML}</div>
        </div>
    `;
}

// ==================== 排位赛渲染 ====================
function renderStarPips(t) {
    if (t.isKing) return '<span class="pip-king">★ 无上限 · 累计星数</span>';
    let pips = '';
    for (let i = 0; i < t.starsToNext; i++) {
        pips += `<span class="star-pip ${i < t.starsInTier ? 'on' : ''}">★</span>`;
    }
    return pips;
}

// 首页/统计页通用段位卡（图2样式）
function rankHeroCard() {
    recalcPoints();
    const rs = getRankStars();
    const t = getTierInfo(rs);
    const courage = state.data.game.courage || 0;
    const cap = getCourageCap();
    const streak = getCurrentStreak();
    const nextTier = RANK_TIERS.find(x => x.startStars > rs);
    const toNext = t.isKing ? 0 : (t.starsToNext - t.starsInTier);
    const earned = state.data.points.earned;
    const pct = t.isKing ? 100 : Math.round(t.starsInTier / t.starsToNext * 100);
    const peakKey = (state.data.game.season && state.data.game.season.peakKey) || t.rankKey;
    const peakRankRaw = RANKS.find(r => r.key === peakKey) || RANKS[0];
    const peakLv = LEVELS.find(l => l.prefix === peakRankRaw.name) || {};
    const peakRank = { ...peakRankRaw, title: peakLv.title || '' };
    const sub = t.isKing
        ? `已超越王者起点 ${t.kingStars} 星`
        : `还差 <strong>${toNext}</strong> 星升到 ${nextTier.rankName} ${nextTier.roman}${nextTier.title ? '·' + nextTier.title : ''}`;
    return `
        <div class="card rank-hero" style="border-left:4px solid ${t.color}">
            <div class="rank-hero-top">
                <div class="rank-badge" style="background:${t.color}22;color:${t.color}">${t.icon}</div>
                <div class="rank-hero-info">
                    <div class="rank-hero-name" style="color:${t.color}">${t.rankName} ${t.roman || ''} · ${t.title}</div>
                    <div class="rank-hero-sub">${sub}</div>
                </div>
                <div class="rank-stars-num" style="color:${t.color}">${rs}<span>★</span></div>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${t.color},${t.color}99)"></div></div>
            <div class="rank-progress-meta">
                ${t.isKing
                    ? `⭐ 累计 ${earned} 积分 · 王者星数无上限，继续冲！`
                    : `⭐ 累计 ${earned} 积分 · 本段 ${t.starsInTier}/${t.starsToNext} 星 · 差 ${toNext} 星 = ${toNext * 100} 积分升段`}
            </div>
            <div class="rank-hero-meta">
                <span>🌟 星能 ${courage}/${cap}</span>
                <span>🔥 连胜 ${streak} 天</span>
                <span>📅 本赛季最高 ${peakRank.name}${peakRank.title ? '·' + peakRank.title : ''}</span>
            </div>
        </div>
    `;
}

function rankBigCard() {
    recalcPoints();
    const rs = getRankStars();
    const t = getTierInfo(rs);
    const nextTier = RANK_TIERS.find(x => x.startStars > rs);
    const toNext = t.isKing ? 0 : (t.starsToNext - t.starsInTier);
    const pct = t.isKing ? 100 : Math.round(t.starsInTier / t.starsToNext * 100);
    const earned = state.data.points.earned;
    const courage = state.data.game.courage || 0, cap = getCourageCap();
    const streak = getCurrentStreak();
    const peakKey = (state.data.game.season && state.data.game.season.peakKey) || t.rankKey;
    const peakRankRaw = RANKS.find(r => r.key === peakKey) || RANKS[0];
    const peakLv = LEVELS.find(l => l.prefix === peakRankRaw.name) || {};
    const peakRank = { ...peakRankRaw, title: peakLv.title || '' };
    return `
        <div class="card rank-big" style="background:linear-gradient(135deg, ${t.color}26, #ffffff 70%);border:1px solid ${t.color}55">
            <div class="rank-big-head">
                <div class="rank-badge-lg" style="background:${t.color}">${t.icon}</div>
                <div class="rank-big-text">
                    <div class="rank-big-name">${t.rankName} <span>${t.roman || '★'}</span> · ${t.title}</div>
                    <div class="rank-big-sub">${t.isKing ? ('已超越王者起点 ' + t.kingStars + ' 星') : ('还差 ' + toNext + ' 星升到 ' + (nextTier ? nextTier.rankName + ' ' + nextTier.roman + ' · ' + nextTier.title : '王者'))}</div>
                </div>
                <div class="rank-big-stars">${rs}<small>★</small></div>
            </div>
            <div class="rank-stars-row big">${renderStarPips(t)}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${t.color},${t.color}99)"></div></div>
            <div class="rank-progress-meta">
                ${t.isKing
                    ? `⭐ 累计 ${earned} 积分 · 王者星数无上限，继续冲！`
                    : `⭐ 累计 ${earned} 积分 · 本段 ${t.starsInTier}/${t.starsToNext} 星 · 差 ${toNext} 星 = ${toNext * 100} 积分升段`}
            </div>
            <div class="rank-big-meta">
                <span>🌟 星能 ${courage}/${cap}</span>
                <span>🔥 连胜 ${streak}天</span>
                <span>📅 本赛季最高 ${peakRank.name}${peakRank.title ? '·' + peakRank.title : ''}</span>
            </div>
        </div>
    `;
}

function rankCourageCard() {
    const courage = state.data.game.courage || 0, cap = getCourageCap();
    const pct = Math.min(100, Math.round(courage / cap * 100));
    const canStar = cap >= COURAGE_STAR;
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">🌟 星能</div><span class="rank-tag">满 ${COURAGE_STAR} 自动 +1 星</span></div>
            <div class="courage-num">${courage} <small>/ ${cap}</small></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg,#ffb020,#ff7a00)"></div></div>
            <div class="rank-rule">每完成 1 项打卡 +5；日常习惯全勤额外 +10。${canStar ? ('攒满 ' + COURAGE_STAR + ' 自动白嫖 1 颗星 🎉') : ('（当前段位上限 ' + cap + '，升到黄金段位后即可攒满加星）')}</div>
        </div>
    `;
}

function rankStreakCard() {
    const streak = getCurrentStreak();
    const next = [3, 7, 14, 30].find(m => streak < m) || 30;
    const stars = WIN_STREAK_STARS[next] || 5;
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">🔥 连胜加星</div><span class="rank-tag">当前连胜 ${streak} 天</span></div>
            <div class="streak-grid">
                ${[3, 7, 14, 30].map(m => `<div class="streak-node ${streak >= m ? 'done' : ''}">${m}天<br><b>+${WIN_STREAK_STARS[m]}★</b></div>`).join('')}
            </div>
            <div class="rank-rule">${streak >= 30 ? '🏆 已达成「常胜将军」最高连胜奖励！' : ('再连续打卡 ' + (next - streak) + ' 天，可 +' + stars + ' 星')}</div>
        </div>
    `;
}

function rankAchievementCard() {
    const g = state.data.game;
    const ctx = buildAchvCtx();
    const rows = ACHIEVEMENTS.map(a => {
        const un = g.achievements[a.id] && g.achievements[a.id].unlocked;
        return `
            <div class="achv-item ${un ? 'unlocked' : ''}">
                <div class="achv-medal">${un ? '🏅' : '🔒'}</div>
                <div class="achv-info">
                    <div class="achv-name2">${a.name} <span class="achv-cat">${a.cat}</span></div>
                    <div class="achv-desc">${a.desc}</div>
                </div>
                <div class="achv-reward">+${a.reward}<br>积分</div>
            </div>`;
    }).join('');
    const oneround = g.achievements['oneround'];
    const orLine = oneround ? `
        <div class="achv-item unlocked">
            <div class="achv-medal">🌟</div>
            <div class="achv-info">
                <div class="achv-name2">一日圆满 <span class="achv-cat">全能选手·可重复</span></div>
                <div class="achv-desc">单日全部习惯完成，已达成 ${oneround.count} 次</div>
            </div>
            <div class="achv-reward">+20<br>积分/次</div>
        </div>` : '';
    const titles = (g.titles && g.titles.length)
        ? g.titles.map(t => `<span class="title-chip">🎖️ ${t}</span>`).join('')
        : '<span class="rank-rule">还没有称号，继续冲！</span>';
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">🏆 成就墙</div><span class="rank-tag">收集癖的快乐</span></div>
            <div class="title-list">${titles}</div>
            ${rows}${orLine}
        </div>
    `;
}

function rankSeasonCard() {
    const g = state.data.game;
    const cur = getCurrentSeason();
    const daysLeft = seasonDaysLeft(cur);
    const peakKey = (g.season && g.season.peakKey) || 'bronze';
    const reward = SEASON_REWARDS[peakKey] || SEASON_REWARDS.bronze;
    const t = getTierInfo(getRankStars());
    const targetKey = INHERIT_TARGET[t.rankKey] || t.rankKey;
    const afterTier = RANK_TIERS.find(x => x.rankKey === targetKey && x.roman === 'Ⅲ') || RANK_TIERS.find(x => x.rankKey === targetKey) || RANK_TIERS[0];
    const isSame = t.rankKey === targetKey;
    const peakRankObj = RANKS.find(r => r.key === peakKey) || RANKS[0];
    const peakLv = LEVELS.find(l => l.prefix === peakRankObj.name) || {};
    const peakName = peakRankObj.name + (peakLv.title ? '·' + peakLv.title : '');
    const currentName = `${t.rankName} ${t.roman || ''}${t.title ? '·' + t.title : ''}`;
    const afterName = `${afterTier.rankName} ${afterTier.roman || ''}${afterTier.title ? '·' + afterTier.title : ''}`;
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">📅 ${cur.name}</div><span class="rank-tag">还剩 ${daysLeft} 天</span></div>
            <div class="season-grid">
                <div class="season-box"><div class="sb-label">本赛季最高段位</div><div class="sb-value">${peakName}</div></div>
                <div class="season-box"><div class="sb-label">结算奖励预览</div><div class="sb-value">+${reward.points} 积分${reward.title ? '<br>' + reward.title : ''}</div></div>
            </div>
            <div class="rank-rule">新赛季继承：${isSame ? '青铜/白银选手保持原段位不变' : `当前 ${currentName} 将回到 ${afterName}（高段位掉 2 段，中下游掉 1 段）`}</div>
        </div>
    `;
}

function rankRulesCard() {
    const cur = getCurrentSeason();
    const seasonNames = SEASONS.map(s => s.name).join(' / ');
    return accordionSection('rankrules', '📖', '排位赛规则说明', `
        <div class="rule-text">
            <p><b>💡 积分兑换规则：</b>${escapeHtml(getExchangeRuleText())}。积分只用于兑换你设定的心愿，系统不折算现金。<b>1 星 = 100 积分</b>，例如：倔强青铜 Ⅲ → Ⅱ 需要 4 星 = 400 积分。</p>
            <p><b>🏅 段位阶梯：</b>倔强青铜·萌芽新手 → 秩序白银·自律学徒 → 荣耀黄金·坚持达人 → 尊贵铂金·习惯大师 → 永恒钻石·掌控精英 → 至尊星耀·自律宗师 → 最强王者·无限巅峰。每大段含 Ⅲ→Ⅱ→Ⅰ 三个小段，青铜/白银每小段 4 星，黄金/铂金/钻石每小段 5 星，星耀每小段 6 星，王者无上限累计星数。</p>
            <p><b>🌟 升段与积分：</b>段位只看「累计获得积分」。你每天打卡获得的积分会自动换算成星星：累计 100 积分 = 1 星。花掉积分兑换心愿只会减少「可用积分」，不会掉星、不会掉段。</p>
            <p><b>🌟 星能：</b>每完成 1 项打卡 +5 星能；「日常习惯」板块全部完成即全勤打卡，额外 +10 星能。星能按赛季计算，每个新赛季自动清零重算（与段位一样会更新），但删除习惯不会抹掉它在本赛季已贡献的星能。星能上限随段位提升：青铜 60 / 白银 80 / 黄金及以上 100+。攒满 100 自动消耗并额外 +1 星（低段位上限不足则无法触发，升到黄金即可开始白嫖星）。</p>
            <p><b>📊 每日完成度奖励：</b>打卡是本分，完成度才是激励。当天「日常习惯」完成数量超过一半，额外 +5 积分；日常习惯全部完成，额外 +10 积分。取消打卡后会自动重新计算并降级/撤销。</p>
            <p><b>🔥 连胜加星：</b>连续打卡 3/7/14/30 天，分别额外 +1/2/3/5 星；连续 30 天解锁专属称号「常胜将军」。漏打卡不会扣星，但会中断连胜。</p>
            <p><b>🏆 成就系统：</b>累计打卡天数、连续打卡天数、单日全部习惯完成、早起首卡、首次达到铂金/王者段位、用星能白嫖星星等，均可解锁成就称号与积分奖励。</p>
            <p><b>📅 赛季制：</b>每 3 个月为一个赛季（${seasonNames}）。赛季末按本赛季达到的最高段位发放积分+称号奖励；新赛季开始时高段位（王者/星耀/钻石）回退 2 个大段，中下游（铂金/黄金/白银）回退 1 个大段，青铜不变。赛季继承只影响当前段位，不会删除或重置历史打卡积分、积分流水和兑换记录。</p>
        </div>
    `);
}

// 今日积分流水
function homeLedger() {
    const hist = state.data.points.history.filter(h => h.date === today()).sort((a, b) => (a.time < b.time ? 1 : -1));
    const sum = hist.reduce((s, x) => s + x.points, 0);
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">🧾 今日积分流水</div>
                <span style="font-size:13px;color:var(--primary);font-weight:700">+${sum}</span>
            </div>
            ${hist.length ? hist.map(h => `
                <div class="ledger-row">
                    <span class="ledger-reason">${ledgerReason(h)}</span>
                    <span class="ledger-pts ${h.points >= 0 ? 'plus' : 'minus'}">${h.points >= 0 ? '+' : ''}${h.points}</span>
                </div>
            `).join('') : '<div class="empty-state"><span class="emoji">🪙</span>今天还没获得积分，快去打卡吧</div>'}
        </div>
    `;
}

function ledgerReason(h) {
    if (h.reason) return h.reason;
    if (h.type === 'base' && h.checkInId) {
        const it = state.data.checkIns.find(c => c.id === h.checkInId) || state.data.checkInBin.find(c => c.id === h.checkInId);
        return it ? it.name : '打卡';
    }
    return '积分';
}

// 习惯成就墙
function homeAchievements() {
    const rows = state.data.checkIns.map(it => {
        const best = getLongestStreak(it.id);
        const badges = ACHV_MILESTONES.filter(m => best >= m.days).map(m => `${m.icon}`).join(' ');
        return { name: it.name, best, badges };
    });
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">🏆 习惯成就墙</div>
                <span style="font-size:12px;color:var(--text-secondary)">坚持 30/60/100 天解锁徽章</span>
            </div>
            ${rows.map(r => `
                <div class="achv-row">
                    <span class="achv-name">${escapeHtml(r.name)}</span>
                    <span class="achv-best">${r.best} 天</span>
                    <span class="achv-badges">${r.badges || '<span style="color:var(--text-secondary)">—</span>'}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// 首页折叠用：纯内容版（无外层 .card）
function homeAchievementsBody() {
    const rows = state.data.checkIns.map(it => {
        const best = getLongestStreak(it.id);
        const badges = ACHV_MILESTONES.filter(m => best >= m.days).map(m => `${m.icon}`).join(' ');
        return { name: it.name, best, badges };
    });
    return `
        <div class="accordion-hint">坚持 30/60/100 天解锁专属徽章</div>
        ${rows.map(r => `
            <div class="achv-row">
                <span class="achv-name">${escapeHtml(r.name)}</span>
                <span class="achv-best">${r.best} 天</span>
                <span class="achv-badges">${r.badges || '<span style="color:var(--text-secondary)">—</span>'}</span>
            </div>
        `).join('')}
    `;
}

function homeLedgerBody() {
    const hist = state.data.points.history.filter(h => h.date === today()).sort((a, b) => (a.time < b.time ? 1 : -1));
    const sum = hist.reduce((s, x) => s + x.points, 0);
    return `
        <div class="accordion-hint">今日共获得 <strong style="color:var(--primary)">+${sum}</strong> 分</div>
        ${hist.length ? hist.map(h => `
            <div class="ledger-row">
                <span class="ledger-reason">${ledgerReason(h)}</span>
                <span class="ledger-pts ${h.points >= 0 ? 'plus' : 'minus'}">${h.points >= 0 ? '+' : ''}${h.points}</span>
            </div>
        `).join('') : '<div class="empty-state"><span class="emoji">🪙</span>今天还没获得积分，快去打卡吧</div>'}
    `;
}

// 补打卡入口 —— 纯内容版（外层卡片由调用方提供）
function makeupBody() {
    const weekKey = getWeekKey(today());
    const used = state.data.makeupLog[weekKey] || 0;
    const left = 1 - used;
    const available = state.data.points.earned - state.data.points.used;
    return `
        <div class="accordion-hint">本周剩余 <strong>${left}</strong> 次补打卡机会</div>
        <div class="makeup-tip">不小心漏了一天？用 <strong>50 积分</strong> 买回昨日打卡，保住连续记录，不惩罚只兜底。</div>
        <button class="btn ${left > 0 && available >= 50 ? 'btn-primary' : 'btn-secondary'}" data-action="makeup-checkin" ${left > 0 && available >= 50 ? '' : 'disabled'}>
            ${left > 0 ? (available >= 50 ? '立即补打卡（扣 50 分）' : '积分不足 50') : '本周已用完'}
        </button>
    `;
}

// 兼容旧调用
function makeupCard() {
    return `<div class="card makeup-card">${makeupBody()}</div>`;
}

// 首页动态小树：完成一个习惯，一片叶子就会被点亮
function homeTreeSVG(done, total) {
    const leaves = [];
    const maxLeaves = Math.max(total || 1, 1);
    const cx = 60, cy = 55, r = 38;
    // 把叶子分布成树冠，留一个顶部给树梢
    for (let i = 0; i < maxLeaves; i++) {
        const angle = -Math.PI / 2 + (i / (maxLeaves - 1 || 1) - 0.5) * Math.PI * 1.2;
        const dist = r * (0.65 + 0.35 * Math.sin(i * 3));
        const lx = cx + Math.cos(angle) * dist;
        const ly = cy + Math.sin(angle) * dist * 0.85;
        const filled = i < done;
        leaves.push(`<ellipse class="tree-leaf ${filled ? 'filled' : ''}" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="7" ry="5" transform="rotate(${(angle * 180 / Math.PI + 90).toFixed(0)} ${lx.toFixed(1)} ${ly.toFixed(1)})" />`);
    }
    return `
        <svg viewBox="0 0 120 120" class="tree-svg">
            <!-- 树冠底晕 -->
            <circle cx="60" cy="55" r="42" class="tree-glow" />
            <!-- 树干 -->
            <path class="tree-trunk" d="M60 92 Q58 70 55 55 Q53 40 48 30" />
            <path class="tree-trunk" d="M60 92 Q62 72 65 58 Q68 45 72 35" />
            <path class="tree-trunk" d="M60 92 L60 50" />
            <!-- 分枝 -->
            <path class="tree-branch" d="M55 55 Q45 48 38 50" />
            <path class="tree-branch" d="M65 58 Q75 52 82 55" />
            <path class="tree-branch" d="M60 50 Q60 35 60 25" />
            <!-- 叶子 -->
            ${leaves.join('')}
        </svg>
    `;
}

// 首页：苹果风「今日」视图（正向、不焦虑）
function homeOverviewBody(checkedDays, doubleToday, doubleDayNum) {
    const hour = new Date().getHours();
    const greet = hour < 6 ? '夜深了' : hour < 11 ? '早安' : hour < 14 ? '午安' : hour < 18 ? '下午好' : hour < 23 ? '晚上好' : '夜深了';
    const name = escapeHtml(state.settings.name || '顾一');
    recalcPoints();
    const earned = state.data.points.earned;
    const used = state.data.points.used;
    const available = earned - used;
    const lv = getLevel(earned);
    const streak = getCurrentStreak();
    // 「今日小树」只挂钩「日常习惯」板块，动态跟随用户新增/删减的日常习惯
    const dailyItems = state.data.checkIns.filter(c => c.module === 'daily').sort((a, b) => a.order - b.order);
    const total = dailyItems.length;
    const doneIds = new Set(state.data.points.history.filter(h => h.date === today() && h.type === 'base').map(h => h.checkInId));
    const doneToday = dailyItems.filter(it => doneIds.has(it.id)).length;
    const pct = total ? Math.round(doneToday / total * 100) : 0;
    const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

    const todayMsg = total === 0
        ? '先去「认真打卡」里添加几个日常小习惯吧～'
        : pct === 100
            ? '今天的日常习惯全部完成，小树长得枝繁叶茂啦！🌟'
            : `今天日常习惯已完成 ${doneToday}/${total}，小树正在悄悄长大 🌱`;

    return `
        <div class="card home-hero apple-hero">
            <div class="hero-greet">正在载入今日关卡... 🎮</div>
            <div class="hero-date">${dateStr}${escapeHtml(getLunarDate()) ? ' · ' + escapeHtml(getLunarDate()) : ''}</div>
            <div class="hero-line">${doubleToday ? '🔥 今天是双倍积分日，打卡积分翻倍，别错过～' : '完成今日主线，即可解锁明日地图 🔓'}</div>
        </div>

        <div class="card home-tree">
            <div class="home-tree-left">
                ${homeTreeSVG(doneToday, total)}
                <div class="tree-pct">${pct}%</div>
            </div>
            <div class="home-tree-right">
                <div class="home-tree-title">今日小树</div>
                <div class="home-tree-msg">${todayMsg}</div>
                ${total ? `<div class="home-tree-sub">共 ${total} 个日常习惯 · 已完成 ${doneToday} 个</div>` : ''}
                <button class="btn btn-primary apple-cta" data-action="tab" data-module="checkin">继续打卡 →</button>
            </div>
        </div>

        ${rankHeroCard()}

        <div class="card quote-card">
            <div class="card-header"><div class="card-title">💬 今日金句</div><span style="font-size:12px;color:var(--text-secondary)">每日一句，点亮心情</span></div>
            ${homeQuoteBody()}
        </div>

        <div class="card history-card">
            <div class="card-header"><div class="card-title">📜 历史上的今天</div><span style="font-size:12px;color:var(--text-secondary)">每日更新 · 每天推荐一条历史事件</span></div>
            ${homeHistoryBody()}
        </div>
    `;
}

function homeStat(value, label, unit, icon) {
    return `
        <div class="card stat-card">
            ${icon ? `<div class="stat-icon">${icon}</div>` : ''}
            <div class="stat-value">${value}<span class="stat-unit">${unit}</span></div>
            <div class="stat-label">${label}</div>
        </div>
    `;
}

function homeQuoteBody() {
    return `
        <div class="quote-head">
            <span id="dailyQuoteTag" class="quote-tag">💬 鼓励</span>
            <button class="quote-refresh" data-action="refresh-quote" title="换一句">🔄 换一句</button>
        </div>
        <div id="dailyQuote" style="font-size:16px;font-weight:500;line-height:1.6">正在加载今日鼓励...</div>
        <div id="dailyQuoteFrom" class="quote-en"></div>
    `;
}

function homeHistoryBody() {
    return `
        <div id="historyToday">正在加载...</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:10px;text-align:center">历史上的今天内容每日联网更新</div>
    `;
}

// 积分页：统计 tab 主体
function pointsStatsBody() {
    recalcPoints();
    const todayEarned = state.data.points.history.filter(x => x.date === today()).reduce((s, x) => s + x.points, 0);
    const earned = state.data.points.earned;
    const used = state.data.points.used;
    const available = earned - used;
    const binCount = state.data.wishBin.length;
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">⭐ 积分 / 段位统计</div>
                <span style="font-size:12px;color:var(--text-secondary)">${escapeHtml(getExchangeRuleText())}</span>
            </div>
            <div class="points-summary">
                <div class="summary-box"><div class="summary-label">今日打卡得分</div><div class="summary-value income">+${todayEarned}</div></div>
                <div class="summary-box"><div class="summary-label">合计总分</div><div class="summary-value">${earned}</div></div>
                <div class="summary-box"><div class="summary-label">已使用总分</div><div class="summary-value expense">-${used}</div></div>
                <div class="summary-box"><div class="summary-label">当前可用积分</div><div class="summary-value" style="color:var(--primary)">${available}</div></div>
            </div>
            <button class="btn btn-secondary" data-action="tab" data-module="points" data-tab="ledger" style="margin-top:12px;font-size:13px">🧾 查看积分流水</button>
        </div>
        <div class="card">
            <div class="card-header"><div class="card-title">🛍️ 我的心愿</div><span style="font-size:12px;color:var(--text-secondary)">攒积分，兑心愿</span></div>
            ${wishListBody(available)}
            ${binCount ? `<div style="margin-top:16px"><div class="card-title" style="margin-bottom:8px;font-size:14px">🗑️ 心愿回收站（${binCount}）</div>${wishBinBody()}</div>` : ''}
        </div>
    `;
}


function validSubTab(moduleId, tabs, defaultId) {
    const current = state.currentSubTab[moduleId];
    if (current && tabs.some(t => t.id === current)) return current;
    return defaultId;
}

const moduleRenderers = {
    home() {
        const checkedDays = getCheckedDays();
        const doubleToday = isDoubleDay(today());
        const doubleDayNum = getDoubleDay(0);
        return homeOverviewBody(checkedDays, doubleToday, doubleDayNum);
    },

    checkin() {
        const tabs = CHECKIN_TABS;
        const tab = validSubTab('checkin', tabs, 'category');
        let body = '';
        if (tab === 'category') body = renderCheckInCategory();
        else if (tab === 'schedule') body = renderCheckInSchedule();
        else if (tab === 'manage') body = renderCheckInManage();
        else if (tab === 'admin') body = renderCheckInAdmin();
        else body = renderCheckInMore();
        return `<div class="card tab-card">${subTabs(tabs, tab, 'checkin')}</div>${body}`;
    },


    study() {
        const tabs = [
            { id: 'reading', name: '阅读', icon: '📖' },
            { id: 'english', name: '英语学习', icon: '🗣️' }
        ];
        const tab = validSubTab('study', tabs, 'reading');
        let body = '';
        if (tab === 'reading') body = renderReading();
        else body = renderEnglish();
        return `<div class="card tab-card">${subTabs(tabs, tab, 'study')}</div>${body}`;
    },

    hot() {
        const tabs = [
            { id: 'mixed', name: '综合热榜', icon: '🔥' },
            { id: 'politics', name: '时事新闻', icon: '🏛️' }
        ];
        const tab = validSubTab('hot', tabs, 'mixed');
        return `<div class="card tab-card">${subTabs(tabs, tab, 'hot')}</div><div id="hotListWrap" class="card">${renderHotList(tab)}</div>`;
    },

    beauty() {
        const tabs = [
            { id: 'today', name: '今日宜美', icon: '🌤️' },
            { id: 'trend', name: '流行风向', icon: '🔥' },
            { id: 'arsenal', name: '灵感军火库', icon: '💅' }
        ];
        const tab = validSubTab('beauty', tabs, 'today');
        let body = '';
        if (tab === 'today') body = `<div id="beautyTodayWrap" class="card">${renderBeautyToday()}</div>`;
        else if (tab === 'trend') body = `<div id="beautyTrendWrap" class="card">${renderBeautyTrend()}</div>`;
        else body = renderBeautyArsenal();
        return `<div class="card tab-card">${subTabs(tabs, tab, 'beauty')}</div>${body}`;
    },

    treehole() {
        return renderTreeHole();
    },

    water() {
        return renderWater();
    },

    points() {
        const tab = validSubTab('points', POINTS_TABS, 'stats');
        recalcPoints();
        const available = state.data.points.earned - state.data.points.used;

        let body = '';
        if (tab === 'stats') body = pointsStatsBody();
        else if (tab === 'rank') {
            body = `
                ${rankBigCard()}
                ${rankCourageCard()}
                ${rankStreakCard()}
                ${rankAchievementCard()}
                ${rankSeasonCard()}
                ${rankRulesCard()}
            `;
        }
        else if (tab === 'ledger') body = `<div class="card">${homeLedgerBody()}</div>`;
        else if (tab === 'achv') body = `<div class="card">${homeAchievementsBody()}</div>`;
        else if (tab === 'makeup') body = `<div class="card makeup-card">${makeupBody()}</div>`;

        return `
            <div class="card tab-card">${subTabs(POINTS_TABS, tab, 'points')}</div>
            ${body}
        `;
    }
};

// 渲染每日金句：优先使用用户自定义金句库（userQuotes），空库时用内置 ENCOURAGE_QUOTES 兜底
function renderDailyQuote(seedOffset = null) {
    const quoteEl = document.getElementById('dailyQuote');
    const quoteFrom = document.getElementById('dailyQuoteFrom');
    const tagEl = document.getElementById('dailyQuoteTag');
    if (!quoteEl) return;

    const todayD = today();
    const userQuotes = state.data.userQuotes || [];
    let seed = parseInt(localStorage.getItem('growtree_quote_seed') || '0', 10) || 0;
    if (typeof seedOffset === 'number') {
        seed = (seed + 1) % 10000;
        localStorage.setItem('growtree_quote_seed', String(seed));
    }

    let q = null;
    // 今天还没指定金句时，从用户库或内置库中按日期索引选一句并缓存
    if (!state.data.dailyQuote || state.data.dailyQuote.date !== todayD) {
        q = pickDailyQuote(seed);
        state.data.dailyQuote = { ...q, date: todayD };
        saveStateLocal();
        queueSync();
    } else {
        q = state.data.dailyQuote;
    }

    quoteEl.textContent = q.text || '每一天都是新的开始。';
    quoteFrom.textContent = q.from ? `—— ${q.from}` : '';
    if (tagEl) {
        tagEl.textContent = `${q.icon || '💬'} ${q.category || '今日金句'}`;
    }
}

// 从用户金句库或内置库挑选一句；用户库为空则使用内置兜底
function pickDailyQuote(seedOffset = 0) {
    const userQuotes = state.data.userQuotes || [];
    if (userQuotes.length) {
        const idx = (getDailyIndex(userQuotes) + seedOffset) % userQuotes.length;
        const u = userQuotes[idx];
        return { text: u.text, from: u.from || '', category: '我的金句', icon: '💬', source: 'user', id: u.id };
    }
    // 兜底：内置分类金句
    const catKey = getDailyQuoteCategory(seedOffset);
    const cat = ENCOURAGE_QUOTES[catKey] || ENCOURAGE_QUOTES.heal;
    const idx = (getDailyIndex(cat.list) + seedOffset) % cat.list.length;
    return { text: cat.list[idx].text, from: cat.list[idx].from || '', category: cat.name, icon: cat.icon, source: 'local' };
}

// ==================== 首页数据加载 ====================
async function loadHomeData() {
    // 每日金句：改为用户自定义库，无需等待网络
    renderDailyQuote();

    // 历史上的今天（数据源：维基百科 On This Day，比旧接口更准确）
    const historyEl = document.getElementById('historyToday');
    if (historyEl) {
        const cached = getCache('history_wiki', today(), 60);
        if (cached && cached.list) {
            renderHistory(cached.list);
        } else {
            try {
                const d = new Date();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const res = await fetch(`${API.history}/${mm}/${dd}`);
                const data = await res.json();
                const raw = Array.isArray(data.selected) ? data.selected : [];
                const list = raw.map(it => {
                    // 取第一个非“XX年”的关联页面作为详情链接
                    const page = (it.pages || []).find(p => p.type === 'standard' && !/^\d+年$/.test(p.title || ''));
                    const link = page?.content_urls?.desktop?.page || page?.content_urls?.mobile?.page || '';
                    return {
                        year: String(it.year),
                        title: it.text,
                        link: link,
                        category: classifyHistory(it.text)
                    };
                });
                setCache('history_wiki', today(), { list });
                renderHistory(list);
            } catch (e) {
                // 8月13日 fallback：与维基百科保持一致
                const fallback = [
                    { year: '1961', title: '东德政府开始围绕西柏林建造柏林墙，封锁东西柏林交通往来。', category: 'international' },
                    { year: '1937', title: '日本军队以上海租界和军舰为基地向上海中国守军发起攻击，淞沪会战爆发。', category: 'domestic' },
                    { year: '1704', title: '西班牙王位继承战争期间，大同盟联军在布伦海姆战役中取得关键胜利。', category: 'international' },
                    { year: '1553', title: '神学家米格尔·塞尔韦特在日内瓦参加布道会时遭到逮捕。', category: 'international' },
                    { year: '1521', title: '埃尔南·科尔特斯攻陷阿兹特克首都特诺奇提特兰，皇帝夸乌特莫克投降。', category: 'international' }
                ];
                setCache('history_wiki', today(), { list: fallback });
                renderHistory(fallback);
            }
        }
    }
}

function classifyHistory(title) {
    const t = String(title || '');
    const domestic = ['中国', '北京', '上海', '香港', '澳门', '台湾', '中共', '中央', '国务院', '人大', '政协', '解放军', '抗日战争', '抗战', '开国', '建国', '回归', '奥运', '神舟', '嫦娥', '北斗', '孔子', '孙中山', '毛泽东', '邓小平'];
    if (domestic.some(k => t.includes(k))) return 'domestic';
    return 'international';
}

function renderHistory(list) {
    const el = document.getElementById('historyToday');
    if (!el) return;
    if (!list || !list.length) {
        el.innerHTML = '<div class="empty-state">暂无历史事件</div>';
        return;
    }
    const d = new Date();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const holiday = TODAY_HOLIDAYS[`${month}-${day}`];
    const domestic = list.filter(x => x.category === 'domestic').slice(0, 5);
    const international = list.filter(x => x.category === 'international').slice(0, 5);
    const renderList = items => items.map((it, i) => {
        const link = it.link || `https://www.baidu.com/s?wd=${encodeURIComponent(it.title)}`;
        return `
        <div class="history-list-item" data-action="open-link" data-link="${link}" title="点击查看详情：${escapeHtml(it.title)}">
            <span class="history-num">${i + 1}</span>
            <span class="history-text"><strong>${it.year}年${month}月${day}日</strong>：${escapeHtml(it.title)}</span>
            <span class="history-link-icon">🔗</span>
        </div>
        `;
    }).join('');
    el.innerHTML = `
        <div class="history-header">
            <div class="history-title-main">历史上的今天：${month}月${day}日</div>
        </div>
        ${domestic.length ? `
            <div class="history-section">
                <div class="history-section-title">国内</div>
                <div class="history-list">${renderList(domestic)}</div>
            </div>
        ` : ''}
        ${international.length ? `
            <div class="history-section">
                <div class="history-section-title">国际</div>
                <div class="history-list">${renderList(international)}</div>
            </div>
        ` : ''}
        ${holiday ? `<div class="history-holiday">🎂 今日纪念日：${holiday}</div>` : ''}
    `;
}

function renderWater() {
    const todayLogs = state.data.waterLogs.filter(x => x.date === today());
    const total = todayLogs.reduce((s, x) => s + x.amount, 0);
    const percent = Math.min(100, Math.round(total / state.data.waterGoal * 100));
    const remain = Math.max(0, state.data.waterGoal - total);
    const target = state.data.checkIns.find(c => /喝水/.test(c.name) && c.module === 'other')
        || state.data.checkIns.find(c => /喝水/.test(c.name));
    const already = target && state.data.points.history.some(h => h.checkInId === target.id && h.date === today() && h.type === 'base');
    const mode = state._waterMode || null;
    const selected = state._waterSelected || new Set();
    const showBatchDelete = mode === 'delete' && selected.size > 0;
    return `
        <div class="card water-card">
            <div class="card-header">
                <div class="card-title">💧 喝水管理</div>
                <span style="font-size:13px;color:var(--text-secondary)">喝水有益身体健康，保持皮肤湿润哦~</span>
            </div>
            <div class="water-main">
                <div class="water-info-left">
                    <div class="water-total">${total}<small>ml</small></div>
                    <div class="water-sub">今日已喝 ${already ? '· ✅ 已达标' : ''}</div>
                    <div class="water-goal-row">
                        <span class="water-goal">${state.data.waterGoal}<small>ml</small></span>
                        <span class="water-goal-label">喝水目标</span>
                        <button class="btn btn-secondary" data-action="edit-water-goal" style="font-size:12px;padding:6px 12px">修改</button>
                    </div>
                </div>
                <div class="water-glass" style="--water:${percent}%">
                    <div class="water-glass-inner">${percent}%</div>
                </div>
            </div>
            <div style="text-align:center;color:var(--text-secondary);font-size:14px;margin-bottom:16px">
                已喝 ${total} / ${state.data.waterGoal}ml · 还需 ${remain}ml
            </div>
            <div class="water-actions">
                <button class="water-btn" data-action="add-water" data-amount="30"><span>💧</span>30ml</button>
                <button class="water-btn" data-action="add-water" data-amount="80"><span>☕</span>80ml</button>
                <button class="water-btn primary" data-action="add-water" data-amount="200"><span>➕</span>200ml</button>
                <button class="water-btn" data-action="add-water" data-amount="250"><span>🥤</span>250ml</button>
                <button class="water-btn" data-action="custom-water"><span>✏️</span>自定义</button>
            </div>
            ${already ? '<div class="water-tip success">今日喝水已达标，健康打卡已自动完成 🎉</div>' : ''}
            <div class="water-mode-bar">
                <button class="btn btn-sm ${mode === 'delete' ? 'btn-primary' : 'btn-secondary'}" data-action="water-mode" data-mode="delete">🗑️ 批量删除</button>
                ${mode === 'delete' ? `<button class="btn btn-sm btn-secondary" data-action="water-select-all">☑️ 全选 (${todayLogs.length})</button>` : ''}
                ${showBatchDelete ? `<button class="btn btn-sm btn-danger" data-action="water-batch-delete">删除选中 (${selected.size})</button>` : ''}
            </div>
            <div class="log-list">
                ${todayLogs.length ? todayLogs.map(x => {
                    const isSel = selected.has(x.id);
                    return `
                    <div class="log-item ${mode === 'delete' ? 'select-mode' : ''}">
                        ${mode === 'delete' ? `<input type="checkbox" class="water-select" data-action="water-select" data-id="${x.id}" ${isSel ? 'checked' : ''}>` : ''}
                        <span>💧 ${x.amount}ml · ${formatTime(x.time)}</span>
                        ${mode === 'delete' ? '' : `<button class="log-delete" data-action="delete-water" data-id="${x.id}">撤销</button>`}
                    </div>
                `}).join('') : '<div class="empty-state"><span class="emoji">💧</span>今天还没有喝水记录</div>'}
            </div>
        </div>
    `;
}

// ==================== 打卡板块：三个横向子 Tab ====================

// 按时间（日报/周报/月报/历史）
function renderCheckInSchedule() {
    const subTabs = [
        { id: 'daily', name: '今日' },
        { id: 'weekly', name: '近7天' },
        { id: 'monthly', name: '本月' },
        { id: 'history', name: '全部' }
    ];
    const tab = validSubTab('checkin_schedule', subTabs, 'daily');
    let body = '';
    const viewDate = state._scheduleDate || today();
    if (tab === 'daily') body = scheduleDailyBody(viewDate);
    else if (tab === 'weekly') body = scheduleWeeklyBody();
    else if (tab === 'monthly') body = scheduleMonthlyBody();
    else body = scheduleHistoryBody();
    return `
        <div class="card tab-card sub-tab-card">${subTabs.map(t => `<button class="tab-btn ${tab === t.id ? 'active' : ''}" data-action="tab" data-module="checkin" data-tab="schedule" data-subtab="${t.id}">${t.name}</button>`).join('')}</div>
        ${body}
    `;
}

function scheduleDailyBody(date) {
    const plan = getDailyPlan(date);
    const items = plan.items;
    const doneIds = new Set(state.data.points.history.filter(h => h.date === date && h.type === 'base').map(h => h.checkInId));
    const double = isDoubleDay(date);
    const isToday = date === today();
    const dateLabel = isToday ? '今天' : formatDate(date);
    const isCurrentDate = date === today();
    const mode = isCurrentDate ? (state._checkinMode || null) : null;
    const selected = state._checkinSelected || new Set();
    const showBatchDelete = mode === 'delete' && selected.size > 0;
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">📅 ${dateLabel}打卡</div>
                <span style="font-size:13px;color:var(--text-secondary)">完成 ${doneIds.size}/${items.length}</span>
            </div>
            <div class="date-picker-row">
                <button class="btn btn-secondary" data-action="schedule-date" data-delta="-1">◀ 前一天</button>
                <input type="date" class="input" id="scheduleDate" value="${date}">
                <button class="btn btn-secondary" data-action="schedule-date" data-delta="1">后一天 ▶</button>
            </div>
            ${isCurrentDate ? `
                <div class="checkin-mode-bar">
                    <button class="btn btn-sm ${mode === 'sort' ? 'btn-primary' : 'btn-secondary'}" data-action="checkin-mode" data-mode="sort">↕️ 顺序调整</button>
                    <button class="btn btn-sm ${mode === 'delete' ? 'btn-primary' : 'btn-secondary'}" data-action="checkin-mode" data-mode="delete">🗑️ 批量删除</button>
                    ${mode === 'delete' ? `<button class="btn btn-sm btn-secondary" data-action="checkin-select-all">☑️ 全选 (${items.length})</button>` : ''}
                    ${showBatchDelete ? `<button class="btn btn-sm btn-danger" data-action="checkin-batch-delete">删除选中 (${selected.size})</button>` : ''}
                </div>
            ` : ''}
            ${double ? '<div class="double-banner on">🔥 该日为双倍积分日</div>' : ''}
            ${items.length ? items.map((item, idx) => checkInItemRow(item, date, {
                showStreak: true,
                index: idx + 1,
                mode,
                selected
            })).join('') : '<div class="empty-state"><span class="emoji">📝</span>今天还没有安排打卡项</div>'}
        </div>
    `;
}

function scheduleWeeklyBody() {
    const dates = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
        const x = new Date(); x.setDate(d.getDate() - i);
        dates.push(dateStr(x));
    }
    const items = state.data.checkIns.slice().sort((a, b) => a.order - b.order);
    const rows = items.map(item => {
        const cells = dates.map(ds => {
            const done = state.data.points.history.some(h => h.checkInId === item.id && h.date === ds && h.type === 'base');
            return `<span class="week-cell ${done ? 'done' : ''}" data-action="checkin-date" data-id="${item.id}" data-date="${ds}" title="${ds}">${done ? '✓' : '·'}</span>`;
        }).join('');
        const streak = getLongestStreak(item.id);
        return `
            <div class="week-row">
                <div class="week-name">${escapeHtml(item.name)}</div>
                <div class="week-cells">${cells}</div>
                <div class="week-streak">${streak}天</div>
            </div>
        `;
    }).join('');
    const weekDays = dates.map(ds => {
        const dd = new Date(ds);
        return `<div class="week-head"><div class="week-dow">${['日','一','二','三','四','五','六'][dd.getDay()]}</div><div class="week-dom">${dd.getDate()}</div></div>`;
    }).join('');
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">📊 近 7 天打卡概览</div><span style="font-size:12px;color:var(--text-secondary)">点击格子可补打/取消</span></div>
            <div class="week-header">
                <div class="week-spacer name"></div>
                <div class="week-days-wrap">${weekDays}</div>
                <div class="week-spacer streak"></div>
            </div>
            ${items.length ? rows : '<div class="empty-state"><span class="emoji">📝</span>还没有打卡项</div>'}
        </div>
    `;
}

function scheduleMonthlyBody() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    const historyByDate = {};
    state.data.points.history.forEach(x => { if (x.type !== 'makeup_fee') historyByDate[x.date] = (historyByDate[x.date] || 0) + 1; });
    const checkedDays = getCheckedDays();
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">🗓️ ${year}年${month + 1}月打卡</div><span style="font-size:13px;color:var(--text-secondary)">已打卡 ${checkedDays} 天</span></div>
            <div class="calendar calendar-compact">
                <div class="calendar-header">日</div><div class="calendar-header">一</div><div class="calendar-header">二</div><div class="calendar-header">三</div><div class="calendar-header">四</div><div class="calendar-header">五</div><div class="calendar-header">六</div>
                ${days.map(d => {
                    if (!d) return '<div class="calendar-day empty"></div>';
                    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const count = historyByDate[ds] || 0;
                    const hearts = count > 0 ? '💗'.repeat(Math.min(5, count)) : '';
                    const isToday = ds === today();
                    return `<div class="calendar-day ${isToday ? 'today' : ''} ${count > 0 ? 'checked' : ''}"><span class="cal-num">${d}</span><span class="cal-hearts">${hearts}</span></div>`;
                }).join('')}
            </div>
            <div class="calendar-legend">💗 越多，代表今天打卡越积极（最多 5 颗）</div>
        </div>
    `;
}

function scheduleHistoryBody() {
    const byDate = {};
    state.data.points.history.filter(h => h.type !== 'makeup_fee').forEach(h => {
        byDate[h.date] = byDate[h.date] || [];
        byDate[h.date].push(h);
    });
    const dates = Object.keys(byDate).sort().reverse();
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">📜 全部打卡历史</div><span style="font-size:13px;color:var(--text-secondary)">长期记录，随时回顾</span></div>
            ${dates.length ? dates.slice(0, 180).map(ds => {
                const entries = byDate[ds];
                const sum = entries.reduce((s, x) => s + x.points, 0);
                return `
                    <div class="history-date-group">
                        <div class="history-date-header"><span>${formatDate(ds)}</span><span style="color:var(--primary);font-weight:700">+${sum}</span></div>
                        <div class="history-date-items">
                            ${entries.map(h => `<span class="history-tag">${ledgerReason(h)} +${h.points}</span>`).join('')}
                        </div>
                    </div>
                `;
            }).join('') : '<div class="empty-state"><span class="emoji">📜</span>还没有打卡历史</div>'}
        </div>
    `;
}

function checkInItemRow(item, date, opts = {}) {
    const baseEntry = state.data.points.history.find(h => h.checkInId === item.id && h.date === date && h.type === 'base');
    const done = !!baseEntry;
    const streak = opts.showStreak ? checkInStreak(item.id, date) : 0;
    const double = isDoubleDay(date);
    const pts = (parseInt(item.points) || 10) * (double ? 2 : 1);
    const num = opts.index ? `<span class="checkin-num ${done ? 'done' : ''}">${opts.index}</span>` : '';
    const doneTime = done && baseEntry.time ? `<span class="time-tag">✓ ${formatTime(baseEntry.time)}</span>` : '';
    const mode = opts.mode || null;
    const isSelected = opts.selected && opts.selected.has(item.id);
    return `
        <div class="checkin-item-row ${done ? 'done' : ''} ${mode === 'delete' ? 'select-mode' : ''}" data-id="${item.id}">
            ${mode === 'delete' ? `<input type="checkbox" class="checkin-select" data-action="checkin-select" data-id="${item.id}" ${isSelected ? 'checked' : ''}>` : ''}
            ${num}
            <div class="checkin-row-info">
                <div class="checkin-row-name">${escapeHtml(item.name)}</div>
                <div class="checkin-row-meta">
                    <span class="cat-tag">${item.category}</span>
                    <span class="pts-tag">+${pts}分${double ? ' ×2' : ''}</span>
                    <span class="diff-tag" title="${flowerLevel(item.stars||3).def}">${flowerLevel(item.stars||3).slogan}</span>
                    ${opts.showStreak && streak > 0 ? `<span class="streak-tag">🔥 ${streak}天</span>` : ''}
                    ${doneTime}
                </div>
                <div class="checkin-stars" title="点击设置难度/完成度（🌸越多越难）">
                    ${[1,2,3,4,5].map(i => `<span class="cstar ${i <= (item.stars||3) ? 'on' : ''}" data-action="set-stars" data-id="${item.id}" data-stars="${i}">🌸</span>`).join('')}
                </div>
            </div>
            <label class="checkin-checkbox ${done ? 'checked' : ''}" data-action="checkin-date" data-id="${item.id}" data-date="${date}">
                <span>${done ? '✓' : ''}</span>
            </label>
            ${mode === 'sort' ? `
                <div class="sort-btns">
                    <button class="sort-btn" data-action="${opts.sortAction || 'checkin-sort'}" data-id="${item.id}" ${opts.sortAction === 'checkin-catsort' ? `data-mod="${item.module}"` : ''} data-dir="-1" title="上移">▲</button>
                    <button class="sort-btn" data-action="${opts.sortAction || 'checkin-sort'}" data-id="${item.id}" ${opts.sortAction === 'checkin-catsort' ? `data-mod="${item.module}"` : ''} data-dir="1" title="下移">▼</button>
                </div>
            ` : ''}
        </div>
    `;
}

// 按板块（基础打卡项 / 日常习惯 / 其他打卡项），子 Tab 切换（参考「综合热榜」布局）
const CHECKIN_CATEGORY_SUBTABS = [
    { id: 'basic', name: '基础打卡项' },
    { id: 'daily', name: '日常习惯' },
    { id: 'other', name: '其他打卡项' }
];
function renderCheckInCategory() {
    const tab = validSubTab('checkin_category', CHECKIN_CATEGORY_SUBTABS, 'basic');
    const subTabsHtml = `
        <div class="card tab-card sub-tab-card">
            ${CHECKIN_CATEGORY_SUBTABS.map(t => `<button class="tab-btn ${tab === t.id ? 'active' : ''}" data-action="tab" data-module="checkin" data-tab="category" data-subtab="${t.id}">${t.name}</button>`).join('')}
        </div>
    `;
    return `${subTabsHtml}${categoryItemsBody(tab)}`;
}

// 单个板块的打卡项列表（按今日打卡进度展示）
function categoryItemsBody(mod) {
    const cats = getCategories();
    const mode = state._checkinMode || null;
    if (mod === 'other') {
        // 其他打卡项按花朵数分组折叠
        return otherCategoryBody(cats, mode);
    }
    const items = state.data.checkIns.filter(c => c.module === mod).sort((a, b) => a.order - b.order);
    const doneToday = items.filter(it => state.data.points.history.some(h => h.checkInId === it.id && h.date === today() && h.type === 'base')).length;
    const pct = items.length ? Math.round(doneToday / items.length * 100) : 0;
    const sortActive = mode === 'sort';
    return `
        <div class="card cat-block">
            <div class="card-header">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                    <div class="card-title">${escapeHtml(cats[mod] || '其他')}</div>
                    <span style="font-size:13px;color:var(--text-secondary)">${doneToday}/${items.length} 已完成</span>
                </div>
                <button class="btn btn-sm ${sortActive ? 'btn-primary' : 'btn-secondary'}" data-action="checkin-mode" data-mode="sort">↕️ 顺序调整</button>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            ${items.length ? items.map((item, idx) => checkInItemRow(item, today(), {
                showStreak: true,
                index: idx + 1,
                mode,
                selected: new Set(),
                sortAction: 'checkin-catsort'
            })).join('') : '<div class="empty-state"><span class="emoji">📝</span>还没有打卡项，去「板块管理」添加吧</div>'}
        </div>
    `;
}

// 其他打卡项按花朵数（2~5）分组折叠
function otherCategoryBody(cats, mode) {
    const allItems = state.data.checkIns.filter(c => c.module === 'other').sort((a, b) => a.order - b.order);
    const sortActive = mode === 'sort';
    const groups = [2, 3, 4, 5].map(n => ({
        stars: n,
        items: allItems.filter(c => c.stars === n),
        name: `${n} 朵花打卡项`
    })).filter(g => g.items.length);
    const doneToday = allItems.filter(it => state.data.points.history.some(h => h.checkInId === it.id && h.date === today() && h.type === 'base')).length;
    const pct = allItems.length ? Math.round(doneToday / allItems.length * 100) : 0;
    const renderGroup = g => {
        const gDone = g.items.filter(it => state.data.points.history.some(h => h.checkInId === it.id && h.date === today() && h.type === 'base')).length;
        const collapsed = state._collapsedOther.has(String(g.stars));
        return `
            <div class="card cat-block other-star-group">
                <div class="card-header cat-block-header" data-action="other-fold" data-stars="${g.stars}">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                        <div class="card-title">${'🌸'.repeat(g.stars)} ${g.name}</div>
                        <span style="font-size:13px;color:var(--text-secondary)">${gDone}/${g.items.length} 已完成</span>
                    </div>
                    <button class="btn btn-sm btn-secondary fold-toggle ${collapsed ? 'folded' : ''}" data-action="other-fold" data-stars="${g.stars}">
                        ${collapsed ? '▶ 展开' : '▼ 折叠'}
                    </button>
                </div>
                ${collapsed ? '' : `
                    ${g.items.length ? g.items.map((item, idx) => checkInItemRow(item, today(), {
                        showStreak: true,
                        index: idx + 1,
                        mode,
                        selected: new Set(),
                        sortAction: 'checkin-catsort'
                    })).join('') : '<div class="empty-state"><span class="emoji">📝</span>该分组还没有打卡项</div>'}
                `}
            </div>
        `;
    };
    return `
        <div class="card cat-block">
            <div class="card-header">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                    <div class="card-title">${escapeHtml(cats.other || '其他打卡项')}</div>
                    <span style="font-size:13px;color:var(--text-secondary)">${doneToday}/${allItems.length} 已完成</span>
                </div>
                <button class="btn btn-sm ${sortActive ? 'btn-primary' : 'btn-secondary'}" data-action="checkin-mode" data-mode="sort">↕️ 顺序调整</button>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        ${groups.map(renderGroup).join('')}
        ${!groups.length ? '<div class="empty-state"><span class="emoji">📝</span>还没有打卡项，去「板块管理」添加吧</div>' : ''}
    `;
}

// 板块管理（独立 Tab）：板块增删改 + 新增打卡项
function renderCheckInAdmin() {
    const cats = getCategories();
    const order = getCategoryOrder();
    const isNewCat = state._newCategory === true;
    const selectedModule = state._checkInModule || (order[0] || 'basic');
    const moduleMenu = order.map(mod => `<div class="checkin-module-item ${selectedModule === mod ? 'active' : ''}" data-action="checkin-module-pick" data-mod="${mod}">${cats[mod]}</div>`).join('')
        + `<div class="checkin-module-item ${selectedModule === '__new__' ? 'active' : ''}" data-action="checkin-module-pick" data-mod="__new__">➕ 新建板块</div>`;
    return `
        <div class="card">
            <div class="card-header"><div class="card-title">🛠️ 板块管理</div></div>
            <div class="category-manage-list">
                ${order.map(mod => categoryManageRow(mod, cats[mod])).join('')}
            </div>
        </div>
        <div class="card">
            <div class="card-header"><div class="card-title">➕ 新增打卡项</div></div>
            <div class="input-row checkin-input-row ${isNewCat ? 'new-cat-mode' : ''}">
                <div class="checkin-module-select" data-action="checkin-module-toggle">
                    <span class="checkin-module-label">${cats[selectedModule] || '选择板块'}</span>
                    <span class="checkin-module-arrow">▾</span>
                    <div class="checkin-module-menu" id="checkInModuleMenu" style="display:none">${moduleMenu}</div>
                </div>
                ${isNewCat ? `<input type="text" class="input" id="checkInNewCategory" placeholder="新板块名称">` : ''}
                <input type="text" class="input" id="checkInName" placeholder="打卡内容">
                <button class="btn btn-primary" data-action="add-checkin">添加</button>
            </div>
            <div class="stars-pick-row">
                <span class="stars-pick-label">难度定级</span>
                <div class="stars-pick">
                    ${[1,2,3,4,5].map(i => `<span class="cstar ${i <= (state._newStars||3) ? 'on' : ''}" data-action="new-stars" data-stars="${i}" title="${flowerLevel(i).name} · 满分 ${flowerLevel(i).max}分">🌸</span>`).join('')}
                </div>
                <span class="flower-grade-info">${flowerLevel(state._newStars||3).name} · 满分 ${flowerLevel(state._newStars||3).max}分 · ${flowerLevel(state._newStars||3).slogan}</span>
            </div>
            <div class="flower-guide-tip">🌸 几朵花 = 任务难度：1简单/2中等/3坚持/4挑战/5超越，分数自动对应 1/3/6/10/15 分</div>
        </div>
    `;
}

function categoryManageRow(mod, name) {
    const count = state.data.checkIns.filter(c => c.module === mod).length;
    return `
        <div class="category-manage-row">
            <div class="category-manage-name">
                <input type="text" class="input category-name-input" value="${escapeHtml(name)}" data-mod="${mod}">
                <span class="category-count">${count} 项</span>
            </div>
            <div class="category-manage-actions">
                <button class="btn btn-sm btn-secondary" data-action="save-category-name" data-mod="${mod}">保存</button>
                <button class="btn btn-sm btn-danger" data-action="delete-category" data-mod="${mod}">删除</button>
            </div>
        </div>
    `;
}

function renameCategory(mod, newName) {
    const cats = getCategories();
    if (!cats[mod] || !newName.trim()) return;
    cats[mod] = newName.trim();
    state.data.categories = cats;
    // 同步更新所有该模块下的习惯 category 名称
    state.data.checkIns.forEach(c => { if (c.module === mod) c.category = newName.trim(); });
    saveState();
    render();
}

async function deleteCategory(mod) {
    const cats = getCategories();
    if (!cats[mod]) return;
    const order = getCategoryOrder();
    const items = state.data.checkIns.filter(c => c.module === mod);
    if (items.length) {
        // 保留第一个可用板块作为默认迁移目标
        const fallback = DEFAULT_CATEGORY_ORDER[0] || 'basic';
        const target = order.find(k => k !== mod) || fallback;
        const targetName = cats[target] || getCategories()[fallback] || '其他';
        const ok = await uiConfirm(`板块「${cats[mod]}」下有 ${items.length} 个打卡项。点击「确定」把它们移到「${targetName}」，点击「取消」则连同习惯一起删除。`, { isDanger: true });
        if (!ok) {
            // 删除习惯（进回收站）
            items.forEach(ci => {
                ci.deletedAt = now();
                state.data.checkInBin.unshift(ci);
            });
            state.data.checkIns = state.data.checkIns.filter(c => c.module !== mod);
        } else {
            // 迁移习惯
            state.data.checkIns.forEach(c => {
                if (c.module === mod) {
                    c.module = target;
                    c.category = targetName;
                }
            });
        }
    }
    delete cats[mod];
    state.data.categories = cats;
    state.data.categoryOrder = order.filter(k => k !== mod);
    recalcCourage();
    saveState();
    render();
}

function waterMiniCard() {
    const todayLogs = state.data.waterLogs.filter(x => x.date === today());
    const total = todayLogs.reduce((s, x) => s + x.amount, 0);
    const percent = Math.min(100, Math.round(total / state.data.waterGoal * 100));
    return `
        <div class="mini-water">
            <div class="mini-water-head"><span>💧 今日喝水</span><span>${total}/${state.data.waterGoal}ml</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
            <div class="water-actions-mini">
                <button class="water-btn" data-action="add-water" data-amount="200"><span>➕</span>200ml</button>
                <button class="water-btn" data-action="add-water" data-amount="250"><span>🥤</span>250ml</button>
                <button class="water-btn" data-action="custom-water"><span>✏️</span>自定义</button>
            </div>
        </div>
    `;
}

// 更多：规则 / 升级 / 回收站（可折叠）
function renderCheckInMore() {
    const bin = state.data.checkInBin;
    const levelRules = RANKS.map((r, i) => {
        if (r.key === 'king') {
            const lv = LEVELS.find(l => l.prefix === r.name) || { title: '' };
            return `<div class="level-rule-row"><span class="level-rule-name">${r.name} · ${lv.title}</span><span class="level-rule-pts">${KING_START * 100} 分以上</span><span class="level-rule-reward">王者荣誉 · 累计星数无上限</span></div>`;
        }
        const startTier = RANK_TIERS.find(x => x.rankKey === r.key && x.roman === 'Ⅲ');
        const startStars = startTier ? startTier.startStars : 0;
        const endStars = startStars + r.starsPerSub * 3;
        const lv = LEVELS.find(l => l.prefix === r.name) || { title: '' };
        return `<div class="level-rule-row"><span class="level-rule-name">${r.name} · ${lv.title}</span><span class="level-rule-pts">${startStars * 100} 分起</span><span class="level-rule-reward">${startStars}-${endStars - 1} 星 · 每小段 ${r.starsPerSub} 星</span></div>`;
    }).join('');
    const ruleCard = (icon, title, body) => `
        <div class="card rule-card">
            <div class="card-header">
                <div class="card-title">${icon} ${title}</div>
            </div>
            ${body}
        </div>
    `;
    return `
        ${ruleCard('🎮', '基础打卡规则', `
            <div class="rule-body">
                <div class="rule-item"><span class="rule-icon">🌸</span><div><strong>花朵定级积分</strong><p>每项习惯用 🌸 定级（1-5 朵），分数自动对应 1/3/6/10/15 分；打卡一次即得对应满分。</p></div></div>
                <div class="rule-item"><span class="rule-icon">✅</span><div><strong>完成即打卡</strong><p>点击文字后的圆圈完成打卡，再次点击可取消。</p></div></div>
                <div class="rule-item"><span class="rule-icon">🗑️</span><div><strong>删除与历史保留</strong><p>习惯会随时间增减：删除某打卡项只是把它移入回收站，它过去的打卡记录、已得积分和星能<strong>全部永久保留</strong>，不会因删除而清零。只有从回收站「彻底删除」才会清空该习惯的相关记录。</p></div></div>
                <div class="rule-item"><span class="rule-icon">📅</span><div><strong>每日独立</strong><p>今天隐藏或排序某打卡项，不影响昨天和明天。</p></div></div>
            </div>
        `)}

        ${ruleCard('🌸', '花朵定级标准', flowerLevelsGuide())}

        ${ruleCard('🔥', '打卡奖励规则', `
            <div class="rule-body">
                <div class="rule-item"><span class="rule-icon">🔥</span><div><strong>连续打卡奖励</strong><p>连续 3/7/14/21/30 天分别额外 +5/+15/+25/+40/+80 分。</p></div></div>
                <div class="rule-item"><span class="rule-icon">📊</span><div><strong>每日完成度奖励</strong><p>当天「日常习惯」完成超过一半，额外 +5 分；日常习惯全部完成，额外 +10 分。</p></div></div>
                <div class="rule-item"><span class="rule-icon">💎</span><div><strong>双倍积分日</strong><p>每月固定一天双倍积分，当天所有打卡积分翻倍。</p></div></div>
                <div class="rule-item"><span class="rule-icon">🌟</span><div><strong>星能</strong><p>每完成 1 项打卡 +5 星能；「日常习惯」全部完成即全勤打卡，额外 +10。满 100 自动 +1 星。星能按赛季计算，每个新赛季清零重算。</p></div></div>
            </div>
        `)}

        ${ruleCard('🏆', '升级规则', `
            <div class="level-rule-list">
                ${levelRules}
            </div>
            <div class="rule-tip">1 星 = 100 积分；段位按累计获得积分计算，花掉积分兑心愿不会掉段。</div>
        `)}

        ${ruleCard('📝', '其他补充规则', `
            <div class="rule-body">
                <div class="rule-item"><span class="rule-icon">🔁</span><div><strong>补打卡</strong><p>每周可用 50 积分补回昨日，保住连续记录。</p></div></div>
                <div class="rule-item"><span class="rule-icon">💧</span><div><strong>喝水联动</strong><p>在「其他打卡项」中自动创建「喝水 1500ml」（2花）。当日喝水累计达到目标后自动完成；删除喝水记录导致未达标时自动取消。</p></div></div>
                <div class="rule-item"><span class="rule-icon">⭐</span><div><strong>积分兑换规则</strong><p>${escapeHtml(getExchangeRuleText())}。积分只用于兑换你设定的心愿，不折算现金。</p></div></div>
            </div>
        `)}

        ${ruleCard('🗑️', '打卡回收站', `
            ${bin.length ? bin.map(ci => `
                <div class="bin-row">
                    <span>${escapeHtml(ci.name)} <span class="cat-tag">${ci.category}</span></span>
                    <div style="display:flex;gap:8px">
                        <button class="btn btn-secondary" data-action="restore-checkin" data-id="${ci.id}" style="font-size:12px">恢复</button>
                        <button class="btn btn-secondary" data-action="purge-checkin" data-id="${ci.id}" style="font-size:12px">彻底删除</button>
                    </div>
                </div>
            `).join('') : '<div class="empty-state"><span class="emoji">🗑️</span>回收站是空的</div>'}
        `)}
    `;
}

// 打卡管理：统一删除 + 批量调整积分
function renderCheckInManage() {
    const items = state.data.checkIns.slice().sort((a, b) => a.order - b.order);
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">🛠️ 打卡项批量管理</div>
                <span style="font-size:13px;color:var(--text-secondary)">${items.length} 项 · 勾选后可批量操作</span>
            </div>
            <div class="manage-bar">
                <label class="manage-select-all">
                    <input type="checkbox" id="manageSelectAll" data-action="manage-select-all"> 全选
                </label>
                <input type="number" class="input" id="managePoints" placeholder="统一设置积分" style="flex:1;min-width:110px">
                <button class="btn btn-primary" data-action="manage-batch-points">调整所选积分</button>
                <button class="btn btn-secondary" data-action="manage-batch-delete">删除所选</button>
            </div>
            <div class="manage-list">
                ${items.length ? items.map(it => `
                    <div class="manage-row" data-id="${it.id}">
                        <input type="checkbox" class="manage-check" value="${it.id}">
                        <span class="manage-name">${escapeHtml(it.name)}</span>
                        <span class="cat-tag">${it.category}</span>
                        <span class="diff-tag">${flowerLevel(it.stars||3).slogan}</span>
                        <span class="pts-tag">${it.points}分</span>
                        <button type="button" class="task-edit" data-action="edit-checkin" data-id="${it.id}" title="编辑名称/分组/分数">✎</button>
                    </div>
                `).join('') : '<div class="empty-state"><span class="emoji">📝</span>还没有打卡项</div>'}
            </div>
        </div>
    `;
}

// ==================== 学习模块 ====================
function renderReading() {
    const idx = getDailyIndex(BOOKS);
    const books = [];
    for (let i = 0; i < 2; i++) books.push(BOOKS[(idx + i) % BOOKS.length]);
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">📖 每日好书推荐</div>
                <span style="font-size:12px;color:var(--text-secondary)">每日 2 本 · 书本评析</span>
            </div>
            ${books.map((b, i) => `
                <div class="book-card" data-book-idx="${(idx + i) % BOOKS.length}">
                    <div class="book-num">${i + 1}</div>
                    <div class="book-info">
                        <div class="book-title">${b.title}</div>
                        <div class="book-author">${b.author} · ${b.platform}</div>
                        <div class="book-desc">${b.desc}</div>
                        <div class="book-review">
                            <span class="review-label">书本评析：</span>
                            <span class="review-text">${escapeHtml(bookTeaser(b))}</span>
                        </div>
                        <button class="btn btn-secondary review-expand" data-action="open-book-review" data-idx="${(idx + i) % BOOKS.length}">
                            查看完整书本评析
                        </button>
                        <div class="blog-actions">
                            <button class="btn btn-primary" data-action="open-link" data-link="https://weread.qq.com/web/search?keyword=${encodeURIComponent(b.title)}" style="font-size:12px">📖 微信读书</button>
                            <button class="btn btn-secondary" data-action="open-link" data-link="https://www.ximalaya.com/search/${encodeURIComponent(b.title)}" style="font-size:12px">🎧 喜马拉雅</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function bookTeaser(book) {
    if (!book.deepRead) return '暂无书本评析';
    const first = book.deepRead.split(/\n\n/).filter(p => p.trim())[0] || '';
    const text = first.trim();
    if (text.length > 120) return text.slice(0, 120).trim() + '…';
    return text;
}

function bookFullReview(book) {
    if (!book.deepRead) return '暂无书本评析';
    return book.deepRead.split(/\n\n/).filter(p => p.trim()).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
}

function openBookReview(idx) {
    const book = BOOKS[idx];
    if (!book) return;
    document.getElementById('bookReviewTitle').textContent = `📖 ${book.title}`;
    document.getElementById('bookReviewBody').innerHTML = bookFullReview(book);
    document.getElementById('bookReviewModal').classList.add('show');
}

function closeBookReview() {
    document.getElementById('bookReviewModal').classList.remove('show');
}

function renderEnglish() {
    const idx = getDailyIndex(ENGLISH_VIDEOS);
    const video = ENGLISH_VIDEOS[idx];
    // 口语句子每日轮换：取两条不重复的（首尾各取一半区间，确保不同天不同组合）
    const oi = getDailyIndex(ENGLISH_SENTENCES);
    const half = Math.floor(ENGLISH_SENTENCES.length / 2);
    const s1 = ENGLISH_SENTENCES[oi];
    const s2 = ENGLISH_SENTENCES[(oi + half) % ENGLISH_SENTENCES.length];
    const oralHtml = [s1, s2].map(s => `
        <div class="skill-card">
            <div style="font-size:18px;font-weight:700;color:var(--primary);margin-bottom:10px">${s.en}</div>
            <div style="font-size:14px;margin-bottom:8px"><strong>含义：</strong>${s.zh}</div>
            <div style="font-size:13px;color:var(--text-secondary);background:#fff;padding:12px;border-radius:10px;border-left:3px solid var(--primary)">${s.ex}</div>
        </div>
    `).join('');
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">🎬 每日英语视频推荐</div>
                <span style="font-size:12px;color:var(--text-secondary)">口语 · 听力 · 跟读</span>
            </div>
            <div class="video-card">
                <div class="video-title">${video.title}</div>
                <div class="video-source">来源：${video.source}</div>
                <div class="video-desc">${video.desc}</div>
                <div class="blog-actions">
                    <button class="btn btn-primary" data-action="open-link" data-link="${video.link}" style="font-size:12px">▶️ 去观看</button>
                    <button class="btn btn-secondary" data-action="open-link" data-link="https://search.bilibili.com/all?keyword=${encodeURIComponent('英语口语 ' + video.title)}" style="font-size:12px">🔍 B站搜索</button>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><div class="card-title">🗣️ 每日口语一句</div><span style="font-size:12px;color:var(--text-secondary)">每天轮换 · 跟读 3 遍</span></div>
            ${oralHtml}
            <div style="background:var(--primary-light);border-radius:var(--radius-sm);padding:14px;margin-top:14px;font-size:13px;color:var(--primary-dark);line-height:1.5">
                <strong>练习建议：</strong>任选一句，对着镜子大声说 3 遍，再自己造一个句子。口语进步的关键是「开口」，不是「背完」。
            </div>
        </div>
    `;
}

// ==================== 今日热点模块 ====================
function renderHotList(groupId) {
    const types = HOT_GROUPS[groupId] || HOT_GROUPS['mixed'];
    const cached = state.data.hotCache;
    const tabs = types.map(t => `
        <button class="hot-tab ${state.currentSubTab[`hot_${groupId}`] === t ? 'active' : ''}" data-action="hot-platform" data-group="${groupId}" data-type="${t}">${HOT_TYPES[t] || t}</button>
    `).join('');
    const currentType = state.currentSubTab[`hot_${groupId}`] || types[0];
    const data = cached[currentType];
    const list = data && data.list ? data.list : [];
    const updated = data && data.update_time ? new Date(data.update_time).toLocaleString('zh-CN') : (state._loadingHot ? '加载中' : '未获取');
    const emptyState = state._loadingHot
        ? '<div class="empty-state"><span class="emoji">🔥</span>正在加载热榜...</div>'
        : `<div class="empty-state"><span class="emoji">🔥</span>暂无数据，<button class="btn btn-primary btn-sm" data-action="hot-refresh" data-group="${groupId}" style="margin-left:6px">点击刷新</button></div>`;
    return `
        <div class="card-header">
            <div class="card-title">🔥 ${groupId === 'politics' ? '时事新闻' : '综合热榜'}</div>
            <button class="btn btn-secondary" data-action="hot-refresh" data-group="${groupId}" style="font-size:12px">刷新</button>
        </div>
        <div class="hot-tabs">${tabs}</div>
        <div class="hot-update">更新于 ${updated}</div>
        <div class="news-list">
            ${list.length ? list.slice(0, 20).map((n, i) => `
                <div class="news-item" data-action="open-link" data-link="${n.url || '#'}" style="cursor:pointer">
                    <div class="news-num">${n.index || i + 1}</div>
                    <div>
                        <div>${escapeHtml(n.title)}</div>
                        <div class="news-category">${HOT_TYPES[currentType] || currentType} · 热度 ${n.hot_value || '-'}</div>
                    </div>
                </div>
            `).join('') : emptyState}
        </div>
    `;
}

async function loadHotData() {
    if (state._loadingHot) return;
    state._loadingHot = true;
    const groupId = state.currentSubTab.hot || 'mixed';
    const types = HOT_GROUPS[groupId] || HOT_GROUPS['mixed'];
    await loadHotJson();
    await fetchHotForTypes(types);
    const currentType = state.currentSubTab[`hot_${groupId}`] || types[0];
    // 如果当前类型还没选，默认
    if (!state.currentSubTab[`hot_${groupId}`]) state.currentSubTab[`hot_${groupId}`] = currentType;
    state._loadingHot = false;
    renderHotDOM();
}

function renderHotDOM() {
    const wrap = document.getElementById('hotListWrap');
    if (!wrap) return;
    const groupId = state.currentSubTab.hot || 'mixed';
    wrap.innerHTML = renderHotList(groupId);
}

async function loadHotJson() {
    try {
        const res = await fetch('./hot.json?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data.list) return;
        const fileAge = data.updatedAt ? Date.now() - new Date(data.updatedAt).getTime() : 0;
        if (fileAge > 2 * 60 * 60 * 1000) return; // hot.json 超过 2 小时忽略
        data.list.forEach(group => {
            if (group && group.type && group.list) {
                state.data.hotCache[group.type] = { ...group, ts: Date.now() };
            }
        });
    } catch (e) {
        console.log('hot.json 不存在或不可用，使用实时 API');
    }
}

async function fetchHotForTypes(types) {
    const stale = 10; // 缓存 10 分钟，点击刷新可强制更新
    for (const type of types) {
        const cached = state.data.hotCache[type];
        if (cached && cached.ts && (Date.now() - cached.ts < stale * 60 * 1000)) continue;
        try {
            const res = await fetch(`${API.hot}?type=${type}&limit=20`);
            const data = await res.json();
            if (data && data.list) {
                state.data.hotCache[type] = { ...data, ts: Date.now() };
            }
        } catch (e) {
            console.warn('热榜获取失败', type, e);
        }
    }
    saveState();
}

// ==================== 变美情报局模块 ====================
const BEAUTY_TREND_TYPES = ['xiaohongshu', 'douyin'];
const BEAUTY_TREND_KEYWORDS = ['妆', '穿搭', '发型', '护肤', '美甲', '变美', '口红', '眼影', '睫毛', '眉毛', '腮红', '高光', '遮瑕', '粉底液', 'ootd', '韩系', '日系', '法式', '千金', '纯欲', '清冷', '氛围感', '多巴胺', '美拉德', '通勤', '约会', '聚会', '新手'];

function loadBeautyData() {
    const tab = validSubTab('beauty', [
        { id: 'today', name: '今日宜美', icon: '🌤️' },
        { id: 'trend', name: '流行风向', icon: '🔥' },
        { id: 'arsenal', name: '灵感军火库', icon: '💅' }
    ], 'today');
    if (tab === 'today') loadBeautyWeather();
    else if (tab === 'trend') loadBeautyTrend();
    else loadBeautyArsenal();
}

// ---------- Tab 1: 今日宜美 ----------
function renderBeautyToday() {
    const cache = state.data.apiCache ? state.data.apiCache['beautyWeather'] : null;
    if (!cache) {
        return `
            <div class="card-header"><div class="card-title">🌤️ 看天穿衣 / 护肤</div></div>
            <div class="empty-state"><span class="emoji">🌤️</span>正在定位并获取天气...</div>
        `;
    }
    if (cache.error) {
        return `
            <div class="card-header"><div class="card-title">🌤️ 看天穿衣 / 护肤</div></div>
            <div class="empty-state"><span class="emoji">🌧️</span>${escapeHtml(cache.error)}<button class="btn btn-primary btn-sm" data-action="beauty-weather-refresh" style="margin-left:8px">重试</button></div>
        `;
    }
    const w = cache.data || {};
    const current = w.current || {};
    const daily = w.daily || {};
    const temp = current.temperature_2m;
    const uv = current.uv_index != null ? current.uv_index : (daily.uv_index_max && daily.uv_index_max[0]);
    const humidity = current.relative_humidity_2m;
    const code = current.weather_code;
    const wind = current.wind_speed_10m;
    const precip = current.precipitation;
    const city = state.settings.city || '当前位置';
    const guide = buildBeautyOutfitGuide(temp, uv, humidity, code, wind, precip);
    const weatherIcon = weatherCodeToIcon(code);
    return `
        <div class="card-header">
            <div class="card-title">🌤️ 看天穿衣 / 护肤</div>
            <button class="btn btn-secondary" data-action="beauty-weather-refresh" style="font-size:12px">刷新</button>
        </div>
        <div class="beauty-weather-card">
            <div class="beauty-weather-main">
                <div class="beauty-weather-icon">${weatherIcon}</div>
                <div class="beauty-weather-info">
                    <div class="beauty-weather-city">${escapeHtml(city)}</div>
                    <div class="beauty-weather-temp">${temp != null ? temp + '°C' : '--'}</div>
                    <div class="beauty-weather-meta">
                        <span>UV ${uv != null ? uv : '--'}</span>
                        <span>湿度 ${humidity != null ? humidity + '%' : '--'}</span>
                        <span>风力 ${wind != null ? wind + 'm/s' : '--'}</span>
                    </div>
                </div>
            </div>

            <div class="beauty-outfit-head">
                <div class="beauty-outfit-zone">${guide.zone.icon} ${escapeHtml(guide.zone.name)}</div>
                <div class="beauty-outfit-temp">${guide.zone.range}</div>
            </div>
            <div class="beauty-outfit-formula">${escapeHtml(guide.zone.formula)}</div>
            <div class="beauty-outfit-detail">${escapeHtml(guide.zone.detail)}</div>

            ${guide.patches.length ? `
                <div class="beauty-patch-title">🚨 智能提醒</div>
                <div class="beauty-patch-list">
                    ${guide.patches.map(p => `<div class="beauty-patch-item ${p.type}"><span class="beauty-patch-emoji">${p.emoji}</span><div><div class="beauty-patch-label">${escapeHtml(p.label)}</div><div class="beauty-patch-text">${escapeHtml(p.text)}</div></div></div>`).join('')}
                </div>
            ` : ''}

            <div class="beauty-outfit-extra">
                <div class="beauty-extra-card">
                    <div class="beauty-extra-title">👗 怎么穿</div>
                    <div class="beauty-extra-text">${escapeHtml(guide.howToWear)}</div>
                </div>
                <div class="beauty-extra-card">
                    <div class="beauty-extra-title">💡 小心机</div>
                    <div class="beauty-extra-text">${escapeHtml(guide.tip)}</div>
                </div>
            </div>

            <div class="beauty-beauty-guide">
                <div class="beauty-beauty-title">💄 护肤 & 妆容 & 发型</div>
                <div class="beauty-beauty-grid">
                    ${guide.beauty.map(b => `<div class="beauty-beauty-item"><span>${b.icon}</span><div><strong>${escapeHtml(b.title)}</strong><p>${escapeHtml(b.desc)}</p></div></div>`).join('')}
                </div>
            </div>

            <div class="beauty-outfit-table-title">📋 全温区穿搭手册</div>
            <div class="beauty-outfit-cards">
                ${BEAUTY_OUTFIT_ZONES.map(z => {
                    const isCurrent = z.minTemp <= guide.zone.minTemp && z.maxTemp >= guide.zone.maxTemp;
                    return `
                        <div class="beauty-outfit-card ${isCurrent ? 'current' : ''}">
                            <div class="beauty-outfit-card-header">
                                <div class="beauty-outfit-card-zone">
                                    <span class="beauty-outfit-card-icon">${z.icon}</span>
                                    <span class="beauty-outfit-card-name">${escapeHtml(z.name)}</span>
                                </div>
                                <div class="beauty-outfit-card-range">${escapeHtml(z.range)}</div>
                            </div>
                            <div class="beauty-outfit-card-body">
                                <div class="beauty-outfit-card-row">
                                    <span class="beauty-outfit-card-label">👗 穿衣公式</span>
                                    <span class="beauty-outfit-card-text">${escapeHtml(z.formula)}</span>
                                </div>
                                <div class="beauty-outfit-card-row">
                                    <span class="beauty-outfit-card-label">🧵 面料与细节</span>
                                    <span class="beauty-outfit-card-text">${escapeHtml(z.detail)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

const BEAUTY_OUTFIT_ZONES = [
    { name: '极寒模式', range: '-15℃ ~ -5℃', minTemp: -15, maxTemp: -5, icon: '❄️',
      formula: '保暖内衣 + 厚羊毛衫/羊绒衫 + 长款羽绒服 + 防风加绒裤',
      detail: '重点：必须护住头颈手脚（帽子围巾手套）。面料选高蓬松度羽绒。鞋子必选雪地靴或加绒靴。' },
    { name: '寒冷模式', range: '-5℃ ~ 5℃', minTemp: -5, maxTemp: 5, icon: '🧥',
      formula: '发热衣 + 厚毛衣/卫衣 + 呢大衣/短羽绒 + 毛呢裤/加绒牛仔裤',
      detail: '重点：采用“洋葱穿衣法”。室内有暖气可脱外套，室外必须防风。推荐深色吸热，脚踝绝对不能露。' },
    { name: '微凉模式', range: '5℃ ~ 15℃', minTemp: 5, maxTemp: 15, icon: '🌬️',
      formula: '长袖T恤/衬衫 + 针织开衫/风衣/西装 + 直筒牛仔裤/长裙',
      detail: '重点：早晚温差大，外套是刚需。可搭配丝巾增加层次感，既保暖又时髦。' },
    { name: '舒适(低)', range: '15℃ ~ 20℃', minTemp: 15, maxTemp: 20, icon: '🌿',
      formula: '薄长袖/卫衣 + 休闲长裤/过膝裙',
      detail: '重点：体感最舒适区间。怕冷星人穿单衣，怕热星人穿短袖+薄外套备用。' },
    { name: '舒适(高)', range: '20℃ ~ 27℃', minTemp: 20, maxTemp: 27, icon: '☀️',
      formula: '短袖T恤/薄衬衫 + 薄长裤/中长裙',
      detail: '重点：接近夏天。室内空调房需备薄衫。面料选纯棉、莫代尔，透气亲肤。' },
    { name: '炎热模式', range: '27℃ ~ 35℃', minTemp: 27, maxTemp: 35, icon: '🔥',
      formula: '吊带/背心/短裙/短裤 + 防晒衫',
      detail: '重点：露肤度高。面料必须透气（亚麻、真丝、冰丝）。颜色选浅色系反射阳光，避免吸热。' },
    { name: '酷热模式', range: '35℃ ~ 40℃', minTemp: 35, maxTemp: 40, icon: '🥵',
      formula: '极简清凉装（吊带裙/超短裤）+ 强力防晒装备',
      detail: '重点：防暑降温第一。避免深色吸热。随身带小风扇、喷雾。尽量待在室内。' }
];

function findBeautyZone(temp) {
    if (temp == null) return BEAUTY_OUTFIT_ZONES[3];
    for (const z of BEAUTY_OUTFIT_ZONES) {
        if (temp >= z.minTemp && temp <= z.maxTemp) return z;
    }
    if (temp < -15) return BEAUTY_OUTFIT_ZONES[0];
    if (temp > 40) return BEAUTY_OUTFIT_ZONES[6];
    return BEAUTY_OUTFIT_ZONES[3];
}

function buildBeautyOutfitGuide(temp, uv, humidity, code, wind, precip) {
    const zone = findBeautyZone(temp);
    const patches = [];
    const isRain = isRainCode(code) || (precip != null && precip > 0);
    const isHumid = humidity != null && humidity > 70;
    const isWindy = wind != null && wind > 7.5; // 约 4 级以上
    const isDry = humidity != null && humidity < 30;

    // 雨天补丁（优先级最高）
    if (isRain) {
        patches.push({ type: 'rain', emoji: '🌧️', label: '今天有雨', text: '请穿防水面料（冲锋衣/皮衣）或短靴。绝对不要穿拖地长裤和浅色帆布鞋！' });
    }
    // 湿度补丁
    if (isHumid) {
        if (temp != null && temp > 25) {
            patches.push({ type: 'humid', emoji: '💧', label: '闷热体感', text: `体感比实际温度高 3-5 度！建议直接穿短袖短裤，面料必须选亚麻、冰丝，千万别穿紧身裤，会粘腿！` });
        } else if (temp != null && temp < 15) {
            patches.push({ type: 'humid', emoji: '💧', label: '湿冷体感', text: '湿度大，体感比实际温度更阴冷。建议比标准穿搭多穿一件，避免粘身。' });
        } else {
            patches.push({ type: 'humid', emoji: '💧', label: '湿度大', text: '体感比实际温度更闷热/阴冷。建议比标准穿搭少穿一件或选择速干面料，避免粘身。' });
        }
    }
    // 大风补丁
    if (isWindy) {
        if (temp != null && temp < 15) {
            patches.push({ type: 'wind', emoji: '💨', label: '大风干冷', text: '体感比实际温度低 3-5 度！必须在外面加一件防风的外套（皮衣/冲锋衣），千万别穿透风的针织衫！' });
        } else {
            patches.push({ type: 'wind', emoji: '💨', label: '今天风大', text: '体感温度骤降。建议戴帽子（贝雷帽/棒球帽）防风，不要穿容易被吹乱的长裙，利落的裤装更佳。' });
        }
    }

    // 怎么穿 / 小心机
    let howToWear = zone.formula;
    let tip = zone.detail.replace(/^重点：/, '');
    if (isHumid && temp != null && temp > 25) {
        howToWear = '这种天气虽然才' + temp + '度，但体感像' + (temp + 4) + '度！建议穿短袖+透气阔腿裤。千万别穿紧身牛仔裤，会粘腿！';
        tip = '包里备一把小扇子，面料选亚麻或天丝，出汗不沾身。';
    } else if (isWindy && temp != null && temp < 15) {
        howToWear = '风大+低温，体感比实际低 3-5℃。在“' + zone.formula + '”基础上再加一件防风外套。';
        tip = '帽子和围巾是刚需，别让风直接吹到脖子。';
    } else if (isRain) {
        howToWear = '今天有雨，在“' + zone.formula + '”基础上换成防水面料或短靴。';
        tip = '浅色帆布鞋和拖地长裤今天请收起来，湿掉真的很狼狈。';
    }

    // 护肤 / 妆容 / 发型
    const beauty = [];
    if (uv != null && uv >= 5) {
        beauty.push({ icon: '☀️', title: '防晒必须到位', desc: uv >= 8 ? `UV 指数 ${uv}，涂抹 SPF50+ 防晒霜，配合帽子/伞。` : `UV 指数 ${uv}，涂抹 SPF30-50 防晒霜。` });
    }
    if (isDry || (isWindy && temp != null && temp < 15)) {
        beauty.push({ icon: '🧴', title: '保湿封闭性', desc: '干燥/大风天加强保湿：面霜、润唇膏、身体乳。底妆选滋润型粉底，避免卡粉。' });
        beauty.push({ icon: '💇‍♀️', title: '发型建议', desc: '大风天建议戴帽子或喷定型喷雾，避免头发被吹乱。' });
    }
    if (isHumid && temp != null && temp > 20) {
        beauty.push({ icon: '💄', title: '清爽控油', desc: '潮湿闷热天用定妆喷雾、散粉。底妆选持妆型、抗汗型产品。' });
        beauty.push({ icon: '💇‍♀️', title: '发型建议', desc: '湿度大头发易毛躁，建议扎起来或盘发，清爽又防脱妆。' });
    }
    if (isRain) {
        beauty.push({ icon: '☔', title: '防水妆容', desc: '雨天用防水睫毛膏/眼线，口红选哑光持久款。' });
    }
    if (uv != null && uv >= 8) {
        beauty.push({ icon: '🌿', title: '晒后修护', desc: '强紫外线天建议携带芦荟胶或修护精华，晚上做好舒缓。' });
    }
    if (!beauty.length) {
        beauty.push({ icon: '✨', title: '日常妆容即可', desc: '今天天气平稳，按日常护肤和妆容节奏出门。' });
    }

    return { zone, patches, howToWear, tip, beauty };
}

function isRainCode(code) {
    return (code >= 50 && code <= 69) || (code >= 80 && code <= 99);
}

function weatherCodeToIcon(code) {
    if (code == null) return '🌡️';
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '🌤️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌧️';
    if (code >= 56 && code <= 57) return '🌧️';
    if (code >= 61 && code <= 67) return '☔';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌡️';
}

async function loadBeautyWeather() {
    const wrap = document.getElementById('beautyTodayWrap');
    if (!wrap) return;
    const cacheKey = 'beautyWeather';
    const cached = state.data.apiCache ? state.data.apiCache[cacheKey] : null;
    if (cached && cached.ts && (Date.now() - cached.ts < 30 * 60 * 1000)) {
        wrap.innerHTML = renderBeautyToday();
        return;
    }
    if (!state.data.apiCache) state.data.apiCache = {};
    state.data.apiCache[cacheKey] = { data: null, error: null, ts: Date.now() };
    wrap.innerHTML = renderBeautyToday();
    try {
        const pos = await getBeautyPosition();
        const url = `${API.weather}/forecast?latitude=${pos.lat}&longitude=${pos.lon}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index,wind_speed_10m,precipitation&daily=uv_index_max&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('天气接口暂时不可用');
        const data = await res.json();
        state.data.apiCache[cacheKey] = { data, error: null, ts: Date.now() };
        saveState();
    } catch (e) {
        state.data.apiCache[cacheKey] = { data: null, error: e.message || '获取天气失败', ts: Date.now() };
    }
    const wrap2 = document.getElementById('beautyTodayWrap');
    if (wrap2) wrap2.innerHTML = renderBeautyToday();
}

function getBeautyPosition() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
                () => resolve(getCityFallback()),
                { timeout: 8000 }
            );
        } else {
            resolve(getCityFallback());
        }
    });
}

function getCityFallback() {
    // 成都作为默认兜底，也可通过设置城市做简单映射
    const cityMap = { '成都': { lat: 30.66, lon: 104.06 }, '北京': { lat: 39.90, lon: 116.41 }, '上海': { lat: 31.23, lon: 121.47 }, '广州': { lat: 23.13, lon: 113.26 }, '深圳': { lat: 22.54, lon: 114.06 } };
    const c = (state.settings.city || '成都').trim();
    return cityMap[c] || { lat: 30.66, lon: 104.06 };
}

// ---------- Tab 2: 流行风向 ----------
function renderBeautyTrend() {
    const cache = state.data.apiCache ? state.data.apiCache['beautyTrend'] : null;
    if (!cache) {
        return `<div class="empty-state"><span class="emoji">🔥</span>正在加载变美热点...</div>`;
    }
    const data = cache.data || {};
    const list = data.list || [];
    const filtered = filterBeautyTrends(list).slice(0, 5);
    const updated = data.update_time ? new Date(data.update_time).toLocaleString('zh-CN') : '刚刚';
    return `
        <div class="card-header">
            <div class="card-title">🔥 流行风向</div>
            <button class="btn btn-secondary" data-action="beauty-trend-refresh" style="font-size:12px">刷新</button>
        </div>
        <div class="hot-update">更新于 ${updated}</div>
        <div class="beauty-trend-list">
            ${filtered.length ? filtered.map((n, i) => `
                <div class="beauty-trend-item" data-action="open-link" data-link="${n.url || '#'}" style="cursor:pointer">
                    <div class="beauty-trend-rank">${i + 1}</div>
                    <div class="beauty-trend-body">
                        <div class="beauty-trend-title">${escapeHtml(n.title)}</div>
                        <div class="beauty-trend-meta">${escapeHtml(n.platform || data.platform || '热点')} · 热度 ${n.hot_value || '-'}</div>
                    </div>
                    <div class="beauty-trend-fire">🔥</div>
                </div>
            `).join('') : `<div class="empty-state"><span class="emoji">🔥</span>暂无相关热点，<button class="btn btn-primary btn-sm" data-action="beauty-trend-refresh" style="margin-left:6px">点击刷新</button></div>`}
        </div>
    `;
}

function filterBeautyTrends(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(item => {
        const t = (item.title || '').toLowerCase();
        return BEAUTY_TREND_KEYWORDS.some(k => t.includes(k.toLowerCase()));
    });
}

async function loadBeautyTrend() {
    const wrap = document.getElementById('beautyTrendWrap');
    if (!wrap) return;
    const cacheKey = 'beautyTrend';
    const cached = state.data.apiCache ? state.data.apiCache[cacheKey] : null;
    if (cached && cached.ts && (Date.now() - cached.ts < 10 * 60 * 1000)) {
        wrap.innerHTML = renderBeautyTrend();
        return;
    }
    if (!state.data.apiCache) state.data.apiCache = {};
    state.data.apiCache[cacheKey] = { data: { list: [], update_time: null }, ts: Date.now() };
    wrap.innerHTML = renderBeautyTrend();
    const merged = [];
    for (const type of BEAUTY_TREND_TYPES) {
        try {
            const res = await fetch(`${API.hot}?type=${type}&limit=30`);
            const data = await res.json();
            if (data && data.list) {
                data.list.forEach(n => { n.platform = platformName(type); });
                merged.push(...data.list);
            }
        } catch (e) {
            console.warn('变美热点获取失败', type, e);
        }
    }
    merged.sort((a, b) => parseHotValue(b.hot_value) - parseHotValue(a.hot_value));
    state.data.apiCache[cacheKey] = { data: { list: merged, update_time: new Date().toISOString(), platform: '综合' }, ts: Date.now() };
    saveState();
    const wrap2 = document.getElementById('beautyTrendWrap');
    if (wrap2) wrap2.innerHTML = renderBeautyTrend();
}

function platformName(type) {
    const map = { xiaohongshu: '小红书', douyin: '抖音', bilibili: 'B站', weibo: '微博', kuaishou: '快手' };
    return map[type] || type;
}

function parseHotValue(v) {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/,/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

// ---------- Tab 3: 灵感军火库 ----------
function renderBeautyArsenal() {
    let list = state.data.beautyInspirations || [];
    const q = (state._beautySearch || '').trim().toLowerCase();
    if (q) {
        list = list.filter(item => {
            const hay = [
                item.title || '',
                item.note || '',
                Array.isArray(item.tags) ? item.tags.join(' ') : '',
                detectSource(item.url).name
            ].join(' ').toLowerCase();
            return hay.includes(q);
        });
    }

    // 数据库表未创建时的引导
    if (state._beautyTableMissing) {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">💅 灵感军火库</div>
                </div>
                <div class="beauty-setup-guide">
                    <div class="beauty-setup-icon">🗄️</div>
                    <div class="beauty-setup-title">还差一步：创建数据库表</div>
                    <div class="beauty-setup-desc">Supabase 中还没有 <code>beauty_inspiration</code> 表，所以灵感库无法加载。请按以下步骤操作一次：</div>
                    <ol class="beauty-setup-steps">
                        <li>登录你的 Supabase 项目后台</li>
                        <li>左侧菜单进入 <b>SQL Editor</b> → 点击 <b>New query</b></li>
                        <li>复制下方 SQL → 点击 <b>Run</b> 执行</li>
                        <li>回到本页面刷新即可</li>
                    </ol>
                    <pre class="beauty-setup-sql" id="beautySetupSql">create table if not exists beauty_inspiration (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text,
  cover_url text,
  tags text[] default '{}',
  note text,
  created_at timestamp with time zone default now()
);
alter table beauty_inspiration enable row level security;
create policy "allow anon all" on beauty_inspiration
  for all to anon using (true) with check (true);</pre>
                    <div class="beauty-setup-actions">
                        <button class="btn btn-secondary" data-action="beauty-setup-copy-sql">📋 复制上方 SQL</button>
                        <button class="btn btn-primary" data-action="open-settings">打开设置面板</button>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">💅 灵感军火库</div>
                <button class="btn btn-primary" data-action="beauty-insp-add">＋ 新增链接</button>
            </div>
            <div class="beauty-arsenal-toolbar">
                <input type="text" class="input" id="beautyInspSearch" placeholder="搜索标签/标题/备注..." value="${escapeHtml(state._beautySearch || '')}">
                <button class="btn btn-secondary" data-action="beauty-insp-search">搜索</button>
            </div>
            <div class="beauty-arsenal-grid">
                ${list.length ? list.map(item => renderBeautyInspCard(item)).join('') : `<div class="beauty-arsenal-empty"><span class="emoji">💡</span>${q ? '没有匹配的灵感' : '还没有灵感，点击右上角新增链接开始收集吧～'}</div>`}
            </div>
        </div>
    `;
}

function renderBeautyInspCard(item) {
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const source = detectSource(item.url);
    return `
        <div class="beauty-insp-card" data-id="${item.id}">
            <a class="beauty-insp-thumb" href="${item.url || '#' }" target="_blank" rel="noopener" style="background-image:url('${item.cover_url || ''}')">
                ${item.cover_url ? '' : '<div class="beauty-insp-noimg">💄</div>'}
            </a>
            <div class="beauty-insp-body">
                <a class="beauty-insp-title" href="${item.url || '#'}" target="_blank" rel="noopener">${escapeHtml(item.title || '未命名灵感')}</a>
                <div class="beauty-insp-tags">${tags.map(t => `<span class="beauty-insp-tag">#${escapeHtml(t)}</span>`).join('')}</div>
                ${item.note ? `<div class="beauty-insp-note">${escapeHtml(item.note)}</div>` : ''}
                <div class="beauty-insp-meta">
                    <span class="beauty-insp-source-line">${source.icon} ${escapeHtml(source.name)}</span>
                </div>
            </div>
            <div class="beauty-insp-actions">
                <button class="beauty-insp-btn" data-action="beauty-insp-edit" data-id="${item.id}" title="编辑">✎</button>
                <button class="beauty-insp-btn danger" data-action="beauty-insp-delete" data-id="${item.id}" title="删除">🗑</button>
            </div>
        </div>
    `;
}

function detectSource(url) {
    if (!url) return { name: '链接', icon: '🔗' };
    const u = url.toLowerCase();
    if (u.includes('xiaohongshu.com') || u.includes('xhslink.com')) return { name: '小红书', icon: '📕' };
    if (u.includes('douyin.com') || u.includes('iesdouyin.com')) return { name: '抖音', icon: '🎵' };
    if (u.includes('bilibili.com') || u.includes('b23.tv')) return { name: 'B站', icon: '📺' };
    if (u.includes('youtube.com') || u.includes('youtu.be')) return { name: 'YouTube', icon: '▶️' };
    if (u.includes('weibo.com') || u.includes('weibo.cn')) return { name: '微博', icon: '🧣' };
    return { name: '链接', icon: '🔗' };
}

async function loadBeautyArsenal() {
    if (state._loadingBeautyArsenal) return;
    state._loadingBeautyArsenal = true;
    if (!state.supabase) {
        // 未连接云端时直接渲染本地缓存
        state._beautyTableMissing = false;
        render();
        state._loadingBeautyArsenal = false;
        return;
    }
    try {
        const { data, error } = await state.supabase
            .from('beauty_inspiration')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        state.data.beautyInspirations = data || [];
        state._beautyTableMissing = false;
        saveState();
        render();
    } catch (e) {
        console.error('灵感库加载失败', e);
        const msg = e && e.message ? e.message : String(e);
        if (msg.toLowerCase().includes("could not find") || msg.includes("beauty_inspiration") || msg.includes("relation \"beauty_inspiration\"")) {
            state._beautyTableMissing = true;
            render();
        } else {
            toast('灵感库加载失败：' + msg);
        }
    }
    state._loadingBeautyArsenal = false;
}

async function parseBeautyUrl(url) {
    const encoded = encodeURIComponent(url);
    const source = detectSource(url);
    let title = '';
    let coverUrl = '';

    // 1. 尝试 microlink.io
    try {
        const res = await fetch(`https://api.microlink.io/?url=${encoded}`);
        if (res.ok) {
            const data = await res.json();
            const d = data && data.data ? data.data : {};
            title = d.title || '';
            coverUrl = pickLargerImage(d.image, d.logo, coverUrl);
        }
    } catch (e) { console.warn('microlink 解析失败', e); }

    // 2. 尝试 jsonlink.io 作为封面图备用（过滤掉平台 logo）
    if (!coverUrl || isLogoUrl(coverUrl, source.name)) {
        try {
            const res = await fetch(`https://jsonlink.io/api/extract?url=${encoded}`);
            if (res.ok) {
                const data = await res.json();
                title = title || (data.title || '');
                let candidates = [];
                if (Array.isArray(data.images)) {
                    candidates = data.images.filter(i => i && i.url && !isLogoUrl(i.url, source.name));
                }
                // 如果全是 logo，不采纳；否则从中取最大图
                if (candidates.length) coverUrl = pickLargerImage(candidates, null, coverUrl);
            }
        } catch (e) { console.warn('jsonlink 解析失败', e); }
    }

    // 3. 对小红书 / 抖音短链做特殊处理：抓取落地页 HTML 解析 og:image
    if ((source.name === '小红书' || source.name === '抖音') && (!coverUrl || isLogoUrl(coverUrl, source.name))) {
        try {
            const html = await fetchHtmlViaProxy(url);
            if (html) {
                const ogImage = extractOgImage(html, url);
                if (ogImage && !isLogoUrl(ogImage, source.name)) coverUrl = ogImage;
                if (!title) {
                    const ogTitle = extractOgTitle(html);
                    if (ogTitle) title = ogTitle;
                }
            }
        } catch (e) { console.warn('HTML 抓取解析失败', e); }
    }

    if (!title && !coverUrl) return null;
    return { title, cover_url: coverUrl };
}

function isLogoUrl(url, sourceName) {
    if (!url) return true;
    const u = url.toLowerCase();
    // 小红书常见 logo / 平台占位图
    if (u.includes('picasso-static.xiaohongshu.com')) return true;
    if (u.includes('fe-platform')) return true;
    if (sourceName === '小红书' && (u.includes('logo') || u.includes('/icon') || u.includes('favicon'))) return true;
    if (sourceName === '抖音' && (u.includes('logo') || u.includes('/icon') || u.includes('favicon'))) return true;
    return false;
}

async function fetchHtmlViaProxy(url) {
    const proxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];
    for (const proxyUrl of proxies) {
        try {
            const res = await fetch(proxyUrl, { redirect: 'follow' });
            if (res.ok) return await res.text();
        } catch (e) { console.warn('代理抓取失败', proxyUrl, e); }
    }
    return '';
}

function extractOgImage(html, baseUrl) {
    const patterns = [
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i,
        /<meta[^>]*name=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i
    ];
    for (const p of patterns) {
        const m = html.match(p);
        if (m && m[1]) {
            let img = m[1].trim();
            if (img.startsWith('//')) img = 'https:' + img;
            else if (img.startsWith('/')) {
                try { img = new URL(img, baseUrl).href; } catch (e) {}
            }
            return img;
        }
    }
    return '';
}

function extractOgTitle(html) {
    const patterns = [
        /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i
    ];
    for (const p of patterns) {
        const m = html.match(p);
        if (m && m[1]) return m[1].trim();
    }
    const tm = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return tm ? tm[1].trim() : '';
}

function pickLargerImage(imgA, imgB, fallback) {
    const candidates = [];
    if (imgA && imgA.url) candidates.push({ url: imgA.url, width: imgA.width || 0, height: imgA.height || 0 });
    if (Array.isArray(imgA)) imgA.forEach(i => { if (i && i.url) candidates.push({ url: i.url, width: i.width || 0, height: i.height || 0 }); });
    if (imgB && imgB.url) candidates.push({ url: imgB.url, width: imgB.width || 0, height: imgB.height || 0 });
    if (fallback) candidates.push({ url: fallback, width: 0, height: 0 });
    if (!candidates.length) return '';
    // 优先选尺寸大的；没有尺寸时按顺序返回第一个
    candidates.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    return candidates[0].url;
}

function openBeautyInspModal(item) {
    state._beautyInspEditing = item || null;
    document.getElementById('beautyInspModalTitle').textContent = item ? '✏️ 编辑灵感' : '➕ 新增灵感';
    document.getElementById('beautyInspUrl').value = item ? item.url : '';
    document.getElementById('beautyInspTitle').value = item ? (item.title || '') : '';
    document.getElementById('beautyInspCover').value = item ? (item.cover_url || '') : '';
    document.getElementById('beautyInspTags').value = item ? (Array.isArray(item.tags) ? item.tags.join(' ') : '') : '';
    document.getElementById('beautyInspNote').value = item ? (item.note || '') : '';
    document.getElementById('beautyInspFile').value = '';
    state._beautyInspCoverBase64 = '';
    document.getElementById('beautyCoverUrlWrap').style.display = 'none';
    const urlToggle = document.querySelector('[data-action="beauty-insp-use-url"]');
    if (urlToggle) urlToggle.textContent = '或粘贴图片链接';
    const coverUrl = item ? (item.cover_url || '') : '';
    const source = detectSource(item ? item.url : '');
    const isLogo = isLogoUrl(coverUrl, source.name);
    document.getElementById('beautyInspSkipCover').checked = item ? (!coverUrl || isLogo) : false;
    updateBeautyCoverPreview(coverUrl, item ? true : false);
    document.getElementById('beautyInspModal').classList.add('show');
}

function closeBeautyInspModal() {
    document.getElementById('beautyInspModal').classList.remove('show');
    state._beautyInspEditing = null;
}

function updateBeautyCoverPreview(url, showWarningIfLogo) {
    const wrap = document.getElementById('beautyInspPreview');
    if (!wrap) return;
    if (!url) {
        wrap.innerHTML = '<div class="beauty-insp-preview-empty">暂未设置封面，点击「选择图片」上传或「粘贴图片链接」</div>';
        return;
    }
    const source = detectSource(document.getElementById('beautyInspUrl').value.trim());
    const isLogo = isLogoUrl(url, source.name);
    const warning = (showWarningIfLogo && isLogo)
        ? '<div class="beauty-insp-preview-warn">⚠️ 当前是平台 Logo 或占位图，建议手动替换为笔记封面图链接</div>'
        : '';
    wrap.innerHTML = `<img src="${url}" alt="cover" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\'beauty-insp-preview-empty\\'>图片加载失败，请检查链接是否有效</div>'">${warning}`;
}

async function saveBeautyInsp() {
    const url = document.getElementById('beautyInspUrl').value.trim();
    if (!url) { toast('请输入链接'); return; }
    let title = document.getElementById('beautyInspTitle').value.trim();
    let coverUrl = state._beautyInspCoverBase64 || document.getElementById('beautyInspCover').value.trim();
    const tagsStr = document.getElementById('beautyInspTags').value.trim();
    const note = document.getElementById('beautyInspNote').value.trim();
    const tags = tagsStr ? tagsStr.split(/[\s,，]+/).filter(Boolean) : [];
    const skipCover = document.getElementById('beautyInspSkipCover').checked;

    // 只有没有标题且没有上传/填写封面时，才尝试自动解析
    if (!title && !coverUrl && !skipCover) {
        toast('正在解析链接，请稍候...');
        const parsed = await parseBeautyUrl(url);
        if (parsed) {
            if (!title) title = parsed.title;
            if (!coverUrl) {
                coverUrl = parsed.cover_url;
                document.getElementById('beautyInspCover').value = coverUrl;
                updateBeautyCoverPreview(coverUrl, true);
            }
        }
    }
    if (!title) title = '未命名灵感';

    const source = detectSource(url);
    // 只有 URL 模式才需要过滤平台 Logo；base64 是用户自己上传的图，不过滤
    if (coverUrl && !coverUrl.startsWith('data:') && isLogoUrl(coverUrl, source.name) && !skipCover) {
        toast('⚠️ 当前封面是平台 Logo，请点「清空」或勾选「暂时没封面」后再保存');
        return;
    }
    if (coverUrl && !coverUrl.startsWith('data:') && isLogoUrl(coverUrl, source.name)) {
        coverUrl = ''; // 保存前强制清掉 logo，避免卡片显示 logo
    }

    const payload = { url, title, cover_url: coverUrl, tags, note };
    const editing = state._beautyInspEditing;

    if (!state.supabase) {
        toast('未连接云端，无法保存灵感库');
        return;
    }
    try {
        if (editing && editing.id) {
            const { error } = await state.supabase.from('beauty_inspiration').update(payload).eq('id', editing.id);
            if (error) throw error;
        } else {
            const { error } = await state.supabase.from('beauty_inspiration').insert(payload);
            if (error) throw error;
        }
        closeBeautyInspModal();
        await loadBeautyArsenal();
        toast('已保存');
    } catch (e) {
        console.error('保存灵感失败', e);
        const msg = e && e.message ? e.message : String(e);
        if (msg.toLowerCase().includes("could not find") || msg.includes("beauty_inspiration") || msg.includes("relation \"beauty_inspiration\"")) {
            toast('保存失败：数据库表未创建。请打开设置页 → 复制「变美情报局建表 SQL」到 Supabase SQL Editor 执行后重试');
        } else {
            toast('保存失败：' + msg);
        }
    }
}

async function deleteBeautyInsp(id) {
    if (!await uiConfirm('确定删除这条灵感吗？', { isDanger: true })) return;
    if (!state.supabase) { toast('未连接云端'); return; }
    try {
        const { error } = await state.supabase.from('beauty_inspiration').delete().eq('id', id);
        if (error) throw error;
        await loadBeautyArsenal();
        toast('已删除');
    } catch (e) {
        console.error('删除灵感失败', e);
        toast('删除失败：' + (e.message || '请检查云端连接'));
    }
}

function filterBeautyInspirations() {
    const q = (document.getElementById('beautyInspSearch') ? document.getElementById('beautyInspSearch').value : '').trim().toLowerCase();
    state._beautySearch = q;
    render();
}

// ==================== 树洞模块 ====================
// ==================== 夸夸自己模块 ====================
function renderTreeHole() {
    const section = state._praiseSection || 'praises';
    const tab = state._praiseTab || 'today';
    const subTabs = [
        { id: 'today', name: '今日', icon: '✨' },
        { id: 'calendar', name: '日历', icon: '📅' },
        { id: 'weekly', name: '周记', icon: '📆' },
        { id: 'monthly', name: '月记', icon: '🗓️' },
        { id: 'groups', name: '分组', icon: '🏷️' }
    ];
    let panel = '';
    if (section === 'praises') {
        if (tab === 'today') panel = praiseTodayPanel();
        else if (tab === 'calendar') panel = praiseCalendarPanel();
        else if (tab === 'weekly') panel = praiseWeeklyPanel();
        else if (tab === 'monthly') panel = praiseMonthlyPanel();
        else panel = praiseGroupsPanel();
    } else {
        panel = praiseQuotesPanel();
    }
    const groups = state.data.praiseGroups || [];
    const selGroup = state._praiseGroupSel || '';
    return `
        <div class="card">
            <div class="card-header">
                <div class="card-title">💛 与自己对话</div>
                <span style="font-size:12px;color:var(--text-secondary)">每天一句，看见自己的好</span>
            </div>
            <div class="praise-segment">
                <button class="seg-btn ${section === 'praises' ? 'active' : ''}" data-action="praise-section" data-section="praises">✨ 夸夸</button>
                <button class="seg-btn ${section === 'quotes' ? 'active' : ''}" data-action="praise-section" data-section="quotes">💬 金句</button>
            </div>
            ${section === 'praises' ? `
            <div class="praise-rule">✨ 规则：写一句夸夸自己，即可获得一颗小星星。坚持记录，月底回顾会很有力量。</div>
            <div class="praise-input-row">
                <input type="text" class="input" id="praiseInput" placeholder="今天，我想夸夸自己：" maxlength="200">
                <button class="btn btn-primary" data-action="praise-send">记录</button>
            </div>
            <div class="praise-group-row">
                <span class="praise-group-label">分组</span>
                <select id="praiseGroupSelect" class="input praise-group-select">
                    <option value="">未分组</option>
                    ${groups.map(g => `<option value="${g.id}" ${selGroup === g.id ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
                </select>
                <button class="btn praise-group-add-btn" data-action="praise-group-new" title="新建分组">＋</button>
            </div>
            ${state._praiseGroupAdding ? `
            <div class="praise-group-new-wrap">
                <input type="text" class="input" id="praiseGroupNewInput" placeholder="输入分组名" maxlength="20">
                <button class="btn btn-primary" data-action="praise-group-new-confirm">确定</button>
                <button class="btn" data-action="praise-group-new-cancel">取消</button>
            </div>
            ` : ''}
            <div class="praise-tabs">${subTabs.map(t => `
                <button class="tab-btn ${tab === t.id ? 'active' : ''}" data-action="praise-tab" data-tab="${t.id}">${t.icon} ${t.name}</button>
            `).join('')}</div>
            ${tab !== 'groups' ? praiseGroupFilterBar() : ''}
            ` : ''}
            <div id="praisePanel">${panel}</div>
        </div>
    `;
}

function praiseGroupFilterBar() {
    const groups = state.data.praiseGroups || [];
    const cur = state._praiseFilterGroup || '';
    const chip = (val, label) => `<button class="pg-chip ${cur === val ? 'active' : ''}" data-action="praise-filter-group" data-group="${val}">${label}</button>`;
    return `<div class="praise-group-filter">${chip('', '全部')}${chip('__none__', '未分组')}${groups.map(g => chip(g.id, escapeHtml(g.name))).join('')}</div>`;
}

function filterPraiseByGroup(arr) {
    const g = state._praiseFilterGroup;
    if (!g) return arr;
    if (g === '__none__') return arr.filter(p => !p.groupId);
    return arr.filter(p => p.groupId === g);
}

function praiseGroupsPanel() {
    const groups = state.data.praiseGroups || [];
    if (state._praiseGroupView) {
        const g = groups.find(x => x.id === state._praiseGroupView);
        const items = filterPraiseByGroup(state.data.praises.filter(p => p.groupId === state._praiseGroupView)).sort((a, b) => a.time < b.time ? 1 : -1);
        return `
            <div class="praise-subtitle">${escapeHtml(g ? g.name : '分组')} · 共 ${items.length} 句夸夸</div>
            <button class="btn" data-action="praise-group-back" style="margin-bottom:10px">← 返回分组管理</button>
            ${items.length ? items.map(p => praiseCard(p)).join('') : '<div class="empty-state"><span class="emoji">💛</span>这个分组还没有夸夸，去记录时选择它吧～</div>'}
        `;
    }
    return `
        <div class="praise-subtitle">给你的夸夸分类，比如「工作」「生活」「成长」，方便以后按主题回顾</div>
        <button class="btn btn-primary" data-action="praise-group-new" style="margin-bottom:12px">＋ 新建分组</button>
        ${groups.length ? `<div class="praise-group-list">${groups.map(g => {
            const cnt = state.data.praises.filter(p => p.groupId === g.id).length;
            const renaming = state._praiseGroupRenaming === g.id;
            return `<div class="praise-group-item">
                ${renaming ? `
                    <input type="text" class="input praise-group-rename-input" id="praiseGroupRenameInput" value="${escapeHtml(g.name)}" maxlength="20">
                    <span class="praise-group-ops">
                        <button class="praise-del" data-action="praise-group-rename-confirm" data-id="${g.id}">确定</button>
                        <button class="praise-del" data-action="praise-group-rename-cancel" data-id="${g.id}">取消</button>
                    </span>
                ` : `
                    <button class="praise-group-name" data-action="praise-group-view" data-id="${g.id}">🏷️ ${escapeHtml(g.name)} <span class="praise-group-count">${cnt}</span></button>
                    <span class="praise-group-ops">
                        <button class="praise-del" data-action="praise-group-rename" data-id="${g.id}">重命名</button>
                        <button class="praise-del" data-action="praise-group-delete" data-id="${g.id}">删除</button>
                    </span>
                `}
            </div>`;
        }).join('')}</div>` : '<div class="empty-state"><span class="emoji">🏷️</span>还没有分组，点上面新建一个吧～</div>'}
    `;
}

function addPraiseGroup(name) {
    name = (name || '').trim();
    if (!name) { toast('请输入分组名'); return; }
    const g = { id: uuid(), name };
    state.data.praiseGroups.push(g);
    state._praiseGroupAdding = false;
    state._praiseGroupSel = g.id;
    saveState();
    render();
    toast('已创建分组：' + name);
}

function renamePraiseGroup(id, name) {
    const g = (state.data.praiseGroups || []).find(x => x.id === id);
    if (!g) return;
    name = (name || '').trim();
    if (!name) { toast('分组名不能为空'); return; }
    g.name = name;
    state._praiseGroupRenaming = null;
    saveState();
    render();
    toast('已重命名');
}

function deletePraiseGroup(id) {
    const g = (state.data.praiseGroups || []).find(x => x.id === id);
    if (!g) return;
    state.data.praiseGroups = (state.data.praiseGroups || []).filter(x => x.id !== id);
    // 该分组下的夸夸退回到「未分组」
    state.data.praises.forEach(p => { if (p.groupId === id) p.groupId = null; });
    if (state._praiseGroupView === id) state._praiseGroupView = null;
    saveState();
    render();
    toastUndo('已删除分组「' + g.name + '」（组内夸夸移至未分组）', () => {
        state.data.praiseGroups.push(g);
        saveState();
        render();
    });
}

function addPraise(text, groupId) {
    if (!text || !text.trim()) return;
    state.data.praises.unshift({
        id: uuid(),
        text: text.trim(),
        groupId: groupId || null,
        date: today(),
        time: now(),
        week: getWeekKey(today()),
        month: today().slice(0, 7)
    });
    saveState();
    render();
    toast('已记录，你今天也很棒 ✨');
}

function deletePraise(id) {
    const p = state.data.praises.find(x => x.id === id);
    state.data.praises = state.data.praises.filter(x => x.id !== id);
    saveState();
    render();
    if (p) toastUndo('已删除这条夸夸', () => {
        state.data.praises.unshift(p);
        saveState();
        render();
    });
}

function praiseTodayPanel() {
    const todayPraises = filterPraiseByGroup(state.data.praises.filter(p => p.date === today())).sort((a, b) => a.time < b.time ? 1 : -1);
    return `
        ${todayPraises.length ? `<div class="praise-subtitle">今天已记录 ${todayPraises.length} 句夸夸</div>` : ''}
        ${todayPraises.length ? todayPraises.map(p => praiseCard(p)).join('') : `
            <div class="empty-state"><span class="emoji">💛</span>今天还没有夸夸自己，写一条吧~</div>
        `}
    `;
}

function praiseCalendarPanel() {
    const selected = state._praiseDate || today();
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    const praisesByDate = {};
    state.data.praises.forEach(p => { praisesByDate[p.date] = (praisesByDate[p.date] || 0) + 1; });
    const datePraises = filterPraiseByGroup(state.data.praises.filter(p => p.date === selected)).sort((a, b) => a.time < b.time ? 1 : -1);
    return `
        <div class="praise-subtitle">点击日期，查看那天的闪光点</div>
        <div class="praise-calendar">
            <div class="pcal-header">日</div><div class="pcal-header">一</div><div class="pcal-header">二</div><div class="pcal-header">三</div><div class="pcal-header">四</div><div class="pcal-header">五</div><div class="pcal-header">六</div>
            ${days.map(d => {
                if (!d) return '<div class="pcal-day empty"></div>';
                const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const count = praisesByDate[ds] || 0;
                const hearts = count > 0 ? '💗'.repeat(Math.min(5, count)) : '';
                const isSel = ds === selected;
                return `<button class="pcal-day ${count > 0 ? 'has' : ''} ${isSel ? 'selected' : ''}" data-action="praise-date" data-date="${ds}"><span class="cal-num">${d}</span><span class="cal-hearts">${hearts}</span></button>`;
            }).join('')}
        </div>
        <div class="calendar-legend">💗 越多，代表那天夸夸自己越积极（最多 5 颗）</div>
        <div class="praise-selected-title">${formatDate(selected)} 的夸夸</div>
        ${datePraises.length ? datePraises.map(p => praiseCard(p)).join('') : '<div class="empty-state"><span class="emoji">💛</span>这一天还没有记录夸夸</div>'}
    `;
}

function praiseWeeklyPanel() {
    const all = filterPraiseByGroup(state.data.praises);
    const groups = {};
    all.forEach(p => {
        groups[p.week] = groups[p.week] || [];
        groups[p.week].push(p);
    });
    const weeks = Object.keys(groups).sort().reverse();
    return `
        <div class="praise-subtitle">按周回顾，看看这段时间你做得有多好</div>
        ${weeks.length ? weeks.map(wk => `
            <div class="praise-group">
                <div class="praise-group-title">${wk} · ${groups[wk].length} 句夸夸</div>
                ${groups[wk].sort((a, b) => a.time < b.time ? 1 : -1).map(p => praiseCard(p, true)).join('')}
            </div>
        `).join('') : '<div class="empty-state"><span class="emoji">💛</span>还没有周记，先记录几句夸夸吧</div>'}
    `;
}

function praiseMonthlyPanel() {
    const all = filterPraiseByGroup(state.data.praises);
    const groups = {};
    all.forEach(p => {
        groups[p.month] = groups[p.month] || [];
        groups[p.month].push(p);
    });
    const months = Object.keys(groups).sort().reverse();
    return `
        <div class="praise-subtitle">按月回顾，见证自己的成长</div>
        ${months.length ? months.map(m => `
            <div class="praise-group">
                <div class="praise-group-title">${m} · ${groups[m].length} 句夸夸</div>
                ${groups[m].sort((a, b) => a.time < b.time ? 1 : -1).map(p => praiseCard(p, true)).join('')}
            </div>
        `).join('') : '<div class="empty-state"><span class="emoji">💛</span>还没有月记，先记录几句夸夸吧</div>'}
    `;
}

function praiseCard(p, compact) {
    const groups = state.data.praiseGroups || [];
    const g = p.groupId ? groups.find(x => x.id === p.groupId) : null;
    return `
        <div class="praise-card">
            <div class="praise-text">${escapeHtml(p.text)}</div>
            ${g ? `<div class="praise-card-group">🏷️ ${escapeHtml(g.name)}</div>` : ''}
            <div class="praise-meta">
                <span>${compact ? formatDate(p.date) : formatTime(p.time)}</span>
                <button class="praise-del" data-action="praise-delete" data-id="${p.id}">删除</button>
            </div>
        </div>
    `;
}

// 夸夸自己板块：金句库管理页
function quoteGroupFilterBar() {
    const groups = state.data.quoteGroups || [];
    const cur = state._quoteFilterGroup || '';
    const chip = (val, label) => `<button class="pg-chip ${cur === val ? 'active' : ''}" data-action="quote-filter-group" data-group="${val}">${label}</button>`;
    return `<div class="praise-group-filter">${chip('', '全部')}${chip('__none__', '未分组')}${groups.map(g => chip(g.id, escapeHtml(g.name))).join('')}</div>`;
}

function filterQuoteByGroup(arr) {
    const g = state._quoteFilterGroup;
    if (!g) return arr;
    if (g === '__none__') return arr.filter(q => !q.groupId);
    return arr.filter(q => q.groupId === g);
}

function praiseQuotesPanel() {
    const allQuotes = state.data.userQuotes || [];
    const quotes = filterQuoteByGroup(allQuotes);
    const groups = state.data.quoteGroups || [];
    const selGroup = state._quoteSelGroup || '';
    const todayQ = state.data.dailyQuote || {};
    const isToday = todayQ.date === today();
    const groupName = id => (groups.find(g => g.id === id) || {}).name || '未分组';
    return `
        <div class="praise-subtitle">在这里管理首页「今日金句」的句子库，每天会从库中随机抽取一句展示</div>
        ${isToday && todayQ.text ? `
            <div class="card quote-preview-card" style="margin-bottom:12px;background:var(--primary-light);border-color:var(--primary)">
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">今日首页正在展示</div>
                <div style="font-size:16px;font-weight:600;color:var(--text)">${escapeHtml(todayQ.text)}</div>
                ${todayQ.from ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">—— ${escapeHtml(todayQ.from)}</div>` : ''}
            </div>
        ` : ''}
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
            <button class="btn ${state._quoteManageOpen ? 'btn-primary' : ''}" data-action="quote-manage-toggle" style="font-size:13px">🏷️ 分组管理</button>
        </div>
        ${state._quoteManageOpen ? quoteGroupManagerHtml() : ''}
        <div class="quote-input-row" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <input type="text" class="input" id="quoteTextInput" placeholder="输入一句你喜欢的金句" maxlength="200" style="flex:1;min-width:200px">
            <input type="text" class="input" id="quoteFromInput" placeholder="出处（可选）" maxlength="50" style="width:120px">
            <select id="quoteGroupSelect" class="input" style="width:120px">
                <option value="">未分组</option>
                ${groups.map(g => `<option value="${g.id}" ${selGroup === g.id ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('')}
            </select>
            <button class="btn btn-primary" data-action="quote-add">添加</button>
        </div>
        ${allQuotes.length ? quoteGroupFilterBar() : ''}
        ${quotes.length ? `
            <div class="quote-list">
                ${quotes.map((q, i) => `
                    <div class="praise-card quote-list-item" data-id="${q.id}">
                        <div class="praise-text">${escapeHtml(q.text)}</div>
                        ${q.from ? `<div class="quote-from">—— ${escapeHtml(q.from)}</div>` : ''}
                        <div class="quote-group-tag">🏷️ ${escapeHtml(groupName(q.groupId))}</div>
                        <div class="praise-meta">
                            <span style="display:flex;gap:6px">
                                <button class="praise-del" data-action="quote-up" data-id="${q.id}" ${i === 0 ? 'disabled' : ''}>▲</button>
                                <button class="praise-del" data-action="quote-down" data-id="${q.id}" ${i === quotes.length - 1 ? 'disabled' : ''}>▼</button>
                            </span>
                            <span style="display:flex;gap:6px">
                                <button class="praise-del" data-action="quote-edit" data-id="${q.id}">编辑</button>
                                <button class="praise-del" data-action="quote-delete" data-id="${q.id}">删除</button>
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:12px;display:flex;gap:8px">
                <button class="btn btn-secondary" data-action="quote-refresh-today">🔄 立即换一句今日金句</button>
                <button class="btn" data-action="quote-reset-defaults" style="background:var(--surface-2);color:var(--text-secondary)">恢复默认内置金句库</button>
            </div>
        ` : `
            <div class="empty-state"><span class="emoji">💬</span>金句库空空如也，快去收集灵感吧~<br><span style="font-size:12px;color:var(--text-secondary)">空库时首页会自动使用内置金句</span></div>
            <button class="btn" data-action="quote-reset-defaults" style="margin-top:8px;background:var(--surface-2);color:var(--text-secondary)">一键导入默认内置金句库</button>
        `}
    `;
}

function quoteGroupManagerHtml() {
    const groups = state.data.quoteGroups || [];
    return `
        <div class="praise-group-manage" style="background:var(--surface-2);border-radius:var(--radius-sm);padding:12px;margin-bottom:12px">
            ${state._quoteGroupAdding ? `
                <div style="display:flex;gap:8px;margin-bottom:10px">
                    <input type="text" class="input" id="quoteGroupNewInput" placeholder="输入分组名" maxlength="20" style="flex:1">
                    <button class="btn btn-primary" data-action="quote-group-new-confirm">确定</button>
                    <button class="btn" data-action="quote-group-new-cancel">取消</button>
                </div>
            ` : '<button class="btn" data-action="quote-group-new" style="margin-bottom:10px;font-size:13px">＋ 新建分组</button>'}
            ${groups.length ? groups.map(g => {
                const renaming = state._quoteGroupRenaming === g.id;
                const cnt = (state.data.userQuotes || []).filter(q => q.groupId === g.id).length;
                return `<div class="praise-group-item">
                    ${renaming ? `
                        <input type="text" class="input praise-group-rename-input" id="quoteGroupRenameInput" value="${escapeHtml(g.name)}" maxlength="20">
                        <span class="praise-group-ops">
                            <button class="praise-del" data-action="quote-group-rename-confirm" data-id="${g.id}">确定</button>
                            <button class="praise-del" data-action="quote-group-rename-cancel" data-id="${g.id}">取消</button>
                        </span>
                    ` : `
                        <span class="praise-group-name">🏷️ ${escapeHtml(g.name)} <span class="praise-group-count">${cnt}</span></span>
                        <span class="praise-group-ops">
                            <button class="praise-del" data-action="quote-group-rename" data-id="${g.id}">重命名</button>
                            <button class="praise-del" data-action="quote-group-delete" data-id="${g.id}">删除</button>
                        </span>
                    `}
                </div>`;
            }).join('') : '<div style="font-size:13px;color:var(--text-secondary)">还没有分组，点上面新建一个吧～</div>'}
        </div>
    `;
}

function addQuote(text, from, groupId) {
    if (!text || !text.trim()) { toast('请输入金句内容'); return; }
    state.data.userQuotes.push({ id: uuid(), text: text.trim(), from: from.trim(), groupId: groupId || null, createdAt: now() });
    saveState();
    render();
    toast('金句已添加');
}

function updateQuote(id, text, from, groupId) {
    const q = state.data.userQuotes.find(x => x.id === id);
    if (!q) return;
    if (!text || !text.trim()) { toast('金句内容不能为空'); return; }
    q.text = text.trim();
    q.from = from.trim();
    if (typeof groupId !== 'undefined') q.groupId = groupId || null;
    saveState();
    render();
    toast('金句已更新');
}

function addQuoteGroup(name) {
    name = (name || '').trim();
    if (!name) { toast('请输入分组名'); return; }
    state.data.quoteGroups.push({ id: uuid(), name });
    state._quoteGroupAdding = false;
    state._quoteSelGroup = state.data.quoteGroups[state.data.quoteGroups.length - 1].id;
    saveState();
    render();
    toast('已创建分组：' + name);
}

function renameQuoteGroup(id, name) {
    const g = (state.data.quoteGroups || []).find(x => x.id === id);
    if (!g) return;
    name = (name || '').trim();
    if (!name) { toast('分组名不能为空'); return; }
    g.name = name;
    state._quoteGroupRenaming = null;
    saveState();
    render();
    toast('已重命名');
}

function deleteQuoteGroup(id) {
    const g = (state.data.quoteGroups || []).find(x => x.id === id);
    if (!g) return;
    state.data.quoteGroups = (state.data.quoteGroups || []).filter(x => x.id !== id);
    (state.data.userQuotes || []).forEach(q => { if (q.groupId === id) q.groupId = null; });
    if (state._quoteFilterGroup === id) state._quoteFilterGroup = '';
    if (state._quoteSelGroup === id) state._quoteSelGroup = '';
    saveState();
    render();
    toastUndo('已删除分组「' + g.name + '」（组内金句移至未分组）', () => {
        state.data.quoteGroups.push(g);
        saveState();
        render();
    });
}

function deleteQuote(id) {
    const q = state.data.userQuotes.find(x => x.id === id);
    state.data.userQuotes = state.data.userQuotes.filter(x => x.id !== id);
    // 如果删掉的是今日金句，清掉缓存让首页明天重新抽取
    if (state.data.dailyQuote && state.data.dailyQuote.id === id) {
        state.data.dailyQuote = null;
    }
    saveState();
    render();
    if (q) toastUndo('已删除这条金句', () => {
        state.data.userQuotes.unshift(q);
        saveState();
        render();
    });
}

function moveQuote(id, delta) {
    const arr = state.data.userQuotes;
    const i = arr.findIndex(x => x.id === id);
    if (i < 0) return;
    const j = i + delta;
    if (j < 0 || j >= arr.length) return;
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    saveState();
    render();
}

function importDefaultQuotes() {
    const defaults = [];
    Object.entries(ENCOURAGE_QUOTES).forEach(([key, cat]) => {
        cat.list.forEach(item => {
            defaults.push({ id: uuid(), text: item.text, from: item.from || '', category: cat.name, createdAt: now() });
        });
    });
    state.data.userQuotes = defaults;
    state.data.dailyQuote = null;
    saveState();
    render();
    toast(`已导入 ${defaults.length} 条默认金句`);
}

async function testSupabaseConnection() {
    let url = normalizeSupabaseUrl(document.getElementById('settingSupabaseUrl').value.trim());
    document.getElementById('settingSupabaseUrl').value = url;
    const key = document.getElementById('settingSupabaseKey').value.trim();
    if (!url || !key) {
        toast('请先填写 Supabase URL 和 Anon Key');
        return;
    }
    const keyCheck = validateSupabaseKey(key);
    if (!keyCheck.ok) {
        toast('❌ ' + keyCheck.text);
        updateSettingsStatus('cloud', false, keyCheck.text);
        return;
    }
    if (!window.supabase) {
        toast('Supabase 组件未加载，请检查网络后刷新');
        return;
    }
    toast('正在测试云端连接...');
    try {
        const client = window.supabase.createClient(url, key);
        const { data, error } = await client.from('growtree_data').select('id').limit(1);
        if (error) throw error;
        toast('✅ 云端连接成功');
        updateSettingsStatus('cloud', true);
    } catch (e) {
        const reason = analyzeSupabaseError(e);
        toast('❌ 连接失败：' + reason);
        updateSettingsStatus('cloud', false, reason);
    }
}

function updateSettingsStatus(type, ok, detail) {
    if (type === 'ai') {
        const el = document.getElementById('settingsAiStatus');
        if (!el) return;
        if (ok) {
            el.className = 'status-badge connected';
            el.textContent = '已连接';
        } else if (detail === 'empty') {
            el.className = 'status-badge';
            el.textContent = '未配置';
        } else {
            el.className = 'status-badge error';
            el.textContent = detail ? '连接失败' : '未配置';
            if (detail) el.title = detail;
        }
        return;
    }

    if (type === 'cloud') {
        const textEl = document.getElementById('settingsCloudStatusText');
        const spaceEl = document.getElementById('settingsCloudSpace');
        const deviceEl = document.getElementById('settingsCloudDevice');
        const timeEl = document.getElementById('settingsCloudTime');
        const box = document.getElementById('cloudSettingsStatus');
        if (!textEl) return;

        if (ok) {
            textEl.innerHTML = '<span class="status-dot-inline online"></span> 🟢 已连接 —— 多设备自动同步中';
            if (box) box.classList.add('connected');
        } else if (detail === 'empty') {
            textEl.innerHTML = '<span class="status-dot-inline offline"></span> ⚪ 未连接云端';
            if (box) box.classList.remove('connected');
        } else if (detail === 'connecting') {
            textEl.innerHTML = '<span class="status-dot-inline syncing"></span> 🔵 连接中...';
            if (box) box.classList.remove('connected');
        } else {
            textEl.innerHTML = '<span class="status-dot-inline error"></span> 🔴 连接失败：' + (detail || '未知错误');
            if (box) box.classList.remove('connected');
        }
        if (spaceEl) spaceEl.textContent = getSyncId();
        if (deviceEl) deviceEl.textContent = getDeviceName();
        if (timeEl) timeEl.textContent = state.data.lastSyncAt || '—';
    }
}

function getDeviceName() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS 设备';
    if (/Android/.test(ua)) return 'Android 设备';
    if (/Mac/.test(ua)) return 'Mac · 电脑';
    if (/Windows/.test(ua)) return 'Windows · 电脑';
    return '未知设备';
}

function refreshSettingsStatus() {
    const supUrl = document.getElementById('settingSupabaseUrl').value.trim();
    const supKey = document.getElementById('settingSupabaseKey').value.trim();
    updateSettingsStatus('cloud', !!(supUrl && supKey && state.supabase), (supUrl && supKey && state.supabase) ? '' : 'empty');
}

// ==================== 积分系统 ====================
function wishListBody(available) {
    const groups = {};
    state.data.wishes.forEach(w => {
        const label = formatMonthLabel(w.createdAt);
        groups[label] = groups[label] || [];
        groups[label].push(w);
    });
    return `
        ${Object.keys(groups).length ? Object.keys(groups).sort().reverse().map(label => `
            <div class="wish-group">
                <div class="wish-group-title">${label}</div>
                ${groups[label].map((w) => wishCard(w, available)).join('')}
            </div>
        `).join('') : '<div class="empty-state"><span class="emoji">🎁</span>还没有心愿，添加一个吧</div>'}
        <div class="input-row" style="margin-top:16px">
            <input type="text" class="input" id="wishName" placeholder="心愿名称，如：买一条裙子">
            <input type="number" class="input" id="wishPoints" placeholder="积分" style="flex:0 0 90px">
            <button class="btn btn-primary" data-action="add-wish">添加</button>
        </div>
        <div style="margin-top:10px">
            <input type="file" accept="image/*" id="wishImageInput" style="display:none">
        </div>
    `;
}

function wishBinBody() {
    return state.data.wishBin.map(w => `
        <div class="wish-card">
            <div style="display:flex;align-items:center;gap:12px;flex:1">
                <div class="wish-image">${w.image ? `<img src="${w.image}" alt="">` : '<span style="font-size:24px">🎁</span>'}</div>
                <div>
                    <div class="wish-title">${escapeHtml(w.name)}</div>
                    <div style="font-size:13px;color:var(--text-secondary)">所需积分 ${w.points}</div>
                </div>
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-secondary" data-action="restore-wish" data-id="${w.id}">恢复</button>
                <button class="btn btn-secondary" data-action="purge-wish" data-id="${w.id}">彻底删除</button>
            </div>
        </div>
    `).join('');
}

function wishCard(w, available) {
    const pct = w.points > 0 ? Math.min(100, Math.round(available / w.points * 100)) : 100;
    const reached = available >= w.points && !w.exchanged;
    return `
        <div class="wish-card ${w.exchanged ? 'exchanged' : ''}">
            <div style="display:flex;align-items:center;gap:14px;flex:1">
                <div class="wish-image">
                    <label style="cursor:pointer;width:100%;height:100%;display:flex;align-items:center;justify-content:center">
                        ${w.image ? `<img src="${w.image}" alt="">` : '<span style="font-size:24px">🎁</span>'}
                        <input type="file" accept="image/*" style="display:none" data-action="upload-wish-image" data-id="${w.id}">
                    </label>
                </div>
                <div style="flex:1">
                    <div class="wish-title">${escapeHtml(w.name)}</div>
                    <div style="font-size:13px;color:var(--text-secondary)">所需积分 <strong style="color:var(--accent)">${w.points}</strong></div>
                    <div class="wish-progress"><div class="wish-progress-fill ${reached ? 'reached' : ''}" style="width:${pct}%"></div></div>
                    <div style="font-size:11px;color:var(--text-secondary);margin-top:3px">${w.exchanged ? '已兑换 🎉' : (pct >= 100 ? '积分已攒够，可以去兑换啦！' : `进度 ${pct}% · 还差 ${w.points - available} 分`)}</div>
                </div>
            </div>
            <div style="text-align:right">
                <div style="font-size:13px;margin-bottom:6px;color:${available >= w.points ? 'var(--primary)' : 'var(--danger)'};font-weight:700">
                    ${w.exchanged ? '已兑换' : (available >= w.points ? '积分已足' : '积分不足')}
                </div>
                <div style="display:flex;gap:8px">
                    <button class="btn ${w.exchanged ? 'btn-secondary' : (available >= w.points ? 'btn-primary' : 'btn-secondary')}" 
                        ${w.exchanged || available < w.points ? 'disabled' : ''} 
                        data-action="exchange-wish" data-id="${w.id}">${w.exchanged ? '已兑换' : '兑换'}</button>
                    <button class="task-delete" data-action="delete-wish" data-id="${w.id}">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

// ==================== 事件绑定 ====================
function initEvents() {
    // 绑定到 document，使侧边栏导航（#sidebarNav，位于 #content 之外）也能触发
    document.addEventListener('click', async e => {
        // 点击「新增打卡项」板块下拉之外时，收起菜单（仅 DOM 操作，不触发整页重渲染）
        const menuEl = document.getElementById('checkInModuleMenu');
        if (menuEl && menuEl.style.display === 'block' && !e.target.closest('.checkin-module-select')) {
            menuEl.style.display = 'none';
        }
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;

        if (action === 'sync-retry') {
            if (!state.supabase) { toast('尚未连接云端，请先在设置中配置同步'); return; }
            updateSyncStatus('syncing');
            syncFromCloud().finally(() => toast('已尝试重新同步'));
            return;
        }

        if (action === 'tab') {
            if (el.dataset.module) {
                if (el.dataset.tab) {
                    state.currentSubTab[el.dataset.module] = el.dataset.tab;
                    if (state.currentModule !== el.dataset.module) {
                        state.currentModule = el.dataset.module;
                    }
                    if (el.dataset.subtab) {
                        state.currentSubTab[el.dataset.module + '_' + el.dataset.tab] = el.dataset.subtab;
                    }
                } else {
                    state.currentModule = el.dataset.module;
                }
                render();
                closeSidebar();
            }
            return;
        }

        // 新增打卡项：自定义板块下拉（替代原生 select，兼容手机 WebView）
        if (action === 'checkin-module-toggle') {
            const menu = document.getElementById('checkInModuleMenu');
            if (menu) menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
            return;
        }
        if (action === 'checkin-module-pick') {
            const mod = el.dataset.mod;
            state._checkInModule = mod;
            state._newCategory = mod === '__new__';
            render();
            return;
        }

        if (action === 'open-link') {
            const url = el.dataset.link;
            if (url && url !== '#') window.open(url, '_blank', 'noopener');
            return;
        }

        // 变美情报局
        if (action === 'beauty-weather-refresh') {
            delete state.data.apiCache['beautyWeather'];
            loadBeautyWeather();
            return;
        }
        if (action === 'beauty-trend-refresh') {
            delete state.data.apiCache['beautyTrend'];
            loadBeautyTrend();
            return;
        }
        if (action === 'beauty-insp-add') {
            openBeautyInspModal(null);
            return;
        }
        if (action === 'beauty-insp-edit') {
            const item = (state.data.beautyInspirations || []).find(x => String(x.id) === String(el.dataset.id));
            if (item) openBeautyInspModal(item);
            return;
        }
        if (action === 'beauty-insp-delete') {
            deleteBeautyInsp(el.dataset.id);
            return;
        }
        if (action === 'beauty-insp-search') {
            filterBeautyInspirations();
            return;
        }
        if (action === 'beauty-insp-parse') {
            const url = document.getElementById('beautyInspUrl').value.trim();
            if (!url) { toast('请先输入链接'); return; }
            toast('正在解析链接...');
            const parsed = await parseBeautyUrl(url);
            if (parsed) {
                if (!document.getElementById('beautyInspTitle').value.trim()) document.getElementById('beautyInspTitle').value = parsed.title;
                if (!document.getElementById('beautyInspCover').value.trim()) {
                    document.getElementById('beautyInspCover').value = parsed.cover_url;
                    updateBeautyCoverPreview(parsed.cover_url, true);
                } else {
                    updateBeautyCoverPreview(document.getElementById('beautyInspCover').value.trim(), true);
                }
                const source = detectSource(url);
                const coverUrl = document.getElementById('beautyInspCover').value.trim();
                if (coverUrl && isLogoUrl(coverUrl, source.name)) {
                    toast('⚠️ 抓取到的是平台 Logo，请手动替换为笔记封面图链接');
                } else {
                    toast('解析完成，请检查并补充标签');
                }
            } else {
                updateBeautyCoverPreview('', true);
                toast('自动解析失败，请手动填写标题和封面图 URL');
            }
            return;
        }
        if (action === 'beauty-insp-clear-cover') {
            document.getElementById('beautyInspCover').value = '';
            document.getElementById('beautyInspFile').value = '';
            state._beautyInspCoverBase64 = '';
            document.getElementById('beautyInspSkipCover').checked = true;
            updateBeautyCoverPreview('', false);
            toast('已清空封面，将保存为无封面卡片');
            return;
        }
        if (action === 'beauty-insp-pick-file') {
            document.getElementById('beautyInspFile').click();
            return;
        }
        if (action === 'beauty-insp-use-url') {
            const wrap = document.getElementById('beautyCoverUrlWrap');
            const isHidden = wrap.style.display === 'none';
            wrap.style.display = isHidden ? 'block' : 'none';
            el.textContent = isHidden ? '隐藏图片链接' : '或粘贴图片链接';
            return;
        }
        if (action === 'beauty-insp-save') {
            saveBeautyInsp();
            return;
        }
        if (action === 'beauty-insp-cancel') {
            closeBeautyInspModal();
            return;
        }
        if (action === 'beauty-setup-copy-sql') {
            const sqlEl = document.getElementById('beautySetupSql');
            if (sqlEl) {
                navigator.clipboard.writeText(sqlEl.textContent).then(
                    () => toast('建表 SQL 已复制，请粘贴到 Supabase SQL Editor 执行'),
                    () => toast('复制失败，请手动长按选择复制')
                );
            }
            return;
        }
        if (action === 'open-settings') {
            openSettings();
            return;
        }

        // ===== 模块管理（设置内）=====
        if (action === 'module-up' || action === 'module-down') {
            syncModuleInputs();
            const i = +el.dataset.i;
            const all = getAllModules();
            const j = action === 'module-up' ? i - 1 : i + 1;
            if (j >= 0 && j < all.length) {
                const tmp = all[i]; all[i] = all[j]; all[j] = tmp;
                state.data.modulesUpdatedAt = now();
                buildModuleManager();
                renderSidebar();
                saveState();
                if (state.supabase) syncToCloud();
            }
            return;
        }
        if (action === 'module-toggle') {
            syncModuleInputs();
            const i = +el.dataset.i;
            const all = getAllModules();
            all[i].hidden = !all[i].hidden;
            // 至少保留一个可见板块，避免侧边栏全空
            if (!all.some(m => !m.hidden)) all[i].hidden = false;
            state.data.modulesUpdatedAt = now();
            buildModuleManager();
            renderSidebar();
            saveState();
            if (state.supabase) syncToCloud();
            return;
        }
        if (action === 'reset-modules') {
            state.data.modules = getDefaultModules();
            state.data.modulesUpdatedAt = now();
            buildModuleManager();
            renderSidebar();
            saveState();
            if (state.supabase) syncToCloud();
            toast('已恢复默认板块');
            return;
        }

        // ===== 云端空间清理 =====
        if (action === 'clean-cache') {
            state.data.apiCache = {};
            state.data.hotCache = {};
            saveState();
            updateStorageMeter();
            toast('已清理可重建缓存（天气 / 热榜）');
            return;
        }
        if (action === 'prune-old') {
            const n = pruneOldData();
            saveState();
            updateStorageMeter();
            toast(n > 0 ? `已清理 ${n} 条 1 年前的旧数据` : '没有可清理的旧数据');
            return;
        }

        if (action === 'refresh-quote') {
            // 换一句：推进 seed 并重新挑选今日金句
            renderDailyQuote(0);
            toast('已切换今日金句');
            return;
        }

        if (action === 'toggle-accordion') {
            const key = el.dataset.key;
            state.accordion = state.accordion || {};
            state.accordion[key] = !state.accordion[key];
            const sec = document.getElementById('acc-' + key);
            if (sec) {
                sec.classList.toggle('collapsed', state.accordion[key]);
                const chev = sec.querySelector('.accordion-chevron');
                if (chev) chev.textContent = state.accordion[key] ? '▸' : '▾';
            }
            return;
        }





        if (action === 'add-water') {
            addWater(parseInt(el.dataset.amount));
            return;
        }

        if (action === 'custom-water') {
            uiPrompt('输入喝水量（ml）：', '400').then(amount => {
                if (amount) addWater(parseInt(amount) || 0);
            });
            return;
        }

        if (action === 'delete-water') {
            deleteWater(el.dataset.id);
            return;
        }

        if (action === 'water-mode') {
            const newMode = el.dataset.mode;
            state._waterMode = state._waterMode === newMode ? null : newMode;
            state._waterSelected = new Set();
            render();
            return;
        }

        if (action === 'water-select') {
            const id = el.dataset.id;
            const sel = state._waterSelected || new Set();
            if (sel.has(id)) sel.delete(id); else sel.add(id);
            state._waterSelected = sel;
            render();
            return;
        }

        if (action === 'water-select-all') {
            const todayLogs = state.data.waterLogs.filter(x => x.date === today());
            state._waterSelected = new Set(todayLogs.map(x => String(x.id)));
            render();
            return;
        }

        if (action === 'water-batch-delete') {
            const sel = state._waterSelected || new Set();
            if (!sel.size) { toast('请先选择要删除的喝水记录'); return; }
            const count = sel.size;
            const removed = state.data.waterLogs.filter(x => sel.has(String(x.id)));
            uiConfirm(`确定要删除选中的 ${count} 条喝水记录吗？\n删除后可在下方提示中撤销。`, { isDanger: true }).then(ok => {
                if (!ok) return;
                state.data.waterLogs = state.data.waterLogs.filter(x => !sel.has(String(x.id)));
                state._waterMode = null;
                state._waterSelected = new Set();
                syncWaterCheckIn();
                saveState(); render();
                toastUndo(`已删除 ${count} 条喝水记录`, () => {
                    state.data.waterLogs = [...state.data.waterLogs, ...removed];
                    syncWaterCheckIn();
                    saveState(); render();
                });
            });
            return;
        }

        if (action === 'edit-water-goal') {
            uiPrompt('设置每日喝水目标（ml）：', String(state.data.waterGoal)).then(v => {
                if (v && !isNaN(parseInt(v))) {
                    state.data.waterGoal = Math.max(100, parseInt(v));
                    syncWaterCheckIn();
                    saveState();
                    render();
                    toast('喝水目标已更新');
                }
            });
            return;
        }



        if (action === 'checkin-toggle') {
            toggleCheckIn(el.dataset.id);
            return;
        }

        if (action === 'checkin-tier') {
            doCheckIn(el.dataset.id);
            return;
        }

        if (action === 'checkin-date') {
            doCheckIn(el.dataset.id, el.dataset.date);
            return;
        }

        if (action === 'schedule-date') {
            const delta = parseInt(el.dataset.delta) || 0;
            const input = document.getElementById('scheduleDate');
            const current = input ? input.value : (state._scheduleDate || today());
            const [cy, cm, cday] = current.split('-').map(Number);
            const d = new Date(cy, cm - 1, cday);
            d.setDate(d.getDate() + delta);
            state._scheduleDate = dateStr(d);
            render();
            return;
        }

        if (action === 'makeup-checkin') {
            makeupCheckIn();
            return;
        }

        if (action === 'add-checkin') {
            const module = state._checkInModule || (getCategoryOrder()[0] || 'basic');
            const newCat = document.getElementById('checkInNewCategory')?.value.trim();
            const name = document.getElementById('checkInName')?.value.trim();
            if (name) {
                const catKey = addCheckIn(module, name, state._newStars || 3, newCat);
                state._checkInModule = catKey || module || 'basic';
                state._newStars = 3;
                state._newCategory = false;
            }
            return;
        }

        if (action === 'save-category-name') {
            const input = document.querySelector(`.category-name-input[data-mod="${el.dataset.mod}"]`);
            renameCategory(el.dataset.mod, input ? input.value : '');
            return;
        }

        if (action === 'delete-category') {
            deleteCategory(el.dataset.mod);
            return;
        }

        if (action === 'new-stars') {
            const s = parseInt(el.dataset.stars);
            if (s >= 1 && s <= 5) {
                state._newStars = s;
                render();
            }
            return;
        }

        if (action === 'set-stars') {
            const id = el.dataset.id;
            const s = parseInt(el.dataset.stars);
            const ci = state.data.checkIns.find(x => x.id === id);
            if (ci && s >= 1 && s <= 5) {
                ci.stars = s;
                ci.customPoints = null; // 重新定级后按花朵分计算，放弃之前的自定义积分
                ci.points = flowerScore(s); // 分数随定级同步
                saveState();
                render();
            }
            return;
        }

        if (action === 'delete-checkin') {
            deleteCheckIn(el.dataset.id);
            return;
        }

        if (action === 'restore-checkin') {
            restoreCheckIn(el.dataset.id);
            return;
        }

        if (action === 'purge-checkin') {
            purgeCheckIn(el.dataset.id);
            return;
        }

        if (action === 'edit-checkin') {
            e.preventDefault();
            e.stopPropagation();
            editCheckIn(el.dataset.id);
            return;
        }

        if (action === 'save-edit-checkin') {
            e.preventDefault();
            saveEditCheckIn();
            return;
        }

        if (action === 'close-edit-checkin') {
            e.preventDefault();
            closeEditCheckIn();
            return;
        }

        if (action === 'checkin-sort') {
            const id = el.dataset.id;
            const dir = parseInt(el.dataset.dir);
            const date = state._scheduleDate || today();
            const plan = getDailyPlan(date);
            const ids = plan.items.map(x => x.id);
            const idx = ids.indexOf(id);
            if (idx >= 0) {
                const newIdx = Math.max(0, Math.min(ids.length - 1, idx + dir));
                if (newIdx !== idx) {
                    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
                    setDailyPlanOrder(date, ids);
                    saveState();
                    render();
                }
            }
            return;
        }

        if (action === 'checkin-catsort') {
            const id = el.dataset.id;
            const mod = el.dataset.mod;
            const dir = parseInt(el.dataset.dir);
            const items = state.data.checkIns.filter(c => c.module === mod).sort((a, b) => a.order - b.order);
            const idx = items.findIndex(c => c.id === id);
            if (idx >= 0) {
                const newIdx = Math.max(0, Math.min(items.length - 1, idx + dir));
                if (newIdx !== idx) {
                    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
                    items.forEach((c, i) => c.order = i);
                    saveState();
                    render();
                }
            }
            return;
        }

        if (action === 'checkin-mode') {
            const newMode = el.dataset.mode;
            state._checkinMode = state._checkinMode === newMode ? null : newMode;
            state._checkinSelected = new Set();
            render();
            return;
        }

        if (action === 'category-fold') {
            const mod = el.dataset.mod;
            if (state._collapsedCategories.has(mod)) state._collapsedCategories.delete(mod);
            else state._collapsedCategories.add(mod);
            render();
            return;
        }

        if (action === 'other-fold') {
            const stars = String(el.dataset.stars);
            if (state._collapsedOther.has(stars)) state._collapsedOther.delete(stars);
            else state._collapsedOther.add(stars);
            render();
            return;
        }

        if (action === 'checkin-select') {
            const id = el.dataset.id;
            const sel = state._checkinSelected || new Set();
            if (sel.has(id)) sel.delete(id); else sel.add(id);
            state._checkinSelected = sel;
            render();
            return;
        }

        if (action === 'checkin-select-all') {
            const sel = new Set();
            const sub = validSubTab('checkin', CHECKIN_TABS, 'schedule');
            if (sub === 'category') {
                state.data.checkIns.forEach(i => sel.add(String(i.id)));
            } else {
                const date = state._scheduleDate || today();
                const plan = getDailyPlan(date);
                plan.items.forEach(i => sel.add(String(i.id)));
            }
            state._checkinSelected = sel;
            render();
            return;
        }

        if (action === 'checkin-batch-delete') {
            const sel = state._checkinSelected || new Set();
            if (!sel.size) { toast('请先选择要删除的打卡项'); return; }
            const ids = [...sel];
            const removed = state.data.checkIns.filter(x => ids.includes(x.id));
            state.data.checkIns = state.data.checkIns.filter(x => !ids.includes(x.id));
            removed.forEach(ci => state.data.checkInBin.unshift(ci));
            state._checkinMode = null;
            state._checkinSelected = new Set();
            recalcCourage();
            saveState(); render();
            toast(`已删除 ${ids.length} 个打卡项（可在「更多」回收站恢复）`);
            return;
        }

        if (action === 'manage-select-all') {
            document.querySelectorAll('.manage-check').forEach(c => c.checked = el.checked);
            return;
        }

        if (action === 'manage-batch-delete') {
            const ids = [...document.querySelectorAll('.manage-check:checked')].map(c => c.value);
            if (!ids.length) { toast('请先勾选要删除的打卡项'); return; }
            const removed = state.data.checkIns.filter(x => ids.includes(x.id));
            state.data.checkIns = state.data.checkIns.filter(x => !ids.includes(x.id));
            removed.forEach(ci => state.data.checkInBin.unshift(ci));
            recalcCourage();
            saveState(); render();
            toast(`已删除 ${ids.length} 个打卡项（可在「更多」回收站恢复）`);
            return;
        }

        if (action === 'manage-batch-points') {
            const ids = [...document.querySelectorAll('.manage-check:checked')].map(c => c.value);
            if (!ids.length) { toast('请先勾选打卡项'); return; }
            const v = parseInt(document.getElementById('managePoints')?.value);
            if (isNaN(v) || v < 0) { toast('请输入有效的积分数'); return; }
            state.data.checkIns.forEach(c => { if (ids.includes(c.id)) { c.customPoints = v; c.points = v; } });
            saveState(); render();
            toast(`已将 ${ids.length} 个打卡项积分设为 ${v}`);
            return;
        }

        if (action === 'add-wish') {
            const name = document.getElementById('wishName')?.value.trim();
            const points = document.getElementById('wishPoints')?.value;
            if (name) addWish(name, points || 100);
            return;
        }

        if (action === 'exchange-wish') {
            exchangeWish(el.dataset.id);
            return;
        }

        if (action === 'delete-wish') {
            deleteWish(el.dataset.id);
            return;
        }

        if (action === 'restore-wish') {
            restoreWish(el.dataset.id);
            return;
        }

        if (action === 'purge-wish') {
            purgeWish(el.dataset.id);
            return;
        }

        if (action === 'open-book-review') {
            openBookReview(parseInt(el.dataset.idx));
            return;
        }

        if (action === 'close-book-review') {
            closeBookReview();
            return;
        }

        if (action === 'hot-platform') {
            state.currentSubTab[`hot_${el.dataset.group}`] = el.dataset.type;
            render();
            return;
        }

        if (action === 'hot-refresh') {
            const group = el.dataset.group;
            const types = group === 'beauty' ? ['xiaohongshu', 'douyin'] : (HOT_GROUPS[group] || HOT_GROUPS['mixed']);
            types.forEach(t => state.data.hotCache[t] = null);
            loadHotData();
            toast('已刷新');
            return;
        }

        if (action === 'praise-send') {
            const input = document.getElementById('praiseInput');
            const sel = document.getElementById('praiseGroupSelect');
            const gid = sel ? sel.value : '';
            if (input) { addPraise(input.value, gid); input.value = ''; state._praiseGroupSel = gid; }
            return;
        }

        if (action === 'praise-section') {
            state._praiseSection = el.dataset.section;
            render();
            return;
        }

        if (action === 'praise-tab') {
            state._praiseTab = el.dataset.tab;
            render();
            return;
        }

        if (action === 'praise-date') {
            state._praiseSection = 'praises';
            state._praiseTab = 'calendar';
            state._praiseDate = el.dataset.date;
            render();
            return;
        }

        if (action === 'praise-delete') {
            deletePraise(el.dataset.id);
            return;
        }

        // 夸夸分组管理事件
        if (action === 'praise-group-new') {
            state._praiseGroupAdding = true;
            render();
            setTimeout(() => { const i = document.getElementById('praiseGroupNewInput'); if (i) i.focus(); }, 50);
            return;
        }
        if (action === 'praise-group-new-cancel') {
            state._praiseGroupAdding = false;
            render();
            return;
        }
        if (action === 'praise-group-new-confirm') {
            const inp = document.getElementById('praiseGroupNewInput');
            addPraiseGroup(inp ? inp.value : '');
            return;
        }
        if (action === 'praise-group-view') {
            state._praiseGroupView = el.dataset.id;
            render();
            return;
        }
        if (action === 'praise-group-back') {
            state._praiseGroupView = null;
            render();
            return;
        }
        if (action === 'praise-group-rename') {
            state._praiseGroupRenaming = el.dataset.id;
            render();
            setTimeout(() => { const i = document.getElementById('praiseGroupRenameInput'); if (i) i.select(); }, 50);
            return;
        }
        if (action === 'praise-group-rename-cancel') {
            state._praiseGroupRenaming = null;
            render();
            return;
        }
        if (action === 'praise-group-rename-confirm') {
            const inp = document.getElementById('praiseGroupRenameInput');
            renamePraiseGroup(el.dataset.id, inp ? inp.value : '');
            return;
        }
        if (action === 'praise-group-delete') {
            deletePraiseGroup(el.dataset.id);
            return;
        }
        if (action === 'praise-filter-group') {
            state._praiseFilterGroup = el.dataset.group;
            render();
            return;
        }

        // 金句库管理事件
        if (action === 'quote-add') {
            const text = document.getElementById('quoteTextInput')?.value.trim();
            const from = document.getElementById('quoteFromInput')?.value.trim() || '';
            const gid = document.getElementById('quoteGroupSelect')?.value || '';
            if (text) {
                addQuote(text, from, gid);
                const ti = document.getElementById('quoteTextInput');
                const fi = document.getElementById('quoteFromInput');
                if (ti) ti.value = '';
                if (fi) fi.value = '';
            } else {
                toast('请输入金句内容');
            }
            return;
        }
        if (action === 'quote-edit') {
            const q = state.data.userQuotes.find(x => x.id === el.dataset.id);
            if (!q) return;
            uiPrompt('编辑金句：', q.text).then(newText => {
                if (newText === null) return;
                    uiPrompt('出处（可选）：', q.from || '').then(newFrom => {
                    if (newFrom === null) return;
                    const groups = state.data.quoteGroups || [];
                    const curName = (groups.find(g => g.id === q.groupId) || {}).name || '';
                    uiPrompt('所属分组（直接输入分组名；留空表示「未分组」；输入新名字会自动创建）', curName).then(newGroup => {
                        if (newGroup === null) return;
                        let gid = '';
                        const nm = (newGroup || '').trim();
                        if (nm) {
                            const hit = groups.find(g => g.name === nm);
                            if (hit) gid = hit.id;
                            else { addQuoteGroup(nm); gid = (state.data.quoteGroups[state.data.quoteGroups.length - 1] || {}).id || ''; }
                        }
                        updateQuote(q.id, newText, newFrom || '', gid);
                    });
                });
            });
            return;
        }
        if (action === 'quote-filter-group') {
            state._quoteFilterGroup = el.dataset.group;
            render();
            return;
        }
        if (action === 'quote-manage-toggle') {
            state._quoteManageOpen = !state._quoteManageOpen;
            render();
            return;
        }
        if (action === 'quote-group-new') {
            state._quoteGroupAdding = true;
            render();
            return;
        }
        if (action === 'quote-group-new-confirm') {
            const v = document.getElementById('quoteGroupNewInput')?.value || '';
            addQuoteGroup(v);
            return;
        }
        if (action === 'quote-group-new-cancel') {
            state._quoteGroupAdding = false;
            render();
            return;
        }
        if (action === 'quote-group-rename') {
            state._quoteGroupRenaming = el.dataset.id;
            render();
            return;
        }
        if (action === 'quote-group-rename-confirm') {
            const v = document.getElementById('quoteGroupRenameInput')?.value || '';
            renameQuoteGroup(el.dataset.id, v);
            return;
        }
        if (action === 'quote-group-rename-cancel') {
            state._quoteGroupRenaming = null;
            render();
            return;
        }
        if (action === 'quote-group-delete') {
            uiConfirm('删除该金句分组？组内金句会移到「未分组」。', { isDanger: true }).then(ok => {
                if (ok) deleteQuoteGroup(el.dataset.id);
            });
            return;
        }
        if (action === 'quote-delete') {
            deleteQuote(el.dataset.id);
            return;
        }
        if (action === 'quote-up') {
            moveQuote(el.dataset.id, -1);
            return;
        }
        if (action === 'quote-down') {
            moveQuote(el.dataset.id, 1);
            return;
        }
        if (action === 'quote-refresh-today') {
            state.data.dailyQuote = null;
            renderDailyQuote(0);
            saveState();
            render();
            toast('今日金句已切换');
            return;
        }
        if (action === 'quote-reset-defaults') {
            uiConfirm('确定要导入默认内置金句库吗？这会覆盖你当前的自定义金句库。', { isDanger: true }).then(ok => {
                if (ok) importDefaultQuotes();
            });
            return;
        }

        if (action === 'test-supabase') {
            testSupabaseConnection();
            return;
        }
        if (action === 'copy-sql') {
            const sql = document.getElementById('setupSql');
            if (sql) {
                navigator.clipboard.writeText(sql.textContent).then(
                    () => toast('已复制建表 SQL，去 Supabase 后台执行即可'),
                    () => toast('复制失败，请手动长按选择复制')
                );
            }
            return;
        }

        if (action === 'export-data') {
            exportData();
            return;
        }

        if (action === 'import-data') {
            const f = document.getElementById('importFile');
            if (f) f.click();
            return;
        }

        if (action === 'clear-all-data') {
            clearAllData();
            return;
        }

    });

    // 批量管理：点击行切换复选框
    document.getElementById('content').addEventListener('click', e => {
        const row = e.target.closest('.manage-row');
        if (!row || e.target.tagName === 'INPUT') return;
        const cb = row.querySelector('.manage-check');
        if (cb) cb.checked = !cb.checked;
    });

    // 输入事件委托
    document.getElementById('content').addEventListener('input', e => {
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;
        if (action === 'reading-note' || action === 'memo') {
            updateMemo(el.value);
            if (el.value.trim()) awardContentBonus();
        }
    });

    document.getElementById('content').addEventListener('change', e => {
        if (e.target.id === 'manageSelectAll') {
            const checked = e.target.checked;
            document.querySelectorAll('.manage-check').forEach(c => c.checked = checked);
            return;
        }
        const el = e.target.closest('[data-action]');
        if (!el) return;
        if (el.dataset.action === 'upload-wish-image') {
            const id = el.dataset.id;
            const file = el.files[0];
            if (!file) return;
            compressImageFile(file, compressed => updateWishImage(id, compressed));
        }
    });

    // 日报日期选择器直接切换
    document.getElementById('content').addEventListener('change', e => {
        if (e.target.id === 'scheduleDate') {
            state._scheduleDate = e.target.value;
            render();
        }
    });

    // 回车快捷提交
    document.getElementById('content').addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const el = e.target;
        if (el.id === 'praiseInput') { e.preventDefault(); document.querySelector('[data-action="praise-send"]')?.click(); }
        else if (el.id === 'wishName' || el.id === 'wishPoints') { e.preventDefault(); document.querySelector('[data-action="add-wish"]')?.click(); }
        else if (el.id === 'checkInName') { e.preventDefault(); document.querySelector('[data-action="add-checkin"]')?.click(); }
    });
}

// ==================== 侧边栏与设置 ====================
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('show');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}

// 把模块管理面板里输入框的当前值同步回 state.data.modules
function syncModuleInputs() {
    const all = getAllModules();
    document.querySelectorAll('#moduleManager .module-row').forEach(row => {
        const i = +row.dataset.idx;
        if (!all[i]) return;
        const icon = row.querySelector('[data-field="icon"]');
        const name = row.querySelector('[data-field="name"]');
        if (icon) all[i].icon = icon.value.trim() || all[i].icon;
        if (name) all[i].name = name.value.trim() || all[i].name;
    });
}

function buildModuleManager() {
    const wrap = document.getElementById('moduleManager');
    if (!wrap) return;
    const all = getAllModules();
    wrap.innerHTML = all.map((m, i) => `
        <div class="module-row" data-idx="${i}">
            <div class="module-row-ctrl">
                <button class="mod-btn" data-action="module-up" data-i="${i}" ${i === 0 ? 'disabled' : ''} title="上移">▲</button>
                <button class="mod-btn" data-action="module-down" data-i="${i}" ${i === all.length - 1 ? 'disabled' : ''} title="下移">▼</button>
            </div>
            <input class="mod-icon input-mini" data-field="icon" data-i="${i}" value="${escapeHtml(m.icon || '')}" maxlength="4" title="图标 emoji">
            <input class="mod-name input flex1" data-field="name" data-i="${i}" value="${escapeHtml(m.name)}" placeholder="板块名称">
            <button class="mod-toggle ${m.hidden ? 'off' : 'on'}" data-action="module-toggle" data-i="${i}">${m.hidden ? '🙈 已隐藏' : '👁 显示中'}</button>
        </div>
    `).join('');
}

function updateStorageMeter() {
    const el = document.getElementById('storageMeter');
    if (!el) return;
    const bytes = estimateCloudSize();
    const mb = bytes / (1024 * 1024);
    const total = 500 * 1024 * 1024;
    const pct = (bytes / total * 100).toFixed(4);
    const beauties = (state.data.beautyInspirations || []).length;
    const sizeText = mb < 0.01 ? (bytes / 1024).toFixed(1) + ' KB' : mb.toFixed(2) + ' MB';
    el.innerHTML = `主数据表（growtree_data）：约 <b>${sizeText}</b> · 占免费 500MB 的 ${pct}%<br>灵感军火库（独立表）：<b>${beauties}</b> 条（仅存链接，不上传图片）`;
}

function openSettings() {
    document.getElementById('settingName').value = state.settings.name;
    document.getElementById('settingCity').value = state.settings.city;
    document.getElementById('settingExchangeRule').value = state.settings.exchangeRule || '';
    document.getElementById('settingSupabaseUrl').value = state.settings.supabaseUrl;
    document.getElementById('settingSupabaseKey').value = state.settings.supabaseKey;
    document.getElementById('settingSyncSpaceId').value = state.settings.syncSpaceId;
    buildModuleManager();
    updateStorageMeter();
    refreshSettingsStatus();
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

async function saveSettings() {
    const modulesBefore = JSON.stringify(state.data.modules || []);
    syncModuleInputs();
    if (JSON.stringify(state.data.modules || []) !== modulesBefore) {
        state.data.modulesUpdatedAt = now();
    }
    state.settings.name = document.getElementById('settingName').value.trim();
    state.settings.city = document.getElementById('settingCity').value.trim();
    state.settings.exchangeRule = document.getElementById('settingExchangeRule').value.trim();
    state.settings.supabaseUrl = normalizeSupabaseUrl(document.getElementById('settingSupabaseUrl').value.trim());
    state.settings.supabaseKey = document.getElementById('settingSupabaseKey').value.trim();
    state.settings.syncSpaceId = document.getElementById('settingSyncSpaceId').value.trim();
    saveState();
    // 仅在修改了 Supabase 配置时重建连接，且「不主动下拉」，避免覆盖刚保存的板块配置等本地修改；
    // 随后立即把最新本地数据（含模块管理）推送到云端。
    if (state.settings.supabaseUrl && state.settings.supabaseKey) {
        await initSupabase(false);
        if (state.supabase) syncToCloud();
    }
    closeSettings();
    render();
    toast('设置已保存');
}

// ==================== 新手引导 ====================
function buildOnboardHabits() {
    const wrap = document.getElementById('onboardHabits');
    if (!wrap) return;
    const items = [];
    for (const mod of getCategoryOrder()) {
        DEFAULT_CHECKINS[mod].forEach(it => items.push({ mod, name: it.name }));
    }
    wrap.innerHTML = items.map(it => `
        <label class="habit-chip">
            <input type="checkbox" class="onboard-habit" data-module="${it.mod}" data-name="${it.name}" checked>
            <span>${escapeHtml(it.name)}</span>
        </label>
    `).join('');
}

function showOnboarding() {
    buildOnboardHabits();
    const modal = document.getElementById('onboardModal');
    if (modal) modal.classList.add('show');
}

function finishOnboarding() {
    const name = (document.getElementById('onboardName').value || '').trim() || '顾一';
    state.settings.name = name;

    // 保留用户勾选的默认习惯；自定义打卡项（不在默认名单里的）一律保留，绝不误删
    const defaultNames = new Set();
    for (const mod of getCategoryOrder()) DEFAULT_CHECKINS[mod].forEach(it => defaultNames.add(it.name));
    const checked = [...document.querySelectorAll('.onboard-habit:checked')].map(c => c.dataset.name);
    state.data.checkIns = state.data.checkIns.filter(c => !defaultNames.has(c.name) || checked.includes(c.name));

    // 若全部取消，给 3 个起步习惯，避免空页面
    if (!state.data.checkIns.length) {
        const cats = getCategories();
        const starters = [
            { mod: 'basic', it: DEFAULT_CHECKINS.basic[0] },
            { mod: 'daily', it: DEFAULT_CHECKINS.daily[0] },
            { mod: 'other', it: DEFAULT_CHECKINS.other[0] }
        ];
        starters.forEach((s, i) => state.data.checkIns.push({
            id: uuid(),
            module: s.mod,
            category: cats[s.mod] || '其他',
            name: s.it.name,
            points: s.it.points || 10,
            order: i,
            createdAt: now()
        }));
    }
    getCategoryOrder().forEach(mod => {
        state.data.checkIns.filter(c => c.module === mod).forEach((c, i) => c.order = i);
    });


    state.data.onboarded = true;
    saveState();
    const modal = document.getElementById('onboardModal');
    if (modal) modal.classList.remove('show');
    render();
    toast('🌱 小树已经准备好啦，去打卡吧！');
}

// ==================== 初始化 ====================
function applyTheme() {
    const theme = (state.data.settings && state.data.settings.theme) || 'light';
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    if (!state.data.settings) state.data.settings = {};
    const cur = state.data.settings.theme || 'light';
    state.data.settings.theme = cur === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
    toast(state.data.settings.theme === 'dark' ? '已切换到夜间模式 🌙' : '已切换到日间模式 ☀️');
}

function init() {
    loadState();
    initGame();
    initSupabase();
    initEvents();

    setInterval(() => {
        const clock = document.getElementById('clock');
        if (clock) clock.textContent = new Date().toLocaleTimeString('zh-CN');
    }, 1000);

    document.getElementById('menuBtn').addEventListener('click', openSidebar);
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);

    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    applyTheme();
    document.getElementById('settingsClose').addEventListener('click', closeSettings);
    document.getElementById('settingsCancel').addEventListener('click', closeSettings);
    document.getElementById('settingsSave').addEventListener('click', saveSettings);

    const editModal = document.getElementById('editCheckInModal');
    if (editModal) {
        editModal.addEventListener('click', e => {
            if (e.target === editModal) closeEditCheckIn();
        });
    }

    const beautyModal = document.getElementById('beautyInspModal');
    if (beautyModal) {
        beautyModal.addEventListener('click', e => {
            if (e.target === beautyModal) closeBeautyInspModal();
        });
        const beautyUrl = document.getElementById('beautyInspUrl');
        if (beautyUrl) {
            beautyUrl.addEventListener('blur', async () => {
                const url = beautyUrl.value.trim();
                if (!url) return;
                const titleEl = document.getElementById('beautyInspTitle');
                const coverEl = document.getElementById('beautyInspCover');
                if (titleEl.value.trim() && coverEl.value.trim()) return;
                const parsed = await parseBeautyUrl(url);
                if (parsed) {
                    if (!titleEl.value.trim()) titleEl.value = parsed.title;
                    if (!coverEl.value.trim()) {
                        coverEl.value = parsed.cover_url;
                        updateBeautyCoverPreview(parsed.cover_url, true);
                    }
                }
            });
        }
        const beautyCover = document.getElementById('beautyInspCover');
        if (beautyCover) {
            beautyCover.addEventListener('input', () => {
                state._beautyInspCoverBase64 = '';
                updateBeautyCoverPreview(beautyCover.value.trim(), true);
            });
        }
        const beautyFile = document.getElementById('beautyInspFile');
        if (beautyFile) {
            beautyFile.addEventListener('change', () => {
                const file = beautyFile.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) { toast('请选择图片文件'); return; }
                if (file.size > 5 * 1024 * 1024) { toast('图片不能超过 5MB'); return; }
                const reader = new FileReader();
                reader.onload = e => {
                    state._beautyInspCoverBase64 = e.target.result;
                    document.getElementById('beautyInspCover').value = '';
                    document.getElementById('beautyInspSkipCover').checked = false;
                    updateBeautyCoverPreview(e.target.result, false);
                    toast('图片已读取，点击保存即可');
                };
                reader.onerror = () => toast('图片读取失败，请重试');
                reader.readAsDataURL(file);
            });
        }
    }

    document.getElementById('saveNowBtn').addEventListener('click', () => {
        saveState();
        toast('已保存到本地');
    });

    document.getElementById('refreshBtn').addEventListener('click', () => {
        if (!state.supabase) {
            toast('未连接云端，请先在设置中配置同步');
            return;
        }
        const btn = document.getElementById('refreshBtn');
        btn.classList.add('spinning');
        syncFromCloud().finally(() => {
            btn.classList.remove('spinning');
            toast('已向云端检查最新数据');
        });
    });

    const onboardBtn = document.getElementById('onboardStartBtn');
    if (onboardBtn) onboardBtn.addEventListener('click', finishOnboarding);

    const importFile = document.getElementById('importFile');
    if (importFile) importFile.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) importDataFile(e.target.files[0]);
        e.target.value = '';
    });

    // 用户要求删除开篇引导页，直接进入首页
    state.data.onboarded = true;

    render();

    // 初始连接后会由 initSupabase 内部触发一次云端拉取；这里再补一个保险
    if (state.supabase) syncFromCloud();

    // 定时轮询云端，确保手机端修改后电脑端能在数秒内自动同步
    setInterval(() => {
        if (state.supabase && !document.hidden) syncFromCloud();
    }, 8000);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && state.supabase) syncFromCloud();
    });

    // 后台轮询因用户正在输入而推迟的重绘：在输入框失焦且焦点未转移到另一个输入框时补绘，
    // 既不打断打字，也能保证数据最终刷新到界面。
    document.addEventListener('focusout', (e) => {
        if (!state._deferredRender) return;
        const to = e.relatedTarget;
        if (to && (to.tagName === 'INPUT' || to.tagName === 'TEXTAREA' || to.isContentEditable)) return;
        state._deferredRender = false;
        render();
    }, true);

    // 记录本次访问时间（供下次"欢迎回来"使用）
    state.data.lastVisit = now();
    saveState();

    // 自动检测新版本：部署后无需手动刷新，发现更新会自动重载
    (function autoUpdateCheck() {
        const APP_BUILD = '20260817g';
        const check = () => {
            fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
                .then(r => r.ok ? r.json() : null)
                .then(d => {
                    if (d && d.build && d.build !== APP_BUILD) {
                        toast('🎉 发现新版本，正在更新…');
                        setTimeout(() => location.reload(true), 800);
                    }
                })
                .catch(() => {});
        };
        setTimeout(check, 5000);
        setInterval(check, 90000);
    })();

    // 每次刷新进入页面：弹出「玩家 [xx] 已上线 🕹️」
    showPlayerOnline();
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        init();
    } catch (err) {
        console.error('init failed', err);
        const el = document.getElementById('fatalError');
        if (el) {
            el.style.display = 'block';
            el.innerHTML = '<div style="font-size:18px;font-weight:700;margin-bottom:8px">😵 初始化失败</div>' +
                '<pre style="font-size:12px;background:rgba(0,0,0,.05);padding:10px;border-radius:8px;overflow:auto">' + (err && err.stack ? err.stack : String(err)) + '</pre>' +
                '<button onclick="location.reload(true)" style="margin-top:12px;padding:8px 16px;border:none;border-radius:8px;background:#34c759;color:#fff;font-size:14px">强制刷新</button>';
        }
    }
});
