#!/bin/bash
# Fork-Fate sizzle reels (~21s): fast cuts from the finished promo segments.
# Outputs:
#   /app/frontend/public/promo/forkfate-sizzle-9x16.mp4  (portrait, social)
#   /app/frontend/public/promo/forkfate-sizzle-16x9.mp4  (landscape, deck)
set -e
P=/tmp/promo_work    # portrait segments (from assemble_promo.sh)
L=/tmp/promo_lwork   # landscape segments (from assemble_promo_landscape.sh)
OUT=/app/frontend/public/promo
mkdir -p $OUT

build() { # build <workdir> <tmpdir> <outfile>
  local S=$1 T=$2 O=$3
  mkdir -p $T
  local enc="-c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100"
  cut() { ffmpeg -y -v error -ss $2 -t $3 -i $S/$1.mp4 $enc $T/$4.mp4; }
  cut s0  4.6 3.4 c0   # "Let fate pick your table." hook (Sora, has audio)
  cut s1b 0   1.4 c1   # tiki flash
  cut s1c 0   1.4 c2   # fairy flash
  cut s2  16.6 2.8 c3  # "Fate shuffles real local spots"
  cut s2  23.0 2.8 c4  # "Your table is written"
  cut s5b 0   3.2 c5   # "Own a local spot or franchise?"
  cut s3  0   3.0 c6   # points/coupon line
  cut s6  0   4.8 c7   # end card (amb audio)
  for i in 0 1 2 3 4 5 6 7; do echo "file '$T/c$i.mp4'"; done > $T/list.txt
  ffmpeg -y -v error -f concat -safe 0 -i $T/list.txt -c copy $T/cc.mp4
  local DUR=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 $T/cc.mp4)
  local FADE=$(python3 -c "print(float('$DUR')-3.0)")
  ffmpeg -y -v error -i $T/cc.mp4 -i /app/frontend/public/reaper-ambient.mp3 \
   -filter_complex "[1:a]volume=0.55,afade=t=in:st=0:d=1,afade=t=out:st=$FADE:d=2.8[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0[a]" \
   -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k $O
  echo "SIZZLE $O:"; ffprobe -v quiet -show_entries format=duration,size -of csv=p=0 $O
}

build $P /tmp/sizzle_p $OUT/forkfate-sizzle-9x16.mp4
build $L /tmp/sizzle_l $OUT/forkfate-sizzle-16x9.mp4
