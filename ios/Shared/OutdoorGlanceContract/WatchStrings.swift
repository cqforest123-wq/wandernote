import Foundation

public enum WatchStrings {
    /// Language chosen by the user inside the iPhone app, when the snapshot
    /// carries one. The watch has no in-app language picker of its own, so
    /// without this the watch would follow its system locale and disagree with
    /// the phone whenever the user overrode the language in the app.
    public nonisolated(unsafe) static var appLanguageOverride: String?

    private static var languageTable: [String: String] {
        resolvedTable(for: appLanguageOverride ?? systemLanguage)
    }

    /// The wearer's own language preference.
    ///
    /// Deliberately NOT `Locale.current`: that is negotiated against the
    /// bundle's localizations, and this app keeps its strings in Swift rather
    /// than in `.lproj` resources. The system therefore treats it as
    /// English-only and `Locale.current` returns "en" no matter what language
    /// the watch is set to — which is exactly what shipped and showed a
    /// Chinese user an English watch face.
    private static var systemLanguage: String {
        Locale.preferredLanguages.first ?? "en"
    }

    /// Maps a BCP-47-ish identifier ("ja", "zh-Hant-TW", "fr_FR") onto one of
    /// the tables below, falling back to English.
    public static func resolvedTable(
        for identifier: String
    ) -> [String: String] {
        let normalized = identifier
            .replacingOccurrences(of: "_", with: "-")
            .lowercased()
        let base = normalized
            .split(separator: "-")
            .first
            .map(String.init) ?? "en"

        guard base == "zh" else {
            return table(for: base) ?? english
        }

        if normalized.contains("hant") ||
            normalized.contains("-tw") ||
            normalized.contains("-hk") ||
            normalized.contains("-mo") {
            return traditionalChinese
        }

        return simplifiedChinese
    }

    private static func table(
        for base: String
    ) -> [String: String]? {
        switch base {
        case "en": return english
        case "ja": return japanese
        case "ko": return korean
        case "fr": return french
        case "es": return spanish
        case "th": return thai
        default: return nil
        }
    }

    public static func text(_ key: String) -> String {
        languageTable[key] ?? english[key] ?? key
    }

    public static func format(
        _ key: String,
        _ arguments: CVarArg...
    ) -> String {
        String(
            format: text(key),
            locale: Locale.current,
            arguments: arguments
        )
    }

    private static let english: [String: String] = [
        "app.title": "Travel Glance",
        "mode.daily": "Daily Glance",
        "trip": "Trip",
        "trip.dayFormat": "%@ · Day %d",
        "location": "Location",
        "altitude": "Altitude",
        "weather": "Weather",
        "sunset": "Sunset",
        "daylight": "Daylight left",
        "steps": "Steps",
        "car": "Car",
        "updated": "Updated",
        "status.stale": "Data may be outdated",
        "status.waiting": "Waiting for iPhone",
        "status.waitingDetail": "Open WanderNote on your iPhone to sync travel data.",
        "value.unavailable": "Unavailable",
        "location.permissionNeeded": "Location permission needed",
        "location.permissionDenied": "Location permission denied",
        "location.permissionRestricted": "Location restricted",
        "location.unavailable": "Location unavailable",
        "parking.save": "Save Parking",
        "parking.directions": "Back to Parking",
        "parking.saved": "Parking saved",
        "parking.notSaved": "No parking saved",
        "duration.hoursMinutes": "%dh %dm",
        "mock.location": "San Francisco",
        "mock.carDistance": "0.8 km",
        "complication.description": "Sunset, daylight left and your parked car, on the watch face.",
        "parking.elapsed": "Parked %@ ago",
        "spend.today": "Spent today",
        "updated.at": "Updated %@"
    ]

    private static let simplifiedChinese: [String: String] = [
        "app.title": "旅行速览",
        "mode.daily": "日常速览",
        "trip": "旅程",
        "trip.dayFormat": "%@ · 第%d天",
        "location": "位置",
        "altitude": "海拔",
        "weather": "天气",
        "sunset": "日落",
        "daylight": "剩余日照",
        "steps": "步数",
        "car": "停车点",
        "updated": "更新时间",
        "status.stale": "数据可能已过期",
        "status.waiting": "等待 iPhone 同步",
        "status.waitingDetail": "请在 iPhone 上打开 WanderNote 同步旅行数据。",
        "value.unavailable": "暂无数据",
        "location.permissionNeeded": "需要位置权限",
        "location.permissionDenied": "位置权限已关闭",
        "location.permissionRestricted": "位置权限受限",
        "location.unavailable": "无法获取位置",
        "parking.save": "保存停车点",
        "parking.directions": "返回停车点",
        "parking.saved": "已保存停车点",
        "parking.notSaved": "未保存停车点",
        "duration.hoursMinutes": "%d小时%d分",
        "mock.location": "旧金山",
        "mock.carDistance": "0.8 公里",
        "complication.description": "把日落、剩余日照和停车时间放到表盘上。",
        "parking.elapsed": "已停车 %@",
        "spend.today": "今日花费",
        "updated.at": "更新于 %@"
    ]

