(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,81700,e=>{"use strict";let t=[-44153416464793395e-34,33307945188222384e-33,-2431279846547955e-31,1715391285555133e-30,-11685332877993451e-30,7676185498604936e-29,-4856446783111929e-28,295505266312964e-26,-1726826291441556e-26,9675809035373237e-26,-5189795601635263e-25,26598237246823866e-25,-1300025009986248e-23,6046995022541919e-23,-2670793853940612e-22,11173875391201037e-22,-44167383584587505e-22,16448448070728896e-21,-5754195010082104e-20,18850288509584165e-20,-5763755745385824e-19,.0016394756169413357,-.004324309995050576,.010546460394594998,-.02373741480589947,.04930528423967071,-.09490109704804764,.17162090152220877,-.3046826723431984,.6767952744094761],r=[-7233180487874754e-33,-4830504485944182e-33,446562142029676e-31,3461222867697461e-32,-28276239805165836e-32,-3425485619677219e-31,17725601330565263e-31,38116806693526224e-31,-9554846698828307e-30,-4150569347287222e-29,154008621752141e-28,38527783827421426e-29,7180124451383666e-28,-17941785315068062e-28,-13215811840447713e-27,-31499165279632416e-27,11889147107846439e-27,494060238822497e-24,33962320257083865e-25,2266668990498178e-23,20489185894690638e-23,28913705208347567e-22,6889758346916825e-20,.0033691164782556943,.8044904110141088];function a(e,t){let r=t[0],a=0,n=0;for(let i=1;i<t.length;i+=1)n=a,r=e*(a=r)-n+t[i];return .5*(r-n)}function n(e,i,l,s=400,u=20){if(!(e>0)||!(i>0)||!(l>=0))throw Error("alpha, variance, and nu must be valid");let o=Array.from({length:s},(n,o)=>{var c,p,f;let x,m,h,d,v=(o+.5)*u/s;return{r:v,value:(c=v,p=e,f=i,d=2*l*(m=Math.max(c,1e-12))/(h=Math.max(f,1e-6)),(2*p-1)*Math.log(m)-m*m/h+d+Math.log(Math.max((x=Math.abs(d))<=8?a(x/2-2,t):a(32/x-2,r)/Math.sqrt(x),5e-324)))}}),c=Math.max(...o.map(({value:e})=>e));return o.map(({r:e,value:t})=>({r:e,value:Math.exp(Math.min(0,t-c))}))}function i(e){return e.map(e=>`${e}`).join(",\n  ")}let l=`
const I0E_SMALL: array<f32, 30> = array<f32, 30>(
  ${i(t)}
);
const I0E_LARGE: array<f32, 25> = array<f32, 25>(
  ${i(r)}
);

fn chbevl30(x: f32) -> f32 {
  var b0 = I0E_SMALL[0];
  var b1 = 0.0;
  var b2 = 0.0;
  for (var index = 1u; index < 30u; index++) {
    b2 = b1;
    b1 = b0;
    b0 = x * b1 - b2 + I0E_SMALL[index];
  }
  return 0.5 * (b0 - b2);
}

fn chbevl25(x: f32) -> f32 {
  var b0 = I0E_LARGE[0];
  var b1 = 0.0;
  var b2 = 0.0;
  for (var index = 1u; index < 25u; index++) {
    b2 = b1;
    b1 = b0;
    b0 = x * b1 - b2 + I0E_LARGE[index];
  }
  return 0.5 * (b0 - b2);
}

fn i0e(input: f32) -> f32 {
  let x = abs(input);
  if (x <= 8.0) {
    return chbevl30(x * 0.5 - 2.0);
  }
  return chbevl25(32.0 / x - 2.0) / sqrt(x);
}

fn logI0(input: f32) -> f32 {
  let x = abs(input);
  return x + log(max(i0e(x), 1e-30));
}
`;e.s(["amplitudeShape",()=>n,"i0eWgsl",0,l])},90555,e=>{"use strict";var t=e.i(76809),r=e.i(5686),a=e.i(65773),n=e.i(81700);let i=`
struct Params {
  resolution: vec2f,
  alpha: f32,
  variance: f32,
  nu: f32,
  plotLimit: f32,
  padding: f32,
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

${n.i0eWgsl}

fn logShape(r: f32) -> f32 {
  let safeR = max(r, 1e-6);
  let x = 2.0 * params.nu * safeR / params.variance;
  return (2.0 * params.alpha - 1.0) * log(safeR) -
    safeR * safeR / params.variance + x + logI0(x);
}

fn maximumLogShape() -> f32 {
  var maximum = -1e30;
  for (var index = 0u; index < 512u; index++) {
    let r = (f32(index) + 0.5) * params.plotLimit / 512.0;
    maximum = max(maximum, logShape(r));
  }
  return maximum;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f {
  let r = input.pixel.x / params.resolution.x * params.plotLimit;
  let shape = clamp(exp(min(0.0, logShape(r) - maximumLogShape())), 0.0, 1.0);
  // The fullscreen triangle uses WebGPU's bottom-origin clip-space y here.
  // Convert shape=0 to the bottom and shape=1 to the top of the plot.
  let curveY = shape * params.resolution.y;
  // Use the local tangent so steep parts are measured perpendicular to the
  // curve instead of as a single-pixel vertical hit test.
  let rStep = params.plotLimit / params.resolution.x;
  let previousShape = clamp(exp(min(0.0, logShape(max(0.0, r - rStep)) - maximumLogShape())), 0.0, 1.0);
  let nextShape = clamp(exp(min(0.0, logShape(r + rStep) - maximumLogShape())), 0.0, 1.0);
  let localSlope = (nextShape - previousShape) * params.resolution.y * 0.5;
  let normalDistance = abs(input.pixel.y - curveY) / sqrt(1.0 + localSlope * localSlope);
  let lineAlpha = 1.0 - smoothstep(1.0, 2.5, normalDistance);

  // Draw the same linear shape curve as the Plotly fallback.
  return vec4f(0.569, 0.667, 0.835, lineAlpha);
}
`;function l({alpha:e,variance:r,nu:n,plotLimit:l=20}){let s=(0,a.useRef)(null),u=(0,a.useRef)(null),o=(0,a.useRef)(null),[c,p]=(0,a.useState)(0),[f,x]=(0,a.useState)(!1),m=Math.max(1,c-48-16),h=m/1.5,d=h+16+48;(0,a.useEffect)(()=>{let e=u.current;if(!e)return;let t=new ResizeObserver(([e])=>p(Math.max(1,e.contentRect.width)));return t.observe(e),()=>t.disconnect()},[]),(0,a.useEffect)(()=>{let e=!1;return async function(){let t=s.current;if(!t||!navigator.gpu)return;let r=await navigator.gpu.requestAdapter(),a=await r?.requestDevice();if(!a||e)return;let n=t.getContext("webgpu");if(!n)return;let l=navigator.gpu.getPreferredCanvasFormat();n.configure({device:a,format:l,alphaMode:"premultiplied"});let u=a.createShaderModule({code:i}),c=a.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),p=a.createPipelineLayout({bindGroupLayouts:[c]}),f=a.createRenderPipeline({layout:p,vertex:{module:u,entryPoint:"vertex"},fragment:{module:u,entryPoint:"fragment",targets:[{format:l}]},primitive:{topology:"triangle-list"}}),m=a.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),h=a.createBindGroup({layout:c,entries:[{binding:0,resource:{buffer:m}}]});o.current={context:n,device:a,pipeline:f,uniformBuffer:m,bindGroup:h},x(!0)}(),()=>{e=!0,o.current?.uniformBuffer.destroy(),o.current=null}},[]),(0,a.useEffect)(()=>{let t=o.current,a=s.current;if(!t||!a||!c||!f)return;let i=window.devicePixelRatio||1,u=Math.max(1,Math.floor(m*i)),p=Math.max(1,Math.floor(h*i));a.width=u,a.height=p,a.style.width=`${m}px`,a.style.height=`${h}px`,t.device.queue.writeBuffer(t.uniformBuffer,0,new Float32Array([u,p,e,Math.max(r,1e-6),n,l,0,0]));let x=t.device.createCommandEncoder(),d=x.beginRenderPass({colorAttachments:[{view:t.context.getCurrentTexture().createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}]});d.setPipeline(t.pipeline),d.setBindGroup(0,t.bindGroup),d.draw(6),d.end(),t.device.queue.submit([x.finish()])},[e,r,n,l,h,m,f,c]);let v=Math.max(0,Math.min(l,n)),b=Math.min(48+m-8,48+v/l*m+6);return(0,t.jsxs)("div",{ref:u,className:"relative w-full",style:{height:d},children:[(0,t.jsxs)("div",{className:"absolute overflow-hidden",style:{left:48,top:16,width:m,height:h},children:[(0,t.jsx)("canvas",{ref:s,"aria-label":"PW-NCCGの振幅分布"}),(0,t.jsx)("div",{"aria-hidden":"true",className:"pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-neutral-500",style:{left:`${v/l*100}%`}})]}),(0,t.jsxs)("svg",{"aria-hidden":"true",className:"pointer-events-none absolute inset-0",viewBox:`0 0 ${c} ${d}`,children:[(0,t.jsxs)("g",{fill:"none",stroke:"#777",strokeWidth:"1",children:[(0,t.jsx)("line",{x1:48,y1:16+h,x2:48+m,y2:16+h}),(0,t.jsx)("line",{x1:48,y1:16,x2:48,y2:16+h})]}),(0,t.jsxs)("g",{fill:"#333",fontSize:"11",textAnchor:"middle",children:[[0,l/2,l].map(e=>{let r=48+e/l*m;return(0,t.jsx)("text",{x:r,y:d-22,children:e},`x-${e}`)}),(0,t.jsx)("text",{x:48+m/2,y:d-4,children:"r"})]}),(0,t.jsxs)("g",{fill:"#333",fontSize:"11",textAnchor:"end",children:[[0,.5,1].map(e=>{let r=16+(1-e)*h;return(0,t.jsx)("text",{x:41,y:r+4,children:e},`y-${e}`)}),(0,t.jsx)("text",{transform:`translate(16 ${16+h/2}) rotate(-90)`,children:"shape"})]}),(0,t.jsx)("text",{x:b,y:28,fill:"#444",fontSize:"11",textAnchor:"start",children:"ν"})]})]})}let s=(0,r.default)(()=>e.A(83350),{loadableGenerated:{modules:[81405]},ssr:!1});function u(e){let[r,n]=(0,a.useState)("checking");return((0,a.useEffect)(()=>{let e=!1;return async function(){if(!navigator.gpu){e||n("fallback");return}let t=await navigator.gpu.requestAdapter();e||n(t?"gpu":"fallback")}(),()=>{e=!0}},[]),"checking"===r)?(0,t.jsx)("div",{className:"flex min-h-[300px] items-center justify-center",role:"status",children:"グラフを読み込み中…"}):"fallback"===r?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("p",{className:"mt-2 text-xs text-amber-800",role:"status",children:"WebGPUが利用できないため、互換表示で描画しています。"}),(0,t.jsx)(s,{...e})]}):(0,t.jsx)(l,{...e})}e.s(["default",()=>u],90555)},30088,e=>{e.n(e.i(90555))},83350,e=>{e.v(t=>Promise.all(["static/chunks/17b48edfbc7c14f3.js","static/chunks/2ab05323eeb43e37.js"].map(t=>e.l(t))).then(()=>t(81405)))}]);