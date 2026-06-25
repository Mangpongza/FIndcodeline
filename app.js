const CODENAME = "scorpiong_";
const REVEALED_CHARS = new Set(['_']);

const REVEAL_MAP = {
  'S': [0],
  'C': [1],
  'O': [2, 6],
  'R': [3],
  'P': [4],
  'I': [5],
  'N': [7],
  'G': [8]
};

const QUESTIONS = {};

function addQ(letter, q, opts, ans) {
  if (!QUESTIONS[letter]) QUESTIONS[letter] = [];
  QUESTIONS[letter].push({ q, options: opts, answer: ans });
}

addQ('S', "พี่รหัสเกิดวันที่เท่าไหร่?", ["1 ม.ค.", "15 พ.ค.", "12 ส.ค.", "25 ธ.ค."], 0);
addQ('S', "พี่รหัสชอบสัตว์อะไร?", ["แมว", "หมา", "กระต่าย", "ปลา"], 0);
addQ('C', "พี่รหัสเรียนคณะอะไร?", ["วิศวกรรมศาสตร์", "วิทยาศาสตร์", "ศิลปศาสตร์", "นิเทศศาสตร์"], 1);
addQ('C', "พี่รหัสสีที่ชอบคือ?", ["แดง", "น้ำเงิน", "เขียว", "ชมพู"], 0);
addQ('O', "พี่รหัสชอบกินอะไร?", ["ข้าวผัด", "ก๋วยเตี๋ยว", "ส้มตำ", "พิซซ่า"], 2);
addQ('O', "พี่รหัสงานอดิเรกคือ?", ["อ่านหนังสือ", "เล่นเกม", "ดูหนัง", "ฟังเพลง"], 1);
addQ('R', "พี่รหัสเรียนปีอะไร?", ["ปี 1", "ปี 2", "ปี 3", "ปี 4"], 2);
addQ('R', "พี่รหัสอายุเท่าไหร่?", ["19", "20", "21", "22"], 1);
addQ('P', "พี่รหัสชอบดนตรีแนวไหน?", ["ป๊อป", "ร็อค", "ฮิปฮอป", "แจ๊ส"], 0);
addQ('P', "พี่รหัสรุ่นอะไร?", ["รุ่น 65", "รุ่น 66", "รุ่น 67", "รุ่น 68"], 2);
addQ('I', "พี่รหัสชอบวิชาอะไร?", ["คณิต", "ฟิสิกส์", "เคมี", "ชีวะ"], 3);
addQ('I', "พี่รหัสเป็นคนจังหวัดอะไร?", ["กรุงเทพ", "เชียงใหม่", "ขอนแก่น", "ภูเก็ต"], 0);
addQ('N', "พี่รหัสชอบเที่ยวที่ไหน?", ["ทะเล", "ภูเขา", "ป่า", "ต่างประเทศ"], 0);
addQ('N', "พี่รหัสชอบกีฬาอะไร?", ["ฟุตบอล", "บาสเก็ตบอล", "ว่ายน้ำ", "วิ่ง"], 2);
addQ('G', "พี่รหัสชอบดูหนังแนวไหน?", ["แอคชั่น", "คอมเมดี้", "สยองขวัญ", "รักโรแมนติก"], 1);
addQ('G', "พี่รหัสมื้อโปรดคือ?", ["เช้า", "กลางวัน", "เย็น", "ดึก"], 2);
addQ('A', "พี่รหัสชอบฤดูอะไร?", ["ร้อน", "ฝน", "หนาว", "ไม่ชอบเลย"], 2);
addQ('A', "พี่รหัสตื่นกี่โมง?", ["6 โมง", "8 โมง", "10 โมง", "เที่ยง"], 0);
addQ('B', "พี่รหัสชอบผลไม้อะไร?", ["มะม่วง", "แตงโม", "เงาะ", "ทุเรียน"], 1);
addQ('B', "พี่รหัสดื่มอะไรตอนเช้า?", ["กาแฟ", "ชา", "นม", "น้ำเปล่า"], 0);
addQ('D', "พี่รหัสชอบใส่เสื้อสีอะไร?", ["ดำ", "ขาว", "เทา", "สีสันสดใส"], 2);
addQ('D', "พี่รหัสเรียนพิเศษอะไร?", ["พิเศษไม่เรียน", "ภาษา", "ดนตรี", "กีฬา"], 0);
addQ('E', "พี่รหัสชอบเล่นเกมไหม?", ["ไม่เล่นเลย", "เล่นบางครั้ง", "เล่นบ่อย", "ติดเกม"], 1);
addQ('E', "พี่รหัสขับรถมาเรียน?", ["ขับ", "นั่งรถเมล์", "รถไฟฟ้า", "มีคนไปส่ง"], 2);
addQ('F', "พี่รหัสชอบอากาศแบบไหน?", ["ร้อน", "เย็น", "อบอุ่น", "ไม่สน"], 1);
addQ('F', "พี่รหัสชอบออกกำลังกายไหม?", ["ไม่ชอบ", "ชอบบ้าง", "ชอบมาก", "ทุกวัน"], 2);
addQ('H', "พี่รหัสชอบเพลงภาษาไหน?", ["ไทย", "สากล", "ญี่ปุ่น", "เกาหลี"], 0);
addQ('H', "พี่รหัสเล่นดนตรีได้ไหม?", ["ไม่ได้", "ได้นิดหน่อย", "ได้ดี", "เป็นมืออาชีพ"], 1);
addQ('J', "พี่รหัสชอบคาแรกเตอร์ไหน?", ["การ์ตูน", "ซุปเปอร์ฮีโร่", "อนิเมะ", "ไม่สน"], 2);
addQ('J', "พี่รหัสสะสมอะไร?", ["ไม่สะสม", "สติ๊กเกอร์", "รองเท้า", "ฟิกเกอร์"], 3);
addQ('K', "พี่รหัสชอบไปเที่ยวกับใคร?", ["เพื่อน", "แฟน", "ครอบครัว", "คนเดียว"], 0);
addQ('K', "พี่รหัสชอบคาราโอเกะไหม?", ["ไม่ชอบ", "ชอบบ้าง", "ชอบมาก", "ไม่เคยลอง"], 1);
addQ('L', "พี่รหัสชอบดูซีรี่ส์ไหม?", ["ไม่ดู", "ดูบ้าง", "ดูบ่อย", "มาราธอน"], 2);
addQ('L', "พี่รหัสชอบหมาแมว?", ["หมา", "แมว", "ทั้งคู่", "ไม่ชอบ"], 1);
addQ('M', "พี่รหัสเรียนสายอะไร?", ["วิทย์", "ศิลป์", "คณิต", "ภาษา"], 0);
addQ('M', "พี่รหัสถนัดมืออะไร?", ["ขวา", "ซ้าย", "ทั้งคู่", "ไม่แน่ใจ"], 0);
addQ('Q', "พี่รหัสชอบเลข?", ["ชอบ", "เฉยๆ", "ไม่ชอบ", "เกลียด"], 1);
addQ('Q', "พี่รหัสชอบปริศนา?", ["ชอบ", "ไม่ชอบ", "เฉยๆ", "ไม่แน่ใจ"], 0);
addQ('T', "พี่รหัสมักจะนอนกี่ทุ่ม?", ["3 ทุ่ม", "4 ทุ่ม", "5 ทุ่ม", "เที่ยงคืน"], 1);
addQ('T', "พี่รหัสเป็นคนสาย?", ["ไม่สาย", "บ้างบางครั้ง", "สายบ่อย", "สายตลอด"], 2);
addQ('U', "พี่รหัสชอบอาหารคาวหรือหวาน?", ["คาว", "หวาน", "ทั้งคู่", "ไม่ชอบกิน"], 1);
addQ('U', "พี่รหัสชอบทะเลหรือภูเขา?", ["ทะเล", "ภูเขา", "ทั้งคู่", "ไม่ชอบ"], 0);
addQ('V', "พี่รหัสชอบภาษาไทย?", ["ชอบมาก", "ชอบ", "เฉยๆ", "ไม่ชอบ"], 1);
addQ('V', "พี่รหัสอยากไปต่างประเทศ?", ["อยากไป", "ไม่อยาก", "ไปแล้ว", "ไม่สน"], 0);
addQ('W', "พี่รหัสชอบน้องหมา?", ["รักมาก", "ชอบ", "เฉยๆ", "ไม่ชอบ"], 0);
addQ('W', "พี่รหัสมีสัตว์เลี้ยง?", ["มีแมว", "มีหมา", "มีทั้งคู่", "ไม่มี"], 3);
addQ('X', "พี่รหัสชอบเทศกาลอะไรมากที่สุด?", ["สงกรานต์", "ปีใหม่", "ลอยกระทง", "คริสต์มาส"], 2);
addQ('X', "พี่รหัสชอบทำอาหาร?", ["ชอบ", "ไม่ชอบ", "พอได้", "เก่งมาก"], 2);
addQ('Y', "พี่รหัสชอบสีห้อง?", ["สว่าง", "มืด", "สีสัน", "ไม่สน"], 0);
addQ('Y', "พี่รหัสชอบอ่านการ์ตูน?", ["อ่าน", "ไม่อ่าน", "บางเรื่อง", "สะสม"], 1);
addQ('Z', "พี่รหัสชอบโซเชียลมีเดียไหน?", ["IG", "TikTok", "FB", "X"], 1);
addQ('Z', "พี่รหัสเล่นเกมอะไร?", ["ไม่เล่น", "Rov", "Valorant", "Among Us"], 2);

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

