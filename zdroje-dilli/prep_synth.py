"""Variant B: no OSM available -> stylised Yamuna, bridges and road network built from known coordinates.
All geometry here is APPROXIMATE (hand-placed from public landmark positions), not survey data."""
import json, math, random
import numpy as np
from PIL import Image, ImageDraw
LAT0, LON0 = 28.60, 77.21
KX = 111320*math.cos(math.radians(LAT0)); KY = 110574
S_, W_, N_, E_ = 28.50, 77.11, 28.70, 77.31
BB = ((W_-LON0)*KX, (S_-LAT0)*KY, (E_-LON0)*KX, (N_-LAT0)*KY)
def loc(lat, lon): return ((lon-LON0)*KX, (lat-LAT0)*KY)
random.seed(7)
def catmull(pts, step=60.0):
    P = [pts[0]]+pts+[pts[-1]]; out=[]
    for i in range(1, len(P)-2):
        p0,p1,p2,p3 = P[i-1],P[i],P[i+1],P[i+2]; L=math.hypot(p2[0]-p1[0],p2[1]-p1[1]); m=max(1,int(L/step))
        for k in range(m):
            t=k/m; t2=t*t; t3=t2*t
            out.append([0.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3) for j in range(len(p1))])
    out.append(list(pts[-1])); return out
# ---- Yamuna centreline (lat, lon, half-width m), north -> south
YM = [(28.715,77.2375,200),(28.700,77.2350,210),(28.690,77.2355,230),(28.680,77.2400,240),(28.672,77.2455,250),(28.662,77.2492,260),(28.652,77.2515,270),(28.640,77.2512,280),(28.628,77.2502,290),(28.621,77.2557,300),(28.615,77.2650,320),(28.607,77.2695,330),(28.598,77.2705,340),(28.590,77.2718,350),(28.583,77.2762,350),(28.575,77.2852,350),(28.567,77.2950,330),(28.558,77.3012,320),(28.548,77.3072,320),(28.535,77.3138,320),(28.520,77.3205,320),(28.500,77.3290,320),(28.480,77.3370,320)]
C = catmull([[*loc(a,b), w] for a,b,w in YM], 50.0)
L=[];R=[]
for i,(e,n,w) in enumerate(C):
    a=C[max(0,i-1)]; b=C[min(len(C)-1,i+1)]; dx,dy=b[0]-a[0],b[1]-a[1]; m=math.hypot(dx,dy) or 1; nx,ny=-dy/m,dx/m
    w2 = w*(0.9+0.2*math.sin(i*0.37)+0.08*math.sin(i*1.9))
    L.append([round(e+nx*w2,1),round(n+ny*w2,1)]); R.append([round(e-nx*w2,1),round(n-ny*w2,1)])
ring = L + R[::-1]
json.dump({'bb':BB,'rings':[ring]}, open('data/water.json','w'))
# raster mask of water (10 m px) for cutting roads
MS=10.0; MW=int((BB[2]-BB[0])/MS)+1; MH=int((BB[3]-BB[1])/MS)+1
im=Image.new('L',(MW,MH),0); ImageDraw.Draw(im).polygon([((x-BB[0])/MS,(y-BB[1])/MS) for x,y in ring], fill=255)
WM=np.array(im)>0
def wat(p):
    x=int((p[0]-BB[0])/MS); y=int((p[1]-BB[1])/MS)
    return 0<=x<MW and 0<=y<MH and WM[y,x]
# ---- bridges (name, year, lat/lon ends) -- years: see notes; '~' ones approximate
BR = [('Old Yamuna Bridge',1866,[(28.6631,77.2452),(28.6627,77.2540)]),
      ('ITO Bridge',1965,[(28.6283,77.2462),(28.6283,77.2548)]),
      ('Nizamuddin Bridge',1971,[(28.5913,77.2655),(28.5919,77.2775)]),
      ('DND Flyway',2001,[(28.5722,77.2780),(28.5726,77.2925)])]
bridges=[]
for nm,yr,ends in BR:
    a=loc(*ends[0]); b=loc(*ends[1]); mid=[(a[0]+b[0])/2,(a[1]+b[1])/2]
    pts=[a,mid,b]; bridges.append({'name':nm,'year':yr,'pts':[[round(x),round(y)] for x,y in pts],'len':round(math.hypot(b[0]-a[0],b[1]-a[1]))})
json.dump(bridges, open('data/bridges.json','w'))
# ---- roads
roads=[]
def add(c, pts, name='', cut=True, wig=0):
    pts=catmull(pts,40.0) if len(pts)>2 else pts
    if wig: pts=[[x+wig*math.sin(i*0.45)+0, y+wig*math.cos(i*0.37)] for i,(x,y) in enumerate(pts)]
    run=[]
    def flush():
        nonlocal run
        if len(run)>=2:
            s=[run[0]]
            # RDP-lite: keep every point at >=24 m spacing
            for q in run[1:-1]:
                if math.hypot(q[0]-s[-1][0],q[1]-s[-1][1])>=24: s.append(q)
            s.append(run[-1])
            if len(s)>=2: roads.append({'c':c,'p':[round(v) for xy in s for v in xy],'n':name[:24],'b':0})
        run=[]
    for q in pts:
        inb = BB[0]<=q[0]<=BB[2] and BB[1]<=q[1]<=BB[3]
        if (cut and wat(q)) or not inb: flush(); continue
        run.append(q)
    flush()
