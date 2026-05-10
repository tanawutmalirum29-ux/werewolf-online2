function renderRoom(data){

  GameState.room = data;

  if(!data) return;

  document.getElementById("roomCode").innerText = data.roomCode;

  const stats = getStats(data.players);
  document.getElementById("stats").innerText =
    `รอด ${stats.alive} | ตาย ${stats.dead}`;

  renderPlayers();
  renderLogs();

}

/* =========================
   PLAYERS RENDER
========================= */

function renderPlayers(){

  const el = document.getElementById("players");
  el.innerHTML = "";

  GameState.room.players.forEach(p=>{

    initPlayerMemory(p);

    el.innerHTML += `
      <div class="player">

        <b>${p.name}</b>
        <div>${p.role || "-"}</div>
        <div>${p.alive ? "🟢" : "🔴"}</div>

        <div>
          Action: ${p.action || "-"}
        </div>

        <button onclick="uiKill('${p.name}')">ฆ่า</button>
        <button onclick="uiRevive('${p.name}')">ชุบ</button>

        <button onclick="uiToggle('${p.name}','killed')">🩸</button>
        <button onclick="uiToggle('${p.name}','protected')">🛡️</button>

        <textarea onchange="uiNote('${p.name}',this.value)">
          ${p.memory.notes}
        </textarea>

      </div>
    `;

  });

}

/* =========================
   LOGS
========================= */

function renderLogs(){

  const el = document.getElementById("logs");
  el.innerHTML = "";

  formatLogs(GameState.room.logs).forEach(l=>{
    el.innerHTML += `<div>[${l.time}] ${l.text}</div>`;
  });

}

/* =========================
   UI ACTIONS (NO SOCKET)
========================= */

function uiKill(name){
  netKill(name);
}

function uiRevive(name){
  netRevive(name);
}

function uiToggle(name,type){
  netToggle(name,type);
}

function uiNote(name,value){
  netNote(name,value);
}

function uiSetPhase(phase){
  netPhase(phase);
}