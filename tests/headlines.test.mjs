import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildHeadlines,headlineTopics} from '../custom_components/euskalmet_local/frontend/eguraldi-headlines-model.js';

const now=Date.parse('2026-11-26T10:00:00Z');
const row=(hour,extra={})=>({datetime:new Date(now+hour*3600000).toISOString(),condition:'cloudy',precipitation:0,temperature:15,...extra});
test('headlines never derive probability from precipitation or invent zero for absent data',()=>{
 const items=buildHeadlines({now,hourly:[row(0,{precipitation:2}),row(1,{precipitation:0.8})],topics:['rain']});
 assert.equal(items.length,1);assert.doesNotMatch(items[0].title,/%|probabilidad/i);
 for(const value of [null,'',false,-1,101,'unavailable'])assert.equal(buildHeadlines({now,hourly:[row(0,{precipitation:null,condition:'unknown',precipitation_probability:value})],topics:['rain']}).length,0);
 const zero=buildHeadlines({now,hourly:[row(0,{precipitation_probability:0})],topics:['rain']});assert.match(zero.find(x=>x.key==='news:probability').title,/0 %/);
});
test('dry headlines stop at gaps and exclude unknown precipitation',()=>{
 const items=buildHeadlines({now,hourly:[row(0),row(2),row(3)],topics:['rain']});assert.match(items[0].title,/1 hora/);
 assert.equal(buildHeadlines({now:now+60000,hourly:[row(0),row(2)],topics:['rain']}).length,0);
 assert.equal(buildHeadlines({now,hourly:[row(0,{precipitation:null})],topics:['rain']}).length,0);
});
test('current observations expire and optional topics respect order, deduplication and disabling',()=>{
 const data={now,observedAt:new Date(now).toISOString(),weather:{temperature:15,humidity:70,wind_speed:12},topics:['wind','current','wind']};
 assert.deepEqual(buildHeadlines(data).map(x=>x.key),['news:wind','news:current']);
 assert.deepEqual(headlineTopics({headline_topics:['wind','bad','current','wind']}),['wind','current']);
 assert.equal(buildHeadlines({...data,observedAt:new Date(now-46*60000).toISOString()}).length,0);
 assert.equal(buildHeadlines({...data,topics:[]}).length,0);
});
test('update news is opt in via supplied entity, unavailable versions are omitted, and texts support Basque',()=>{
 assert.equal(buildHeadlines({now,topics:['update']}).length,0);
 assert.equal(buildHeadlines({now,topics:['update'],update:{state:'off',attributes:{latest_version:'1.0'}}}).length,0);
 const items=buildHeadlines({now,language:'eu',topics:['update','microclimate'],update:{state:'on',attributes:{latest_version:'1.0'}},micro:{state:'not_improved'}});
 assert.match(items[0].title,/eguneraketa/);assert.match(items[1].title,/Hobekuntzarik/);
 assert.equal(buildHeadlines({now,topics:['plans'],plans:{outing:{plan:{best:null}}}}).length,0);
});

test('daily published probability is allowed without fabricating hourly probability',()=>{
 const items=buildHeadlines({now,daily:[{datetime:new Date(now).toISOString(),precipitation_probability:25}],topics:['rain']});
 assert.equal(items.length,1);assert.match(items[0].title,/hoy: 25 %/);
});
