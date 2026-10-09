import json, math
LAT0, LON0 = 47.50, 19.04
KX = 111320*math.cos(math.radians(LAT0)); KY = 110574
S_, W_, N_, E_ = 47.42, 18.93, 47.58, 19.15
BB = ((W_-LON0)*KX, (S_-LAT0)*KY, (E_-LON0)*KX, (N_-LAT0)*KY)  # e0,n0,e1,n1
def runs(geom):
    out=[]; cur=[]
    for g in geom or []:
        if g is None:
            if len(cur)>1: out.append(cur)
            cur=[]
        else: cur.append(loc(g))
    if len(cur)>1: out.append(cur)
    return out
def loc(p): return ((p['lon']-LON0)*KX, (p['lat']-LAT0)*KY)
def dist(a,b): return math.hypot(a[0]-b[0], a[1]-b[1])
def rdp(pts, tol):
    if len(pts) < 3: return pts
    keep=[False]*len(pts); keep[0]=keep[-1]=True; st=[(0,len(pts)-1)]
    while st:
        a,b=st.pop(); ax,ay=pts[a]; bx,by=pts[b]; dx,dy=bx-ax,by-ay; L=math.hypot(dx,dy) or 1e-9; md=-1; mi=-1
        for i in range(a+1,b):
            d=abs((pts[i][0]-ax)*dy-(pts[i][1]-ay)*dx)/L
            if d>md: md=d; mi=i
        if md>tol: keep[mi]=True; st.append((a,mi)); st.append((mi,b))
    return [p for p,k in zip(pts,keep) if k]
def stitch(chains, eps=1.5):
    chains=[c[:] for c in chains if len(c)>1]; changed=True
    while changed:
        changed=False
        for i in range(len(chains)):
            for j in range(len(chains)):
                if i==j: continue
                a,b=chains[i],chains[j]
                if dist(a[-1],b[0])<eps: chains[i]=a+b[1:]; chains.pop(j); changed=True; break
                if dist(a[-1],b[-1])<eps: chains[i]=a+b[::-1][1:]; chains.pop(j); changed=True; break
                if dist(a[0],b[0])<eps: chains[i]=b[::-1]+a[1:]; chains.pop(j); changed=True; break
            if changed: break
    return chains
def per(p):  # perimeter param of nearest boundary point
    e0,n0,e1,n1=BB; x,y=p
    d=[abs(y-n0),abs(x-e1),abs(y-n1),abs(x-e0)]; k=d.index(min(d)); W=e1-e0; H=n1-n0
    if k==0: return x-e0
    if k==1: return W+(y-n0)
    if k==2: return W+H+(e1-x)
    return 2*W+H+(n1-y)
def corners(p0,p1):
    # boundary points between perimeter params p0->p1 going the short way (add corner points)
    e0,n0,e1,n1=BB; W=e1-e0; H=n1-n0; P=2*(W+H); cs=[(0,(e0,n0)),(W,(e1,n0)),(W+H,(e1,n1)),(2*W+H,(e0,n1))]
    fwd=(p1-p0)%P; out=[]
    if fwd<=P-fwd:
        for c,pt in sorted(cs): 
            if 0<((c-p0)%P)<fwd: out.append((((c-p0)%P),pt))
    else:
        back=P-fwd
        for c,pt in cs:
            if 0<((p0-c)%P)<back: out.append((((p0-c)%P),pt))
    return [pt for _,pt in sorted(out)]
def close_chains(chains):
    rings=[]; opens=[]
    for c in chains:
        if dist(c[0],c[-1])<3: rings.append(c)
        else: opens.append(c)
    if not opens: return rings
    ends=[(i,k) for i in range(len(opens)) for k in (0,1)]
    def pt(i,k): return opens[i][0] if k==0 else opens[i][-1]
    pairs=[]
    for a in range(len(ends)):
        for b in range(a+1,len(ends)):
            (i,k),(j,l)=ends[a],ends[b]
            if i==j and len(opens)>1: continue
            pa,pb=per(pt(i,k)),per(pt(j,l)); P=2*((BB[2]-BB[0])+(BB[3]-BB[1])); d=min((pa-pb)%P,(pb-pa)%P)
            pairs.append((d,a,b))
    pairs.sort(); used=set(); link={}
    for d,a,b in pairs:
        if a in used or b in used: continue
        used.add(a); used.add(b); link[a]=b; link[b]=a
    seen=set()
    for a0 in range(len(ends)):
        i0,_=ends[a0]
        if i0 in seen: continue
        ring=[]; cur=ends[a0]; start_chain=i0; guard=0
        while guard<50:
            guard+=1; i,k=cur; seen.add(i); seg=opens[i] if k==0 else opens[i][::-1]
            ring+=seg; exit_end=ends.index((i,1-k)); nxt=link.get(exit_end)
            if nxt is None: break
            ring+=corners(per(seg[-1]),per(pt(*ends[nxt]))); cur=ends[nxt]
            if cur[0]==start_chain: break
        rings.append(ring)
    return rings
