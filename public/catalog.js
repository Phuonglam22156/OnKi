(() => {
 'use strict';
 const cfg=window.ONKI_CONFIG||{},client=cfg.supabaseUrl&&cfg.supabaseKey?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey):null;
 window.onkiSupabase=client;
 let rows=[],folders=[],admin=false,generation=0,identityGeneration=0,loading=false,folderCode=null,creating=false;
 const button=document.createElement('button');button.className='secondary small';button.textContent='Chế độ admin';button.hidden=true;button.id='manage-catalog';document.querySelector('.header-right').prepend(button);
 const dialog=document.createElement('dialog');dialog.id='catalog-manager';dialog.setAttribute('aria-label','Chế độ admin');document.body.append(dialog);
 const valid=row=>{const deck=window.OnkiDeckData.sanitizeDeck(row.data);return deck&&deck.id===row.id?{...row,data:deck}:null;};
 const folder=()=>folders.find(f=>f.code===folderCode);
 function sync(){window.onkiApp.setShared(rows.filter(r=>r.published).map(r=>r.data),folders.map(f=>f.label));}
 async function refresh(){
  if(!client)return;
  const token=++generation;
  const [decks,courses]=await Promise.all([
   client.from('shared_decks').select('id,data,subject_code,published,revision,updated_at').order('updated_at',{ascending:false}),
   client.from('shared_subjects').select('code,label').order('code')
  ]);
  if(token!==generation)return;if(decks.error||courses.error)throw decks.error||courses.error;
  rows=(decks.data||[]).map(valid).filter(Boolean);
  folders=(courses.data||[]).filter(f=>typeof f.code==='string'&&typeof f.label==='string'&&subjectKey(f.label)===f.code);
  sync();
 }
 async function identity(user){
  const token=++identityGeneration;
  admin=false;button.hidden=true;dialog.close();folderCode=null;creating=false;window.onkiImporter?.reset();
  if(client&&user){const {data,error}=await client.from('content_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(token!==identityGeneration)return;admin=!error&&!!data;}
  button.hidden=!admin;button.disabled=false;
  const badge=document.querySelector('.profile small');if(badge&&admin)badge.textContent='Quản trị nội dung';
  try{await refresh();}catch{toast('Chưa tải được kho chung. Bạn vẫn có thể học các đề có sẵn.');}
 }
 const originals=code=>(window.EXAM_DECKS||[]).filter(d=>subjectKey(d.subject)===code);
 const inFolder=code=>rows.filter(r=>r.subject_code===code);
 function rootHTML(){return `<div class="catalog-section-heading"><div><h3>Thư mục môn học</h3><p>Chọn môn trước, sau đó tải đề lên bên trong thư mục.</p></div><button class="primary" id="catalog-create">${icon('plus',16)} Tạo thư mục môn</button></div><div class="catalog-folders">${folders.map(f=>{const exams=inFolder(f.code),sources=originals(f.code);return `<button class="catalog-folder" data-catalog-folder="${esc(f.code)}">${icon('folder',30)}<strong>${esc(f.code)}</strong><span>${esc(f.label)}</span><small>${sources.length+exams.filter(r=>r.published).length} đề công khai${exams.some(r=>!r.published)?' · '+exams.filter(r=>!r.published).length+' đề ẩn':''}</small><b>Mở thư mục →</b></button>`;}).join('')||'<div class="empty">Tạo thư mục môn học đầu tiên để bắt đầu.</div>'}</div>`;}
 function folderHTML(){
  const f=folder();if(!f){folderCode=null;return rootHTML();}
  const exams=inFolder(f.code),sources=originals(f.code);
  return `<div class="catalog-path"><button class="text-btn" data-catalog-root>← Thư mục môn học</button><span>/ ${esc(f.code)}</span></div><div class="catalog-section-heading"><div><h3>${esc(f.label)}</h3><p>Đề tải lên tại đây sẽ tự nằm trong môn ${esc(f.code)}.</p></div><button class="primary" id="catalog-import">${icon('upload',16)} Tải đề vào thư mục</button></div><div class="catalog-list">${exams.map(row=>`<article class="catalog-row"><div><strong>${esc(row.data.title)}</strong><small>${row.data.cards.length} câu/thẻ · ${row.published?'Đang công khai cho mọi người':'Đã ẩn khỏi thư viện chung'}</small></div><button class="secondary small" data-catalog-toggle="${esc(row.id)}" ${loading?'disabled':''}>${row.published?'Ẩn đề':'Đăng lại'}</button></article>`).join('')}${sources.map(d=>`<article class="catalog-row catalog-source"><div><strong>${esc(d.title)}</strong><small>${d.cards.length} câu · Đề nguồn có sẵn</small></div><span class="catalog-source-badge">Công khai</span></article>`).join('')}${!exams.length&&!sources.length?'<div class="empty">Thư mục đang trống. Bấm “Tải đề vào thư mục” để thêm Word hoặc PDF.</div>':''}</div>${sources.length?'<p class="muted">Đề nguồn có sẵn được quản lý trong mã nguồn. Các đề bạn tải lên tại đây có thể ẩn và đăng lại ngay.</p>':''}`;
 }
 function createHTML(){return `<div class="catalog-path"><button class="text-btn" data-catalog-root>← Thư mục môn học</button></div><form id="catalog-folder-form"><h3>Tạo thư mục môn học chung</h3><label>Mã môn<input name="code" required maxlength="20" pattern="[A-Za-z]{2,}[0-9]{2,}" placeholder="Ví dụ: PRF192" autocomplete="off"></label><label>Tên môn (không bắt buộc)<input name="name" maxlength="40" placeholder="Ví dụ: Lập trình C"></label><p class="muted">Thư mục được hiển thị cho mọi người, kể cả khi chưa có đề.</p><button class="primary" type="submit">${icon('folder',16)} Tạo thư mục và mở</button></form>`;}
 function paint(error=''){
  dialog.innerHTML=`<div class="modal-head"><div><small>QUẢN TRỊ NỘI DUNG · KHO CHUNG</small><h2>Chế độ admin</h2></div><button class="icon" data-catalog-close aria-label="Đóng chế độ admin">×</button></div><div class="catalog-admin-guide"><strong>Admin có thể làm gì?</strong><p>Tạo thư mục môn học · Đăng đề cho mọi người · Ẩn / đăng lại đề đã tải lên.</p><ol><li>Tạo hoặc chọn thư mục</li><li>Tải Word / PDF vào môn</li><li>Duyệt đáp án và đăng chung</li></ol><small>Đề và thư mục tạo trong phần học cá nhân chỉ thuộc tài khoản của bạn. Quản trị không thay đổi tiến độ học của người khác.</small></div>${creating?createHTML():folderCode?folderHTML():rootHTML()}<div class="catalog-toolbar"><button class="text-btn" id="catalog-refresh">Làm mới kho chung</button></div><p class="error" role="alert">${esc(error)}</p>`;
  dialog.querySelector('[data-catalog-close]').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-catalog-root]').forEach(b=>b.onclick=()=>{folderCode=null;creating=false;paint();});
  dialog.querySelectorAll('[data-catalog-folder]').forEach(b=>b.onclick=()=>{folderCode=b.dataset.catalogFolder;paint();dialog.scrollTo(0,0);});
  const add=dialog.querySelector('#catalog-create');if(add)add.onclick=()=>{creating=true;paint();};
  const upload=dialog.querySelector('#catalog-import');if(upload)upload.onclick=()=>{const f=folder();if(!f)return;dialog.close();window.onkiImporter.open({shared:true,subject:f.label});};
  dialog.querySelector('#catalog-refresh').onclick=async()=>{try{await refresh();paint();}catch{paint('Chưa tải được danh sách. Hãy thử lại.');}};
  const form=dialog.querySelector('#catalog-folder-form');if(form)form.onsubmit=createFolder;
  dialog.querySelectorAll('[data-catalog-toggle]').forEach(b=>b.onclick=async()=>{const row=rows.find(r=>r.id===b.dataset.catalogToggle);let failure='';loading=true;paint();try{await publish(row.data,!row.published,row.revision);}catch(error){failure=error.message;}finally{loading=false;if(dialog.open)paint(failure);}});
 }
 async function createFolder(event){
  event.preventDefault();if(!admin||!client)return;
  const form=event.target,code=form.elements.code.value.trim().toUpperCase(),name=form.elements.name.value.trim().replace(/\s+/g,' '),label=name?code+' · '+name:code;
  if(!/^[A-Z]{2,}\d{2,}$/.test(code)||code.length>20||label.length>40){dialog.querySelector('.error').textContent='Mã môn gồm chữ và số (ví dụ PRF192). Mã và tên gộp lại tối đa 40 ký tự.';return;}
  form.querySelector('button[type=submit]').disabled=true;
  const {error}=await client.from('shared_subjects').insert({code,label});
  if(error){dialog.querySelector('.error').textContent=error.code==='23505'?'Môn này đã có. Quay lại danh sách để mở thư mục.':'Chưa tạo được thư mục. Hãy kiểm tra kết nối và quyền admin.';form.querySelector('button[type=submit]').disabled=false;return;}
  folders=[...folders,{code,label}].sort((a,b)=>a.code.localeCompare(b.code));sync();creating=false;folderCode=code;paint();toast('Đã tạo thư mục chung '+code+'. Bây giờ bạn có thể tải đề vào.');
 }
 async function publish(deck,visible=true,revision=0){
  if(!admin||!client)throw Error('Tài khoản này chưa có quyền quản trị.');
  const data=window.OnkiDeckData.sanitizeDeck(deck);if(!data||new Blob([JSON.stringify(data)]).size>1750000)throw Error('Đề chưa hợp lệ hoặc vượt dung lượng cho phép.');
  const target=folders.find(f=>f.code===subjectKey(data.subject));if(!target)throw Error('Hãy tạo và mở thư mục môn học trước khi tải đề.');
  data.subject=target.label;
  const {data:nextRevision,error}=await client.rpc('publish_shared_deck',{payload:data,visible,expected_revision:revision});
  if(error)throw Error(String(error.message).includes('CATALOG_CONFLICT')?'Đề đã thay đổi ở thiết bị khác. Hãy làm mới danh sách.':'Chưa đăng được đề. Kiểm tra kết nối và quyền quản trị rồi thử lại.');
  rows=[{id:data.id,data,subject_code:target.code,published:visible,revision:nextRevision},...rows.filter(r=>r.id!==data.id)];sync();
  try{await refresh();}catch{toast('Đề đã được lưu. Chưa tải lại được danh sách, bạn có thể làm mới sau.');}
  return data;
 }
 function openFolder(code){if(!admin)return;creating=false;folderCode=folders.some(f=>f.code===code)?code:null;paint();if(!dialog.open)dialog.showModal();}
 button.onclick=()=>openFolder(null);
 const ready=refresh().catch(()=>{});
 window.onkiCatalog={ready,identity,publish,isAdmin:()=>admin,open:()=>button.click(),openFolder};
})();
