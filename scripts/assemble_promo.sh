#!/bin/bash
# Assemble the Fork-Fate promo: Sora intro + real app footage + end card.
# Output: /app/frontend/public/promo/forkfate-promo.mp4 (1080x1920, ~60s)
set -e
R=/app/scripts/promo_rec
W=/tmp/promo_work
SERIF=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
SANS=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
mkdir -p $W /app/frontend/public/promo

# Common: scale to 1080x1920, 30fps, h264, silent AAC track for uniform concat
enc="-c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -shortest"
sil="-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100"

txt() { # txt "TEXT" start end [y]
  echo "drawtext=fontfile=$SERIF:text='$1':fontcolor=white:fontsize=58:borderw=3:bordercolor=black@0.85:x=(w-text_w)/2:y=${4:-160}:enable='between(t,$2,$3)'"
}

# 1) Sora intro (has audio) 8s: hook lines
ffmpeg -y -v error -i /app/scripts/promo_intro.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "Torn on where to eat?" 0.8 4.2),\
$(txt "Let fate pick your table." 4.6 7.8)" \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s0.mp4

# 2) Parchment -> realm chooser -> Reaper realm (trim 2.0-16.5)
f=$(ls $R/1_parchment/*.webm)
ffmpeg -y -v error -ss 2.0 -to 16.5 -i "$f" $sil -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "Your field guide awaits..." 0.5 4.0),\
$(txt "Then choose your realm" 5.2 8.2),\
$(txt "11 immersive worlds" 9.0 14.0)" $enc $W/s1.mp4

# 3) Deal flow (trim 4.5-20.5)
f=$(ls $R/2_deal/*.webm)
ffmpeg -y -v error -ss 4.5 -to 20.5 -i "$f" $sil -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "Pick a craving. Hit Deal." 0.5 4.0),\
$(txt "Fate shuffles real local spots" 4.4 7.6),\
$(txt "Your table is written" 8.4 11.6),\
$(txt "Sponsor deals ride along" 12.0 15.5)" $enc $W/s2.mp4

# 4) Fate Points -> coupon (trim 2.5-13.0)
f=$(ls $R/3_points/*.webm)
ffmpeg -y -v error -ss 2.5 -to 13.0 -i "$f" $sil -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "Earn Fate Points every day" 0.4 3.6),\
$(txt "Redeem for real savings" 4.0 7.0),\
$(txt "at participating sponsors" 7.2 10.2)" $enc $W/s3.mp4

# 5) Realm beauty shots: dragon then cyber (5s each)
f=$(ls $R/4_dragon/*.webm)
ffmpeg -y -v error -ss 3.0 -to 8.0 -i "$f" $sil -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "Rare heists. Trophies." 0.4 4.6)" $enc $W/s4.mp4
f=$(ls $R/5_cyber/*.webm)
ffmpeg -y -v error -ss 3.0 -to 8.0 -i "$f" $sil -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "A new world every visit." 0.4 4.6)" $enc $W/s5.mp4

# 6) End card 7s: logo + user CTA + sponsor CTA
ffmpeg -y -v error -f lavfi -i "color=c=0x0E0E0E:s=1080x1920:d=7:r=30" -i /app/frontend/public/logo-crest.png $sil \
 -filter_complex "[1:v]scale=380:-1[logo];[0:v][logo]overlay=(W-w)/2:430[v0];[v0]\
$(txt "Fork·Fate" 0.3 7 880),\
drawtext=fontfile=$SANS:text='Let fate decide tonight':fontcolor=0xE6B23A:fontsize=44:x=(w-text_w)/2:y=1000:enable='between(t,0.8,7)',\
drawtext=fontfile=$SANS:text='Sponsors — get seen by hungry locals':fontcolor=white@0.9:fontsize=38:x=(w-text_w)/2:y=1220:enable='between(t,2.0,7)',\
drawtext=fontfile=$SANS:text='fork-fate.com':fontcolor=white:fontsize=56:borderw=2:bordercolor=0xE01E26:x=(w-text_w)/2:y=1420:enable='between(t,2.8,7)'[v]" \
 -map "[v]" -map 2:a -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -t 7 $W/s6.mp4

# Concat
for i in 0 1 2 3 4 5 6; do echo "file '$W/s$i.mp4'"; done > $W/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $W/list.txt -c copy $W/concat.mp4

# Music bed from 8s on (loop 26s ambient), duck under, fade out at tail
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 $W/concat.mp4)
FADE=$(python3 -c "print(float('$DUR')-4)")
ffmpeg -y -v error -i $W/concat.mp4 -stream_loop 3 -i /app/frontend/public/reaper-ambient.mp3 \
 -filter_complex "[1:a]adelay=7800|7800,volume=0.6,afade=t=in:st=7.8:d=1.5,afade=t=out:st=$FADE:d=4[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k /app/frontend/public/promo/forkfate-promo.mp4
echo "FINAL:"; ffprobe -v quiet -show_entries format=duration,size -of csv=p=0 /app/frontend/public/promo/forkfate-promo.mp4
