(function(){
'use strict';
if(window.__tpWorkspaceSplit)return;
window.__tpWorkspaceSplit=true;
const $=id=>document.getElementById(id);
const style=document.createElement('style');
style.textContent=`
#tpWorkspaceNav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px 12px;background:var(--bg);border-bottom:1px solid var(--bd)}
#tpWorkspaceNav button{min-width:0;min-height:46px;font-weight:700;white-space:normal;line-height:1.25}
#tpWorkspaceNav button[aria-pressed="true"]{background:var(--blue);border-color:var(--blue);color:#fff}
.tp-workspace-panel{min-width:0;padding-bottom:12px}
.tp-workspace-panel[hidden]{display:none!important}
#tpWorkspaceGov,#tpWorkspaceNews{padding:12px}
.tp-workspace-note{color:var(--dim);font-size:13px;line-height:1.6;margin:0 0 12px}
#tpWorkspaceGov #tpOfficialWorkspace{margin:0;padding:0;border:0;background:transparent}
#tpWorkspaceNews #rv{display:block!important}
#tpWorkspaceNews #tpnl-root{margin:12px 0}
#tpWorkspaceNews #tpnc-open{position:static;display:block;width:100%;margin:12px 0;border-radius:10px}
@media(max-width:600px){#tpWorkspaceNav{padding:8px;gap:6px}#tpWorkspaceNav button{font-size:14px;padding:8px 5px}.tp-workspace-panel{padding-bottom:10px}}
`;
document.head.appendChild(style);
const header=document.querySelector('header');
const views=$('views'),rv=$('rv');
if(!header||!views||!rv)return;
const nav=document.createElement('nav');nav.id='tpWorkspaceNav';nav.setAttribute('aria-label','作業画面');
const configs=[['table','▦ 表・分析'],['gov','🏛 公的データ'],['news','📰 ニュース']];
const panels={};
for(const [key,label] of configs){
 const b=document.createElement('button');b.type='button';b.dataset.workspace=key;b.textContent=label;b.setAttribute('aria-pressed',key==='table'?'true':'false');nav.appendChild(b);
 const p=document.createElement('section');p.id='tpWorkspace'+key[0].toUpperCase()+key.slice(1);p.className='tp-workspace-panel';p.hidden=key!=='table';panels[key]=p;
}
header.insertAdjacentElement('afterend',nav);
nav.insertAdjacentElement('afterend',panels.table);
panels.table.insertAdjacentElement('afterend',panels.gov);
panels.gov.insertAdjacentElement('afterend',panels.news);
const tableIds=['views','tabs','title','wrap','hint','bar','cv','lv','sv','xv','zv','dv','fv','toast'];
tableIds.forEach(id=>{const el=$(id);if(el)panels.table.appendChild(el)});
const govTitle=document.createElement('h2');govTitle.textContent='国内・政府系データ';govTitle.style.cssText='font-size:18px;margin:4px 0 6px';
const govNote=document.createElement('p');govNote.className='tp-workspace-note';govNote.textContent='政府統計・地理・気象・金融などの公的情報源を選び、取得・確認してから表に保存します。';
panels.gov.append(govTitle,govNote);
const newsTitle=document.createElement('h2');newsTitle.textContent='ニュース';newsTitle.style.cssText='font-size:18px;margin:4px 0 6px';
const newsNote=document.createElement('p');newsNote.className='tp-workspace-note';newsNote.textContent='世界ニュースの検索・見出し保存と、国別の報道比較を行います。公的データ取得とは独立した領域です。';
panels.news.append(newsTitle,newsNote);
const newsTools=document.createElement('div');newsTools.id='tpNewsTools';panels.news.appendChild(newsTools);
function move(){
 const gov=$('tpOfficialWorkspace');if(gov&&gov.parentNode!==panels.gov)panels.gov.appendChild(gov);
 ['rv','tpnl-root','tpnc-open'].forEach(id=>{const el=$(id);if(el&&el.parentNode!==newsTools)newsTools.appendChild(el)});
}
move();
const observer=new MutationObserver(()=>move());observer.observe(document.body,{childList:true,subtree:true});
nav.addEventListener('click',e=>{
 const b=e.target.closest('button[data-workspace]');if(!b)return;
 const key=b.dataset.workspace;
 Object.entries(panels).forEach(([k,p])=>{p.hidden=k!==key;nav.querySelector('[data-workspace="'+k+'"]').setAttribute('aria-pressed',k===key?'true':'false')});
});
if(location.hash==='#news'||location.hash==='#gov')nav.querySelector('[data-workspace="'+(location.hash==='#news'?'news':'gov')+'"]').click();
})();