/* =========================
   STATE (UI SIDE ONLY)
========================= */

let room = null;

/* =========================
   RENDER ROOM
========================= */

function renderRoom(data){

  if(!data){
    alert("ห้องถูกยุบแล้ว");
    location.href = "index.html";
    return;
  }

  room = data;

  document.getElementById("roomCode").innerText = room.roomCode;
  document.getElementById("playerCount").innerText = room.players.length;

  renderPlayers();
}

/* =========================
   RENDER PLAYERS
========================= */

function renderPlayers(){

  const el = document.getElementById("playerList");
  el.innerHTML = "";

  if(room.players.length === 0){
    el.innerHTML = `<div class="box">ยังไม่มีผู้เล่น</div>`;
    return;
  }

  room.players.forEach(p => {

    el.innerHTML += `
      <div class="player">
        ${p.name}
        <button onclick="uiKick('${p.name}')">เตะ</button>
      </div>
    `;
  });

}

/* =========================
   UI ACTIONS (CALL NET LAYER)
========================= */

function uiKick(name){
  if(confirm("เตะ " + name + " ?")){
    netKickPlayer(name);
  }
}

function uiStartGame(){
  if(!room) return;

  if(room.players.length !== room.roles.length){
    alert("จำนวนผู้เล่นไม่ตรงอาชีพ");
    return;
  }

  netStartGame(room.roomCode);
}

function uiCloseRoom(){
  if(confirm("ยุบห้อง?")){
    netCloseRoom(room.roomCode);
  }
}

/* =========================
   EXPORT
========================= */
window.renderRoom = renderRoom;