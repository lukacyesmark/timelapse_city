import subprocess, time, os
S, W, N, E = 28.55, 77.13, 28.71, 77.31
UA = 'delhi-timelapse/1.0 (personal video project)'
def ov(name, q):
    f = f'raw/{name}.json'
    if os.path.exists(f) and os.path.getsize(f) > 1000: return
    for k in range(5):
        r = subprocess.run(['curl','-s','-m','180','-A',UA,'-o',f,'-w','%{http_code}','--data-urlencode','data='+q,'https://overpass-api.de/api/interpreter'],capture_output=True,text=True)
        if r.stdout.strip() == '200' and os.path.getsize(f) > 500: print(name, os.path.getsize(f)); return
        print(name, 'retry', r.stdout); time.sleep(10)
BB = f'({S},{W},{N},{E})'
ov('water', f'[out:json][timeout:120];(relation["natural"="water"]["name"~"Yamuna|Jumna"]{BB};way["waterway"="riverbank"]{BB};way["natural"="water"]["name"~"Yamuna|Jumna"]{BB};way["waterway"="river"]["name"~"Yamuna"]{BB};);out geom({S},{W},{N},{E});')
time.sleep(3)
ov('bridges', f'[out:json][timeout:90];way["bridge"]["name"~"Yamuna|Wazirabad|Signature|ITO|Nizamuddin|Okhla|Sarai Kale Khan|Geeta Colony|Loha|Old Yamuna|Shastri Park|Vikas Marg|DND|Barapullah|Ring Railway|Kalindi"]{BB};out geom;')
time.sleep(3)
ov('roads', f'[out:json][timeout:180];way["highway"~"^(motorway|trunk|primary|secondary)$"]{BB};out geom({S},{W},{N},{E});')
time.sleep(3)
ov('named', f'[out:json][timeout:120];nwr["name"~"^(Red Fort|Lal Qila|Qutb Minar|Jama Masjid|Humayun|India Gate|Rashtrapati Bhavan|Purana Qila|Lotus Temple|Safdarjung|Tughlaqabad|Jantar Mantar|Akshardham|Connaught Place|Parliament|Sansad|Lodhi|Hauz Khas|Siri Fort|Feroz Shah Kotla|Raj Ghat|Old Delhi)"]({S},{W},{N},{E});out center tags;')
time.sleep(3)
ov('hist', f'[out:json][timeout:120];(way["historic"~"city_walls|ruins|archaeological_site|fort"]{BB};);out geom({S},{W},{N},{E});')
print('done')
