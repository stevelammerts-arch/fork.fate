#!/bin/bash
# Assemble Fork-Fate promo v5 (9:16, ~80s): Sora intro + NEW app footage + Sora
# outro + end card. Changes vs v4:
#  * ALL sponsor content consolidated into ONE chapter (scratch-off -> points/
#    coupon -> become-a-sponsor) right before the outro — it was split in two.
#  * Tutorial segment gets its own generated music bed (tutorial_music.wav via
#    Fal Lyria 2); reaper-ambient carries the rest, as before.
# Output: /app/frontend/public/promo/forkfate-promo.mp4 (1080x1920)
set -e
R=/app/scripts/promo_rec
W=/tmp/promo_work
SERIF=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
SANS=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
mkdir -p $W /app/frontend/public/promo

enc="-c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -shortest"
sil="-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100"

txt() { # txt "TEXT" start end [y] [size]
  echo "drawtext=fontfile=$SERIF:text='$1':fontcolor=0xE8232B:fontsize=${5:-66}:box=1:boxcolor=black@0.65:boxborderw=24:x=(w-text_w)/2:y=${4:-300}+16*sin(2*PI*t/2.4):enable='between(t,$2,$3)'"
}

# 1) Sora intro (has audio) 8s: hook lines
ffmpeg -y -v error -i /app/scripts/promo_intro.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30,\
$(txt "Torn on where to eat?" 0.8 4.2),\
$(txt "Let fate pick your table." 4.6 7.8)" \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s0.mp4

# Pre-pass: normalize each webm (done separately by prep step; see pre())
pre() { ffmpeg -y -v error -i "$1" -vf "scale=1080:1920:flags=lanczos,fps=30,setpts=1.15*PTS" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -g 15 -an "$2"; }
pre "$(ls $R/1_parchment/*.webm)" $W/pre1.mp4
pre "$(ls $R/2_deal/*.webm)" $W/pre2.mp4
pre "$(ls $R/3_points/*.webm)" $W/pre3.mp4
pre "$(ls $R/4_dragon/*.webm)" $W/pre4.mp4
pre "$(ls $R/6_tiki/*.webm)" $W/pre6.mp4
pre "$(ls $R/7_fairy/*.webm)" $W/pre7.mp4
pre "$(ls $R/9_sponsor/*.webm)" $W/pre9.mp4

# 2) Parchment -> realm chooser
ffmpeg -y -v error -ss 6.2 -t 9.2 -i $W/pre1.mp4 $sil -vf "\
$(txt "Your field guide awaits..." 0.2 1.7 300 64),\
$(txt "Choose your realm" 3.2 6.2),\
$(txt "11 immersive worlds" 6.5 9.1),\
$(txt "each with its own vibe" 6.5 9.1 415 52)" $enc $W/s1.mp4

# 2b) Quick clean realm flashes
ffmpeg -y -v error -ss 4.5 -t 1.4 -i $W/pre6.mp4 $sil -vf "$(txt "11 immersive worlds" 0 1.4),$(txt "each with its own vibe" 0 1.4 415 52)" $enc $W/s1b.mp4
ffmpeg -y -v error -ss 4.5 -t 1.4 -i $W/pre7.mp4 $sil -vf "$(txt "11 immersive worlds" 0 1.4),$(txt "each with its own vibe" 0 1.4 415 52)" $enc $W/s1c.mp4

# 3) TUTORIAL: guided walkthrough -> shuffle -> reveal. Ends on the reveal —
#    the sponsor scratch-off moment moves to the sponsor chapter (s2b).
ffmpeg -y -v error -ss 4.6 -t 25.2 -i $W/pre2.mp4 $sil -vf "\
$(txt "Step 1 · What calls to you?" 0.2 2.4 300 60),\
$(txt "Step 2 · Where are you?" 3.6 7.4 300 60),\
$(txt "Step 3 · Pick the vibe — or let fate" 9.8 12.0 300 54),\
$(txt "Step 4 · Seal the ritual" 12.4 15.2 300 60),\
$(txt "Fate shuffles real local spots" 16.6 20.0 300 62),\
$(txt "Your table is written" 22.2 25.0)" $enc $W/s2.mp4

# 4) Realm beauty shot: dragon rares
ffmpeg -y -v error -ss 3.5 -t 4.8 -i $W/pre4.mp4 $sil -vf "\
$(txt "Rare heists, fates, and events" 0.5 4.6 300 64),\
$(txt "can be witnessed" 0.5 4.6 415 64),\
$(txt "and accrue redeemable points" 0.5 4.6 545 52),\
$(txt "every daily visit" 0.5 4.6 645 52)" $enc $W/s4.mp4

# ---- SPONSOR CHAPTER (everything sponsor-related in ONE place) ----
# 5a) The reveal's sponsor scratch-off with flashing arrow
ffmpeg -y -v error -ss 29.8 -t 3.2 -i $W/pre2.mp4 $sil -i /app/scripts/promo_arrow.png -filter_complex "\
[0:v]$(txt "Sponsor deals ride along" 0.2 3.0)[t];\
[t][2:v]overlay=x=513:y=860:enable='between(t,0.2,3.0)*lt(mod(t,0.7),0.45)'[v]" \
 -map "[v]" -map 1:a -shortest -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s2b.mp4

