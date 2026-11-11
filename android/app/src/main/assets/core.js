/* CivilRaíz — motor numérico independiente de la interfaz. */
(function(root){
'use strict';
const defs={
 manning:{title:'Tirante normal',tag:'Canales · Manning',unit:'m',symbol:'y',resUnit:'m³/s',seeds:[0.1,4],formula:'F(y) = (1/n) · A(y)^(5/3) · P(y)^(−2/3) · √S − Q',geometry:'A = b·y + z·y²; P = b + 2·y·√(1+z²). z es el talud horizontal/vertical.',assumption:'Flujo uniforme en canal prismático; unidades SI. El tirante no incluye borde libre. No representa remanso ni flujo rápidamente variado.',fields:[['Q','Caudal Q','m³/s',8],['b','Ancho de fondo b','m',3],['z','Talud lateral z','H/V',1],['n','Rugosidad de Manning n','s/m⅓',0.015],['S','Pendiente de energía S','m/m',0.001]]},
 critical:{title:'Tirante crítico',tag:'Canales · Energía específica',unit:'m',symbol:'y',resUnit:'m³/s',seeds:[0.1,4],formula:'F(y) = √(g · A(y)³ / T(y)) − Q',geometry:'A = b·y + z·y²; T = b + 2·z·y; g = 9.81 m/s². En la raíz: Fr = 1.',assumption:'Canal rectangular (z=0) o trapezoidal; distribución hidrostática, coeficiente de energía α=1. La condición crítica no implica que el flujo real sea crítico.',fields:[['Q','Caudal Q','m³/s',8],['b','Ancho de fondo b','m',3],['z','Talud lateral z','H/V',1]]},
 colebrook:{title:'Fricción en tuberías',tag:'Tuberías · Colebrook–White',unit:'adimensional',symbol:'f',resUnit:'adimensional',seeds:[0.015,0.035],formula:'F(f) = 1/√f + 2·log₁₀(ε/(3.7·D) + 2.51/(Re·√f))',geometry:'f es el factor de Darcy, no el de Fanning. ε y D deben estar en metros.',assumption:'Tubería circular llena, flujo turbulento desarrollado (Re > 4000). Se calcula el factor de fricción; no la pérdida de carga completa.',fields:[['Re','Número de Reynolds','adimensional',100000],['D','Diámetro interior D','m',0.3],['eps','Rugosidad absoluta ε','m',0.00015]]},
 beam:{title:'Altura de una viga',tag:'Estructuras · Deflexión',unit:'m',symbol:'h',resUnit:'mm',seeds:[0.30,0.40],formula:'F(h) = 1000 · 5wL⁴ / (384EI) − δ límite; I = b·h³/12',geometry:'Viga simplemente apoyada con carga uniforme. w en kN/m, E en kN/m², L y b en m; δ en mm.',assumption:'Modelo elástico Euler–Bernoulli, sección rectangular homogénea e inercia bruta constante. Solo verifica deflexión: no diseña armaduras ni revisa resistencia, fisuración o cortante.',fields:[['w','Carga uniforme w','kN/m',20],['L','Luz L','m',6],['b','Ancho de viga b','m',0.3],['E','Módulo elástico E','kN/m²',25000000],['delta','Deflexión límite δ','mm',15]]},
 footing:{title:'Ancho de una zapata',tag:'Geotecnia · Presión de contacto',unit:'m',symbol:'B',resUnit:'kPa',seeds:[2,3],formula:'F(B) = N/(L·B) · (1 + 6e/B) − q admisible',geometry:'N incluye las cargas verticales de servicio consideradas. Excentricidad e en la dirección B. q máxima y q admisible deben usar la misma base bruta o neta.',assumption:'Zapata rígida rectangular con distribución lineal, contacto completo B ≥ 6e y excentricidad en una sola dirección. No evalúa capacidad portante, asentamientos, deslizamiento, punzonamiento ni refuerzo.',fields:[['N','Carga vertical N','kN',800],['L','Longitud de zapata L','m',2],['e','Excentricidad e','m',0.1],['qadm','Presión admisible','kPa',200]]},
 pipe:{title:'Diámetro de tubería',tag:'Redes de agua · Darcy–Weisbach',unit:'m',symbol:'D',resUnit:'m',seeds:[0.16,0.22],formula:'F(D) = 8fLQ² / (gπ²D⁵) − h límite',geometry:'Se busca el diámetro para una pérdida de carga por fricción dada. g = 9.81 m/s².',assumption:'Tubería circular llena, caudal constante y factor de Darcy f conocido y fijo. No incluye pérdidas locales. Si cambia f con el diámetro, hay que plantear un modelo acoplado con Reynolds y Colebrook.',fields:[['Q','Caudal Q','m³/s',0.05],['L','Longitud de tubería L','m',100],['f','Factor de Darcy f','adimensional',0.02],['loss','Pérdida límite','m',2]]},
 polynomial:{title:'Ecuación de práctica',tag:'Laboratorio · Polinomios',unit:'según modelo',symbol:'x',resUnit:'según modelo',seeds:[1,2],formula:'F(x) = a₈x⁸ + a₇x⁷ + … + a₂x² + a₁x + a₀',geometry:'Define los coeficientes de tu ecuación. Usa 0 en los términos que no existan.',assumption:'El significado físico y las unidades dependen del modelo que plantees. Puede haber varias raíces; el método solo busca una desde los valores iniciales.',fields:[['c8','Coeficiente a₈','',0],['c7','Coeficiente a₇','',0],['c6','Coeficiente a₆','',0],['c5','Coeficiente a₅','',0],['c4','Coeficiente a₄','',0],['c3','Coeficiente a₃','',1],['c2','Coeficiente a₂','',0],['c1','Coeficiente a₁','',-1],['c0','Coeficiente a₀','',-2]]}
};
const names={bisection:'Bisección',newton:'Newton–Raphson',secant:'Secante'};
function model(key,p){
 const d=defs[key]; if(!d)throw Error('Selecciona un problema válido.');
 d.fields.forEach(([k,label])=>{if(!Number.isFinite(p[k]))throw Error(label+': ingresa un número válido.');});
 if(key==='manning'||key==='critical'){
  if(p.Q<=0||p.b<=0||p.z<0)throw Error('Q y b deben ser positivos; z no puede ser negativo.');
  if(key==='manning'&&(p.n<=0||p.S<=0))throw Error('n y S deben ser positivos.');
 }
 if(key==='colebrook'&&(p.Re<=4000||p.D<=0||p.eps<0||p.eps/p.D>=0.05))throw Error('Usa Re > 4000, D > 0 y 0 ≤ ε/D < 0.05 para este caso.');
 if(key==='beam'&&['w','L','b','E','delta'].some(k=>p[k]<=0))throw Error('Todas las magnitudes de la viga deben ser positivas.');
 if(key==='footing'&&(p.N<=0||p.L<=0||p.e<0||p.qadm<=0))throw Error('N, L y presión admisible deben ser positivos; e no puede ser negativa.');
 if(key==='pipe'&&['Q','L','f','loss'].some(k=>p[k]<=0))throw Error('Q, L, f y la pérdida límite deben ser positivos.');
 if(key==='polynomial'&&Array.from({length:8},(_,i)=>p['c'+(i+1)]||0).every(v=>v===0))throw Error('La ecuación debe depender de x; revisa los coeficientes.');
 const domain=x=>Number.isFinite(x)&&(key==='polynomial'||x>0)&&(key!=='footing'||x>=6*p.e);
 function pair(x){
  if(!domain(x))throw Error('La iteración salió del dominio físico. Cambia los valores iniciales o prueba bisección.');
  let f,df;
  if(key==='polynomial'){f=p.c8;df=0;for(let degree=7;degree>=0;degree--){df=df*x+f;f=f*x+p['c'+degree];}}
  else if(key==='beam'){const deflection=1000*5*p.w*p.L**4/(32*p.E*p.b*x**3);f=deflection-p.delta;df=-3*deflection/x;}
  else if(key==='footing'){f=p.N/(p.L*x)*(1+6*p.e/x)-p.qadm;df=-p.N/p.L*(1/x**2+12*p.e/x**3);}
  else if(key==='pipe'){const loss=8*p.f*p.L*p.Q**2/(9.81*Math.PI**2*x**5);f=loss-p.loss;df=-5*loss/x;}
  else if(key==='colebrook'){const v=p.eps/(3.7*p.D)+2.51/(p.Re*Math.sqrt(x));f=1/Math.sqrt(x)+2*Math.log10(v);df=-0.5*x**(-1.5)-2.51/(Math.LN10*p.Re*x**1.5*v);}
  else{const A=p.b*x+p.z*x*x,T=p.b+2*p.z*x;let q;
   if(key==='manning'){const P=p.b+2*x*Math.sqrt(1+p.z*p.z);q=A**(5/3)*P**(-2/3)*Math.sqrt(p.S)/p.n;df=q*((5/3)*T/A-(2/3)*2*Math.sqrt(1+p.z*p.z)/P);}
   else {q=Math.sqrt(9.81*A**3/T);df=0.5*q*(3*T/A-2*p.z/T);}
   f=q-p.Q;
  }
  if(!Number.isFinite(f)||!Number.isFinite(df))throw Error('El cálculo excedió el rango numérico. Revisa los datos.');
  return [f,df];
 }
 return {d,p,domain,f:x=>pair(x)[0],df:x=>pair(x)[1]};
}
function solve(m,method,o){
 const {a,b,tolX,tolF,max}=o;const rows=[];let message='',ok=false;
 const result=()=>({method,rows,ok,message,root:rows.length?rows[rows.length-1].x:null});
 try{
  if(!names[method])throw Error('Método no reconocido.');
  if(![a,b,tolX,tolF,max].every(Number.isFinite)||tolX<=0||tolF<=0||!Number.isInteger(max)||max<1||max>500)throw Error('Revisa las tolerancias positivas y el máximo de iteraciones (1–500).');
  const push=(x,fx,prev,extra={})=>{const step=prev===null?null:Math.abs(x-prev);rows.push({i:rows.length+1,x,fx,step,relative:step===null||x===0?null:100*step/Math.abs(x),...extra});return step;};
  const finish=(why)=>{ok=true;message=why;return result();};
  if(method==='bisection'){
   let lo=a,hi=b;if(!(lo<hi))throw Error('Bisección requiere a < b.');
   let fl=m.f(lo),fh=m.f(hi);
   if(Math.abs(fl)<=tolF){push(lo,fl,null,{a:lo,b:hi});return finish('El extremo a satisface la tolerancia del residuo.');}
   if(Math.abs(fh)<=tolF){push(hi,fh,null,{a:lo,b:hi});return finish('El extremo b satisface la tolerancia del residuo.');}
   if(Math.sign(fl)===Math.sign(fh))throw Error('No hay cambio de signo: F(a) y F(b) tienen el mismo signo. Amplía o cambia el intervalo.');
   let prev=null;
   for(let i=0;i<max;i++){
    const x=lo+(hi-lo)/2,fx=m.f(x),bound=(hi-lo)/2;push(x,fx,prev,{a:lo,b:hi,bound});
    if(fx===0)return finish('F(x) = 0 a la precisión de cálculo.');
    if(bound<=tolX&&Math.abs(fx)<=tolF)return finish('La cota del error y el residuo cumplen las tolerancias.');
    if(x===lo||x===hi)throw Error('Se alcanzó el límite de precisión numérica. Usa tolerancias menos exigentes.');
    if(Math.sign(fl)!==Math.sign(fx)){hi=x;fh=fx;}else{lo=x;fl=fx;}prev=x;
   }
  }else{
   let prev=a,x=method==='newton'?a:b;let fp=method==='secant'?m.f(prev):null,fx=m.f(x);
   if(method==='secant'&&a===b)throw Error('Secante necesita dos valores iniciales distintos.');
   if(Math.abs(fx)<=tolF){push(x,fx,null);return finish('El valor inicial satisface la tolerancia del residuo.');}
   for(let i=0;i<max;i++){
    let next,extra;
    if(method==='newton'){const df=m.df(x);if(df===0)throw Error('La derivada es cero. Cambia el valor inicial.');next=x-fx/df;extra={previous:x,df};}
    else {const den=fx-fp;if(Math.abs(den)<=Number.EPSILON*Math.max(Math.abs(fx),Math.abs(fp),Number.MIN_VALUE))throw Error('La secante tiene un denominador nulo o demasiado pequeño. Cambia los valores iniciales.');next=x-fx*(x-prev)/den;extra={previous:x,older:prev};}
    const fn=m.f(next),step=push(next,fn,x,extra);
    if(fn===0)return finish('F(x) = 0 a la precisión de cálculo.');
    if(step<=tolX&&Math.abs(fn)<=tolF)return finish('El cambio entre iteraciones y el residuo cumplen las tolerancias.');
    if(next===x)throw Error('La iteración se estancó sin cumplir la tolerancia del residuo.');
    prev=x;fp=fx;x=next;fx=fn;
   }
  }
  message='Se alcanzó el máximo de iteraciones. El último valor NO es una solución confirmada.';
 }catch(e){message=e.message;}
 return result();
}
const api={defs,names,model,solve};if(typeof module!=='undefined')module.exports=api;root.CivilCore=api;
})(typeof globalThis==='undefined'?this:globalThis);
