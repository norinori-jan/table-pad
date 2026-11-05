(function(){
'use strict';
if(window.TablePadOfficialWorkspace)return;
const HOST_ID='tpOfficialTools';
function host(){
 let root=document.getElementById('tpOfficialWorkspace');
 if(!root){
  root=document.createElement('section');root.id='tpOfficialWorkspace';
  root.style.cssText='margin:14px 12px;padding:14px;border:1px solid #323a4d;border-radius:14px;background:#181b24;color:#eef1f7';
  const title=document.createElement('h2');title.textContent='公的データ取得';title.style.cssText='font-size:18px;margin:0 0 6px';
  const note=document.createElement('p');note.textContent='公的機関の情報源を選択し、取得内容を確認してから表へ保存します。';note.style.cssText='font-size:13px;line-height:1.6;color:#9aa3b8;margin:0 0 12px';
  const tools=document.createElement('div');tools.id=HOST_ID;tools.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:10px;align-items:start';
  root.append(title,note,tools);document.body.appendChild(root);
 }
 return root.querySelector('#'+HOST_ID);
}
function prepare(box){
 box.style.position='relative';box.style.inset='auto';box.style.setProperty('right','auto','important');box.style.setProperty('bottom','auto','important');box.style.left='auto';box.style.setProperty('z-index','auto','important');
 box.style.display='block';box.style.width='100%';box.style.maxWidth='100%';box.style.margin='0';box.style.fontFamily='system-ui,sans-serif';
}
function mount(box){prepare(box);const target=host();if(box.parentNode!==target)target.appendChild(box);}
window.TablePadOfficialWorkspace={mount,prepare,reset:prepare,host};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',host,{once:true});else host();
})();