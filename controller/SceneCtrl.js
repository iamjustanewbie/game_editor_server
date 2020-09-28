let BaseCtrl = require("./BaseCtrl");
let MsgId = require("../lib/MsgId");
let PublishCode = require("../lib/PublishCode");
let fs = require("fs");
let path = require("path");
let ShellUtil = require("../lib/ShellUtil");
const FileUtil = require("../lib/FileUtil");

const ServerRoot = path.resolve(process.cwd(), "../editorpub/server/");
const InfoRoot = path.resolve(process.cwd(), "../editorout/scene/");

const PublishRoot = path.resolve(process.cwd(), "../editorpub/client/data/");
class SceneCrtl extends BaseCtrl {

    constructor() {
        super();
        this.handlerMap[MsgId.getSceneInfo] = this.getSceneInfo;
        this.handlerMap[MsgId.getSceneList] = this.getSceneList;
        this.handlerMap[MsgId.saveSceneInfo] = this.saveSceneInfo;
        this.handlerMap[MsgId.publishScene] = this.publishScene;
    }

    getSceneList(msg, client) {
        let dir = InfoRoot;
        if (!fs.existsSync(dir)) {
            FileUtil.mkdirsSync(dir);
            ShellUtil.svnCommit(dir, 'create dir');
        }
        ShellUtil.svnUpdate(dir).then(() => {
            let list = FileUtil.readFileListSync(dir);
            list.sort((a, b) => parseInt(a) - parseInt(b));
            this.sendTo(MsgId.getSceneList, list.map((f) => {
                return parseInt(f);
            }), client);
        });
    }

    getSceneInfo(msg, client) {
        let {
            id
        } = msg;
        let file = path.join(InfoRoot, id.toString());
        let str = fs.readFileSync(file, "utf-8");
        let obj = JSON.parse(str);
        return obj;
    }

    saveSceneInfo(msg, client) {
        let sceneid = msg.id;
        let info = msg.info;
        this.startSave(sceneid, info, client);
    }

    async startSave(id, info, client) {
        let file = path.join(InfoRoot, id.toString());

        fs.writeFileSync(file, JSON.stringify(info), "utf-8");
        await ShellUtil.svnCommit(file, "editor save scene info");
        this.sendTo(MsgId.saveSceneInfo, {
            id: id
        }, client);
    }

    async startPublish(client) {
        let files = FileUtil.walkSync(InfoRoot);
        
        let res = [];
        res.push('export const SceneConf = {');
        let indent = 0;
        indent++;

        let conf = {};
        for (let f of files) {
            let sceneid = parseInt(path.basename(f));
            res.push(this.getSpace(indent) + `[${sceneid}] : {`)
            indent++
            let obj = JSON.parse(fs.readFileSync(f, "utf-8"));
            res.push(this.getSpace(indent) + `mapid : ${obj.mapid},`);
            res.push(this.getSpace(indent) + `teleports : [`)
            indent++;
            for (const o of obj.teleports) {
                res.push(this.getSpace(indent) + `{`)
                indent++;
                res.push(this.getSpace(indent) + `x : ${o.x},`);
                res.push(this.getSpace(indent) + `y : ${o.y},`);
                res.push(this.getSpace(indent) + `tx : ${o.tx},`);
                res.push(this.getSpace(indent) + `ty : ${o.ty},`);
                res.push(this.getSpace(indent) + `dir : ${o.dir},`);
                res.push(this.getSpace(indent) + `type : ${o.type},`);
                res.push(this.getSpace(indent) + `toscene : ${o.toscene}`);
                indent--;
                res.push(this.getSpace(indent) + `},`)
            }
            indent--;
            res.push(this.getSpace(indent) + `],`)

            res.push(this.getSpace(indent) + `birthPts : [`)
            indent++;
            for (const o of obj.birthPts || []) {
                res.push(this.getSpace(indent) + `{`)
                indent++;
                res.push(this.getSpace(indent) + `x : ${o.x},`);
                res.push(this.getSpace(indent) + `y : ${o.y},`);

                res.push(this.getSpace(indent) + `monsters : [`)
                indent++;
                for (const m of o.monsters) {
                    res.push(this.getSpace(indent) + `{`)
                    indent++;
                    res.push(this.getSpace(indent) + `x : ${m.x},`);
                    res.push(this.getSpace(indent) + `y : ${m.y},`);
                    res.push(this.getSpace(indent) + `id : ${m.idx},`);
                    res.push(this.getSpace(indent) + `dir : ${m.dir},`);
                    indent--;
                    res.push(this.getSpace(indent) + `},`)
                }
                indent--;
                res.push(this.getSpace(indent) + `]`)

                indent--;
                res.push(this.getSpace(indent) + `},`)
            }
            indent--;
            res.push(this.getSpace(indent) + `],`)

            res.push(this.getSpace(indent) + `points: {`)
            indent++;
            for (const id in obj.points || {}) {
                let point = obj.points[id];
                res.push(this.getSpace(indent) + `[${id}]: {`)
                indent++;
                res.push(this.getSpace(indent) + `x : ${point.x},`);
                res.push(this.getSpace(indent) + `y : ${point.y},`);
                indent--;
                res.push(this.getSpace(indent) + `},`)
            }
            indent--;
            res.push(this.getSpace(indent) + `},`)

            res.push(this.getSpace(indent) + `npc: [`)
            indent++;
            for (const id in obj.npcs || []) {
                let npc = obj.npcs[id];
                res.push(this.getSpace(indent) + `{`)
                indent++;
                res.push(this.getSpace(indent) + `x : ${npc.x},`);
                res.push(this.getSpace(indent) + `y : ${npc.y},`);
                res.push(this.getSpace(indent) + `id : ${npc.id},`);
                res.push(this.getSpace(indent) + `dir : ${npc.dir},`);
                res.push(this.getSpace(indent) + `autoCreate : ${npc.autoCreate},`);
                indent--;
                res.push(this.getSpace(indent) + `},`)
            }
            indent--;
            res.push(this.getSpace(indent) + `],`)

            indent--;
            res.push(this.getSpace(indent) + `},`)

            conf[sceneid] = obj;
        }

        indent--;
        res.push(this.getSpace(indent) + '}');
        fs.writeFileSync(path.join(ServerRoot, 'sceneconf.ts'), res.join("\n"), "utf-8");

        await ShellUtil.svnCommit(ServerRoot, "editor publish scene cfg");

        // 过滤一下不需要的字段
        for (const key in conf) {
            let c = conf[key];
            c.birthPts.filter((v)=>{
                return {
                    x: v.x,
                    y: v.y
                }
            })
        }
        fs.writeFileSync(path.join(PublishRoot, 'scene.json'), JSON.stringify(conf, null, "    "), "utf-8");
        await ShellUtil.svnCommit(PublishRoot, "editor publish scene cfg");

        this.processing = false;
        this.sendTo(MsgId.publishScene, {
            "res": PublishCode.success
        }, client);
    }

    publishScene(msg, client) {
        if (this.processing) {
            return {
                "res": PublishCode.busy
            };
        }
        this.processing = true;
        this.startPublish(client);
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

module.exports = SceneCrtl;