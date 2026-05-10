const roleDescriptions = {
  "หมาป่า":"ฆ่าคนตอนกลางคืน",
  "ชาวบ้าน":"โหวตหาหมาป่า",
  "หมอ":"ป้องกันคนได้",
  "ผู้หยั่งรู้":"เช็คตัวตน"
};

function getRoleDesc(role){
  return roleDescriptions[role] || "ไม่มีข้อมูล";
}

function isSkillRole(role){
  return ["หมาป่า","หมอ","ผู้หยั่งรู้","แม่มด"].includes(role);
}

function getTargets(room, me){
  return room.players.filter(p => p.name !== me.name && p.alive);
}

function buildAction(role, target){
  return `${role} → ${target}`;
}