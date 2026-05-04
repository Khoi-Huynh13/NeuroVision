import { useState, useEffect, useRef, useCallback } from "react";
import Aurora from "./Aurora";
import BorderGlow from "./BorderGlow";

// ═══════════════════════════════════════════════════════════════════════════
//  PIPELINE INTEGRATION POINT
// ═══════════════════════════════════════════════════════════════════════════

// async function runInference(imageFile) {
  // ── UNCOMMENT when backend is ready ──
  // const fd = new FormData();
  // fd.append("image", imageFile);
  // const res = await fetch("https://<YOUR_ENDPOINT>/predict", { method:"POST", body:fd });
  // if (!res.ok) throw new Error(res.status);
  // const d = await res.json();
  // return {
  //   label: d.label, confidence: d.confidence, probabilities: d.probabilities,
  //   segMaskUrl: d.seg_mask_b64 ? `data:image/png;base64,${d.seg_mask_b64}` : null,
  //   gradcamUrl: d.gradcam_b64  ? `data:image/png;base64,${d.gradcam_b64}`  : null,
  // };

async function runInference(imageFile) {
  const fd = new FormData();
  fd.append("image", imageFile);
  const res = await fetch("https://voice-errant-jokingly.ngrok-free.dev/predict", { method:"POST", body:fd });
  if (!res.ok) throw new Error(res.status);
  const d = await res.json();
  return {
    label:       d.label,
    confidence:  d.confidence,
    probabilities: d.probabilities,
    segMaskUrl:  d.seg_mask_b64 ? `data:image/png;base64,${d.seg_mask_b64}` : null,
    gradcamUrl:  d.gradcam_b64  ? `data:image/png;base64,${d.gradcam_b64}`  : null,
  };
}

//   await new Promise(r => setTimeout(r, 2800));
//   return {
//     label: "Glioma", confidence: 0.92,
//     probabilities: { Glioma:0.92, Meningioma:0.04, Pituitary:0.03, "No Tumor":0.01 },
//     segMaskUrl: null, gradcamUrl: null,
//   };
// }

// ─── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

/* ── Kill Vite's default flex centering that breaks full-width layout ── */
html,body{
  background:#05050a;margin:0;padding:0;
  overflow-x:hidden;width:100%;
  display:block !important;
  min-height:100vh;
}
canvas{display:block;}

:root{
  --bg:#05050a;--s2:#111120;
  --bd:rgba(255,255,255,0.07);--bd2:rgba(255,255,255,0.12);
  --ac:#4361ee;--ac2:#00d4ff;
  --tx:#e8e8f2;--mu:#6b6b92;
  --ok:#00c97d;--wn:#ffc857;--er:#ff4d6d;
  --ff:'Outfit',sans-serif;--mono:'JetBrains Mono',monospace;
  --r:12px;--r2:20px;
}

body{color:var(--tx);font-family:var(--ff);cursor:none;-webkit-font-smoothing:antialiased;}
@media(hover:none){body{cursor:auto;}.blob,.dot{display:none;}}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
@keyframes scanline{0%{transform:translateY(-100%);opacity:0;}10%{opacity:1;}90%{opacity:1;}100%{transform:translateY(110%);opacity:0;}}
@keyframes shimmer{0%{background-position:-200% center;}100%{background-position:200% center;}}
@keyframes letterIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@keyframes splashLogo{from{opacity:0;transform:scale(0.55);}to{opacity:1;transform:scale(1);}}
@keyframes splashLine{to{width:160px;}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(67,97,238,0.45);}50%{box-shadow:0 0 0 18px rgba(67,97,238,0);}}
@keyframes navShimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100vw);}}

.app{min-height:100vh;width:100%;display:flex;flex-direction:column;position:relative;z-index:1;}

/* Cursor */
.blob{position:fixed;width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(67,97,238,0.5);pointer-events:none;z-index:9999;top:0;left:0;will-change:transform;mix-blend-mode:screen;}
.dot{position:fixed;width:6px;height:6px;border-radius:50%;background:rgba(0,212,255,0.9);pointer-events:none;z-index:9999;top:0;left:0;will-change:transform;}

