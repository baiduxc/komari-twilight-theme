import { useEffect, useMemo, useRef, useState } from "react";
import { Aperture, ChevronRight, Clock3, Cpu, Crosshair, Gauge, MemoryStick, RotateCcw, Search, Server, Wifi, ArrowDown, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLiveData } from "@/contexts/LiveDataContext";
import { useNodeList, type NodeBasicInfo } from "@/contexts/NodeListContext";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import type { Record as LiveRecord } from "@/types/LiveData";
import "./Twilight.css";

const IMAGE_WIDTH = 1536;
const IMAGE_HEIGHT = 1024;
const STORAGE_KEY = "komari.twilight-node-positions.v1";

type Point = { x: number; y: number };
type MapNode = NodeBasicInfo & Point;
type LocationGroup = { key: string; x: number; y: number; label: string; nodes: MapNode[] };

// Coordinates are percentages of the source artwork, never viewport pixels.
const FACTORY_POSITIONS = [
  { words: ["frankfurt", "法兰克福", "fra", "de"], x: 3.5, y: 31 },
  { words: ["beijing", "北京", "pek"], x: 36.5, y: 39 },
  { words: ["shanghai", "上海", "sha"], x: 38.5, y: 45 },
  { words: ["tokyo", "东京", "東京", "tyo"], x: 44.5, y: 42 },
  { words: ["mumbai", "孟买", "孟買", "bom"], x: 18, y: 52 },
  { words: ["bangkok", "曼谷", "bkk"], x: 27.5, y: 57 },
  { words: ["singapore", "新加坡", "sin", " sg"], x: 30.2, y: 64 },
  { words: ["jakarta", "雅加达", "雅加達", "jkt"], x: 30, y: 70 },
  { words: ["sydney", "悉尼", "syd"], x: 51, y: 84 },
  { words: ["los angeles", "洛杉矶", "洛杉磯", "lax"], x: 79, y: 39 },
  { words: ["new york", "纽约", "紐約", "nyc"], x: 86, y: 35 },
  { words: ["são paulo", "sao paulo", "圣保罗", "聖保羅", "gru"], x: 90, y: 68 },
];
const FALLBACKS: Point[] = [{x:20,y:42},{x:25,y:51},{x:33,y:48},{x:41,y:55},{x:49,y:62},{x:58,y:47},{x:68,y:55},{x:76,y:63},{x:84,y:50}];

const demoBase = (uuid: string, name: string, region: string, group = "") => ({
  uuid, name, region, group, cpu_name: "AMD EPYC", virtualization: "KVM", arch: "amd64", cpu_cores: 4,
  os: "Linux", kernel_version: "6.8", gpu_name: "", mem_total: 8 * 1024 ** 3, swap_total: 0,
  disk_total: 120 * 1024 ** 3, version: "1.0", weight: 0, price: 0, tags: "", billing_cycle: 0,
  currency: "", traffic_limit: 0, traffic_limit_type: undefined, expired_at: "", created_at: "", updated_at: "",
}) satisfies NodeBasicInfo;
const DEMO_NODES = [
  demoBase("demo-sin", "新加坡-Edge", "Singapore, SG", "Asia"), demoBase("demo-tokyo", "东京", "Tokyo, JP", "Asia"),
  demoBase("demo-sin-2", "新加坡-Core", "Singapore, SG", "Asia"),
  demoBase("demo-shanghai", "上海", "Shanghai, CN", "Asia"), demoBase("demo-fra", "法兰克福", "Frankfurt, DE", "Europe"),
  demoBase("demo-la", "洛杉矶", "Los Angeles, US", "America"), demoBase("demo-syd", "悉尼", "Sydney, AU", "Oceania"),
];

