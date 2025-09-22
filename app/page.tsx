"use client"

import React, {useMemo, useState} from 'react'

type EventItem = {
  subject: string
  date: string // YYYY-MM-DD
  time?: string
  instructors?: string
  location?: string
}

const eventsData: EventItem[] = [
  {subject:"4.031 Design Studio: Objects & Interaction",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Marcelo Coelho",location:"N52-337"},
  {subject:"4.105 Cultures of Form",date:"2025-12-16",time:"9 AM–12 PM",instructors:"Brandon Clifford",location:"5-234"},
  {subject:"4.140 How to Make (Almost) Anything",date:"2025-12-15",time:"1:30 PM–4:30 PM",instructors:"Neil Gershenfeld",location:"E14-633"},
  {subject:"4.151 Architecture Design Core Studio I",date:"2025-12-08",time:"9 AM–5 PM",instructors:"Liam O'Brien • Carrie Norman • Simon Lesina‑Debiasi",location:"Long Lounge"},
  {subject:"4.153 Architecture Design Core Studio III",date:"2025-12-09",time:"9 AM–5 PM",instructors:"Yolande Daniels • J. Jih • Adam Modesitt • Samuel May",location:"Long Lounge"},
  {subject:"4.154 Architecture Design Option Studio – Learning from La Pampa",date:"2025-12-10",time:"1 PM–5 PM",instructors:"Rocio Crosetto-Brizzio",location:"Long Lounge"},
  {subject:"4.154 Architecture Design Option Studio – Architecture of the Earth | Matter to Data",date:"2025-12-10",time:"TBD",instructors:"Anton Garcia-Abril",location:"TBD"},
  {subject:"4.154 Architecture Design Option Studio – Under One Roof",date:"2025-12-10",time:"TBD",instructors:"Matteo Ghidoni",location:"TBD"},
  {subject:"4.183 Architectural Design Workshop – Value Engineering",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Jaffer Kolb",location:"1‑132"},
  {subject:"4.210 Positions: Cultivating Critical Practice",date:"2025-12-17",time:"9 AM–12 PM",instructors:"James Graham",location:"7‑429"},
  {subject:"4.221 Architecture Studies Colloquium",date:"2025-12-10",time:"9 AM–1 PM",instructors:"Mark Goulthorpe",location:"Long Lounge"},
  {subject:"4.390 Art, Culture, and Technology Studio and Thesis Colloquium",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Renee Green • Tobias Putrih",location:"E15-001"},
  {subject:"4.401 / 4.464 Environmental Technologies in Buildings",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Christoph Reinhart",location:"9‑354"},
  {subject:"4.463 Building Technology Systems: Structures & Envelopes",date:"2025-12-17",time:"9 AM–12 PM",instructors:"Keith Lee • Holly Samuelson",location:"5‑234"},
  {subject:"4.502 / 4.562 Advanced Visualization: Architecture in Motion Graphics",date:"2025-12-16",time:"9 AM–12 PM",instructors:"Takehiko Nagakura",location:"1‑371"},
  {subject:"4.566 Advanced Projects in Digital Media",date:"2025-12-19",time:"9 AM–12 PM",instructors:"Takehiko Nagakura",location:"7‑304"},
  {subject:"4.601 Introduction to Art History",date:"2025-12-19",time:"1:30 PM–4:30 PM",instructors:"Kristel Smentek",location:"3‑133"},
  {subject:"4.641 / 4.644 19th‑Century Art: Painting in the Age of Steam",date:"2025-12-15",time:"9 AM–12 PM",instructors:"Kristel Smentek",location:"3‑133"},
  {subject:"SMArchS Thesis Proposal Reviews",date:"2025-12-11",time:"9 AM–5 PM",instructors:"Multi‑faculty",location:"Buildings 3, 7, 9"},
  {subject:"MArch Thesis Reviews",date:"2025-12-18",time:"9 AM–5 PM",instructors:"Multi‑faculty",location:"Media Lab, 6th Floor"}
]

function pad(n: number){ return n.toString().padStart(2, '0') }

function to24(token?: string | null){
  if(!token || typeof token !== 'string') return null
  const t = token.trim()
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp][Mm])$/)
  if(!m) return null
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2] || '0', 10)
  const mer = m[3].toUpperCase()
  if(mer === 'PM' && h !== 12) h += 12
  if(mer === 'AM' && h === 12) h = 0
  return pad(h) + pad(min) + '00'
}

