// Public primary documentation only; never accept a URL from the browser or the model.
export const OFFICIAL_DOMAINS=['learn.microsoft.com','docs.oracle.com','dev.mysql.com','www.postgresql.org','cheatsheetseries.owasp.org'];
const oracleUsers={title:'Oracle Database 19c — User security and profiles',url:'https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/managing-security-for-oracle-database-users.html'};
const oracleRoles={title:'Oracle Database 19c — Privileges and roles',url:'https://docs.oracle.com/en/database/oracle/oracle-database/19/dbseg/configuring-privilege-and-role-authorization.html'};
const windows={title:'Microsoft — Programming Guide for 64-bit Windows',url:'https://learn.microsoft.com/en-us/windows/win32/winprog64/programming-guide-for-64-bit-windows'};
const mysql={title:'MySQL 8.4 — Access control and account management',url:'https://dev.mysql.com/doc/refman/8.4/en/access-control.html'};
const injection={title:'OWASP — SQL Injection Prevention Cheat Sheet',url:'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'};
export function officialUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&OFFICIAL_DOMAINS.includes(u.hostname)?u.href:null;}catch{return null;}}

export async function findReferences(context,{fetcher=fetch,signal}={}){
 const text=[context.question.term,...context.question.options].join(' '),refs=[];
 if(/operating system|\b(?:32|64)[ -]?bit/i.test(text))refs.push(windows);
 if(/oracle|\bprofile\b|dbms_|sysdba|sysoper|dba_|pl\/sql|tablespace/i.test(text))refs.push(/role|privilege|grant|revoke/i.test(text)?oracleRoles:oracleUsers);
 if(/mysql/i.test(text))refs.push(mysql);
 if(/injection|parameterized|prepared statement/i.test(text))refs.push(injection);
 if(!refs.length)refs.push(/role|privilege|grant|revoke/i.test(text)?oracleRoles:oracleUsers);
 // Learn's public search index supplies relevant Microsoft documentation without a paid search API.
 try{
  const query='SQL Server '+context.question.term.replace(/[^\p{L}\p{N}\s]/gu,' ').slice(0,220);
  const url=new URL('https://learn.microsoft.com/api/search');url.searchParams.set('search',query);url.searchParams.set('locale','en-us');url.searchParams.set('$top','8');
  const r=await fetcher(url,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(5000)]):AbortSignal.timeout(5000)});
  if(r.ok){const body=await r.json();for(const item of body.results||[]){const link=officialUrl(item.url);if(link&&new URL(link).hostname==='learn.microsoft.com'&&/\/(sql|troubleshoot\/sql|windows\/win32)\//.test(new URL(link).pathname))refs.push({title:String(item.title||'Microsoft Learn').slice(0,200),url:link});}}
 }catch{/* A search outage does not masquerade as verified evidence. URL retrieval is checked separately. */}
 return [...new Map(refs.map(r=>[r.url,r])).values()].slice(0,3);
}
