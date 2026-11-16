(() => {
 'use strict';
 const cfg=window.ONKI_CONFIG||{},client=cfg.supabaseUrl&&cfg.supabaseKey?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey):null;
 window.onkiSupabase=client;
 let rows=[],admin=false,generation=0,identityGeneration=0,loading=false;
 const button=document.createElement('button');button.className='secondary small';button.textContent='Quản lý đề chung';button.hidden=true;button.id='manage-catalog';document.querySelector('.header-right').prepend(button);
 const dialog=document.createElement('dialog');dialog.id='catalog-manager';dialog.setAttribute('aria-label','Quản lý đề chung');document.body.append(dialog);
 const valid=row=>{const deck=window.OnkiDeckData.sanitizeDeck(row.data);return deck&&deck.id===row.id?{...row,data:deck}:null;};
 async function refresh(){
  if(!client)return;
  const token=++generation;
  const {data,error}=await client.from('shared_decks').select('id,data,published,revision,updated_at').order('updated_at',{ascending:false});
  if(token!==generation)return;if(error)throw error;
  rows=(data||[]).map(valid).filter(Boolean);
  window.onkiApp.setShared(rows.filter(r=>r.published).map(r=>r.data));
 }
 async function identity(user){
  const token=++identityGeneration;
  admin=false;button.hidden=true;dialog.close();window.onkiImporter?.reset();
  if(client&&user){const {data,error}=await client.from('content_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(token!==identityGeneration)return;admin=!error&&!!data;}
  button.hidden=!admin;button.disabled=false;
  try{await refresh();}catch{toast('Chưa tải được đề chung. Bạn vẫn có thể học các đề có sẵn.');}
 }
 function paint(error=''){
  dialog.innerHTML=`<div class="modal-head"><div><small>KHO ĐỀ CHO MỌI NGƯỜI</small><h2>Quản lý đề chung</h2></div><button class="icon" data-catalog-close aria-label="Đóng quản lý đề">×</button></div><p>Nhập Word/PDF, kiểm tra câu hỏi và đáp án trước khi đăng. Đề đã đăng sẽ xuất hiện trong môn học của tất cả người dùng.</p><div class="catalog-toolbar"><button class="primary" id="catalog-import">${icon('upload',16)} Đăng đề từ Word / PDF</button><button class="secondary" id="catalog-refresh">Làm mới</button></div><p class="muted">Danh sách dưới đây gồm các đề đăng qua trang quản trị. Các đề nguồn DBS401 và MLN122 có sẵn vẫn được giữ nguyên.</p><div class="catalog-list">${rows.length?rows.map(row=>`<article class="catalog-row"><div><strong>${esc(row.data.title)}</strong><small>${esc(row.data.subject)} · ${row.data.cards.length} câu/thẻ · ${row.published?'Đang công khai':'Đã ẩn'}</small></div><button class="secondary small" data-catalog-toggle="${esc(row.id)}" ${loading?'disabled':''}>${row.published?'Ẩn đề':'Đăng lại'}</button></article>`).join(''):'<div class="empty">Chưa có đề đăng qua trang quản trị. Chọn Word/PDF để thêm đề đầu tiên.</div>'}</div><p class="error" role="alert">${esc(error)}</p>`;
  dialog.querySelector('[data-catalog-close]').onclick=()=>dialog.close();
  dialog.querySelector('#catalog-import').onclick=()=>{dialog.close();window.onkiImporter.open({shared:true});};
  dialog.querySelector('#catalog-refresh').onclick=async()=>{try{await refresh();paint();}catch{paint('Chưa tải được danh sách. Hãy thử lại.');}};
  dialog.querySelectorAll('[data-catalog-toggle]').forEach(b=>b.onclick=async()=>{const row=rows.find(r=>r.id===b.dataset.catalogToggle);let failure='';loading=true;paint();try{await publish(row.data,!row.published,row.revision);}catch(error){failure=error.message;}finally{loading=false;if(dialog.open)paint(failure);}});
 }
 async function publish(deck,visible=true,revision=0){
  if(!admin||!client)throw Error('Tài khoản này chưa có quyền quản trị.');
  const data=window.OnkiDeckData.sanitizeDeck(deck);if(!data||new Blob([JSON.stringify(data)]).size>1750000)throw Error('Đề chưa hợp lệ hoặc vượt dung lượng cho phép.');
  const {data:nextRevision,error}=await client.rpc('publish_shared_deck',{payload:data,visible,expected_revision:revision});
  if(error)throw Error(String(error.message).includes('CATALOG_CONFLICT')?'Đề đã thay đổi ở thiết bị khác. Hãy làm mới danh sách.':'Chưa đăng được đề. Kiểm tra kết nối và quyền quản trị rồi thử lại.');
  rows=[{id:data.id,data,published:visible,revision:nextRevision},...rows.filter(r=>r.id!==data.id)];
  window.onkiApp.setShared(rows.filter(r=>r.published).map(r=>r.data));
  try{await refresh();}catch{toast('Đề đã được lưu. Chưa tải lại được danh sách, bạn có thể làm mới sau.');}
  return data;
 }
 button.onclick=()=>{if(!admin)return;paint();dialog.showModal();};
 const ready=refresh().catch(()=>{});
 window.onkiCatalog={ready,identity,publish,isAdmin:()=>admin,open:()=>button.click()};
})();
