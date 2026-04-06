'use strict';

/* ==============================
   CONFIG
================================= */
const API = 'http://localhost:8000';

/* ==============================
   STATE
================================= */
let files        = [];          // File objects
let allResults   = [];          // Full ranked result list
let activeFilter = 'all';       // Score tier filter
let sortMode     = 'score-desc';// Current sort
let scoreChart   = null;        // Chart.js instance
let skillsChart  = null;        // Chart.js instance

/* ==============================
   DOM REFS
================================= */
const $ = id => document.getElementById(id);

const jobDesc       = $('job-desc');
const charCount     = $('char-count');
const wordCount     = $('word-count');
const dropZone      = $('drop-zone');
const fileInput     = $('file-input');
const fileList      = $('file-list');
const fileCounter   = $('file-counter');
const fileCountTxt  = $('file-count-txt');
const clearFilesBtn = $('clear-files');
const rankBtn       = $('rank-btn');
const btnInner      = $('btn-inner');
const uploadStatus  = $('upload-status');
const sortSelect    = $('sort-select');
const filterInput   = $('filter-input');
const resultsList   = $('results-list');
const resultsMeta   = $('results-meta');
const analyticsStrip= $('analytics-strip');
const topBanner     = $('top-banner');
const errorsBox     = $('errors-box');
const newAnalysisBtn= $('new-analysis-btn');
const modal         = $('modal');
const modalOverlay  = $('modal-overlay');
const modalClose    = $('modal-close');
const modalTitle    = $('modal-title');
const modalBody     = $('modal-body');
const hamburger     = $('hamburger');
const navLinks      = $('nav-links');
const toastBox      = $('toasts');
const progSection   = $('progress-section');
const progFill      = $('progress-fill');
const progPercent   = $('progress-percent');
const progStatus    = $('progress-status');

/* ==============================
   HAMBURGER MENU
================================= */
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

/* ==============================
   SINGLE-PAGE NAV
================================= */
const sections = ['home', 'upload', 'results', 'about'];

function showSection(id) {
  sections.forEach(s => {
    const el = $(s);
    if (el) el.classList.toggle('hidden', s !== id);
  });
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.section === id);
  });
  // Close mobile menu
  navLinks.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

// Hero CTA
if ($('home-cta')) {
  $('home-cta').addEventListener('click', e => {
    e.preventDefault();
    showSection('upload');
  });
}

// New analysis button
newAnalysisBtn.addEventListener('click', () => showSection('upload'));

// Init: show home
showSection('home');

/* ==============================
   CHAR / WORD COUNTER
================================= */
jobDesc.addEventListener('input', () => {
  const txt = jobDesc.value;
  const chars = txt.length;
  const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  charCount.textContent = chars.toLocaleString() + ' characters';
  wordCount.textContent  = words.toLocaleString() + ' words';
  charCount.style.color = chars > 100 ? 'var(--primary)' : 'var(--text-dim)';
});

/* ==============================
   FILE UTILITIES
================================= */
const ALLOW = ['pdf','docx','doc','txt'];

function ext(name) { return name.toLowerCase().split('.').pop(); }

