(function(){
'use strict';
if(window.TablePadBOJ)return;
const VERSION='table_pad_boj_official_v1';
const API='https://www.stat-search.boj.or.jp/api/v1/';
function clean(v,n){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n||1000)}
function validDb(v){return /^[A-Za-z0-9]{2,4}$/.test(String(v||''))}
function validCode(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean).every(x=>/^[^<>"!|\\;']+$/.test(x))}
function getUrl(path,p){const q=new URLSearchParams();Object.keys(p||{}).forEach(k=>{if(p[k]!==''&&p[k]!=null)q.set(k,String(p[k]))});return API+path+'?'+q.toString()}
async function request(path,p){const url=getUrl(path,p);const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});const text=await r.text();if(!r.ok)throw new Error('日本銀行APIに接続できませんでした（HTTP '+r.status+'）');let data;try{data=JSON.parse(text)}catch(e){throw new Error('日本銀行APIのJSONを解釈できませんでした')};return {schema:VERSION,source:'boj',sourceName:'日本銀行',authority:'日本銀行',sourceUrl:url,data,observedAt:new Date().toISOString()}}
async function getDataCode(p){const x=Object.assign({format:'json',lang:'jp'},p||{});if(!validDb(x.db))throw new Error('DB名が不正です');if(!validCode(x.code))throw new Error('系列コードが不正です');return request('getDataCode',x)}
async function getMetadata(db){if(!validDb(db))throw new Error('DB名が不正です');return request('getMetadata',{format:'json',lang:'jp',db})}
function root(x){return x&&x.data&&x.data.data?x.data.data:x&&x.data||{}}
function asArray(v){if(v==null)return[];return Array.isArray(v)?v:[v]}
function pick(v,keys){for(const k of keys){if(v&&v[k]!=null)return v[k]}return ''}
function seriesFrom(x){const r=root(x);return asArray(r.series||r.SERIES||r.data||r.DATA||r.timeSeries||r.TIME_SERIES)}
function rows(x,limit){const r=root(x);const list=seriesFrom(x);const out=[['取得日時','情報源','DB','系列コード','系列名称','期種','時点','値','単位','情報源URL','取得方法']];let n=0;function push(series,point){if(n>=Number(limit||500))return;const code=clean(pick(series,['code','CODE','seriesCode','SERIES_CODE']),200);const name=clean(pick(series,['name','NAME','seriesName','SERIES_NAME','title','TITLE']),300);const freq=clean(pick(series,['frequency','FREQUENCY']),40);const unit=clean(pick(series,['unit','UNIT']),100);const date=clean(pick(point,['date','DATE','time','TIME','period','PERIOD']),80);const value=pick(point,['value','VALUE','val','VAL']);out.push([new Date().toISOString(),'日本銀行',clean(r.db||x.db||'',30),code,name,freq,date,value,unit,x.sourceUrl,'official-api']);n++}
for(const s of list){const points=asArray(pick(s,['data','DATA','observations','OBSERVATIONS','values','VALUES']));if(points.length){points.forEach(p=>push(s,p))}else push(s,s)}
if(!list.length){const values=asArray(r.values||r.VALUES||r.observations||r.OBSERVATIONS);values.forEach(v=>push(r,v))}
return out}
function toOfficial(x){const rows0=rows(x,1);const rr=rows0[1];return {schema:VERSION,source:'boj',sourceName:'日本銀行',authority:'日本銀行',title:(rr&&rr[4])||'日本銀行 時系列統計',category:'金融・経済統計',value:rr?String(rr[7]):'取得データ',unit:rr?String(rr[8]||''):'',location:'',latitude:null,longitude:null,sourceUrl:x.sourceUrl,method:'official-api',observedAt:x.observedAt,notes:'日本銀行 時系列統計データ検索サイト API'}}
window.TablePadBOJ={VERSION,API,getUrl,getDataCode,getMetadata,rows,toOfficial};
})();
