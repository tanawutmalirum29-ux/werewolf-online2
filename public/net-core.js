const socket = io();

/* =========================
   GLOBAL ROOM CACHE
========================= */
let currentRoom = null;

/* =========================
   REGISTER HANDLER
========================= */

const listeners = {
  roomData: [],
  roomClosed: [],
  kicked: [],
  roomCreated: [],
  errorMessage: []
};

/* =========================
   ON EVENT DISPATCHER
========================= */

socket.on("roomData", (data)=>{
  currentRoom = data;
  listeners.roomData.forEach(fn => fn(data));
});

socket.on("roomClosed", ()=>{
  listeners.roomClosed.forEach(fn => fn());
});

socket.on("kicked", ()=>{
  listeners.kicked.forEach(fn => fn());
});

socket.on("roomCreated", (data)=>{
  listeners.roomCreated.forEach(fn => fn(data));
});

socket.on("errorMessage", (msg)=>{
  listeners.errorMessage.forEach(fn => fn(msg));
});

/* =========================
   SUBSCRIBE API
========================= */

function on(event, fn){
  if(listeners[event]){
    listeners[event].push(fn);
  }
}

/* =========================
   EMIT WRAPPER
========================= */

function emit(event, data){
  socket.emit(event, data);
}

/* =========================
   ROOM ACCESS
========================= */

function getRoom(){
  return currentRoom;
}