import math, subprocess, json, os
# Delhi bounding box (S, W, N, E)
S, W, N, E = 28.50, 77.11, 28.70, 77.31
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
        for k in range(4):
            if os.path.exists(f) and os.path.getsize(f) > 500 and open(f,'rb').read(4) == b'\x89PNG': break
            subprocess.run(['curl','-s','-m','60','-o',f,f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'])
print('ok')