# ---- water
w=json.load(open('raw/water.json'))['elements']; chains=[]
for e in w:
    if e['type']=='relation':
        for m in e['members']:
            chains.extend(runs(m.get('geometry')))
    else: chains.extend(runs(e.get('geometry')))
st=stitch(chains); print('water chains',len(chains),'->',len(st),[ (len(c), round(dist(c[0],c[-1]))) for c in st])
rings=close_chains(st); rings=[[ [round(x,1),round(y,1)] for x,y in rdp(r,2.0)] for r in rings]
json.dump({'bb':BB,'rings':rings},open('data/water.json','w')); print('rings',len(rings),[len(r) for r in rings])
# ---- bridges
YEAR={'Széchenyi lánchíd':1849,'Margit híd':1876,'Szabadság híd':1896,'Erzsébet híd':1903,'Petőfi híd':1937,'Árpád híd':1950,'Rákóczi híd':1995}
pts_by={}
for f in ('bridges','chain'):
    try: els=json.load(open(f'raw/{f}.json'))['elements']
    except Exception: els=[]
    for e in els:
        tg=e.get('tags',{}); nm=tg.get('name','')
        key=None
        for k in YEAR:
            if nm.startswith(k) or (k.startswith('Széchenyi') and 'lánchíd' in nm.lower()): key=k
        if not key or tg.get('highway') not in ('primary','secondary','trunk','tertiary','unclassified') or tg.get('highway')=='platform': continue
        pts_by.setdefault(key,[]).extend(p for r in runs(e['geometry']) for p in r)
bridges=[]
for k,pts in pts_by.items():
    cx=sum(p[0] for p in pts)/len(pts); cy=sum(p[1] for p in pts)/len(pts)
    sxx=sum((p[0]-cx)**2 for p in pts); syy=sum((p[1]-cy)**2 for p in pts); sxy=sum((p[0]-cx)*(p[1]-cy) for p in pts)
    th=0.5*math.atan2(2*sxy,sxx-syy); ax=(math.cos(th),math.sin(th))
    proj=sorted(((p[0]-cx)*ax[0]+(p[1]-cy)*ax[1],p) for p in pts)
    bins={}
    for t,p in proj: bins.setdefault(int(t//40),[]).append(p)
    line=[(sum(q[0] for q in v)/len(v),sum(q[1] for q in v)/len(v)) for _,v in sorted(bins.items())]
    bridges.append({'name':k,'year':YEAR[k],'pts':[[round(x),round(y)] for x,y in line],'len':round(proj[-1][0]-proj[0][0])})
if not any(b['name']=='Széchenyi lánchíd' for b in bridges):
    a=loc({'lat':47.4989,'lon':19.0410}); b2=loc({'lat':47.4995,'lon':19.0460}); bridges.append({'name':'Széchenyi lánchíd','year':1849,'pts':[[round(a[0]),round(a[1])],[round(b2[0]),round(b2[1])]],'len':round(dist(a,b2)),'approx':1})
print([(b['name'],b['len'],len(b['pts'])) for b in bridges])
json.dump(bridges,open('data/bridges.json','w'))
# ---- roads
CL={'motorway':5,'trunk':4,'primary':3,'secondary':2,'tertiary':1}; roads=[]
for e in json.load(open('raw/roads.json'))['elements']:
    tg=e.get('tags',{}); 
    if tg.get('bridge') in ('yes','viaduct') and tg.get('layer','0')!='0': pass
    for pts in runs(e.get('geometry')):
        pts=rdp(pts,6.0); roads.append({'c':CL.get(tg.get('highway'),1),'p':[round(v) for xy in pts for v in xy],'n':tg.get('name','')[:24],'b':1 if tg.get('bridge') in ('yes','viaduct') else 0})
json.dump(roads,open('data/roads.json','w'),separators=(',',':')); print('roads',len(roads),sum(len(r['p']) for r in roads)//2)
