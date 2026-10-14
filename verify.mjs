import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const nodes=new Map(),events={},storage=new Map();
const context=vm.createContext({console,setTimeout:()=>0,clearTimeout,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{activeElement:null,documentElement:{style:{setProperty(){}}},querySelector:q=>{if(!nodes.has(q))nodes.set(q,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){}});return nodes.get(q);},addEventListener:(k,fn)=>events[k]=fn},FormData:class{constructor(f){this.data=f.data;}get(k){return this.data[k];}}});
vm.runInContext(fs.readFileSync(new URL('./app.js',import.meta.url),'utf8'),context);
const run=s=>vm.runInContext(s,context);let count=0;
for(const space of ['AS','TT','MC']){run(`switchSpace('${space}')`);for(const key of run('spaceModules[state.space]')){run(`changePage('${key}')`);for(const tab of run('definitions[state.page].tabs')){run(`state.tab=${JSON.stringify(tab)};render()`);assert.ok(nodes.get('#app').innerHTML.includes('V2.0'));count++;}}
run("changePage('orders')");assert.ok(run('rows().every(r=>r.space===state.space)'));const foreign=space==='AS'?'TT':'AS';assert.equal(run(`findRecord('orders',db['${foreign}'].orders[0].id)`),null);}
run("switchSpace('AS');changePage('orders');state.query='星禾'");assert.equal(run('rows().length'),2);
const otherBefore=run('JSON.stringify(db.TT)'),mcBefore=run('JSON.stringify(db.MC)');
events.submit({preventDefault(){},target:{id:'create-form',data:{title:'独立测试订单',customer:'星禾跨境（演示）',amount:'100'}}});assert.equal(run('db.AS.orders.length'),5);assert.equal(run('db.AS.orders[0].space'),'AS');assert.equal(JSON.parse(storage.get('lj-independent-v2')).AS.orders[0].title,'独立测试订单');assert.equal(run('JSON.stringify(db.TT)'),otherBefore);assert.equal(run('JSON.stringify(db.MC)'),mcBefore);
const id=run('db.AS.orders[0].id');events.submit({preventDefault(){},target:{id:'advance-form',dataset:{key:'orders',id},data:{note:'测试提交当前环节'}}});assert.equal(run('db.AS.orders[0].stage'),1);assert.equal(run('db.AS.orders[0].logs.length'),1);
run("switchSpace('TT')");assert.equal(run(`findRecord('orders','${id}')`),null);
run("state.role='作业人员';changePage('orders');openRecord('orders',db.TT.orders[0].id)");assert.ok(nodes.get('#overlay').innerHTML.includes('权限隐藏'));assert.equal(run("allowed('finance')"),false);assert.equal(run("findRecord('finance',db.TT.finance[0].id)"),null);
run("state.role='法人管理员';switchSpace('MC');changePage('special');state.tab='拦截'");assert.equal(run('rows().length'),1);assert.equal(run('rows()[0].scene'),'拦截');run("state.tab='退换货'");assert.equal(run('rows()[0].scene'),'退换货');
console.log(`PASS: ${count} brand/module/tab renders; isolated customer pools; cross-space lookup rejection; create and persist; workflow logs; role restrictions; independent special workflows.`);
