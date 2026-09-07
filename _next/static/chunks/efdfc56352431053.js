(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,94502,e=>{"use strict";function t(e){return Array.from({length:e},(t,r)=>-20+(r+.5)*40/e)}let r=t(400),i=t(200);function a(e,t,i,n=r){if(!(e>0)||!(t>0))throw Error("alpha and variance must be positive");let u=0;return n.map(r=>n.map(a=>{let n=Math.exp((e-1)*Math.log(a*a+r*r)-((a-i.re)**2+(r-i.im)**2)/t);return u=Math.max(u,n),n})).map(e=>e.map(e=>u>0?e/u:0))}e.s(["LIMIT",0,20,"coordinates",0,r,"previewCoordinates",0,i,"shapeGrid",()=>a])},8219,e=>{"use strict";var t=e.i(76809),r=e.i(5686),i=e.i(65773),a=e.i(94502);let n=e=>Math.max(-a.LIMIT,Math.min(a.LIMIT,e)),u=`
struct Params {
  resolution: vec2f,
  alpha: f32,
  variance: f32,
  mu: vec2f,
  padding: vec2f,
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
  let minimumRadius = sqrt(0.5) * 40.0 / params.resolution.x;
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
    input.pixel.x / params.resolution.x * 40.0 - 20.0,
    input.pixel.y / params.resolution.y * 40.0 - 20.0,
  );
  let radiusSquared = max(dot(z, z), 0.000001);
  let distanceSquared = dot(z - params.mu, z - params.mu);
  let logScore = (params.alpha - 1.0) * log(radiusSquared) - distanceSquared / params.variance;
  let linearIntensity = clamp(exp(logScore - peakLogScore()), 0.0, 1.0);
  return vec4f(viridis(linearIntensity), 1.0);
}
`;function s({alpha:e,variance:r,mu:s,onMuChange:o}){let l=(0,i.useRef)(null),c=(0,i.useRef)(null),m=(0,i.useRef)(null),d=(0,i.useRef)(null),f=(0,i.useRef)(null),[p,x]=(0,i.useState)(0),[v,g]=(0,i.useState)(!1),h=Math.max(1,p-48-16);function b(e){let t=e.currentTarget.getBoundingClientRect();f.current={re:n((e.clientX-t.left)/t.width*40-a.LIMIT),im:n(a.LIMIT-(e.clientY-t.top)/t.height*40)},null===d.current&&(d.current=requestAnimationFrame(()=>{d.current=null,f.current&&o(f.current)}))}(0,i.useEffect)(()=>{let e=c.current;if(!e)return;let t=new ResizeObserver(([e])=>x(Math.max(1,e.contentRect.width)));return t.observe(e),()=>t.disconnect()},[]),(0,i.useEffect)(()=>{let e=!1;return async function(){let t=l.current;if(!t||!navigator.gpu)return;let r=await navigator.gpu.requestAdapter(),i=await r?.requestDevice();if(!i||e)return;let a=t.getContext("webgpu");if(!a)return;let n=navigator.gpu.getPreferredCanvasFormat();a.configure({device:i,format:n,alphaMode:"premultiplied"});let s=i.createShaderModule({code:u}),o=i.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),c=i.createPipelineLayout({bindGroupLayouts:[o]}),d=i.createRenderPipeline({layout:c,vertex:{module:s,entryPoint:"vertex"},fragment:{module:s,entryPoint:"fragment",targets:[{format:n}]},primitive:{topology:"triangle-list"}}),f=i.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),p=i.createBindGroup({layout:o,entries:[{binding:0,resource:{buffer:f}}]});m.current={context:a,device:i,pipeline:d,uniformBuffer:f,bindGroup:p},g(!0)}(),()=>{e=!0,m.current?.uniformBuffer.destroy(),m.current=null}},[]),(0,i.useEffect)(()=>{let t=m.current,i=l.current;if(!t||!i||!p||!v)return;let a=Math.max(1,Math.floor(h*(window.devicePixelRatio||1)));i.width=a,i.height=a,i.style.width=`${h}px`,i.style.height=`${h}px`;let n=new Float32Array([a,a,e,r,s.re,s.im,0,0]);t.device.queue.writeBuffer(t.uniformBuffer,0,n);let u=t.device.createCommandEncoder(),o=u.beginRenderPass({colorAttachments:[{view:t.context.getCurrentTexture().createView(),clearValue:{r:.267,g:.004,b:.329,a:1},loadOp:"clear",storeOp:"store"}]});o.setPipeline(t.pipeline),o.setBindGroup(0,t.bindGroup),o.draw(6),o.end(),t.device.queue.submit([u.finish()])},[e,r,s,v,h,p]);let y=h+16+48;return(0,t.jsxs)("div",{ref:c,className:"relative w-full",style:{height:y},children:[(0,t.jsx)("div",{className:"absolute overflow-hidden",style:{left:48,top:16,width:h,height:h},children:(0,t.jsx)("canvas",{ref:l,"aria-label":"PW-NCCGの形状"})}),(0,t.jsxs)("svg",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0",viewBox:`0 0 ${p} ${y}`,children:[(0,t.jsxs)("g",{fill:"none",stroke:"#777",strokeWidth:"1",children:[(0,t.jsx)("line",{x1:48,y1:16+h,x2:48+h,y2:16+h}),(0,t.jsx)("line",{x1:48,y1:16,x2:48,y2:16+h})]}),(0,t.jsxs)("g",{fill:"#333",fontSize:"11",textAnchor:"middle",children:[[-20,-10,0,10,20].map(e=>{let r=48+(e+a.LIMIT)/40*h;return(0,t.jsx)("text",{x:r,y:y-22,children:e},`x-${e}`)}),(0,t.jsx)("text",{x:48+h/2,y:y-4,children:"Re(z)"})]}),(0,t.jsxs)("g",{fill:"#333",fontSize:"11",textAnchor:"end",children:[[-20,-10,0,10,20].map(e=>{let r=16+(a.LIMIT-e)/40*h;return(0,t.jsx)("text",{x:41,y:r+4,children:e},`y-${e}`)}),(0,t.jsx)("text",{transform:`translate(16 ${16+h/2}) rotate(-90)`,children:"Im(z)"})]})]}),(0,t.jsx)("div",{className:"absolute touch-none cursor-crosshair",style:{left:48,top:16,width:h,height:h},onPointerDown:e=>{e.isPrimary&&0===e.button&&(e.currentTarget.setPointerCapture(e.pointerId),b(e))},onPointerMove:e=>{e.currentTarget.hasPointerCapture(e.pointerId)&&b(e)},onPointerUp:e=>{e.currentTarget.hasPointerCapture(e.pointerId)&&(b(e),e.currentTarget.releasePointerCapture(e.pointerId))},onPointerCancel:e=>{e.currentTarget.hasPointerCapture(e.pointerId)&&e.currentTarget.releasePointerCapture(e.pointerId)},children:(0,t.jsx)("button",{type:"button","aria-label":`μ: 実部 ${s.re.toFixed(2)}、虚部 ${s.im.toFixed(2)}。矢印キーで移動`,title:"ドラッグ、または矢印キーでμを移動",className:"absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-black/70 text-sm font-bold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:cursor-grabbing",style:{left:`${(s.re+a.LIMIT)/40*100}%`,top:`${(a.LIMIT-s.im)/40*100}%`},onKeyDown:e=>{let t=e.shiftKey?1:.1,r={ArrowLeft:[-t,0],ArrowRight:[t,0],ArrowUp:[0,t],ArrowDown:[0,-t]}[e.key];r&&(e.preventDefault(),o({re:n(s.re+r[0]),im:n(s.im+r[1])}))},children:"μ"})})]})}let o=(0,r.default)(()=>e.A(39461),{loadableGenerated:{modules:[55219]},ssr:!1});function l(e){let[r,a]=(0,i.useState)("checking");return((0,i.useEffect)(()=>{let e=!1;return async function(){if(!navigator.gpu){e||a("fallback");return}let t=await navigator.gpu.requestAdapter();e||a(t?"gpu":"fallback")}(),()=>{e=!0}},[]),"checking"===r)?(0,t.jsx)("div",{className:"flex min-h-[300px] items-center justify-center",role:"status",children:"グラフを読み込み中…"}):"fallback"===r?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("p",{className:"mt-2 text-xs text-amber-800",role:"status",children:"WebGPUが利用できないため、互換表示で描画しています。"}),(0,t.jsx)(o,{...e})]}):(0,t.jsx)(s,{...e})}e.s(["default",()=>l],8219)},11740,e=>{e.n(e.i(8219))},39461,e=>{e.v(t=>Promise.all(["static/chunks/720cd965b32d66c0.js"].map(t=>e.l(t))).then(()=>t(55219)))}]);