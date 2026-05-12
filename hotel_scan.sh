#!/bin/bash
TARGET="172.16.16.0/24"
OUTPUT="scan_report.txt"

echo "[*] 开始扫描酒店局域网: $TARGET" | tee $OUTPUT
echo "[*] 正在识别设备类型及开放服务..." | tee -a $OUTPUT

# 扫描 80,443(Web), 9100(打印机), 445(文件共享), 8008(Chromecast), 5000(群晖/NAS)
sudo nmap -sV -F --open -T4 $TARGET -oN $OUTPUT

echo "[+] 扫描完成！报告已保存至: $OUTPUT"
echo "[+] 正在统计最活跃的服务..."
grep "open" $OUTPUT | awk '{print $3}' | sort | uniq -c | sort -nr