function parseTimeRange(timeStr?: string | null){
  if(!timeStr || typeof timeStr !== 'string') return {kind: 'invalid'} as const
  const t = timeStr.replace(/[\u2012\u2014-]/g, '–').trim()
  if(/^(TBD|TBA)$/i.test(t)) return {kind: 'none'} as const
  if(/^all[\s\-]?day$/i.test(t)) return {kind: 'allday'} as const
  const parts = t.split('–')
  if(parts.length !== 2) return {kind: 'invalid'} as const
  const start = to24(parts[0])
  const end = to24(parts[1])
  if(!start || !end) return {kind: 'invalid'} as const
  return {kind: 'range', start, end} as const
}

function escapeICS(s: string){
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,|;/g, m => '\\' + m)
}

function slug(s: string){
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function addDays(yyyymmdd: string, n: number){
  const y = +yyyymmdd.slice(0,4), m = +yyyymmdd.slice(4,6) - 1, d = +yyyymmdd.slice(6,8)
  const dt = new Date(Date.UTC(y, m, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0,10).replace(/-/g, '')
}

function icsURI(e: EventItem){
  const ymd = e.date.replace(/-/g, '')
  const p = parseTimeRange(e.time)
  if(p.kind === 'range'){
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MIT Architecture//Fall 2025//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ymd}-${p.start}-${slug(e.subject)}@mit.edu`,
      `DTSTAMP:${ymd}T000000Z`,
      `DTSTART:${ymd}T${p.start}`,
      `DTEND:${ymd}T${p.end}`,
      `SUMMARY:${escapeICS(e.subject)}`,
      `LOCATION:${escapeICS(e.location || '')}`,
      `DESCRIPTION:${escapeICS('Instructors: ' + (e.instructors || ''))}`,
      'END:VEVENT','END:VCALENDAR'
    ]
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'))
  }
  if(p.kind === 'allday'){
    const nextDay = addDays(ymd, 1)
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MIT Architecture//Fall 2025//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${ymd}-allday-${slug(e.subject)}@mit.edu`,
      `DTSTAMP:${ymd}T000000Z`,
      `DTSTART;VALUE=DATE:${ymd}`,
      `DTEND;VALUE=DATE:${nextDay}`,
      `SUMMARY:${escapeICS(e.subject)}`,
      `LOCATION:${escapeICS(e.location || '')}`,
      `DESCRIPTION:${escapeICS('Instructors: ' + (e.instructors || ''))}`,
      'END:VEVENT','END:VCALENDAR'
    ]
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'))
  }
  return null
}

function fmtDate(d: string){
  return new Date(d + 'T00:00').toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})
}

const sortDate = (a: EventItem, b: EventItem) => {
  const da = new Date(a.date), db = new Date(b.date)
  if(+da - +db !== 0) return +da - +db
  const pa = parseTimeRange(a.time), pb = parseTimeRange(b.time)
  const sa = pa.kind === 'range' ? pa.start : (pa.kind === 'allday' ? '000000' : '999999')
  const sb = pb.kind === 'range' ? pb.start : (pb.kind === 'allday' ? '000000' : '999999')
  return sa.localeCompare(sb)
}

const sortSub = (a: EventItem, b: EventItem) => a.subject.localeCompare(b.subject, undefined, {numeric: true, sensitivity: 'base'})

