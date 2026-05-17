// Domestic CN AI output modes for 旅迹.
// Keep China-specific social output types isolated from the global AI screen logic.
//
// Domestic copywriting direction:
// - Emotional but not exaggerated.
// - Warm but not cheesy.
// - Specific, visual, and grounded.
// - Avoid empty slogans and fake influencer tone.

export const DOMESTIC_AI_COPY_STYLE = {
  core: '真实、克制、有画面感、有一点情绪，但不要矫情。',
  voice: '像一个刚旅行回来的人，在认真记录自己的感受。',
  avoid: [
    '不要写成广告软文',
    '不要过度使用感叹号',
    '不要堆砌高级形容词',
    '不要编造不存在的景点、价格、交通细节',
    '不要使用过度网红化、营销化表达',
    '不要出现“人生必去”“封神”“绝绝子”等廉价夸张表达',
    '不要使用“太太太”“大片”“不需要滤镜”“梦幻”“绝美”“治愈到哭”等泛网红表达',
    '不要把普通旅行体验写成夸张宣传语',
  ],
};

export const DOMESTIC_AI_MODES = [
  {
    key: 'diary',
    label: '旅行日记',
    desc: '把当天旅行记录整理成一篇有画面感的日记。',
    task: 'travel_diary',
    requiresTrip: true,
    requiresDay: true,
    maxTokens: 1200,
    tone: '私人、安静、细腻、回忆感',
    styleGuide: '写得像一篇真实旅行日记。重点是当天的画面、身体感受、情绪变化和一个值得记住的瞬间。',
  },
  {
    key: 'wechat_moments',
    label: '朋友圈文案',
    desc: '适合微信朋友圈发布的自然旅行文案。',
    task: 'wechat_moments',
    requiresTrip: true,
    requiresDay: true,
    maxTokens: 1000,
    tone: '轻松、真诚、有一点松弛感',
    styleGuide: '不要像攻略，也不要像广告。适合朋友看到后觉得“这趟旅行很舒服、很真实”。可以短一点，有留白。少用形容词，多写具体瞬间。不要写成网红打卡文。',
  },
  {
    key: 'xiaohongshu_note',
    label: '小红书笔记',
    desc: '偏攻略、体验和种草风格的旅行笔记。',
    task: 'xiaohongshu_note',
    requiresTrip: true,
    requiresDay: true,
    maxTokens: 1600,
    tone: '有用、具体、带一点情绪价值',
    styleGuide: '兼顾体验和实用信息。可以有标题感、分段和要点，但不要像营销号。重点写值得去、避坑、适合什么人。',
  },
  {
    key: 'douyin_script',
    label: '抖音脚本',
    desc: '生成短视频开头钩子、镜头建议、旁白和标题。',
    task: 'douyin_script',
    requiresTrip: true,
    requiresDay: true,
    maxTokens: 1400,
    tone: '有节奏、有画面、有开头吸引力',
    styleGuide: '用短句。开头要抓人，但不要标题党。给出镜头顺序、旁白和屏幕文字，适合旅行短视频。',
  },
  {
    key: 'group_share',
    label: '微信群分享',
    desc: '适合发给朋友、家人或群聊的轻量旅行分享。',
    task: 'group_share',
    requiresTrip: true,
    requiresDay: true,
    maxTokens: 800,
    tone: '自然、口语、亲近',
    styleGuide: '像发给熟人的旅行分享。不要太正式，不要太长。可以带一点轻松吐槽和真实感受。',
  },
  {
    key: 'summary',
    label: '旅行总结',
    desc: '把整段旅程整理成完整回忆总结。',
    task: 'trip_summary',
    requiresTrip: true,
    requiresDay: false,
    maxTokens: 1400,
    tone: '完整、温和、回望感',
    styleGuide: '像旅行结束后写给自己的总结。结构清楚，但要有情绪线：出发前、路上、最难忘的瞬间、回来后的感受。',
  },
  {
    key: 'itinerary',
    label: 'AI路书',
    desc: '根据目的地和天数生成结构化旅行路线。',
    task: 'itinerary',
    requiresTrip: false,
    requiresDay: false,
    maxTokens: 5000,
    tone: '清晰、实用、可信',
    styleGuide: '优先实用，不要过度抒情。可以在每天 tips 里加入一点旅行体验建议，但路线、距离、开放状态必须克制表达。',
  },
];

export function getDomesticAiMode(key) {
  return DOMESTIC_AI_MODES.find(mode => mode.key === key) || null;
}

export function buildDomesticStyleInstruction(mode) {
  if (!mode) return DOMESTIC_AI_COPY_STYLE.core;

  return [
    `整体风格：${DOMESTIC_AI_COPY_STYLE.core}`,
    `语气：${mode.tone}`,
    `写作要求：${mode.styleGuide}`,
    `表达视角：${DOMESTIC_AI_COPY_STYLE.voice}`,
    `避免：${DOMESTIC_AI_COPY_STYLE.avoid.join('；')}`,
  ].join('\n');
}
