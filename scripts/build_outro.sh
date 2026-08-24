#!/bin/bash
# Outro v7 (9.5s): eyes flash then fade with the reaper (chuckle) -> the
# plate simply STAYS exactly where it is (no movement, no swap) -> the FF
# crest fades in mid-scene -> scene fades to black under the crest.
set -e
S=/app/scripts
ffmpeg -y -v error -sseof -3 -i $S/promo_intro.mp4 -vn -c:a aac $S/reaper_laugh.m4a

ffmpeg -y -v error \
 -loop 1 -t 4.8 -i $S/outro_f1.png \
 -loop 1 -t 4.8 -i $S/outro_f1b_n.png \
 -loop 1 -t 4.7 -i $S/outro_f1b_n.png \
 -loop 1 -t 4.8 -i $S/eye_glow.png \
 -loop 1 -t 4.7 -i /app/frontend/public/logo-crest.png \
 -i $S/reaper_laugh.m4a \
 -stream_loop 1 -i $S/intro_amb.m4a \
 -filter_complex "\
[0:v]scale=1080:1920:flags=lanczos,fps=30,setsar=1[f1];\
[3:v]scale=70:-1,format=rgba,fade=t=in:st=0.7:d=0.15:alpha=1,fade=t=out:st=1.6:d=1.8:alpha=1,split=2[glow1][glow2];\
[f1][glow1]overlay=x=457:y=553:enable='gte(t,0.7)'[f1a];\
[f1a][glow2]overlay=x=575:y=553:enable='gte(t,0.7)'[a];\
[1:v]fps=30,setsar=1[b];\
[a][b]xfade=transition=fade:duration=2.8:offset=1.4,trim=0:4.8,setpts=PTS-STARTPTS[ab];\
[2:v]fps=30,setsar=1,fade=t=out:st=3.9:d=0.8[e0];\
[4:v]scale=360:-1,format=rgba,fade=t=in:st=1.0:d=0.6:alpha=1[logo];\
[e0][logo]overlay=x=360:y=780:enable='gte(t,1.0)'[e];\
[ab][e]concat=n=2:v=1:a=0[v];\
[5:a]adelay=1400|1400,volume=0.9[laugh];\
[6:a]volume=0.6[bed];\
[laugh][bed]amix=inputs=2:duration=longest:dropout_transition=0,atrim=0:9.5[aud]" \
 -map "[v]" -map "[aud]" -t 9.5 \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 \
 $S/promo_outro.mp4
echo "outro v7 built:"; ffprobe -v quiet -show_entries format=duration -of csv=p=0 $S/promo_outro.mp4
