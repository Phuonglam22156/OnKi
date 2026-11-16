const fs=require('node:fs/promises'),path=require('node:path'),mammoth=require('mammoth'),{DOMParser}=require('linkedom'),parser=require('../public/import-parser.js');
const specs=[
 ['FA25_C1FE.docx','fa25-c1fe','FA25 — FE C1','FA25 / C1',60],
 ['SP26_C1FE.docx','sp26-c1fe','SP26 — FE C1','SP26 / C1',60],
 ['Su25_Bl5.docx','su25-bl5','SU25 — BL5','SU25 / BL5',59],
 ['SU25_C1_FE.docx','su25-c1-fe','SU25 — FE C1','SU25 / C1',60],
 ['SU25_C2_FE.docx','su25-c2-fe','SU25 — FE C2','SU25 / C2',60],
 ['SU25_RE.docx','su25-re','SU25 — Thi lại','SU25 / RE',60],
 ['SU26 - RE.docx','su26-re','SU26 — Thi lại','SU26 / RE',58],
 ['SU26_FE _C1.docx','su26-fe-c1','SU26 — FE C1','SU26 / C1',60],
 ['SU26_FE_C2.docx','su26-fe-c2','SU26 — FE C2','SU26 / C2',60]
];
async function buildMln122(sourceDir){
 const decks=[];
 for(const [source,slug,title,code,expected] of specs){
  const result=await mammoth.convertToHtml({buffer:await fs.readFile(path.join(sourceDir,source))},{includeEmbeddedStyleMap:false,externalFileAccess:false});
  const previous=globalThis.DOMParser;let blocks;
  try{globalThis.DOMParser=DOMParser;blocks=parser.docxBlocks(result.value);}finally{if(previous===undefined)delete globalThis.DOMParser;else globalThis.DOMParser=previous;}
  const warnings=new Map();let number=0;
  for(let i=0;i<blocks.length;i++){
   const start=blocks[i].text.trim().match(/^(?:Câu\s*)?(\d+)\s*[.)]\s*/iu);if(start)number=Number(start[1]);
   if(source==='SU25_C1_FE.docx'&&number===57&&blocks[i].text.startsWith('B.')&&blocks[i].text.includes(' ©. ')){
    const parts=blocks[i].text.split(' ©. ');if(parts.length!==2)throw Error('Unexpected merged C option');
    blocks.splice(i,1,{text:parts[0],bold:false},{text:'C. '+parts[1],bold:false});
    warnings.set(57,'File gốc gộp lựa chọn C vào dòng B và ghi nhãn ©. Chỉ tách lại bố cục, giữ nguyên nội dung và đáp án D in đậm.');
   }
   if(source==='SU25_C2_FE.docx'&&number===52&&blocks[i].text.startsWith('G.')){
    blocks[i]={...blocks[i],text:'C.'+blocks[i].text.slice(2)};
    warnings.set(52,'Nhãn lựa chọn thứ ba được ghi G. trong file gốc; hiển thị tại vị trí C theo thứ tự A–D, giữ nguyên nội dung và đáp án D in đậm.');
   }
   if(source==='SU25_C2_FE.docx'&&number===55&&blocks[i].text.startsWith('A.')){
    blocks.splice(i+1,0,{text:'B. [Không tách được lựa chọn B do lỗi OCR trong file gốc. Vui lòng tải đề gốc để đối chiếu.]',bold:false});
    warnings.set(55,'Lựa chọn A/B bị gộp và lỗi chữ trong file gốc. Giữ nguyên dòng A và đánh dấu vị trí B chưa đọc được; câu này không được chấm tự động.');
    i++;
   }
  }
  const parsed=parser.parse(blocks);if(parsed.questions.length!==expected)throw Error(source+': expected '+expected+', got '+parsed.questions.length);
  for(const q of parsed.questions){if(warnings.has(q.number))q.sourceWarning=warnings.get(q.number);if(source==='SU25_C2_FE.docx'&&q.number===55)q.answerIndices=[];}
  const questions=parsed.questions;
  decks.push({id:'exam-mln122-'+slug,title:'MLN122 · '+title,subject:'MLN122 · Kinh tế chính trị Mác – Lênin',course:'MLN122',code,color:'lilac',symbol:'ML',source,answerSource:'Đáp án theo phần in đậm trong tài liệu gốc; chưa thẩm định chuyên môn. Câu thiếu đáp án hoặc lỗi OCR không đủ rõ được giữ để xem, không chấm tự động.',questions,cards:questions.map(q=>[(q.number+'. '+q.term),q.answerIndices.length?q.answerIndices.map(i=>String.fromCharCode(65+i)+'. '+q.options[i]).join('\n'):'Chưa có đáp án đủ rõ trong nguồn. Vui lòng đối chiếu file gốc.'])});
 }
 return decks;
}
module.exports={buildMln122,specs};