export default function Page(): React.ReactElement {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'subject'>('date')

  const list = useMemo(() => {
    const term = search.toLowerCase().trim()
    const filtered = eventsData.filter(ev => ev.subject.toLowerCase().includes(term))
    filtered.sort(sortBy === 'date' ? sortDate : sortSub)
    return filtered
  }, [search, sortBy])

  return (
    <main>
      <header>
        <h1>MIT Architecture</h1>
        <h2>Final Exams & Reviews · Fall 2025</h2>
      </header>

      <div className="controls">
        <label>Search <input id="search" value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="e.g. 4.105 or Visualization" /></label>
        <label>Sort by: <select id="sort" value={sortBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as 'date' | 'subject')}><option value="date">Date</option><option value="subject">Subject</option></select></label>
      </div>

      <table id="schedule">
        <caption>Final Exams & Reviews · Fall 2025</caption>
        <thead>
          <tr>
            <th scope="col">Subject</th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Instructors</th>
            <th scope="col">Location</th>
            <th scope="col">iCal</th>
          </tr>
        </thead>
        <tbody>
          {list.map((e, i) => {
            const ic = icsURI(e)
            return (
              <tr key={i}>
                <td className="subject-cell">{e.subject}</td>
                <td className="date-cell">{fmtDate(e.date)}</td>
                <td className="time-cell">{e.time || '—'}</td>
                <td className="instructors-cell">{e.instructors || '—'}</td>
                <td className="location-cell">{e.location || '—'}</td>
                <td className="ical-cell">{ic ? (
                  <a className="add-ical" href={ic} download={`${e.subject.replace(/\s+/g, '_')}.ics`} aria-label={`Add to calendar: ${e.subject} on ${fmtDate(e.date)}`}>add</a>
                ) : (<span className="muted">—</span>)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <style>{`
        :root { --fg:#0b1115; --bg:#ffffff; --muted:#6b7280; --stripe:#f7f7f8; --font:"Inter",system-ui,Segoe UI,Roboto,Helvetica,Arial,"Noto Sans",sans-serif; }
        *{box-sizing:border-box;margin:0;padding:0}
        main{font-family:var(--font);background:var(--bg);color:var(--fg);padding:3rem;max-width:1100px;margin:0 auto}

        header{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:space-between;align-items:baseline;border-bottom:1px solid rgba(11,17,21,0.08);margin-bottom:2rem;padding-bottom:0.5rem}
        header h1{font-size:1.5rem;font-weight:700;letter-spacing:-0.02em}
        header h2{font-size:1rem;font-weight:500;color:var(--muted)}

        .controls{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.25rem;align-items:center}
        label{font-weight:600;color:var(--muted);font-size:0.95rem}
        input,select{padding:.5rem .6rem;font-size:0.95rem;border:1px solid rgba(11,17,21,0.12);border-radius:8px;background:var(--bg);color:var(--fg);min-width:180px}

        table{width:100%;border-collapse:separate;border-spacing:0 10px;text-align:left}
        caption{caption-side:top;text-align:left;margin:.25rem 0 0.6rem;font-weight:700;color:var(--muted)}
        thead th{text-transform:uppercase;font-size:.72rem;letter-spacing:.06em;padding:.6rem;border-bottom:0;font-weight:600;color:var(--muted);text-align:left}
        tbody tr{background:transparent}
        tbody tr td{background:transparent}
        tbody tr + tr td{margin-top:10px}
        tbody tr td{padding:.9rem 1rem;font-size:1rem;color:var(--fg);border-bottom:0;border-right:0;vertical-align:middle;text-align:left;background:#fff;border-radius:8px;box-shadow:0 0 0 1px rgba(11,17,21,0.02) inset}
        tbody tr td + td{margin-left:8px}
        td:first-child{width:40%}
        .muted{color:var(--muted)}

        .subject-cell{font-weight:700}
        .date-cell{font-weight:600;color:var(--muted);width:16%}
        .time-cell{width:13%;color:var(--muted)}
        .instructors-cell{color:var(--muted)}
        .location-cell{width:12%;color:var(--muted)}

        .add-ical{display:inline-block;padding:.35rem .6rem;font-size:.85rem;border:1px solid rgba(11,17,21,0.08);border-radius:8px;color:var(--fg);text-decoration:none;background:transparent}
        .add-ical:hover,.add-ical:focus-visible{background:#111827;color:#fff;outline:none}
        .add-ical[aria-disabled="true"]{opacity:.45;pointer-events:none}

        @media (max-width:820px){
          main{padding:1.25rem}
          header{align-items:flex-start}
          .controls{flex-direction:column;align-items:stretch}
          input,select{width:100%}
          table{border-spacing:0}
          thead{display:none}
          tbody tr{display:block;margin-bottom:0}
          tbody tr td{display:block;padding:.8rem;border-radius:6px;margin-bottom:8px}
        }
      `}</style>
    </main>
  )
}


