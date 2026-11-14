(function(root){
 'use strict';
 const clean=s=>String(s||'').replace(/\u00a0/g,' ').trim();
 function parse(blocks){
  const lines=blocks.flatMap(b=>String(typeof b==='string'?b:b.text).split(/\r?\n/).map(text=>({text:clean(text),bold:typeof b==='object'&&!!b.bold}))).filter(b=>b.text);
  if(lines.reduce((n,b)=>n+b.text.length,0)>600000)throw Error('Tài liệu quá dài. Hãy chia thành các đề nhỏ hơn.');
  const questions=[];let q=null,option=-1,tableAnswers=false;
  const finish=()=>{if(q&&q.options.length>=2){q.number=questions.length+1;q.answerIndices=[...new Set(q.answerIndices)].filter(i=>i<q.options.length);questions.push(q);}q=null;option=-1;};
  for(const [lineIndex,block] of lines.entries()){
   const line=block.text;
   if(/^(?:answer\s*key|bảng\s*đáp\s*án|đáp\s*án\s*tham\s*khảo)\s*:?[\s]*$/iu.test(line)){finish();tableAnswers=true;continue;}
   if(tableAnswers){for(const m of line.matchAll(/(?:^|[\s;,])(?:câu\s*)?(\d+)\s*[.\-:)]?\s*([A-H](?:\s*[,/&]\s*[A-H])*)\b/giu)){const target=questions[Number(m[1])-1];if(target)target.answerIndices=[...m[2].toUpperCase().matchAll(/[A-H]/g)].map(v=>v[0].charCodeAt(0)-65).filter(i=>i<target.options.length);}continue;}
   const start=line.match(/^(?:(?:câu\s*(?:hỏi)?|question|q)\s*)?(\d+)\s*[.)\-:]\s*(.+)$/iu);
   if(start){finish();q={number:0,term:start[2],options:[],answerIndices:[]};continue;}
   const explicit=line.match(/^(?:đáp\s*án(?:\s*đúng)?|answer|correct\s*answer)\s*[:\-]\s*([A-H](?:\s*[,/&; ]\s*[A-H])*)\s*[.)]?$/iu);
   if(explicit&&q){q.answerIndices=[...explicit[1].toUpperCase().matchAll(/[A-H]/g)].map(m=>m[0].charCodeAt(0)-65);option=-2;continue;}
   if(!/^[A-H](?:\s*[.)\-:]\s*|\s+)\S/iu.test(line)&&/^\s*[*✓✔]?\s*A(?:\s*[.)\-:]\s*|\s+)\S/iu.test(lines[lineIndex+1]?.text||'')&&(!q||q.options.length>=2)){finish();q={number:0,term:line.replace(/^(?:câu\s*hỏi|question|q)\s*:\s*/iu,''),options:[],answerIndices:[]};continue;}
   const choice=line.match(/^\s*([*✓✔]?\s*)([A-H])(?:\s*[.)\-:]\s*|\s+)(.+)$/iu);
   if(choice&&q){const at=choice[2].toUpperCase().charCodeAt(0)-65;if(at===q.options.length&&at<8){let value=choice[3];const marked=block.bold||/[*✓✔]/.test(choice[1])||/\s*[✓✔]\s*$/.test(value);value=value.replace(/\s*[✓✔]\s*$/,'');q.options.push(value);option=at;if(marked)q.answerIndices.push(at);continue;}}
   if(q&&!/^(?:giải\s*thích|explanation|page\s+\d|trang\s+\d)/iu.test(line)){if(option>=0)q.options[option]+='\n'+line;else if(option===-1)q.term+='\n'+line;}
  }
  finish();
  if(questions.length)return {kind:'quiz',questions,cards:questions.map(q=>[q.term,q.answerIndices.length?q.answerIndices.map(i=>String.fromCharCode(65+i)+'. '+q.options[i]).join('\n'):'Chưa có đáp án được xác nhận.'])};
  const cards=[];let term='';
  for(const {text} of lines){
   const question=text.match(/^(?:câu\s*hỏi|question|q|thuật\s*ngữ|term)\s*[:\-]\s*(.+)$/iu),answer=text.match(/^(?:đáp\s*án|trả\s*lời|answer|a|định\s*nghĩa|definition)\s*[:\-]\s*(.+)$/iu);
   if(question){term=question[1];continue;}if(answer&&term){cards.push([term,answer[1]]);term='';continue;}
   if(!term){const pair=text.split(/\t+|\s+\|\s+|\s+→\s+/);if(pair.length===2&&pair.every(clean))cards.push(pair.map(clean));}
  }
  return {kind:'cards',cards,questions:[]};
 }
 function docxBlocks(html){
  const doc=new DOMParser().parseFromString(html,'text/html');
  const blocks=[];
  for(const el of [...doc.querySelectorAll('p,li')].filter(el=>!el.querySelector('p,li'))){
   let text='',boldText='';
   const flush=()=>{const option=text.match(/^\s*[A-H](?:\s*[.)\-:]\s*|\s+)(.+)/iu),body=option?option[1].replace(/\s/g,''):'';if(text.trim())blocks.push({text,bold:!!body&&boldText.replace(/\s/g,'').length>=Math.max(1,body.length*.6)});text='';boldText='';};
   const walk=(node,bold=false)=>{if(node.nodeType===3){for(const [i,line]of node.textContent.split(/\r?\n/).entries()){if(i)flush();text+=line;if(bold)boldText+=line;}}else if(node.nodeName==='BR')flush();else if(!['SCRIPT','STYLE','IMG','IFRAME'].includes(node.nodeName)){for(const child of node.childNodes)walk(child,bold||['STRONG','B'].includes(node.nodeName));}};
   walk(el);flush();
  }
  return blocks;
 }
 root.OnkiImportParser={parse,docxBlocks};
 if(typeof module!=='undefined')module.exports=root.OnkiImportParser;
})(typeof window!=='undefined'?window:globalThis);
