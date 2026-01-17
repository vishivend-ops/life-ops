// life-ops: minimal recurring tasks app (localStorage)

const STORAGE_KEY = 'life-ops-events-v1';

function $(q){ return document.querySelector(q); }
function formatDateIso(d){
  if(!d) return '-';
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,'0');
  const day = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function todayIso(){
  return formatDateIso(new Date());
}
function addDaysIso(isoDate, days){
  const dt = isoDate ? new Date(isoDate) : new Date();
  dt.setDate(dt.getDate() + Number(days));
  return formatDateIso(dt);
}

function loadEvents(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('loadEvents', e);
    return [];
  }
}
function saveEvents(events){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function computeNextDue(event){
  if(!event.lastDone) return addDaysIso(null, event.days);
  return addDaysIso(event.lastDone, event.days);
}

function render(){
  const listEl = $('#list');
  listEl.innerHTML = '';
  const events = loadEvents()
    .map(e => ({...e, nextDue: computeNextDue(e)}))
    .sort((a,b) => new Date(a.nextDue) - new Date(b.nextDue));

  if(events.length === 0){
    const li = document.createElement('li');
    li.innerHTML = `<div class="card"><div class="info"><div class="title">No tasks yet</div><div class="meta">Add one above (title + days)</div></div></div>`;
    listEl.appendChild(li);
    return;
  }

  events.forEach(ev => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <div class="info">
        <div>
          <div class="title">${escapeHtml(ev.title)}</div>
          <div class="meta">Every ${ev.days} day(s) · Last: ${formatDateIso(ev.lastDone)} · Next: ${ev.nextDue}</div>
        </div>
      </div>
      <div class="controls">
        <button class="btn done" data-id="${ev.id}">Done</button>
        <button class="btn delete" data-id="${ev.id}">Delete</button>
      </div>
    `;
    listEl.appendChild(li);
  });

  // Attach handlers
  listEl.querySelectorAll('.done').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.getAttribute('data-id');
      markDone(id);
    });
  });
  listEl.querySelectorAll('.delete').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = btn.getAttribute('data-id');
      deleteEvent(id);
    });
  });
}

function addEvent(title, days){
  const events = loadEvents();
  const ev = {
    id: String(Date.now()),
    title: title.trim(),
    days: Number(days) || 30,
    // default lastDone to today so cycle starts now
    lastDone: todayIso()
  };
  events.push(ev);
  saveEvents(events);
  render();
}

function markDone(id){
  const events = loadEvents();
  const idx = events.findIndex(e=>e.id===id);
  if(idx === -1) return;
  events[idx].lastDone = todayIso();
  saveEvents(events);
  render();
}

function deleteEvent(id){
  let events = loadEvents();
  events = events.filter(e=>e.id!==id);
  saveEvents(events);
  render();
}

function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Form wiring
document.addEventListener('DOMContentLoaded', function(){
  render();

  const form = $('#addForm');
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    const t = $('#title').value || '';
    const d = $('#days').value || '30';
    if(!t.trim()) return;
    addEvent(t, d);
    // clear title and keep days
    $('#title').value = '';
    $('#title').focus();
  });
});