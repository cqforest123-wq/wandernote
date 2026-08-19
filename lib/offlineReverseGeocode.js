import { logEvent } from './diagnostics';

/**
 * Naming a coordinate without a network.
 *
 * Both online geocoders fail in mainland China: nominatim.openstreetmap.org is
 * unreachable, and Apple's geocoder is served there by AutoNavi, which does not
 * cover places outside China. A photo import from Hawaii therefore came back
 * with perfectly good coordinates and no name at all.
 *
 * This is deliberately coarse. It names the nearest well-known city within
 * MAX_MATCH_KM and otherwise says nothing, because a wrong label is worse than
 * an empty one — the user can always type the real name, but they cannot know
 * to correct a plausible-looking mistake.
 *
 * Nothing here touches the network, so coordinates never leave the device.
 */

// [lat, lng, English name, Chinese name, English country, Chinese country]
const CITIES = [
  // 中国
  [39.90, 116.41, 'Beijing', '北京', 'China', '中国'],
  [31.23, 121.47, 'Shanghai', '上海', 'China', '中国'],
  [23.13, 113.26, 'Guangzhou', '广州', 'China', '中国'],
  [22.54, 114.06, 'Shenzhen', '深圳', 'China', '中国'],
  [30.57, 104.07, 'Chengdu', '成都', 'China', '中国'],
  [29.56, 106.55, 'Chongqing', '重庆', 'China', '中国'],
  [34.34, 108.94, "Xi'an", '西安', 'China', '中国'],
  [30.27, 120.16, 'Hangzhou', '杭州', 'China', '中国'],
  [32.06, 118.80, 'Nanjing', '南京', 'China', '中国'],
  [39.13, 117.20, 'Tianjin', '天津', 'China', '中国'],
  [45.80, 126.53, 'Harbin', '哈尔滨', 'China', '中国'],
  [41.80, 123.43, 'Shenyang', '沈阳', 'China', '中国'],
  [38.91, 121.61, 'Dalian', '大连', 'China', '中国'],
  [36.07, 120.38, 'Qingdao', '青岛', 'China', '中国'],
  [24.48, 118.09, 'Xiamen', '厦门', 'China', '中国'],
  [26.07, 119.30, 'Fuzhou', '福州', 'China', '中国'],
  [28.23, 112.94, 'Changsha', '长沙', 'China', '中国'],
  [30.59, 114.31, 'Wuhan', '武汉', 'China', '中国'],
  [34.75, 113.63, 'Zhengzhou', '郑州', 'China', '中国'],
  [36.65, 117.12, 'Jinan', '济南', 'China', '中国'],
  [25.04, 102.72, 'Kunming', '昆明', 'China', '中国'],
  [26.65, 106.63, 'Guiyang', '贵阳', 'China', '中国'],
  [25.27, 110.29, 'Guilin', '桂林', 'China', '中国'],
  [26.87, 100.23, 'Lijiang', '丽江', 'China', '中国'],
  [25.61, 100.27, 'Dali', '大理', 'China', '中国'],
  [18.25, 109.51, 'Sanya', '三亚', 'China', '中国'],
  [20.04, 110.32, 'Haikou', '海口', 'China', '中国'],
  [29.12, 110.48, 'Zhangjiajie', '张家界', 'China', '中国'],
  [29.65, 91.17, 'Lhasa', '拉萨', 'China', '中国'],
  [36.62, 101.78, 'Xining', '西宁', 'China', '中国'],
  [36.06, 103.83, 'Lanzhou', '兰州', 'China', '中国'],
  [43.83, 87.62, 'Urumqi', '乌鲁木齐', 'China', '中国'],
  [40.14, 94.66, 'Dunhuang', '敦煌', 'China', '中国'],
  [22.32, 114.17, 'Hong Kong', '香港', 'Hong Kong', '中国香港'],
  [22.20, 113.54, 'Macau', '澳门', 'Macau', '中国澳门'],
  [25.03, 121.57, 'Taipei', '台北', 'Taiwan', '中国台湾'],
  [22.63, 120.30, 'Kaohsiung', '高雄', 'Taiwan', '中国台湾'],
  [24.15, 120.68, 'Taichung', '台中', 'Taiwan', '中国台湾'],
  [23.99, 121.60, 'Hualien', '花莲', 'Taiwan', '中国台湾'],

  // 日本
  [35.68, 139.65, 'Tokyo', '东京', 'Japan', '日本'],
  [34.69, 135.50, 'Osaka', '大阪', 'Japan', '日本'],
  [35.01, 135.77, 'Kyoto', '京都', 'Japan', '日本'],
  [34.69, 135.20, 'Kobe', '神户', 'Japan', '日本'],
  [35.18, 136.91, 'Nagoya', '名古屋', 'Japan', '日本'],
  [43.06, 141.35, 'Sapporo', '札幌', 'Japan', '日本'],
  [33.59, 130.40, 'Fukuoka', '福冈', 'Japan', '日本'],
  [26.21, 127.68, 'Naha', '那霸', 'Japan', '日本'],
  [34.39, 132.46, 'Hiroshima', '广岛', 'Japan', '日本'],
  [34.69, 135.83, 'Nara', '奈良', 'Japan', '日本'],
  [35.44, 139.64, 'Yokohama', '横滨', 'Japan', '日本'],
  [36.06, 136.22, 'Kanazawa', '金泽', 'Japan', '日本'],
  [38.27, 140.87, 'Sendai', '仙台', 'Japan', '日本'],
  [35.36, 138.73, 'Mount Fuji', '富士山', 'Japan', '日本'],

  // 韩国 / 蒙古 / 朝鲜
  [37.57, 126.98, 'Seoul', '首尔', 'South Korea', '韩国'],
  [35.18, 129.08, 'Busan', '釜山', 'South Korea', '韩国'],
  [33.50, 126.53, 'Jeju', '济州', 'South Korea', '韩国'],
  [35.83, 128.60, 'Daegu', '大邱', 'South Korea', '韩国'],
  [47.89, 106.91, 'Ulaanbaatar', '乌兰巴托', 'Mongolia', '蒙古'],
  [39.04, 125.76, 'Pyongyang', '平壤', 'North Korea', '朝鲜'],

  // 东南亚
  [13.76, 100.50, 'Bangkok', '曼谷', 'Thailand', '泰国'],
  [18.79, 98.98, 'Chiang Mai', '清迈', 'Thailand', '泰国'],
  [7.88, 98.39, 'Phuket', '普吉', 'Thailand', '泰国'],
  [9.51, 100.06, 'Koh Samui', '苏梅岛', 'Thailand', '泰国'],
  [12.92, 100.88, 'Pattaya', '芭堤雅', 'Thailand', '泰国'],
  [21.03, 105.85, 'Hanoi', '河内', 'Vietnam', '越南'],
  [10.82, 106.63, 'Ho Chi Minh City', '胡志明市', 'Vietnam', '越南'],
  [15.88, 108.34, 'Hoi An', '会安', 'Vietnam', '越南'],
  [16.05, 108.21, 'Da Nang', '岘港', 'Vietnam', '越南'],
  [12.24, 109.19, 'Nha Trang', '芽庄', 'Vietnam', '越南'],
  [20.91, 107.18, 'Ha Long', '下龙', 'Vietnam', '越南'],
  [11.55, 104.92, 'Phnom Penh', '金边', 'Cambodia', '柬埔寨'],
  [13.36, 103.86, 'Siem Reap', '暹粒', 'Cambodia', '柬埔寨'],
  [17.97, 102.63, 'Vientiane', '万象', 'Laos', '老挝'],
  [19.89, 102.14, 'Luang Prabang', '琅勃拉邦', 'Laos', '老挝'],
  [16.87, 96.20, 'Yangon', '仰光', 'Myanmar', '缅甸'],
  [21.96, 96.09, 'Mandalay', '曼德勒', 'Myanmar', '缅甸'],
  [1.35, 103.82, 'Singapore', '新加坡', 'Singapore', '新加坡'],
  [3.14, 101.69, 'Kuala Lumpur', '吉隆坡', 'Malaysia', '马来西亚'],
  [5.41, 100.33, 'Penang', '槟城', 'Malaysia', '马来西亚'],
  [6.06, 116.08, 'Kota Kinabalu', '亚庇', 'Malaysia', '马来西亚'],
  [-6.21, 106.85, 'Jakarta', '雅加达', 'Indonesia', '印度尼西亚'],
  [-8.65, 115.22, 'Bali', '巴厘岛', 'Indonesia', '印度尼西亚'],
  [-7.80, 110.36, 'Yogyakarta', '日惹', 'Indonesia', '印度尼西亚'],
  [14.60, 120.98, 'Manila', '马尼拉', 'Philippines', '菲律宾'],
  [10.32, 123.89, 'Cebu', '宿务', 'Philippines', '菲律宾'],
  [9.79, 118.74, 'Palawan', '巴拉望', 'Philippines', '菲律宾'],
  [4.89, 114.94, 'Bandar Seri Begawan', '斯里巴加湾市', 'Brunei', '文莱'],
  [-8.56, 125.56, 'Dili', '帝力', 'Timor-Leste', '东帝汶'],

  // 南亚
  [28.61, 77.21, 'Delhi', '德里', 'India', '印度'],
  [19.08, 72.88, 'Mumbai', '孟买', 'India', '印度'],
  [12.97, 77.59, 'Bengaluru', '班加罗尔', 'India', '印度'],
  [22.57, 88.36, 'Kolkata', '加尔各答', 'India', '印度'],
  [13.08, 80.27, 'Chennai', '金奈', 'India', '印度'],
  [27.18, 78.02, 'Agra', '阿格拉', 'India', '印度'],
  [26.91, 75.79, 'Jaipur', '斋浦尔', 'India', '印度'],
  [15.30, 74.08, 'Goa', '果阿', 'India', '印度'],
  [25.32, 82.97, 'Varanasi', '瓦拉纳西', 'India', '印度'],
  [27.72, 85.32, 'Kathmandu', '加德满都', 'Nepal', '尼泊尔'],
  [28.21, 83.99, 'Pokhara', '博卡拉', 'Nepal', '尼泊尔'],
  [6.93, 79.86, 'Colombo', '科伦坡', 'Sri Lanka', '斯里兰卡'],
  [7.29, 80.64, 'Kandy', '康提', 'Sri Lanka', '斯里兰卡'],
  [4.18, 73.51, 'Malé', '马累', 'Maldives', '马尔代夫'],
  [23.81, 90.41, 'Dhaka', '达卡', 'Bangladesh', '孟加拉国'],
  [24.86, 67.00, 'Karachi', '卡拉奇', 'Pakistan', '巴基斯坦'],
  [31.55, 74.34, 'Lahore', '拉合尔', 'Pakistan', '巴基斯坦'],
  [33.68, 73.05, 'Islamabad', '伊斯兰堡', 'Pakistan', '巴基斯坦'],
  [27.47, 89.64, 'Thimphu', '廷布', 'Bhutan', '不丹'],
  [34.53, 69.17, 'Kabul', '喀布尔', 'Afghanistan', '阿富汗'],

  // 中亚 / 高加索
  [41.31, 69.24, 'Tashkent', '塔什干', 'Uzbekistan', '乌兹别克斯坦'],
  [39.65, 66.96, 'Samarkand', '撒马尔罕', 'Uzbekistan', '乌兹别克斯坦'],
  [43.24, 76.89, 'Almaty', '阿拉木图', 'Kazakhstan', '哈萨克斯坦'],
  [51.17, 71.45, 'Astana', '阿斯塔纳', 'Kazakhstan', '哈萨克斯坦'],
  [42.87, 74.60, 'Bishkek', '比什凯克', 'Kyrgyzstan', '吉尔吉斯斯坦'],
  [38.56, 68.79, 'Dushanbe', '杜尚别', 'Tajikistan', '塔吉克斯坦'],
  [37.96, 58.38, 'Ashgabat', '阿什哈巴德', 'Turkmenistan', '土库曼斯坦'],
  [41.72, 44.78, 'Tbilisi', '第比利斯', 'Georgia', '格鲁吉亚'],
  [40.18, 44.51, 'Yerevan', '埃里温', 'Armenia', '亚美尼亚'],
  [40.41, 49.87, 'Baku', '巴库', 'Azerbaijan', '阿塞拜疆'],

  // 中东
  [41.01, 28.98, 'Istanbul', '伊斯坦布尔', 'Türkiye', '土耳其'],
  [38.42, 27.14, 'Izmir', '伊兹密尔', 'Türkiye', '土耳其'],
  [38.64, 34.83, 'Cappadocia', '卡帕多奇亚', 'Türkiye', '土耳其'],
  [39.93, 32.86, 'Ankara', '安卡拉', 'Türkiye', '土耳其'],
  [36.88, 30.70, 'Antalya', '安塔利亚', 'Türkiye', '土耳其'],
  [25.20, 55.27, 'Dubai', '迪拜', 'United Arab Emirates', '阿联酋'],
  [24.45, 54.38, 'Abu Dhabi', '阿布扎比', 'United Arab Emirates', '阿联酋'],
  [25.29, 51.53, 'Doha', '多哈', 'Qatar', '卡塔尔'],
  [26.23, 50.59, 'Manama', '麦纳麦', 'Bahrain', '巴林'],
  [29.38, 47.99, 'Kuwait City', '科威特城', 'Kuwait', '科威特'],
  [23.59, 58.41, 'Muscat', '马斯喀特', 'Oman', '阿曼'],
  [24.71, 46.68, 'Riyadh', '利雅得', 'Saudi Arabia', '沙特阿拉伯'],
  [21.49, 39.19, 'Jeddah', '吉达', 'Saudi Arabia', '沙特阿拉伯'],
  [31.77, 35.21, 'Jerusalem', '耶路撒冷', 'Israel', '以色列'],
  [32.09, 34.78, 'Tel Aviv', '特拉维夫', 'Israel', '以色列'],
  [31.95, 35.93, 'Amman', '安曼', 'Jordan', '约旦'],
  [30.33, 35.44, 'Petra', '佩特拉', 'Jordan', '约旦'],
  [33.89, 35.50, 'Beirut', '贝鲁特', 'Lebanon', '黎巴嫩'],
  [35.69, 51.39, 'Tehran', '德黑兰', 'Iran', '伊朗'],
  [32.65, 51.67, 'Isfahan', '伊斯法罕', 'Iran', '伊朗'],
  [33.31, 44.36, 'Baghdad', '巴格达', 'Iraq', '伊拉克'],

  // 欧洲 - 西欧
  [51.51, -0.13, 'London', '伦敦', 'United Kingdom', '英国'],
  [55.95, -3.19, 'Edinburgh', '爱丁堡', 'United Kingdom', '英国'],
  [53.48, -2.24, 'Manchester', '曼彻斯特', 'United Kingdom', '英国'],
  [51.45, -2.59, 'Bristol', '布里斯托尔', 'United Kingdom', '英国'],
  [53.35, -6.26, 'Dublin', '都柏林', 'Ireland', '爱尔兰'],
  [48.86, 2.35, 'Paris', '巴黎', 'France', '法国'],
  [43.30, 5.37, 'Marseille', '马赛', 'France', '法国'],
  [45.76, 4.84, 'Lyon', '里昂', 'France', '法国'],
  [43.70, 7.27, 'Nice', '尼斯', 'France', '法国'],
  [44.84, -0.58, 'Bordeaux', '波尔多', 'France', '法国'],
  [48.58, 7.75, 'Strasbourg', '斯特拉斯堡', 'France', '法国'],
  [52.52, 13.40, 'Berlin', '柏林', 'Germany', '德国'],
  [48.14, 11.58, 'Munich', '慕尼黑', 'Germany', '德国'],
  [50.94, 6.96, 'Cologne', '科隆', 'Germany', '德国'],
  [50.11, 8.68, 'Frankfurt', '法兰克福', 'Germany', '德国'],
  [53.55, 9.99, 'Hamburg', '汉堡', 'Germany', '德国'],
  [48.21, 16.37, 'Vienna', '维也纳', 'Austria', '奥地利'],
  [47.80, 13.04, 'Salzburg', '萨尔茨堡', 'Austria', '奥地利'],
  [47.37, 8.54, 'Zurich', '苏黎世', 'Switzerland', '瑞士'],
  [46.95, 7.45, 'Bern', '伯尔尼', 'Switzerland', '瑞士'],
  [46.20, 6.14, 'Geneva', '日内瓦', 'Switzerland', '瑞士'],
  [46.62, 8.04, 'Interlaken', '因特拉肯', 'Switzerland', '瑞士'],
  [45.98, 7.66, 'Zermatt', '采尔马特', 'Switzerland', '瑞士'],
  [52.37, 4.90, 'Amsterdam', '阿姆斯特丹', 'Netherlands', '荷兰'],
  [50.85, 4.35, 'Brussels', '布鲁塞尔', 'Belgium', '比利时'],
  [49.61, 6.13, 'Luxembourg', '卢森堡', 'Luxembourg', '卢森堡'],

  // 欧洲 - 南欧
  [41.90, 12.50, 'Rome', '罗马', 'Italy', '意大利'],
  [45.46, 9.19, 'Milan', '米兰', 'Italy', '意大利'],
  [45.44, 12.34, 'Venice', '威尼斯', 'Italy', '意大利'],
  [43.77, 11.26, 'Florence', '佛罗伦萨', 'Italy', '意大利'],
  [40.85, 14.27, 'Naples', '那不勒斯', 'Italy', '意大利'],
  [38.12, 13.36, 'Palermo', '巴勒莫', 'Italy', '意大利'],
  [41.90, 12.45, 'Vatican City', '梵蒂冈', 'Vatican', '梵蒂冈'],
  [40.42, -3.70, 'Madrid', '马德里', 'Spain', '西班牙'],
  [41.39, 2.17, 'Barcelona', '巴塞罗那', 'Spain', '西班牙'],
  [37.39, -5.98, 'Seville', '塞维利亚', 'Spain', '西班牙'],
  [39.57, 2.65, 'Palma', '帕尔马', 'Spain', '西班牙'],
  [28.29, -16.62, 'Tenerife', '特内里费', 'Spain', '西班牙'],
  [38.72, -9.14, 'Lisbon', '里斯本', 'Portugal', '葡萄牙'],
  [41.15, -8.61, 'Porto', '波尔图', 'Portugal', '葡萄牙'],
  [32.67, -16.92, 'Funchal', '丰沙尔', 'Portugal', '葡萄牙'],
  [37.98, 23.73, 'Athens', '雅典', 'Greece', '希腊'],
  [36.39, 25.46, 'Santorini', '圣托里尼', 'Greece', '希腊'],
  [35.34, 25.13, 'Heraklion', '伊拉克利翁', 'Greece', '希腊'],
  [35.90, 14.51, 'Valletta', '瓦莱塔', 'Malta', '马耳他'],
  [35.17, 33.36, 'Nicosia', '尼科西亚', 'Cyprus', '塞浦路斯'],
  [43.73, 7.42, 'Monaco', '摩纳哥', 'Monaco', '摩纳哥'],

  // 欧洲 - 中东欧 / 北欧
  [50.08, 14.44, 'Prague', '布拉格', 'Czechia', '捷克'],
  [47.50, 19.04, 'Budapest', '布达佩斯', 'Hungary', '匈牙利'],
  [52.23, 21.01, 'Warsaw', '华沙', 'Poland', '波兰'],
  [50.06, 19.94, 'Krakow', '克拉科夫', 'Poland', '波兰'],
  [48.15, 17.11, 'Bratislava', '布拉迪斯拉发', 'Slovakia', '斯洛伐克'],
  [46.06, 14.51, 'Ljubljana', '卢布尔雅那', 'Slovenia', '斯洛文尼亚'],
  [45.81, 15.98, 'Zagreb', '萨格勒布', 'Croatia', '克罗地亚'],
  [42.65, 18.09, 'Dubrovnik', '杜布罗夫尼克', 'Croatia', '克罗地亚'],
  [44.79, 20.45, 'Belgrade', '贝尔格莱德', 'Serbia', '塞尔维亚'],
  [43.86, 18.41, 'Sarajevo', '萨拉热窝', 'Bosnia and Herzegovina', '波黑'],
  [42.44, 19.26, 'Podgorica', '波德戈里察', 'Montenegro', '黑山'],
  [41.33, 19.82, 'Tirana', '地拉那', 'Albania', '阿尔巴尼亚'],
  [42.00, 21.43, 'Skopje', '斯科普里', 'North Macedonia', '北马其顿'],
  [42.70, 23.32, 'Sofia', '索非亚', 'Bulgaria', '保加利亚'],
  [44.43, 26.10, 'Bucharest', '布加勒斯特', 'Romania', '罗马尼亚'],
  [47.01, 28.86, 'Chisinau', '基希讷乌', 'Moldova', '摩尔多瓦'],
  [50.45, 30.52, 'Kyiv', '基辅', 'Ukraine', '乌克兰'],
  [53.90, 27.57, 'Minsk', '明斯克', 'Belarus', '白俄罗斯'],
  [55.76, 37.62, 'Moscow', '莫斯科', 'Russia', '俄罗斯'],
  [59.93, 30.34, 'Saint Petersburg', '圣彼得堡', 'Russia', '俄罗斯'],
  [43.12, 131.89, 'Vladivostok', '海参崴', 'Russia', '俄罗斯'],
  [52.29, 104.28, 'Irkutsk', '伊尔库茨克', 'Russia', '俄罗斯'],
  [59.33, 18.07, 'Stockholm', '斯德哥尔摩', 'Sweden', '瑞典'],
  [59.91, 10.75, 'Oslo', '奥斯陆', 'Norway', '挪威'],
  [69.65, 18.96, 'Tromsø', '特罗姆瑟', 'Norway', '挪威'],
  [60.39, 5.32, 'Bergen', '卑尔根', 'Norway', '挪威'],
  [55.68, 12.57, 'Copenhagen', '哥本哈根', 'Denmark', '丹麦'],
  [60.17, 24.94, 'Helsinki', '赫尔辛基', 'Finland', '芬兰'],
  [66.50, 25.73, 'Rovaniemi', '罗瓦涅米', 'Finland', '芬兰'],
  [64.15, -21.94, 'Reykjavik', '雷克雅未克', 'Iceland', '冰岛'],
  [59.44, 24.75, 'Tallinn', '塔林', 'Estonia', '爱沙尼亚'],
  [56.95, 24.11, 'Riga', '里加', 'Latvia', '拉脱维亚'],
  [54.69, 25.28, 'Vilnius', '维尔纽斯', 'Lithuania', '立陶宛'],

  // 北美
  [40.71, -74.01, 'New York', '纽约', 'United States', '美国'],
  [34.05, -118.24, 'Los Angeles', '洛杉矶', 'United States', '美国'],
  [37.77, -122.42, 'San Francisco', '旧金山', 'United States', '美国'],
  [41.88, -87.63, 'Chicago', '芝加哥', 'United States', '美国'],
  [47.61, -122.33, 'Seattle', '西雅图', 'United States', '美国'],
  [42.36, -71.06, 'Boston', '波士顿', 'United States', '美国'],
  [38.91, -77.04, 'Washington', '华盛顿', 'United States', '美国'],
  [25.76, -80.19, 'Miami', '迈阿密', 'United States', '美国'],
  [36.17, -115.14, 'Las Vegas', '拉斯维加斯', 'United States', '美国'],
  [32.72, -117.16, 'San Diego', '圣地亚哥', 'United States', '美国'],
  [33.45, -112.07, 'Phoenix', '凤凰城', 'United States', '美国'],
  [39.74, -104.99, 'Denver', '丹佛', 'United States', '美国'],
  [30.27, -97.74, 'Austin', '奥斯汀', 'United States', '美国'],
  [29.76, -95.37, 'Houston', '休斯顿', 'United States', '美国'],
  [32.78, -96.80, 'Dallas', '达拉斯', 'United States', '美国'],
  [33.75, -84.39, 'Atlanta', '亚特兰大', 'United States', '美国'],
  [39.95, -75.17, 'Philadelphia', '费城', 'United States', '美国'],
  [45.52, -122.68, 'Portland', '波特兰', 'United States', '美国'],
  [21.31, -157.86, 'Honolulu', '檀香山', 'United States', '美国'],
  [20.89, -156.47, 'Maui', '茂宜岛', 'United States', '美国'],
  [19.72, -155.09, 'Hilo', '希洛', 'United States', '美国'],
  [21.98, -159.37, 'Lihue', '利胡埃', 'United States', '美国'],
  [61.22, -149.90, 'Anchorage', '安克雷奇', 'United States', '美国'],
  [36.11, -112.11, 'Grand Canyon', '大峡谷', 'United States', '美国'],
  [37.87, -119.54, 'Yosemite', '优胜美地', 'United States', '美国'],
  [44.43, -110.59, 'Yellowstone', '黄石', 'United States', '美国'],
  [43.66, -79.38, 'Toronto', '多伦多', 'Canada', '加拿大'],
  [49.28, -123.12, 'Vancouver', '温哥华', 'Canada', '加拿大'],
  [45.50, -73.57, 'Montreal', '蒙特利尔', 'Canada', '加拿大'],
  [45.42, -75.70, 'Ottawa', '渥太华', 'Canada', '加拿大'],
  [51.05, -114.07, 'Calgary', '卡尔加里', 'Canada', '加拿大'],
  [51.18, -115.57, 'Banff', '班夫', 'Canada', '加拿大'],
  [46.81, -71.21, 'Quebec City', '魁北克城', 'Canada', '加拿大'],
  [19.43, -99.13, 'Mexico City', '墨西哥城', 'Mexico', '墨西哥'],
  [21.16, -86.85, 'Cancún', '坎昆', 'Mexico', '墨西哥'],
  [20.67, -103.35, 'Guadalajara', '瓜达拉哈拉', 'Mexico', '墨西哥'],

  // 中美洲 / 加勒比
  [23.11, -82.37, 'Havana', '哈瓦那', 'Cuba', '古巴'],
  [18.47, -69.89, 'Santo Domingo', '圣多明各', 'Dominican Republic', '多米尼加'],
  [18.47, -66.11, 'San Juan', '圣胡安', 'Puerto Rico', '波多黎各'],
  [18.01, -76.79, 'Kingston', '金斯敦', 'Jamaica', '牙买加'],
  [8.98, -79.52, 'Panama City', '巴拿马城', 'Panama', '巴拿马'],
  [9.93, -84.08, 'San José', '圣何塞', 'Costa Rica', '哥斯达黎加'],
  [14.63, -90.51, 'Guatemala City', '危地马拉城', 'Guatemala', '危地马拉'],
  [17.50, -88.20, 'Belize City', '伯利兹城', 'Belize', '伯利兹'],

  // 南美
  [-23.55, -46.63, 'São Paulo', '圣保罗', 'Brazil', '巴西'],
  [-22.91, -43.17, 'Rio de Janeiro', '里约热内卢', 'Brazil', '巴西'],
  [-15.79, -47.88, 'Brasília', '巴西利亚', 'Brazil', '巴西'],
  [-25.69, -54.44, 'Foz do Iguaçu', '伊瓜苏', 'Brazil', '巴西'],
  [-34.60, -58.38, 'Buenos Aires', '布宜诺斯艾利斯', 'Argentina', '阿根廷'],
  [-54.80, -68.30, 'Ushuaia', '乌斯怀亚', 'Argentina', '阿根廷'],
  [-33.45, -70.67, 'Santiago', '圣地亚哥', 'Chile', '智利'],
  [-27.11, -109.35, 'Easter Island', '复活节岛', 'Chile', '智利'],
  [-12.05, -77.04, 'Lima', '利马', 'Peru', '秘鲁'],
  [-13.53, -71.97, 'Cusco', '库斯科', 'Peru', '秘鲁'],
  [-13.16, -72.55, 'Machu Picchu', '马丘比丘', 'Peru', '秘鲁'],
  [4.71, -74.07, 'Bogotá', '波哥大', 'Colombia', '哥伦比亚'],
  [10.39, -75.51, 'Cartagena', '卡塔赫纳', 'Colombia', '哥伦比亚'],
  [-0.18, -78.47, 'Quito', '基多', 'Ecuador', '厄瓜多尔'],
  [-0.74, -90.31, 'Galápagos', '加拉帕戈斯', 'Ecuador', '厄瓜多尔'],
  [-16.50, -68.15, 'La Paz', '拉巴斯', 'Bolivia', '玻利维亚'],
  [-20.13, -67.49, 'Uyuni', '乌尤尼', 'Bolivia', '玻利维亚'],
  [-34.90, -56.16, 'Montevideo', '蒙得维的亚', 'Uruguay', '乌拉圭'],
  [-25.26, -57.58, 'Asunción', '亚松森', 'Paraguay', '巴拉圭'],
  [10.48, -66.90, 'Caracas', '加拉加斯', 'Venezuela', '委内瑞拉'],

  // 大洋洲
  [-33.87, 151.21, 'Sydney', '悉尼', 'Australia', '澳大利亚'],
  [-37.81, 144.96, 'Melbourne', '墨尔本', 'Australia', '澳大利亚'],
  [-27.47, 153.03, 'Brisbane', '布里斯班', 'Australia', '澳大利亚'],
  [-31.95, 115.86, 'Perth', '珀斯', 'Australia', '澳大利亚'],
  [-34.93, 138.60, 'Adelaide', '阿德莱德', 'Australia', '澳大利亚'],
  [-16.92, 145.77, 'Cairns', '凯恩斯', 'Australia', '澳大利亚'],
  [-35.28, 149.13, 'Canberra', '堪培拉', 'Australia', '澳大利亚'],
  [-25.34, 131.04, 'Uluru', '乌鲁鲁', 'Australia', '澳大利亚'],
  [-36.85, 174.76, 'Auckland', '奥克兰', 'New Zealand', '新西兰'],
  [-41.29, 174.78, 'Wellington', '惠灵顿', 'New Zealand', '新西兰'],
  [-43.53, 172.64, 'Christchurch', '基督城', 'New Zealand', '新西兰'],
  [-45.03, 168.66, 'Queenstown', '皇后镇', 'New Zealand', '新西兰'],
  [-18.14, 178.44, 'Suva', '苏瓦', 'Fiji', '斐济'],
  [-17.54, -149.57, 'Papeete', '帕皮提', 'French Polynesia', '法属波利尼西亚'],
  [13.48, 144.75, 'Hagåtña', '阿加尼亚', 'Guam', '关岛'],
  [15.19, 145.75, 'Saipan', '塞班', 'Northern Mariana Islands', '北马里亚纳'],
  [-9.44, 147.18, 'Port Moresby', '莫尔兹比港', 'Papua New Guinea', '巴布亚新几内亚'],
  [7.34, 134.47, 'Ngerulmud', '恩吉鲁穆德', 'Palau', '帕劳'],
  [-13.83, -171.77, 'Apia', '阿皮亚', 'Samoa', '萨摩亚'],
  [-21.14, -175.20, "Nuku'alofa", '努库阿洛法', 'Tonga', '汤加'],
  [-17.73, 168.32, 'Port Vila', '维拉港', 'Vanuatu', '瓦努阿图'],
  [-22.28, 166.46, 'Nouméa', '努美阿', 'New Caledonia', '新喀里多尼亚'],

  // 非洲
  [30.04, 31.24, 'Cairo', '开罗', 'Egypt', '埃及'],
  [25.69, 32.64, 'Luxor', '卢克索', 'Egypt', '埃及'],
  [27.92, 34.33, 'Sharm El Sheikh', '沙姆沙伊赫', 'Egypt', '埃及'],
  [31.20, 29.92, 'Alexandria', '亚历山大', 'Egypt', '埃及'],
  [31.63, -7.99, 'Marrakesh', '马拉喀什', 'Morocco', '摩洛哥'],
  [33.57, -7.59, 'Casablanca', '卡萨布兰卡', 'Morocco', '摩洛哥'],
  [34.02, -6.83, 'Rabat', '拉巴特', 'Morocco', '摩洛哥'],
  [31.05, -4.00, 'Merzouga', '梅尔祖卡', 'Morocco', '摩洛哥'],
  [36.81, 10.18, 'Tunis', '突尼斯', 'Tunisia', '突尼斯'],
  [36.75, 3.06, 'Algiers', '阿尔及尔', 'Algeria', '阿尔及利亚'],
  [32.89, 13.19, 'Tripoli', '的黎波里', 'Libya', '利比亚'],
  [-33.92, 18.42, 'Cape Town', '开普敦', 'South Africa', '南非'],
  [-26.20, 28.05, 'Johannesburg', '约翰内斯堡', 'South Africa', '南非'],
  [-29.86, 31.02, 'Durban', '德班', 'South Africa', '南非'],
  [-1.29, 36.82, 'Nairobi', '内罗毕', 'Kenya', '肯尼亚'],
  [-4.04, 39.67, 'Mombasa', '蒙巴萨', 'Kenya', '肯尼亚'],
  [-3.37, 36.68, 'Arusha', '阿鲁沙', 'Tanzania', '坦桑尼亚'],
  [-6.16, 39.20, 'Zanzibar', '桑给巴尔', 'Tanzania', '坦桑尼亚'],
  [-6.79, 39.21, 'Dar es Salaam', '达累斯萨拉姆', 'Tanzania', '坦桑尼亚'],
  [0.35, 32.58, 'Kampala', '坎帕拉', 'Uganda', '乌干达'],
  [-1.94, 30.06, 'Kigali', '基加利', 'Rwanda', '卢旺达'],
  [9.03, 38.74, 'Addis Ababa', '亚的斯亚贝巴', 'Ethiopia', '埃塞俄比亚'],
  [15.59, 32.53, 'Khartoum', '喀土穆', 'Sudan', '苏丹'],
  [6.52, 3.38, 'Lagos', '拉各斯', 'Nigeria', '尼日利亚'],
  [5.60, -0.19, 'Accra', '阿克拉', 'Ghana', '加纳'],
  [14.72, -17.47, 'Dakar', '达喀尔', 'Senegal', '塞内加尔'],
  [-4.44, 15.27, 'Kinshasa', '金沙萨', 'DR Congo', '刚果民主共和国'],
  [-8.84, 13.23, 'Luanda', '罗安达', 'Angola', '安哥拉'],
  [-17.83, 31.05, 'Harare', '哈拉雷', 'Zimbabwe', '津巴布韦'],
  [-17.92, 25.86, 'Victoria Falls', '维多利亚瀑布', 'Zimbabwe', '津巴布韦'],
  [-15.42, 28.28, 'Lusaka', '卢萨卡', 'Zambia', '赞比亚'],
  [-22.56, 17.08, 'Windhoek', '温得和克', 'Namibia', '纳米比亚'],
  [-24.66, 25.91, 'Gaborone', '哈博罗内', 'Botswana', '博茨瓦纳'],
  [-18.88, 47.51, 'Antananarivo', '塔那那利佛', 'Madagascar', '马达加斯加'],
  [-20.16, 57.50, 'Port Louis', '路易港', 'Mauritius', '毛里求斯'],
  [-4.62, 55.45, 'Victoria', '维多利亚', 'Seychelles', '塞舌尔'],
];

