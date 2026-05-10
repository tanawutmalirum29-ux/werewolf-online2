on("roomData", renderRoom);

on("roomClosed", ()=>{
  alert("ห้องถูกยุบ");
  location.href = "index.html";
});

on("kicked", ()=>{
  alert("ถูกเตะ");
  location.href = "index.html";
});

function netJoin(roomCode, name){
  emit("joinRoom", { roomCode, name });
}

function netAction(data){
  emit("setAction", data);
}