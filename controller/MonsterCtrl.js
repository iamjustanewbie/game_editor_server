let BaseCtrl = require("./BaseCtrl");
let MsgId = require("../lib/MsgId");
let PublishCode = require("../lib/PublishCode");
let fs = require("fs");
let path = require("path");
let ShellUtil = require("../lib/ShellUtil");
const { getOutDir, getPubDir } = require("../config");

const MapRoot = path.resolve(getOutDir(), "./map/");
const ServerRoot = path.resolve(getPubDir(), "./server/map/");

class MonsterCtrl extends BaseCtrl {

    constructor() {
        super();
        this.handlerMap[MsgId.getMonsterList] = this.getMonsterList;
        this.handlerMap[MsgId.publishMonster] = this.publishMonster;
    }

    getMonsterList(msg, client) {
        let {mapId} = msg;
        let p = path.join(MapRoot, mapId.toString(), "monster.json");
        if (fs.existsSync(p)) {
            let str = fs.readFileSync(p, "utf-8");
            return JSON.parse(str);
        }
        return [];
    }

    async startPublish(p, mapId, monster, client) {
        await ShellUtil.svnUpdate(ServerRoot);
        fs.writeFileSync(p, JSON.stringify(monster, null, "    "), "utf-8");
        await ShellUtil.svnCommit(p, "editor publish monster cfg");

        let indent = 0;
        let res = [];
        res.push(this.getSpace(indent) + "return");
        res.push(this.getSpace(indent) + "{");
        indent++;
        for (let i = 0, len = monster.length; i < len; i++) {
            let obj = monster[i];
            res.push(this.getSpace(indent) + `[${i + 1}] = {`);
            indent++;
            res.push(this.getSpace(indent) + `path_coords = {`);
            indent++;
            for (let k = 0, len2 = obj.pts.length; k < len2; k++) {
                res.push(this.getSpace(indent) + `[${k + 1}] = {`);
                indent++;
                res.push(this.getSpace(indent) + `x = ${obj.pts[k].x},`);
                res.push(this.getSpace(indent) + `y = ${obj.pts[k].y},`);
                indent--;
                res.push(this.getSpace(indent) + `},`);
            }
            indent--;
            res.push(this.getSpace(indent) + `},`);
            res.push(this.getSpace(indent) + `monsters = {`);
            indent++;
            for (let j = 0, len1 = obj.monsters.length; j < len1; j++) {
                res.push(this.getSpace(indent) + `[${j + 1}] = {`);
                indent++;
                res.push(this.getSpace(indent) + `index = ${obj.monsters[j].idx},`);
                res.push(this.getSpace(indent) + `x = ${obj.monsters[j].x},`);
                res.push(this.getSpace(indent) + `y = ${obj.monsters[j].y},`);
                res.push(this.getSpace(indent) + `dir = ${obj.monsters[j].dir},`);
                indent--;
                res.push(this.getSpace(indent) + `},`);
            }
            indent--;
            res.push(this.getSpace(indent) + `},`);
            indent--;
            res.push(this.getSpace(indent) + `},`);
            res.push(``);
        }
        indent--;
        res.push(this.getSpace(indent) + "}");
        let serverPath = path.join(ServerRoot, mapId.toString() + ".monster");
        fs.writeFileSync(serverPath, res.join("\n"), "utf-8");
        await ShellUtil.svnCommit(serverPath, "editor publish monster cfg");
        this.processing = false;
        console.log(mapId, "monster 发布完成");
        this.sendTo(MsgId.publishMonster, {"res": PublishCode.success}, client);
    }

    publishMonster(msg, client) {
        let {mapId, monster} = msg;
        if (this.processing) {
            return {"res": PublishCode.busy};
        }
        if (monster == null) {
            return {"res": PublishCode.not_init};
        }
        let p = path.join(MapRoot, mapId.toString(), "monster.json");
        this.processing = true;
        this.startPublish(p, mapId, monster, client);
        return {"res": PublishCode.start};
    }

    getSpace(num) {
        let str = "";
        for (let i = 0; i < num; i++) {
            str += "\t";
        }
        return str;
    }

}

module.exports = MonsterCtrl;
