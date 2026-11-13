const fs=require('node:fs');
const url=process.env.SUPABASE_URL||'',key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'';
if((url&&!key)||(!url&&key))throw Error('Set both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
if(url&&!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))throw Error('Invalid hosted Supabase URL.');
if(key.startsWith('sb_secret_'))throw Error('A secret key must never be put in the browser. Use a publishable key.');
if(key.split('.').length===3){try{const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url'));if(payload.role!=='anon')throw Error('Not an anon key');}catch{throw Error('Only an anon JWT or publishable key is allowed.');}}
fs.writeFileSync('public/config.js','window.ONKI_CONFIG = '+JSON.stringify({supabaseUrl:url.replace(/\/$/,''),supabaseKey:key})+';\n');
console.log(url?'Built with Supabase account support.':'Built in guest mode. Account login requires Supabase configuration.');
