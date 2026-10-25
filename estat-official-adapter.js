(function(){
'use strict';
if(window.TablePadEStat)return;
const VERSION='table_pad_estat_official_v1';
const API='https://api.e-stat.go.jp/rest/2.1/app/json/getStatsData';
const KEY='tp_estat_app_id_v1';
function clean(v,n){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n||1000)}
function appId(){return localStorage.getItem(KEY)||''}
function setAppId(v){const x=clean(v,200);if(x)localStorage.setItem(KEY,x);else localStorage.removeItem(KEY);return x}
function getUrl(statsDataId,extra){const id=appId();if(!id)throw new Error('e-StatのアプリケーションIDが未設定です');if(!statsDataId)throw new Error('統計表IDが未設定です');const p=new URLSearchParams({appId:id,statsDataId:String(statsDataId)});Object.keys(extra||{}).forEach(k=>{if(extra[k]!==''&&extra[k]!=null)p.set(k,String(extra[k]))});return API+'?'+p.toString()}
function num(v){if(v==null||v==='')return null;const n=Number(String(v).replace(/,/g,''));return Number.isFinite(n)?n:null}
async function getStatsData(statsDataId,extra){const url=getUrl(statsDataId,extra);const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('e-Stat APIに接続できませんでした（HTTP '+r.status+'）');const data=await r.json();if(data.GET_STATS_DATA&&data.GET_STATS_DATA.RESULT&&data.GET_STATS_DATA.RESULT.STATUS!=='0')throw new Error(clean(data.GET_STATS_DATA.RESULT.ERROR_MSG||'e-Stat APIエラー',300));return {schema:VERSION,source:'estat',sourceName:'e-Stat',authority:'政府統計',statsDataId:String(statsDataId),sourceUrl:url,data,observedAt:new Date().toISOString()}}
function meta(data){const root=data&&data.GET_STATS_DATA&&data.GET_STATS_DATA.STATISTICAL_DATA;if(!root)return{};const t=root.TABLE_INF||{};return {statsName:clean(t.STAT_NAME&&t.STAT_NAME['$']||t.STAT_NAME,200),tableName:clean(t.TITLE&&t.TITLE['$']||t.TITLE,300),updated:clean(t.UPDATED_DATE||'',80)}}
function pickText(x){if(x==null)return '';if(typeof x==='string'||typeof x==='number')return String(x);if(x['$']!=null)return String(x['$']);return ''}
function rowsFrom(data,limit){const root=data&&data.GET_STATS_DATA&&data.GET_STATS_DATA.STATISTICAL_DATA;if(!root||!root.DATA_INF)return[];let values=root.DATA_INF.VALUE||[];if(!Array.isArray(values))values=[values];const m=meta(data);const max=Number.isFinite(Number(limit))?Math.max(1,Number(limit)):500;return values.slice(0,max).map(v=>{const value=pickText(v);return ['取得日時',new Date().toISOString(),'情報源','e-Stat','統計表ID',String(data.statsDataId||''),'統計名',m.statsName,'項目コード',pickText(v['@cat01']||v.cat01),'地域コード',pickText(v['@area']||v.area),'時間コード',pickText(v['@time']||v.time),'値',value,'数値',num(value),'単位',pickText(v['@unit']||v.unit),'情報源URL',data.sourceUrl,'取得方法','official-api']})}
function toOfficial(data,limit){const r=rowsFrom(data,limit);return {schema:VERSION,source:'estat',sourceName:'e-Stat',authority:'政府統計',title:meta(data).tableName||meta(data).statsName||'e-Stat統計',category:'政府統計',value:String(r.length)+'件',unit:'件',location:'',latitude:null,longitude:null,sourceUrl:data.sourceUrl,method:'official-api',observedAt:data.observedAt,notes:'統計表ID '+data.statsDataId+'。個別の値は統計表行として保存'}}
function rows(data,limit){const r=rowsFrom(data,limit);const h=['取得日時','情報源','統計表ID','統計名','項目コード','地域コード','時間コード','値','数値','単位','情報源URL','取得方法'];return [h].concat(r.map(x=>[x[1],x[3],x[5],x[7],x[9],x[11],x[13],x[15],x[17],x[19],x[21],x[23]]))}
window.TablePadEStat={VERSION,API,KEY,appId,setAppId,getUrl,getStatsData,meta,rowsFrom,toOfficial,rows};
})();