function fmtBytes(b) {
  if (b < 1024)     return b + ' B';
  if (b < 1048576)  return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function renderFileList() {
  fileList.innerHTML = '';
  files.forEach((f, i) => {
    const isPdf = ext(f.name) === 'pdf';
    const icon  = isPdf ? 'file-text' : 'file';
    const div   = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <i data-lucide="${icon}" style="color: var(--primary); width: 18px;"></i>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${esc(f.name)}">${esc(f.name)}</div>
        <div style="font-size: 0.7rem; color: var(--text-dim);">${fmtBytes(f.size)}</div>
      </div>
      <button class="fi-del" data-i="${i}" type="button" style="background: none; color: var(--text-dim); cursor: pointer; padding: 4px;">
        <i data-lucide="x" style="width: 16px;"></i>
      </button>
    `;
    fileList.appendChild(div);
  });

  fileList.querySelectorAll('.fi-del').forEach(btn => {
    btn.addEventListener('click', () => {
      files.splice(Number(btn.dataset.i), 1);
      renderFileList();
      updateCounter();
    });
  });
  updateCounter();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateCounter() {
  const n = files.length;
  if (n === 0) {
    fileCounter.classList.add('hidden');
  } else {
    fileCounter.classList.remove('hidden');
    fileCountTxt.textContent = `${n} file${n !== 1 ? 's' : ''} uploaded`;
  }
}

function addFiles(newFiles) {
  for (const f of Array.from(newFiles)) {
    if (!ALLOW.includes(ext(f.name))) {
      toast(`"${f.name}" skipped — unsupported type`, 'error'); continue;
    }
    if (files.length >= 20) {
      toast('Maximum 20 files', 'error'); break;
    }
    if (files.some(x => x.name === f.name && x.size === f.size)) {
      toast(`"${f.name}" already added`, 'info'); continue;
    }
    files.push(f);
  }
  renderFileList();
}

fileInput.addEventListener('change', e => {
  addFiles(e.target.files);
  fileInput.value = '';
});

clearFilesBtn.addEventListener('click', () => {
  files = [];
  renderFileList();
  toast('Files cleared', 'info');
});

dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', e => { if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('dragover'); });
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});

/* ==============================
   SCORE & UI HELPERS
================================= */
function scoreTier(s) {
  if (s >= 80) return 'excellent';
  if (s >= 60) return 'good';
  if (s >= 40) return 'fair';
  return 'low';
}
function scoreLbl(s) {
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Good';
  if (s >= 40) return 'Fair';
  return 'Low';
}

/* ==============================
   LOADING & PROGRESS
================================= */
function setLoading(on) {
  rankBtn.disabled = on;
  btnInner.innerHTML = on
    ? '<span class="spinner"></span> Processing...'
    : 'Process & Rank Candidates';
  
  progSection.classList.toggle('hidden', !on);
  if (on) {
    updateProgress(10, 'Initializing AI Models...');
  }
}

function updateProgress(percent, msg) {
  progFill.style.width = percent + '%';
  progPercent.textContent = percent + '%';
  if (msg) progStatus.textContent = msg;
}

function showStatus(msg, type) {
  uploadStatus.className = `status-banner ${type}`;
  uploadStatus.innerHTML = msg;
  uploadStatus.classList.remove('hidden');
}
function hideStatus() { uploadStatus.classList.add('hidden'); }

/* ==============================
   RANK BUTTON
================================= */
rankBtn.addEventListener('click', async () => {
  const jd = jobDesc.value.trim();

  if (!jd) {
    showStatus('<i data-lucide="alert-circle"></i> Please enter a job description.', 'error');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    jobDesc.focus();
    return;
  }
  if (files.length === 0) {
    showStatus('<i data-lucide="alert-circle"></i> Please upload at least one resume.', 'error');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  hideStatus();
  setLoading(true);

  // Progressive simulation
  let p = 10;
  const interval = setInterval(() => {
    if (p < 85) {
      p += Math.random() * 5;
      let msg = 'Analyzing semantic context...';
      if (p > 40) msg = 'Extracting candidate skills...';
      if (p > 70) msg = 'Calculating similarity scores...';
      updateProgress(Math.floor(p), msg);
    }
  }, 400);

  const fd = new FormData();
  fd.append('job_description', jd);
  files.forEach(f => fd.append('files', f, f.name));

  try {
    const res  = await fetch(`${API}/upload`, { method: 'POST', body: fd });
    const data = await res.json();

    if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`);

    clearInterval(interval);
    updateProgress(100, 'Analysis complete!');

    setTimeout(() => {
      allResults = data.results;
      renderResults(data);
      showSection('results');
      toast(`✅ Successfully ranked ${data.total_processed} candidates`, 'success');
      setLoading(false);
    }, 600);

  } catch (err) {
    clearInterval(interval);
    const isNet = /fetch|failed to fetch|network/i.test(err.message);
    showStatus(
      isNet
        ? '❌ Cannot reach the recruitment server. Ensure backend is on port 8000.'
        : `❌ Error: ${err.message}`,
      'error'
    );
    setLoading(false);
  }
});

