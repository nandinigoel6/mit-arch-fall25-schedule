// schedule.js
'use strict';

// ————— Data —————
const events = [
  {subject:"4.031 Design Studio: Objects & Interaction",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Marcelo Coelho",location:"N52-337"},
  {subject:"4.105 Cultures of Form",date:"2025-12-16",time:"9 AM–12 PM",instructors:"Brandon Clifford",location:"5-234"},
  {subject:"4.140 How to Make (Almost) Anything",date:"2025-12-15",time:"1:30 PM–4:30 PM",instructors:"Neil Gershenfeld",location:"E14-633"},
  {subject:"4.151 Architecture Design Core Studio\u00A0I",date:"2025-12-08",time:"9 AM–5 PM",instructors:"Liam O'Brien • Carrie Norman • Simon Lesina‑Debiasi",location:"Long\u00A0Lounge"},
  {subject:"4.153 Architecture Design Core Studio\u00A0III",date:"2025-12-09",time:"9 AM–5 PM",instructors:"Yolande Daniels •\u00A0J. Jih • Adam\u00A0Modesitt •\u00A0Samuel May",location:"Long\u00A0Lounge"},
  {subject:"4.154 Architecture Design Option Studio – Learning from La Pampa",date:"2025-12-10",time:"1 PM–5 PM",instructors:"Rocio Crosetto-Brizzio",location:"Long Lounge"},
  {subject:"4.154 Architecture Design Option Studio – Architecture of the Earth | Matter to Data",date:"2025-12-10",time:"TBD",instructors:"Anton Garcia-Abril",location:"TBD"},
  {subject:"4.154 Architecture Design Option Studio – Under One Roof",date:"2025-12-10",time:"TBD",instructors:"Matteo Ghidoni",location:"TBD"},
  {subject:"4.183 Architectural Design Workshop – Value Engineering",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Jaffer Kolb",location:"1‑132"},
  {subject:"4.210 Positions: Cultivating Critical\u00A0Practice",date:"2025-12-17",time:"9 AM–12 PM",instructors:"James Graham",location:"7‑429"},
  {subject:"4.221 Architecture Studies Colloquium",date:"2025-12-10",time:"9 AM–1 PM",instructors:"Mark Goulthorpe",location:"Long Lounge"},
  {subject:"4.390 Art, Culture, and Technology Studio and Thesis Colloquium",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Renee Green • Tobias Putrih",location:"E15-001"},
  {subject:"4.401 /\u00A04.464 Environmental Technologies in Buildings",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Christoph Reinhart",location:"9‑354"},
  {subject:"4.463 Building Technology Systems: Structures & Envelopes",date:"2025-12-17",time:"9 AM–12 PM",instructors:"Keith Lee •\u00A0Holly Samuelson",location:"5‑234"},
  {subject:"4.502 /\u00A04.562 Advanced Visualization: Architecture in Motion Graphics",date:"2025-12-16",time:"9 AM–12 PM",instructors:"Takehiko Nagakura",location:"1‑371"},
  {subject:"4.566 Advanced Projects in Digital\u00A0Media",date:"2025-12-19",time:"9 AM–12 PM",instructors:"Takehiko Nagakura",location:"7‑304"},
  {subject:"4.601 Introduction to Art\u00A0History",date:"2025-12-19",time:"1:30 PM–4:30 PM",instructors:"Kristel Smentek",location:"3‑133"},
  {subject:"4.641 /\u00A04.644 19th‑Century\u00A0Art: Painting in the Age of Steam",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Kristel Smentek",location:"3‑133"},
  {subject:"SMArchS Thesis Proposal Reviews",date:"2025-12-11",time:"9 AM–5 PM",instructors:"Multi‑faculty",location:"Buildings 3, 7, 9"},
  {subject:"MArch Thesis Reviews",date:"2025-12-18",time:"9 AM–5 PM",instructors:"Multi‑faculty",location:"Media\u00A0Lab, 6th Floor"}
];

// ————— Utilities —————
const el = sel => document.querySelector(sel);
const tbody = el('#schedule tbody');
const fmtDate = d => new Date(d+'T00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
const pad = n => n.toString().padStart(2,'0');

function to24(token){
  if(!token || typeof token!== 'string') return null;
  token = token.trim();
  const m = token.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if(!m) return null;
  let h = parseInt(m[1],10), min = parseInt(m[2]||'0',10);
  const mer = m[3].toUpperCase();
  if(mer==='PM' && h!==12) h+=12; if(mer==='AM' && h===12) h=0;
  return pad(h)+pad(min)+'00';
}

function parseTimeRange(timeStr){
  if(!timeStr || typeof timeStr !== 'string') return {kind:'invalid'};
  const t = timeStr.replace(/[\u2012\u2014-]/g,'–').trim(); // normalize hyphens to en dash
  if(/^(TBD|TBA)$/i.test(t)) return {kind:'none'};
  if(/^all[\s\-]?day$/i.test(t)) return {kind:'allday'};
  const parts = t.split('–');
  if(parts.length!==2) return {kind:'invalid'};
  const start = to24(parts[0]);
  const end   = to24(parts[1]);
  if(!start || !end) return {kind:'invalid'};
  return {kind:'range', start, end};
}

function icsURI(e){
  const ymd = e.date.replace(/-/g,'');
  const p = parseTimeRange(e.time);
  if(p.kind==='range'){
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MIT Architecture//Fall 2025//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ymd}-${p.start}-${slug(e.subject)}@mit.edu`,
      `DTSTAMP:${ymd}T000000Z`,
      `DTSTART:${ymd}T${p.start}`,
      `DTEND:${ymd}T${p.end}`,
      `SUMMARY:${escapeICS(e.subject)}`,
      `LOCATION:${escapeICS(e.location)}`,
      `DESCRIPTION:${escapeICS('Instructors: '+e.instructors)}`,
      'END:VEVENT','END:VCALENDAR'
    ];
    return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(lines.join('\r\n'));
  }
  if(p.kind==='allday'){
    const nextDay = addDays(ymd,1);
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MIT Architecture//Fall 2025//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ymd}-allday-${slug(e.subject)}@mit.edu`,
      `DTSTAMP:${ymd}T000000Z`,
      `DTSTART;VALUE=DATE:${ymd}`,
      `DTEND;VALUE=DATE:${nextDay}`,
      `SUMMARY:${escapeICS(e.subject)}`,
      `LOCATION:${escapeICS(e.location)}`,
      `DESCRIPTION:${escapeICS('Instructors: '+e.instructors)}`,
      'END:VEVENT','END:VCALENDAR'
    ];
    return 'data:text/calendar;charset=utf-8,'+encodeURIComponent(lines.join('\r\n'));
  }
  // invalid or none → no ICS
  return null;
}

function addDays(yyyymmdd, n){
  const y = +yyyymmdd.slice(0,4), m = +yyyymmdd.slice(4,6)-1, d = +yyyymmdd.slice(6,8);
  const dt = new Date(Date.UTC(y,m,d)); dt.setUTCDate(dt.getUTCDate()+n);
  return dt.toISOString().slice(0,10).replace(/-/g,'');
}
function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function escapeICS(s){ return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,|;/g, m => '\\'+m); }

// Sort helpers: by date then start time (if any)
const sortDate = (a,b)=>{
  const d = (x)=> new Date(x.date);
  if(d(a)-d(b)!==0) return d(a)-d(b);
  const pa = parseTimeRange(a.time), pb = parseTimeRange(b.time);
  const sa = pa.kind==='range'? pa.start : (pa.kind==='allday'? '000000' : '999999');
  const sb = pb.kind==='range'? pb.start : (pb.kind==='allday'? '000000' : '999999');
  return sa.localeCompare(sb);
};
const sortSub = (a,b)=> a.subject.localeCompare(b.subject, undefined, {numeric:true, sensitivity:'base'});

// ————— Render —————
function render(list){
  const frag = document.createDocumentFragment();
  list.forEach(e=>{
    const tr = document.createElement('tr');
    const ic = icsURI(e);
    tr.innerHTML = `
      <td class="subject-cell"></td>
      <td class="date-cell"></td>
      <td class="time-cell"></td>
      <td class="instructors-cell"></td>
      <td class="location-cell"></td>
      <td class="ical-cell"></td>`;
    tr.children[0].textContent = e.subject;
    tr.children[1].textContent = fmtDate(e.date);
    tr.children[2].textContent = e.time || '—';
    tr.children[3].textContent = e.instructors || '—';
    tr.children[4].textContent = e.location || '—';
    if(ic){
      const a = document.createElement('a');
      a.className = 'add-ical';
      a.href = ic;
      a.download = `${e.subject.replace(/\s+/g,'_')}.ics`;
      a.textContent = 'add';
      a.setAttribute('aria-label', `Add to calendar: ${e.subject} on ${fmtDate(e.date)}`);
      tr.children[5].appendChild(a);
    } else {
      const span = document.createElement('span');
      span.className='muted';
      span.textContent='—';
      tr.children[5].appendChild(span);
    }
    frag.appendChild(tr);
  });
  tbody.innerHTML='';
  tbody.appendChild(frag);
}

// ————— Filter & sort (with debounce) —————
const search = document.getElementById('search');
const sortSel = document.getElementById('sort');
function debounce(fn,ms){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args),ms); }; }
const update = ()=>{
  const term = search.value.toLowerCase().trim();
  let list = events.filter(ev=> ev.subject.toLowerCase().includes(term));
  list.sort(sortSel.value==='date'? sortDate : sortSub);
  render(list);
};
search.addEventListener('input', debounce(update,160));
sortSel.addEventListener('change', update);

// ————— Simple Tests (open console to view) —————
(function runTests(){
  const cases = [
    ['9 AM–12 PM','range'],
    ['1:30 PM–4:30 PM','range'],
    ['All day','allday'],
    ['TBD','none'],
    [undefined,'invalid'],
    ['9 AM-12 PM','range'], // hyphen
    ['9 am–5 pm','range']   // lowercase
  ];
  let pass=0; cases.forEach(([t,exp])=>{ const k = parseTimeRange(t).kind; const ok = k===exp; console.assert(ok, `parseTimeRange("${t}") => ${k}, expected ${exp}`); if(ok) pass++; });
  console.log(`Tests passed: ${pass}/${cases.length}`);
})();

// initial render
update();
