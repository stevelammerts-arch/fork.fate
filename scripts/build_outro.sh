#!/bin/bash
# Outro v8 (9.5s): eyes flash then fade with the reaper (chuckle) -> as the
# vanish completes, the SAME plate (cutout, no swap) falls to the table with
# a clang + tiny bounce -> the FF crest slowly fades in mid-scene -> scene
# fades to black under the crest.
set -e
S=/app/scripts
ffmpeg -y -v error -sseof -3 -i $S/promo_intro.mp4 -vn -c:a aac $S/reaper_laugh.m4a

# Plate motion: hover at y=963 until 4.3s (vanish done), gravity fall 0.45s
# down 230px, 0.2s bounce, settle at y=1193.
PY="if(lt(t,4.3),963,if(lt(t,4.75),963+230*pow((t-4.3)/0.45,2),if(lt(t,4.95),1193-26*sin(PI*(t-4.75)/0.2),1193)))"

ffmpeg -y -v error \
 -loop 1 -t 9.5 -i $S/outro_f1.png \
 -loop 1 -t 9.5 -i $S/outro_f2_v2_n.png \
 -loop 1 -t 9.5 -i $S/eye_glow.png \
 -loop 1 -t 9.5 -i $S/outro_plate_hover.png \
 -loop 1 -t 9.5 -i /app/frontend/public/logo-crest.png \
 -i $S/reaper_laugh.m4a \
 -i $S/plate-clang.mp3 \
 -stream_loop 1 -i $S/intro_amb.m4a \
 -filter_complex "\
[0:v]scale=1080:1920:flags=lanczos,fps=30,setsar=1[f1];\
[2:v]scale=70:-1,format=rgba,fade=t=in:st=0.7:d=0.15:alpha=1,fade=t=out:st=1.6:d=1.8:alpha=1,split=2[glow1][glow2];\
[f1][glow1]overlay=x=457:y=553:enable='gte(t,0.7)'[f1a];\
[f1a][glow2]overlay=x=575:y=553:enable='gte(t,0.7)'[a];\
[1:v]fps=30,setsar=1[b];\
[a][b]xfade=transition=fade:duration=2.8:offset=1.4,trim=0:9.5,setpts=PTS-STARTPTS[base];\
[3:v]format=rgba[plate];\
[base][plate]overlay=x=95:y='$PY'[bp];\
[bp]fade=t=out:st=8.6:d=0.8[bpf];\
[4:v]scale=360:-1,format=rgba,fade=t=in:st=5.8:d=1.0:alpha=1[logo];\
[bpf][logo]overlay=x=360:y=780:enable='gte(t,5.8)'[v];\
[5:a]adelay=1400|1400,volume=0.9[laugh];\
[6:a]atrim=0:1.4,adelay=4750|4750,volume=0.9[clang];\
[7:a]volume=0.6[bed];\
[laugh][clang][bed]amix=inputs=3:duration=longest:dropout_transition=0,atrim=0:9.5[aud]" \
 -map "[v]" -map "[aud]" -t 9.5 \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 \
 $S/promo_outro.mp4
echo "outro v8 built:"; ffprobe -v quiet -show_entries format=duration -of csv=p=0 $S/promo_outro.mp4
