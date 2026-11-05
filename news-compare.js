(function () {
  "use strict";
  if (window.__tpNewsCompare) return;
  window.__tpNewsCompare = true;
  const API = "https://api.gdeltproject.org/api/v2/doc/doc";
  const KEY = "tablePad.internationalNewsCompare.v1";
  const countries = [["US","アメリカ"],["GB","イギリス"],["DE","ドイツ"],["FR","フランス"],["BE","ベルギー"],["IT","イタリア"],["ES","スペイン"],["NL","オランダ"],["PL","ポーランド"],["CN","中国"]];
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[ch]);
  const style = document.createElement("style");
  style.textContent = "#tpnc-open{position:fixed;right:18px;bottom:18px;z-index:2147483000;border:0;border-radius:30px;padding:13px 18px;background:#173b57;color:#fff;font:600 14px system-ui;box-shadow:0 5px 22px #0003;cursor:pointer}\n" +
    "#tpnc-cover{position:fixed;inset:0;z-index:2147483001;background:#0b1724aa;display:none;align-items:center;justify-content:center;padding:14px}\n" +
    "#tpnc-box{box-sizing:border-box;width:min(1080px,100%);max-height:94vh;overflow:auto;background:#fff;color:#17212b;border-radius:15px;padding:20px;font:14px/1.5 system-ui}\n" +
    "#tpnc-box *{box-sizing:border-box}#tpnc-box h2{margin:0 0 5px}#tpnc-box label{display:block;font-weight:600;margin:10px 0 4px}\n" +
    "#tpnc-box input,#tpnc-box select{width:100%;padding:10px;border:1px solid #ccd5dd;border-radius:8px;background:#fff;color:#17212b}\n" +
    "#tpnc-box button{border:0;border-radius:8px;padding:10px 13px;background:#173b57;color:#fff;cursor:pointer;font-weight:600}#tpnc-box button.alt{background:#e8eef3;color:#17212b}#tpnc-box button:disabled{opacity:.5;cursor:wait}\n" +
    "#tpnc-box .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}#tpnc-box .actions{display:flex;gap:8px;flex-wrap:wrap;margin:13px 0}\n" +
    "#tpnc-box .card{border:1px solid #dce3e9;border-radius:9px;padding:11px;margin:8px 0;overflow-wrap:anywhere}#tpnc-box .muted{font-size:12px;color:#596773}#tpnc-box .notice{background:#fff4df;border-radius:8px;padding:10px;margin:12px 0}#tpnc-box a{color:#125b91}\n" +
    "@media(max-width:650px){#tpnc-box .grid{grid-template-columns:1fr}#tpnc-box{padding:13px}}";
  document.head.appendChild(style);
  const open = document.createElement("button");
  open.id = "tpnc-open"; open.type = "button"; open.textContent = "🌐 国際ニュース比較";
  const cover = document.createElement("div"); cover.id = "tpnc-cover";
  cover.innerHTML = '<section id="tpnc-box" role="dialog" aria-modal="true" aria-labelledby="tpnc-title">' +
    '<div style="display:flex;justify-content:space-between;gap:12px"><div><h2 id="tpnc-title">AIニュース比較（国際報道）</h2><div class="muted">共通テーマについて、選択した2か国の報道見出しを並べて確認します。</div></div><button class="alt" id="tpnc-close" type="button">閉じる</button></div>' +
    '<div class="notice">この機能は国別メディアの見出し・日時・URLを比較する補助機能です。記事本文は取得せず、報道量・代表性・正確性を保証しません。取得元はGDELT DOC APIです。</div>' +
    '<label for="tpnc-topic">共通テーマ（英語の短い語句を推奨）</label><input id="tpnc-topic" maxlength="160" placeholder="例: climate policy / Ukraine aid / AI regulation">' +
    '<div class="grid"><div><label for="tpnc-a">比較対象 A</label><select id="tpnc-a"></select></div><div><label for="tpnc-b">比較対象 B</label><select id="tpnc-b"></select></div></div>' +
    '<div class="actions"><button id="tpnc-fetch" type="button">両国の見出しを取得</button><button id="tpnc-copy" class="alt" type="button" disabled>AI分析プロンプトをコピー</button><button id="tpnc-save" class="alt" type="button" disabled>JSON保存</button><button id="tpnc-history" class="alt" type="button">比較履歴</button></div>' +
    '<div id="tpnc-status" class="muted" role="status" aria-live="polite">テーマを入力して取得してください。</div>' +
    '<div class="grid"><div><h3 id="tpnc-at">比較 A</h3><div id="tpnc-ar"></div></div><div><h3 id="tpnc-bt">比較 B</h3><div id="tpnc-br"></div></div></div><div id="tpnc-hist"></div>' +
    '<p class="muted">見出しはGDELT DOC APIから取得します。通信環境やCORS制限により取得できない場合があります。AI分析では、見出し情報と確認済み事実を区別してください。</p></section>';
  document.body.append(open, cover);
  countries.forEach(([code,name]) => { $("tpnc-a").add(new Option(name+" ("+code+")",code)); $("tpnc-b").add(new Option(name+" ("+code+")",code)); });
  $("tpnc-a").value="US"; $("tpnc-b").value="DE";
  let current=null;
  open.addEventListener("click",()=>{cover.style.display="flex";});
  $("tpnc-close").addEventListener("click",()=>{cover.style.display="none";});
  cover.addEventListener("click",event=>{if(event.target===cover)cover.style.display="none";});
  document.addEventListener("keydown",event=>{if(event.key==="Escape")cover.style.display="none";});
  const nameOf=code=>(countries.find(item=>item[0]===code)||[code,code])[1];
  function dateOf(value){
    const m=String(value||"").match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
    return m?m[1]+"-"+m[2]+"-"+m[3]+(m[4]?" "+m[4]+":"+(m[5]||"00")+" UTC":""):(value||"日時不明");
  }
  function safeHttpUrl(value){
    try{const u=new URL(String(value||""));return u.protocol==="https:"||u.protocol==="http:"?u.href:"";}catch(_){return "";}
  }
  function render(id,rows){
    const host=$(id);
    if(!rows.length){host.innerHTML='<div class="card">該当する見出しがありません。テーマを短くして再試行してください。</div>';return;}
    host.innerHTML=rows.map(a=>{
      const url=safeHttpUrl(a.url),title=esc(a.title);
      const link=url?'<a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+title+'</a>':title;
      return '<article class="card"><div class="muted">'+esc(a.date)+" · "+esc(a.domain||"媒体不明")+"</div>"+link+"</article>";
    }).join("");
  }
  async function fetchSide(topic,code){
    const url=API+"?query="+encodeURIComponent(topic+" sourcecountry:"+code)+"&mode=artlist&format=json&maxrecords=20&sort=datedesc";
    const response=await fetch(url,{mode:"cors",cache:"no-store"});
    if(!response.ok)throw new Error(code+": HTTP "+response.status);
    const data=await response.json();
    return (Array.isArray(data.articles)?data.articles:[]).map(a=>({
      title:a.title||"",url:a.url||"",domain:a.domain||"",date:dateOf(a.seendate||a.date),
      language:a.language||"",sourcecountry:a.sourcecountry||code
    })).filter(a=>a.title&&safeHttpUrl(a.url));
  }
  function makePrompt(data){
    const list=(name,rows)=>"### "+name+"\n"+(rows.length?rows.map((a,i)=>(i+1)+". 見出し: "+a.title+"\n媒体: "+(a.domain||"不明")+" / 日時: "+a.date+"\nURL: "+a.url).join("\n"):"該当する見出しなし");
    return [
      "あなたは慎重な国際報道比較アナリストです。",
      "以下は2か国で取得したニュース見出しのメタデータです。記事本文や一次資料を確認した証拠ではありません。",
      "", "テーマ: "+data.topic, "A: "+data.an+" ("+data.ac+")", "B: "+data.bn+" ("+data.bc+")", "取得時刻: "+data.at, "",
      list(data.an,data.a), "", list(data.bn,data.b), "",
      "次の観点で日本語で比較してください。",
      "A. 見出しから確認できる事実（推測と分離）",
      "B. それぞれの国で目立つ論点・表現",
      "C. 共通点と相違点",
      "D. 相違を説明する仮説と、その根拠・限界",
      "E. 利害関係者と論点",
      "F. 国内政治・地域事情（根拠がある場合のみ）",
      "G. 影響について、事実・推論・予測を分ける",
      "H. 追加確認すべき一次資料・公式発表",
      "I. 見出しの偏り、取得範囲、情報不足",
      "J. 不明点",
      "",
      "ルール: 出典URLを付ける。未確認は未確認と書く。報道見出しと一次資料を区別する。少数の記事から国全体の世論を断定しない。根拠が不足する場合は結論を保留する。"
    ].join("\n");
  }
  function readHistory(){
    try{const h=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(h)?h:[];}catch(_){return [];}
  }
  function saveHistory(data){
    try{const h=readHistory();h.unshift(data);localStorage.setItem(KEY,JSON.stringify(h.slice(0,10)));}
    catch(_){$("tpnc-status").textContent="履歴を保存できませんでした（容量・ブラウザー設定を確認してください）。";}
  }
  function showData(data){
    current=data;$("tpnc-topic").value=data.topic||"";$("tpnc-a").value=data.ac||"US";$("tpnc-b").value=data.bc||"DE";
    $("tpnc-at").textContent=(data.an||nameOf(data.ac))+" ("+data.a.length+"件)";
    $("tpnc-bt").textContent=(data.bn||nameOf(data.bc))+" ("+data.b.length+"件)";
    render("tpnc-ar",data.a);render("tpnc-br",data.b);$("tpnc-copy").disabled=false;$("tpnc-save").disabled=false;
  }
  $("tpnc-fetch").addEventListener("click",async()=>{
    const topic=$("tpnc-topic").value.trim(),ac=$("tpnc-a").value,bc=$("tpnc-b").value;
    if(!topic){$("tpnc-status").textContent="比較するテーマを入力してください。";return;}
    if(ac===bc){$("tpnc-status").textContent="異なる国を選択してください。";return;}
    const button=$("tpnc-fetch");button.disabled=true;$("tpnc-status").textContent="両国の見出しを取得しています…";
    $("tpnc-copy").disabled=true;$("tpnc-save").disabled=true;
    try{
      const pair=await Promise.all([fetchSide(topic,ac),fetchSide(topic,bc)]);
      const data={topic:topic,ac:ac,bc:bc,an:nameOf(ac),bn:nameOf(bc),a:pair[0],b:pair[1],at:new Date().toISOString(),source:"GDELT DOC API"};
      showData(data);
      $("tpnc-status").textContent="取得完了: A "+data.a.length+"件 / B "+data.b.length+"件。見出しだけで事実関係を断定しないでください。";
      saveHistory(data);
    }catch(error){
      $("tpnc-status").textContent="取得エラー: "+(error&&error.message?error.message:String(error))+"。通信環境またはCORS制限の可能性があります。";
    }finally{button.disabled=false;}
  });
  $("tpnc-copy").addEventListener("click",async()=>{
    if(!current)return;const value=makePrompt(current);
    try{await navigator.clipboard.writeText(value);$("tpnc-status").textContent="分析プロンプトをコピーしました。AIチャットに貼り付けてください。";}
    catch(_){
      const area=document.createElement("textarea");area.value=value;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";
      document.body.appendChild(area);area.select();let copied=false;try{copied=document.execCommand("copy");}catch(_){}area.remove();
      $("tpnc-status").textContent=copied?"分析プロンプトをコピーしました。":"コピーできませんでした。ブラウザーの権限を確認してください。";
    }
  });
  $("tpnc-save").addEventListener("click",()=>{
    if(!current)return;
    const blob=new Blob([JSON.stringify(current,null,2)],{type:"application/json;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="international-news-comparison-"+new Date().toISOString().slice(0,10)+".json";
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  });
  $("tpnc-history").addEventListener("click",()=>{
    const history=readHistory();
    $("tpnc-hist").innerHTML="<h3>過去の比較（このブラウザー内・最大10件）</h3>"+
      (history.length?history.map((d,i)=>'<div class="card"><b>'+esc(d.topic)+'</b><br>'+
      esc(d.an)+" "+(Array.isArray(d.a)?d.a.length:0)+"件 / "+esc(d.bn)+" "+
      (Array.isArray(d.b)?d.b.length:0)+'件 · '+esc(d.at)+
      ' <button class="alt" type="button" data-i="'+i+'">表示</button></div>').join(""):'<div class="card">保存された履歴はありません。</div>');
    $("tpnc-hist").querySelectorAll("button[data-i]").forEach(button=>button.addEventListener("click",()=>{
      const d=history[Number(button.dataset.i)];
      if(!d||!Array.isArray(d.a)||!Array.isArray(d.b))return;
      showData(d);$("tpnc-status").textContent="保存済みの比較を表示しています。";
    }));
  });
})();