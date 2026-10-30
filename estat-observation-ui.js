(function(){
'use strict';
if(window.TablePadEStatUI)return;
function btn(text,primary){const b=document.createElement('button');b.type='button';b.textContent=text;b.style.cssText='padding:10px 12px;border:1px solid '+(primary?'#1769aa':'#999')+';border-radius:10px;background:'+(primary?'#1677d2':'#f0f2f5')+';color:'+(primary?'#fff':'#222')+';font-weight:700;cursor:pointer;margin:5px 5px 0 0;min-height:40px;opacity:1';return b}
function inp(ph,val){const x=document.createElement('input');x.placeholder=ph;x.value=val||'';x.style.cssText='width:100%;box-sizing:border-box;padding:10px;border:1px solid #aaa;border-radius:9px;margin-top:5px;color:#222;background:#fff;font:inherit';return x}
function label(txt){const x=document.createElement('div');x.textContent=txt;x.style.cssText='font-size:13px;font-weight:700;color:#333;margin-top:12px';return x}
function help(txt){const x=document.createElement('div');x.textContent=txt;x.style.cssText='font-size:12px;line-height:1.5;color:#555;margin-top:4px';return x}
function make(){
 if(document.getElementById('tpEStatObs'))return;
 const box=document.createElement('div');box.id='tpEStatObs';box.style.cssText='position:fixed;right:14px;bottom:280px;z-index:9994;font-family:system-ui,sans-serif';
 const b=btn('📊 e-Stat：政府統計を検索',true);
 const panel=document.createElement('div');panel.hidden=true;panel.style.cssText='position:absolute;right:0;bottom:48px;width:min(470px,calc(100vw - 28px));max-height:78vh;overflow:auto;background:#fff;border:1px solid #aaa;border-radius:14px;padding:14px;box-shadow:0 8px 28px rgba(0,0,0,.22);color:#222';
 const h=document.createElement('strong');h.textContent='政府統計を検索して、表に取り込む';h.style.cssText='font-size:17px;color:#111';panel.appendChild(h);
 panel.appendChild(help('手順：①API IDを保存 → ②統計を検索 → ③候補を選ぶ → ④データを取得 → ⑤表に保存。'));
 const key=inp('ここに e-Stat アプリケーションID を貼り付け',window.TablePadEStat.appId());key.type='password';
 panel.appendChild(label('① e-StatのアプリケーションID'));panel.appendChild(key);
 const saveKey=btn('① IDを保存',true);panel.appendChild(saveKey);
 const word=inp('例：人口、消費者物価、労働力','');
 panel.appendChild(label('② 調べたい統計を検索'));panel.appendChild(word);
 const search=btn('② 統計を検索する',true);panel.appendChild(search);
 const result=document.createElement('select');result.size=5;result.setAttribute('aria-label','検索結果の統計一覧');result.style.cssText='width:100%;box-sizing:border-box;margin-top:8px;padding:8px;border:1px solid #aaa;border-radius:9px;color:#222;background:#fff;font:inherit';panel.appendChild(result);
 panel.appendChild(help('③ 下の候補一覧から、取り込みたい統計を1つ選びます。'));
 const selected=inp('選択すると統計表IDが入ります','');selected.readOnly=true;
 panel.appendChild(label('選択中の統計表ID'));panel.appendChild(selected);
 const id=inp('必要な場合のみ統計表IDを直接入力','');
 panel.appendChild(label('④ データを取得'));panel.appendChild(id);
 const limit=inp('取得するデータ件数（1〜500）','100');limit.type='number';limit.min='1';limit.max='500';panel.appendChild(limit);
 const get=btn('④ 選んだ統計のデータを取得',true);panel.appendChild(get);
 const refresh=btn('同じ統計を公式サイトから取り直す');panel.appendChild(refresh);
 const state=document.createElement('div');state.setAttribute('role','status');state.style.cssText='font-size:13px;line-height:1.5;margin-top:10px;padding:9px;background:#f3f6fa;border-radius:8px;color:#222';state.textContent='最初に① IDを保存してください。';panel.appendChild(state);
 const pre=document.createElement('pre');pre.hidden=true;pre.style.cssText='white-space:pre-wrap;font-size:12px;color:#222;background:#f5f5f5;padding:8px;border-radius:8px;max-height:260px;overflow:auto';panel.appendChild(pre);
 const save=btn('⑤ このデータを table-pad の表に保存',true);save.hidden=true;panel.appendChild(save);
 let data=null,hits=[];
 saveKey.onclick=()=>{try{const v=window.TablePadEStat.setAppId(key.value);if(!v){state.textContent='IDが空です。e-StatのアプリケーションIDを貼り付けてください。';return}state.textContent='IDをこのブラウザーに保存しました。次に②「統計を検索する」を押してください。'}catch(e){state.textContent='IDを保存できませんでした：'+e.message}};
 search.addEventListener('click',async(event)=>{event.preventDefault();event.stopPropagation();state.textContent='検索ボタンを受け付けました。e-Stat APIへ接続中です…';state.style.background='#fff3cd';while(result.firstChild)result.removeChild(result.firstChild);selected.value='';id.value='';pre.hidden=true;save.hidden=true;try{if(!window.TablePadEStat.appId())throw new Error('先に①でアプリケーションIDを保存してください');if(!word.value.trim())throw new Error('検索語を入力してください（例：人口）');hits=window.TablePadEStat.searchResults(await window.TablePadEStat.searchStats({searchWord:word.value.trim(),limit:30}));hits.forEach((x,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=(x.statsDataId||'ID不明')+'｜'+(x.statsName||x.statisticsName||'統計名不明')+'｜'+(x.title||'表題なし');result.appendChild(o)});if(hits.length){result.selectedIndex=0;chooseHit();state.textContent='検索結果が '+hits.length+' 件見つかりました。③候補を確認し、④データを取得してください。'}else state.textContent='候補が0件でした。別の検索語を試してください。'}catch(e){state.textContent='検索できませんでした：'+(e&&e.message?e.message:String(e))}finally{state.style.background='#f3f6fa'}});
 function chooseHit(){const x=hits[Number(result.value)];if(!x)return;selected.value=x.statsDataId||'';id.value=x.statsDataId||'';pre.textContent='選択した統計の情報\n統計名：'+(x.statsName||'')+'\n提供統計名：'+(x.statisticsName||'')+'\n表題：'+(x.title||'')+'\n作成機関：'+(x.govOrg||'')+'\n公表日：'+(x.openDate||'')+'\n更新日：'+(x.updatedDate||'')+'\n統計表ID：'+(x.statsDataId||'');pre.hidden=false}
 result.onchange=chooseHit;
 async function retrieve(force){const sid=(id.value||selected.value).trim();if(!sid){state.textContent='統計表IDがありません。②検索して、③候補を選んでください。';return}state.textContent='e-Stat公式APIからデータを取得中です…';save.hidden=true;try{const boundedLimit=Math.max(1,Math.min(500,Number(limit.value)||100));data=await window.TablePadEStat.getStatsData(sid,{limit:boundedLimit},force?{force:true}:undefined);const m=window.TablePadEStat.meta(data);pre.textContent='取得内容の確認\n統計名：'+(m.statsName||'')+'\n提供統計名：'+(m.statisticsName||'')+'\n表題：'+(m.tableName||'')+'\n作成機関：'+(m.govOrg||'')+'\n統計表ID：'+data.statsDataId+'\n取得件数：'+window.TablePadEStat.rowsFrom(data,boundedLimit).length+'\n取得時刻：'+data.observedAt;pre.hidden=false;save.hidden=false;state.textContent=(data.cached?'保存済みキャッシュのデータを表示しています。':'公式APIからデータを取得しました。')+' 内容を確認して⑤で表に保存してください。'}catch(e){state.textContent='データを取得できませんでした：'+e.message}}
 get.onclick=()=>retrieve(false);refresh.onclick=()=>retrieve(true);
 save.onclick=()=>{if(!data){state.textContent='保存できるデータがありません。先に④「データを取得」を成功させてください。';return}save.disabled=true;state.textContent='table-padの表へ保存しています…';try{if(!window.TablePadEStat||!window.TablePadOfficialStore)throw new Error('保存機能のファイルが読み込まれていません。アプリを更新して再起動してください。');const rows=window.TablePadEStat.rows(data,Number(limit.value||100));if(!Array.isArray(rows)||rows.length<2)throw new Error('保存対象の行がありません（ヘッダーを除くデータ0件）。');const r=window.TablePadOfficialStore.append(rows,'公的情報・e-Stat');state.textContent='保存しました。表「'+r.title+'」に '+r.added+' 行を追加しました。表を開いて確認してください。';state.style.background='#d9fbe5';if(typeof window.render==='function')window.render();const tabs=document.getElementById('tabs');if(tabs){const candidates=Array.from(tabs.querySelectorAll('button'));const tab=candidates.find(x=>x.textContent.trim()===r.title);if(tab)tab.click()} }catch(e){state.textContent='表に保存できませんでした：'+(e&&e.message?e.message:String(e));state.style.background='#ffe0e0'}finally{save.disabled=false}};
 b.onclick=()=>{panel.hidden=!panel.hidden};document.addEventListener('click',e=>{if(!box.contains(e.target))panel.hidden=true});box.appendChild(panel);box.appendChild(b);document.body.appendChild(box)
}
window.TablePadEStatUI={make};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',make);else make();
})();