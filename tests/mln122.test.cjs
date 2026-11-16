const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{buildMln122,specs}=require('../scripts/import-mln122.cjs');
const sourceText=fs.readFileSync('public/exams.js','utf8'),bank=JSON.parse(sourceText.slice(sourceText.indexOf('['),sourceText.lastIndexOf(']')+1));
test('MLN122 includes all nine provided sources, 537 questions and 532 keyed questions',()=>{
 const decks=bank.filter(d=>d.course==='MLN122');assert.equal(decks.length,9);assert.equal(decks.reduce((n,d)=>n+d.cards.length,0),537);assert.equal(decks.reduce((n,d)=>n+d.questions.filter(q=>q.answerIndices.length).length,0),532);
 assert.deepEqual(decks.map(d=>[d.source,d.cards.length]),specs.map(s=>[s[0],s[4]]));assert.equal(new Set(bank.map(d=>d.id)).size,18);
 for(const d of decks){assert.equal(d.subject,'MLN122 · Kinh tế chính trị Mác – Lênin');assert.equal(d.questions.length,d.cards.length);assert.ok(fs.existsSync(path.join('public/sources',d.source)));for(const [i,q]of d.questions.entries()){assert.equal(q.number,i+1);assert.ok(q.options.length>=2&&q.options.length<=8);assert.ok(q.answerIndices.every(a=>Number.isInteger(a)&&a>=0&&a<q.options.length));}}
});
test('MLN122 generated data matches the original DOCX with documented OCR-only repairs',async()=>{
 const rebuilt=await buildMln122(path.resolve('public/sources'));assert.deepEqual(rebuilt,bank.filter(d=>d.course==='MLN122'));
 const first=rebuilt.find(d=>d.source==='SU25_C1_FE.docx').questions[56];assert.equal(first.options.length,4);assert.deepEqual(first.answerIndices,[3]);assert.match(first.sourceWarning,/©/);
 const second=rebuilt.find(d=>d.source==='SU25_C2_FE.docx');assert.deepEqual(second.questions[51].answerIndices,[3]);assert.match(second.questions[51].sourceWarning,/G/);assert.deepEqual(second.questions[54].answerIndices,[]);assert.match(second.questions[54].options[1],/Không tách được/);
 const excluded=rebuilt.flatMap(d=>d.questions.filter(q=>!q.answerIndices.length).map(q=>d.source+':'+q.number));assert.deepEqual(excluded,['Su25_Bl5.docx:49','SU25_C2_FE.docx:12','SU25_C2_FE.docx:33','SU25_C2_FE.docx:55','SU26 - RE.docx:44']);
});
test('MLN122 does not receive database-only AI sources',async()=>{
 const {resolveQuestion}=await import('../lib/study-agent.mjs');assert.equal(resolveQuestion({deckId:'exam-mln122-fa25-c1fe',questionIndex:0,picks:[1]}),null);
});
