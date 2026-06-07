import { useState, useEffect, useRef, useCallback } from "react";

const SK="worktodo-v4", SK3="worktodo-v3", REFL_PFX="refl-";
const PALETTE=["#FF7B7B","#FF9A7B","#FFBE76","#F9CA24","#6AB04C","#7BC8FF","#A29BFE","#FD79A8","#55EFC4","#00CEC9","#FDCB6E","#B2BEC3"];
const MOODS=[{e:"😄",l:"최고"},{e:"😊",l:"좋음"},{e:"😐",l:"보통"},{e:"😣",l:"힘듦"},{e:"😩",l:"최악"}];
const PC={1:"#FF7B7B",2:"#FFBE76",3:"#B2BEC3"};
const PL={1:"1순위",2:"2순위",3:"3순위"};
const DAY_KO=["월","화","수","목","금","토","일"];
const DEFAULTS={cats:[
  {id:"c1",name:"🌅 오전 업무",color:"#FF9A7B",order:0},
  {id:"c2",name:"☀️ 오후 업무",color:"#7BC8FF",order:1},
  {id:"c3",name:"📌 기타",color:"#A29BFE",order:2}
]};

function uid(){return `${Date.now()}${Math.random().toString(36).slice(2,6)}`;}
function rgba(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}
function ds(d=new Date()){return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function tmr(){const d=new Date();d.setDate(d.getDate()+1);return ds(d);}
function weekDays(){const t=new Date();const w=t.getDay();const m=new Date(t);m.setDate(t.getDate()-(w===0?6:w-1));return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return d;});}
function rKey(){const d=new Date();return `${REFL_PFX}${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function fmtRK(k){try{const p=k.replace(REFL_PFX,"").split("-");return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"});}catch{return k;}}
function fmtT(iso){try{return new Date(iso).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});}catch{return "";}}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{font-family:'Noto Sans KR',-apple-system,sans-serif;background:#F4F1EB;color:#1A1A1A;height:100%;}
#root{height:100%;}
.app{max-width:430px;margin:0 auto;min-height:100vh;background:#F4F1EB;padding-bottom:96px;}
.hdr{position:sticky;top:0;z-index:30;background:#F4F1EB;border-bottom:1px solid rgba(0,0,0,.05);}
.hdr-top{padding:16px 18px 8px;display:flex;align-items:flex-start;justify-content:space-between;}
.app-name{font-size:21px;font-weight:700;letter-spacing:-.8px;}
.app-name span{color:#FF9A7B;}
.date-lbl{font-size:10px;color:#AAA;margin-top:2px;}
.hdr-btns{display:flex;gap:5px;}
.moon-btn{width:32px;height:32px;border-radius:10px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;background:transparent;transition:background .2s;}
.moon-btn:hover{background:rgba(255,190,118,.15);}
.moon-btn.on{background:rgba(255,190,118,.22);}
.hdr-prog{padding:0 18px 8px;}
.pct-lbl{font-size:10px;font-weight:500;color:#AAA;margin-bottom:4px;}
.pct-lbl b{color:#1A1A1A;}
.prog{height:2px;background:#E5E0D5;border-radius:99px;overflow:hidden;}
.prog-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#FF9A7B,#A29BFE);transition:width .6s cubic-bezier(.34,1.4,.64,1);}

/* Week calendar */
.week-bar{display:flex;gap:2px;padding:4px 14px 8px;}
.day-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 1px;border-radius:11px;cursor:pointer;background:transparent;border:none;transition:background .15s;}
.day-btn:active{transform:scale(.93);}
.day-btn.today{background:rgba(255,154,123,.1);}
.day-btn.sel{background:#1A1A1A;}
.dname{font-size:9px;color:#BBB;font-weight:600;letter-spacing:.3px;}
.dname.wknd{color:#FF9A7B;}
.day-btn.today .dname{color:#FF9A7B;}
.day-btn.sel .dname{color:rgba(255,255,255,.45);}
.day-btn.sel .dname.wknd{color:rgba(255,160,120,.55);}
.dnum{font-size:15px;font-weight:700;color:#1A1A1A;line-height:1;}
.day-btn.today .dnum{color:#FF9A7B;}
.day-btn.sel .dnum{color:#FFF;}
.ddot{width:4px;height:4px;border-radius:50%;background:#FF9A7B;}
.day-btn.sel .ddot{background:rgba(255,255,255,.5);}

.body{padding:6px 0;}

/* Priority bars */
.pri-bar-row{display:flex;align-items:center;gap:8px;padding:8px 14px 4px;}
.pri-pill{font-size:9px;font-weight:700;letter-spacing:.4px;padding:3px 8px;border-radius:99px;white-space:nowrap;flex-shrink:0;}
.pri-div{flex:1;height:1px;}
.empty-sec{padding:6px 14px 8px;font-size:11px;color:#E0E0E0;text-align:center;}

/* Priority badge on task */
.pri-btn{width:15px;height:15px;border-radius:4px;border:1.5px solid;font-size:8px;font-weight:700;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:transform .12s;background:transparent;line-height:1;padding:0;}
.pri-btn:active{transform:scale(.82);}

/* Section */
.sec{margin:8px 16px 6px;}
.sec-hdr{display:flex;align-items:center;padding:10px 14px;border-radius:14px 14px 0 0;gap:9px;}
.sec-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.sec-name{font-size:14px;font-weight:600;color:#1A1A1A;flex:1;word-break:break-all;}
.sec-acts{display:flex;gap:4px;}
.ic{width:28px;height:28px;border:none;border-radius:9px;cursor:pointer;background:rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;font-size:13px;transition:background .15s,transform .12s;}
.ic:hover{background:rgba(255,255,255,.9);}
.ic:active{transform:scale(.93);}
.sec-body{background:#FFF;border-radius:0 0 16px 16px;box-shadow:0 2px 16px rgba(0,0,0,.06);overflow:hidden;}

/* Task row */
.t-row{display:flex;align-items:center;padding:10px 12px;gap:7px;border-bottom:1px solid #F7F7F7;background:#FFF;user-select:none;position:relative;transition:background .15s,opacity .18s;}
.t-row:last-of-type{border-bottom:none;}
.t-row.is-drag{opacity:.3;background:#FAFAFA;}
.t-row.is-over{background:#EDF6FF;border-top:2px solid #7BC8FF;}
.hdl{color:#D5D5D5;font-size:16px;cursor:grab;padding:2px 3px;touch-action:none;flex-shrink:0;line-height:1;}
.hdl:active{cursor:grabbing;color:#AAA;}
.chk{width:19px;height:19px;border-radius:6px;border:2px solid #DDD;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;}
.chk-tick{font-size:10px;color:#FFF;font-weight:700;line-height:1;}
.txt{flex:1;font-size:13px;color:#2A2A2A;line-height:1.45;word-break:break-word;}
.txt.done{text-decoration:line-through;color:#C5C5C5;}
.co-btn{width:22px;height:22px;border:none;background:none;cursor:pointer;color:#DDD;font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;opacity:0;transition:color .15s,opacity .15s;}
.del{width:22px;height:22px;border:none;background:none;cursor:pointer;color:#DDD;font-size:17px;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;opacity:0;transition:color .15s,opacity .15s;line-height:1;}
.t-row:hover .co-btn,.t-row:hover .del{opacity:1;}
.co-btn:hover{color:#7BC8FF;}
.del:hover{color:#FF7B7B;}
@media(hover:none){.co-btn,.del{opacity:.4;}}

/* Carry-over toast */
.co-toast{position:fixed;bottom:86px;left:50%;transform:translateX(-50%);background:#1A1A1A;color:#FFF;font-size:12px;padding:8px 16px;border-radius:20px;z-index:90;animation:fadeToast .3s ease;pointer-events:none;white-space:nowrap;}
@keyframes fadeToast{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

/* Add row */
.add-row{display:flex;align-items:center;padding:9px 14px;gap:9px;border-top:1px dashed #EEE;}
.add-plus{color:#CCC;font-size:17px;flex-shrink:0;line-height:1;}
.add-inp{flex:1;border:none;outline:none;font-size:13px;color:#333;background:transparent;font-family:'Noto Sans KR',sans-serif;}
.add-inp::placeholder{color:#CCC;}
.add-go{width:25px;height:25px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#FFF;flex-shrink:0;}

/* Reflection */
.refl-wrap{margin:8px 16px 6px;border-radius:20px;background:#1C1830;overflow:hidden;animation:rSlide .35s cubic-bezier(.34,1.2,.64,1);}
@keyframes rSlide{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}}
.refl-inner{padding:16px;}
.refl-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
.refl-title-col{display:flex;flex-direction:column;gap:2px;}
.refl-eye{font-size:9px;color:rgba(255,255,255,.3);letter-spacing:.8px;text-transform:uppercase;}
.refl-title{font-size:15px;font-weight:700;color:#FFF;}
.refl-x{width:25px;height:25px;border:none;background:rgba(255,255,255,.08);border-radius:7px;cursor:pointer;color:rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:15px;}
.refl-stats{display:flex;align-items:center;gap:16px;margin-bottom:14px;}
.ring-wrap{position:relative;width:62px;height:62px;flex-shrink:0;}
.ring-labels{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;}
.ring-pct{font-size:15px;font-weight:700;color:#FFBE76;line-height:1;}
.ring-sub{font-size:9px;color:rgba(255,255,255,.3);margin-top:1px;}
.stat-nums{display:flex;gap:14px;}
.stat-item{display:flex;flex-direction:column;gap:2px;}
.stat-n{font-size:20px;font-weight:700;color:#FFF;line-height:1;}
.stat-n.amber{color:#FFBE76;}
.stat-l{font-size:9px;color:rgba(255,255,255,.3);}
.saved-badge{display:flex;align-items:center;gap:8px;background:rgba(255,190,118,.1);border-radius:9px;padding:8px 11px;margin-bottom:10px;}
.saved-chk{width:16px;height:16px;border-radius:50%;background:#FFBE76;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#1C1830;flex-shrink:0;}
.saved-info{flex:1;font-size:11px;color:rgba(255,190,118,.8);}
.edit-btn{font-size:11px;color:rgba(255,255,255,.3);background:none;border:none;cursor:pointer;padding:0;}
.saved-mood{font-size:26px;text-align:center;margin-bottom:8px;}
.saved-memo{font-size:13px;color:rgba(255,255,255,.5);line-height:1.55;background:rgba(255,255,255,.05);border-radius:9px;padding:10px 12px;white-space:pre-wrap;word-break:break-word;}
.no-memo{font-size:11px;color:rgba(255,255,255,.18);font-style:italic;}
.mood-lbl{font-size:10px;color:rgba(255,255,255,.35);margin-bottom:8px;letter-spacing:.3px;}
.mood-row{display:flex;gap:5px;margin-bottom:11px;}
.mood-btn{flex:1;padding:7px 1px;border-radius:9px;border:1.5px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .15s;}
.mood-btn.sel{background:rgba(255,190,118,.16);border-color:rgba(255,190,118,.5);}
.mood-e{font-size:18px;line-height:1;}
.mood-l{font-size:9px;color:rgba(255,255,255,.25);}
.mood-btn.sel .mood-l{color:rgba(255,190,118,.7);}
.refl-ta{width:100%;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;font-size:13px;font-family:'Noto Sans KR',sans-serif;color:#FFF;resize:none;outline:none;min-height:68px;line-height:1.55;margin-bottom:10px;}
.refl-ta::placeholder{color:rgba(255,255,255,.17);}
.refl-ta:focus{border-color:rgba(255,190,118,.4);}
.refl-acts{display:flex;align-items:center;gap:8px;}
.refl-save{flex:1;padding:11px;border:none;border-radius:10px;background:#FFBE76;color:#1C1830;font-size:13px;font-weight:700;font-family:'Noto Sans KR',sans-serif;cursor:pointer;}
.refl-hist-lnk{font-size:11px;color:rgba(255,255,255,.25);background:none;border:none;cursor:pointer;padding:0 2px;text-decoration:underline;text-underline-offset:2px;white-space:nowrap;}

/* History */
.hist-ovl{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
.hist-sheet{background:#1C1830;border-radius:24px 24px 0 0;padding:20px 18px 48px;width:100%;max-width:430px;max-height:78vh;overflow-y:auto;animation:slideUp .28s cubic-bezier(.34,1.2,.64,1);}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
.hist-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.hist-ttl{font-size:16px;font-weight:700;color:#FFF;}
.hist-close{width:26px;height:26px;border:none;background:rgba(255,255,255,.08);border-radius:8px;cursor:pointer;color:rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:16px;}
.hist-empty{text-align:center;padding:32px 0;color:rgba(255,255,255,.22);font-size:13px;line-height:1.8;}
.hist-entry{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06);}
.hist-entry:last-child{border-bottom:none;}
.hist-ehdr{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
.hist-date{font-size:11px;color:rgba(255,255,255,.35);flex:1;}
.hist-emood{font-size:18px;}
.hist-epct{font-size:12px;color:#FFBE76;font-weight:500;}
.hist-ememo{font-size:12px;color:rgba(255,255,255,.5);line-height:1.5;white-space:pre-wrap;word-break:break-word;}
.hist-enomemo{font-size:11px;color:rgba(255,255,255,.18);font-style:italic;}

/* Category modal */
.empty-app{text-align:center;padding:64px 24px;color:#CCC;font-size:13px;}
.empty-app .em{font-size:40px;margin-bottom:14px;}
.fab{position:fixed;bottom:26px;left:50%;transform:translateX(50px);width:50px;height:50px;border-radius:15px;border:none;background:#1A1A1A;color:#FFF;font-size:24px;font-weight:300;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.2);transition:transform .2s,box-shadow .2s;z-index:40;display:flex;align-items:center;justify-content:center;}
.fab:hover{transform:translateX(50px) translateY(-3px);}
.fab:active{transform:translateX(50px) scale(.95);}
.ovl{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;display:flex;align-items:flex-end;justify-content:center;}
.modal{background:#FFF;border-radius:24px 24px 0 0;padding:24px 22px 48px;width:100%;max-width:430px;animation:slideUp .28s cubic-bezier(.34,1.2,.64,1);}
.modal-ttl{font-size:17px;font-weight:700;color:#1A1A1A;margin-bottom:18px;}
.modal-lbl{font-size:10px;font-weight:600;color:#AAA;text-transform:uppercase;letter-spacing:.6px;margin-bottom:7px;}
.modal-inp{width:100%;border:1.5px solid #EEE;border-radius:11px;padding:12px 15px;font-size:15px;font-family:'Noto Sans KR',sans-serif;outline:none;color:#1A1A1A;margin-bottom:16px;}
.modal-inp:focus{border-color:#7BC8FF;}
.clr-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin-bottom:22px;}
.clr-dot{width:35px;height:35px;border-radius:50%;cursor:pointer;transition:transform .15s;border:3px solid transparent;}
.clr-dot.sel{border-color:#1A1A1A;transform:scale(1.1);}
.modal-acts{display:flex;gap:10px;}
.btn-cancel{flex:1;padding:13px;border:1.5px solid #EEE;border-radius:11px;background:#FFF;cursor:pointer;font-size:14px;font-family:'Noto Sans KR',sans-serif;color:#888;}
.btn-save{flex:2;padding:13px;border:none;border-radius:11px;cursor:pointer;font-size:14px;font-family:'Noto Sans KR',sans-serif;color:#FFF;font-weight:600;}
`;

// ─── Ring SVG ──────────────────────────────────────────────
function Ring({pct,size=62,sw=6}){
  const r=(size-sw)/2,c=2*Math.PI*r,f=(Math.min(pct,100)/100)*c;
  return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:"rotate(-90deg)",display:"block"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={sw}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#FFBE76" strokeWidth={sw}
      strokeDasharray={`${f} ${c}`} strokeLinecap="round"
      style={{transition:"stroke-dasharray .8s cubic-bezier(.34,1.4,.64,1)"}}/>
  </svg>);
}

