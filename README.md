# Delhi – 3,000 years in 6 minutes (hotové video)

`delhi-final.mp4` rozdělené na 6 kusů (GitHub nepustí soubor nad 100 MB).
1920×1080, 30 fps, 6:05, H.264 ~12 Mbps + AAC 192 kb/s, 551 MB.

Složení na Macu (v klonu repozitáře, bez přepínání větve):

```bash
git fetch origin delhi-video
for f in 00 01 02 03 04 05; do git show origin/delhi-video:delhi.mp4.part$f; done > ~/Documents/casosber/mesta/delhi-final.mp4
shasum -a 256 ~/Documents/casosber/mesta/delhi-final.mp4   # má sedět s delhi-final.mp4.sha256
```
