let CODENAME = '';
let REVEALED_CHARS = new Set();
let REVEAL_MAP = {};
let configReady = false;

let QUESTIONS = {};

const state = {
  userName: '',
  completed: {},
  failed: {},
  slotContents: {},
};

const $ = id => document.getElementById(id);
const pageLogin = $('page-login');
const pageMain = $('page-main');
const pageQuestion = $('page-question');
const nameInput = $('name-input');
const loginBtn = $('login-btn');
const displayName = $('display-name');
const logoutBtn = $('logout-btn');
const codenameSlots = $('codename-slots');
const letterPool = $('letter-pool');
const letterGrid = $('letter-grid');
const qContainer = $('q-container');
const qBackBtn = $('q-back-btn');
const qLetterBadge = $('q-letter-badge');
const toast = $('toast');
const celebration = $('celebration');
const celebrationMsg = $('celebration-msg');
const celebrationOk = $('celebration-ok');

function apiFetch(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function saveLocal() {
  if (!state.userName) return;
  try {
    localStorage.setItem('game_' + state.userName, JSON.stringify({
      userName: state.userName,
      completed: state.completed,
      failed: state.failed,
      slotContents: state.slotContents,
    }));
  } catch (e) {}
}

function loadLocal(userName) {
  try {
    const raw = localStorage.getItem('game_' + userName);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function removeLocal() {
  if (!state.userName) return;
  try { localStorage.removeItem('game_' + state.userName); } catch (e) {}
}

async function saveState() {
  if (!state.userName) return;
  saveLocal();
  const data = {
    userName: state.userName,
    completed: state.completed,
    failed: state.failed,
    slotContents: state.slotContents,
  };
  try {
    await apiFetch(`/api/state/${encodeURIComponent(state.userName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn('saveState error:', e);
  }
}

async function loadState(userName) {
  const local = loadLocal(userName);
  if (local) {
    state.userName = local.userName || userName;
    state.completed = local.completed || {};
    state.failed = local.failed || {};
    state.slotContents = local.slotContents || {};
    return true;
  }
  try {
    const res = await apiFetch(`/api/state/${encodeURIComponent(userName)}`);
    if (!res) return false;
    const json = await res.json();
    if (json.success && json.data) {
      state.userName = json.data.userName || userName;
      state.completed = json.data.completed || {};
      state.failed = json.data.failed || {};
      state.slotContents = json.data.slotContents || {};
      return true;
    }
    return false;
  } catch (e) {
    console.warn('loadState error:', e);
    return false;
  }
}

async function clearState() {
  state.userName = '';
  state.completed = {};
  state.failed = {};
  state.slotContents = {};
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $(pageId).classList.add('active');
}

function showToast(msg, duration) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration || 2000);
}

let dragData = null;
let touchClone = null;
let touchOffsetX = 0, touchOffsetY = 0;

function initDragTile(el, letter) {
  el.draggable = true;
  el.dataset.letter = letter;

  el.addEventListener('dragstart', (e) => {
    dragData = { letter, source: el };
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', letter);
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    dragData = null;
  });

  el.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    dragData = { letter, source: el };
    const rect = el.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;
    touchClone = el.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '9999';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.width = rect.width + 'px';
    touchClone.style.height = rect.height + 'px';
    touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
    touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';
    touchClone.style.opacity = '0.85';
    touchClone.style.transform = 'scale(1.1)';
    document.body.appendChild(touchClone);
    el.style.opacity = '0.4';
    e.preventDefault();
  }, { passive: false });

  el.addEventListener('touchmove', (e) => {
    if (!touchClone) return;
    const touch = e.touches[0];
    touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
    touchClone.style.top = (touch.clientY - touchOffsetY) + 'px';

    document.querySelectorAll('.codename-slots .slot:not(.revealed):not(.filled)').forEach(s => {
      s.classList.remove('dragover');
    });
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('slot') && !target.classList.contains('revealed') && !target.classList.contains('filled')) {
      target.classList.add('dragover');
    }
    e.preventDefault();
  }, { passive: false });

  el.addEventListener('touchend', (e) => {
    if (!touchClone) return;
    document.body.removeChild(touchClone);
    touchClone = null;
    el.style.opacity = '1';
    document.querySelectorAll('.codename-slots .slot').forEach(s => s.classList.remove('dragover'));

    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('slot')) {
      handleDropOnSlot(target, dragData.letter, dragData.source);
    }
    dragData = null;
  }, { passive: false });

  el.addEventListener('click', () => {
    if (el.classList.contains('used')) return;
    const slots = document.querySelectorAll('.codename-slots .slot:not(.revealed):not(.filled)');
    if (slots.length === 0) { showToast('ไม่มีช่องว่างเหลือแล้ว!'); return; }
    if (slots.length === 1) {
      const slot = slots[0];
      const pos = parseInt(slot.dataset.pos);
      const expected = CODENAME[pos].toLowerCase();
      if (el.dataset.letter === expected) {
        placeLetter(slot, el, el.dataset.letter);
      } else {
        selectTileForPlacement(el);
      }
    } else {
      selectTileForPlacement(el);
    }
  });
}

let selectedTile = null;

function selectTileForPlacement(tile) {
  if (tile.classList.contains('used')) return;
  if (selectedTile) {
    selectedTile.style.outline = 'none';
  }
  selectedTile = tile;
  tile.style.outline = '3px solid #ffd200';
  showToast('คลิกช่องที่ต้องการวาง', 1500);

  document.querySelectorAll('.codename-slots .slot:not(.revealed):not(.filled)').forEach(slot => {
    slot.style.cursor = 'pointer';
    const handler = () => {
      const pos = parseInt(slot.dataset.pos);
      const expected = CODENAME[pos].toLowerCase();
      if (selectedTile.dataset.letter === expected) {
        placeLetter(slot, selectedTile, selectedTile.dataset.letter);
      } else {
        showToast('ตัวอักษรนี้ไม่ตรงกับช่องนี้!', 1200);
        slot.classList.add('wrong');
        setTimeout(() => slot.classList.remove('wrong'), 400);
      }
      selectedTile.style.outline = 'none';
      selectedTile = null;
      document.querySelectorAll('.codename-slots .slot:not(.revealed):not(.filled)').forEach(s => {
        s.style.cursor = '';
      });
      slot.removeEventListener('click', handler);
    };
    slot.addEventListener('click', handler, { once: true });
  });
}

function handleDropOnSlot(slot, letter, sourceEl) {
  if (slot.classList.contains('revealed') || slot.classList.contains('filled')) {
    showToast('ช่องนี้ถูกวางแล้ว', 800);
    return;
  }
  const pos = parseInt(slot.dataset.pos);
  const expected = CODENAME[pos].toLowerCase();
  if (letter === expected) {
    placeLetter(slot, sourceEl, letter);
  } else {
    slot.classList.add('wrong');
    showToast('ตัวอักษรนี้ไม่ตรงกับช่องนี้!', 1000);
    setTimeout(() => slot.classList.remove('wrong'), 400);
  }
}

function placeLetter(slot, tile, letter) {
  slot.textContent = letter.toUpperCase();
  slot.classList.add('filled');
  slot.dataset.letter = letter;
  tile.classList.add('used');
  tile.classList.remove('available');
  state.slotContents[slot.dataset.pos] = letter;
  saveState();
  showToast('✓ วางถูกต้อง!', 800);
  checkCodenameComplete();
}

function checkCodenameComplete() {
  const chars = CODENAME.split('');
  const allFilled = chars.every((ch, i) => {
    if (REVEALED_CHARS.has(ch)) return true;
    return state.slotContents[i] !== undefined;
  });
  if (allFilled) {
    celebrationMsg.textContent = 'คุณสามารถตามหาพี่รหัสเจอแล้ว! คำใบ้คือ ' + CODENAME;
    celebration.classList.add('show');
  }
}

function renderCodename() {
  codenameSlots.innerHTML = '';
  CODENAME.split('').forEach((ch, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.pos = i;

    if (REVEALED_CHARS.has(ch)) {
      slot.textContent = ch;
      slot.classList.add('revealed');
    } else if (state.slotContents[i] !== undefined) {
      slot.textContent = state.slotContents[i].toUpperCase();
      slot.classList.add('filled');
      slot.dataset.letter = state.slotContents[i];
    } else {
      slot.textContent = '?';
    }

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!slot.classList.contains('revealed') && !slot.classList.contains('filled')) {
        slot.classList.add('dragover');
      }
    });
    slot.addEventListener('dragleave', () => {
      slot.classList.remove('dragover');
    });
    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('dragover');
      if (!dragData || !dragData.source) return;
      const sourceTile = dragData.source;
      const letter = sourceTile.dataset.letter;
      if (!letter || sourceTile.classList.contains('used')) return;
      handleDropOnSlot(slot, letter, sourceTile);
    });

    codenameSlots.appendChild(slot);
  });

  renderLetterPool();
}

function renderLetterPool() {
  letterPool.innerHTML = '';

  const chars = CODENAME.split('');
  const needed = {};
  chars.forEach((ch, i) => {
    if (REVEALED_CHARS.has(ch)) return;
    ch = ch.toLowerCase();
    if (state.slotContents[i] !== undefined) return;

    let unlocked = false;
    for (const [alpha, positions] of Object.entries(REVEAL_MAP)) {
      if (positions.includes(i) && state.completed[alpha]) {
        unlocked = true;
        break;
      }
    }
    if (unlocked) {
      needed[ch] = (needed[ch] || 0) + 1;
    }
  });

  const placedCount = {};
  Object.values(state.slotContents).forEach(l => {
    placedCount[l] = (placedCount[l] || 0) + 1;
  });

  Object.entries(needed).forEach(([letter, count]) => {
    const alreadyPlaced = placedCount[letter] || 0;
    const toCreate = count - alreadyPlaced;
    for (let n = 0; n < toCreate; n++) {
      const tile = document.createElement('div');
      tile.className = 'letter-tile available';
      tile.textContent = letter.toUpperCase();
      tile.dataset.letter = letter;
      tile.dataset.uid = letter + '-' + n;
      initDragTile(tile, letter);
      letterPool.appendChild(tile);
    }
  });
}

function renderLetterGrid() {
  letterGrid.innerHTML = '';
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'letter-btn';
    btn.textContent = letter;

    const completed = state.completed[letter];
    const failed = state.failed[letter];

    if (completed) {
      btn.classList.add('completed');
      const mark = document.createElement('span');
      mark.className = 'check-mark';
      mark.textContent = '✓';
      btn.appendChild(mark);
    } else if (failed) {
      btn.classList.add('failed');
      const mark = document.createElement('span');
      mark.className = 'check-mark';
      mark.textContent = '✗';
      btn.appendChild(mark);
    }

    btn.addEventListener('click', async () => {
      await openQuestionPage(letter);
    });

    letterGrid.appendChild(btn);
  });
}

let currentQuestionLetter = null;
let currentAnswers = {};
let currentSubmitted = {};
let currentCorrect = {};

async function openQuestionPage(letter) {
  const res = await apiFetch(`/api/questions/${letter}?userName=${encodeURIComponent(state.userName)}`);
  if (!res || !res.ok) {
    showToast('ยังไม่มีโจทย์สำหรับตัวอักษรนี้', 1500);
    return;
  }
  const json = await res.json();
  if (json.dailyLimit) {
    showToast(json.error || 'วันนี้ทำครบ 1 ข้อแล้ว!', 3000);
    return;
  }
  if (!json.success || !json.questions || json.questions.length === 0) {
    showToast('ยังไม่มีโจทย์สำหรับตัวอักษรนี้', 1500);
    return;
  }
  QUESTIONS[letter] = json.questions;
  const questions = QUESTIONS[letter];

  currentQuestionLetter = letter;
  currentAnswers = {};
  currentSubmitted = {};
  currentCorrect = {};

  qLetterBadge.textContent = letter;
  qContainer.innerHTML = '';

  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `q-card-${idx}`;

    const optsHtml = q.options.map((opt, oi) => `
      <button class="option-btn" data-q="${idx}" data-opt="${oi}">
        <span class="opt-label">${String.fromCharCode(65 + oi)}</span>
        ${opt}
      </button>
    `).join('');

    card.innerHTML = `
      <div class="q-number">ข้อที่ ${idx + 1}</div>
      <div class="q-text">${q.q}</div>
      <div class="options">${optsHtml}</div>
      <div class="q-result" id="q-result-${idx}"></div>
    `;

    card.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qIdx = parseInt(btn.dataset.q);
        const optIdx = parseInt(btn.dataset.opt);
        if (currentSubmitted[qIdx]) return;

        card.querySelectorAll('.option-btn').forEach(b => {
          if (parseInt(b.dataset.q) === qIdx) {
            b.classList.remove('selected');
          }
        });
        btn.classList.add('selected');
        currentAnswers[qIdx] = optIdx;
      });
    });

    qContainer.appendChild(card);
  });

  const submitArea = document.createElement('div');
  submitArea.className = 'submit-area';
  submitArea.innerHTML = `
    <button class="btn-check" id="q-check-btn">ตรวจคำตอบ</button>
    <button class="btn-reset" id="q-reset-btn">ล้าง</button>
  `;
  qContainer.appendChild(submitArea);

  $('q-check-btn').onclick = checkQuestions;
  $('q-reset-btn').onclick = resetQuestions;

  showPage('page-question');
}

async function checkQuestions() {
  const questions = QUESTIONS[currentQuestionLetter];
  if (!questions) return;

  for (let idx = 0; idx < questions.length; idx++) {
    if (currentSubmitted[idx]) continue;
    const selected = currentAnswers[idx];
    if (selected === undefined) {
      const resultEl = $(`q-result-${idx}`);
      resultEl.textContent = 'กรุณาเลือกคำตอบก่อน';
      resultEl.className = 'q-result show fail';
      return;
    }
    currentSubmitted[idx] = true;
  }

  const answerList = questions.map((_, i) => currentAnswers[i]);
  const res = await apiFetch(`/api/check/${currentQuestionLetter}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: answerList, userName: state.userName }),
  });
  if (!res) {
    showToast('ไม่สามารถตรวจคำตอบได้ ลองอีกครั้ง', 1500);
    return;
  }
  const json = await res.json();
  if (json.dailyLimit) {
    showToast(json.error || 'วันนี้คุณทำโจทย์ครบ 1 ข้อแล้ว!', 3000);
    $('q-check-btn').disabled = true;
    $('q-check-btn').textContent = 'หมดวันนี้';
    return;
  }
  if (!json.success || !json.results) {
    showToast('ไม่สามารถตรวจคำตอบได้ ลองอีกครั้ง', 1500);
    return;
  }

  let allCorrect = true;
  json.results.forEach((correct, idx) => {
    currentCorrect[idx] = correct;
    const card = $(`q-card-${idx}`);
    const selected = currentAnswers[idx];
    card.querySelectorAll('.option-btn').forEach(btn => {
      const oi = parseInt(btn.dataset.opt);
      btn.classList.add('disabled');
      if (oi === selected && correct) btn.classList.add('correct');
      if (oi === selected && !correct) btn.classList.add('wrong');
    });
    const resultEl = $(`q-result-${idx}`);
    if (correct) {
      resultEl.textContent = '✓ ถูกต้อง!';
      resultEl.className = 'q-result show success';
    } else {
      resultEl.textContent = '✗ ผิด!';
      resultEl.className = 'q-result show fail';
      allCorrect = false;
    }
  });

  if (allCorrect) {
    state.completed[currentQuestionLetter] = true;
    delete state.failed[currentQuestionLetter];
    saveState();
    renderLetterGrid();
    renderCodename();
    celebrationMsg.textContent = `คุณปลดล็อคตัวอักษร ${currentQuestionLetter} สำเร็จ!`;
    celebration.classList.add('show');
    $('q-check-btn').disabled = true;
    $('q-check-btn').textContent = 'ผ่านแล้ว! ✓';
  } else {
    state.failed[currentQuestionLetter] = true;
    delete state.completed[currentQuestionLetter];
    saveState();
    renderLetterGrid();
    renderCodename();
    $('q-check-btn').disabled = false;
    $('q-check-btn').textContent = 'ลองใหม่';
    $('q-check-btn').onclick = resetAndRetry;
    showToast('✗ ยังไม่ถูกต้อง ลองใหม่!', 2000);
  }
}

function resetAndRetry() {
  const questions = QUESTIONS[currentQuestionLetter];
  currentAnswers = {};
  currentSubmitted = {};
  currentCorrect = {};
  delete state.failed[currentQuestionLetter];

  questions.forEach((q, idx) => {
    const card = $(`q-card-${idx}`);
    card.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('selected', 'correct', 'wrong', 'disabled');
    });
    const resultEl = $(`q-result-${idx}`);
    resultEl.className = 'q-result';
    resultEl.textContent = '';
  });

  $('q-check-btn').disabled = false;
  $('q-check-btn').textContent = 'ตรวจคำตอบ';
  $('q-check-btn').onclick = checkQuestions;
  renderLetterGrid();
}