    private static let traditionalChinese: [String: String] = [
        "app.title": "旅行速覽",
        "mode.daily": "日常速覽",
        "trip": "旅程",
        "trip.dayFormat": "%@ · 第%d天",
        "location": "位置",
        "altitude": "海拔",
        "weather": "天氣",
        "sunset": "日落",
        "daylight": "剩餘日照",
        "steps": "步數",
        "car": "停車點",
        "updated": "更新時間",
        "status.stale": "資料可能已過期",
        "status.waiting": "等待 iPhone 同步",
        "status.waitingDetail": "請在 iPhone 上開啟 WanderNote 同步旅行資料。",
        "value.unavailable": "暫無資料",
        "location.permissionNeeded": "需要位置權限",
        "location.permissionDenied": "位置權限已關閉",
        "location.permissionRestricted": "位置權限受限",
        "location.unavailable": "無法取得位置",
        "parking.save": "儲存停車點",
        "parking.directions": "返回停車點",
        "parking.saved": "已儲存停車點",
        "parking.notSaved": "未儲存停車點",
        "duration.hoursMinutes": "%d小時%d分",
        "mock.location": "舊金山",
        "mock.carDistance": "0.8 公里",
        "complication.description": "把日落、剩餘日照和停車時間放到錶盤上。",
        "parking.elapsed": "已停車 %@",
        "spend.today": "今日花費",
        "updated.at": "更新於 %@"
    ]

    private static let japanese: [String: String] = [
        "app.title": "旅のひと目",
        "mode.daily": "今日のひと目",
        "trip": "旅程",
        "trip.dayFormat": "%@ · %d日目",
        "location": "現在地",
        "altitude": "標高",
        "weather": "天気",
        "sunset": "日の入り",
        "daylight": "日没まで",
        "steps": "歩数",
        "car": "駐車位置",
        "updated": "更新",
        "status.stale": "データが古い可能性があります",
        "status.waiting": "iPhone を待っています",
        "status.waitingDetail": "iPhone で WanderNote を開くと旅のデータが同期されます。",
        "value.unavailable": "データなし",
        "location.permissionNeeded": "位置情報の許可が必要です",
        "location.permissionDenied": "位置情報が許可されていません",
        "location.permissionRestricted": "位置情報が制限されています",
        "location.unavailable": "位置情報を取得できません",
        "parking.save": "駐車位置を保存",
        "parking.directions": "駐車位置に戻る",
        "parking.saved": "駐車位置を保存済み",
        "parking.notSaved": "駐車位置は未保存",
        "duration.hoursMinutes": "%d時間%d分",
        "mock.location": "サンフランシスコ",
        "mock.carDistance": "0.8 km",
        "complication.description": "日の入り、残りの日照、駐車からの経過時間を文字盤に。",
        "parking.elapsed": "駐車から %@",
        "spend.today": "今日の支出",
        "updated.at": "%@ 更新"
    ]

    private static let korean: [String: String] = [
        "app.title": "여행 한눈에",
        "mode.daily": "오늘 한눈에",
        "trip": "여행",
        "trip.dayFormat": "%@ · %d일차",
        "location": "현재 위치",
        "altitude": "고도",
        "weather": "날씨",
        "sunset": "일몰",
        "daylight": "남은 낮 시간",
        "steps": "걸음 수",
        "car": "주차 위치",
        "updated": "업데이트",
        "status.stale": "오래된 데이터일 수 있습니다",
        "status.waiting": "iPhone을 기다리는 중",
        "status.waitingDetail": "iPhone에서 WanderNote를 열면 여행 데이터가 동기화됩니다.",
        "value.unavailable": "데이터 없음",
        "location.permissionNeeded": "위치 권한이 필요합니다",
        "location.permissionDenied": "위치 권한이 거부되었습니다",
        "location.permissionRestricted": "위치 권한이 제한되었습니다",
        "location.unavailable": "위치를 가져올 수 없습니다",
        "parking.save": "주차 위치 저장",
        "parking.directions": "주차 위치로 돌아가기",
        "parking.saved": "주차 위치 저장됨",
        "parking.notSaved": "저장된 주차 위치 없음",
        "duration.hoursMinutes": "%d시간 %d분",
        "mock.location": "샌프란시스코",
        "mock.carDistance": "0.8 km",
        "complication.description": "일몰, 남은 낮 시간, 주차 경과 시간을 시계 페이스에.",
        "parking.elapsed": "주차 후 %@",
        "spend.today": "오늘 지출",
        "updated.at": "%@ 업데이트"
    ]

