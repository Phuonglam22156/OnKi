self.onmessage=async event=>{
 try{
  importScripts('vendor/import/mammoth.browser.js');
  const result=await mammoth.convertToHtml({arrayBuffer:event.data},{includeEmbeddedStyleMap:false,externalFileAccess:false,convertImage:mammoth.images.imgElement(()=>Promise.resolve({src:''}))});
  if(result.value.length>3000000)throw Error('Tài liệu quá dài. Hãy chia thành nhiều file nhỏ hơn.');
  self.postMessage({html:result.value});
 }catch(error){self.postMessage({error:error.message||'Không đọc được file Word.'});}
};