/* ── Liquid glass nav — full width ── */
.nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 40px;
  width:100%;
  position:sticky;top:0;z-index:50;
  /* Glass layers */
  background:
    linear-gradient(105deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.06) 100%),
    rgba(10,10,22,0.35);
  backdrop-filter:blur(32px) saturate(200%) brightness(1.08);
  -webkit-backdrop-filter:blur(32px) saturate(200%) brightness(1.08);
  border-bottom:1px solid rgba(255,255,255,0.07);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.09),
    0 1px 0 rgba(255,255,255,0.03),
    0 8px 32px rgba(0,0,0,0.25);
  overflow:hidden;
}
/* Liquid shimmer sweep on nav */
.nav::after{
  content:'';
  position:absolute;top:0;left:0;right:0;
  height:1px;
  background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 30%,rgba(0,212,255,0.2) 50%,rgba(255,255,255,0.15) 70%,transparent 100%);
  pointer-events:none;
}
.nav-logo{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:600;letter-spacing:-0.3px;cursor:pointer;color:var(--tx);position:relative;z-index:1;}
.nav-btn{font-size:13px;color:var(--mu);padding:7px 16px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-family:var(--ff);background:rgba(255,255,255,0.05);cursor:none;transition:border-color 0.2s,color 0.2s,background 0.2s;position:relative;z-index:1;}
.nav-btn:hover{border-color:rgba(67,97,238,0.5);color:var(--tx);background:rgba(67,97,238,0.1);}
.nav-btn.act{border-color:rgba(67,97,238,0.5);color:var(--tx);background:rgba(67,97,238,0.12);}

