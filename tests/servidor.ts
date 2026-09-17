import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
export default async function setup(){
  const root=path.resolve('dist');
  const server=http.createServer(async(req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url||'/', 'http://localhost').pathname);
      const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
      const data=await fs.readFile(file);
      const types:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png'};
      res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);
    }catch{res.writeHead(404).end();}
  });
  await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(5174,'127.0.0.1',resolve);});
  return async()=>{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));};
}
