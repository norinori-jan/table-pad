(()=>{'use strict';
if(window.__tpNewsLite)return;window.__tpNewsLite=true;
const KEY='tpNewsLite.v2',DAY='tpNewsLite.day.v2',LIMIT='tpNewsLite.limit.v2',LAST='tpNewsLite.lastRequestAt.v1',BACKOFF='tpNewsLite.backoffUntil.v1',MIN=5000,WORKER='tpNewsLite.workerUrl.v1';
const $=id=>document.getElementById(id),today=()=>new Date().toISOString().slice(0,10);
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'')}catch{return f}};
const state=()=>{const s=read(KEY,{items:[]});return s&&Array.isArray(s.items)?s:{items:[]}};
const day=()=>{const d=read(DAY,null);return d&&d.day===today()?d:{day:today(),bytes:0,requests:0}};
const limit=()=>Number(localStorage.getItem(LIMIT)||500000);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>{try{const u=new URL(String(s||''));return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}};
const fmt=n=>n<1024?n+' B':n<1048576?(n/1024).toFixed(1)+' KB':(n/1048576).toFixed(2)+' MB';
const CATS=[
{id:'security',name:'政治・外交・安全保障',terms:['war','attack','missile','military','defense','defence','invasion','ceasefire','sanction','nato','coup','election','president','prime minister','foreign minister','minister of defense','diplomacy','diplomatic','parliament','government','security','hostage','terrorism','peace talks','border clash','armed forces','iran','israel','ukraine','taiwan','戦争','攻撃','ミサイル','軍事','防衛','侵攻','停戦','制裁','選挙','大統領','首相','外相','国防相','外交','議会','政府','安全保障','人質','テロ','和平交渉','война','атака','армия','战争','袭击','军事','外交','إيران','حرب','وزير الخارجية','انتخابات']},
{id:'economy',name:'経済・金融',terms:['economy','economic','inflation','interest rate','central bank','federal reserve','stock market','market','trade','tariff','bank','debt','gdp','unemployment','currency','bitcoin','cryptocurrency','oil price','investment','investor','company','companies','business','billion','trillion','budget','finance','financial','経済','金融','物価','インフレ','金利','中央銀行','株式','市場','貿易','関税','銀行','債務','雇用','通貨','原油','投資','企業','財政','миллиард','экономика','инфляц','рынок','经济','金融','通胀','利率','贸易','银行','债务','投资','公司']},
{id:'science',name:'科学・技術・AI',terms:['artificial intelligence','machine learning','generative ai',' ai ','robot','semiconductor','chip','quantum','space','nasa','satellite','research','scientist','technology','tech','cyber','software','data center','computer','innovation','科学','技術','人工知能','半導体','量子','宇宙','衛星','研究','ロボット','サイバー','ソフトウェア','технолог','исследован','人工智能','芯片','科技','机器人','ذكاء اصطناعي']},
{id:'disaster',name:'災害・環境・エネルギー',terms:['earthquake','tsunami','typhoon','hurricane','flood','wildfire','volcano','climate','global warming','emissions','renewable energy','nuclear plant','disaster','storm','drought','heatwave','energy crisis','power outage','災害','地震','津波','台風','洪水','山火事','火山','気候','温暖化','再生可能エネルギー','原発','干ばつ','猛暑','停電','землетряс','наводнен','地震','洪水','气候','能源','زلزال','مناخ']},
{id:'society',name:'社会・人道・健康',terms:['humanitarian','refugee','migration','migrant','protest','strike','human rights','health','outbreak','epidemic','pandemic','hospital','education','crime','court','poverty','food crisis','aid worker','social','society','人口','社会','人道','難民','移民','抗議','人権','医療','感染','病院','教育','裁判','貧困','食料危機','福祉','бежен','протест','здравоохран','难民','人权','医疗','لاجئ','احتجاج','صحة']}
];
const REGIONS=[
[/\b(usa|united states|america|canada|mexico|brazil|argentina|chile|peru)\b|米国|アメリカ|カナダ|ブラジル|アルゼンチン|メキシコ/i,'北米・中南米'],
[/\b(china|beijing|japan|tokyo|taiwan|korea|india|pakistan|indonesia|philippines|australia|new zealand|vietnam|thailand)\b|中国|北京|日本|東京|台湾|韓国|インド|パキスタン|インドネシア|フィリピン|豪州|ベトナム|タイ/i,'東アジア・南アジア・太平洋'],
[/\b(uk|britain|united kingdom|france|germany|russia|ukraine|italy|spain|poland|europe|brussels)\b|英国|イギリス|フランス|ドイツ|ロシア|ウクライナ|イタリア|スペイン|欧州|ヨーロッパ/i,'欧州'],
[/\b(israel|palestine|gaza|iran|iraq|syria|lebanon|saudi|yemen|turkey|uae|qatar|egypt)\b|イスラエル|パレスチナ|ガザ|イラン|イラク|シリア|レバノン|サウジ|イエメン|トルコ|エジプト/i,'中東'],
[/\b(africa|nigeria|kenya|ethiopia|sudan|somalia|south africa|ghana|congo)\b|アフリカ|ナイジェリア|ケニア|エチオピア|スーダン|ソマリア|南アフリカ|コンゴ/i,'アフリカ'],
[/\b(world|global|international|united nations)\b|世界|国際|国連/i,'世界・複数地域']
];

