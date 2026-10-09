import sys, glob
from PIL import Image
d=sys.argv[1]; fs=sorted(glob.glob(d+'/[td]*.jpg'))
print([f.split('/')[-1] for f in fs])
for i in range(0,len(fs),4):
    sheet=Image.new('RGB',(1920,1080))
    for j,f in enumerate(fs[i:i+4]):
        im=Image.open(f).resize((960,540)); sheet.paste(im,((j%2)*960,(j//2)*540))
    sheet.save(f'{d}/sheet{i//4}.jpg',quality=82)
