import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// 城市坐标数据库
const CITY_COORDS = {
  // 中国
  '北京': { lat: 39.9042, lng: 116.4074 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '重庆': { lat: 29.5630, lng: 106.5516 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  '西安': { lat: 34.3416, lng: 108.9398 },
  '杭州': { lat: 30.2741, lng: 120.1551 },
  '厦门': { lat: 24.4798, lng: 118.0894 },
  '桂林': { lat: 25.2736, lng: 110.2907 },
  '丽江': { lat: 26.8721, lng: 100.2330 },
  '大理': { lat: 25.6065, lng: 100.2674 },
  '张家界': { lat: 29.1170, lng: 110.4794 },
  '黄山': { lat: 30.1382, lng: 118.1669 },
  '三亚': { lat: 18.2524, lng: 109.5120 },
  '九寨沟': { lat: 33.2600, lng: 103.9170 },
  '稻城亚丁': { lat: 29.0000, lng: 100.3000 },
  '拉萨': { lat: 29.6520, lng: 91.1721 },
  '敦煌': { lat: 40.1420, lng: 94.6620 },
  '乌鲁木齐': { lat: 43.8256, lng: 87.6168 },
  '哈尔滨': { lat: 45.8038, lng: 126.5349 },
  '青岛': { lat: 36.0671, lng: 120.3826 },
  '南京': { lat: 32.0603, lng: 118.7969 },
  '苏州': { lat: 31.2990, lng: 120.5853 },
  '武汉': { lat: 30.5928, lng: 114.3055 },
  '长沙': { lat: 28.2278, lng: 112.9388 },
  '昆明': { lat: 25.0453, lng: 102.7097 },
  '西双版纳': { lat: 22.0070, lng: 100.7978 },
  '香港': { lat: 22.3193, lng: 114.1694 },
  '澳门': { lat: 22.1987, lng: 113.5439 },
  '台北': { lat: 25.0330, lng: 121.5654 },
  '台南': { lat: 22.9999, lng: 120.2270 },
  '花莲': { lat: 23.9772, lng: 121.6015 },
  '垦丁': { lat: 21.9563, lng: 120.8009 },
  '九份': { lat: 25.1089, lng: 121.8443 },
  // 日本
  '东京': { lat: 35.6762, lng: 139.6503 },
  '京都': { lat: 35.0116, lng: 135.7681 },
  '大阪': { lat: 34.6937, lng: 135.5023 },
  '奈良': { lat: 34.6851, lng: 135.8048 },
  '北海道': { lat: 43.0642, lng: 141.3469 },
  '冲绳': { lat: 26.2124, lng: 127.6809 },
  '镰仓': { lat: 35.3192, lng: 139.5468 },
  '箱根': { lat: 35.2327, lng: 139.1069 },
  '广岛': { lat: 34.3853, lng: 132.4553 },
  '神户': { lat: 34.6901, lng: 135.1956 },
  '长崎': { lat: 32.7503, lng: 129.8777 },
  '福冈': { lat: 33.5904, lng: 130.4017 },
  '金泽': { lat: 36.5613, lng: 136.6562 },
  '高山': { lat: 36.1461, lng: 137.2522 },
  '白川乡': { lat: 36.2577, lng: 136.9066 },
  '仙台': { lat: 38.2682, lng: 140.8694 },
  '富士山': { lat: 35.3606, lng: 138.7274 },
  // 韩国
  '首尔': { lat: 37.5665, lng: 126.9780 },
  '釜山': { lat: 35.1796, lng: 129.0756 },
  '济州岛': { lat: 33.4996, lng: 126.5312 },
  '庆州': { lat: 35.8562, lng: 129.2247 },
  '全州': { lat: 35.8242, lng: 127.1480 },
  '仁川': { lat: 37.4563, lng: 126.7052 },
  // 朝鲜
  '平壤': { lat: 39.0392, lng: 125.7625 },
  // 蒙古
  '乌兰巴托': { lat: 47.8864, lng: 106.9057 },
  '戈壁沙漠': { lat: 43.5000, lng: 103.0000 },
  '库苏古尔湖': { lat: 50.4833, lng: 100.4167 },
  // 俄罗斯
  '莫斯科': { lat: 55.7558, lng: 37.6173 },
  '圣彼得堡': { lat: 59.9343, lng: 30.3351 },
  '贝加尔湖': { lat: 53.5587, lng: 108.1650 },
  '符拉迪沃斯托克': { lat: 43.1332, lng: 131.9113 },
  '索契': { lat: 43.5992, lng: 39.7257 },
  // 巴基斯坦
  '拉合尔': { lat: 31.5204, lng: 74.3587 },
  '卡拉奇': { lat: 24.8607, lng: 67.0011 },
  '伊斯兰堡': { lat: 33.6844, lng: 73.0479 },
  '洪扎谷地': { lat: 36.3167, lng: 74.6500 },
  // 孟加拉
  '达卡': { lat: 23.8103, lng: 90.4125 },
  // 不丹
  '廷布': { lat: 27.4712, lng: 89.6339 },
  '帕罗': { lat: 27.4292, lng: 89.4167 },
  '虎穴寺': { lat: 27.4914, lng: 89.3633 },
  // 东南亚 - 泰国
  '曼谷': { lat: 13.7563, lng: 100.5018 },
  '清迈': { lat: 18.7883, lng: 98.9853 },
  '清莱': { lat: 19.9105, lng: 99.8406 },
  '苏梅岛': { lat: 9.5120, lng: 100.0136 },
  '普吉岛': { lat: 7.8804, lng: 98.3923 },
  '喀比': { lat: 8.0863, lng: 98.9063 },
  '华欣': { lat: 12.5684, lng: 99.9578 },
  '芭提雅': { lat: 12.9236, lng: 100.8825 },
  '大城': { lat: 14.3532, lng: 100.5693 },
  // 东南亚 - 越南
  '河内': { lat: 21.0285, lng: 105.8542 },
  '胡志明市': { lat: 10.8231, lng: 106.6297 },
  '岘港': { lat: 16.0544, lng: 108.2022 },
  '会安': { lat: 15.8800, lng: 108.3380 },
  '下龙湾': { lat: 20.9101, lng: 107.1839 },
  '芽庄': { lat: 12.2388, lng: 109.1967 },
  '富国岛': { lat: 10.2897, lng: 103.9840 },
  '顺化': { lat: 16.4637, lng: 107.5909 },
  // 东南亚 - 其他
  '新加坡': { lat: 1.3521, lng: 103.8198 },
  '吉隆坡': { lat: 3.1390, lng: 101.6869 },
  '槟城': { lat: 5.4141, lng: 100.3288 },
  '马六甲': { lat: 2.1896, lng: 102.2501 },
  '亚庇': { lat: 5.9788, lng: 116.0753 },
  '古晋': { lat: 1.5497, lng: 110.3592 },
  '万象': { lat: 17.9757, lng: 102.6331 },
  '老挝': { lat: 17.9757, lng: 102.6331 },
  '琅勃拉邦': { lat: 19.8845, lng: 102.1348 },
  '万荣': { lat: 18.7000, lng: 102.4500 },
  '吴哥窟': { lat: 13.4125, lng: 103.8670 },
  '暹粒': { lat: 13.3671, lng: 103.8448 },
  '金边': { lat: 11.5564, lng: 104.9282 },
  '仰光': { lat: 16.8661, lng: 96.1951 },
  '蒲甘': { lat: 21.1717, lng: 94.8585 },
  '曼德勒': { lat: 21.9588, lng: 96.0891 },
  '茵莱湖': { lat: 20.5167, lng: 96.9000 },
  '巴厘岛': { lat: -8.3405, lng: 115.0920 },
  '巴厘岛乌布': { lat: -8.5069, lng: 115.2625 },
  '龙目岛': { lat: -8.6500, lng: 116.3240 },
  '科莫多岛': { lat: -8.5500, lng: 119.4833 },
  '日惹': { lat: -7.7956, lng: 110.3695 },
  '雅加达': { lat: -6.2088, lng: 106.8456 },
  '马尼拉': { lat: 14.5995, lng: 120.9842 },
  '巴拉望岛': { lat: 9.8349, lng: 118.7384 },
  '长滩岛': { lat: 11.9674, lng: 121.9248 },
  '宿务': { lat: 10.3157, lng: 123.8854 },
  '博霍尔': { lat: 9.8500, lng: 124.1435 },
  '帝力': { lat: -8.5586, lng: 125.5736 },
  // 南亚
  '尼泊尔': { lat: 28.3949, lng: 84.1240 },
  '加德满都': { lat: 27.7172, lng: 85.3240 },
  '博卡拉': { lat: 28.2096, lng: 83.9856 },
  '珠峰大本营': { lat: 28.0025, lng: 86.8528 },
  '奇特旺': { lat: 27.5291, lng: 84.3542 },
  '新德里': { lat: 28.6139, lng: 77.2090 },
  '孟买': { lat: 19.0760, lng: 72.8777 },
  '斋普尔': { lat: 26.9124, lng: 75.7873 },
  '瓦拉纳西': { lat: 25.3176, lng: 82.9739 },
  '果阿': { lat: 15.2993, lng: 74.1240 },
  '泰姬陵/阿格拉': { lat: 27.1751, lng: 78.0421 },
  '科伦坡': { lat: 6.9271, lng: 79.8612 },
  '锡吉里亚': { lat: 7.9570, lng: 80.7603 },
  '康提': { lat: 7.2906, lng: 80.6337 },
  '加勒': { lat: 6.0535, lng: 80.2210 },
  // 中亚
  '撒马尔罕': { lat: 39.6547, lng: 66.9758 },
  '布哈拉': { lat: 39.7747, lng: 64.4286 },
  '希瓦': { lat: 41.3775, lng: 60.3636 },
  '塔什干': { lat: 41.2995, lng: 69.2401 },
  '阿拉木图': { lat: 43.2220, lng: 76.8512 },
  '比什凯克': { lat: 42.8746, lng: 74.5698 },
  '伊塞克湖': { lat: 42.4500, lng: 77.2500 },
  '杜尚别': { lat: 38.5598, lng: 68.7739 },
  '帕米尔高原': { lat: 38.5000, lng: 73.5000 },
  // 西亚/中东
  '阿富汗': { lat: 33.9391, lng: 67.7100 },
  '喀布尔': { lat: 34.5553, lng: 69.2075 },
  '班达米尔湖': { lat: 34.8470, lng: 67.8292 },
  '巴米扬': { lat: 34.8222, lng: 67.8270 },
  '迪拜': { lat: 25.2048, lng: 55.2708 },
  '阿布扎比': { lat: 24.4539, lng: 54.3773 },
  '多哈': { lat: 25.2854, lng: 51.5310 },
  '马斯喀特': { lat: 23.5880, lng: 58.3829 },
  '尼兹瓦': { lat: 22.9333, lng: 57.5333 },
  '利雅得': { lat: 24.7136, lng: 46.6753 },
  '阿尔乌拉': { lat: 26.5136, lng: 37.9220 },
  '吉达': { lat: 21.5433, lng: 39.1728 },
  '耶路撒冷': { lat: 31.7683, lng: 35.2137 },
  '特拉维夫': { lat: 32.0853, lng: 34.7818 },
  '死海': { lat: 31.5590, lng: 35.4732 },
  '佩特拉': { lat: 30.3285, lng: 35.4444 },
  '安曼': { lat: 31.9454, lng: 35.9284 },
  '贝鲁特': { lat: 33.8886, lng: 35.4955 },
  '伊斯坦布尔': { lat: 41.0082, lng: 28.9784 },
  '卡帕多奇亚': { lat: 38.6431, lng: 34.8307 },
  '棉花堡': { lat: 37.9239, lng: 29.1221 },
  '以弗所': { lat: 37.9396, lng: 27.3408 },
  '安塔利亚': { lat: 36.8969, lng: 30.7133 },
  '德黑兰': { lat: 35.6892, lng: 51.3890 },
  '伊斯法罕': { lat: 32.6546, lng: 51.6680 },
  '设拉子': { lat: 29.5918, lng: 52.5837 },
  '亚兹德': { lat: 31.8974, lng: 54.3569 },
  // 高加索
  '第比利斯': { lat: 41.7151, lng: 44.8271 },
  '卡兹别吉': { lat: 42.6520, lng: 44.6320 },
  '埃里温': { lat: 40.1872, lng: 44.5152 },
  '巴库': { lat: 40.4093, lng: 49.8671 },
  // 欧洲 - 西欧
  '巴黎': { lat: 48.8566, lng: 2.3522 },
  '伦敦': { lat: 51.5074, lng: -0.1278 },
  '阿姆斯特丹': { lat: 52.3676, lng: 4.9041 },
  '布鲁塞尔': { lat: 50.8503, lng: 4.3517 },
  '维也纳': { lat: 48.2082, lng: 16.3738 },
  '苏黎世': { lat: 47.3769, lng: 8.5417 },
  '日内瓦': { lat: 46.2044, lng: 6.1432 },
  '因特拉肯': { lat: 46.6863, lng: 7.8632 },
  '萨尔茨堡': { lat: 47.8095, lng: 13.0550 },
  '里斯本': { lat: 38.7223, lng: -9.1393 },
  '波尔图': { lat: 41.1579, lng: -8.6291 },
  '马德里': { lat: 40.4168, lng: -3.7038 },
  '巴塞罗那': { lat: 41.3851, lng: 2.1734 },
  '塞维利亚': { lat: 37.3891, lng: -5.9845 },
  '格拉纳达': { lat: 37.1773, lng: -3.5986 },
  '罗马': { lat: 41.9028, lng: 12.4964 },
  '佛罗伦萨': { lat: 43.7696, lng: 11.2558 },
  '威尼斯': { lat: 45.4408, lng: 12.3155 },
  '米兰': { lat: 45.4642, lng: 9.1900 },
  '那不勒斯': { lat: 40.8518, lng: 14.2681 },
  '阿马尔菲': { lat: 40.6340, lng: 14.6027 },
  '都柏林': { lat: 53.3498, lng: -6.2603 },
  '爱丁堡': { lat: 55.9533, lng: -3.1883 },
  // 欧洲 - 南欧/东欧
  '雅典': { lat: 37.9838, lng: 23.7275 },
  '圣托里尼': { lat: 36.3932, lng: 25.4615 },
  '米科诺斯': { lat: 37.4467, lng: 25.3289 },
  '科托尔': { lat: 42.4247, lng: 18.7712 },
  '杜布罗夫尼克': { lat: 42.6507, lng: 18.0944 },
  '萨拉热窝': { lat: 43.8563, lng: 18.4131 },
  '布拉格': { lat: 50.0755, lng: 14.4378 },
  '布达佩斯': { lat: 47.4979, lng: 19.0402 },
  '华沙': { lat: 52.2297, lng: 21.0122 },
  '克拉科夫': { lat: 50.0647, lng: 19.9450 },
  '塔林': { lat: 59.4370, lng: 24.7536 },
  '里加': { lat: 56.9496, lng: 24.1052 },
  '维尔纽斯': { lat: 54.6872, lng: 25.2797 },
  '布加勒斯特': { lat: 44.4268, lng: 26.1025 },
  '索非亚': { lat: 42.6977, lng: 23.3219 },
  '斯科普里': { lat: 41.9973, lng: 21.4280 },
  '地拉那': { lat: 41.3275, lng: 19.8187 },
  // 北欧
  '奥斯陆': { lat: 59.9139, lng: 10.7522 },
  '卑尔根': { lat: 60.3913, lng: 5.3221 },
  '特罗姆瑟': { lat: 69.6492, lng: 18.9553 },
  '罗弗敦': { lat: 68.2090, lng: 13.9500 },
  '特罗姆瑟·罗弗敦群岛': { lat: 68.9290, lng: 16.4500 },
  '斯德哥尔摩': { lat: 59.3293, lng: 18.0686 },
  '哥本哈根': { lat: 55.6761, lng: 12.5683 },
  '赫尔辛基': { lat: 60.1699, lng: 24.9384 },
  '雷克雅未克': { lat: 64.1466, lng: -21.9426 },
  '黄金圈': { lat: 64.3271, lng: -20.1199 },
  '蓝湖': { lat: 63.8803, lng: -22.4489 },
  '南岸': { lat: 63.5310, lng: -19.5151 },
  // 北美
  '纽约': { lat: 40.7128, lng: -74.0060 },
  '洛杉矶': { lat: 34.0522, lng: -118.2437 },
  '旧金山': { lat: 37.7749, lng: -122.4194 },
  '拉斯维加斯': { lat: 36.1699, lng: -115.1398 },
  '夏威夷': { lat: 21.3069, lng: -157.8583 },
  '夏威夷大岛': { lat: 19.8968, lng: -155.5828 },
  '毛伊岛': { lat: 20.7984, lng: -156.3319 },
  '费尔班克斯': { lat: 64.8378, lng: -147.7164 },
  '安克雷奇': { lat: 61.2181, lng: -149.9003 },
  '迪纳利': { lat: 63.1148, lng: -151.1926 },
  '冰川湾': { lat: 58.6658, lng: -136.9000 },
  '黄石公园': { lat: 44.4280, lng: -110.5885 },
  '黄石公园·阿拉斯加': { lat: 44.4280, lng: -110.5885 },
  '大峡谷': { lat: 36.0544, lng: -112.1401 },
  '优胜美地': { lat: 37.8651, lng: -119.5383 },
  '迈阿密': { lat: 25.7617, lng: -80.1918 },
  '芝加哥': { lat: 41.8781, lng: -87.6298 },
  '波士顿': { lat: 42.3601, lng: -71.0589 },
  '西雅图': { lat: 47.6062, lng: -122.3321 },
  '丹佛': { lat: 39.7392, lng: -104.9903 },
  '圣地亚哥': { lat: 32.7157, lng: -117.1611 },
  '波特兰': { lat: 45.5051, lng: -122.6750 },
  '新奥尔良': { lat: 29.9511, lng: -90.0715 },
  '温哥华': { lat: 49.2827, lng: -123.1207 },
  '多伦多': { lat: 43.6532, lng: -79.3832 },
  '班夫': { lat: 51.1784, lng: -115.5708 },
  '蒙特利尔': { lat: 45.5017, lng: -73.5673 },
  '魁北克': { lat: 46.8139, lng: -71.2080 },
  // 中美洲/加勒比
  '墨西哥城': { lat: 19.4326, lng: -99.1332 },
  '坎昆': { lat: 21.1619, lng: -86.8515 },
  '瓜达拉哈拉': { lat: 20.6597, lng: -103.3496 },
  '哈瓦那': { lat: 23.1136, lng: -82.3666 },
  '圣胡安': { lat: 18.4655, lng: -66.1057 },
  '巴拿马城': { lat: 8.9936, lng: -79.5197 },
  // 南美
  '里约热内卢': { lat: -22.9068, lng: -43.1729 },
  '圣保罗': { lat: -23.5505, lng: -46.6333 },
  '布宜诺斯艾利斯': { lat: -34.6037, lng: -58.3816 },
  '利马': { lat: -12.0464, lng: -77.0428 },
  '马丘比丘': { lat: -13.1631, lng: -72.5450 },
  '库斯科': { lat: -13.5319, lng: -71.9675 },
  '波哥大': { lat: 4.7110, lng: -74.0721 },
  '卡塔赫纳': { lat: 10.3910, lng: -75.4794 },
  '基多': { lat: -0.1807, lng: -78.4678 },
  '加拉帕戈斯': { lat: -0.9538, lng: -90.9656 },
  '巴塔哥尼亚': { lat: -51.6230, lng: -72.5034 },
  '乌斯怀亚': { lat: -54.8019, lng: -68.3030 },
  '玻利维亚盐湖': { lat: -20.1338, lng: -67.4891 },
  // 大洋洲
  '悉尼': { lat: -33.8688, lng: 151.2093 },
  '墨尔本': { lat: -37.8136, lng: 144.9631 },
  '大堡礁': { lat: -18.2871, lng: 147.6992 },
  '黄金海岸': { lat: -28.0167, lng: 153.4000 },
  '凯恩斯': { lat: -16.9186, lng: 145.7781 },
  '乌鲁鲁': { lat: -25.3444, lng: 131.0369 },
  '布里斯班': { lat: -27.4698, lng: 153.0251 },
  '珀斯': { lat: -31.9505, lng: 115.8605 },
  '阿德莱德': { lat: -34.9285, lng: 138.6007 },
  '奥克兰': { lat: -36.8485, lng: 174.7633 },
  '皇后镇': { lat: -45.0312, lng: 168.6626 },
  '基督城': { lat: -43.5321, lng: 172.6362 },
  '米尔福德峡湾': { lat: -44.6413, lng: 167.8974 },
  '斐济': { lat: -17.7134, lng: 178.0650 },
  '塔希提': { lat: -17.6509, lng: -149.4260 },
  '马尔代夫': { lat: 3.2028, lng: 73.2207 },
  '关岛': { lat: 13.4443, lng: 144.7937 },
  '塞班岛': { lat: 15.1778, lng: 145.7507 },
  // 非洲
  '开罗': { lat: 30.0444, lng: 31.2357 },
  '卢克索': { lat: 25.6872, lng: 32.6396 },
  '亚历山大': { lat: 31.2001, lng: 29.9187 },
  '马拉喀什': { lat: 31.6295, lng: -7.9811 },
  '菲斯': { lat: 34.0181, lng: -5.0078 },
  '卡萨布兰卡': { lat: 33.5731, lng: -7.5898 },
  '突尼斯': { lat: 36.8065, lng: 10.1815 },
  '内罗毕': { lat: -1.2921, lng: 36.8219 },
  '坦桑尼亚塞伦盖蒂': { lat: -2.3333, lng: 34.8333 },
  '桑给巴尔': { lat: -6.1659, lng: 39.2026 },
  '乞力马扎罗': { lat: -3.0674, lng: 37.3556 },
  '开普敦': { lat: -33.9249, lng: 18.4241 },
  '约翰内斯堡': { lat: -26.2041, lng: 28.0473 },
  '维多利亚瀑布': { lat: -17.9243, lng: 25.8572 },
  '塞舌尔': { lat: -4.6796, lng: 55.4920 },
  '毛里求斯': { lat: -20.3484, lng: 57.5522 },
  // 太平洋岛国
  '楚克泻湖': { lat: 7.4167, lng: 151.7833 },
  '楚克': { lat: 7.4167, lng: 151.7833 },
  '马朱罗': { lat: 7.0897, lng: 171.3803 },
  '马绍尔群岛': { lat: 7.1315, lng: 171.1845 },
  '帕劳': { lat: 7.5150, lng: 134.5825 },
  '科罗尔': { lat: 7.3419, lng: 134.4792 },
  '瓦努阿图': { lat: -15.3767, lng: 166.9592 },
  '所罗门群岛': { lat: -9.6457, lng: 160.1562 },
  '汤加': { lat: -21.1789, lng: -175.1982 },
  '萨摩亚': { lat: -13.7590, lng: -172.1046 },
  '图瓦卢': { lat: -7.1095, lng: 177.6493 },
  '基里巴斯': { lat: 1.8709, lng: -157.3630 },
  // 南美补充
  '亚松森': { lat: -25.2867, lng: -57.6470 },
  '巴拉圭': { lat: -23.4425, lng: -58.4438 },
  '蒙得维的亚': { lat: -34.9011, lng: -56.1645 },
  '苏克雷': { lat: -19.0196, lng: -65.2619 },
  '拉巴斯': { lat: -16.5000, lng: -68.1500 },
  '阿斯纳西翁': { lat: -25.2867, lng: -57.6470 },
  '乔治城': { lat: 6.8013, lng: -58.1551 },
  '帕拉马里博': { lat: 5.8520, lng: -55.2038 },
};

function getCoords(cityName) {
  // 精确匹配
  if (CITY_COORDS[cityName]) return CITY_COORDS[cityName];
  // 模糊匹配
  const key = Object.keys(CITY_COORDS).find(k => 
    cityName.includes(k) || k.includes(cityName)
  );
  return key ? CITY_COORDS[key] : null;
}

export default function MapScreen({ trips }) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [mapType, setMapType] = useState('standard');

  // 获取所有有坐标的旅程
  const mappedTrips = trips.map(t => ({
    ...t,
    coords: t.coords || getCoords(t.city),
  })).filter(t => t.coords);

  const unmappedTrips = trips.filter(t => !getCoords(t.city));

  // 计算地图中心
  const getInitialRegion = () => {
    if (mappedTrips.length === 0) {
      return { latitude: 25, longitude: 15, latitudeDelta: 120, longitudeDelta: 120 };
    }
    const lats = mappedTrips.map(t => t.coords.lat);
    const lngs = mappedTrips.map(t => t.coords.lng);
    const midLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const midLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    const deltaLat = Math.max(Math.max(...lats) - Math.min(...lats), 20) * 1.5;
    const deltaLng = Math.max(Math.max(...lngs) - Math.min(...lngs), 20) * 1.5;
    return { latitude: midLat, longitude: midLng, latitudeDelta: deltaLat, longitudeDelta: deltaLng };
  };

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

      {/* 顶部统计 */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>🗺 旅行足迹</Text>
          <Text style={s.subtitle}>足迹遍布 {mappedTrips.length} 个地方</Text>
        </View>
        <TouchableOpacity
          style={s.mapTypeBtn}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}>
          <Text style={s.mapTypeBtnText}>{mapType === 'standard' ? '🛰 卫星' : '🗺 地图'}</Text>
        </TouchableOpacity>
      </View>

      {/* 地图 */}
      <View style={s.mapContainer}>
        {mappedTrips.length === 0 ? (
          <View style={s.emptyMap}>
            <Text style={s.emptyEmoji}>🌍</Text>
            <Text style={s.emptyText}>还没有可显示的旅程</Text>
            <Text style={s.emptyHint}>添加旅程后这里会显示你的足迹</Text>
          </View>
        ) : (
          <MapView
            style={s.map}
            mapType={mapType}
            initialRegion={getInitialRegion()}
            showsUserLocation={true}
            showsCompass={false}>
            {mappedTrips.map(trip => (
              <Marker
                key={trip.id}
                coordinate={{ latitude: trip.coords.lat, longitude: trip.coords.lng }}
                onPress={() => setSelectedTrip(trip)}
                title={trip.city}
                description={trip.country}>
              </Marker>
            ))}
          </MapView>
        )}
      </View>

      {/* 底部旅程列表 */}
      <View style={s.tripList}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection:'row', gap:10, paddingHorizontal:16}}>
            {mappedTrips.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={[s.tripChip, selectedTrip?.id === trip.id && s.tripChipActive]}
                onPress={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}>
                <Text style={s.tripChipEmoji}>{trip.emoji}</Text>
                <Text style={[s.tripChipCity, selectedTrip?.id === trip.id && {color:'#D4AF37'}]}>
                  {trip.city}
                </Text>
                <Text style={s.tripChipMeta}>{trip.days.length}天</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 选中旅程详情弹窗 */}
      <Modal visible={!!selectedTrip} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{flex:1}} onPress={() => setSelectedTrip(null)}/>
          {selectedTrip && (
            <View style={s.modalSheet}>
              <View style={s.modalHeader}>
                <Text style={s.modalEmoji}>{selectedTrip.emoji}</Text>
                <View style={{flex:1}}>
                  <Text style={s.modalCity}>{selectedTrip.city}</Text>
                  <Text style={s.modalMeta}>{selectedTrip.country} · {selectedTrip.date}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                  <Text style={{color:'#555', fontSize:18}}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={s.modalStats}>
                {[
                  [String(selectedTrip.days.length), '天'],
                  [String(selectedTrip.days.reduce((a,d)=>a+d.memos.length,0)), '感言'],
                  [String(selectedTrip.days.reduce((a,d)=>a+(d.photos||[]).length,0)), '照片'],
                ].map(([n,l]) => (
                  <View key={l} style={s.modalStat}>
                    <Text style={s.modalStatNum}>{n}</Text>
                    <Text style={s.modalStatLabel}>{l}</Text>
                  </View>
                ))}
              </View>
              {selectedTrip.plannedDate && (
                <Text style={{color:'#4ECDC4', fontSize:13, textAlign:'center', marginTop:8}}>
                  ✈️ 出发日期：{selectedTrip.plannedDate}
                </Text>
              )}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {flex:1, backgroundColor:'#0D0D0D'},
  header: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingBottom:12},
  title: {fontSize:22, color:'#F0EDE8', fontWeight:'300'},
  subtitle: {fontSize:13, color:'#555', marginTop:3},
  mapTypeBtn: {backgroundColor:'#1A1A1A', borderRadius:20, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'#2A2A2A'},
  mapTypeBtnText: {color:'#888', fontSize:13},
  mapContainer: {flex:1},
  map: {flex:1},
  emptyMap: {flex:1, alignItems:'center', justifyContent:'center'},
  emptyEmoji: {fontSize:64, marginBottom:16},
  emptyText: {fontSize:16, color:'#555'},
  emptyHint: {fontSize:13, color:'#333', marginTop:8},
  markerContainer: {alignItems:'center'},
  marker: {backgroundColor:'#1A1A1A', borderRadius:22, padding:6, borderWidth:2, borderColor:'#D4AF3760', shadowColor:'#000', shadowOpacity:0.3, shadowRadius:4},
  markerSelected: {borderColor:'#D4AF37', backgroundColor:'#D4AF3720'},
  markerEmoji: {fontSize:22},
  markerTail: {width:2, height:8, backgroundColor:'#D4AF37', opacity:0.6},
  tripList: {paddingVertical:14, backgroundColor:'#0D0D0D', borderTopWidth:1, borderTopColor:'#1A1A1A'},
  tripChip: {backgroundColor:'#161616', borderRadius:14, padding:12, alignItems:'center', width:80, borderWidth:1, borderColor:'#242424'},
  tripChipActive: {borderColor:'#D4AF37', backgroundColor:'#D4AF3710'},
  tripChipEmoji: {fontSize:22, marginBottom:4},
  tripChipCity: {fontSize:11, color:'#888', textAlign:'center'},
  tripChipMeta: {fontSize:10, color:'#555', marginTop:2},
  modalOverlay: {flex:1, justifyContent:'flex-end', backgroundColor:'#00000088'},
  modalSheet: {backgroundColor:'#111', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40, borderTopWidth:1, borderColor:'#2A2A2A'},
  modalHeader: {flexDirection:'row', alignItems:'center', gap:14, marginBottom:20},
  modalEmoji: {fontSize:40},
  modalCity: {fontSize:22, color:'#F0EDE8', fontWeight:'300'},
  modalMeta: {fontSize:13, color:'#555', marginTop:4},
  modalStats: {flexDirection:'row', gap:12},
  modalStat: {flex:1, backgroundColor:'#1A1A1A', borderRadius:12, padding:14, alignItems:'center'},
  modalStatNum: {fontSize:24, color:'#D4AF37', fontWeight:'300'},
  modalStatLabel: {fontSize:11, color:'#555', marginTop:4},
});
