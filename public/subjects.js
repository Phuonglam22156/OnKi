let selectedSubject=null;
function subjectKey(value){const s=String(value||'Chưa phân loại').trim().replace(/\s+/g,' ');const code=s.match(/^([a-z]{2,}\d{2,})\b/i);return code?code[1].toUpperCase():s.toLocaleLowerCase('vi');}
function subjectGroups(){
 const groups=new Map();
 for(const label of [...sharedSubjects,...(state.subjects||[]),...state.decks.map(d=>d.subject)]){const key=subjectKey(label);if(!groups.has(key))groups.set(key,{key,label:String(label),decks:[]});}
 for(const d of state.decks)groups.get(subjectKey(d.subject)).decks.push(d);
 return [...groups.values()].sort((a,b)=>a.key.localeCompare(b.key,'vi'));
}
function subjectLabel(key){return subjectGroups().find(s=>s.key===key)?.label||key||'';}
function matchingDecks(){return state.decks.filter(d=>(!selectedSubject||subjectKey(d.subject)===selectedSubject)&&(filter==='all'||filter==='exams'&&!!(d.source||d.importedFrom)||filter==='saved'&&state.saved.includes(d.id)||filter==='learning'&&known(d).length>0&&pct(d)<100)&&(!query||(d.title+' '+d.subject).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))));}
function subjectLibraryHTML(){
 if(selectedSubject)return matchingDecks().map(deckHTML).join('')||'<div class="empty">Kho môn học chưa có đề phù hợp. Nhập Word/PDF hoặc tạo bộ thẻ mới để bắt đầu.</div>';
 const visible=new Set(matchingDecks().map(d=>d.id)),needle=query.trim().toLocaleLowerCase('vi');
 return subjectGroups().filter(s=>s.decks.some(d=>visible.has(d.id))||(filter==='all'&&!s.decks.length&&(!needle||s.label.toLocaleLowerCase('vi').includes(needle)))).map(s=>{
  const cards=s.decks.reduce((n,d)=>n+d.cards.length,0),remembered=s.decks.reduce((n,d)=>n+known(d).length,0),progress=cards?Math.round(remembered/cards*100):0,code=/^[A-Z]+\d+$/.test(s.key)?s.key:s.label;
  return `<button class="subject-folder" data-subject="${esc(s.key)}"><span class="folder-top"><span class="folder-symbol">${icon('folder',32)}</span><span class="folder-count">${s.decks.length} bộ đề</span></span><span class="eyebrow">KHO ĐỀ THEO MÔN</span><strong>${esc(code)}</strong><span class="folder-description">${esc(s.label===code?'Đề thi, flashcard và tài liệu ôn tập':s.label.replace(new RegExp('^'+code+'\\s*[·:—-]?\\s*','i'),''))}</span><span class="folder-bottom"><span>${cards} thẻ · ${progress}% đã nhớ</span>${icon('arrow',19)}</span></button>`;
 }).join('')+'<button class="subject-folder new-subject" data-new-subject><span class="folder-symbol">'+icon('plus',28)+'</span><strong>Thêm môn học</strong><span>Tạo kho riêng cho môn tiếp theo</span></button>';
}
function subjectActions(){return `<div class="library-actions">${window.onkiCatalog?.isAdmin()&&selectedSubject?'<button class="primary" data-manage-subject>'+icon('shield',16)+' Quản trị môn này</button>':''}<button class="secondary" data-import-file>${icon('upload',16)} Nhập đề riêng</button><button class="secondary" id="create-library">${icon('plus',15)} Tạo thẻ riêng</button></div>`;}
function subjectPath(){return selectedSubject?`<div class="subject-path"><button class="text-btn" data-subject-root>${icon('folder',16)} Tất cả môn học</button><span>/</span><strong>${esc(subjectKey(subjectLabel(selectedSubject)))}</strong></div>`:'';}
function bindSubjects(){
 document.querySelectorAll('[data-manage-subject]').forEach(b=>b.onclick=()=>window.onkiCatalog.openFolder(selectedSubject));
 document.querySelectorAll('[data-subject]').forEach(b=>b.onclick=()=>{selectedSubject=b.dataset.subject;page='library';query='';render();window.scrollTo(0,0);});
 document.querySelectorAll('[data-subject-root]').forEach(b=>b.onclick=()=>{selectedSubject=null;page='library';query='';filter='all';render();});
 document.querySelectorAll('[data-import-file]').forEach(b=>b.onclick=()=>window.onkiImporter?.open());
 document.querySelectorAll('[data-new-subject]').forEach(b=>b.onclick=()=>{const dialog=document.getElementById('subject-creator');dialog.querySelector('form').reset();dialog.querySelector('.error').textContent='';dialog.showModal();});
}
function registerSubject(label){label=String(label).trim().slice(0,40);state.subjects??=[];if(label&&!subjectGroups().some(s=>s.key===subjectKey(label)))state.subjects.push(label);return subjectKey(label);}