# 5b) Fate Points -> cashier coupon
ffmpeg -y -v error -ss 5.9 -t 8.4 -i $W/pre3.mp4 $sil -vf "\
$(txt "Earn points to redeem later" 0.2 3.4 300 58),\
$(txt "at participating sponsors" 6.4 8.2 300 58)" $enc $W/s3.mp4

# 5c) Become-a-sponsor pitch: header link -> tier dialog
ffmpeg -y -v error -ss 3.2 -t 6.8 -i $W/pre9.mp4 $sil -vf "\
$(txt "Own a local spot or franchise?" 0.4 3.0 300 56),\
$(txt "Sponsor the app in two taps" 3.4 6.6 300 58)" $enc $W/s5b.mp4

# 6) Sora outro (clean, no captions)
ffmpeg -y -v error -i /app/scripts/promo_outro.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30" \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $W/s6b.mp4

# 7) End card 7s
RED=0xE8232B
ffmpeg -y -v error -f lavfi -i "color=c=0x0E0E0E:s=1080x1920:d=7:r=30" -i /app/frontend/public/logo-crest.png -stream_loop 1 -i /app/scripts/intro_amb.m4a \
 -filter_complex "[1:v]scale=360:-1[logo];[0:v][logo]overlay=(W-w)/2:780[v0];[v0]\
drawtext=fontfile=$SERIF:text='Fork·Fate':fontcolor=$RED:fontsize=88:x=(w-text_w)/2:y=1200:enable='gte(t,0.4)',\
drawtext=fontfile=$SERIF:text='Let fate decide':fontcolor=$RED:fontsize=100:x=(w-text_w)/2:y=1330+12*sin(2*PI*t/2.4):enable='gte(t,1.4)',\
drawtext=fontfile=$SANS:text='fork-fate.com':fontcolor=$RED:fontsize=72:x=(w-text_w)/2:y=1500:enable='gte(t,2.4)',\
drawtext=fontfile=$SANS:text='Local + franchise sponsors welcome':fontcolor=$RED:fontsize=44:x=(w-text_w)/2:y=1640:enable='gte(t,3.4)',\
drawtext=fontfile=$SANS:text='© 2026 Fork·Fate · All rights reserved':fontcolor=$RED:fontsize=38:x=(w-text_w)/2:y=1760:enable='gte(t,4.4)'[v];\
[2:a]volume=0.5,afade=t=out:st=4.4:d=2.5,atrim=0:7[aa]" \
 -map "[v]" -map "[aa]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -t 7 $W/s6.mp4

# Concat: intro -> parchment/realms -> TUTORIAL -> rares -> SPONSOR CHAPTER -> outro -> end
for i in 0 1 1b 2 4 2b 3 5b 6b 6; do echo "file '$W/s$i.mp4'"; done > $W/list.txt
ffmpeg -y -v error -f concat -safe 0 -i $W/list.txt -c copy $W/concat.mp4

# ---- MUSIC BEDS ----
d() { ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$1"; }
DUR=$(d $W/concat.mp4)
TUT_START=$(python3 -c "print($(d $W/s0.mp4)+$(d $W/s1.mp4)+$(d $W/s1b.mp4)+$(d $W/s1c.mp4))")
TUT_LEN=$(d $W/s2.mp4)
TUT_END=$(python3 -c "print($TUT_START+$TUT_LEN)")
FADE=$(python3 -c "print(float('$DUR')-19.5)")
B_LEN=$(python3 -c "print(float('$FADE')+3.0-float('$TUT_END'))")
TUT_MS=$(python3 -c "print(int(float('$TUT_START')*1000))")
TUTEND_MS=$(python3 -c "print(int(float('$TUT_END')*1000))")
echo "DUR=$DUR TUT_START=$TUT_START TUT_END=$TUT_END FADE=$FADE"

# Bed A: reaper-ambient from 7.8s, fading OUT into the tutorial.
# Bed T: generated tutorial music exactly over the tutorial segment.
# Bed B: reaper-ambient returns after the tutorial, fading out before the outro
#        so the Sora hall ambience carries the outro + end card alone.
ffmpeg -y -v error -i $W/concat.mp4 \
 -stream_loop 3 -i /app/frontend/public/reaper-ambient.mp3 \
 -i /app/scripts/tutorial_music.wav \
 -stream_loop 3 -i /app/frontend/public/reaper-ambient.mp3 \
 -filter_complex "\
[1:a]atrim=0:$(python3 -c "print(float('$TUT_START')-7.8+1.2)"),adelay=7800|7800,volume=0.6,afade=t=in:st=7.8:d=1.5,afade=t=out:st=$(python3 -c "print(float('$TUT_START')-1.2)"):d=1.2[ma];\
[2:a]atrim=0:$TUT_LEN,adelay=$TUT_MS|$TUT_MS,volume=0.5,afade=t=in:st=$TUT_START:d=1.2,afade=t=out:st=$(python3 -c "print(float('$TUT_END')-1.6)"):d=1.6[mt];\
[3:a]atrim=0:$B_LEN,adelay=$TUTEND_MS|$TUTEND_MS,volume=0.6,afade=t=in:st=$TUT_END:d=1.5,afade=t=out:st=$FADE:d=3[mb];\
[0:a][ma][mt][mb]amix=inputs=4:duration=first:dropout_transition=0:normalize=0[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k /app/frontend/public/promo/forkfate-promo.mp4
echo "FINAL:"; ffprobe -v quiet -show_entries format=duration,size -of csv=p=0 /app/frontend/public/promo/forkfate-promo.mp4
