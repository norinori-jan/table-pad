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
#tpWorkspaceGov .tp-workspace-note,#tpWorkspaceNews .tp-workspace-note{color:var(--dim);font-size:13px;line-height:1.6;margin:0 0 12px}
#tpWorkspaceGov .tp-gov-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:8px}
#tpWorkspaceGov .tp-gov-tools>div{position:relative!important;inset:auto!important;right:auto!important;bottom:auto!important;left:auto!important;z-index:auto!important;max-width:100%;width:100%;margin:0}
#tpWorkspaceGov .tp-gov-tools>div>button{width:100%;max-width:100%;white-space:normal;min-height:46px}
#tpWorkspaceGov .tp-gov-tools>div>div{position:static!important;width:100%!important;max-width:100%!important;max-height:55vh!important;margin-top:8px;overflow:auto!important}
#tpWorkspaceGov .tp-gov-tools>div[hidden],#tpWorkspaceGov .tp-gov-tools>div>div[hidden]{display:none!important}
#tpWorkspaceNews #rv{display:block!important}
#tpWorkspaceNews #tpnl-root{margin:12px 0}
#tpWorkspaceNews #tpnc-open{position:static!important;display:block;width:100%;margin:12px 0;border-radius:10px}
#tpWorkspaceNews #tpnc-cover{position:fixed!important}
@media(max-width:600px){#tpWorkspaceNav{padding:8px;gap:6px}#tpWorkspaceNav button{font-size:14px;padding:8px 5px}.tp-workspace-panel{padding-bottom:10px}}
`;
document.head.appendChild(style);
const nav=document.createElement('nav');nav.id='tpWorkspaceNav';nav.setAttribute('aria-label','作業画面');
const configs=[['table','▦ 表・分析'],['gov','🏛 公的データ'],['news','📰 ニュース']];
const panels={};
configs.forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.dataset.workspace=key;b.textContent=label;b.setAttribute('aria-pressed',key==='table'?'true':'false');nav.appendChild(b);const p=document.createElement('section');p.id='tpWorkspace'+key[0].toUpperCase()+key.slice(1);p.className='tp-workspace-panel';p.hidden=key!=='table';panels[key]=p;});
const header=document.querySelector('header');
if(!header||!$('views')||!$('rv'))return;
header.insertAdjacentElement('afterend',nav);
const table=panels.table;nav.insertAdjacentElement('afterend',table);
table.insertAdjacentElement('afterend',panels.gov);panels.gov.insertAdjacentElement('afterend',panels.news);
const tableIds=['views','tabs','title','wrap','hint','bar','cv','lv','sv','xv','zv','dv','fv'];
tableIds.forEach(id=>{const el=$(id);if(el)table.appendChild(el)});
const gov=panels.gov;const gh=document.createElement('h2');gh.textContent='国内・政府系データ';gh.style.cssText='font-size:18px;margin:4px 0 6px';gov.appendChild(gh);
const gn=document.createElement('p');gn.className='tp-workspace-note';gn.textContent='政府統計・地理・気象・金融などの公的情報源を選び、取得・確認・表への記録を行います。表・グラフの画面とは独立して操作できます。';gov.appendChild(gn);
const tools=document.createElement('div');tools.className='tp-gov-tools';gov.appendChild(tools);
const news=panels.news;const nh=document.createElement('h2');nh.textContent='ニュース';nh.style.cssText='font-size:18px;margin:4px 0 6px';news.appendChild(nh);
const nn=document.createElement('p');nn.className='tp-workspace-note';nn.textContent='世界ニュースの検索・見出し確認・保存を行います。ニュースの取得・更新は表・分析の画面から切り離されています。';news.appendChild(nn);
const moveGov=()=>{const selectors=['#tpOfficialInfo','#tpOfficialData','#tpGsiObs','#tpJmaObs','#tpEStatObs','#tpBOJObs','#tpMOFObs','#tpFSAObs'];selectors.forEach(s=>document.querySelectorAll(s).forEach(el=>{if(!tools.contains(el))tools.appendChild(el)}));};
const moveNews=()=>{['rv','tpnl-root','tpnc-open','tpnc-cover'].forEach(id=>{const el=$(id);if(el&&!news.contains(el))news.appendChild(el)});};
moveGov();moveNews();
const mo=new MutationObserver(()=>{moveGov();moveNews()});mo.observe(document.body,{childList:true,subtree:true});
nav.addEventListener('click',e=>{const b=e.target.closest('button[data-workspace]');if(!b)return;const key=b.dataset.workspace;Object.entries(panels).forEach(([k,p])=>{p.hidden=k!==key;nav.querySelector('[data-workspace="'+k+'"]').setAttribute('aria-pressed',k===key?'true':'false')});if(key==='table'&&typeof window.render==='function')window.render();});
const hash=location.hash;
if(hash==='#news'||hash==='#gov'){const key=hash==='#news'?'news':'gov';nav.querySelector('[data-workspace="'+key+'"]').click()}
})();