function hashIndex(value: string, length: number) { let hash = 0; for (const c of value) hash = (hash * 31 + c.charCodeAt(0)) >>> 0; return hash % length; }
function factoryPoint(node: NodeBasicInfo): Point {
  const haystack = ` ${node.name} ${node.region} ${node.group} ${node.tags}`.toLowerCase();
  const match = FACTORY_POSITIONS.find((item) => item.words.some((word) => haystack.includes(word)));
  return match ? { x: match.x, y: match.y } : FALLBACKS[hashIndex(node.uuid, FALLBACKS.length)];
}
function formatBytes(bytes = 0, suffix = "") { if (!bytes) return `0 B${suffix}`; const units=["B","KB","MB","GB","TB"]; const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),4); return `${(bytes/1024**i).toFixed(i > 1 ? 1 : 0)} ${units[i]}${suffix}`; }
function uptime(seconds = 0) { const days=Math.floor(seconds/86400); const hours=Math.floor((seconds%86400)/3600); return `${days}天 ${hours}小时`; }

function NetworkCanvas({ nodes, selectedId }: { nodes: MapNode[]; selectedId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas=ref.current; const area=canvas?.parentElement; if (!canvas || !area || !nodes.length) return;
    const draw=()=>{ const ratio=window.devicePixelRatio||1,w=area.clientWidth,h=area.clientHeight; canvas.width=w*ratio;canvas.height=h*ratio;canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;const ctx=canvas.getContext("2d");if(!ctx)return;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);const hub=nodes.find(n=>n.uuid===selectedId)||nodes[0];nodes.filter(n=>n.uuid!==hub.uuid).forEach(n=>{const sx=hub.x*w/100,sy=hub.y*h/100,ex=n.x*w/100,ey=n.y*h/100;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+ex)/2,Math.min(sy,ey)-Math.min(100,Math.abs(ex-sx)*.16+20),ex,ey);const g=ctx.createLinearGradient(sx,sy,ex,ey);g.addColorStop(0,"rgba(244,171,78,.55)");g.addColorStop(1,"rgba(91,204,255,.3)");ctx.strokeStyle=g;ctx.stroke();});};
    draw(); const observer=new ResizeObserver(draw);observer.observe(area);return()=>observer.disconnect();
  },[nodes,selectedId]);
  return <canvas ref={ref} className="tw-network" aria-hidden="true" />;
}

