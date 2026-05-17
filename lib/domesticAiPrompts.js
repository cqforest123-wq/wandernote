import { getDomesticAiMode, buildDomesticStyleInstruction } from './domesticAiModes';

function safeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function collectDayNotes(day) {
  const memos = Array.isArray(day?.memos) ? day.memos : [];
  return memos
    .map(m => safeText(m?.text))
    .filter(Boolean)
    .join('；');
}

function collectTripNotes(trip) {
  const days = Array.isArray(trip?.days) ? trip.days : [];
  return days
    .flatMap(d => {
      const memos = Array.isArray(d?.memos) ? d.memos : [];
      return memos.map(m => `[${safeText(d?.date)} ${safeText(m?.tag)}] ${safeText(m?.text)}`);
    })
    .filter(line => line.trim() && !line.endsWith('] '))
    .join('\n');
}

function buildBaseContext({ trip, day }) {
  const destination = [trip?.city, trip?.country].filter(Boolean).join(', ') || '未知目的地';

  if (day) {
    return [
      `目的地：${destination}`,
      `日期：${safeText(day.date)} ${safeText(day.weekDay)}`,
      `照片数量：${Array.isArray(day.photos) ? day.photos.length : 0}`,
      `当天记录：${collectDayNotes(day) || '没有文字记录。请基于目的地和日期谨慎生成，不要编造具体事实。'}`,
    ].join('\n');
  }

  return [
    `目的地：${destination}`,
    `旅程日期：${safeText(trip?.date)}`,
    `天数：${Array.isArray(trip?.days) ? trip.days.length : 0}`,
    `旅程记录：\n${collectTripNotes(trip) || '没有文字记录。请基于目的地和日期谨慎生成，不要编造具体事实。'}`,
  ].join('\n');
}

export function buildDomesticAiPrompt({ modeKey, trip, day, outputLanguage = 'Chinese' }) {
  const mode = getDomesticAiMode(modeKey);

  if (!mode) {
    throw new Error(`Unknown domestic AI mode: ${modeKey}`);
  }

  const context = buildBaseContext({ trip, day });
  const style = buildDomesticStyleInstruction(mode);

  if (mode.key === 'diary') {
    return `你是一名有审美但克制的旅行日记作者。请根据下面的旅行记录，写一篇当天旅行日记。

输出语言：${outputLanguage}

${context}

${style}

具体要求：
- 第一人称。
- 300-500 字。
- 有画面、有细节、有一点情绪。
- 不要写成攻略。
- 不要以“今天”这种过于普通的开头开始。
- 结尾要有一点回望感。`;
  }

  if (mode.key === 'wechat_moments') {
    return `你是一名懂中文社交表达的旅行文案作者。请根据下面的旅行记录，写一条适合微信朋友圈发布的旅行文案。

输出语言：${outputLanguage}

${context}

${style}

具体要求：
- 60-140 字。
- 自然、松弛、像真人发朋友圈。
- 少用形容词，多写一个具体瞬间或一个真实感受。
- 可以有 0-2 个 emoji，但不要太多。
- 不要写成攻略。
- 不要出现夸张营销词。
- 禁止使用：太太太、大片、不需要滤镜、梦幻、绝美、封神、治愈到哭、人间值得。`;
  }

  if (mode.key === 'xiaohongshu_note') {
    return `你是一名克制真实的旅行内容作者。请根据下面的旅行记录，写一篇适合小红书的旅行笔记。

输出语言：${outputLanguage}

${context}

${style}

具体要求：
- 给一个自然标题。
- 分成 3-5 个小段。
- 兼顾体验、亮点、适合人群和注意事项。
- 可以有少量 emoji。
- 不要虚构价格、交通、开放时间。
- 不要写成夸张种草广告。`;
  }

  if (mode.key === 'douyin_script') {
    return `你是一名旅行短视频脚本策划。请根据下面的旅行记录，生成一份适合抖音短视频的脚本。

输出语言：${outputLanguage}

${context}

${style}

具体要求：
- 包含：开头钩子、镜头顺序、旁白、屏幕文字、标题建议。
- 句子要短，有节奏。
- 不要标题党。
- 不要编造不存在的景点和经历。`;
  }

  if (mode.key === 'group_share') {
    return `你是一名自然口语化的旅行分享助手。请根据下面的旅行记录，写一段适合发给朋友、家人或微信群的旅行分享。

输出语言：${outputLanguage}

${context}

${style}

具体要求：
- 60-120 字。
- 口语、亲近、轻松。
- 可以带一点真实吐槽或小感受。
- 不要像广告，也不要像攻略。`;
  }

  if (mode.key === 'summary') {
    return `你是一名旅行回忆整理作者。请根据下面的完整旅程记录，写一篇旅行总结。

输出语言：${outputLanguage}

${context}

${style}

具体要求：
- 第一人称。
- 400-700 字。
- 结构：出发前的期待 → 路上的体验 → 最难忘的瞬间 → 回来后的感受。
- 真实、温和、有回望感。
- 不要编造具体事实。`;
  }

  throw new Error(`Domestic AI mode is not supported by prompt builder: ${mode.key}`);
}
