(function(root){
 function sanitizeDeck(d){
  if(!d||!/^d[0-9a-z-]{1,65}$/i.test(d.id)||typeof d.title!=='string'||typeof d.subject!=='string'||!Array.isArray(d.cards)||d.cards.length<1||d.cards.length>500||!d.cards.every(c=>Array.isArray(c)&&c.length===2&&c.every(t=>typeof t==='string'&&t.length<=12000)))return null;
  const deck={id:d.id,title:d.title.trim().slice(0,90),subject:d.subject.trim().slice(0,40),color:['','blue','peach','lilac'].includes(d.color)?d.color:'blue',symbol:'✧',cards:d.cards.map(c=>c.map(t=>t.trim()))};
  if(!deck.title||!deck.subject||deck.cards.some(c=>c.some(t=>!t)))return null;
  if(d.questions!==undefined){
   if(!Array.isArray(d.questions)||d.questions.length!==deck.cards.length||!d.questions.every(q=>q&&typeof q.term==='string'&&q.term.trim()&&q.term.length<=4000&&Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=8&&q.options.every(o=>typeof o==='string'&&o.trim()&&o.length<=2000)&&Array.isArray(q.answerIndices)&&q.answerIndices.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length)))return null;
   deck.questions=d.questions.map((q,i)=>({number:i+1,term:q.term.trim(),options:q.options.map(o=>o.trim()),answerIndices:[...new Set(q.answerIndices)]}));
   deck.cards=deck.questions.map(q=>[q.term,q.answerIndices.length?q.answerIndices.map(i=>String.fromCharCode(65+i)+'. '+q.options[i]).join('\n'):'Chưa có đáp án được xác nhận.']);
  }
  if(typeof d.importedFrom==='string')deck.importedFrom=d.importedFrom.slice(0,150);
  return deck;
 }
 root.OnkiDeckData={sanitizeDeck};if(typeof module!=='undefined')module.exports=root.OnkiDeckData;
})(typeof window!=='undefined'?window:globalThis);
