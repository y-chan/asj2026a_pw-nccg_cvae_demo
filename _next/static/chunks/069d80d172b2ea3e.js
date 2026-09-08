(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,94502,e=>{"use strict";function t(e){let t=Math.trunc(100*e)/100;return Object.is(t,-0)?"0":String(t)}function r(e,t,r){return Array.from({length:r},(i,a)=>e+(a+.5)*(t-e)/r)}let i=r(-20,20,400),a=r(-20,20,200);function n(e,t,r,a=i,u=a){if(!(e>0)||!(t>0))throw Error("alpha and variance must be positive");let s=0;return u.map(i=>a.map(a=>{let n=Math.exp((e-1)*Math.log(a*a+i*i)-((a-r.re)**2+(i-r.im)**2)/t);return s=Math.max(s,n),n})).map(e=>e.map(e=>s>0?e/s:0))}e.s(["LIMIT",0,20,"coordinates",0,i,"formatAxisTick",()=>t,"makeCoordinates",()=>r,"previewCoordinates",0,a,"shapeGrid",()=>n])},8219,e=>{"use strict";var t=e.i(76809),r=e.i(5686),i=e.i(65773),a=e.i(94502);let n=`
struct Params {
  resolution: vec2f,
  alpha: f32,
  variance: f32,
  mu: vec2f,
  plotLimit: f32,
  viewCenter: vec2f,
}

@group(0) @binding(0) var<uniform> params: Params;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) pixel: vec2f,
}

@vertex
fn vertex(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 6>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 0.0),
    vec2f(1.0, 1.0),
  );
  let uv = positions[index];
  var output: VertexOutput;
  output.position = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
  output.pixel = uv * params.resolution;
  return output;
}

fn viridis(t: f32) -> vec3f {
  let c0 = vec3f(0.277727, 0.005407, 0.334099);
  let c1 = vec3f(0.105093, 1.404613, 1.384590);
  let c2 = vec3f(-0.330861, 0.214847, 0.095095);
  let c3 = vec3f(-4.634230, -5.799100, -19.332440);
  let c4 = vec3f(6.228269, 14.179933, 56.690552);
  let c5 = vec3f(4.776384, -13.745145, -65.353032);
  let c6 = vec3f(-5.435455, 4.645852, 26.312435);
  return clamp(c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6))))), vec3f(0.0), vec3f(1.0));
}

fn peakLogScore() -> f32 {
  let muRadius = length(params.mu);
  let power = params.alpha - 1.0;
  let minimumRadius = sqrt(0.5) * (params.plotLimit * 2.0) / params.resolution.x;
  var maximumLogScore = power * log(minimumRadius * minimumRadius) -
    (minimumRadius - muRadius) * (minimumRadius - muRadius) / params.variance;

  if (muRadius > minimumRadius) {
    maximumLogScore = max(maximumLogScore, power * log(muRadius * muRadius));
  }

  let discriminant = muRadius * muRadius + 4.0 * power * params.variance;
  if (discriminant > 0.0) {
    let radius = (muRadius + sqrt(discriminant)) / 2.0;
    if (radius > minimumRadius) {
      maximumLogScore = max(
        maximumLogScore,
        power * log(radius * radius) -
          (radius - muRadius) * (radius - muRadius) / params.variance,
      );
    }
  }
  return maximumLogScore;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f {
  let z = vec2f(
    params.viewCenter.x +
      input.pixel.x / params.resolution.x * (params.plotLimit * 2.0) -
      params.plotLimit,
    params.viewCenter.y +
      input.pixel.y / params.resolution.y * (params.plotLimit * 2.0) -
      params.plotLimit,
  );
  let radiusSquared = max(dot(z, z), 0.000001);
  let distanceSquared = dot(z - params.mu, z - params.mu);
  let logScore = (params.alpha - 1.0) * log(radiusSquared) - distanceSquared / params.variance;
  let linearIntensity = clamp(exp(logScore - peakLogScore()), 0.0, 1.0);
  return vec4f(viridis(linearIntensity), 1.0);
}
`;function u({alpha:e,variance:r,mu:u,onMuChange:s,interactive:o=!0,plotLimit:l=a.LIMIT,matchSpectrumHeight:c=!1}){let m=(0,i.useRef)(null),d=(0,i.useRef)(null),f=(0,i.useRef)(null),p=(0,i.useRef)(null),x=(0,i.useRef)(null),[h,v]=(0,i.useState)(0),[g,b]=(0,i.useState)(!1),[y,w]=(0,i.useState)(1),[R,P]=(0,i.useState)({re:0,im:0}),j=Math.max(1,h-48-16),S=c?j:j+16+48,M=S-16-48,C=l/y,L=Math.max(-l+C,Math.min(l-C,R.re)),T=Math.max(-l+C,Math.min(l-C,R.im)),A=L-C,k=L+C,G=T-C,I=T+C;function B(e){let t=e.currentTarget.getBoundingClientRect();x.current={re:Math.max(-l,Math.min(l,A+(e.clientX-t.left)/t.width*(k-A))),im:Math.max(-l,Math.min(l,I-(e.clientY-t.top)/t.height*(I-G)))},null===p.current&&(p.current=requestAnimationFrame(()=>{p.current=null,x.current&&s?.(x.current)}))}return(0,i.useEffect)(()=>{let e=d.current;if(!e)return;let t=new ResizeObserver(([e])=>v(Math.max(1,e.contentRect.width)));return t.observe(e),()=>t.disconnect()},[]),(0,i.useEffect)(()=>{let e=!1;return async function(){let t=m.current;if(!t||!navigator.gpu)return;let r=await navigator.gpu.requestAdapter(),i=await r?.requestDevice();if(!i||e)return;let a=t.getContext("webgpu");if(!a)return;let u=navigator.gpu.getPreferredCanvasFormat();a.configure({device:i,format:u,alphaMode:"premultiplied"});let s=i.createShaderModule({code:n}),o=i.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),l=i.createPipelineLayout({bindGroupLayouts:[o]}),c=i.createRenderPipeline({layout:l,vertex:{module:s,entryPoint:"vertex"},fragment:{module:s,entryPoint:"fragment",targets:[{format:u}]},primitive:{topology:"triangle-list"}}),d=i.createBuffer({size:40,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),p=i.createBindGroup({layout:o,entries:[{binding:0,resource:{buffer:d}}]});f.current={context:a,device:i,pipeline:c,uniformBuffer:d,bindGroup:p},b(!0)}(),()=>{e=!0,f.current?.uniformBuffer.destroy(),f.current=null}},[]),(0,i.useEffect)(()=>{let t=f.current,i=m.current;if(!t||!i||!h||!g)return;let a=Math.max(1,Math.floor(M*(window.devicePixelRatio||1)));i.width=a,i.height=a,i.style.width=`${M}px`,i.style.height=`${M}px`;let n=new Float32Array([a,a,e,r,u.re,u.im,C,0,L,T]);t.device.queue.writeBuffer(t.uniformBuffer,0,n);let s=t.device.createCommandEncoder(),o=s.beginRenderPass({colorAttachments:[{view:t.context.getCurrentTexture().createView(),clearValue:{r:.267,g:.004,b:.329,a:1},loadOp:"clear",storeOp:"store"}]});o.setPipeline(t.pipeline),o.setBindGroup(0,t.bindGroup),o.draw(6),o.end(),t.device.queue.submit([s.finish()])},[e,T,L,u,r,C,g,M,h]),(0,t.jsxs)("div",{ref:d,className:"relative w-full",style:{height:S+40},children:[(0,t.jsx)("div",{className:"absolute overflow-hidden",style:{left:48,top:16,width:M,height:M},children:(0,t.jsx)("canvas",{ref:m,"aria-label":"PW-NCCGの形状"})}),(0,t.jsxs)("svg",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0",viewBox:`0 0 ${h} ${S}`,children:[(0,t.jsxs)("g",{fill:"none",stroke:"#777",strokeWidth:"1",children:[(0,t.jsx)("line",{x1:48,y1:16+M,x2:48+M,y2:16+M}),(0,t.jsx)("line",{x1:48,y1:16,x2:48,y2:16+M})]}),(0,t.jsxs)("g",{fill:"#333",fontSize:"11",textAnchor:"middle",children:[[A,L,k].map(e=>{let r=48+(e-A)/(k-A)*M;return(0,t.jsx)("text",{x:r,y:S-22,children:(0,a.formatAxisTick)(e)},`x-${e}`)}),(0,t.jsx)("text",{x:48+M/2,y:S-4,children:"Re(z)"})]}),(0,t.jsxs)("g",{fill:"#333",fontSize:"11",textAnchor:"end",children:[[G,T,I].map(e=>{let r=16+(I-e)/(I-G)*M;return(0,t.jsx)("text",{x:41,y:r+4,children:(0,a.formatAxisTick)(e)},`y-${e}`)}),(0,t.jsx)("text",{transform:`translate(16 ${16+M/2}) rotate(-90)`,children:"Im(z)"})]})]}),(0,t.jsx)("div",{className:"absolute touch-none cursor-crosshair",style:{left:48,top:16,width:M,height:M},onPointerDown:e=>{e.isPrimary&&0===e.button&&(e.currentTarget.setPointerCapture(e.pointerId),B(e))},onPointerMove:e=>{e.currentTarget.hasPointerCapture(e.pointerId)&&B(e)},onPointerUp:e=>{e.currentTarget.hasPointerCapture(e.pointerId)&&(B(e),e.currentTarget.releasePointerCapture(e.pointerId))},onPointerCancel:e=>{e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId)},children:o&&(0,t.jsx)("button",{type:"button","aria-label":`μ: 実部 ${u.re.toFixed(2)}、虚部 ${u.im.toFixed(2)}。矢印キーで移動`,title:"ドラッグ、または矢印キーでμを移動",className:"absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-black/70 text-sm font-bold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:cursor-grabbing",style:{left:`${(u.re-A)/(k-A)*100}%`,top:`${(I-u.im)/(I-G)*100}%`},onKeyDown:e=>{let t=e.shiftKey?1:.1,r={ArrowLeft:[-t,0],ArrowRight:[t,0],ArrowUp:[0,t],ArrowDown:[0,-t]}[e.key];r&&(e.preventDefault(),s?.({re:Math.max(-l,Math.min(l,u.re+r[0])),im:Math.max(-l,Math.min(l,u.im+r[1]))}))},children:"μ"})}),(0,t.jsxs)("label",{className:"absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-neutral-600",children:[(0,t.jsxs)("span",{children:["拡大率 ",y.toFixed(1),"×"]}),(0,t.jsx)("input",{"aria-label":"分布の拡大率",type:"range",min:"1",max:"20",step:"0.1",value:y,onChange:function(e){w(Number(e.target.value)),P(u)}})]})]})}let s=(0,r.default)(()=>e.A(39461),{loadableGenerated:{modules:[55219]},ssr:!1});function o(e){let[r,a]=(0,i.useState)("checking");return((0,i.useEffect)(()=>{let e=!1;return async function(){if(!navigator.gpu){e||a("fallback");return}let t=await navigator.gpu.requestAdapter();e||a(t?"gpu":"fallback")}(),()=>{e=!0}},[]),"checking"===r)?(0,t.jsx)("div",{className:"flex min-h-[300px] items-center justify-center",role:"status",children:"グラフを読み込み中…"}):"fallback"===r?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("p",{className:"mt-2 text-xs text-amber-800",role:"status",children:"WebGPUが利用できないため、互換表示で描画しています。"}),(0,t.jsx)(s,{...e})]}):(0,t.jsx)(u,{...e})}e.s(["default",()=>o],8219)},11740,e=>{e.n(e.i(8219))},39461,e=>{e.v(t=>Promise.all(["static/chunks/652db975044164c4.js","static/chunks/2ab05323eeb43e37.js"].map(t=>e.l(t))).then(()=>t(55219)))}]);