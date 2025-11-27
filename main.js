// frontend/app.js

// --- Configuration ---
const GRID_SIZE = 10; // 10x10
const WORDS = {
  Backend: [
  "CATALYST","DATASTORE","FUNCTIONS","CRON","CACHE","REST",
  "SERVERLESS","AUTH","API","WEBHOOK","TRIGGERS","LOGGER","QUEUE",
  "ZCQL","ADVANCEDIO","BASICIO","EVENT","CRON","STRATUS","NOSQL",
  "SIGNALS","DATABASE","SQL","NOSQL","MIDDLEWARE","SESSION",
  "JWT","OAUTH","NODE","POSTGRES","DEVOPS","JOB","SMARTBROWZ",
  "ENDPOINT","JSON","CLOUDSCALE","STRATUS","SLATE","SIGNALS","NOSQL"
  ],
  Frontend: [
  "CATALYST","WEBCLIENT","HOSTING","AUTHENTICATION","DOM","TEMPLATE","STYLES","COMPONENT",
  "HOOKS","VIRTUALDOM","CSS","HTML","REACT","STATE","PROPS","EVENTS","CONTEXT","ROUTER",
  "BUTTON","INPUT","FORM","SLATE","SIGNALS","STRATUS",
  "REACT","VUE","RESPONSIVE","SMARTBROWZ","SMARTBROWZ"
  ],
  "AI/ML": [
  "CATALYST","AUTOML","FACEANALYTICS","IMAGEMODERATION","OCR","PIPELINE",
  "MODEL","TRAIN","LOSS","OPTIMIZER","DATASET","EPOCH","BATCH","INFER","FEATURE",
  ,"DATASET","SUPERVISED","UNSUPERVISED","REGRESSION",
  "KERAS","PYTORCH","SKLEARN","TENSOR","ACTIVATION","CONVOLUTION","POOLING",
  "OVERFITTING","UNDERFITTING","QUIKML","LLM","RAG","CONVOKRAFT",
  "NEURAL","CLUSTER","ALGORITHM","ZIA"
  ],
  Cloud: [
  "CATALYST","PIPELINE","CLUSTER","SCALE","CICD","DOCKER","BACKUP",
  "IAM","DNS","CONTAINER","DOCKER","POD","SERVICE","DEPLOY",
  "SUBNET","ECS","EKS","STORAGE","SCALING","ADVANCEDIO","BASICIO",
  ,"DEVOPS","MONITORING","TRIGGER","CUSTOM","RUNTIME"
  ],
  General: [
  "CATALYST","FUNCTIONS","DATASTORE","CRON","CACHE","FILES","QUEUE","NOTIFY","SEARCH",
  "EMAIL","AUTH","MONITORING","ANALYTICS","LOGS","REPORT","WEBHOOK","SDK","API",
  "CONFIG","TRIGGER","ROLE","PERMISSION","VERSION","ZCQL","ADVANCEDIO",
  "BASICIO","SIGNALS","SLATE","STRATUS","CONVOKRAFT",
  "QUIKML","LLM","RAG","JOBFUNCTION","DEVOPS","NOSQL",
  "JSON","SERVERLESS","AUTOMATION"
  ]
  };
  
  
  
  
  
  
  
  
  
  
  

