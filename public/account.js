(() => {
  'use strict';
  const config=window.ONKI_CONFIG||{};
  const client=window.onkiSupabase||(config.supabaseUrl&&config.supabaseKey?window.supabase.createClient(config.supabaseUrl,config.supabaseKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null);
  const app=window.onkiApp,byId=id=>document.getElementById(id);
  let user=null,epoch=0,revision=0,dirty=false,ready=false,working=false,timer=null,authMode='login',version=0,conflict=false;
  const button=document.createElement('button');button.className='secondary small';button.id='account-button';button.textContent='Đăng nhập';
  document.querySelector('.header-right').prepend(button);
  const dialog=document.createElement('dialog');dialog.id='account-dialog';document.body.append(dialog);
  const status=document.createElement('button');status.id='sync-status';status.className='text-btn';document.querySelector('.profile').after(status);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function message(text){byId('account-message').textContent=text;}
  function syncLabel(text){status.textContent=text;status.title=text;const badge=document.querySelector('.local-badge');if(badge)badge.textContent=user?text:'Lưu trên thiết bị';}
  function lock(value){document.querySelector('.shell').classList.toggle('account-loading',value);document.querySelector('main').inert=value;document.querySelector('nav').inert=value;document.getElementById('create-top').disabled=value;}
  function localKey(){return user?'onki-user-'+user.id:'onki-v1';}
  function cache(){try{localStorage.setItem(localKey(),JSON.stringify(app.exportState()));if(user)localStorage.setItem(localKey()+'-meta',JSON.stringify({revision,dirty}));return true;}catch{toast('Không đủ dung lượng lưu trên thiết bị.');return false;}}
  function getCache(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
  function paintProfile(){
    const name=user?(user.user_metadata?.full_name||user.email||'Sinh viên'):'Sinh viên';
    const profile=document.querySelector('.profile');profile.querySelector('strong').textContent=name;profile.querySelector('small').textContent=user?'Tài khoản cá nhân':'Đang học với tư cách khách';profile.querySelector('.avatar').textContent=user?name.slice(0,2).toUpperCase():'SV';button.textContent=user?'Tài khoản':'Đăng nhập';
  }
  function modal(mode='login'){
    authMode=mode;
    if(!client){dialog.innerHTML='<div class="modal-head"><h2>Tài khoản chưa sẵn sàng</h2><button class="icon" data-account-close aria-label="Đóng">×</button></div><p class="muted">Đăng ký và đồng bộ tài khoản đang được thiết lập. Bạn vẫn có thể ôn các bộ đề ở chế độ khách.</p>';}
    else if(user&&mode!=='update'){
      dialog.innerHTML=`<div class="modal-head"><div><small>KHÔNG GIAN CỦA BẠN</small><h2>Tài khoản học tập</h2></div><button class="icon" data-account-close aria-label="Đóng">×</button></div><p><strong>${esc(user.user_metadata?.full_name||'Sinh viên')}</strong></p><p class="muted">${esc(user.email||'')}</p><p id="account-message" class="muted" role="status">${esc(status.textContent)}</p><div class="account-actions"><button class="secondary" id="sync-now">Đồng bộ lại</button><button class="secondary" id="cloud-reload">Tải bản đám mây</button><button class="primary" id="logout">Đăng xuất</button></div><p class="muted">Dữ liệu học tập được lưu riêng cho tài khoản này. Chế độ khách dùng dữ liệu riêng trên trình duyệt.</p>`;
    }else{
      const title={login:'Mừng bạn quay lại',signup:'Bắt đầu hành trình ôn thi',forgot:'Quên mật khẩu?',update:'Đặt mật khẩu mới'}[mode];
      dialog.innerHTML=`<div class="modal-head"><div><small>HỌC CHẮC, THI TỐT CÙNG ÔNKI</small><h2>${title}</h2></div><button class="icon" data-account-close aria-label="Đóng">×</button></div>${['login','signup'].includes(mode)?`<div class="account-tabs"><button data-auth-mode="login" class="${mode==='login'?'selected':''}">Đăng nhập</button><button data-auth-mode="signup" class="${mode==='signup'?'selected':''}">Đăng ký</button></div>`:''}<form id="account-form">${mode==='signup'?'<label>Họ và tên<input name="fullName" required maxlength="80" autocomplete="name" placeholder="Tên bạn muốn hiển thị"></label>':''}${mode!=='update'?'<label>Email<input type="email" name="email" required maxlength="254" autocomplete="email" placeholder="ban@example.com"></label>':''}${mode!=='forgot'?`<label>Mật khẩu<input type="password" name="password" required ${mode==='login'?'':'minlength="8"'} maxlength="128" autocomplete="${mode==='login'?'current-password':'new-password'}" placeholder="${mode==='login'?'Mật khẩu của bạn':'Ít nhất 8 ký tự'}"></label>`:''}${mode==='signup'||mode==='update'?'<label>Nhập lại mật khẩu<input type="password" name="confirm" required minlength="8" maxlength="128" autocomplete="new-password"></label>':''}<p id="account-message" class="muted" role="status"></p><button class="primary account-submit" type="submit">${{login:'Đăng nhập',signup:'Tạo tài khoản',forgot:'Gửi email khôi phục',update:'Lưu mật khẩu mới'}[mode]}</button></form>${mode==='login'?'<button class="text-btn" data-auth-mode="forgot">Quên mật khẩu?</button>':''}<p class="muted">${mode==='signup'?'Kiểm tra hộp thư để xác nhận email sau khi đăng ký.':'Tiến độ của bạn được đồng bộ khi đăng nhập.'}</p>${!['login','signup','update'].includes(mode)?'<button class="text-btn" data-auth-mode="login">← Quay lại đăng nhập</button>':''}`;
    }
    dialog.querySelector('[data-account-close]').onclick=()=>dialog.close();
    dialog.querySelectorAll('[data-auth-mode]').forEach(b=>b.onclick=()=>modal(b.dataset.authMode));
    if(byId('account-form'))byId('account-form').onsubmit=submitAuth;
    if(byId('logout'))byId('logout').onclick=logout;
    if(byId('sync-now'))byId('sync-now').onclick=async()=>{await flush();if(byId('account-message'))message(status.textContent);};
    if(byId('cloud-reload'))byId('cloud-reload').onclick=async()=>{
      if(dirty){dialog.innerHTML='<h2>Tải tiến độ từ đám mây?</h2><p class="muted">Thay đổi chưa đồng bộ trên máy này sẽ được giữ trong một bản sao cục bộ, nhưng tiến độ đang hiển thị sẽ chuyển sang bản đám mây.</p><div class="account-actions"><button class="secondary" id="cancel-reload">Hủy</button><button class="primary" id="confirm-reload">Tải bản đám mây</button></div>';byId('cancel-reload').onclick=()=>modal();byId('confirm-reload').onclick=async()=>{try{localStorage.setItem(localKey()+'-conflict-backup',JSON.stringify(app.exportState()));}catch{}await loadCloud(user,epoch,true);modal();};}
      else{await loadCloud(user,epoch,true);modal();}
    };
    if(!dialog.open)dialog.showModal();
  }
  function errorMessage(error){const code=error?.code;return ({invalid_credentials:'Email hoặc mật khẩu chưa đúng.',email_not_confirmed:'Bạn cần xác nhận email trước khi đăng nhập.',user_already_exists:'Email này đã được đăng ký. Hãy đăng nhập.',weak_password:'Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự.',over_email_send_rate_limit:'Gửi email quá nhanh. Vui lòng thử lại sau.',over_request_rate_limit:'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',same_password:'Hãy chọn mật khẩu khác mật khẩu cũ.',signup_disabled:'Đăng ký đang tạm đóng. Vui lòng liên hệ người quản trị.'})[code]||'Chưa thể hoàn tất. Hãy kiểm tra kết nối và thử lại.';}
  async function submitAuth(event){
    event.preventDefault();const form=event.target,submit=form.querySelector('[type=submit]'),mode=authMode,email=form.elements.email?.value.trim(),password=form.elements.password?.value;
    if(form.elements.confirm&&password!==form.elements.confirm.value){message('Hai mật khẩu chưa trùng khớp.');return;}
    submit.disabled=true;message('Đang xử lý…');
    try{
      let response;
      if(mode==='login')response=await client.auth.signInWithPassword({email,password});
      if(mode==='signup')response=await client.auth.signUp({email,password,options:{data:{full_name:form.elements.fullName.value.trim()},emailRedirectTo:location.origin+'/'}});
      if(mode==='forgot')response=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/'});
      if(mode==='update')response=await client.auth.updateUser({password});
      if(response.error)throw response.error;
      form.reset();
      if(mode==='signup'&&!response.data.session){message('Đã nhận yêu cầu đăng ký. Kiểm tra email để xác nhận tài khoản, rồi quay lại đăng nhập.');}
      else if(mode==='forgot'){message('Nếu email hợp lệ, bạn sẽ nhận được liên kết khôi phục. Hãy kiểm tra cả thư rác.');}
      else{dialog.close();if(mode==='update')toast('Đã cập nhật mật khẩu.');else toast('Đăng nhập thành công.');}
    }catch(error){message(errorMessage(error));}finally{submit.disabled=false;}
  }
  async function loadCloud(account,generation,discard=false){
    if(!account)return;lock(true);syncLabel('Đang tải tiến độ…');ready=false;
    const cached=getCache(localKey()),meta=getCache(localKey()+'-meta');revision=Number(meta?.revision)||0;dirty=!!meta?.dirty;conflict=false;
    try{
      const {data,error}=await client.from('study_state').select('data,revision').eq('user_id',account.id).maybeSingle();
      if(generation!==epoch)return;if(error)throw error;
      if(!discard&&dirty&&cached&&data&&revision!==data.revision){app.load(cached);conflict=true;syncLabel('Có thay đổi trên thiết bị khác');}
      else if(!discard&&dirty&&cached){app.load(cached);revision=data?.revision||0;syncLabel('Có thay đổi chờ đồng bộ');}
      else{revision=data?.revision||0;dirty=false;app.load(data?.data||{});syncLabel('Đã đồng bộ');}
      ready=true;cache();
    }catch{if(generation!==epoch)return;app.load(cached||{});ready=true;syncLabel('Chưa kết nối đám mây');toast('Đang dùng bản lưu trên máy. Chưa tải được tiến độ đám mây.');}
    finally{if(generation===epoch){lock(false);if(dirty&&!conflict)queue();}}
  }
  async function changeUser(next){
    if(next?.id===user?.id){if(next)user=next;paintProfile();return;}
    clearTimeout(timer);epoch++;working=false;user=next;dirty=false;revision=0;conflict=false;ready=false;paintProfile();
    const generation=epoch;
    await window.onkiCatalog?.ready;
    await window.onkiCatalog?.identity(next);
    if(generation!==epoch)return;
    if(user)await loadCloud(user,epoch);else{app.load(getCache('onki-v1')||{});syncLabel('Học với tư cách khách');ready=true;lock(false);}
  }
  function queue(){clearTimeout(timer);timer=setTimeout(flush,650);}
  async function flush(){
    if(!client||!user||!ready||working||!dirty||conflict)return;
    working=true;const generation=epoch,account=user.id;syncLabel('Đang đồng bộ…');
    try{
      while(dirty&&generation===epoch){const sentVersion=version,payload=app.exportState();const {data,error}=await client.rpc('save_study_state',{payload,expected_revision:revision});
        if(generation!==epoch)return;if(error)throw error;revision=Number(data);if(!Number.isSafeInteger(revision)||revision<1)throw Error('Invalid revision');dirty=sentVersion!==version;cache();
      }
      if(generation===epoch)syncLabel('Đã đồng bộ');
    }catch(error){if(generation!==epoch||account!==user?.id)return;dirty=true;conflict=String(error.message).includes('STATE_CONFLICT');cache();syncLabel(conflict?'Có thay đổi trên thiết bị khác':'Chưa đồng bộ · nhấn để thử lại');}
    finally{if(generation===epoch)working=false;}
  }
  async function logout(){
    byId('logout').disabled=true;lock(true);await flush();const {error}=await client.auth.signOut({scope:'local'});lock(false);
    if(error){byId('logout').disabled=false;message('Chưa thể đăng xuất. Hãy thử lại.');return;}
    await changeUser(null);dialog.close();toast('Đã đăng xuất. Đang dùng chế độ khách.');
  }
  window.onkiAccount={async accessToken(){if(!client)return null;const {data,error}=await client.auth.getSession();return error?null:data.session?.access_token||null;},storageKey:localKey,persist(){if(user){dirty=true;version++;}const ok=cache();if(user&&ready)queue();return ok;},open:modal};
  button.onclick=()=>modal();status.onclick=()=>user?modal():modal('login');
  window.addEventListener('online',()=>{if(user&&dirty)flush();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&user&&dirty)flush();});
  paintProfile();syncLabel('Học với tư cách khách');
  if(client){
    lock(true);
    client.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{await changeUser(session?.user||null);if(event==='PASSWORD_RECOVERY')modal('update');},0);});
    client.auth.getSession().then(({data,error})=>{if(error){lock(false);syncLabel('Không tải được phiên đăng nhập');}else if(data.session)changeUser(data.session.user);else{ready=true;lock(false);}}).catch(()=>{lock(false);syncLabel('Không tải được phiên đăng nhập');});
  }else ready=true;
})();
