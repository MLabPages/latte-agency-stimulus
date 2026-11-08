// ローカル確認用。npm start 後、表示されたURLを開く。外部パッケージ不要。
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const name=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    const target=path.resolve(root,name);
    if(!target.startsWith(root+path.sep)||!types[path.extname(target)]){res.writeHead(404);res.end();return;}
    const body=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)],'Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404);res.end();}
});
server.listen(Number(process.env.PORT||0),'127.0.0.1',()=>console.log(`Latte stimulus: http://127.0.0.1:${server.address().port}/?condition=passive`));