def ll_(l): return [loc(a,b) for a,b in l]
ART = [ # class, name, [(lat,lon)...]
 (4,'Ring Road',[(28.6920,77.1950),(28.6820,77.2090),(28.6700,77.2290),(28.6560,77.2330),(28.6400,77.2350),(28.6300,77.2400),(28.6120,77.2530),(28.5880,77.2580),(28.5700,77.2540),(28.5640,77.2330),(28.5670,77.2090),(28.5800,77.1840),(28.5918,77.1620),(28.6130,77.1450),(28.6350,77.1330),(28.6490,77.1220),(28.6680,77.1320),(28.6800,77.1580),(28.6920,77.1950)]),
 (4,'Outer Ring Road',[(28.5230,77.1560),(28.5400,77.1640),(28.5570,77.1740),(28.5530,77.1900),(28.5494,77.2010),(28.5500,77.2250),(28.5480,77.2530),(28.5420,77.2780),(28.5330,77.2950)]),
 (4,'Grand Trunk Road',[(28.6678,77.2290),(28.6800,77.2200),(28.6900,77.2140),(28.7000,77.2100)]),
 (3,'Chandni Chowk',[(28.6562,77.2400),(28.6560,77.2300),(28.6575,77.2190),(28.6585,77.2100)]),
 (3,'Rajpath',[(28.6129,77.2295),(28.6140,77.2150),(28.6150,77.1995)]),
 (3,'Janpath',[(28.6315,77.2167),(28.6250,77.2185),(28.6180,77.2200)]),
 (3,'Barakhamba Road',[(28.6330,77.2230),(28.6310,77.2330),(28.6290,77.2420)]),
 (4,'Mathura Road',[(28.6290,77.2410),(28.6125,77.2440),(28.5990,77.2490),(28.5880,77.2580),(28.5700,77.2640),(28.5560,77.2680),(28.5400,77.2760),(28.5200,77.2900)]),
 (4,'Aurobindo Marg',[(28.5940,77.2150),(28.5680,77.2070),(28.5440,77.1960),(28.5245,77.1860)]),
 (3,'Lodhi Road',[(28.5930,77.2400),(28.5930,77.2250),(28.5900,77.2100),(28.5880,77.1920),(28.5900,77.1750)]),
 (3,'Mehrauli Badarpur Road',[(28.5240,77.1850),(28.5300,77.2100),(28.5200,77.2400),(28.5080,77.2700),(28.5020,77.2950)]),
 (5,'NH48',[(28.5918,77.1620),(28.5700,77.1400),(28.5500,77.1200),(28.5400,77.1100)]),
 (4,'NH24',[(28.5918,77.2775),(28.5950,77.2950),(28.5980,77.3100)]),
 (4,'Vikas Marg',[(28.6283,77.2560),(28.6290,77.2800),(28.6300,77.3100)]),
 (3,'GT Road East',[(28.6627,77.2540),(28.6700,77.2900),(28.6800,77.3100)]),
 (5,'DND Flyway',[(28.5726,77.2925),(28.5700,77.3000),(28.5660,77.3100)]),
 (3,'Najafgarh Road',[(28.6490,77.1220),(28.6460,77.1500),(28.6450,77.1800),(28.6410,77.2050)]),
 (3,'Ridge Road',[(28.6860,77.2250),(28.6700,77.2150),(28.6500,77.2000),(28.6350,77.1900),(28.6130,77.1750),(28.6000,77.1650)]),
 (3,'Rani Jhansi Road',[(28.6560,77.2240),(28.6460,77.2130),(28.6380,77.2020)]),
 (3,'Ring Railway Road',[(28.6700,77.2290),(28.6500,77.2480)]),
 (3,'Tughlaqabad Road',[(28.5090,77.2630),(28.5300,77.2500),(28.5480,77.2400),(28.5480,77.2530)]),
 (2,'Nizamuddin Road',[(28.5880,77.2580),(28.5930,77.2500),(28.5950,77.2400)]),
]
for c,nm,l in ART: add(c, ll_(l), nm)
# ---- local street grids (zones of 1500 m, own random orientation), organic wiggle
def fb(x,y,s):
    return 0.5+0.5*math.sin(x*1.3+s)*math.cos(y*0.9-s*1.7)
Zs=1500.0
zi0=int(BB[0]//Zs); zi1=int(BB[2]//Zs); zj0=int(BB[1]//Zs); zj1=int(BB[3]//Zs)
rr=random.Random(11)
for zi in range(zi0,zi1+1):
  for zj in range(zj0,zj1+1):
    ze=(zi+0.5)*Zs; zn=(zj+0.5)*Zs; th=-0.3+(fb(zi*0.55+3,zj*0.55+1,4)-0.5)*1.5; ct,st=math.cos(th),math.sin(th)
    du=rr.uniform(300,380); dv=rr.uniform(380,470); off=rr.uniform(0,1)
    for ax in (0,1):
      step=du if ax==0 else dv; n=int(Zs*0.75/step)+1
      for i in range(-n,n+1):
        c=2 if (i%4==0) else 1; q=(i+off*0.3)*step
        pts=[]
        for t in range(-int(Zs*0.78/40),int(Zs*0.78/40)+1):
            tt=t*40.0
            u,v=(q,tt) if ax==0 else (tt,q)
            e=ze+u*ct-v*st; nn=zn+u*st+v*ct
            if abs(e-ze)>Zs/2 or abs(nn-zn)>Zs/2: continue
            pts.append([e+14*math.sin(tt*0.011+i), nn+14*math.cos(tt*0.009+i*0.7)])
        if len(pts)>=2: add(c,pts,'',True)
json.dump(roads, open('data/roads.json','w'), separators=(',',':'))
print('roads',len(roads),sum(len(r['p']) for r in roads)//2,'bridges',len(bridges),'ring',len(ring))