async function saveState() {
  if (!state.userName) return;
  const data = {
    userName: state.userName,
    completed: state.completed,
    failed: state.failed,
    slotContents: state.slotContents,
  };
  try {
    await fetch(`/api/state/${encodeURIComponent(state.userName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn('saveState error:', e);
  }
}

async function loadState(userName) {
  try {
    const res = await fetch(`/api/state/${encodeURIComponent(userName)}`);
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
  if (state.userName) {
    try {
      await fetch(`/api/state/${encodeURIComponent(state.userName)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('clearState error:', e);
    }
  }
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

    btn.addEventListener('click', () => {
      openQuestionPage(letter);
    });

    letterGrid.appendChild(btn);
  });
}

let currentQuestionLetter = null;
let currentAnswers = {};
let currentSubmitted = {};
let currentCorrect = {};

function openQuestionPage(letter) {
  const questions = QUESTIONS[letter];
  if (!questions || questions.length === 0) {
    showToast('ยังไม่มีโจทย์สำหรับตัวอักษรนี้', 1500);
    return;
  }

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

  const newCheck = $('q-check-btn').cloneNode(true);
  $('q-check-btn').parentNode.replaceChild(newCheck, $('q-check-btn'));
  newCheck.id = 'q-check-btn';
  newCheck.addEventListener('click', checkQuestions);

  const newReset = $('q-reset-btn').cloneNode(true);
  $('q-reset-btn').parentNode.replaceChild(newReset, $('q-reset-btn'));
  newReset.id = 'q-reset-btn';
  newReset.addEventListener('click', resetQuestions);

  showPage('page-question');
}