const COUNTRIES=[
['米国',['united states','u.s.','usa','american','washington dc','white house']],['中国',['china','chinese','beijing','xi jinping','中国','北京']],['日本',['japan','japanese','tokyo','日本','東京']],['台湾',['taiwan','taipei','台湾','台北']],['韓国',['south korea','south korean','seoul','韓国','ソウル']],['北朝鮮',['north korea','north korean','pyongyang','北朝鮮','平壌']],['インド',['india','indian','new delhi','インド']],['パキスタン',['pakistan','pakistani','パキスタン']],['インドネシア',['indonesia','indonesian','jakarta','インドネシア']],['フィリピン',['philippines','filipino','manila','フィリピン']],['豪州',['australia','australian','canberra','sydney','オーストラリア','豪州']],['英国',['united kingdom','britain','british','uk government','london','英国','イギリス']],['フランス',['france','french','paris','フランス']],['ドイツ',['germany','german','berlin','ドイツ']],['ロシア',['russia','russian','moscow','ロシア']],['ウクライナ',['ukraine','ukrainian','kyiv','ウクライナ']],['イスラエル',['israel','israeli','テルアビブ','イスラエル']],['パレスチナ',['palestine','palestinian','gaza','west bank','パレスチナ','ガザ']],['イラン',['iran','iranian','tehran','イラン']],['イラク',['iraq','iraqi','baghdad','イラク','バグダッド']],['サウジアラビア',['saudi arabia','saudi','リヤド','サウジ']],['トルコ',['turkey','turkish','ankara','トルコ']],['エジプト',['egypt','egyptian','cairo','エジプト']],['南アフリカ',['south africa','south african','南アフリカ']],['ナイジェリア',['nigeria','nigerian','ナイジェリア']],['ケニア',['kenya','kenyan','ケニア']],['カナダ',['canada','canadian','ottawa','カナダ']],['メキシコ',['mexico','mexican','メキシコ']],['ブラジル',['brazil','brazilian','ブラジル']],['アルゼンチン',['argentina','argentinian','アルゼンチン']],['チリ',['chile','chilean','チリ']],['ベネズエラ',['venezuela','venezuelan','ベネズエラ']]
];
function detectCountry(t){
 for(const [name,terms] of COUNTRIES){for(const term of terms){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\function enrich(a){');const re=new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+'([^\\p{L}\\p{N}]|$)','iu');if(re.test(t))return name}}
 return '国不明';
}
function enrich(a){
 const raw=String(a.title||''),t=' '+raw.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,' ')+' ';
 const matches=CATS.map(c=>({c,score:c.terms.reduce((n,k)=>n+(t.includes(k)?(k.trim().length>=9?2:1):0),0)})).sort((x,y)=>y.score-x.score);
 const c=matches[0]?.score>0?matches[0].c:{id:'other',name:'その他'};
 const critical=['war','invasion','missile strike','airstrike','coup','earthquake','tsunami','hurricane','pandemic','ceasefire','nuclear threat','terror attack','mass casualty','state of emergency','戦争','侵攻','ミサイル攻撃','空爆','クーデター','地震','津波','台風','感染症','停戦','核危機','テロ','非常事態','война','землетряс','袭击','战争','地震','حرب','زلزال'];
 const high=['attack','military','defense','defence','sanction','election','president','prime minister','foreign minister','parliament','central bank','interest rate','inflation','debt','bankruptcy','trade war','artificial intelligence','semiconductor','cyberattack','climate','refugee','humanitarian','outbreak','energy crisis','大統領','首相','外相','議会','中央銀行','金利','インフレ','債務','破綻','制裁','軍事','防衛','選挙','人工知能','半導体','サイバー攻撃','難民','人道','感染','エネルギー危機','制裁','атака','армия','санкц','инфляц','人工智能','袭击','制裁','لاجئ','هجوم'];
 const low=['horoscope','celebrity','entertainment','lifestyle','recipe','gossip','sports results','fashion','占い','芸能','娯楽','レシピ','ゴシップ','ファッション'];
 const archive=['transcript','2003','archive','photo gallery','weekly horoscope','obituary','訃報','写真特集'];
 const criticalHit=critical.some(k=>t.includes(k)),highHit=high.some(k=>t.includes(k)),lowHit=low.some(k=>t.includes(k)),archiveHit=archive.some(k=>t.includes(k));
 let score=20+(c.id!=='other'?15:0)+(highHit?25:0)+(criticalHit?40:0);
 if(lowHit)score-=25;if(archiveHit)score-=15;
 score=Math.max(0,Math.min(100,score));
 const importanceLabel=score>=75?'高':score>=45?'中':'低';
 let region='地域不明';for(const x of REGIONS){if(x[0].test(t)){region=x[1];break}}\n const country=detectCountry(t);
 if(/\b(baghdad|iraq|iran|israel|gaza|palestine|syria|lebanon|yemen|saudi arabia|uae|qatar|jordan|kuwait|oman|bahrain)\b|バグダッド|イラク|イラン|イスラエル|ガザ|パレスチナ|シリア|レバノン|イエメン|サウジ/i.test(t))region='中東';
 if(/\b(nigeria|kenya|ethiopia|sudan|somalia|ghana|congo|south africa|africa|morocco|algeria|tunisia|libya)\b|ナイジェリア|ケニア|エチオピア|スーダン|ソマリア|ガーナ|コンゴ|南アフリカ|アフリカ|モロッコ|アルジェリア|チュニジア|リビア/i.test(t))region='アフリカ';
 if(/\b(usa|united states|washington dc|canada|mexico|brazil|argentina|chile|peru|colombia|venezuela)\b|米国|アメリカ|カナダ|メキシコ|ブラジル|アルゼンチン|チリ|ペルー|コロンビア|ベネズエラ/i.test(t))region='北米・中南米';
 /* Do not infer the story's geography from the publisher's country-code domain. */
 return {...a,date:String(a.date||a.seendate||''),category:c.name,categoryId:c.id,importance:score,importanceLabel,region,country};
}
function norm(s){return String(s||'').toLowerCase().normalize('NFKC').replace(/https?:\/\/\S+/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function grams(s){const x=norm(s).replace(/\s/g,''),o=new Set();if(x.length<3){if(x)o.add(x);return o}for(let i=0;i<x.length-2;i++)o.add(x.slice(i,i+3));return o}
function near(a,b){const x=grams(a),y=grams(b);if(!x.size||!y.size)return false;let n=0;for(const z of x)if(y.has(z))n++;return n/Math.max(1,x.size+y.size-n)>=.78}
function dedupe(items){
 const sorted=items.map(enrich).sort((a,b)=>b.importance-a.importance||String(b.date||'').localeCompare(String(a.date||''))),out=[],urls=new Set();
 for(const a of sorted){const u=safe(a.url);if(!u||urls.has(u))continue;if(out.some(b=>norm(a.title)===norm(b.title)||near(a.title,b.title)))continue;urls.add(u);out.push(a)}
 return out;
}
function balance(items,max){const buckets=new Map(),unknown=[];for(const a of items){if(a.region==='地域不明'){unknown.push(a);continue}if(!buckets.has(a.region))buckets.set(a.region,[]);buckets.get(a.region).push(a)}
 const regions=[...buckets.keys()],out=[];while(regions.some(r=>buckets.get(r).length)){for(const r of regions){const a=buckets.get(r).shift();if(a)out.push(a)}}out.push(...unknown);return out.slice(0,max)}
function ranked(items,max=25){return balance(dedupe(items),Math.min(max,items.length))}
function fmtSummary(items){const m=new Map();items.forEach(a=>m.set(a.category,(m.get(a.category)||0)+1));return [...m].sort((a,b)=>b[1]-a[1]).map(x=>x[0]+' '+x[1]).join(' ・ ')}
function render(){
 const d=day(),s=state(),l=limit(),items=balance(dedupe(s.items),Math.min(150,s.items.length));
 $('tpnl-meter').textContent='本日のAPI応答本文（推定） '+fmt(d.bytes)+' / '+fmt(l)+'・成功 '+d.requests+' 回';
 $('tpnl-bar').style.width=Math.min(100,d.bytes/Math.max(1,l)*100)+'%';$('tpnl-count').textContent=s.items.length+' 件保存';
 const f=$('tpnl-category')?.value||'all',region=$('tpnl-region')?.value||'all',country=$('tpnl-country')?.value||'all',byCategory=f==='all'?items:items.filter(a=>a.categoryId===f),byRegion=region==='all'?byCategory:byCategory.filter(a=>a.region===region),shown=country==='all'?byRegion:byRegion.filter(a=>(a.country||'国不明')===country);\n const countrySelect=$('tpnl-country'),selectedCountry=countrySelect.value,countryOptions=[...new Set(items.map(a=>a.country||'国不明'))].sort((a,b)=>a.localeCompare(b,'ja'));countrySelect.innerHTML='<option value=\"all\">全ての国</option>'+countryOptions.map(c=>'<option>'+esc(c)+'</option>').join('');countrySelect.value=countryOptions.includes(selectedCountry)?selectedCountry:'all';
 $('tpnl-summary').textContent='分野内訳：'+(fmtSummary(items)||'まだありません')+'。地域・国は見出しに明記された地名・国名からの推定です。媒体所在地だけでは記事対象地域を決めません。特定できない場合は不明とします。';
 $('tpnl-list').innerHTML=shown.map(a=>{const u=safe(a.url),mark=a.importance>=75?'🔴':a.importance>=50?'🟠':'⚪';return '<article class="tpnl-item"><div class="tpnl-meta">'+mark+' 重要度 '+a.importanceLabel+' '+a.importance+'点 ・ '+esc(a.category)+' ・ '+esc(a.region)+' ・ '+esc(a.country||'国不明')+'</div><small>'+esc(a.domain)+' · '+esc(a.date)+'</small><br>'+(u?'<a target="_blank" rel="noopener noreferrer" href="'+esc(u)+'">'+esc(a.title)+'</a>':esc(a.title))+'</article>'}).join('')||'該当するニュースはありません。';
}
function mount(){
 if($('tpnl-root'))return;const root=document.createElement('section');root.id='tpnl-root';
 root.innerHTML='<style>#tpnl-root{font:14px/1.5 system-ui,sans-serif;border:1px solid #999;border-radius:12px;padding:16px;margin:18px 0;background:var(--card-bg,#fff);color:var(--text-color,#222)}#tpnl-root *{box-sizing:border-box}#tpnl-root .tpnl-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}#tpnl-root input,#tpnl-root select,#tpnl-root button{font:inherit;padding:7px;max-width:100%}#tpnl-root button{cursor:pointer}#tpnl-root button:disabled{cursor:not-allowed;opacity:.55}#tpnl-root .tpnl-track{height:8px;background:#ddd;border-radius:8px;overflow:hidden}#tpnl-bar{height:100%;width:0;background:#287d62}#tpnl-root .tpnl-item{padding:10px 0;border-bottom:1px solid #ddd;overflow-wrap:anywhere}#tpnl-root small{opacity:.75}#tpnl-root .tpnl-meta{font-size:12px;font-weight:700;margin-bottom:3px;color:var(--accent,#356b9b)}#tpnl-summary{font-size:12px;opacity:.8;margin:8px 0}#tpnl-error-detail{white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto;padding:8px;background:rgba(127,127,127,.12);border-radius:6px}</style><h2>低通信量・世界ニュース見張り網</h2><p>見出し・媒体・日時・リンクのみ取得。画像や記事本文は自動取得しません。国内政府系情報は対象外です。</p><div class="tpnl-row"><label>ニュースWorker URL <input id="tpnl-worker" type="url" placeholder="https://table-pad-news.アカウント.workers.dev" style="min-width:min(100%,320px)"></label><button id="tpnl-worker-save" type="button">接続先を保存</button></div><div class="tpnl-row"><label>検索語 <input id="tpnl-q" value="world news" maxlength="120"></label><label>期間 <select id="tpnl-hours"><option value="24">24時間</option><option value="48">48時間</option><option value="168">7日間</option></select></label><label>件数 <select id="tpnl-max"><option>10</option><option selected>25</option><option>50</option></select></label></div><div class="tpnl-row"><button id="tpnl-fetch">見出しを取得</button><button id="tpnl-export">JSON書き出し</button><button id="tpnl-clear">保存データ削除</button></div><div class="tpnl-row"><label>1日上限（応答本文の推定） <select id="tpnl-limit"><option value="100000">100 KB</option><option value="250000">250 KB</option><option value="500000">500 KB</option><option value="1000000">1 MB</option><option value="2000000">2 MB</option></select></label><label>分野表示 <select id="tpnl-category"><option value="all">すべて</option>'+CATS.map(c=>'<option value="'+c.id+'">'+c.name+'</option>').join('')+'<option value="other">その他</option></select></label><label>地域 <select id="tpnl-region"><option value="all">全地域</option><option>北米・中南米</option><option>欧州</option><option>中東</option><option>アフリカ</option><option>東アジア・南アジア・太平洋</option><option>世界・複数地域</option><option>地域不明</option></select></label><label>国 <select id="tpnl-country"><option value="all">全ての国</option></select></label></div><div id="tpnl-meter"></div><div class="tpnl-track"><div id="tpnl-bar"></div></div><div class="tpnl-row"><b id="tpnl-count"></b><span id="tpnl-status" role="status" aria-live="polite"></span></div><div id="tpnl-summary"></div><div id="tpnl-error-detail" hidden></div><p><small>取得元: GDELT。GDELTへのリクエストは5秒以上間隔を空けます。通信量表示は正常なJSON応答本文のみの概算で、TLS/HTTPヘッダー等を含む実通信量ではありません。1回の応答が設定上限を超える可能性があります。世界中の全ニュースを網羅するものではありません。重要度・分野・地域は見出し情報による自動推定です。地域を特定できない場合は「地域不明」にします。</small></p><div id="tpnl-list"></div>';
 (document.querySelector('main')||document.querySelector('#app')||document.body).appendChild(root);
 $('tpnl-limit').value=String(limit());$('tpnl-limit').onchange=()=>{localStorage.setItem(LIMIT,$('tpnl-limit').value);render()};
 $('tpnl-worker').value=localStorage.getItem(WORKER)||'';
 $('tpnl-worker-save').onclick=()=>{const v=$('tpnl-worker').value.trim().replace(/\/$/,'');let u;try{u=new URL(v)}catch{}if(!u||u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash){$('tpnl-status').textContent='Worker URLの形式を確認してください（https://から始まるURL）';return}localStorage.setItem(WORKER,v);$('tpnl-status').textContent='Worker接続先を保存しました。'};
 $('tpnl-category').onchange=render;$('tpnl-region').onchange=render;$('tpnl-country').onchange=render;$('tpnl-fetch').onclick=fetchNews;
 $('tpnl-export').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(state(),null,2)],{type:'application/json'}));a.href=u;a.download='table-pad-world-news.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
 $('tpnl-clear').onclick=()=>{if(confirm('保存したニュース一覧を削除しますか？')){localStorage.removeItem(KEY);render()}};render();
}
async function fetchNews(){
 const d=day(),l=limit(),status=$('tpnl-status'),btn=$('tpnl-fetch'),detail=$('tpnl-error-detail');if(btn.disabled)return;
 if(d.bytes>=l){status.textContent='本日の設定上限に達しました。';detail.hidden=true;return}
 const blocked=Math.max(0,Number(localStorage.getItem(BACKOFF)||0)-Date.now());if(blocked>0){status.textContent='GDELTの混雑により取得を一時停止中です。あと'+Math.ceil(blocked/1000)+'秒待ってください。';detail.hidden=true;return}
 const wait=Math.max(0,MIN-(Date.now()-Number(localStorage.getItem(LAST)||0)));if(wait>0){status.textContent='GDELTの利用制限により、あと'+(wait/1000).toFixed(1)+'秒待ってから取得してください。';detail.hidden=true;return}
 btn.disabled=true;status.textContent='取得中…';detail.hidden=true;detail.textContent='';
 try{
  const q=$('tpnl-q').value.trim()||'world news',max=Math.min(50,Math.max(10,Number($('tpnl-max').value)||25)),hours=Number($('tpnl-hours').value)||24,endpoint=localStorage.getItem(WORKER)||'';
  if(!endpoint)throw Object.assign(new Error('ニュースWorker URLが未設定です。Cloudflare Workerを公開し、URLを入力して「接続先を保存」してください。'),{kind:'config'});
  localStorage.setItem(LAST,String(Date.now()));let res;
  try{res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q,max,hours}),cache:'no-store'})}
  catch(error){throw Object.assign(new Error('Worker通信エラー: Cloudflare Workerへ接続できません。URL・公開状態・CORS設定を確認してください。'),{kind:'network',cause:error})}
  const txt=await res.text();let data;try{data=JSON.parse(txt)}catch(error){throw Object.assign(new Error('JSON解析エラー: WorkerからJSON以外の応答が返されました。'),{kind:'parse',detail:txt.slice(0,1600)})}
  if(res.status===429){const retry=Math.max(60000,Number(data.retryAfterMs)||Number(res.headers.get('Retry-After')||0)*1000);localStorage.setItem(BACKOFF,String(Date.now()+retry));throw Object.assign(new Error(data.message||'GDELTが混雑しています。しばらく取得を停止します。'),{kind:'rate_limit',detail:String(data.detail||txt).slice(0,1600)})}
  if(!res.ok)throw Object.assign(new Error(data.message||data.error||'HTTPエラー: '+res.status),{kind:data.error||'http',detail:String(data.detail||data.upstreamPreview||txt).slice(0,1600)});
  if(!data||!Array.isArray(data.articles))throw Object.assign(new Error('応答形式エラー: articles配列がありません。ニュースは保存していません。'),{kind:'format',detail:txt.slice(0,1600)});
  const size=new TextEncoder().encode(txt).length;if(size>l-d.bytes)throw Object.assign(new Error('応答サイズ超過: 今回の応答 '+fmt(size)+' は本日の残り上限 '+fmt(Math.max(0,l-d.bytes))+' を超えるため保存・計上しませんでした。'),{kind:'limit'});
  const s=state(),newRanked=ranked(data.articles,max),merged=dedupe([...s.items,...newRanked]);s.items=merged.slice(0,1000);
  d.bytes+=size;d.requests++;localStorage.setItem(KEY,JSON.stringify(s));localStorage.setItem(DAY,JSON.stringify(d));
  status.textContent='取得 '+data.articles.length+' 件 → 重複整理後 '+newRanked.length+' 件。分野・重要度・地域を推定しました。応答 '+fmt(size)+(d.bytes>=l?'。設定上限に達したため以降停止':'');render();
 }catch(error){status.textContent=error.message||'取得に失敗しました。';if(error.detail){detail.textContent=error.detail;detail.hidden=false}else if(error.kind==='network'&&error.cause){detail.textContent=String(error.cause.message||error.cause);detail.hidden=false}}
 finally{btn.disabled=false}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();