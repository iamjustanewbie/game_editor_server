const server = require("./ServerBase").ins;

const MapCtrl = require("./controller/MapCtrl");
const AnimCtrl = require("./controller/AnimCtrl");
const MonsterCtrl = require("./controller/MonsterCtrl");
const TeleportCtrl = require("./controller/TeleportCtrl");
const SceneCtrl = require("./controller/SceneCtrl");

server.add(1, new MapCtrl());
server.add(2, new AnimCtrl());
server.add(3, new MonsterCtrl());
server.add(4, new TeleportCtrl());
server.add(5, new SceneCtrl());

server.start("0.0.0.0", 3001);

process.on("SIGHUP", (sig) => {
});
console.log("服务器启动成功");