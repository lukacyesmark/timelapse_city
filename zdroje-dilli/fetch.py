import math, subprocess, json, time, os
LAT0, LON0 = 47.50, 19.04
S, W, N, E = 47.42, 18.93, 47.58, 19.15
def tile(lon, lat, z):
    n = 2**z; x = (lon+180)/360*n; y = (1-math.log(math.tan(math.radians(lat))+1/math.cos(math.radians(lat)))/math.pi)/2*n
    return int(x), int(y)
z = 13
x0, y1 = tile(W, S, z); x1, y0 = tile(E, N, z)
print('tiles', x0, x1, y0, y1, (x1-x0+1)*(y1-y0+1))
json.dump({'z': z, 'x0': x0, 'x1': x1, 'y0': y0, 'y1': y1}, open('data/dem.json','w'))
for x in range(x0, x1+1):
    for y in range(y0, y1+1):
        f = f'data/dem/{x}_{y}.png'
        if not os.path.exists(f) or os.path.getsize(f) < 500:
            subprocess.run(['curl','-s','-m','60','--retry','3','-o',f,f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'])
UA = 'budapest-timelapse/1.0 (personal video project)'
def ov(name, q):
    f = f'raw/{name}.json'
    if os.path.exists(f) and os.path.getsize(f) > 1000: return
    for k in range(4):
        r = subprocess.run(['curl','-s','-m','180','-A',UA,'-o',f,'-w','%{http_code}','--data-urlencode','data='+q,'https://overpass-api.de/api/interpreter'],capture_output=True,text=True)
        if r.stdout.strip() == '200' and os.path.getsize(f) > 500: print(name, os.path.getsize(f)); return
        print(name, 'retry', r.stdout); time.sleep(8)
BB = f'({S},{W},{N},{E})'
CL = f'({S},{W},{N},{E})'
ov('water', f'[out:json][timeout:120];(relation["natural"="water"]["name"~"Duna"]{BB};way["waterway"="riverbank"]{BB};way["natural"="water"]["name"~"Duna"]{BB};);out geom({S},{W},{N},{E});')
time.sleep(3)
ov('bridges', f'[out:json][timeout:90];way["bridge"]["name"~"Lánchíd|Margit híd|Szabadság híd|Erzsébet híd|Petőfi híd|Árpád híd|Rákóczi híd|Lágymányosi|összekötő vasúti"]{BB};out geom;')
time.sleep(3)
ov('roads', f'[out:json][timeout:180];way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]{BB};out geom({S},{W},{N},{E});')
time.sleep(3)
ov('named', f'[out:json][timeout:120];nwr["name"~"^(Országház|Budavári Palota|Királyi Palota|Magyar Állami Operaház|Szent István-bazilika|Citadella|Halászbástya|Mátyás-templom|Rudas|Király Gyógyfürdő|Hősök tere|Gellért Gyógyfürdő|Aquincumi Múzeum|Március 15\\. tér|Budai Vár|Széchenyi István tér|Deák Ferenc tér|Vörösmarty tér|Kossuth Lajos tér)"]({S},{W},{N},{E});out center tags;')
time.sleep(3)
ov('hist', f'[out:json][timeout:120];(way["historic"~"city_walls|ruins|archaeological_site"]{BB};nwr["name"~"Aquincum|Contra"]{BB};);out geom({S},{W},{N},{E});')
print('done')
