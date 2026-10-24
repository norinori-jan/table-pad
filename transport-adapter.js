(function(){
'use strict';
/*
 * table-pad transport adapter layer
 * 現実 → 公式運行情報 → 路線アダプタ → 共通交通データ → 表
 */
const VERSION='table_pad_transport_v1';
const STATUS={normal:'平常',delay:'遅延',suspended:'運休',partial:'一部運休',unknown:'情報なし'};
function clean(v,n){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n||300)}
function now(){return new Date().toISOString()}
function base(x){return {schema:VERSION,observedAt:x.observedAt||now(),operator:clean(x.operator,80),line:clean(x.line,120),direction:clean(x.direction,80),section:clean(x.section,160),train:clean(x.train,100),plannedTime:clean(x.plannedTime,40),actualTime:clean(x.actualTime,40),delayMinutes:x.delayMinutes===''||x.delayMinutes==null?null:Number(x.delayMinutes),status:x.status||'unknown',location:clean(x.location,120),message:clean(x.message,500),sourceName:clean(x.sourceName,120),sourceUrl:clean(x.sourceUrl,500),method:clean(x.method||'official',40),adapter:clean(x.adapter||'generic',80),raw: x.raw==null?null:x.raw}}
function normalize(x){const r=base(x||{});if(!STATUS[r.status])r.status='unknown';if(r.delayMinutes!=null&&!Number.isFinite(r.delayMinutes))r.delayMinutes=null;return r}
function rows(items){const h=['取得日時','事業者','路線','方向','区間','列車','予定時刻','実績時刻','遅延(分)','運行状態','場所','運行情報','情報源','情報源URL','取得方法','アダプタ'];return [h].concat((items||[]).map(normalize).map(x=>[x.observedAt,x.operator,x.line,x.direction,x.section,x.train,x.plannedTime,x.actualTime,x.delayMinutes==null?'':x.delayMinutes,STATUS[x.status]||STATUS.unknown,x.location,x.message,x.sourceName,x.sourceUrl,x.method,x.adapter]))}
const adapters={
 generic:{id:'generic',match:()=>true,parse(input,meta){
   if(Array.isArray(input))return input.map(x=>normalize(Object.assign({},x,meta,{adapter:'generic'})));
   if(input&&Array.isArray(input.items))return input.items.map(x=>normalize(Object.assign({},x,meta,{adapter:'generic'})));
   return [normalize(Object.assign({},meta,{message:typeof input==='string'?clean(input,500):'公式運行情報を確認しました',adapter:'generic'}))];
 }},
 jrEast:{id:'jr-east',match:s=>/jr東日本|jreast/i.test(s||''),parse(input,meta){return adapters.generic.parse(input,Object.assign({},meta,{adapter:'jr-east',operator:meta.operator||'JR東日本'}))}},
 tokyoMetro:{id:'tokyo-metro',match:s=>/東京メトロ|tokyometro/i.test(s||''),parse(input,meta){return adapters.generic.parse(input,Object.assign({},meta,{adapter:'tokyo-metro',operator:meta.operator||'東京メトロ'}))}},
 privateRail:{id:'private-rail',match:s=>/私鉄|東急|小田急|京急|京王|相鉄|西武|東武/i.test(s||''),parse(input,meta){return adapters.generic.parse(input,Object.assign({},meta,{adapter:'private-rail'}))}}
};
function choose(operator,url){const s=clean((operator||'')+' '+(url||''),300);return Object.values(adapters).find(a=>a.id!=='generic'&&a.match(s))||adapters.generic}
function fromText(text,meta){const lines=String(text||'').split(/\r?\n/).map(clean).filter(Boolean);const a=[];lines.forEach(line=>{let status='unknown';if(/運休/.test(line))status='suspended';else if(/遅延/.test(line))status='delay';else if(/平常|正常/.test(line))status='normal';const m=line.match(/(\d+)分/);a.push(normalize(Object.assign({},meta,{message:line,status,delayMinutes:m?+m[1]:null,adapter:meta.adapter||'generic'})))});return a}
function importOfficial(input,meta){const m=Object.assign({method:'official',observedAt:now()},meta||{});const a=choose(m.operator,m.sourceUrl);let out=a.parse(input,m);if(!out.length)out=fromText(input,m);return {schema:VERSION,adapter:a.id,items:out,rows:rows(out)}}
function addTable(result,title){if(!result||!result.rows||typeof window.newTable!=='function')return false;window.newTable(title||'電車・運行情報',result.rows);return true}
window.TablePadTransport={VERSION,STATUS,normalize,rows,adapters,choose,fromText,importOfficial,addTable};
})();