// --- UI elements ---
const chooseScreen = document.getElementById('choose-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('startBtn');
const streamButtons = document.querySelectorAll('.stream-btn');
const gridEl = document.getElementById('grid');
const wordListEl = document.getElementById('wordList');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const backBtn = document.getElementById('backBtn');
const currentStreamEl = document.getElementById('currentStream');
const usernameEl = document.getElementById('username');
const clearBtn = document.getElementById('clearSelection');
const checkBtn = document.getElementById('checkSelection');
const leaderboardList = document.getElementById('leaderboardList');
const submitBtn = document.getElementById('submitBtn');

let currentStream = null;
let puzzleWords = [];
let grid = [];
let selectedTiles = [];
let foundWords = new Set();
let score = 0;
let startTime = null;
let timerInterval = null;

// Quick helper to show screens
function showScreen(screen){
  chooseScreen.classList.toggle('active', screen === 'choose');
  gameScreen.classList.toggle('active', screen === 'game');
}

// build empty grid data structure
function makeEmptyGrid(){
  const arr = new Array(GRID_SIZE).fill(0).map(()=> new Array(GRID_SIZE).fill(''));
  return arr;
}

// place words into grid, naive placer: tries random pos/dir until success
function placeWords(wordList){
  const localGrid = makeEmptyGrid();
  const placed = [];

  const dirs = [
    {dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1},
    {dx:1,dy:1},{dx:-1,dy:-1},{dx:1,dy:-1},{dx:-1,dy:1}
  ];

  for(const w of wordList){
    const word = w.toUpperCase();
    let placedOk=false;
    for(let attempt=0; attempt<300 && !placedOk; attempt++){
      const dir = dirs[Math.floor(Math.random()*dirs.length)];
      const len = word.length;
      const maxX = GRID_SIZE;
      const maxY = GRID_SIZE;
      const startX = Math.floor(Math.random()*maxX);
      const startY = Math.floor(Math.random()*maxY);

      const endX = startX + dir.dx*(len-1);
      const endY = startY + dir.dy*(len-1);
      if(endX < 0 || endX >= GRID_SIZE || endY < 0 || endY >= GRID_SIZE) continue;

      // check conflicts
      let conflict=false;
      for(let i=0;i<len;i++){
        const x = startX + dir.dx*i;
        const y = startY + dir.dy*i;
        const cell = localGrid[y][x];
        if(cell === '' || cell === word[i]) continue;
        conflict = true;
        break;
      }
      if(conflict) continue;

      // place
      for(let i=0;i<len;i++){
        const x = startX + dir.dx*i;
        const y = startY + dir.dy*i;
        localGrid[y][x] = word[i];
      }
      placedOk=true;
      placed.push({word, startX, startY, dir});
    }

    if(!placedOk){
      console.warn("Failed to place", w);
    }
  }

  // fill blanks
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for(let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){
      if(localGrid[y][x] === '') localGrid[y][x] = letters[Math.floor(Math.random()*letters.length)];
    }
  }

  return {grid:localGrid, placed};
}

// render grid to DOM
function renderGrid(gridData){
  gridEl.innerHTML = '';
  for(let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.x = x;
      tile.dataset.y = y;
      tile.dataset.letter = gridData[y][x];
      tile.textContent = gridData[y][x];
      tile.addEventListener('click', tileClicked);
      attachTileEvents(tile);
      gridEl.appendChild(tile);
    }
  }
}

function attachTileEvents(tile) {
  // Click selection
  tile.addEventListener("click", tileClicked);

  // Mouse drag
  tile.addEventListener("mousedown", tileDragStart);
  tile.addEventListener("mouseenter", tileDragEnter);
  tile.addEventListener("mouseup", tileDragEnd);

  // Touch drag
  tile.addEventListener("touchstart", tileDragStart, { passive: false });
  tile.addEventListener("touchmove", tileDragTouchMove, { passive: false });
  tile.addEventListener("touchend", tileDragEnd, { passive: false });
}

// Shared selection logic
function selectTile(tile) {
  const key = `${tile.dataset.x},${tile.dataset.y}`;
  if (!selectedTiles.includes(key)) {
    selectedTiles.push(key);
    tile.classList.add("selected");
  }
}

// tile click handler
function tileClicked(e){
  const t = e.currentTarget;
  
  const key = `${t.dataset.x},${t.dataset.y}`;
  // toggle selection if last clicked
  if(selectedTiles.length>0 && selectedTiles[selectedTiles.length-1] === key){
    selectedTiles.pop();
    t.classList.remove('selected');
  } else {
    selectedTiles.push(key);
    t.classList.add('selected');
  }
}

// ===========================
// GLOBAL STATE
// ===========================

let isDragging = false;
let lastTileKey = null;


// ===========================
// EVENT LISTENERS FOR EACH TILE
// Call this when generating each tile
// ===========================
function attachTileEvents(tile) {
  // click selection
  tile.addEventListener("click", tileClicked);

  // mouse drag
  tile.addEventListener("mousedown", tileDragStart);
  tile.addEventListener("mouseenter", tileDragEnter);
  tile.addEventListener("mouseup", tileDragEnd);

  // touch drag
  tile.addEventListener("touchstart", tileDragStart, { passive: false });
  tile.addEventListener("touchmove", tileDragTouchMove, { passive: false });
  tile.addEventListener("touchend", tileDragEnd, { passive: false });
}


// ===========================
// DRAG SELECTION START
// ===========================
function tileDragStart(e) {
  e.preventDefault();
  isDragging = true;

  const tile = e.currentTarget;
  selectTile(tile);
}


// ===========================
// DRAG MOVE (mouse enter)
// ===========================
function tileDragEnter(e) {
  if (!isDragging) return;

  const tile = e.currentTarget;
  selectTile(tile);
}


