/* Lógica de interfaz mediante DOM simulado. No sustituye pruebas visuales ni Android. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const elements=new Map();
function el(id){if(!elements.has(id)){const classes=new Set();elements.set(id,{get value(){return this._value||''},set value(v){this._value=String(v)},textContent:'',disabled:false,style:{setProperty(){}},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>{if(on===undefined)on=!classes.has(x);on?classes.add(x):classes.delete(x);return on;}},setAttribute(){},removeAttribute(){},addEventListener(){},after(){},prepend(){},scrollIntoView(){},get innerHTML(){return this._html||''},set innerHTML(s){this._html=s;for(const m of s.matchAll(/<input id="([^"]+)"[^>]*value="([^"]*)"/g))el(m[1]).value=m[2];}});}return elements.get(id);}
const doc={getElementById:el,querySelectorAll:()=>[],documentElement:el('html'),body:el('body'),createElement:()=>el('new')};const saved=new Map();
const ctx=vm.createContext({document:doc,window:{confirm:()=>true},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},console,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Number,Math,Error,URL});
for(const f of ['core.js','app.js','experience.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),ctx);
el('tolX').value='0.000001';el('tolF').value='0.000001';el('max').value='100';el('zoom').value='full';
for(const k of ['manning','critical','colebrook','beam','footing','pipe','polynomial'])for(const m of ['bisection','newton','secant']){
 vm.runInContext(`method='${m}';selectCase('${k}');calculate();`,ctx);
 assert.match(el('convergence').textContent,/verificada/);assert(el('graph').innerHTML.includes('<svg'));assert(!el('export').disabled);
 assert(el('casePicture').src.startsWith('data:image/svg+xml;base64,'));assert(el('interpretation').textContent.length>60);
 const report=vm.runInContext('reportHtml()',ctx);assert(report.includes('Iteraciones completas'));assert(report.includes('CONVERGENCIA VERIFICADA'));assert(report.includes('Evolución del residuo'));assert(report.includes('Interpretación del resultado físico'));
 vm.runInContext("chartMode='error';draw();",ctx);assert(el('graph').innerHTML.includes('logarítmica'));
}
el('student').value='<script>alert(1)</script>';const report=vm.runInContext('reportHtml()',ctx);assert(!report.includes('<script>alert(1)</script>'));assert(report.includes('&lt;script&gt;'));
vm.runInContext("$('saveResult').onclick();renderHistory();",ctx);assert(el('savedList').innerHTML.includes('Volver a calcular'));assert.equal(JSON.parse(saved.get('civilraiz-history-v2')).length,1);
vm.runInContext('invalidate()',ctx);assert(el('export').disabled);console.log('21 combinaciones: ilustración, interpretación, SVG, gráfico de residuo, historial e informe correctos con DOM simulado.');
