const assert=require('node:assert/strict');const C=require('../core.js');let checks=0;
function check(v,s){assert(v,s);checks++;}
function poly(values){return C.model('polynomial',{...Object.fromEntries(Array.from({length:9},(_,i)=>['c'+i,0])),...values});}
const options={a:1,b:2,tolX:1e-9,tolF:1e-9,max:200};
for(const key of Object.keys(C.defs)){
 const d=C.defs[key],p=Object.fromEntries(d.fields.map(f=>[f[0],f[3]])),m=C.model(key,p),roots=[];
 for(const method of Object.keys(C.names)){
  const [a,b]=d.seeds;const r=C.solve(m,method,{...options,a:method==='newton'?(a+b)/2:a,b});
  check(r.ok,key+' '+method+': '+r.message);check(Math.abs(m.f(r.root))<=1e-9,key+' residual');roots.push(r.root);
 }
 check(Math.max(...roots)-Math.min(...roots)<1e-7,key+' métodos coinciden');
 const[a,b]=d.seeds;
 for(const x of [a,(a+b)/2,b]){const h=x*1e-5,finite=(m.f(x+h)-m.f(x-h))/(2*h);check(Math.abs(m.df(x)-finite)<1e-5*Math.max(1,Math.abs(finite)),key+' derivada');}
}
const critical=C.model('critical',{Q:8,b:3,z:0});const cr=C.solve(critical,'bisection',{...options,a:.01,b:4});check(Math.abs(cr.root-(64/(9.81*9))**(1/3))<1e-8,'tirante crítico rectangular analítico');
const cubic=poly({c3:1,c1:-1,c0:-2});check(Math.abs(C.solve(cubic,'newton',options).root-1.521379706804568)<1e-8,'raíz conocida');check(!C.solve(cubic,'bisection',{...options,a:3,b:4}).ok,'intervalo inválido');check(!C.solve(cubic,'secant',{...options,a:1,b:1}).ok,'semillas iguales');check(!C.solve(cubic,'bisection',{...options,max:1}).ok,'sin convergencia');check(!C.solve(cubic,'bisection',{...options,tolX:-1}).ok,'tolerancia negativa');
const flat=poly({c2:1,c0:1});check(!C.solve(flat,'newton',{...options,a:0}).ok,'derivada cero');
const linear=poly({c1:1,c0:-1});check(C.solve(linear,'bisection',{...options,a:1,b:2}).root===1,'raíz en extremo');
const eighth=poly({c8:1,c0:-256});for(const method of Object.keys(C.names)){const r=C.solve(eighth,method,{...options,a:1.9,b:2.1});check(r.ok&&Math.abs(r.root-2)<1e-8,'grado ocho '+method);}
const repeated=poly({c2:1,c1:-2,c0:1});check(!C.solve(repeated,'bisection',{...options,a:0,b:2}).ok,'raíz doble sin cambio de signo');
const beam=C.model('beam',{w:20,L:6,b:.3,E:25000000,delta:15});check(Math.abs(C.solve(beam,'newton',{...options,a:.35}).root-0.3301927248894623)<1e-9,'viga caso de referencia');
const foundation=C.model('footing',{N:800,L:2,e:0,qadm:200});check(Math.abs(C.solve(foundation,'bisection',{...options,a:1,b:3}).root-2)<1e-9,'zapata carga centrada');check(!C.solve(C.model('footing',{N:800,L:2,e:.3,qadm:200}),'newton',{...options,a:1}).ok,'zapata contacto incompleto');
const pipe=C.model('pipe',{Q:.05,L:100,f:.02,loss:2});const D=C.solve(pipe,'newton',{...options,a:.2}).root;const v=.05/(Math.PI*D*D/4);check(Math.abs(.02*(100/D)*v*v/(2*9.81)-2)<1e-8,'Darcy independiente con velocidad');
assert.throws(()=>C.model('colebrook',{Re:2000,D:.3,eps:.0001}));checks++;assert.throws(()=>C.model('manning',{Q:8,b:0,z:1,n:.015,S:.001}));checks++;assert.throws(()=>poly({c0:2}));checks++;
console.log(checks+' comprobaciones numéricas correctas.');
