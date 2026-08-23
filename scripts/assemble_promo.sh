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

txt() { # txt "TEXT" start end [y] [size] — red, floating on a slow sine bob
  echo "drawtext=fontfile=$SERIF:text='$1':fontcolor=0xE8232B:fontsize=${5:-66}:box=1:boxcolor=black@0.65:boxborderw=24:x=(w-text_w)/2:y=${4:-300}+16*sin(2*PI*t/2.4):enable='between(t,$2,$3)'"
}

# 1) Sora intro (has audio) 8s: hook lines
ffmpeg -y -v error -i /app/scripts/promo_intro.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "Torn on where to eat?" 0.8 4.2),\
$(txt "Let fate pick your table." 4.6 7.8)" \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s0.mp4

# Pre-pass: normalize each webm to a clean mp4 (regular timestamps/keyframes)
# so input seeking is frame-accurate — kills the white load-flash without
# breaking 0-based caption timings.
pre() { ffmpeg -y -v error -i "$1" -vf "scale=1080:1920:flags=lanczos,fps=30,setpts=1.15*PTS" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -g 15 -an "$2"; }
pre "$(ls $R/1_parchment/*.webm)" $W/pre1.mp4
pre "$(ls $R/2_deal/*.webm)" $W/pre2.mp4
pre "$(ls $R/3_points/*.webm)" $W/pre3.mp4
pre "$(ls $R/4_dragon/*.webm)" $W/pre4.mp4
pre "$(ls $R/5_cyber/*.webm)" $W/pre5.mp4
pre "$(ls $R/6_tiki/*.webm)" $W/pre6.mp4
pre "$(ls $R/7_fairy/*.webm)" $W/pre7.mp4
pre "$(ls $R/8_winter/*.webm)" $W/pre8.mp4
pre "$(ls $R/9_sponsor/*.webm)" $W/pre9.mp4

# 2) Parchment -> realm chooser (HOLD: all 11 realms visible; cut BEFORE the
#    theme switch so no stray guided Step 1 sneaks in)
ffmpeg -y -v error -ss 4.0 -t 9.8 -i $W/pre1.mp4 $sil -vf "\
$(txt "Your field guide awaits..." 0.2 2.5 300 64),\
$(txt "Choose your realm" 4.8 7.4),\
$(txt "11 immersive worlds" 7.6 9.7)" $enc $W/s1.mp4

# 2b) Quick clean realm flashes (scenery only, no page words; winter cut —
#     the white realm added nothing)
ffmpeg -y -v error -ss 4.5 -t 1.4 -i $W/pre6.mp4 $sil -vf "$(txt "11 immersive worlds" 0 1.4)" $enc $W/s1b.mp4
ffmpeg -y -v error -ss 4.5 -t 1.4 -i $W/pre7.mp4 $sil -vf "$(txt "11 immersive worlds" 0 1.4)" $enc $W/s1c.mp4

# 3) Guided walkthrough -> shuffle -> reveal (arrowed taps, each step explained)
ffmpeg -y -v error -ss 3.6 -t 29 -i $W/pre2.mp4 $sil -vf "\
$(txt "Step 1 · What calls to you?" 0.2 2.6 300 60),\
$(txt "Step 2 · Where are you?" 2.9 7.0 300 60),\
$(txt "Step 3 · Pick the vibe — or let fate" 7.4 10.0 300 54),\
$(txt "Step 4 · Seal the ritual" 10.5 13.2 300 60),\
$(txt "Fate shuffles real local spots" 14.0 18.0 300 62),\
$(txt "Your table is written" 22.3 25.0),\
$(txt "Sponsor deals ride along" 25.4 28.4)" $enc $W/s2.mp4

# 4) Fate Points -> coupon (opens ON the dialog — no light home screens first)
ffmpeg -y -v error -ss 5.9 -t 9.1 -i $W/pre3.mp4 $sil -vf "\
$(txt "Earn points to redeem later" 0.2 3.4 300 58),\
$(txt "at participating sponsors" 6.6 9.0 300 58)" $enc $W/s3.mp4

# 5) Realm beauty shots: dragon then cyber
ffmpeg -y -v error -ss 3.5 -t 5.8 -i $W/pre4.mp4 $sil -vf "\
$(txt "Rare heists, fates, and events can be witnessed" 0.5 5.3 300 42)" $enc $W/s4.mp4
ffmpeg -y -v error -ss 3.5 -t 5.8 -i $W/pre5.mp4 $sil -vf "\
$(txt "A new world every visit." 0.5 5.3)" $enc $W/s5.mp4

# 5b) Sponsor pitch: header link -> Become a Sponsor dialog with tiers
ffmpeg -y -v error -ss 3.2 -t 7.5 -i $W/pre9.mp4 $sil -vf "\
$(txt "Own a local spot?" 0.4 3.0),\
$(txt "Sponsor the app in two taps" 3.4 7.2 300 58)" $enc $W/s5b.mp4

# 6.5) Sora outro (reaper dissolves, plate drops with a clang — clean, no captions)
ffmpeg -y -v error -i /app/scripts/promo_outro.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30" \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s6b.mp4

# 7) End card 7s: ALL RED lines appearing in sequence top to bottom
RED=0xE8232B
ffmpeg -y -v error -f lavfi -i "color=c=0x0E0E0E:s=1080x1920:d=7:r=30" -i /app/frontend/public/logo-crest.png $sil \
 -filter_complex "[1:v]scale=360:-1[logo];[0:v][logo]overlay=(W-w)/2:300[v0];[v0]\
drawtext=fontfile=$SERIF:text='Fork·Fate':fontcolor=$RED:fontsize=88:x=(w-text_w)/2:y=740:enable='gte(t,0.4)',\
drawtext=fontfile=$SERIF:text='Let fate decide':fontcolor=$RED:fontsize=100:x=(w-text_w)/2:y=950+12*sin(2*PI*t/2.4):enable='gte(t,1.4)',\
drawtext=fontfile=$SANS:text='fork-fate.com':fontcolor=$RED:fontsize=72:x=(w-text_w)/2:y=1210:enable='gte(t,2.4)',\
drawtext=fontfile=$SANS:text='Sponsors welcome':fontcolor=$RED:fontsize=52:x=(w-text_w)/2:y=1400:enable='gte(t,3.4)',\
drawtext=fontfile=$SANS:text='© 2026 Fork·Fate · All rights reserved':fontcolor=$RED:fontsize=38:x=(w-text_w)/2:y=1580:enable='gte(t,4.4)'[v]" \
 -map "[v]" -map 2:a -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -t 7 $W/s6.mp4

# Concat
for i in 0 1 1b 1c 2 3 4 5 5b 6; do echo "file '$W/s$i.mp4'"; done > $W/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $W/list.txt -c copy $W/concat.mp4

# Music bed from 8s on (loop 26s ambient), duck under, fade out at tail
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 $W/concat.mp4)
FADE=$(python3 -c "print(float('$DUR')-4)")
ffmpeg -y -v error -i $W/concat.mp4 -stream_loop 3 -i /app/frontend/public/reaper-ambient.mp3 \
 -filter_complex "[1:a]adelay=7800|7800,volume=0.6,afade=t=in:st=7.8:d=1.5,afade=t=out:st=$FADE:d=4[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k /app/frontend/public/promo/forkfate-promo.mp4
echo "FINAL:"; ffprobe -v quiet -show_entries format=duration,size -of csv=p=0 /app/frontend/public/promo/forkfate-promo.mp4
