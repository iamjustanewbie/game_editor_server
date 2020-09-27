let BaseCtrl = require("./BaseCtrl");
let MsgId = require("../lib/MsgId");
let PublishCode = require("../lib/PublishCode");
let fs = require("fs");
let path = require("path");
let ShellUtil = require("../lib/ShellUtil");
const FileUtil = require("../lib/FileUtil");

const ServerRoot = path.resolve(process.cwd(), "../editorpub/server/map/");

class TeleportCtrl extends BaseCtrl {

    constructor() {
        super();
        this.handlerMap[MsgId.getTeleportList] = this.getTeleportList;
        this.handlerMap[MsgId.publishTeleport] = this.publishTeleport;
    }

    getTeleportList(msg, client) {
        let {
            mapId
        } = msg;
        let p = path.join(ServerRoot, mapId.toString() + ".teleport.json");
        if (fs.existsSync(p)) {
            let str = fs.readFileSync(p, "utf-8");
            return JSON.parse(str);
        }
        return [];
    }

    async startPublish(mapId, list, client) {
        let serverPath = path.join(ServerRoot, mapId.toString() + ".teleport.json");
        fs.writeFileSync(serverPath, JSON.stringify(list), "utf-8");
        let files = FileUtil.walkSync(ServerRoot, undefined, ".json");
        let res = [];
        res.push('export const TeleportConf = {');
        let indent = 0;
        indent++;
        for (let f of files) {
            let bf = path.basename(f);
            let idx = bf.indexOf('teleport');
            if (idx < 0) {
                continue;
            }
            let mapid = parseInt(bf.substring(0, idx - 1));
            res.push(this.getSpace(indent) + `[${mapid}] : {`)
            indent++
            let obj = JSON.parse(fs.readFileSync(f, "utf-8"));
            console.log(obj);
            for (const id in obj) {
                const o = obj[id];
                res.push(this.getSpace(indent) + `[${id}] : {`)
                indent++;
                res.push(this.getSpace(indent) + `x : ${o.x},`);
                res.push(this.getSpace(indent) + `y : ${o.y},`);
                res.push(this.getSpace(indent) + `tx : ${o.tx},`);
                res.push(this.getSpace(indent) + `ty : ${o.ty},`);
                res.push(this.getSpace(indent) + `dir : ${o.dir},`);
                res.push(this.getSpace(indent) + `type : ${o.type},`);
                res.push(this.getSpace(indent) + `tomap : ${o.tomap}`);
                indent--;
                res.push(this.getSpace(indent) + `},`)
            }
            indent--;
            res.push(this.getSpace(indent) + '},');
        }
        indent--;
        res.push(this.getSpace(indent) + '}');
        fs.writeFileSync(path.join(ServerRoot, 'teleportconf.ts'), res.join("\n"), "utf-8");
        await ShellUtil.svnCommit(ServerRoot, "editor publish monster cfg");
        this.processing = false;
        console.log(mapId, "monster 发布完成");
        this.sendTo(MsgId.publishMonster, {
            "res": PublishCode.success
        }, client);
    }

    publishTeleport(msg, client) {
        let {
            mapId,
            list
        } = msg;
        if (this.processing) {
            return {
                "res": PublishCode.busy
            };
        }
        if (list == null) {
            return {
                "res": PublishCode.not_init
            };
        }
        this.processing = true;
        this.startPublish(mapId, list, client);
        return {
            "res": PublishCode.start
        };
    }

    getSpace(num) {
        let str = "";
        for (let i = 0; i < num; i++) {
            str += "\t";
        }
        return str;
    }
}

module.exports = TeleportCtrl;