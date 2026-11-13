let learning=null;

function learningQuestions(){
 if(current.questions)return current.questions.map((q,id)=>({...q,id,options:[...q.options],answerIndices:[...q.answerIndices]})).filter(q=>q.answerIndices.length>0);
 return current.cards.map((card,id)=>{const options=shuffle([card[1],...shuffle(current.cards.filter((_,i)=>i!==id).map(c=>c[1])).slice(0,3)]);return {id,term:card[0],options,answerIndices:[options.indexOf(card[1])]};});
}

function startLearning(questions){
 const list=questions||learningQuestions();
 learning={deckId:current.id,questions:list,index:0,responses:list.map(()=>({picks:[],wrong:false,finished:false})),ended:false};
}

function chooseLearning(choice){
 if(!learning||learning.ended||learning.deckId!==current?.id)return false;
 const q=learning.questions[learning.index],response=learning.responses[learning.index];
 if(!q||response.finished||!Number.isInteger(choice)||choice<0||choice>=q.options.length||response.picks.includes(choice))return false;
 response.picks.push(choice);
 response.wrong=!q.answerIndices.includes(choice);
 response.finished=response.wrong||q.answerIndices.every(i=>response.picks.includes(i));
 if(response.finished){
  const ids=known(current);
  state.known[current.id]=response.wrong?ids.filter(id=>id!==q.id):[...new Set([...ids,q.id])];
  activity();save();
 }
 return true;
}

function learningHTML(){
 if(!learning||learning.deckId!==current.id)startLearning();
 const {questions,responses,index:position}=learning;
 if(!questions.length)return '<div class="empty">Bộ thẻ chưa có câu hỏi kèm đáp án để học tự động. Bạn có thể xem nội dung trong mục Xem đề gốc.</div>';
 if(learning.ended){
  const correct=responses.filter(r=>r.finished&&!r.wrong).length,wrong=responses.filter(r=>r.wrong).length;
  return `<div class="quiz-box"><div class="result learning-result"><div class="eyebrow">HOÀN THÀNH BUỔI HỌC</div><div class="learning-result-icon">${icon('checkcircle',42)}</div><h2>${wrong?'Bạn đang tiến bộ từng câu!':'Bạn đã nắm chắc bộ câu hỏi này!'}</h2><p class="muted">${correct}/${questions.length} câu đúng ngay lần đầu · ${wrong} câu cần ôn lại.</p><p class="muted">Tiến độ ghi nhớ đã được cập nhật. Buổi học này không tính vào lịch sử bài kiểm tra.</p><div class="learning-result-actions">${wrong?'<button class="primary" id="learn-mistakes">'+icon('rotate',16)+' Ôn lại câu sai</button>':''}<button class="secondary" id="learn-restart">Học lại cả bộ</button><button class="secondary" data-go="progress">Xem tiến độ</button></div></div></div>`;
 }
 const q=questions[position],response=responses[position],multi=q.answerIndices.length>1,completed=responses.filter(r=>r.finished).length;
 let feedback='';
 if(response.picks.length){
  if(response.finished){feedback=`<div id="learn-feedback" class="learning-feedback ${response.wrong?'is-wrong':'is-correct'}" role="status" aria-live="polite"><strong>${icon(response.wrong?'close':'checkcircle',20)} ${response.wrong?'Chưa đúng — cùng ghi nhớ đáp án nhé!':'Chính xác!'}</strong><p>Đáp án đúng: ${q.answerIndices.map(i=>`<b>${String.fromCharCode(65+i)}.</b> ${esc(q.options[i])}`).join('<br>')}</p>${response.wrong?'<small>Câu này được đánh dấu cần ôn lại.</small>':'<small>Câu này đã được ghi nhận vào tiến độ ghi nhớ.</small>'}</div>`;}
  else{feedback=`<div id="learn-feedback" class="learning-feedback is-partial" role="status" aria-live="polite"><strong>${icon('checkcircle',20)} Lựa chọn này đúng!</strong><p>Hãy chọn thêm ${q.answerIndices.filter(i=>!response.picks.includes(i)).length} đáp án đúng để hoàn thành câu này.</p></div>`;}
 }
 return `<div class="quiz-box learning-box" id="learning-question"><div class="flash-top"><span>HỌC TỪNG CÂU · ${position+1} / ${questions.length}</span><span>${completed} câu đã học</span></div><div class="track"><div style="width:${completed/questions.length*100}%"></div></div><h2>${q.number?'Câu '+q.number+'. ':''}${esc(q.term)}</h2><p class="muted">${multi?'Chọn '+q.answerIndices.length+' đáp án đúng. Mỗi lựa chọn được báo đúng/sai ngay.':'Chọn một đáp án để xem kết quả ngay.'}</p><div class="options learn-options">${q.options.map((option,i)=>{
  const picked=response.picks.includes(i),correct=q.answerIndices.includes(i),revealed=response.finished&&correct;
  const status= picked?(correct?'answer-correct':'answer-wrong'):(revealed?'answer-correct':'');
  const badge=picked?(correct?'Bạn chọn · Đúng':'Bạn chọn · Sai'):(revealed?'Đáp án đúng':'');
  return `<button class="option ${status}" data-learn-answer="${i}" ${response.finished||picked?'disabled':''} aria-pressed="${picked}"><span class="letter">${String.fromCharCode(65+i)}</span><span class="learning-option-text">${esc(option)}${badge?'<small class="answer-label">'+icon(correct?'check':'close',13)+' '+badge+'</small>':''}</span>${status?'<span class="answer-symbol">'+icon(correct?'checkcircle':'close',19)+'</span>':''}</button>`;
 }).join('')}</div>${feedback}<div class="quiz-nav"><button class="secondary" id="learn-previous" ${position===0?'disabled':''}>← Câu trước</button><button class="primary" id="learn-next" ${!response.finished?'disabled':''}>${position===questions.length-1?'Hoàn thành buổi học':'Câu tiếp theo →'}</button></div>${!response.picks.length?'<p class="hint">Kết quả xuất hiện ngay khi bạn chọn. Không cần nộp bài.</p>':''}</div>`;
}

function bindLearning(){
 document.querySelectorAll('[data-learn-answer]').forEach(button=>button.onclick=()=>{if(chooseLearning(Number(button.dataset.learnAnswer))){render();document.getElementById('learn-feedback')?.scrollIntoView?.({block:'nearest'});}});
 const next=document.getElementById('learn-next');
 if(next)next.onclick=()=>{if(!learning.responses[learning.index]?.finished)return;if(learning.index===learning.questions.length-1)learning.ended=true;else learning.index++;render();(document.getElementById('learning-question')||document.querySelector('.learning-result'))?.scrollIntoView?.({block:'start'});};
 const previous=document.getElementById('learn-previous');
 if(previous)previous.onclick=()=>{if(learning.index>0){learning.index--;render();document.getElementById('learning-question')?.scrollIntoView?.({block:'start'});}};
 const restart=document.getElementById('learn-restart');
 if(restart)restart.onclick=()=>{startLearning();render();};
 const mistakes=document.getElementById('learn-mistakes');
 if(mistakes)mistakes.onclick=()=>{const questions=learning.questions.filter((_,i)=>learning.responses[i].wrong);startLearning(questions);render();};
}