export default function Index() {
  const navigate=useNavigate(); const { nodeList,isLoading,error,refresh }=useNodeList(); const { live_data }=useLiveData(); const { publicInfo }=usePublicInfo();
  const stageRef=useRef<HTMLElement>(null); const planeRef=useRef<HTMLDivElement>(null); const dragRef=useRef<string[]|null>(null);
  const [query,setQuery]=useState(""); const [selectedId,setSelectedId]=useState(""); const [openGroupKey,setOpenGroupKey]=useState(""); const [calibrating,setCalibrating]=useState(false); const [notice,setNotice]=useState("");
  const [plane,setPlane]=useState({width:IMAGE_WIDTH,height:IMAGE_HEIGHT,left:0,top:0});
  const [saved,setSaved]=useState<Record<string,Point>>(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch{return {}}});
  const nodes=(nodeList?.length ? nodeList : import.meta.env.DEV ? DEMO_NODES : []);
  const mapNodes=useMemo(()=>nodes.map(n=>({...n,...factoryPoint(n),...(saved[n.uuid]||{})})),[nodes,saved]);
  const groups=useMemo(()=>{const grouped=new Map<string,LocationGroup>();mapNodes.forEach(node=>{const key=`${node.x.toFixed(2)}:${node.y.toFixed(2)}`;const current=grouped.get(key);if(current)current.nodes.push(node);else grouped.set(key,{key,x:node.x,y:node.y,label:node.region||node.group||node.name,nodes:[node]})});return [...grouped.values()]},[mapNodes]);
  const selected=mapNodes.find(n=>n.uuid===selectedId); const live=live_data?.data; const online=new Set(live?.online||[]);
  const isDemo=selected?.uuid.startsWith("demo-"); const record: LiveRecord|undefined=selected ? live?.data?.[selected.uuid] : undefined;
  const filteredGroups=groups.filter(group=>group.nodes.some(n=>`${n.name} ${n.region} ${n.group}`.toLowerCase().includes(query.toLowerCase())));
  const openGroup=groups.find(group=>group.key===openGroupKey);
  useEffect(()=>{const id=window.setInterval(refresh,5000);return()=>window.clearInterval(id)},[refresh]);
  useEffect(()=>{const stage=stageRef.current;if(!stage)return;const measure=()=>{const w=stage.clientWidth,h=stage.clientHeight,s=Math.max(w/IMAGE_WIDTH,h/IMAGE_HEIGHT),rw=IMAGE_WIDTH*s,rh=IMAGE_HEIGHT*s;setPlane({width:rw,height:rh,left:(w-rw)/2,top:(h-rh)/2})};measure();const observer=new ResizeObserver(measure);observer.observe(stage);return()=>observer.disconnect()},[]);
  const move=(e:React.PointerEvent)=>{if(!calibrating||!dragRef.current||!planeRef.current)return;const r=planeRef.current.getBoundingClientRect();const p={x:Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)),y:Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))};setSaved(current=>{const next={...current};dragRef.current!.forEach(id=>next[id]=p);return next})};
  const finishDrag=(e:React.PointerEvent)=>{if(!dragRef.current)return;e.currentTarget.releasePointerCapture?.(e.pointerId);setSaved(current=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(current));return current});setNotice("该地点的节点位置已保存");dragRef.current=null};
  const onlineCount=mapNodes.filter(node=>node.uuid.startsWith("demo-")||online.has(node.uuid)).length; const background=publicInfo?.theme_settings?.backgroundImageUrl||"/twilight-earth.png";
  return <main className="tw-shell">
    <header className="tw-topbar"><div className="tw-brand"><Aperture/><span>{publicInfo?.sitename||"Komari"}</span></div><nav><button className="active">总览</button><button onClick={()=>navigate("/admin")}>管理</button></nav><label className="tw-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索节点或地区"/><span>{mapNodes.length}</span></label></header>
    <section className={`tw-stage ${calibrating?"calibrating":""}`} ref={stageRef}>
      <div className="tw-plane" ref={planeRef} style={{width:plane.width,height:plane.height,left:plane.left,top:plane.top}}><img src={background} alt="暮色下的全球节点网络"/><div className="tw-tint"/><NetworkCanvas nodes={groups.map(group=>group.nodes[0])} selectedId={selected?.uuid||""}/>{filteredGroups.map(group=>{const active=openGroupKey===group.key||group.nodes.some(n=>n.uuid===selectedId);const onlineHere=group.nodes.filter(n=>n.uuid.startsWith("demo-")||online.has(n.uuid)).length;const label=group.nodes.length>1?group.label:group.nodes[0].name;return <button key={group.key} className={`tw-marker ${active?"selected":""} ${group.x>82?"west":""}`} style={{left:`${group.x}%`,top:`${group.y}%`}} onPointerDown={e=>{if(!calibrating)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);dragRef.current=group.nodes.map(n=>n.uuid)}} onPointerMove={move} onPointerUp={finishDrag} onClick={()=>{if(calibrating)return;if(group.nodes.length>1){setSelectedId("");setOpenGroupKey(current=>current===group.key?"":group.key)}else{setOpenGroupKey("");setSelectedId(current=>current===group.nodes[0].uuid?"":group.nodes[0].uuid)}}} aria-expanded={active}><i/><span><b>{label}（{onlineHere}/{group.nodes.length}）</b></span></button>})}</div>
      <div className="tw-hero"><p>GLOBAL NETWORK · LIVE</p><h1>跨越晨昏，节点始终在线</h1><div className="tw-summary"><div><Server/><strong>{mapNodes.length}</strong><span>节点总数</span></div><div><Wifi/><strong>{onlineCount}</strong><span>在线节点</span></div><div><Gauge/><strong>{mapNodes.length?`${Math.round(onlineCount/mapNodes.length*100)}%`:"—"}</strong><span>当前可用</span></div></div></div>
      <div className="tw-tools"><button className={calibrating?"active":""} onClick={()=>setCalibrating(v=>!v)}><Crosshair size={17}/>{calibrating?"完成校准":"校准位置"}</button>{calibrating&&<button onClick={()=>{setSaved({});localStorage.removeItem(STORAGE_KEY);setNotice("已恢复出厂默认位置")}}><RotateCcw size={16}/>恢复默认</button>}</div>
      {calibrating&&<div className="tw-hint">拖动节点到背景图上的正确位置，缩放后仍会保持</div>}
      {openGroup&&openGroup.nodes.length>1&&<aside className="tw-server-list"><header><div><small>LOCATION</small><h2>{openGroup.label}</h2></div><span>{openGroup.nodes.length} 台服务器</span></header>{openGroup.nodes.map(node=>{const nodeOnline=node.uuid.startsWith("demo-")||online.has(node.uuid);return <button key={node.uuid} onClick={()=>{setSelectedId(node.uuid);setOpenGroupKey("")}}><span className={nodeOnline?"online":"offline"}><i/>{nodeOnline?"在线":"离线"}</span><b>{node.name}</b><small>{node.group||node.os}</small><ChevronRight size={18}/></button>})}</aside>}
      {selected&&<ServerCard node={selected} record={record} online={Boolean(isDemo||online.has(selected.uuid))} onDetails={()=>isDemo?setNotice("安装主题后将打开真实节点详情"):navigate(`/instance/${selected.uuid}`)}/>} 
      {isLoading&&!mapNodes.length&&<div className="tw-empty">正在连接 Komari…</div>}{error&&!import.meta.env.DEV&&<div className="tw-error">节点数据暂时不可用：{error}</div>}
    </section>
    <footer className="tw-footer"><span>暮色网络 · 实时状态</span><span>Powered by Komari Monitor.</span></footer>{notice&&<button className="tw-toast" onClick={()=>setNotice("")}>{notice}</button>}
  </main>;
}