function resetQuestions() {
  const questions = QUESTIONS[currentQuestionLetter];
  currentAnswers = {};
  currentSubmitted = {};
  currentCorrect = {};

  questions.forEach((q, idx) => {
    const card = $(`q-card-${idx}`);
    card.querySelectorAll('.option-btn').forEach(btn => {
      btn.classList.remove('selected', 'correct', 'wrong', 'disabled');
    });
    const resultEl = $(`q-result-${idx}`);
    resultEl.className = 'q-result';
    resultEl.textContent = '';
  });

  $('q-check-btn').disabled = false;
  $('q-check-btn').textContent = 'ตรวจคำตอบ';
  $('q-check-btn').onclick = checkQuestions;
  delete state.failed[currentQuestionLetter];
  renderLetterGrid();
}

loginBtn.addEventListener('click', async () => {
  if (!configReady) await new Promise(r => { const t = setInterval(() => { if (configReady) { clearInterval(t); r(); } }, 50); });
  const name = nameInput.value.trim();
  if (!name) { showToast('กรุณากรอกชื่อก่อน'); return; }

  state.userName = name;

  const local = loadLocal(name);
  if (local) {
    state.completed = local.completed || {};
    state.failed = local.failed || {};
    state.slotContents = local.slotContents || {};
  } else {
    try {
      const res = await apiFetch(`/api/state/${encodeURIComponent(name)}`);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          state.completed = json.data.completed || {};
          state.failed = json.data.failed || {};
          state.slotContents = json.data.slotContents || {};
        }
      }
    } catch (e) {}
    saveState();
  }

  enterMain();
  saveState();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});