// ===========================
// DRAG MOVE (touch move)
// ===========================
function tileDragTouchMove(e) {
  if (!isDragging) return;

  const touch = e.touches[0];
  const elem = document.elementFromPoint(touch.clientX, touch.clientY);

  if (elem && elem.classList.contains("tile")) {
    selectTile(elem);
  }
}


// ===========================
// DRAG END
// ===========================
function tileDragEnd() {
  if (isDragging) {
    checkSelection(); // auto-check word after dragging
  }
  isDragging = false;
  lastTileKey = null;
}


// ===========================
// SHARED SELECT FUNCTION
// Used by click + drag
// ===========================
function selectTile(tile) {
  const key = `${tile.dataset.x},${tile.dataset.y}`;

  // avoid selecting same tile twice in a row
  if (lastTileKey === key) return;

  if (!selectedTiles.includes(key)) {
    selectedTiles.push(key);
    tile.classList.add("selected");
  }

  lastTileKey = key;
}


// ===========================
// GET SELECTED WORD
// ===========================
function getSelectedWord() {
  return selectedTiles
    .map(k => {
      const [x, y] = k.split(',').map(Number);
      return grid[y][x];
    })
    .join('');
}


// ===========================
// CHECK SELECTION
// ===========================
function checkSelection() {
  const s = getSelectedWord();
  if (!s) return;

  const reversed = s.split('').reverse().join('');

  for (const pw of puzzleWords) {
    if (foundWords.has(pw)) continue;

    if (s === pw || reversed === pw) {
      markWordFound(pw);
      clearSelectionUI();
      return;
    }
  }

  // no match
  clearSelectionUI();
}


// ===========================
// MARK WORD FOUND
// Highlights exactly the selected tiles
// ===========================
function markWordFound() {
  selectedTiles.forEach(key => {
    const [x, y] = key.split(',').map(Number);
    const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
    if (tile) {
      tile.classList.remove("selected");
      tile.classList.add("found");
    }
  });
}


// ===========================
// CLEAR SELECTION UI
// ===========================
function clearSelectionUI() {
  document.querySelectorAll(".selected").forEach(t => t.classList.remove("selected"));
  selectedTiles = [];
  lastTileKey = null;
}


// builds the currently selected word string
function getSelectedWord(){
  return selectedTiles.map(k=>{
    const [x,y] = k.split(',').map(Number);
    return grid[y][x];
  }).join('');
}

function checkSelection() {
  const s = getSelectedWord();
  if (!s) return;

  const reversed = s.split('').reverse().join('');

  for (const pw of puzzleWords) {
    if (foundWords.has(pw)) continue;

    // forward or backward match
    if (s === pw || reversed === pw) {
      markWordFound(pw, s === pw);  // pass direction information
      clearSelectionUI();
      return;
    }
  }

  // no match → clear
  clearSelectionUI();
}



// mark word found visually and update score
function markWordFound(word){
  foundWords.add(word);
  // mark grid tiles that belong to that word as found
  // we find coordinates by searching the grid string matches of that word or its reverse
  const joinedRows = grid.map(row=>row.join('')).join('\n');
  // brute force search across all grid positions
  for(let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){
      for(const dir of [{dx:1,dy:0},{dx:0,dy:1},{dx:1,dy:1},{dx:-1,dy:0},{dx:0,dy:-1},{dx:-1,dy:-1},{dx:1,dy:-1},{dx:-1,dy:1}]){
        let match=true;
        for(let i=0;i<word.length;i++){
          const nx = x + dir.dx*i, ny = y + dir.dy*i;
          if(nx<0||ny<0||nx>=GRID_SIZE||ny>=GRID_SIZE){ match=false; break; }
          if(grid[ny][nx] !== word[i]){ match=false; break;}
        }
        if(match){
          // mark those tiles
          for(let i=0;i<word.length;i++){
            const nx = x + dir.dx*i, ny = y + dir.dy*i;
            const selector = `.tile[data-x="${nx}"][data-y="${ny}"]`;
            const tile = document.querySelector(selector);
            if(tile) tile.classList.add('found');
          }
        }
      }
    }
  }

  // update sidebar
  const li = document.querySelector(`li[data-word="${word}"]`);
  if(li) li.classList.add('found');

  // update score/time
  score += 100;
  scoreEl.textContent = score;

  // if all found, finish game
  if(foundWords.size >= puzzleWords.length){
    finishGame();
  }
}