function loadTone(value:number){return value>=85?"critical":value>=65?"warning":"healthy"}
function ServerCard({node,record,online,onDetails}:{node:MapNode;record?:LiveRecord;online:boolean;onDetails:()=>void}){
  const demoOffset=node.uuid.endsWith("2")?52:0;const cpu=Math.round(record?.cpu?.usage??(24+demoOffset));const memory=Math.round(record&&node.mem_total?record.ram.used/node.mem_total*100:48+demoOffset/2);const up=record?.network?.up??286*1024;const down=record?.network?.down??182*1024;
  return <aside className="tw-card"><div className="tw-card-bg"/><div className="tw-card-content"><div className="tw-card-head"><div><h2>{node.name}</h2><p>{node.region||node.group||"未设置地区"}</p></div><span className={online?"online":"offline"}><i/>{online?"在线":"离线"}</span></div><LoadChart icon={Cpu} label="CPU" value={cpu}/><LoadChart icon={MemoryStick} label="内存" value={memory}/><div className="tw-network-row"><Wifi size={19}/><span>网络吞吐</span><div><em><ArrowUp size={14}/> {formatBytes(up,"/s")}</em><em><ArrowDown size={14}/> {formatBytes(down,"/s")}</em></div></div><div className="tw-metric"><Clock3 size={19}/><span>运行时间</span><strong>{uptime(record?.uptime||18*86400+7*3600)}</strong></div><button className="tw-detail-btn" onClick={onDetails}>查看详情 <ChevronRight size={16}/></button></div></aside>
}
function LoadChart({icon:Icon,label,value}:{icon:typeof Cpu;label:string;value:number}){const tone=loadTone(value);return <div className={`tw-load ${tone}`}><div><Icon size={19}/><span>{label}</span><strong>{value}%</strong></div><progress max="100" value={value} aria-label={`${label} 使用率 ${value}%`}/></div>}
