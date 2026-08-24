#!/bin/bash
# Custom outro: reaper dissolves from the hall, his plate drops to the table
# with the user's clang sample. Built from AI-edited stills of the intro's
# final frame. Output: /app/scripts/promo_outro.mp4 (1080x1920, 8s)
set -e
S=/app/scripts
ffmpeg -y -v error \
 -loop 1 -t 4.2 -i $S/outro_f1.png \
 -loop 1 -t 4.2 -i $S/outro_f2_n.png \
 -loop 1 -t 2.6 -i $S/outro_f3_n.png \
 -i $S/outro_plate.png \
 -i $S/plate-clang.mp3 \
 -i /app/frontend/public/reaper-ambient.mp3 \
 -filter_complex "\
[0:v]scale=1080:1920:flags=lanczos,fps=30,setsar=1[a];\
[1:v]fps=30,setsar=1[b];\
[a][b]xfade=transition=fade:duration=3:offset=1.2[ab];\
[ab][3:v]overlay=x=0:y='if(lt(t,5.05),948-1400*(1-pow((t-4.7)/0.35,2)),if(lt(t,5.2),948-40*sin(PI*(t-5.05)/0.15),948))':enable='between(t,4.7,5.4)'[abp];\
[2:v]fps=30,setsar=1[c];\
[abp][c]concat=n=2:v=1:a=0[v];\
[4:a]adelay=4950|4950,volume=1.1[clang];\
[5:a]volume=0.3,afade=t=out:st=6.3:d=1.7[bed];\
[clang][bed]amix=inputs=2:duration=longest:dropout_transition=0,atrim=0:8[aud]" \
 -map "[v]" -map "[aud]" -t 8 \
 -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -ar 44100 \
 $S/promo_outro.mp4
echo "outro built:"; ffprobe -v quiet -show_entries format=duration -of csv=p=0 $S/promo_outro.mp4