// ─── Week Calendar ─────────────────────────────────────────
function WeekCalendar({selDate,onSel,tasks}){
  const days=weekDays(), today=ds();
  return(
    <div className="week-bar">
      {days.map((d,i)=>{
        const dStr=ds(d),isSel=dStr===selDate,isToday=dStr===today,isWknd=i>=5;
        const pending=tasks.filter(t=>t.date===dStr&&!t.done).length;
        return(<button key={dStr}
          className={`day-btn${isSel?" sel":""}${isToday&&!isSel?" today":""}`}
          onClick={()=>onSel(dStr)}>
          <span className={`dname${isWknd?" wknd":""}`}>{DAY_KO[i]}</span>
          <span className="dnum">{d.getDate()}</span>
          {pending>0&&<span className="ddot"/>}
        </button>);
      })}
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────
function Section({cat,tasks,dragId,hoverId,onDragStart,onToggle,onDel,onAdd,onEdit,onDelCat,onCarryover,onChangePri}){
  const [val,setVal]=useState("");
  const submit=()=>{if(val.trim()){onAdd(cat.id,val);setVal("");}};
  return(
    <div className="sec">
      <div className="sec-hdr" style={{background:rgba(cat.color,.12)}}>
        <div className="sec-dot" style={{background:cat.color}}/>
        <span className="sec-name">{cat.name}</span>
        <div className="sec-acts">
          <button className="ic" onClick={onEdit}>✏️</button>
          <button className="ic" onClick={()=>{if(window.confirm(`'${cat.name}' 삭제?`))onDelCat();}}>🗑️</button>
        </div>
      </div>
      <div className="sec-body">
        {[1,2,3].map(p=>{
          const pt=tasks.filter(t=>t.priority===p);
          return(<div key={p}>
            <div className="pri-bar-row">
              <span className="pri-pill" style={{background:rgba(PC[p],.12),color:PC[p]}}>{PL[p]}</span>
              <div className="pri-div" style={{background:rgba(PC[p],.15)}}/>
            </div>
            {pt.map(t=>(
              <TaskRow key={t.id} task={t} catId={cat.id} catColor={cat.color}
                isDrag={dragId===t.id} isOver={hoverId===t.id&&dragId!==t.id}
                onDragStart={onDragStart} onToggle={onToggle} onDel={onDel}
                onCarryover={onCarryover} onChangePri={onChangePri}/>
            ))}
            {p===1&&pt.length===0&&<div className="empty-sec">할 일을 추가해보세요 ↓</div>}
          </div>);
        })}
        <div className="add-row">
          <span className="add-plus">+</span>
          <input className="add-inp" placeholder="1순위에 할 일 추가..." value={val}
            onChange={e=>setVal(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}/>
          {val.trim()&&<button className="add-go" style={{background:cat.color}} onClick={submit}>↵</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Task Row ──────────────────────────────────────────────
function TaskRow({task,catId,catColor,isDrag,isOver,onDragStart,onToggle,onDel,onCarryover,onChangePri}){
  const pc=PC[task.priority]||"#B2BEC3";
  return(
    <div className={`t-row${isDrag?" is-drag":""}${isOver?" is-over":""}`}
      data-tid={task.id} data-cid={catId} data-pri={task.priority}>
      <div className="hdl"
        onMouseDown={e=>onDragStart(task.id,catId,task.priority,e)}
        onTouchStart={e=>onDragStart(task.id,catId,task.priority,e)}>⠿</div>
      <button className="pri-btn" style={{borderColor:pc+"90",color:pc}}
        onClick={()=>onChangePri(task.id)} title="우선순위 변경">
        {task.priority}
      </button>
      <div className={`chk${task.done?" done":""}`}
        style={task.done?{background:catColor,borderColor:catColor}:{}}
        onClick={()=>onToggle(task.id)}>
        {task.done&&<span className="chk-tick">✓</span>}
      </div>
      <span className={`txt${task.done?" done":""}`}>{task.text}</span>
      <button className="co-btn" onClick={()=>onCarryover(task.id)} title="내일로 이월">↪</button>
      <button className="del" onClick={()=>onDel(task.id)}>×</button>
    </div>
  );
}

// ─── Reflection Card ───────────────────────────────────────
function ReflCard({done,total,pct,onDismiss,onHistory}){
  const [memo,setMemo]=useState(""),[mood,setMood]=useState(null);
  const [saved,setSaved]=useState(null),[editing,setEditing]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const k=rKey();
  useEffect(()=>{(async()=>{try{const r=await window.storage.get(k);if(r){const d=JSON.parse(r.value);setSaved(d);setMemo(d.memo||"");setMood(d.mood||null);}}catch{}setLoaded(true);})();},[k]);
  const save=async()=>{const d={memo,mood,savedAt:new Date().toISOString(),done,total,pct};try{await window.storage.set(k,JSON.stringify(d));setSaved(d);setEditing(false);}catch(e){console.error(e);}};
  if(!loaded)return null;
  const showForm=!saved||editing;
  return(
    <div className="refl-wrap"><div className="refl-inner">
      <div className="refl-top">
        <div className="refl-title-col">
          <span className="refl-eye">하루 마감 회고</span>
          <span className="refl-title">🌙 오늘 어땠나요?</span>
        </div>
        <button className="refl-x" onClick={onDismiss}>×</button>
      </div>
      <div className="refl-stats">
        <div className="ring-wrap">
          <Ring pct={pct}/>
          <div className="ring-labels"><span className="ring-pct">{pct}%</span><span className="ring-sub">완료</span></div>
        </div>
        <div className="stat-nums">
          <div className="stat-item"><span className="stat-n amber">{done}</span><span className="stat-l">완료</span></div>
          <div className="stat-item"><span className="stat-n">{total-done}</span><span className="stat-l">미완료</span></div>
          <div className="stat-item"><span className="stat-n">{total}</span><span className="stat-l">전체</span></div>
        </div>
      </div>
      {saved&&!editing&&(<>
        <div className="saved-badge">
          <div className="saved-chk">✓</div>
          <span className="saved-info">저장됨 · {fmtT(saved.savedAt)}</span>
          <button className="edit-btn" onClick={()=>setEditing(true)}>수정</button>
        </div>
        {saved.mood&&<div className="saved-mood">{saved.mood}</div>}
        {saved.memo?<div className="saved-memo">{saved.memo}</div>:<div className="no-memo">메모 없음</div>}
        <div style={{marginTop:10,textAlign:"right"}}>
          <button className="refl-hist-lnk" onClick={onHistory}>지난 회고 보기 ↗</button>
        </div>
      </>)}
      {showForm&&(<>
        <div className="mood-lbl">오늘 기분은 어땠나요?</div>
        <div className="mood-row">
          {MOODS.map(m=>(
            <button key={m.e} className={`mood-btn${mood===m.e?" sel":""}`} onClick={()=>setMood(m.e===mood?null:m.e)}>
              <span className="mood-e">{m.e}</span><span className="mood-l">{m.l}</span>
            </button>
          ))}
        </div>
        <textarea className="refl-ta" placeholder="잘 된 것, 아쉬운 것, 내일 챙길 것..."
          value={memo} onChange={e=>setMemo(e.target.value)} rows={3}/>
        <div className="refl-acts">
          <button className="refl-save" onClick={save}>저장하기</button>
          <button className="refl-hist-lnk" onClick={onHistory}>지난 회고 ↗</button>
        </div>
      </>)}
    </div></div>
  );
}

// ─── History Modal ─────────────────────────────────────────
function HistModal({onClose}){
  const [entries,setEntries]=useState([]),[loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{const res=await window.storage.list(REFL_PFX);if(res?.keys?.length){const today=rKey();const sorted=res.keys.filter(k=>k!==today).sort((a,b)=>b.localeCompare(a)).slice(0,30);const loaded=await Promise.all(sorted.map(async k=>{try{const r=await window.storage.get(k);return r?{key:k,...JSON.parse(r.value)}:null;}catch{return null;}}));setEntries(loaded.filter(Boolean));}}catch{}setLoading(false);})();},[]);
  return(
    <div className="hist-ovl" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="hist-sheet">
        <div className="hist-hdr"><span className="hist-ttl">📖 지난 회고</span><button className="hist-close" onClick={onClose}>×</button></div>
        {loading&&<div className="hist-empty">불러오는 중...</div>}
        {!loading&&entries.length===0&&<div className="hist-empty">아직 저장된 회고가 없어요<br/>오늘부터 쌓아보세요 🌙</div>}
        {entries.map(e=>(
          <div key={e.key} className="hist-entry">
            <div className="hist-ehdr">
              <span className="hist-date">{fmtRK(e.key)}</span>
              {e.mood&&<span className="hist-emood">{e.mood}</span>}
              <span className="hist-epct">{typeof e.pct==="number"?e.pct:Math.round(((e.done||0)/(e.total||1))*100)}%</span>
            </div>
            {e.memo?<div className="hist-ememo">{e.memo}</div>:<div className="hist-enomemo">메모 없음</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Modal ────────────────────────────────────────
function CatModal({mode,cat,onSave,onClose}){
  const [name,setName]=useState(cat?.name||""),[color,setColor]=useState(cat?.color||PALETTE[0]);
  const go=()=>name.trim()&&onSave(name.trim(),color);
  return(
    <div className="ovl" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-ttl">{mode==="add"?"새 카테고리 추가":"카테고리 편집"}</div>
        <div className="modal-lbl">이름</div>
        <input className="modal-inp" placeholder="예: 오전 업무, 회의..." value={name}
          onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} autoFocus/>
        <div className="modal-lbl">색상</div>
        <div className="clr-grid">
          {PALETTE.map(c=>(<div key={c} className={`clr-dot${color===c?" sel":""}`} style={{background:c}} onClick={()=>setColor(c)}/>))}
        </div>
        <div className="modal-acts">
          <button className="btn-cancel" onClick={onClose}>취소</button>
          <button className="btn-save" style={{background:color}} onClick={go}>{mode==="add"?"추가하기":"저장하기"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────
export default function App(){
  const [cats,setCats]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [ready,setReady]=useState(false);
  const [selDate,setSelDate]=useState(()=>ds());
  const [dragId,setDragId]=useState(null);
  const [hoverId,setHoverId]=useState(null);
  const [modal,setModal]=useState(null);
  const [showRefl,setShowRefl]=useState(()=>new Date().getHours()>=18);
  const [showHist,setShowHist]=useState(false);
  const [toast,setToast]=useState(null);
  const dragRef=useRef(null);
  const toastRef=useRef(null);

  // Load (try v4, fallback to v3)
  useEffect(()=>{(async()=>{
    const today=ds();
    try{
      let r=await window.storage.get(SK).catch(()=>null);
      if(!r) r=await window.storage.get(SK3).catch(()=>null);
      if(r){
        const d=JSON.parse(r.value);
        setCats(d.cats||DEFAULTS.cats);
        setTasks((d.tasks||[]).map(t=>({...t,date:t.date||today,priority:t.priority||1})));
      } else {
        setCats(DEFAULTS.cats);
        setTasks([
          {id:"t1",catId:"c1",text:"이메일 및 슬랙 확인",done:false,order:0,date:today,priority:1},
          {id:"t2",catId:"c1",text:"팀 데일리 스탠드업",done:false,order:1,date:today,priority:1},
          {id:"t3",catId:"c2",text:"온보딩 자료 학습",done:false,order:0,date:today,priority:1},
          {id:"t4",catId:"c2",text:"보고서 초안 작성",done:false,order:1,date:today,priority:2},
        ]);
      }
    } catch {
      setCats(DEFAULTS.cats); setTasks([]);
    }
    setReady(true);
  })();},[]);

  useEffect(()=>{if(!ready)return;window.storage.set(SK,JSON.stringify({cats,tasks})).catch(()=>{});},[cats,tasks,ready]);

  const showToast=useCallback((msg)=>{
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(null),2000);
  },[]);

  // Drag (priority-aware)
  const startDrag=useCallback((taskId,catId,priority,e)=>{
    if(e.button!=null&&e.button!==0)return;
    e.preventDefault();
    setDragId(taskId);
    dragRef.current={taskId,catId,priority,overId:null};
    const getY=ev=>ev.changedTouches?ev.changedTouches[0].clientY:ev.clientY;
    const onMove=ev=>{
      if(ev.cancelable)ev.preventDefault();
      const y=getY(ev);
      let best=null,bestD=Infinity;
      document.querySelectorAll(`[data-tid][data-cid="${catId}"][data-pri="${priority}"]`).forEach(el=>{
        const r=el.getBoundingClientRect();
        const d=Math.abs(y-(r.top+r.height/2));
        if(d<bestD){bestD=d;best=el.dataset.tid;}
      });
      if(best!==dragRef.current?.overId){if(dragRef.current)dragRef.current.overId=best;setHoverId(best);}
    };
    const onEnd=()=>{
      const ref=dragRef.current;
      if(ref?.overId&&ref.overId!==ref.taskId){
        setTasks(prev=>{
          const from=prev.find(t=>t.id===ref.taskId);
          const to=prev.find(t=>t.id===ref.overId);
          if(!from||!to||from.catId!==to.catId||from.priority!==to.priority||from.date!==to.date)return prev;
          const arr=prev.filter(t=>t.catId===from.catId&&t.priority===from.priority&&t.date===from.date).sort((a,b)=>a.order-b.order);
          const fi=arr.findIndex(t=>t.id===from.id),ti=arr.findIndex(t=>t.id===to.id);
          const copy=[...arr];copy.splice(fi,1);copy.splice(ti,0,from);
          return [...prev.filter(t=>!(t.catId===from.catId&&t.priority===from.priority&&t.date===from.date)),...copy.map((t,i)=>({...t,order:i}))];
        });
      }
      dragRef.current=null;setDragId(null);setHoverId(null);
      document.removeEventListener("touchmove",onMove);document.removeEventListener("touchend",onEnd);
      document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onEnd);
    };
    document.addEventListener("touchmove",onMove,{passive:false});document.addEventListener("touchend",onEnd);
    document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onEnd);
  },[]);

  const saveModal=(name,color)=>{
    if(modal.mode==="add")setCats(p=>[...p,{id:uid(),name,color,order:p.length}]);
    else setCats(p=>p.map(c=>c.id===modal.cat.id?{...c,name,color}:c));
    setModal(null);
  };
  const delCat=id=>{setCats(p=>p.filter(c=>c.id!==id));setTasks(p=>p.filter(t=>t.catId!==id));};
  const addTask=(catId,text)=>{
    if(!text.trim())return;
    const n=tasks.filter(t=>t.catId===catId&&t.priority===1&&t.date===selDate).length;
    setTasks(p=>[...p,{id:uid(),catId,text:text.trim(),done:false,order:n,date:selDate,priority:1}]);
  };
  const toggle=id=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const delTask=id=>setTasks(p=>p.filter(t=>t.id!==id));
  const carryover=id=>{
    setTasks(p=>p.map(t=>t.id===id?{...t,date:tmr(),done:false}:t));
    showToast("내일로 이월했어요 ↪");
  };
  const changePri=id=>{
    setTasks(p=>p.map(t=>{
      if(t.id!==id)return t;
      const np=t.priority===3?1:t.priority+1;
      const inGrp=p.filter(x=>x.catId===t.catId&&x.priority===np&&x.date===t.date);
      return{...t,priority:np,order:inGrp.length};
    }));
  };

  const todayStr=ds();
  const isToday=selDate===todayStr;
  const dayTasks=tasks.filter(t=>t.date===selDate);
  const done=dayTasks.filter(t=>t.done).length;
  const total=dayTasks.length;
  const pct=total?Math.round((done/total)*100):0;
  const sortedCats=[...cats].sort((a,b)=>a.order-b.order);
  const selDayLabel=new Date(selDate.replace(/(\d+)-(\d+)-(\d+)/,'$1/$2/$3')).toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"});

  if(!ready)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"sans-serif",color:"#AAA",fontSize:14}}>불러오는 중...</div>);

  return(<>
    <style>{CSS}</style>
    <div className="app">
      <div className="hdr">
        <div className="hdr-top">
          <div>
            <div className="app-name">오늘의<span> 할 일</span></div>
            <div className="date-lbl">{isToday?"오늘 · "+selDayLabel:selDayLabel}</div>
          </div>
          <div className="hdr-btns">
            <button className={`moon-btn${showRefl?" on":""}`} onClick={()=>setShowRefl(p=>!p)} title="하루 회고">🌙</button>
          </div>
        </div>
        <div className="hdr-prog">
          <div className="pct-lbl"><b>{done}</b>/{total} 완료 · <b>{pct}%</b></div>
          <div className="prog"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
        </div>
        <WeekCalendar selDate={selDate} onSel={setSelDate} tasks={tasks}/>
      </div>

      <div className="body">
        {showRefl&&isToday&&(
          <ReflCard done={done} total={total} pct={pct}
            onDismiss={()=>setShowRefl(false)}
            onHistory={()=>setShowHist(true)}/>
        )}
        {sortedCats.map(cat=>{
          const catTasks=dayTasks.filter(t=>t.catId===cat.id).sort((a,b)=>a.order-b.order);
          return(<Section key={cat.id} cat={cat} tasks={catTasks}
            dragId={dragId} hoverId={hoverId}
            onDragStart={startDrag} onToggle={toggle} onDel={delTask} onAdd={addTask}
            onEdit={()=>setModal({mode:"edit",cat})}
            onDelCat={()=>delCat(cat.id)}
            onCarryover={carryover} onChangePri={changePri}/>);
        })}
        {cats.length===0&&<div className="empty-app"><div className="em">📋</div><div>아래 + 버튼으로 카테고리를 추가해보세요</div></div>}
      </div>

      <button className="fab" onClick={()=>setModal({mode:"add"})}>+</button>
      {modal&&<CatModal mode={modal.mode} cat={modal.cat} onSave={saveModal} onClose={()=>setModal(null)}/>}
      {showHist&&<HistModal onClose={()=>setShowHist(false)}/>}
      {toast&&<div className="co-toast">{toast}</div>}
    </div>
  </>);
}
