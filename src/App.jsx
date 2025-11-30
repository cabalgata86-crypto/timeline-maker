import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

export default function App(){
  const [docHtml, setDocHtml] = useState('<p>Empieza a escribir aquí...</p>');
  const editorRef = useRef();
  const [events, setEvents] = useState([
    {id:1,date:'2005-06-15',title:'Evento A',note:'Nota A'},
    {id:2,date:'2015-09-01',title:'Evento B',note:'Nota B'}
  ]);
  const svgRef = useRef();
  const [startDate, setStartDate] = useState('2000-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [width, setWidth] = useState(1200);
  const [scale, setScale] = useState(1);
  const [dpi, setDpi] = useState(1);
  const autosaveKey = 'timeline_maker_doc_v1';

  // Autosave/load
  useEffect(()=>{ const s = localStorage.getItem(autosaveKey); if(s){ try{ const parsed = JSON.parse(s); setDocHtml(parsed.docHtml||docHtml); setEvents(parsed.events||events); setStartDate(parsed.startDate||startDate); setEndDate(parsed.endDate||endDate); }catch(e){} } },[]);
  useEffect(()=>{ const payload = {docHtml, events, startDate, endDate}; localStorage.setItem(autosaveKey, JSON.stringify(payload)); },[docHtml, events, startDate, endDate]);

  function saveEditor(){ if(editorRef.current) setDocHtml(editorRef.current.innerHTML); }

  function insertImage(file){
    const reader = new FileReader();
    reader.onload = ()=> {
      const imgId = 'img_' + Date.now();
      const imgHtml = '<img id="'+imgId+'" src="'+reader.result+'" class="resizable-img" />';
      setDocHtml(prev=> prev + imgHtml);
      setTimeout(()=>{ if(editorRef.current) editorRef.current.innerHTML = docHtml + imgHtml; },100);
    };
    reader.readAsDataURL(file);
  }

  // Basic timeline mapping
  const dateToMs = d => new Date(d).getTime();
  function dateToX(dateStr){
    const s = dateToMs(startDate), e = dateToMs(endDate), t = dateToMs(dateStr);
    if(isNaN(t)||isNaN(s)||isNaN(e)) return 0;
    const frac = (t - s)/(e - s);
    return clamp(frac,0,1) * width * scale;
  }
  function xToDate(x){
    const s = dateToMs(startDate), e = dateToMs(endDate);
    const frac = clamp(x/(width*scale),0,1);
    return new Date(s + frac*(e - s)).toISOString().slice(0,10);
  }

  useEffect(()=>{ setEvents(prev => prev.map(ev=>({...ev, x: dateToX(ev.date)}))); },[startDate,endDate,width,scale]);

  function handleSvgClick(e){
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const date = xToDate(x);
    const id = Date.now();
    setEvents(prev=>[...prev,{id,date,title:'Nuevo evento',note:''}]);
  }

  // Export SVG -> PNG with dpi
  async function exportSvgToPng(filename='timeline.png', dpiScale=1){
    const svg = svgRef.current;
    if(!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(source)));
    const img = new Image();
    img.crossOrigin='anonymous';
    img.src = 'data:image/svg+xml;base64,' + svg64;
    img.onload = ()=>{
      const canvas = document.createElement('canvas');
      const w = Math.ceil(svg.width.baseVal.value * dpiScale);
      const h = Math.ceil(svg.height.baseVal.value * dpiScale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      canvas.toBlob(blob=>{
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
        URL.revokeObjectURL(url);
      },'image/png');
    };
  }

  async function exportPDF(){
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(source)));
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + svg64;
    img.onload = ()=>{
      const pdf = new jsPDF({orientation:'landscape'});
      // draw at comfortable size
      pdf.addImage(img, 'PNG', 10, 10, 277, 120);
      pdf.save('timeline.pdf');
    };
  }

  async function exportDOCX(){
    const items = events.map(e=>`• ${e.date}: ${e.title} - ${e.note}`);
    const doc = new Document({ sections:[{properties:{}, children:[ new Paragraph('Línea de tiempo generada:'), ...items.map(i=>new Paragraph(i)) ]}]});
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'timeline.docx'; a.click();
  }

  // Templates
  function applyTemplate(n){
    if(n===1){
      setDocHtml('<h2>Mi línea de tiempo personal</h2><p>Introduce tus notas aquí...</p>');
      setEvents([{id:1,date:'2010-01-01',title:'Comienzo',note:''}]);
      setStartDate('2000-01-01'); setEndDate('2030-01-01');
    } else if(n===2){
      setDocHtml('<h2>Proyecto — Hitos</h2><p>Plan de entrega</p>');
      setEvents([{id:1,date:'2024-01-15',title:'Fase 1',note:''},{id:2,date:'2024-06-01',title:'Fase 2',note:''}]);
      setStartDate('2023-01-01'); setEndDate('2025-12-31');
    }
  }

  // Resizable images inside editor: basic CSS handles via .resizable-img

  return (
    <div style={{padding:16,fontFamily:'Inter, sans-serif'}}>
      <h1>Timeline Maker — Editor</h1>
      <div style={{display:'flex',gap:12,marginTop:10}}>
        <div style={{flex:'0 0 350px',background:'#fff',padding:12,borderRadius:8,boxShadow:'0 2px 6px rgba(0,0,0,0.08)'}}>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <button onClick={()=>{document.execCommand('bold'); saveEditor();}}>B</button>
            <button onClick={()=>{document.execCommand('italic'); saveEditor();}}>I</button>
            <input type='file' accept='image/*' onChange={e=>insertImage(e.target.files[0])} />
          </div>
          <div ref={editorRef} contentEditable className='editor' onInput={saveEditor} dangerouslySetInnerHTML={{__html:docHtml}} style={{minHeight:240,overflow:'auto',padding:8,border:'1px solid #ddd'}} />
          <div style={{marginTop:8}}>
            <button onClick={()=>navigator.clipboard.writeText(docHtml)}>Copiar HTML</button>
            <button onClick={()=>{ setDocHtml(''); if(editorRef.current) editorRef.current.innerHTML='';}}>Limpiar</button>
            <button onClick={()=>{ applyTemplate(1); }}>Plantilla: Personal</button>
            <button onClick={()=>{ applyTemplate(2); }}>Plantilla: Proyecto</button>
          </div>
        </div>

        <div style={{flex:1,background:'#fff',padding:12,borderRadius:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <label>Inicio</label>
              <input type='date' value={startDate} onChange={e=>setStartDate(e.target.value)} />
              <label>Fin</label>
              <input type='date' value={endDate} onChange={e=>setEndDate(e.target.value)} />
              <label>Zoom</label>
              <input type='range' min='0.25' max='3' step='0.05' value={scale} onChange={e=>setScale(parseFloat(e.target.value))} />
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={()=>setWidth(w=>Math.max(600,w-200))}>- ancho</button>
              <button onClick={()=>setWidth(w=>w+200)}>+ ancho</button>
              <button onClick={()=>exportSvgToPng('timeline.png', dpi)}>Exportar PNG</button>
              <button onClick={()=>exportPDF()}>Exportar PDF</button>
              <button onClick={()=>exportDOCX()}>Exportar DOCX</button>
            </div>
          </div>

          <div style={{overflow:'auto',border:'1px solid #eee',padding:8}}>
            <svg ref={svgRef} onClick={handleSvgClick} width={width*scale} height={220} style={{background:'#fff'}}>
              <line x1={0} y1={110} x2={width*scale} y2={110} stroke='#333' strokeWidth={2} />
              {
                (()=>{ const ys=[]; const s=new Date(startDate).getFullYear(); const e=new Date(endDate).getFullYear(); for(let y=s;y<=e;y++) ys.push(y); return ys.map(y=>{ const d=new Date(y+'-01-01'); const x=dateToX(d.toISOString().slice(0,10)); return <g key={y}><line x1={x} x2={x} y1={90} y2={130} stroke='#666' /><text x={x+4} y={150} fontSize={12}>{y}</text></g> }) })()
              }
              {
                events.map(ev=>{
                  const x = dateToX(ev.date);
                  return <g key={ev.id} transform={`translate(${x},110)`}>
                    <circle cx={0} cy={0} r={8} fill='#1f8ef1' />
                    <rect x={12} y={-18} width={200} height={36} rx={6} fill='#fff' stroke='#ccc' />
                    <text x={20} y={0} fontSize={12}>{ev.title} ({ev.date})</text>
                  </g>
                })
              }
            </svg>
          </div>

          <div style={{marginTop:8}}>
            <label>DPI export: {dpi}x</label>
            <input type='range' min='1' max='4' value={dpi} onChange={e=>setDpi(parseInt(e.target.value))} />
          </div>

          <div style={{marginTop:12}}>
            <h4>Eventos (editar)</h4>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {events.map(ev=>(
                <div key={ev.id} style={{border:'1px solid #eee',padding:8,borderRadius:6}}>
                  <input value={ev.title} onChange={e=>setEvents(prev=>prev.map(it=>it.id===ev.id?{...it,title:e.target.value}:it))} />
                  <input type='date' value={ev.date} onChange={e=>setEvents(prev=>prev.map(it=>it.id===ev.id?{...it,date:e.target.value}:it))} />
                  <textarea value={ev.note} onChange={e=>setEvents(prev=>prev.map(it=>it.id===ev.id?{...it,note:e.target.value}:it))} />
                  <div style={{display:'flex',gap:6,marginTop:6}}>
                    <button onClick={()=>setEvents(prev=>prev.filter(i=>i.id!==ev.id))}>Eliminar</button>
                    <button onClick={()=>setEvents(prev=>prev.map(i=>i.id===ev.id?{...i,x:dateToX(i.date)}:i))}>Recalcular X</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`.resizable-img{max-width:100%;height:auto;cursor:grab;border:1px dashed #ccc;padding:2px}`}</style>
    </div>
  );
}
