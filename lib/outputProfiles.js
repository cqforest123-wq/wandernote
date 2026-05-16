// Output profiles for WanderNote.
// Keep platform-specific labels out of business logic.
// Business code should use output type IDs such as social_caption or short_video_script.

export const OUTPUT_TYPES = {
  MEMORY_SUMMARY: 'memory_summary',
  SOCIAL_CAPTION: 'social_caption',
  SHORT_VIDEO_SCRIPT: 'short_video_script',
  TRAVEL_JOURNAL: 'travel_journal',
  TRIP_CARD_EXPORT: 'trip_card_export',
  HASHTAGS: 'hashtags',
};

export const GLOBAL_OUTPUT_PROFILES = [
  {
    id: OUTPUT_TYPES.MEMORY_SUMMARY,
    label: 'Memory Summary',
    desc: 'A concise personal summary of the trip.',
  },
  {
    id: OUTPUT_TYPES.SOCIAL_CAPTION,
    label: 'Instagram Caption',
    desc: 'A polished caption for Instagram or similar platforms.',
  },
  {
    id: OUTPUT_TYPES.SHORT_VIDEO_SCRIPT,
    label: 'TikTok / Reels Script',
    desc: 'Hook, scene list, voiceover, on-screen text, caption, and hashtags.',
  },
  {
    id: OUTPUT_TYPES.TRAVEL_JOURNAL,
    label: 'Travel Journal',
    desc: 'A more reflective journal-style travel recap.',
  },
  {
    id: OUTPUT_TYPES.HASHTAGS,
    label: 'Hashtags',
    desc: 'Travel-friendly hashtag suggestions.',
  },
];

export const DOMESTIC_CN_OUTPUT_PROFILES = [
  {
    id: OUTPUT_TYPES.MEMORY_SUMMARY,
    label: '旅行总结',
    desc: '适合自己回看和保存的旅程总结。',
  },
  {
    id: OUTPUT_TYPES.SOCIAL_CAPTION,
    label: '朋友圈文案',
    desc: '适合微信朋友圈发布的旅行文案。',
  },
  {
    id: OUTPUT_TYPES.TRAVEL_JOURNAL,
    label: '小红书笔记',
    desc: '偏攻略、体验和种草风格的旅行笔记。',
  },
  {
    id: OUTPUT_TYPES.SHORT_VIDEO_SCRIPT,
    label: '抖音短视频脚本',
    desc: '包含开头钩子、镜头建议、旁白和标题。',
  },
  {
    id: OUTPUT_TYPES.TRIP_CARD_EXPORT,
    label: '旅行总结长图',
    desc: '适合生成旅行卡片或长图的结构化内容。',
  },
];

export function getOutputProfiles({ domestic = false } = {}) {
  return domestic ? DOMESTIC_CN_OUTPUT_PROFILES : GLOBAL_OUTPUT_PROFILES;
}
