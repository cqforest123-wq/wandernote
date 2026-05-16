// 天气工具库 - 使用 Open-Meteo 免费接口，无需API Key

// WMO weather code descriptions
const WEATHER_CODES = {
  0:  { zh: '晴天', en: 'Clear sky', emoji: '☀️' },
  1:  { zh: '基本晴', en: 'Mainly clear', emoji: '🌤' },
  2:  { zh: '局部多云', en: 'Partly cloudy', emoji: '⛅️' },
  3:  { zh: '阴天', en: 'Overcast', emoji: '☁️' },
  45: { zh: '雾', en: 'Fog', emoji: '🌫' },
  48: { zh: '冻雾', en: 'Rime fog', emoji: '🌫' },
  51: { zh: '小毛毛雨', en: 'Light drizzle', emoji: '🌦' },
  53: { zh: '毛毛雨', en: 'Drizzle', emoji: '🌦' },
  55: { zh: '大毛毛雨', en: 'Dense drizzle', emoji: '🌧' },
  61: { zh: '小雨', en: 'Light rain', emoji: '🌧' },
  63: { zh: '中雨', en: 'Moderate rain', emoji: '🌧' },
  65: { zh: '大雨', en: 'Heavy rain', emoji: '🌧' },
  71: { zh: '小雪', en: 'Light snow', emoji: '🌨' },
  73: { zh: '中雪', en: 'Moderate snow', emoji: '❄️' },
  75: { zh: '大雪', en: 'Heavy snow', emoji: '❄️' },
  77: { zh: '冰粒', en: 'Snow grains', emoji: '🌨' },
  80: { zh: '小阵雨', en: 'Light showers', emoji: '🌦' },
  81: { zh: '中阵雨', en: 'Moderate showers', emoji: '🌧' },
  82: { zh: '强阵雨', en: 'Heavy showers', emoji: '⛈' },
  85: { zh: '小阵雪', en: 'Light snow showers', emoji: '🌨' },
  86: { zh: '大阵雪', en: 'Heavy snow showers', emoji: '❄️' },
  95: { zh: '雷阵雨', en: 'Thunderstorm', emoji: '⛈' },
  96: { zh: '冰雹雷雨', en: 'Thunderstorm with hail', emoji: '⛈' },
  99: { zh: '强冰雹雷雨', en: 'Severe thunderstorm with hail', emoji: '⛈' },
};

function isChineseLanguage(lang) {
  return String(lang || 'zh').startsWith('zh');
}

export function getWeatherInfo(code, lang = 'zh') {
  const item = WEATHER_CODES[code];
  if (!item) {
    return {
      desc: isChineseLanguage(lang) ? '未知' : 'Unknown',
      emoji: '🌡',
    };
  }

  return {
    desc: isChineseLanguage(lang) ? item.zh : item.en,
    emoji: item.emoji,
  };
}

// 摄氏转华氏
export function celsiusToFahrenheit(c) {
  return Math.round(c * 9 / 5 + 32);
}

// 格式化温度显示
export function formatTemp(celsius, useFahrenheit = false) {
  if (useFahrenheit) return `${celsiusToFahrenheit(celsius)}°F`;
  return `${Math.round(celsius)}°C`;
}

// 获取当前天气
export async function fetchCurrentWeather(lat, lng, timezone = 'auto', lang = 'zh') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=${encodeURIComponent(timezone)}&forecast_days=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    const current = data.current;
    const info = getWeatherInfo(current.weather_code, lang);
    return {
      temp: current.temperature_2m,
      code: current.weather_code,
      emoji: info.emoji,
      desc: info.desc,
      wind: current.wind_speed_10m,
    };
  } catch (e) {
    console.warn('fetchCurrentWeather error:', e.message);
    return null;
  }
}

// 获取未来7天预报
export async function fetchWeatherForecast(lat, lng, timezone = 'auto', lang = 'zh') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&forecast_days=7`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    const daily = data.daily;
    return daily.time.map((date, i) => ({
      date,
      code: daily.weather_code[i],
      emoji: getWeatherInfo(daily.weather_code[i], lang).emoji,
      desc: getWeatherInfo(daily.weather_code[i], lang).desc,
      maxTemp: daily.temperature_2m_max[i],
      minTemp: daily.temperature_2m_min[i],
    }));
  } catch (e) {
    console.warn('fetchWeatherForecast error:', e.message);
    return null;
  }
}

// 根据温度和天气代码生成穿衣建议
export function getClothingAdvice(tempMax, tempMin, weatherCode, lang = 'zh') {
  const avg = (tempMax + tempMin) / 2;
  const isRain = [51,53,55,61,63,65,80,81,82,95,96,99].includes(weatherCode);
  const isSnow = [71,73,75,77,85,86].includes(weatherCode);
  const isZh = isChineseLanguage(lang);

  let layers = [];

  const text = {
    hot: isZh ? '短袖短裤，注意防晒' : 'Short sleeves and shorts. Use sun protection.',
    warm: isZh ? '薄衬衫或T恤' : 'Light shirt or T-shirt.',
    mild: isZh ? '长袖或薄外套' : 'Long sleeves or a light jacket.',
    cool: isZh ? '薄毛衣或夹克' : 'Light sweater or jacket.',
    cold: isZh ? '厚外套，围巾可备' : 'Warm coat. Consider a scarf.',
    veryCold: isZh ? '羽绒服，帽子手套' : 'Down jacket, hat, and gloves.',
    freezing: isZh ? '厚羽绒服，全套保暖' : 'Heavy down jacket and full cold-weather layers.',
    rain: isZh ? '记得带伞' : 'Bring an umbrella.',
    snow: isZh ? '穿防滑靴，注意路滑' : 'Wear non-slip boots. Roads may be slippery.',
    sunscreen: isZh ? '涂防晒霜' : 'Apply sunscreen.',
    frost: isZh ? '注意防冻，保护暴露皮肤' : 'Protect exposed skin from freezing conditions.',
  };

  if (avg >= 30) {
    layers.push({ icon: '👕', text: text.hot });
  } else if (avg >= 25) {
    layers.push({ icon: '👔', text: text.warm });
  } else if (avg >= 20) {
    layers.push({ icon: '🧥', text: text.mild });
  } else if (avg >= 15) {
    layers.push({ icon: '🧥', text: text.cool });
  } else if (avg >= 10) {
    layers.push({ icon: '🧣', text: text.cold });
  } else if (avg >= 5) {
    layers.push({ icon: '🧤', text: text.veryCold });
  } else {
    layers.push({ icon: '🧤', text: text.freezing });
  }

  if (isRain) layers.push({ icon: '☂️', text: text.rain });
  if (isSnow) layers.push({ icon: '👢', text: text.snow });
  if (avg >= 28) layers.push({ icon: '🧴', text: text.sunscreen });
  if (avg <= 0) layers.push({ icon: '❄️', text: text.frost });

  return layers;
}