    private static let french: [String: String] = [
        "app.title": "Aperçu voyage",
        "mode.daily": "Aperçu du jour",
        "trip": "Voyage",
        "trip.dayFormat": "%@ · Jour %d",
        "location": "Position",
        "altitude": "Altitude",
        "weather": "Météo",
        "sunset": "Coucher du soleil",
        "daylight": "Jour restant",
        "steps": "Pas",
        "car": "Voiture",
        "updated": "Mis à jour",
        "status.stale": "Données peut-être obsolètes",
        "status.waiting": "En attente de l’iPhone",
        "status.waitingDetail": "Ouvrez WanderNote sur votre iPhone pour synchroniser le voyage.",
        "value.unavailable": "Indisponible",
        "location.permissionNeeded": "Autorisation de localisation requise",
        "location.permissionDenied": "Localisation refusée",
        "location.permissionRestricted": "Localisation restreinte",
        "location.unavailable": "Position indisponible",
        "parking.save": "Enregistrer le stationnement",
        "parking.directions": "Retour à la voiture",
        "parking.saved": "Stationnement enregistré",
        "parking.notSaved": "Aucun stationnement enregistré",
        "duration.hoursMinutes": "%d h %d min",
        "mock.location": "San Francisco",
        "mock.carDistance": "0,8 km",
        "complication.description": "Coucher du soleil, jour restant et stationnement, sur le cadran.",
        "parking.elapsed": "Garé depuis %@",
        "spend.today": "Dépensé aujourd’hui",
        "updated.at": "Mis à jour à %@"
    ]

    private static let spanish: [String: String] = [
        "app.title": "Vistazo de viaje",
        "mode.daily": "Vistazo diario",
        "trip": "Viaje",
        "trip.dayFormat": "%@ · Día %d",
        "location": "Ubicación",
        "altitude": "Altitud",
        "weather": "Tiempo",
        "sunset": "Puesta de sol",
        "daylight": "Luz restante",
        "steps": "Pasos",
        "car": "Coche",
        "updated": "Actualizado",
        "status.stale": "Los datos pueden estar desactualizados",
        "status.waiting": "Esperando al iPhone",
        "status.waitingDetail": "Abre WanderNote en tu iPhone para sincronizar el viaje.",
        "value.unavailable": "No disponible",
        "location.permissionNeeded": "Se necesita permiso de ubicación",
        "location.permissionDenied": "Permiso de ubicación denegado",
        "location.permissionRestricted": "Ubicación restringida",
        "location.unavailable": "Ubicación no disponible",
        "parking.save": "Guardar aparcamiento",
        "parking.directions": "Volver al coche",
        "parking.saved": "Aparcamiento guardado",
        "parking.notSaved": "Sin aparcamiento guardado",
        "duration.hoursMinutes": "%d h %d min",
        "mock.location": "San Francisco",
        "mock.carDistance": "0,8 km",
        "complication.description": "Puesta de sol, luz restante y aparcamiento, en la esfera.",
        "parking.elapsed": "Aparcado hace %@",
        "spend.today": "Gastado hoy",
        "updated.at": "Actualizado a las %@"
    ]

    private static let thai: [String: String] = [
        "app.title": "ภาพรวมการเดินทาง",
        "mode.daily": "ภาพรวมวันนี้",
        "trip": "ทริป",
        "trip.dayFormat": "%@ · วันที่ %d",
        "location": "ตำแหน่ง",
        "altitude": "ความสูง",
        "weather": "สภาพอากาศ",
        "sunset": "พระอาทิตย์ตก",
        "daylight": "เหลือเวลากลางวัน",
        "steps": "ก้าว",
        "car": "จุดจอดรถ",
        "updated": "อัปเดตเมื่อ",
        "status.stale": "ข้อมูลอาจล้าสมัย",
        "status.waiting": "กำลังรอ iPhone",
        "status.waitingDetail": "เปิด WanderNote บน iPhone เพื่อซิงค์ข้อมูลการเดินทาง",
        "value.unavailable": "ไม่มีข้อมูล",
        "location.permissionNeeded": "ต้องขออนุญาตเข้าถึงตำแหน่ง",
        "location.permissionDenied": "ไม่ได้รับอนุญาตเข้าถึงตำแหน่ง",
        "location.permissionRestricted": "การเข้าถึงตำแหน่งถูกจำกัด",
        "location.unavailable": "ไม่สามารถระบุตำแหน่งได้",
        "parking.save": "บันทึกจุดจอดรถ",
        "parking.directions": "กลับไปที่รถ",
        "parking.saved": "บันทึกจุดจอดรถแล้ว",
        "parking.notSaved": "ยังไม่ได้บันทึกจุดจอดรถ",
        "duration.hoursMinutes": "%d ชม. %d นาที",
        "mock.location": "ซานฟรานซิสโก",
        "mock.carDistance": "0.8 กม.",
        "complication.description": "พระอาทิตย์ตก เวลากลางวันที่เหลือ และเวลาจอดรถ บนหน้าปัด",
        "parking.elapsed": "จอดมาแล้ว %@",
        "spend.today": "ใช้จ่ายวันนี้",
        "updated.at": "อัปเดตเมื่อ %@"
    ]
}