// clear UI selection
function clearSelectionUI(){
  selectedTiles.forEach(k=>{
    const [x,y] = k.split(',').map(Number);
    const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
    if(tile) tile.classList.remove('selected');
  });
  selectedTiles = [];
}

// fill word sidebar
function renderWordList(words){
  wordListEl.innerHTML = '';
  for(const w of words){
    const li = document.createElement('li');
    li.dataset.word = w;
    li.textContent = w;
    wordListEl.appendChild(li);
  }
}

// timer helpers
function startTimer(){
  startTime = Date.now();
  timerInterval = setInterval(()=>{
    const t = Math.floor((Date.now() - startTime)/1000);
    const mm = String(Math.floor(t/60)).padStart(2,'0');
    const ss = String(t%60).padStart(2,'0');
    timerEl.textContent = `${mm}:${ss}`;
  }, 500);
}
function stopTimer(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

// finish game: send result to backend
async function finishGame(gaveUp = false) {
  stopTimer();
  const timeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const username = (usernameEl.value || 'Anonymous').trim();

  let finalScore = gaveUp ? Math.floor(score / 2) : score;

  const payload = {
    username,
    score: finalScore,
    stream: currentStream,
    timeSeconds,
    gaveUp
  };

  try {
    // ⭐ THIS IS THE CORRECT PLACE FOR THE FETCH CALL
    await fetch('https://new-60047188228.development.catalystserverless.in/server/new_function/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        score: finalScore,
        stream: currentStream,
        timeSeconds,
        gaveUp
      })
    });
    

    await loadLeaderboard(); // Refresh UI leaderboard

    if (gaveUp) {
      alert(`You gave up! Score submitted: ${finalScore}`);
    } else {
      alert(`Well done ${username}! Finished in ${timeSeconds}s — Score: ${finalScore}`);
    }

    showScreen('choose');
  } catch (err) {
    console.error("Update leaderboard error:", err);
    alert("Game finished, but leaderboard update failed.");
    showScreen('choose');
  }
}


async function loadLeaderboard() {
  try {
    const res = await fetch("https://new-60047188228.development.catalystserverless.in/server/new_function/leaderboard");
    const data = await res.json();

    const leaderboard = data.leaderboard.map(entry => entry.quest);

    console.log("Fixed leaderboard:", leaderboard);

    renderLeaderboard(leaderboard);
  } catch (err) {
    console.error("Failed to load leaderboard", err);
  }
}

function renderLeaderboard(entries) {
  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";

  entries.forEach((e, index) => {
      const div = document.createElement("div");
      div.classList.add("leaderboard-item");

      if (index === 0) div.classList.add("rank-1");
      if (index === 1) div.classList.add("rank-2");
      if (index === 2) div.classList.add("rank-3");

      div.innerHTML = `
          <span class="col-rank">${index + 1}</span>
          <span class="col-name">${e.username}</span>
          <span class="col-score">${e.score}</span>
          <span>${e.timeseconds}s</span>
      `;

      list.appendChild(div);
  });
}




// Place this AFTER defining the function
window.onload = loadLeaderboard;

// --- STREAM BUTTON INSTANT START ---
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".stream-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const stream = btn.dataset.stream;

      document.getElementById("currentStream").textContent = stream;

      document.getElementById("choose-screen").classList.remove("active");
      document.getElementById("game-screen").classList.add("active");

      startPuzzle(stream); 
    });
  });
});


// start new puzzle
function startPuzzle(stream){
  currentStream = stream;
  currentStreamEl.textContent = stream;

  const pool = WORDS[stream] || WORDS.Backend;
  const shuffled = pool.slice().sort(()=>Math.random()-0.5);
  puzzleWords = shuffled.slice(0,6).map(s=>s.toUpperCase()); // easier

  foundWords = new Set();
  score = 0;
  scoreEl.textContent = '0';

  renderWordList(puzzleWords);

  const placed = placeWords(puzzleWords);
  grid = placed.grid;

  renderGrid(grid);
  showScreen('game');

  clearSelectionUI();
  stopTimer();
  startTimer();
  loadLeaderboard();
}

// event wiring


backBtn.addEventListener('click', () => {
  stopTimer();
  showScreen('choose');
});

clearBtn.addEventListener('click', clearSelectionUI);
checkBtn.addEventListener('click', checkSelection);

submitBtn.addEventListener('click', () => {
  if(confirm("Are you sure? Your score will be submitted.")) {
    finishGame(true);
  }
});

// initial
showScreen('choose');
loadLeaderboard();

