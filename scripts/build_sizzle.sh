#!/bin/bash
# Fork-Fate sizzle reels (~21s) v2: cuts come from the CLEAN pre-pass footage
# (no burned captions), then each caption is drawn to span its ENTIRE cut —
# no mid-cut caption pops, no orphaned walkthrough arrows.
# Outputs:
#   /app/frontend/public/promo/forkfate-sizzle-9x16.mp4  (portrait, social)
#   /app/frontend/public/promo/forkfate-sizzle-16x9.mp4  (landscape, deck)
set -e
SERIF=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
OUT=/app/frontend/public/promo
mkdir -p $OUT
PBOX="split[bg][fg];[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=24:2,eq=brightness=-0.18[b];[fg]scale=-2:1080:flags=lanczos[f];[b][f]overlay=(W-w)/2:0,fps=30"

build() { # build <workdir> <tmpdir> <outfile> <caption-y> <intro-filter> <shuffle-ss> <reveal-ss> <sponsor-ss> <points-ss>
  local S=$1 T=$2 O=$3 CY=$4 INTRO=$5 SH=$6 RV=$7 SP=$8 PT=$9
  mkdir -p $T
  local enc="-c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 -shortest"
  local sil="-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100"
  tx() { # tx "TEXT" [size] — spans the whole cut, red, boxed, slow bob
    echo "drawtext=fontfile=$SERIF:text='$1':fontcolor=0xE8232B:fontsize=${2:-58}:box=1:boxcolor=black@0.65:boxborderw=22:x=(w-text_w)/2:y=$CY+10*sin(2*PI*t/2.4)"
  }
  # c0: Sora hook (has audio), caption on the full cut
  ffmpeg -y -v error -ss 4.6 -t 3.4 -i /app/scripts/promo_intro.mp4 -filter_complex \
    "[0:v]$INTRO,$(tx "Let fate pick your table.")[v]" -map "[v]" -map 0:a \
    -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 $T/c0.mp4
  # realm flashes (clean scenery)
  ffmpeg -y -v error -ss 4.5 -t 1.4 -i $S/pre6.mp4 $sil -vf "$(tx "11 immersive worlds")" $enc $T/c1.mp4
  ffmpeg -y -v error -ss 4.5 -t 1.4 -i $S/pre7.mp4 $sil -vf "$(tx "each with its own vibe")" $enc $T/c2.mp4
  # shuffle + reveal from the clean deal recording (offsets frame-verified
  # per format — desktop and mobile recordings hit these moments at
  # different times)
  ffmpeg -y -v error -ss $SH -t 2.5 -i $S/pre2.mp4 $sil -vf "$(tx "Fate shuffles real local spots" 54)" $enc $T/c3.mp4
  ffmpeg -y -v error -ss $RV -t 2.8 -i $S/pre2.mp4 $sil -vf "$(tx "Your table is written")" $enc $T/c4.mp4
  # sponsor pitch (past the guided-overlay flash at the top of the recording)
  ffmpeg -y -v error -ss $SP -t 3.2 -i $S/pre9.mp4 $sil -vf "$(tx "Own a local spot or franchise?" 52)" $enc $T/c5.mp4
  # fate points dialog (starts once the dialog is fully open)
  ffmpeg -y -v error -ss $PT -t 3.0 -i $S/pre3.mp4 $sil -vf "$(tx "Earn points — redeem in town" 54)" $enc $T/c6.mp4
  # end card (its own timed line reveals are intentional)
  ffmpeg -y -v error -ss 0 -t 4.8 -i $S/s6.mp4 $enc $T/c7.mp4
  for i in 0 1 2 3 4 5 6 7; do echo "file '$T/c$i.mp4'"; done > $T/list.txt
  ffmpeg -y -v error -f concat -safe 0 -i $T/list.txt -c copy $T/cc.mp4
  local DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 $T/cc.mp4)
  local FADE=$(python3 -c "print(float('$DUR')-3.0)")
  ffmpeg -y -v error -i $T/cc.mp4 -i /app/frontend/public/reaper-ambient.mp3 \
   -filter_complex "[1:a]volume=0.55,afade=t=in:st=0:d=1,afade=t=out:st=$FADE:d=2.8[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" \
   -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k $O
  echo "SIZZLE $O:"; ffprobe -v quiet -show_entries format=duration,size -of csv=p=0 $O
}

rm -rf /tmp/sizzle_p /tmp/sizzle_l
build /tmp/promo_work  /tmp/sizzle_p $OUT/forkfate-sizzle-9x16.mp4 300 "scale=1080:1920:flags=lanczos,fps=30" 20.9 28.0 4.6 7.0
build /tmp/promo_lwork /tmp/sizzle_l $OUT/forkfate-sizzle-16x9.mp4 905 "$PBOX" 21.2 27.8 4.8 7.0