function checkQuestions() {
  const questions = QUESTIONS[currentQuestionLetter];
  let allCorrect = true;

  questions.forEach((q, idx) => {
    if (currentSubmitted[idx]) return;

    const selected = currentAnswers[idx];
    if (selected === undefined) {
      const resultEl = $(`q-result-${idx}`);
      resultEl.textContent = 'กรุณาเลือกคำตอบก่อน';
      resultEl.className = 'q-result show fail';
      allCorrect = false;
      return;
    }

    currentSubmitted[idx] = true;
    const correct = selected === q.answer;
    currentCorrect[idx] = correct;

    const card = $(`q-card-${idx}`);
    card.querySelectorAll('.option-btn').forEach(btn => {
      const oi = parseInt(btn.dataset.opt);
      btn.classList.add('disabled');
      if (oi === q.answer) btn.classList.add('correct');
      if (oi === selected && oi !== q.answer) btn.classList.add('wrong');
    });

    const resultEl = $(`q-result-${idx}`);
    if (correct) {
      resultEl.textContent = '✓ ถูกต้อง!';
      resultEl.className = 'q-result show success';
    } else {
      resultEl.textContent = '✗ ผิด! คำตอบที่ถูกต้องคือ ' + q.options[q.answer];
      resultEl.className = 'q-result show fail';
      allCorrect = false;
    }
  });

  const allSubmitted = questions.every((_, idx) => currentSubmitted[idx]);
  if (allSubmitted) {
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
  const name = nameInput.value.trim();
  if (!name) { showToast('กรุณากรอกชื่อก่อน'); return; }

  const exists = await loadState(name);
  if (!exists) {
    state.userName = name;
    state.completed = {};
    state.failed = {};
    state.slotContents = {};
    await saveState();
  }

  await enterMain();
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
  renderCodename();
  renderLetterGrid();
  showPage('page-main');
}

async function init() {
  showPage('page-login');
}

init();
