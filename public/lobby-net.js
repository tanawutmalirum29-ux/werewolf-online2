on("roomData", renderRoom);

on("roomClosed", ()=>{
  alert("ห้องถูกยุบ");
  location.href = "index.html";
});

function netKickPlayer(name){
  emit("kickPlayer", {
    roomCode: getRoom().roomCode,
    name
  });
}

function netStartGame(){
  emit("startGame", getRoom().roomCode);
}

function netCloseRoom(){
  emit("closeRoom", getRoom().roomCode);
}