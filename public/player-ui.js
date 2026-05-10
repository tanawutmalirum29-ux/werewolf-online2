let room = null;
let myName = "";
let started = false;

/* =========================
   UI NAV
========================= */

function show(page){
  document.getElementById("joinPage").classList.add("hidden");
  document.getElementById("lobbyPage").classList.add("hidden");
  document.getElementById("gamePage").classList.add("hidden");

  document.getElementById(page).classList.remove("hidden");
}

/* =========================
   JOIN
========================= */

function uiJoin(){
  const name = document.getElementById("name").value.trim();
  const roomCode = document.getElementById("roomCode").value.trim();

  if(!name || !roomCode){
    alert("กรอกให้ครบ");
    return;
  }

  myName = name;
  netJoin(roomCode, name);

  show("lobbyPage");
}

/* =========================
   RENDER ROOM
========================= */

function renderRoom(data){

  room = data;
  if(!room) return;

  document.getElementById("roomText").innerText = room.roomCode;

  const list = document.getElementById("playerList");
  list.innerHTML = "";

  room.players.forEach(p=>{
    list.innerHTML += `<div>${p.name} (${p.alive ? "🟢" : "🔴"})</div>`;
  });

  const me = room.players.find(p=>p.name === myName);
  if(me && room.started){
    startGame(me);
  }
}

/* =========================
   GAME START
========================= */

function startGame(me){
  started = true;

  show("gamePage");

  updateUI(me);
}

/* =========================
   UPDATE UI
========================= */

function updateUI(me){

  document.getElementById("myRole").innerText = me.role || "-";

  document.getElementById("status").innerText =
    me.alive ? "🟢 ยังมีชีวิต" : "🔴 ตายแล้ว";

  document.getElementById("roleDesc").innerText =
    getRoleDesc(me.role);

  renderAction(me);
}

/* =========================
   ACTION UI
========================= */

function renderAction(me){

  const area = document.getElementById("actionArea");

  if(!me.alive){
    area.innerText = "คุณตายแล้ว";
    return;
  }

  if(!isSkillRole(me.role)){
    area.innerText = "ไม่มีสกิล";
    return;
  }

  const targets = getTargets(room, me);

  if(targets.length === 0){
    area.innerText = "ไม่มีเป้าหมาย";
    return;
  }

  let html = `<select id="target">`;

  targets.forEach(t=>{
    html += `<option value="${t.name}">${t.name}</option>`;
  });

  html += `</select><button onclick="uiUseSkill()">ใช้สกิล</button>`;

  area.innerHTML = html;
}

/* =========================
   USE SKILL
========================= */

function uiUseSkill(){

  const me = room.players.find(p=>p.name === myName);
  const target = document.getElementById("target").value;

  netAction({
    roomCode: room.roomCode,
    name: myName,
    action: buildAction(me.role, target)
  });

  alert("ส่งสกิลแล้ว");
}