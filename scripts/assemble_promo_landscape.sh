#!/bin/bash
# Assemble the 16:9 SPONSOR-DECK promo: pillarboxed Sora intro/outro + true
# widescreen desktop app footage, leaning harder into the sponsor pitch.
# Output: /app/frontend/public/promo/forkfate-promo-landscape.mp4 (1920x1080)
set -e
R=/app/scripts/promo_rec_l
W=/tmp/promo_lwork
SERIF=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
SANS=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
mkdir -p $W /app/frontend/public/promo

enc="-c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -shortest"
sil="-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100"

txt() { # txt "TEXT" start end [y] [size] — red lower-third, slow sine bob
  echo "drawtext=fontfile=$SERIF:text='$1':fontcolor=0xE8232B:fontsize=${5:-56}:box=1:boxcolor=black@0.65:boxborderw=22:x=(w-text_w)/2:y=${4:-905}+10*sin(2*PI*t/2.4):enable='between(t,$2,$3)'"
}

# Pillarbox filter for the portrait Sora clips: blurred/darkened cover bg +
# sharp portrait fg centered.
PBOX="split[bg][fg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=24:2,eq=brightness=-0.18[b];[fg]scale=-2:1080:flags=lanczos[f];[b][f]overlay=(W-w)/2:0,fps=30"

# 1) Sora intro (has audio) 8s, pillarboxed
ffmpeg -y -v error -i /app/scripts/promo_intro.mp4 -filter_complex "[0:v]$PBOX,\
$(txt "Torn on where to eat?" 0.8 4.2),\
$(txt "Let fate pick your table." 4.6 7.8)[v]" -map "[v]" -map 0:a \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s0.mp4

# Pre-pass: normalize each webm (regular timestamps/keyframes, 1.15x slow)
pre() { ffmpeg -y -v error -i "$1" -vf "scale=1920:1080:flags=lanczos,fps=30,setpts=1.15*PTS" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -g 15 -an "$2"; }
pre "$(ls $R/1_parchment/*.webm)" $W/pre1.mp4
pre "$(ls $R/2_deal/*.webm)" $W/pre2.mp4
pre "$(ls $R/3_points/*.webm)" $W/pre3.mp4
pre "$(ls $R/4_dragon/*.webm)" $W/pre4.mp4
pre "$(ls $R/6_tiki/*.webm)" $W/pre6.mp4
pre "$(ls $R/7_fairy/*.webm)" $W/pre7.mp4
pre "$(ls $R/9_sponsor/*.webm)" $W/pre9.mp4

# 2) Parchment -> realm chooser (desktop loads slower; captions shifted)
ffmpeg -y -v error -ss 4.0 -t 9.8 -i $W/pre1.mp4 $sil -vf "\
$(txt "Your field guide awaits..." 0.2 4.2),\
$(txt "Choose your realm" 6.3 8.0),\
$(txt "11 immersive worlds — each with its own vibe" 8.2 9.7 905 50)" $enc $W/s1.mp4

# 2b) Quick clean realm flashes (scenery only)
ffmpeg -y -v error -ss 4.5 -t 1.4 -i $W/pre6.mp4 $sil -vf "$(txt "11 immersive worlds — each with its own vibe" 0 1.4 905 50)" $enc $W/s1b.mp4
ffmpeg -y -v error -ss 4.5 -t 1.4 -i $W/pre7.mp4 $sil -vf "$(txt "11 immersive worlds — each with its own vibe" 0 1.4 905 50)" $enc $W/s1c.mp4

# 3) Guided walkthrough -> shuffle -> reveal (in-page arrows mark every tap,
#    including the sponsor scratch-off at the end)
ffmpeg -y -v error -ss 3.6 -t 34.5 -i $W/pre2.mp4 $sil -vf "\
$(txt "Step 1 · What calls to you?" 0.2 3.4 905 52),\
$(txt "Step 2 · Where are you?" 4.8 9.4 905 52),\
$(txt "Step 3 · Pick the vibe — or let fate" 9.8 12.6 905 48),\
$(txt "Step 4 · Seal the ritual" 13.0 15.8 905 52),\
$(txt "Fate shuffles real local spots" 16.6 19.6 905 54),\
$(txt "Your table is written" 23.0 26.0),\
$(txt "Sponsor deals ride along" 26.4 30.8),\
$(txt "Your coupon, front and center" 31.4 34.3 905 52)" $enc $W/s2.mp4