/**
 * How far a photo may sit from a listed city and still take its name.
 *
 * Wide enough to name a whole island or metropolitan area, narrow enough that
 * an unlisted region stays unnamed instead of borrowing a label from hundreds
 * of kilometres away.
 */
const MAX_MATCH_KM = 180;

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function distanceKm(fromLat, fromLng, toLat, toLng) {
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Nearest listed city, or null when nothing is close enough to be honest about.
 *
 * `language` picks the script only; the match itself is purely geometric.
 */
export function offlineReverseGeocode(lat, lng, language = 'en') {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  let best = null;
  let bestKm = Infinity;

  for (const entry of CITIES) {
    const km = distanceKm(lat, lng, entry[0], entry[1]);

    if (km < bestKm) {
      bestKm = km;
      best = entry;
    }
  }

  if (!best || bestKm > MAX_MATCH_KM) {
    logEvent('geocode', 'offline-too-far', {
      km: Number.isFinite(bestKm) ? Math.round(bestKm) : -1,
    });
    return null;
  }

  const zh = String(language || '').toLowerCase().startsWith('zh');

  logEvent('geocode', 'offline-nearest', { km: Math.round(bestKm) });

  return {
    city: zh ? best[3] : best[2],
    country: zh ? best[5] : best[4],
    approximate: true,
  };
}

export const OFFLINE_CITY_COUNT = CITIES.length;
export const OFFLINE_MAX_MATCH_KM = MAX_MATCH_KM;
