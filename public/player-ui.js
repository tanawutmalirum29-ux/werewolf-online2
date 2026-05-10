const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

const wolfRoles = [
    "หมาป่า",
    "ลูกหมาป่า",
    "หมาป่าขาว"
];

const roleMessages = {
    "หมอ": [
        "คืนนี้เลือกคนที่จะรักษา",
        "คุณช่วยตัวเองได้",
        "คืนนี้ไม่มีคนตาย"
    ],
    "เซียร์": [
        "คืนนี้เลือกคนที่จะส่อง",
        "คนนี้เป็นฝ่ายดี",
        "คนนี้เป็นฝ่ายร้าย"
    ],
    "หมาป่า": [
        "เลือกเหยื่อคืนนี้",
        "รอหมาป่าตัวอื่นโหวต"
    ],
    "นักล่า": [
        "เป้าหมายของคุณยังมีชีวิต",
        "คุณชนะทันทีถ้าเป้าหมายตาย"
    ]
};

function genId() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

io.on("connection", (socket) => {

    // CREATE ROOM
    socket.on("create_room", ({ name }, cb) => {

        const id = genId();

        rooms[id] = {
            host: socket.id,
            config: {},
            started: false,
            players: [
                {
                    id: socket.id,
                    name,
                    isHost: true,
                    role: null,
                    displayRole: null,
                    alive: true,
                    protected: false,
                    killed: false
                }
            ]
        };

        socket.join(id);

        io.to(id).emit("room_update", rooms[id]);

        cb(id);
    });

    // JOIN ROOM
    socket.on("join_room", ({ roomId, name }, cb) => {

        roomId = roomId.toUpperCase();
        const room = rooms[roomId];

        if (!room) return cb({ error: "room not found" });

        const already = room.players.find(p => p.id === socket.id);

        if (!already) {
            room.players.push({
                id: socket.id,
                name,
                isHost: false,
                role: null,
                displayRole: null,
                alive: true,
                protected: false,
                killed: false
            });
        }

        socket.join(roomId);

        io.to(roomId).emit("room_update", room);

        cb({ ok: true });
    });

    // UPDATE CONFIG
    socket.on("update_config", ({ roomId, config }) => {
        const room = rooms[roomId];
        if (!room) return;

        room.config = config;
        io.to(roomId).emit("room_update", room);
    });

    // START GAME
    socket.on("start_game", (roomId) => {

        const room = rooms[roomId];
        if (!room) return;

        if (room.started) return; // ✅ FIX: กันกดซ้ำ
        room.started = true;

        const roleCards = [];

        const randomGroups = {
            "สุ่มชาวบ้าน": ["ชาวบ้าน", "หมอ", "เซียร์", "บอดี้การ์ด"],
            "สุ่มหมาป่า": ["หมาป่า", "ลูกหมาป่า", "หมาป่าขาว"],
            "สุ่มบทบาทการโหวต": ["คนบ้า", "นักล่า", "ผู้เฒ่า"]
        };

        Object.keys(room.config).forEach((roleName) => {

            const count = room.config[roleName];

            for (let i = 0; i < count; i++) {

                if (randomGroups[roleName]) {

                    const pool = randomGroups[roleName];

                    const realRole = pool[Math.floor(Math.random() * pool.length)];

                    roleCards.push({
                        role: realRole,
                        displayRole: `${roleName}/${realRole}`
                    });

                } else {

                    roleCards.push({
                        role: roleName,
                        displayRole: roleName
                    });

                }
            }
        });

        const realPlayers = room.players.filter(p => !p.isHost);

        if (roleCards.length !== realPlayers.length) {
            room.started = false; // rollback

            return io.to(room.host).emit(
                "host_error",
                `จำนวน role (${roleCards.length}) ไม่เท่าผู้เล่น (${realPlayers.length})`
            );
        }

        shuffle(roleCards);

        realPlayers.forEach((p, i) => {
            const card = roleCards[i];

            p.role = card.role;
            p.displayRole = card.displayRole;
            p.huntTarget = null;
            p.huntTargetId = null;
        });

        const cannotBeHuntedRoles = [
            "หมาป่า",
            "คนบ้า",
            "นักล่าหัว",
            "ฆาตกร",
            "ศาลเตี้ย"
        ];

        realPlayers.forEach((p) => {

            if (p.role !== "นักล่า") return;

            const targets = realPlayers.filter(x =>
                x.id !== p.id &&
                !cannotBeHuntedRoles.includes(x.role)
            );

            if (targets.length === 0) return;

            const target = targets[Math.floor(Math.random() * targets.length)];

            // ✅ FIX: ใช้ ID เป็นหลัก
            p.huntTargetId = target.id;
            p.huntTarget = target.name;
        });

        realPlayers.forEach((p) => {

            io.to(p.id).emit("your_role", {
                role: p.role,
                displayRole: p.displayRole,
                huntTarget: p.huntTarget
            });

        });

        io.to(roomId).emit("room_update", room);
    });

    // TOGGLE STATE
    socket.on("toggle_state", ({ roomId, playerId, key }) => {

        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return;

        player[key] = !player[key];

        io.to(roomId).emit("room_update", room);
    });

    // CHAT
    socket.on("send_chat", ({ roomId, text, type }) => {

        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        if (typeof text !== "string") return;

        text = text.trim();

        if (!text || text.length > 200) return;
        if (!player.alive) return;

        if (type === "wolf") {

            if (!wolfRoles.includes(player.role)) return;

            room.players.forEach((p) => {
                if (wolfRoles.includes(p.role)) {
                    io.to(p.id).emit("chat_message", {
                        name: player.name,
                        text,
                        type: "wolf"
                    });
                }
            });

            return;
        }

        io.to(roomId).emit("chat_message", {
            name: player.name,
            text,
            type: "global"
        });
    });

    // HOST CHAT
    socket.on("host_chat", ({ roomId, text, type }) => {

        const room = rooms[roomId];
        if (!room) return;

        if (socket.id !== room.host) return;

        if (typeof text !== "string") return;

        text = text.trim();

        if (!text || text.length > 200) return;

        if (type === "wolf") {

            room.players.forEach((p) => {
                if (wolfRoles.includes(p.role)) {
                    io.to(p.id).emit("chat_message", {
                        name: "HOST",
                        text,
                        type,
                        isHost: true
                    });
                }
            });

            return;
        }

        io.to(roomId).emit("chat_message", {
            name: "HOST",
            text,
            type: "global",
            isHost: true
        });
    });

    // PRIVATE HOST MSG
    socket.on("host_private_msg", ({ roomId, playerId, text }) => {

        const room = rooms[roomId];
        if (!room) return;

        if (socket.id !== room.host) return;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return;

        const presets = roleMessages[player.role] || [];

        if (!presets.includes(text)) return;

        io.to(player.id).emit("chat_message", {
            name: "HOST",
            text,
            type: "private",
            isHost: true
        });
    });

    // DISCONNECT
    socket.on("disconnect", () => {

        for (const roomId in rooms) {

            const room = rooms[roomId];

            room.players = room.players.filter(p => p.id !== socket.id);

            if (room.players.length === 0) {
                delete rooms[roomId]; // ✅ FIX: กัน memory leak
                continue;
            }

            io.to(roomId).emit("room_update", room);
        }
    });

});

server.listen(process.env.PORT || 3000, () => {
    console.log("server running");
});