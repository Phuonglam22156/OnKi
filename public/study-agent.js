function studyAgentHTML(response){
 const ai=response.ai||{};
 const content=ai.status==='loading'?'<p class="ai-loading" role="status">Đang tra cứu tài liệu chính thức và đối chiếu đáp án…</p>':ai.status==='error'?`<p class="ai-error" role="alert">${esc(ai.error)}</p>`:ai.status==='ready'?`<div class="ai-result"><div class="ai-evidence ${ai.data.researched?'':'ai-caution'}">${icon(ai.data.researched?'book':'shield',16)} ${ai.data.researched?'Đã tìm được tài liệu tham khảo chính thức':'Chưa lấy được nguồn phù hợp — chưa đủ căn cứ kiểm chứng'}</div><div class="ai-explanation">${esc(ai.data.explanation)}</div>${ai.data.sources?.length?`<div class="ai-sources"><h4>Tài liệu tìm được</h4>${ai.data.sources.map((s,i)=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${icon('book',15)}<span>${esc(s.title)}<small>${esc(new URL(s.url).hostname)}</small></span>${icon('arrowup',14)}</a>`).join('')}</div>`:''}<p class="hint">AI có thể nhầm. Hãy mở nguồn để đối chiếu ngữ cảnh và phiên bản. Kết quả này không thay đổi đáp án đề hay điểm của bạn.</p></div>`:'<p class="muted">Tra cứu tài liệu chính thức, giải thích từng lựa chọn và chỉ ra nếu đáp án đề có dấu hiệu mâu thuẫn.</p>';
 return `<section class="study-agent" aria-label="Trợ lý AI"><div class="ai-heading"><div class="ai-avatar">${icon('brain',23)}</div><div><span class="eyebrow">ÔNKI AI · TRỢ LÝ KIẾN THỨC</span><h3>Hiểu vì sao chọn đáp án</h3></div><span class="ai-beta">BETA</span></div>${content}${ai.status!=='ready'?`<button class="secondary ai-ask" id="ask-study-agent" ${ai.status==='loading'?'disabled':''}>${icon('bolt',17)} ${ai.status==='loading'?'Đang kiểm chứng…':ai.status==='error'?'Thử lại với AI':'AI giải thích & kiểm chứng'}</button><small class="ai-privacy">Dùng tài khoản đã xác nhận email · Câu hỏi và lựa chọn sẽ được gửi tới dịch vụ AI để phân tích.</small>`:''}</section>`;
}

function bindStudyAgent(){
 const button=document.getElementById('ask-study-agent');
 if(!button)return;
 button.onclick=async()=>{
  const session=learning,response=session?.responses[session.index],q=session?.questions[session.index],deck=current;
  if(!response?.finished||response.ai?.status==='loading'||!q||!deck?.source)return;
  const token=await window.onkiAccount?.accessToken?.();
  if(!token){window.onkiAccount?.open('login');return;}
  // The answer belongs to this session; a late request never replaces another question/account.
  if(learning!==session)return;
  response.ai={status:'loading'};render();
  try{
   const result=await fetch('/api/study-agent',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({deckId:deck.id,questionIndex:q.id,picks:response.picks}),signal:AbortSignal.timeout(85000)});
   const data=await result.json();
   if(!result.ok)throw new Error(data.error||'Chưa tra cứu được. Bạn thử lại sau nhé.');
   if(typeof data.explanation!=='string'||!Array.isArray(data.sources))throw new Error('Kết quả AI chưa đầy đủ. Bạn thử lại sau nhé.');
   // Defense in depth: links are always HTTPS; provider responses are rendered as text only.
   data.sources=data.sources.filter(s=>{try{return new URL(s.url).protocol==='https:';}catch{return false;}});
   response.ai={status:'ready',data};
  }catch(error){response.ai={status:'error',error:error.name==='TimeoutError'?'Tra cứu mất nhiều thời gian. Bạn thử lại sau nhé.':error instanceof SyntaxError?'Dịch vụ AI chưa sẵn sàng. Bạn thử lại sau nhé.':error.message||'Chưa kết nối được dịch vụ AI.'};}
  if(learning===session){render();document.querySelector('.study-agent')?.scrollIntoView?.({block:'nearest'});}
 };
}