logoutBtn.addEventListener('click', async () => {
  await clearState();
  nameInput.value = '';
  showPage('page-login');
});

qBackBtn.addEventListener('click', () => {
  renderLetterGrid();
  renderCodename();
  showPage('page-main');
});

celebrationOk.addEventListener('click', () => {
  celebration.classList.remove('show');
  renderLetterGrid();
  renderCodename();
  showPage('page-main');
});

async function enterMain() {
  displayName.textContent = state.userName;
  $('welcome-name').textContent = 'น้อง' + state.userName;
  renderCodename();
  renderLetterGrid();
  showPage('page-main');
}

function startMatrix() {
  const canvas = document.getElementById('matrix-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, cols, drops;

  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    cols = Math.floor(w / 14);
    drops = Array(cols).fill(1);
  }
  resize();
  addEventListener('resize', resize);

  function draw() {
    ctx.fillStyle = 'rgba(10,14,20,0.05)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#00ff41';
    ctx.font = '13px monospace';
    for (let i = 0; i < drops.length; i++) {
      const text = Math.random() > 0.5 ? '1' : '0';
      ctx.fillText(text, i * 14, drops[i] * 14);
      if (drops[i] * 14 > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(draw, 50);
}

async function init() {
  try {
    const res = await apiFetch('/api/config');
    if (res) {
      const json = await res.json();
      if (json.success) {
        CODENAME = json.codename;
        REVEALED_CHARS = new Set(json.revealedChars);
        REVEAL_MAP = json.revealMap;
      }
    }
  } catch (e) {}
  configReady = true;
  startMatrix();
  showPage('page-login');
}

init();