/* ==============================
   RENDER RESULTS
================================= */
function renderResults(data) {
  const { results, errors, total_processed } = data;

  resultsMeta.textContent = `${total_processed} active candidates screened vs. job description`;

  // Analytics
  renderAnalytics(results);
  renderCharts(results);

  // Top banner
  if (results.length > 0) renderTopBanner(results[0]);

  // Errors
  if (errors && errors.length) {
    errorsBox.classList.remove('hidden');
    errorsBox.innerHTML = `
      <h4 style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <i data-lucide="alert-triangle"></i>
        Processing Issues (${errors.length})
      </h4>
      <ul style="padding-left: 20px; font-size: 0.85rem;">${errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
    `;
  } else {
    errorsBox.classList.add('hidden');
  }

  // Cards
  renderCards(results);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderAnalytics(results) {
  if (!results.length) { analyticsStrip.innerHTML = ''; return; }

  const avg   = (results.reduce((a, r) => a + r.score, 0) / results.length).toFixed(1);
  const best  = results[0].score;
  const totalSkills = results.reduce((a, r) => a + r.skill_count, 0);
  const excellent = results.filter(r => r.score >= 80).length;

  analyticsStrip.innerHTML = `
    <div class="a-card">
      <div class="a-val">${avg}%</div>
      <div class="a-lbl">Average Match</div>
    </div>
    <div class="a-card">
      <div class="a-val" style="color: var(--success);">${best}%</div>
      <div class="a-lbl">Highest Score</div>
    </div>
    <div class="a-card">
      <div class="a-val" style="color: var(--secondary);">${results.length}</div>
      <div class="a-lbl">Ranked Talent</div>
    </div>
    <div class="a-card">
      <div class="a-val" style="color: var(--info);">${totalSkills}</div>
      <div class="a-lbl">Extracted Skills</div>
    </div>
  `;
}

function renderCharts(results) {
  if (!results.length) return;

  const ctxScore = $('scoreChart').getContext('2d');
  const ctxSkills = $('skillsChart').getContext('2d');

  if (scoreChart) scoreChart.destroy();
  if (skillsChart) skillsChart.destroy();

  // Score distribution
  const topResults = results.slice(0, 10);
  scoreChart = new Chart(ctxScore, {
    type: 'bar',
    data: {
      labels: topResults.map(r => r.name.length > 12 ? r.name.substring(0, 10) + '..' : r.name),
      datasets: [{
        label: 'Match Score %',
        data: topResults.map(r => r.score),
        backgroundColor: topResults.map(r => {
          if (r.score >= 80) return '#10b981';
          if (r.score >= 60) return '#3b82f6';
          return '#94a3b8';
        }),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });

  // Top skills found across all
  const skillFreq = {};
  results.forEach(r => {
    (r.skills || []).forEach(s => skillFreq[s] = (skillFreq[s] || 0) + 1);
  });
  const sortedSkills = Object.entries(skillFreq).sort((a,b) => b[1] - a[1]).slice(0, 7);

  skillsChart = new Chart(ctxSkills, {
    type: 'doughnut',
    data: {
      labels: sortedSkills.map(s => s[0]),
      datasets: [{
        data: sortedSkills.map(s => s[1]),
        backgroundColor: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } },
      cutout: '70%'
    }
  });
}

function renderTopBanner(top) {
  const tier = scoreTier(top.score);
  topBanner.innerHTML = `
    <div class="panel" style="border-left: 6px solid var(--success); display: flex; align-items: center; gap: 32px; padding: 40px;">
      <div style="font-size: 3rem;">🏆</div>
      <div style="flex: 1;">
        <span class="hero-eyebrow" style="margin-bottom: 8px;">Top Match Detected</span>
        <h2 style="font-size: 1.8rem; margin-bottom: 8px;">${esc(top.name)}</h2>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span class="score-badge score-excellent">${top.score}% Semantic Match</span>
          <span style="color: var(--text-muted); font-size: 0.9rem;">${top.skill_count} relevant skills found</span>
        </div>
      </div>
      <div>
        <button class="btn btn-primary skill-detail-btn" data-idx="${allResults.indexOf(top)}">View Detailed Profile</button>
      </div>
    </div>
  `;
}

function renderCards(results) {
  resultsList.innerHTML = '';
  if (!results.length) {
    resultsList.innerHTML = `
      <div class="panel" style="text-align: center; padding: 60px;">
        <i data-lucide="search-x" style="width: 48px; height: 48px; color: var(--text-dim); margin-bottom: 16px;"></i>
        <p style="color: var(--text-muted);">No candidates match the selected filters.</p>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  results.forEach((r, idx) => {
    const tier = scoreTier(r.score);
    const card = document.createElement('div');
    card.className = 'r-card';
    card.innerHTML = `
      <div class="r-avatar">${r.name.charAt(0).toUpperCase()}</div>
      <div class="r-body">
        <div class="r-name">${esc(r.name)}</div>
        <div class="r-stats">
          <span style="display: flex; align-items: center; gap: 4px;">
            <i data-lucide="target" style="width: 14px;"></i> ${r.score}% Match
          </span>
          <span style="display: flex; align-items: center; gap: 4px;">
            <i data-lucide="layers" style="width: 14px;"></i> ${r.skill_count} Skills
          </span>
          ${r.contact?.email ? `
          <span style="display: flex; align-items: center; gap: 4px;">
            <i data-lucide="mail" style="width: 14px;"></i> ${esc(r.contact.email)}
          </span>` : ''}
        </div>
        <div style="margin-top: 12px;">
          ${r.skills.slice(0, 5).map(s => `<span class="tag">${esc(s)}</span>`).join('')}
          ${r.skills.length > 5 ? `<span style="font-size: 0.7rem; color: var(--text-dim);">+${r.skills.length - 5} more</span>` : ''}
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-outline btn-sm skill-detail-btn" data-idx="${allResults.indexOf(r)}">Analysis</button>
        <button class="btn btn-ghost btn-sm download-btn" data-idx="${allResults.indexOf(r)}">
          <i data-lucide="download" style="width: 16px;"></i>
        </button>
      </div>
    `;
    resultsList.appendChild(card);
  });

  document.querySelectorAll('.skill-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(allResults[Number(btn.dataset.idx)]));
  });

  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', () => downloadResume(Number(btn.dataset.idx)));
  });
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ==============================
   SORT & FILTER
================================= */
function applyFiltersAndSort() {
  if (!allResults.length) return;
  
  const q    = filterInput.value.trim().toLowerCase();
  const tier = activeFilter;
  
  let processed = allResults.filter(r => {
    const matchTier  = tier === 'all' || scoreTier(r.score) === tier;
    const matchQuery = !q || r.name.toLowerCase().includes(q) || (r.skills || []).join(' ').toLowerCase().includes(q);
    return matchTier && matchQuery;
  });

  switch (sortMode) {
    case 'score-asc':   processed.sort((a,b) => a.score - b.score); break;
    case 'name-asc':    processed.sort((a,b) => a.name.localeCompare(b.name)); break;
    case 'skills-desc': processed.sort((a,b) => b.skill_count - a.skill_count); break;
    default:            processed.sort((a,b) => b.score - a.score);
  }

  renderCards(processed);
}

sortSelect.addEventListener('change', () => {
  sortMode = sortSelect.value;
  applyFiltersAndSort();
});

filterInput.addEventListener('input', applyFiltersAndSort);

document.querySelectorAll('#filter-toggles button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#filter-toggles button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    applyFiltersAndSort();
  });
});

/* ==============================
   DOWNLOAD & MODAL
================================= */
function downloadResume(idx) {
  const file = files[idx];
  if (!file) {
    const result = allResults[idx];
    const matched = files.find(f => f.name === result?.name);
    if (!matched) { toast('Could not locate original file', 'error'); return; }
    triggerDownload(matched);
  } else triggerDownload(file);
}

function triggerDownload(file) {
  const url = URL.createObjectURL(file);
  const a   = document.createElement('a');
  a.href = url; a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openModal(resume) {
  modalTitle.textContent = resume.name;
  const cats    = resume.skills_by_category || {};
  const contact = resume.contact || {};

  modalBody.innerHTML = `
    <div class="m-score-box">
      <div class="m-score-num" style="color: var(--primary)">${resume.score}%</div>
      <div style="flex: 1;">
        <div style="font-weight: 700;">Semantic Match Score</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">${resume.skill_count} detected skills</div>
      </div>
    </div>

    ${(contact.email || contact.phone || contact.linkedin) ? `
      <div class="panel" style="padding: 16px; margin-top: 16px;">
        <h4 style="font-size: 0.8rem; text-transform: uppercase; margin-bottom: 12px; color: var(--text-dim);">Contact Discovery</h4>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.9rem;">
          ${contact.email ? `<div><i data-lucide="mail" style="width: 14px; vertical-align: middle;"></i> ${esc(contact.email)}</div>` : ''}
          ${contact.phone ? `<div><i data-lucide="phone" style="width: 14px; vertical-align: middle;"></i> ${esc(contact.phone)}</div>` : ''}
          ${contact.linkedin ? `<div><i data-lucide="linkedin" style="width: 14px; vertical-align: middle;"></i> LinkedIn Profile</div>` : ''}
        </div>
      </div>
    ` : ''}

    <div style="margin-top: 24px;">
      <h4 style="font-size: 0.8rem; text-transform: uppercase; margin-bottom: 12px; color: var(--text-dim);">Skill Breakdown</h4>
      ${Object.keys(cats).map(k => `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">${esc(k)}</div>
          <div>${cats[k].map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>
        </div>`).join('')}
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

/* ==============================
   TOASTS
================================= */
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = msg;
  toastBox.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ==============================
   INIT
================================= */
(async () => {
  try {
    const r = await fetch(`${API}/health`);
    if (r.ok) toast('✨ Recruitment Engine Online', 'success');
  } catch {
    toast('⚠️ Engine Offline — Check backend connection', 'error');
  }
})();
