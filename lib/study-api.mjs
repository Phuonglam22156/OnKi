import { resolveQuestion, researchQuestion } from './study-agent.mjs';

const unavailable = {code:'AI_SETUP_REQUIRED',error:'Trợ lý AI chưa được kích hoạt. Chủ website cần bật dịch vụ AI trước khi bạn có thể tra cứu.'};
const reply = (res,status,data) => res.status(status).json(data);

export function makeStudyHandler({env=process.env, fetcher=fetch, research=researchQuestion}={}) {
  return async function handler(req,res) {
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Vary','Authorization');
    if(req.method !== 'POST') {res.setHeader('Allow','POST');return reply(res,405,{error:'Phương thức không được hỗ trợ.'});}
    const authorization = req.headers.authorization || '';
    if(!/^Bearer [A-Za-z0-9_.-]{20,8192}$/.test(authorization))return reply(res,401,{code:'LOGIN_REQUIRED',error:'Đăng nhập để dùng trợ lý AI.'});
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || ''))return reply(res,415,{error:'Dữ liệu gửi lên không hợp lệ.'});
    if(Number(req.headers['content-length'] || 0)>5000)return reply(res,413,{error:'Nội dung quá dài.'});
    let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(body) || '')>5000)throw Error();}catch{return reply(res,400,{error:'Dữ liệu gửi lên không hợp lệ.'});}
    const context=resolveQuestion(body);
    if(!context)return reply(res,400,{error:'Câu hỏi hoặc lựa chọn không hợp lệ. AI hiện hỗ trợ các bộ đề DBS401 gốc.'});
    const base=env.SUPABASE_URL?.replace(/\/$/,''), publicKey=env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY, secret=env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
    if(!base || !publicKey || !secret || !env.GEMINI_API_KEY || env.AI_STUDY_ENABLED==='false')return reply(res,503,unavailable);
    try {
      const userResponse=await fetcher(base+'/auth/v1/user',{headers:{apikey:publicKey,Authorization:authorization},signal:AbortSignal.timeout(7000)});
      if(userResponse.status===401 || userResponse.status===403)return reply(res,401,{code:'LOGIN_REQUIRED',error:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'});
      if(!userResponse.ok)throw Error('Auth unavailable');
      const user=await userResponse.json();
      if(!user?.id || user.is_anonymous || !user.email_confirmed_at)return reply(res,403,{error:'Vui lòng xác nhận email trước khi dùng AI.'});
      const quotaHeaders={apikey:secret,'Content-Type':'application/json'};
      if(!secret.startsWith('sb_secret_'))quotaHeaders.Authorization='Bearer '+secret;
      const quota=await fetcher(base+'/rest/v1/rpc/reserve_study_agent_request',{method:'POST',headers:quotaHeaders,body:JSON.stringify({requested_user:user.id}),signal:AbortSignal.timeout(7000)});
      if(!quota.ok)throw Error('Quota unavailable');
      const reservation=await quota.json();
      if(reservation!=='ok'){
        res.setHeader('Retry-After',reservation==='wait'?'15':'3600');
        return reply(res,429,{code:'AI_LIMIT',error:reservation==='wait'?'Chờ 15 giây trước khi tra cứu tiếp nhé.':reservation==='user_limit'?'Bạn đã dùng 10 lượt AI hôm nay. Bạn có thể tiếp tục vào ngày mai.':'Ônki đã dùng hết lượt AI chung trong kỳ này. Bạn vẫn có thể học và làm bài bình thường.'});
      }
      const result=await research(context,{apiKey:env.GEMINI_API_KEY,signal:AbortSignal.timeout(60000)});
      return reply(res,200,result);
    }catch(error){
      const status=error.statusCode || error.cause?.statusCode;
      console.warn('study_agent_error',{status:status||null,code:error.code||null,name:error.name||'Error'});
      // Never return upstream bodies, prompts, auth headers, or credentials.
      if(status===401 || status===402 || status===403 || status===404)return reply(res,503,unavailable);
      if(status===429)return reply(res,429,{code:'AI_FREE_QUOTA',error:'AI đã chạm hạn mức miễn phí của Google hoặc đang bị giới hạn tốc độ. Bạn thử lại sau nhé. Ônki không tự chuyển sang dịch vụ trả phí.'});
      return reply(res,502,{error:'Chưa tra cứu được lần này. Bạn có thể thử lại sau; đáp án và tiến độ học vẫn được giữ nguyên.'});
    }
  };
}