/* Hero */
.hero{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:64px 24px 56px;text-align:center;width:100%;}
.tag{font-size:10.5px;font-family:var(--mono);color:var(--ac2);letter-spacing:2px;text-transform:uppercase;border:1px solid rgba(0,212,255,0.18);padding:4px 14px;border-radius:100px;margin-bottom:24px;animation:fadeUp 0.5s ease both;backdrop-filter:blur(8px);background:rgba(0,212,255,0.04);}
.hero-title{font-size:clamp(34px,4.8vw,62px);font-weight:700;letter-spacing:-1.5px;line-height:1.1;margin-bottom:20px;max-width:680px;color:#ffffff;}
.title-line1{display:block;color:#ffffff;}
.title-line2{display:block;background:linear-gradient(135deg,#4361ee 0%,#00d4ff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:fadeUp 0.7s 0.65s ease both;opacity:0;}
.letter{display:inline-block;color:#ffffff;animation:letterIn 0.4s cubic-bezier(0.22,1,0.36,1) both;}
.hero-sub{font-size:15px;color:var(--mu);line-height:1.75;max-width:460px;margin-bottom:44px;animation:fadeUp 0.5s 1.1s ease both;opacity:0;}

/* Upload card */
.upload-card{width:100%;max-width:480px;animation:fadeUp 0.5s 1.25s ease both;opacity:0;}
.drop-zone{border:2px dashed rgba(67,97,238,0.25);border-radius:14px;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:none;transition:border-color 0.25s,background 0.25s;}
.drop-zone:hover,.drop-zone.over{border-color:rgba(0,212,255,0.5);background:rgba(0,212,255,0.03);}
.drop-zone.ready{border-color:rgba(0,201,125,0.45);background:rgba(0,201,125,0.04);}
.drop-icon{width:48px;height:48px;border-radius:13px;background:rgba(67,97,238,0.12);display:flex;align-items:center;justify-content:center;font-size:22px;}
.drop-lbl{font-size:14px;color:var(--mu);}
.drop-lbl b{color:var(--tx);font-weight:500;}
.drop-hint{font-size:11px;font-family:var(--mono);color:var(--mu);}
.file-row{display:flex;align-items:center;gap:10px;background:var(--s2);border-radius:10px;padding:10px 14px;margin-top:6px;}
.file-name{font-size:13px;font-weight:500;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.file-sz{font-size:11px;color:var(--mu);font-family:var(--mono);}
.file-x{width:24px;height:24px;border-radius:6px;border:none;background:rgba(255,77,109,0.12);color:var(--er);font-size:12px;cursor:none;display:flex;align-items:center;justify-content:center;transition:background 0.2s;}
.file-x:hover{background:rgba(255,77,109,0.24);}
.proc-btn{width:100%;margin-top:6px;padding:15px;border:none;border-radius:14px;background:var(--ac);color:white;font-size:15px;font-weight:600;font-family:var(--ff);cursor:none;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.2s,transform 0.15s,box-shadow 0.2s;}
.proc-btn:hover:not(:disabled){background:#5572f0;transform:translateY(-1px);box-shadow:0 8px 28px rgba(67,97,238,0.38);}
.proc-btn:active:not(:disabled){transform:none;}
.proc-btn:disabled{opacity:0.35;cursor:not-allowed;}
.shimmer-btn{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 30%,rgba(255,255,255,0.15),transparent 70%);background-size:200% 100%;animation:shimmer 2s infinite;}
input[type="file"]{display:none;}

/* Processing */
.processing{position:fixed;inset:0;z-index:200;background:rgba(5,5,10,0.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;animation:fadeIn 0.3s ease;}
.pulse-ring{width:120px;height:120px;border-radius:50%;border:1.5px solid rgba(67,97,238,0.35);display:flex;align-items:center;justify-content:center;animation:pulse 1.8s ease-in-out infinite;}
.proc-lbl{font-size:11px;font-family:var(--mono);color:var(--mu);letter-spacing:2.5px;text-transform:uppercase;}
.steps{display:flex;flex-direction:column;gap:10px;}
.step{display:flex;align-items:center;gap:10px;font-size:13px;font-family:var(--mono);color:var(--mu);transition:color 0.3s;}
.step.active{color:var(--ac2);}.step.done{color:var(--ok);}
.step-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0;}
.step.active .step-dot{animation:blink 0.7s infinite;}

/* Results */
.results{flex:1;padding:36px 40px;max-width:1060px;margin:0 auto;width:100%;display:flex;flex-direction:column;gap:20px;animation:fadeUp 0.4s ease;position:relative;z-index:1;}
.res-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.res-title{font-size:24px;font-weight:600;letter-spacing:-0.4px;}
.rg{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.rg .s2{grid-column:span 2;}

/* Inner card content (used inside BorderGlow) */
.card-inner{display:flex;flex-direction:column;gap:16px;padding:20px;}

.clbl{font-size:10.5px;font-family:var(--mono);letter-spacing:1.8px;text-transform:uppercase;color:var(--mu);display:flex;align-items:center;gap:8px;}
.clbl::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--ac2);flex-shrink:0;}
.mri{position:relative;border-radius:14px;overflow:hidden;background:#000;aspect-ratio:1;display:flex;align-items:center;justify-content:center;}
.mri img{width:100%;height:100%;object-fit:cover;display:block;}
.mri-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;font-size:12px;font-family:var(--mono);color:var(--mu);width:100%;min-height:180px;justify-content:center;background:#070712;}
.scan-line{position:absolute;inset:0;pointer-events:none;background:linear-gradient(transparent 35%,rgba(0,212,255,0.04) 50%,transparent 65%);animation:scanline 4s linear infinite;}
.cls-name{font-size:26px;font-weight:700;letter-spacing:-0.5px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.pill{font-size:11px;font-family:var(--mono);font-weight:400;padding:3px 11px;border-radius:100px;}
.p-gl{background:rgba(255,77,109,0.14);color:#ff7a93;border:1px solid rgba(255,77,109,0.22);}
.p-mn{background:rgba(255,200,87,0.14);color:var(--wn);border:1px solid rgba(255,200,87,0.22);}
.p-pt{background:rgba(67,97,238,0.16);color:#8fa3ff;border:1px solid rgba(67,97,238,0.25);}
.p-nt{background:rgba(0,201,125,0.14);color:var(--ok);border:1px solid rgba(0,201,125,0.22);}
.conf-hd{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;}
.conf-hd span:last-child{font-weight:600;font-family:var(--mono);}
.conf-trk{height:5px;background:rgba(255,255,255,0.07);border-radius:100px;overflow:hidden;}
.conf-fill{height:100%;border-radius:100px;background:linear-gradient(90deg,var(--ac),var(--ac2));transition:width 1.3s cubic-bezier(0.16,1,0.3,1);}
.probs{display:flex;flex-direction:column;gap:10px;background:rgba(17,17,32,0.8);border-radius:10px;padding:14px 16px;}
.prob-row{display:flex;align-items:center;gap:10px;}
.prob-lbl{font-size:12px;font-family:var(--mono);width:92px;flex-shrink:0;}
.prob-trk{flex:1;height:3px;background:rgba(255,255,255,0.06);border-radius:100px;overflow:hidden;}
.prob-fill{height:100%;border-radius:100px;transition:width 1.2s cubic-bezier(0.16,1,0.3,1);}
.prob-val{font-size:11px;font-family:var(--mono);color:var(--mu);width:40px;text-align:right;}
.disc{font-size:12px;font-family:var(--mono);color:var(--mu);line-height:1.65;border-left:2px solid rgba(255,200,87,0.35);padding-left:12px;}
.seg-g{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.seg-c{display:flex;flex-direction:column;gap:8px;}
.seg-s{font-size:12px;font-family:var(--mono);color:var(--mu);text-align:center;}

/* Histories — scroll reveal */
.hist{flex:1;padding:48px 40px;max-width:880px;margin:0 auto;width:100%;display:flex;flex-direction:column;gap:40px;position:relative;z-index:1;}
.hist-intro{text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;}
.hist-title{font-size:30px;font-weight:700;letter-spacing:-0.8px;}
.hist-desc{font-size:15px;color:var(--mu);line-height:1.75;max-width:560px;}
.sect-label{font-size:11px;font-family:var(--mono);color:var(--ac2);letter-spacing:2px;text-transform:uppercase;display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.sect-label::after{content:'';flex:1;height:1px;background:var(--bd);}
.team-g{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.arch-g{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.ds-g{display:grid;grid-template-columns:1fr 1fr;gap:16px;}

/* Card inner content for BorderGlow cards */
.hcard-inner{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:20px;}
.acard-inner{display:flex;flex-direction:column;gap:10px;padding:20px;}
.t-av{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--ac),var(--ac2));display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:white;}
.t-name{font-size:14px;font-weight:600;}
.t-role{font-size:12px;color:var(--mu);font-family:var(--mono);}
.a-name{font-size:14px;font-weight:600;}
.a-detail{font-size:12px;color:var(--mu);line-height:1.65;}
.a-badge{font-size:11px;font-family:var(--mono);color:var(--ac);background:rgba(67,97,238,0.1);border:1px solid rgba(67,97,238,0.2);padding:3px 10px;border-radius:100px;width:fit-content;}
.d-title{font-size:14px;font-weight:600;}
.d-meta{font-size:12px;color:var(--mu);font-family:var(--mono);line-height:1.75;}
.d-tag{font-size:11px;font-family:var(--mono);color:var(--ac2);background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.18);padding:3px 10px;border-radius:100px;width:fit-content;}

/* Buttons */
.act-row{display:flex;gap:12px;flex-wrap:wrap;}
.btn-p{padding:12px 22px;border:none;border-radius:10px;background:var(--ac);color:white;font-size:14px;font-weight:600;font-family:var(--ff);cursor:none;display:flex;align-items:center;gap:8px;transition:background 0.2s,transform 0.15s,box-shadow 0.2s;}
.btn-p:hover{background:#5572f0;transform:translateY(-1px);box-shadow:0 8px 28px rgba(67,97,238,0.38);}
.btn-o{padding:12px 22px;border:1px solid var(--bd2);border-radius:10px;background:transparent;color:var(--tx);font-size:14px;font-weight:500;font-family:var(--ff);cursor:none;transition:border-color 0.2s,background 0.2s;}
.btn-o:hover{border-color:rgba(67,97,238,0.45);background:rgba(67,97,238,0.06);}
.footer{border-top:1px solid var(--bd);padding:18px 40px;font-size:11px;color:var(--mu);font-family:var(--mono);text-align:center;letter-spacing:0.3px;position:relative;z-index:1;width:100%;}

@media(max-width:900px){.team-g,.arch-g{grid-template-columns:1fr 1fr;}}
@media(max-width:640px){
  .nav{padding:12px 16px;}
  .hero{padding:44px 16px 36px;}
  .hero-title{font-size:30px;letter-spacing:-0.8px;}
  .hero-sub{font-size:14px;margin-bottom:32px;}
  .upload-card{max-width:100%;}
  .rg{grid-template-columns:1fr;}
  .rg .s2{grid-column:span 1;}
  .results,.hist{padding:20px 16px;}
  .res-header{flex-direction:column;align-items:flex-start;}
  .team-g,.arch-g,.ds-g{grid-template-columns:1fr;}
  .act-row{width:100%;}
  .btn-p,.btn-o{flex:1;justify-content:center;}
  .footer{padding:16px;}
}
`;

// ─── Helpers ───────────────────────────────────────────────────────────────
const TUMOR_CLASSES = ["Glioma","Meningioma","Pituitary","No Tumor"];
const STEPS = [
  "Preprocessing scan...",
  "Running classifier (EfficientNet-B0)...",
  "Generating Grad-CAM activation map...",
  "Running U-Net segmentation...",
  "Compiling outputs...",
];
const pillClass = l => ({Glioma:"p-gl",Meningioma:"p-mn",Pituitary:"p-pt","No Tumor":"p-nt"}[l]??"p-gl");

// Shared BorderGlow props tuned to NeuroVision palette
const NV_GLOW = {
  borderRadius: 20,
  backgroundColor: "rgba(13,13,24,0.85)",
  glowColor: "220 80 70",
  colors: ["#4361ee","#7b2ff7","#00d4ff"],
  glowRadius: 28,
  glowIntensity: 0.85,
  coneSpread: 22,
};

// ─── Scroll-reveal blur wrapper ────────────────────────────────────────────
function Reveal({ children, delay = 0 }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if(entry.isIntersecting) setVis(true); },
      { threshold: 0.08 }
    );
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      filter:    vis ? "blur(0px)"     : "blur(10px)",
      opacity:   vis ? 1               : 0,
      transform: vis ? "translateY(0)" : "translateY(24px)",
      transition:`filter 0.8s ${delay}s cubic-bezier(0.22,1,0.36,1), opacity 0.8s ${delay}s ease, transform 0.8s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
      willChange:"filter,opacity,transform",
    }}>
      {children}
    </div>
  );
}

// ─── Logo ──────────────────────────────────────────────────────────────────
function NVLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M2 20 C8 8 32 8 38 20 C32 32 8 32 2 20 Z" stroke="url(#nv1)" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <circle cx="20" cy="20" r="7" stroke="url(#nv2)" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="20" r="2.5" fill="#00d4ff"/>
      <line x1="2" y1="20" x2="7.5" y2="20" stroke="#4361ee" strokeWidth="1" opacity="0.7"/>
      <line x1="32.5" y1="20" x2="38" y2="20" stroke="#4361ee" strokeWidth="1" opacity="0.7"/>
      <defs>
        <linearGradient id="nv1" x1="2" y1="20" x2="38" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4361ee"/><stop offset="1" stopColor="#00d4ff"/>
        </linearGradient>
        <linearGradient id="nv2" x1="13" y1="20" x2="27" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4361ee"/><stop offset="1" stopColor="#00d4ff"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Blob cursor ───────────────────────────────────────────────────────────
function BlobCursor() {
  const blob = useRef(); const dot = useRef();
  useEffect(() => {
    let raf, tx=-100, ty=-100, bx=-100, by=-100;
    const mv = e => { tx=e.clientX; ty=e.clientY; };
    window.addEventListener("mousemove", mv);
    const loop = () => {
      bx+=(tx-bx)*0.09; by+=(ty-by)*0.09;
      if(blob.current) blob.current.style.transform=`translate(${bx-24}px,${by-24}px)`;
      if(dot.current)  dot.current.style.transform=`translate(${tx-3}px,${ty-3}px)`;
      raf=requestAnimationFrame(loop);
    };
    loop();
    return () => { window.removeEventListener("mousemove",mv); cancelAnimationFrame(raf); };
  }, []);
  return (<><div ref={blob} className="blob"/><div ref={dot} className="dot"/></>);
}

// ─── Splash ────────────────────────────────────────────────────────────────
function Splash({ onDone }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const t1=setTimeout(()=>setOut(true),2100);
    const t2=setTimeout(onDone,2650);
    return()=>{ clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"#05050a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,opacity:out?0:1,transition:"opacity 0.55s ease",pointerEvents:out?"none":"all" }}>
      <div style={{ animation:"splashLogo 0.7s cubic-bezier(0.22,1,0.36,1) both" }}><NVLogo size={72}/></div>
      <div style={{ animation:"fadeUp 0.6s 0.35s ease both",opacity:0,fontFamily:"'Outfit',sans-serif",fontSize:28,fontWeight:700,letterSpacing:-1,color:"#e8e8f2" }}>NeuroVision</div>
      <div style={{ animation:"splashLine 0.9s 0.85s ease forwards",width:0,height:1.5,background:"linear-gradient(90deg,#4361ee,#00d4ff)",borderRadius:100 }}/>
      <div style={{ animation:"fadeUp 0.5s 1.5s ease both",opacity:0,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"rgba(107,107,146,0.8)",letterSpacing:"2.5px",textTransform:"uppercase" }}>Explainable AI · Brain Imaging</div>
    </div>
  );
}

// ─── Title ─────────────────────────────────────────────────────────────────
function AnimatedTitle() {
  return (
    <h1 className="hero-title">
      <span className="title-line1">
        {"Revealing what".split("").map((ch,i) => (
          <span key={i} className="letter" style={{ animationDelay:`${0.2+i*0.028}s` }}>
            {ch===" "?"\u00A0":ch}
          </span>
        ))}
      </span>
      <span className="title-line2">scans can't show alone</span>
    </h1>
  );
}

// ─── About page with scroll-reveal blur ────────────────────────────────────
function HistoriesPage() {
  return (
    <div className="hist">
      <Reveal delay={0}>
        <div className="hist-intro">
          <div className="hist-title">About NeuroVision</div>
          <p className="hist-desc">An explainable AI system for brain tumour detection and segmentation, built for UTS 42028 Deep Learning and CNNs. Combines a classification pipeline, semantic segmentation, and Grad-CAM visualisations to make model decisions transparent and interpretable.</p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div>
          <div className="sect-label">Team — NeuroVision Group</div>
          <div className="team-g">
            {[
              { init:"P",  name:"Piya Jolly",            role:"Classification · XAI" },
              { init:"Pa", name:"Patrick Thet Htoo Zaw", role:"Segmentation · Pipeline" },
              { init:"K",  name:"Khoi Huynh",            role:"Data · Evaluation" },
            ].map(m=>(
              <BorderGlow key={m.name} {...NV_GLOW}>
                <div className="hcard-inner">
                  <div className="t-av">{m.init}</div>
                  <div className="t-name">{m.name}</div>
                  <div className="t-role">{m.role}</div>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div>
          <div className="sect-label">Model Architecture</div>
          <div className="arch-g">
            {[
              { icon:"🧠", name:"Tumour Classification", badge:"EfficientNet-B0", detail:"Benchmarked against Custom CNN and ResNet50. Selected by weighted F1 score across 4 tumour classes." },
              { icon:"⬡",  name:"Semantic Segmentation",  badge:"U-Net",           detail:"Trained on Darabi COCO polygon dataset. Fine-tuned with Grad-CAM pseudo-masks for domain adaptation." },
              { icon:"🌡", name:"Explainability",         badge:"Grad-CAM",         detail:"Runs at every inference regardless of confidence, highlighting regions most influential to the prediction." },
            ].map(a=>(
              <BorderGlow key={a.name} {...NV_GLOW}>
                <div className="acard-inner">
                  <span style={{ fontSize:26 }}>{a.icon}</span>
                  <div className="a-name">{a.name}</div>
                  <div className="a-badge">{a.badge}</div>
                  <div className="a-detail">{a.detail}</div>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div>
          <div className="sect-label">Datasets</div>
          <div className="ds-g">
            {[
              { title:"Sartaj Brain Tumour MRI",         tag:"Classification", meta:"4 classes: Glioma · Meningioma · Pituitary · No Tumor\nSource: Kaggle\nTask: Multi-class tumour classification" },
              { title:"Darabi Brain Tumour Segmentation", tag:"Segmentation",   meta:"COCO polygon mask format\nSource: Kaggle\nTask: Semantic segmentation of tumour regions" },
            ].map(d=>(
              <BorderGlow key={d.title} {...NV_GLOW}>
                <div className="acard-inner">
                  <div className="d-title">{d.title}</div>
                  <div className="d-tag">{d.tag}</div>
                  <div className="d-meta" style={{ whiteSpace:"pre-line" }}>{d.meta}</div>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <BorderGlow {...NV_GLOW}>
          <div className="acard-inner">
            <div className="clbl" style={{ marginBottom:8 }}>Subject Details</div>
            <div style={{ fontSize:13,fontFamily:"var(--mono)",color:"var(--mu)",lineHeight:2 }}>
              Subject · UTS 42028 Deep Learning and Convolutional Neural Networks<br/>
              Session · Autumn 2026 · Tutorial Session 1 / 5<br/>
              Lecturer · Dr. Nabin Sharma<br/>
              Assessment · Assignment 3 — Group Project (40%)<br/>
              Due · 25 May 2026
            </div>
          </div>
        </BorderGlow>
      </Reveal>
    </div>
  );
}

// ─── Main app ──────────────────────────────────────────────────────────────
export default function NeuroVisionApp() {
  const [splash, setSplash]   = useState(true);
  const [view, setView]       = useState("home");
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [over, setOver]       = useState(false);
  const [step, setStep]       = useState(0);
  const [results, setResults] = useState(null);
  const [confW, setConfW]     = useState(0);
  const fileRef = useRef();

  const takeFile = useCallback(f => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f); setPreview(URL.createObjectURL(f));
  }, []);

  const process = async () => {
    if (!file) return;
    setView("proc"); setStep(0);
    const iv = setInterval(()=>setStep(s=>Math.min(s+1,STEPS.length-1)), 520);
    try {
      const data = await runInference(file);
      clearInterval(iv); setStep(STEPS.length);
      setResults(data);
      await new Promise(r=>setTimeout(r,350));
      setView("results");
      setTimeout(()=>setConfW(Math.round(data.confidence*100)), 300);
    } catch(e) {
      clearInterval(iv); setView("home");
      alert("Inference failed — check your backend endpoint.");
    }
  };

  const reset = () => { setFile(null); setPreview(null); setResults(null); setConfW(0); setView("home"); };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, zIndex:0 }}>
        <Aurora colorStops={["#4361ee","#7b2ff7","#00d4ff"]} blend={0.5} amplitude={1.0} speed={0.5}/>
      </div>
      <BlobCursor/>
      {splash && <Splash onDone={()=>setSplash(false)}/>}

      <div className="app">
        {/* ── Liquid glass nav — full width ── */}
        <nav className="nav">
          <div className="nav-logo" onClick={reset}>
            <NVLogo size={30}/> NeuroVision
          </div>
          <button
            className={`nav-btn${view==="hist"?" act":""}`}
            onClick={()=>setView(view==="hist"?"home":"hist")}
          >
            {view==="hist" ? "← Back" : "About Project"}
          </button>
        </nav>

        {/* HOME */}
        {view==="home" && (
          <section className="hero">
            <div className="tag">Deep Learning · Brain MRI Analysis · XAI</div>
            <AnimatedTitle/>
            <p className="hero-sub">
              Upload a brain MRI scan. NeuroVision classifies tumour type, segments abnormal regions,
              and explains every prediction with Grad-CAM visualisations.
            </p>
            <div className="upload-card">
              <BorderGlow {...NV_GLOW} borderRadius={20}>
                <div style={{ padding:"8px" }}>
                  <div
                    className={`drop-zone${over?" over":""}${file?" ready":""}`}
                    onClick={()=>fileRef.current?.click()}
                    onDragOver={e=>{e.preventDefault();setOver(true);}}
                    onDragLeave={()=>setOver(false)}
                    onDrop={e=>{e.preventDefault();setOver(false);takeFile(e.dataTransfer.files[0]);}}
                  >
                    {file ? (
                      <>
                        {preview && <img src={preview} alt="preview" style={{ width:72,height:72,objectFit:"cover",borderRadius:10,border:"1px solid rgba(0,201,125,0.35)" }}/>}
                        <span style={{ fontSize:14,fontWeight:500 }}>Ready to analyse</span>
                        <span style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--ok)" }}>✓ {file.name}</span>
                      </>
                    ) : (
                      <>
                        <div className="drop-icon">⬆</div>
                        <p className="drop-lbl"><b>Drag &amp; drop</b> your MRI scan here</p>
                        <p className="drop-hint">PNG · JPG · up to 50 MB</p>
                      </>
                    )}
                  </div>
                  {file && (
                    <div className="file-row">
                      <span style={{ fontSize:18 }}>🗂</span>
                      <span className="file-name">{file.name}</span>
                      <span className="file-sz">{(file.size/1024).toFixed(1)} KB</span>
                      <button className="file-x" onClick={e=>{e.stopPropagation();setFile(null);setPreview(null);}}>✕</button>
                    </div>
                  )}
                  <button className="proc-btn" disabled={!file} onClick={process}>
                    {file && <div className="shimmer-btn"/>}
                    Process Image →
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={e=>takeFile(e.target.files[0])}/>
                </div>
              </BorderGlow>
            </div>
          </section>
        )}

        {/* PROCESSING */}
        {view==="proc" && (
          <div className="processing">
            <div className="pulse-ring"><NVLogo size={44}/></div>
            <p className="proc-lbl">Analysing</p>
            <div className="steps">
              {STEPS.map((s,i)=>(
                <div key={i} className={`step${i<step?" done":i===step?" active":""}`}>
                  <span className="step-dot"/>{i<step?"✓ ":""}{s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {view==="results" && results && (
          <div className="results">
            <div className="res-header">
              <h2 className="res-title">Analysis Results</h2>
              <div className="act-row">
                <button className="btn-p">⬇ Download Report</button>
                <button className="btn-o" onClick={reset}>Run Another Scan</button>
              </div>
            </div>
            <div className="rg">
              {/* Grad-CAM */}
              <BorderGlow {...NV_GLOW}>
                <div className="card-inner">
                  <div className="clbl">Explainability · Grad-CAM</div>
                  <div className="mri">
                    {results.gradcamUrl
                      ? <img src={results.gradcamUrl} alt="Grad-CAM"/>
                      : preview
                        ? <img src={preview} alt="MRI" style={{ filter:"grayscale(0.2)" }}/>
                        : <div className="mri-empty"><span style={{ fontSize:28 }}>🌡</span><span>Grad-CAM overlay</span><span>model output renders here</span></div>
                    }
                    <div className="scan-line"/>
                  </div>
                  <p style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--mu)",lineHeight:1.6 }}>
                    Warm colours indicate regions most influential to the prediction. Grad-CAM runs at every inference.
                  </p>
                </div>
              </BorderGlow>

              {/* Classification */}
              <BorderGlow {...NV_GLOW}>
                <div className="card-inner">
                  <div className="clbl">Tumour Classification</div>
                  <div className="cls-name">
                    {results.label}
                    <span className={`pill ${pillClass(results.label)}`}>{results.label.toLowerCase().replace(" ","")}</span>
                  </div>
                  <div>
                    <div className="conf-hd"><span style={{ color:"var(--mu)" }}>Model confidence</span><span>{confW}%</span></div>
                    <div className="conf-trk"><div className="conf-fill" style={{ width:`${confW}%` }}/></div>
                  </div>
                  <div className="probs">
                    <div className="clbl" style={{ marginBottom:4 }}>All-class probabilities</div>
                    {TUMOR_CLASSES.map(cls=>{
                      const p=results.probabilities?.[cls]??(cls===results.label?results.confidence:(1-results.confidence)/3);
                      const isTgt=cls===results.label;
                      return (
                        <div key={cls} className="prob-row">
                          <span className="prob-lbl" style={{ color:isTgt?"var(--tx)":"var(--mu)" }}>{cls}</span>
                          <div className="prob-trk"><div className="prob-fill" style={{ width:`${(p*100).toFixed(1)}%`,background:isTgt?"linear-gradient(90deg,var(--ac),var(--ac2))":"rgba(255,255,255,0.1)" }}/></div>
                          <span className="prob-val">{(p*100).toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="disc">For educational use only. Not validated for clinical diagnosis or any medical decisions.</div>
                </div>
              </BorderGlow>

              {/* Segmentation */}
              <div className="s2">
                <BorderGlow {...NV_GLOW}>
                  <div className="card-inner">
                    <div className="clbl">Segmentation Output · U-Net</div>
                    <div className="seg-g">
                      {[
                        { label:"Original MRI",   src:preview,            empty:null },
                        { label:"Predicted Mask", src:results.segMaskUrl, empty:"U-Net binary mask\nrenders here" },
                      ].map(s=>(
                        <div key={s.label} className="seg-c">
                          <div className="mri" style={{ borderRadius:12 }}>
                            {s.src
                              ? <img src={s.src} alt={s.label} style={{ filter:s.label==="Original MRI"?"grayscale(0.15)":"none" }}/>
                              : <div className="mri-empty"><span style={{ fontSize:24 }}>⬡</span><span style={{ whiteSpace:"pre-line",textAlign:"center" }}>{s.empty}</span></div>
                            }
                            <div className="scan-line"/>
                          </div>
                          <div className="seg-s">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </BorderGlow>
              </div>
            </div>
          </div>
        )}

        {view==="hist" && <HistoriesPage/>}

        <footer className="footer">
          NeuroVision · UTS 42028 Deep Learning · Autumn 2026 · NeuroVision Group
        </footer>
      </div>
    </>
  );
}