# 4) SPONSOR PITCH (extended): header link -> dialog -> slow scroll over
#    tiers, pricing and the two-tap form
ffmpeg -y -v error -ss 3.2 -t 12.4 -i $W/pre9.mp4 $sil -vf "\
$(txt "Own a local spot or franchise?" 0.4 3.4),\
$(txt "Pinned to the top of every matching shuffle" 3.8 6.8 905 48),\
$(txt "Your coupon rides on every matching reveal" 7.0 9.6 905 48),\
$(txt "Two taps to join — first month free" 9.8 12.2 905 50)" $enc $W/s5b.mp4

# 5) Dragon beauty shot with the rares + points line
ffmpeg -y -v error -ss 3.5 -t 5.8 -i $W/pre4.mp4 $sil -vf "\
$(txt "Rare heists, fates, and events can be witnessed" 0.5 5.3 845 50),\
$(txt "and accrue redeemable points every daily visit" 0.5 5.3 945 50)" $enc $W/s4.mp4

# 6) Fate Points -> coupon (sponsor angle: points come back to your register)
ffmpeg -y -v error -ss 5.9 -t 9.1 -i $W/pre3.mp4 $sil -vf "\
$(txt "Guests earn Fate Points every visit" 0.2 3.4 905 52),\
$(txt "and redeem them at your register" 6.6 9.0 905 52)" $enc $W/s3.mp4

# 7) Sora outro, pillarboxed (reaper dissolves, plate drops, crest)
ffmpeg -y -v error -i /app/scripts/promo_outro.mp4 -filter_complex "[0:v]$PBOX[v]" \
 -map "[v]" -map 0:a -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s6b.mp4

# 8) End card 7s (1920x1080): red stack, sponsor-forward
RED=0xE8232B
ffmpeg -y -v error -f lavfi -i "color=c=0x0E0E0E:s=1920x1080:d=7:r=30" -i /app/frontend/public/logo-crest.png -stream_loop 1 -i /app/scripts/intro_amb.m4a \
 -filter_complex "[1:v]scale=300:-1[logo];[0:v][logo]overlay=(W-w)/2:120[v0];[v0]\
drawtext=fontfile=$SERIF:text='Fork·Fate':fontcolor=$RED:fontsize=72:x=(w-text_w)/2:y=480:enable='gte(t,0.4)',\
drawtext=fontfile=$SERIF:text='Let fate decide':fontcolor=$RED:fontsize=92:x=(w-text_w)/2:y=590+10*sin(2*PI*t/2.4):enable='gte(t,1.4)',\
drawtext=fontfile=$SANS:text='fork-fate.com':fontcolor=$RED:fontsize=60:x=(w-text_w)/2:y=750:enable='gte(t,2.4)',\
drawtext=fontfile=$SANS:text='Local + franchise sponsors welcome':fontcolor=$RED:fontsize=44:x=(w-text_w)/2:y=870:enable='gte(t,3.4)',\
drawtext=fontfile=$SANS:text='© 2026 Fork·Fate · All rights reserved':fontcolor=$RED:fontsize=32:x=(w-text_w)/2:y=970:enable='gte(t,4.4)'[v];\
[2:a]volume=0.5,afade=t=out:st=4.4:d=2.5,atrim=0:7[aa]" \
 -map "[v]" -map "[aa]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -t 7 $W/s6.mp4

# Concat: intro -> guide/chooser -> flashes -> walkthrough -> sponsor pitch ->
# rares -> points -> outro -> end card
for i in 0 1 1b 1c 2 5b 4 3 6b 6; do echo "file '$W/s$i.mp4'"; done > $W/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $W/list.txt -c copy $W/concat.mp4

# Music bed from 8s, fading OUT before the outro
DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 $W/concat.mp4)
FADE=$(python3 -c "print(float('$DUR')-19.5)")
ffmpeg -y -v error -i $W/concat.mp4 -stream_loop 3 -i /app/frontend/public/reaper-ambient.mp3 \
 -filter_complex "[1:a]adelay=7800|7800,volume=0.6,afade=t=in:st=7.8:d=1.5,afade=t=out:st=$FADE:d=3[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k /app/frontend/public/promo/forkfate-promo-landscape.mp4
echo "FINAL:"; ffprobe -v quiet -show_entries format=duration,size -of csv=p=0 /app/frontend/public/promo/forkfate-promo-landscape.mp4
