import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const nodes=new Map();const events={};const storage=new Map();
const context=vm.createContext({console,setTimeout:()=>0,clearTimeout,window:{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{querySelector:q=>{if(!nodes.has(q))nodes.set(q,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){}});return nodes.get(q);},addEventListener:(name,fn)=>events[name]=fn},FormData:class{constructor(f){this.data=f.data}get(k){return this.data[k]}}});
vm.runInContext(fs.readFileSync(new URL('./app.js',import.meta.url),'utf8'),context);
const run=s=>vm.runInContext(s,context);let count=0;
for(let page=0;page<10;page++){const tabs=run(`modules[${page}].slice(2)`);for(const tab of tabs){run(`state.page=${page};state.tab=${JSON.stringify(tab)};shell()`);assert.ok(nodes.get('#app').innerHTML.includes('联境'));count++;}}
run("state.page=4;state.tab='销售订单';state.query='星禾';state.brand='全部品牌';state.status='全部状态'");assert.equal(run('selectedOrders().length'),1);
run("state.query='不存在';");assert.equal(run('selectedOrders().length'),0);
run("state.query='';state.role='美仓作业视角';shell();detail('AS202610140001')");assert.ok(!nodes.get('#overlay').innerHTML.includes('18,640'));assert.ok(!nodes.get('#app').innerHTML.includes('data-page="7"'));
events.submit({preventDefault(){},target:{id:'order-form',data:{customer:'验证客户',brand:'安速',product:'美西海运 FBA 专线',cargo:'家具 / 10 箱',origin:'深圳',destination:'洛杉矶',amount:'100'}}});assert.equal(run('orders.length'),7);assert.equal(JSON.parse(storage.get('lj-orders-v1'))[0][1],'验证客户');
events.submit({preventDefault(){},target:{id:'resolve-form',dataset:{id:'AS202610130089'}}});assert.equal(run("orders.find(r=>r[0]==='AS202610130089')[6]"),'运输中');
events.submit({preventDefault(){},target:{id:'task-form',dataset:{index:'1'},data:{comment:'已接单安排收货'}}});assert.equal(run('completedTasks.length'),1);assert.ok(run('tasks()').includes('已接单安排收货'));
console.log(`PASS: ${count} page/tab renders; order search; role visibility; create/persist; exception resolution; task completion.`);
