// 天气工具库 - 使用 Open-Meteo 免费接口，无需API Key

// WMO天气代码转描述和emoji
const WEATHER_CODES = {
  0:  { desc: '晴天', emoji: '☀️' },
  1:  { desc: '基本晴', emoji: '🌤' },
  2:  { desc: '局部多云', emoji: '⛅️' },
  3:  { desc: '阴天', emoji: '☁️' },
  45: { desc: '雾', emoji: '🌫' },
  48: { desc: '冻雾', emoji: '🌫' },
  51: { desc: '小毛毛雨', emoji: '🌦' },
  53: { desc: '毛毛雨', emoji: '🌦' },
  55: { desc: '大毛毛雨', emoji: '🌧' },
  61: { desc: '小雨', emoji: '🌧' },
  63: { desc: '中雨', emoji: '🌧' },
  65: { desc: '大雨', emoji: '🌧' },
  71: { desc: '小雪', emoji: '🌨' },
  73: { desc: '中雪', emoji: '❄️' },
  75: { desc: '大雪', emoji: '❄️' },
  77: { desc: '冰粒', emoji: '🌨' },
  80: { desc: '小阵雨', emoji: '🌦' },
  81: { desc: '中阵雨', emoji: '🌧' },
  82: { desc: '强阵雨', emoji: '⛈' },
  85: { desc: '小阵雪', emoji: '🌨' },
  86: { desc: '大阵雪', emoji: '❄️' },
  95: { desc: '雷阵雨', emoji: '⛈' },
  96: { desc: '冰雹雷雨', emoji: '⛈' },
  99: { desc: '强冰雹雷雨', emoji: '⛈' },
};

export function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { desc: '未知', emoji: '🌡' };
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
export async function fetchCurrentWeather(lat, lng, timezone = 'auto') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=${encodeURIComponent(timezone)}&forecast_days=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    const current = data.current;
    const info = getWeatherInfo(current.weather_code);
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
export async function fetchWeatherForecast(lat, lng, timezone = 'auto') {
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
      emoji: getWeatherInfo(daily.weather_code[i]).emoji,
      desc: getWeatherInfo(daily.weather_code[i]).desc,
      maxTemp: daily.temperature_2m_max[i],
      minTemp: daily.temperature_2m_min[i],
    }));
  } catch (e) {
    console.warn('fetchWeatherForecast error:', e.message);
    return null;
  }
}

// 根据温度和天气代码生成穿衣建议
export function getClothingAdvice(tempMax, tempMin, weatherCode) {
  const avg = (tempMax + tempMin) / 2;
  const isRain = [51,53,55,61,63,65,80,81,82,95,96,99].includes(weatherCode);
  const isSnow = [71,73,75,77,85,86].includes(weatherCode);
  const isWind = false; // 可扩展

  let layers = [];

  // 温度建议
  if (avg >= 30) {
    layers.push({ icon: '👕', text: '短袖短裤，注意防晒' });
  } else if (avg >= 25) {
    layers.push({ icon: '👔', text: '薄衬衫或T恤' });
  } else if (avg >= 20) {
    layers.push({ icon: '🧥', text: '长袖或薄外套' });
  } else if (avg >= 15) {
    layers.push({ icon: '🧥', text: '薄毛衣或夹克' });
  } else if (avg >= 10) {
    layers.push({ icon: '🧣', text: '厚外套，围巾可备' });
  } else if (avg >= 5) {
    layers.push({ icon: '🧤', text: '羽绒服，帽子手套' });
  } else {
    layers.push({ icon: '🧤', text: '厚羽绒服，全套保暖' });
  }

  // 天气补充
  if (isRain) layers.push({ icon: '☂️', text: '记得带伞' });
  if (isSnow) layers.push({ icon: '👢', text: '穿防滑靴，注意路滑' });
  if (avg >= 28) layers.push({ icon: '🧴', text: '涂防晒霜' });
  if (avg <= 0) layers.push({ icon: '❄️', text: '注意防冻，保护暴露皮肤' });

  return layers;
}
