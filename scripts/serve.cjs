const http=require('node:http'),fs=require('node:fs'),path=require('node:path');require('./build.cjs');const root=path.resolve('public');
const server=http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})[path.extname(file)]||'application/octet-stream');res.end(data)});
});server.listen(process.env.PORT||4174,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(process.env.PORT||4174)));
