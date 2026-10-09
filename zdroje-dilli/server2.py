import http.server, os, re
class H(http.server.SimpleHTTPRequestHandler):
    def do_PUT(self):
        n=int(self.headers['Content-Length']); data=self.rfile.read(n)
        open(os.path.join('out',os.path.basename(self.path)),'wb').write(data)
        self.send_response(200); self.end_headers()
    def do_GET(self):
        rng=self.headers.get('Range'); path=self.translate_path(self.path)
        if rng and os.path.isfile(path):
            m=re.match(r'bytes=(\d*)-(\d*)',rng); size=os.path.getsize(path)
            a=int(m.group(1)) if m.group(1) else 0; b=int(m.group(2)) if m.group(2) else size-1; b=min(b,size-1)
            self.send_response(206); self.send_header('Content-Type',self.guess_type(path)); self.send_header('Accept-Ranges','bytes')
            self.send_header('Content-Range',f'bytes {a}-{b}/{size}'); self.send_header('Content-Length',str(b-a+1)); self.end_headers()
            with open(path,'rb') as f:
                f.seek(a); left=b-a+1
                while left>0:
                    chunk=f.read(min(1<<20,left)); 
                    if not chunk: break
                    try: self.wfile.write(chunk)
                    except Exception: break
                    left-=len(chunk)
        else: super().do_GET()
    def end_headers(self):
        self.send_header('Accept-Ranges','bytes'); super().end_headers()
http.server.ThreadingHTTPServer(('127.0.0.1',8766),H).serve_forever()
