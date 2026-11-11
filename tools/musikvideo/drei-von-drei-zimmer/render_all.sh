#!/bin/bash
# Voller Durchlauf: vier Browser rendern je ein Viertel, danach Zusammenfügen mit Ton.
cd "$(dirname "$0")"
pgrep -f "http.server 8765" >/dev/null || (python3 -m http.server 8765 >/dev/null 2>&1 &)
sleep 1
N=6870; W=${W:-1280}; H=${H:-720}
for i in 0 1 2 3; do node capture.js $W $H $((N*i/4)) $((N*(i+1)/4)) part$i.mp4 > part$i.log 2>&1 & done
wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > parts.txt
ffmpeg -v error -y -f concat -i parts.txt -i song.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -af apad -t 229 -movflags +faststart DREI_VON_DREI_LUME_Zimmer_1080p.mp4
ls -la DREI_VON_DREI_LUME_Zimmer_1080p.mp4
