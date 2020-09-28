const BaseCtrl = require("./BaseCtrl");
const MsgId = require("../lib/MsgId");
const PublishCode = require("../lib/PublishCode");
const path = require("path");
const fs = require("fs");
const FileUtil = require("../lib/FileUtil");
const ShellUtil = require("../lib/ShellUtil");
const ByteArray = require("../lib/ByteArray");
const zlib = require("zlib");

const AnimRoot = path.resolve(process.cwd(), "../editorout/anim/");
const PublishRoot = path.resolve(process.cwd(), "../editorpub/client/anim/");
const AnimBin = path.join(PublishRoot, "anim.json");
const EffectRoot = path.join(process.cwd(), "../editorpub/client/data_effect/");

const ValidName = [
    ["body", "creature", "effect", "faqi", "fabao", "horse", "pet", "pethorse", "petweapon", "skill", "weapon", "wing", "wushen", "lingzhen", "npc", "atkeffect"],
    new RegExp(".*"),
    [/攻击[0-9]$/, /^跑动$/, /^死亡$/, /^跳跃$/, /^站立$/, /^坐下$/, /^受击$/, /^展示$/, /^出场$/, /^UI展示$/, /^UI出场$/,/^UI坐下$/],
    ["右上", "右下", "上", "下", "右"],
    ".png"
];

const NameMap = {
    "攻击": "atk",
    "跑动": "run",
    "死亡": "die",
    "跳跃": "jmp",
    "站立": "std",
    "坐下": "sit",
    "受击": "hit",
    "展示": "ui_std1",
    "出场": "ui_apr",
    "UI展示": "ui_show",
    "UI出场": "ui_show_apr",
    "UI坐下": "ui_sit",

    "上": "1",
    "右上": "2",
    "右": "3",
    "右下": "4",
    "下": "5",
};

class Anim extends BaseCtrl {

    constructor() {
        super();
        this.handlerMap[MsgId.autoPublish] = this.autoPublish;
        this.handlerMap[MsgId.getAnimationList] = this.getAnimationList;
        this.handlerMap[MsgId.importAnimation] = this.importAnimation;
        this.handlerMap[MsgId.publishAnimation] = this.publishAnimation;
        this.handlerMap[MsgId.getEftList] = this.getEftList;
        this.handlerMap[MsgId.publishEft] = this.publishEft;
        this.handlerMap[MsgId.saveDur] = this.requestSaveDur;
    }

    /**
     *
     * @param {string} id
     * @param {string} type
     * @param {string[]} pArr
     * @param {number[]} duration
     * @param {string} targetDir
     */
    pEffect(id, type, pArr, duration, targetDir) {
        let durPath = path.join(AnimRoot, type, pArr[0] + ".dur");
        fs.writeFileSync(durPath, JSON.stringify(duration, null, "    "), "utf-8");

        let targetName = id;
        fs.copyFileSync(path.join(AnimRoot, type, pArr.join(path.sep) + ".png"), path.join(targetDir, targetName + ".png"));

        let str = fs.readFileSync(path.join(AnimRoot, type, pArr.join(path.sep) + ".json"), "utf-8");
        let cfg = JSON.parse(str);
        let result = [];
        let keys = Object.keys(cfg.frames);
        for (let i = 0, n = keys.length; i < n; i++) {
            let key = keys[i];
            let frame = cfg.frames[key];
            result.push([frame.x, frame.y, frame.w, frame.h, frame.offX, frame.offY, frame.sourceW, frame.sourceH, duration[i]]);
        }
        fs.writeFileSync(path.join(targetDir, targetName + ".json"), JSON.stringify(result), "utf-8");
    }

    /**
     *
     * @param {string} id
     * @param {string} type
     * @param {string[]} pArr
     * @param {number[]} duration
     * @param {string} targetDir
     */
    pSkill(id, type, pArr, duration, targetDir) {
        let durPath = path.join(AnimRoot, type, pArr.join(path.sep) + ".dur");
        fs.writeFileSync(durPath, JSON.stringify(duration, null, "    "), "utf-8");

        let dir = NameMap[pArr[1]];

        let targetName = `${id}_${dir}`;
        fs.copyFileSync(path.join(AnimRoot, type, pArr.join(path.sep) + ".png"), path.join(targetDir, targetName + ".png"));

        let str = fs.readFileSync(path.join(AnimRoot, type, pArr.join(path.sep) + ".json"), "utf-8");
        let cfg = JSON.parse(str);
        let result = [];
        let keys = Object.keys(cfg.frames);
        for (let i = 0, n = keys.length; i < n; i++) {
            let key = keys[i];
            let frame = cfg.frames[key];
            result.push([frame.x, frame.y, frame.w, frame.h, frame.offX, frame.offY, frame.sourceW, frame.sourceH, duration[i]]);
        }
        fs.writeFileSync(path.join(targetDir, targetName + ".json"), JSON.stringify(result), "utf-8");
    }

    /**
     *
     * @param {string} id
     * @param {string} type
     * @param {string[]} pArr
     * @param {number[]} duration
     * @param {string} targetDir
     */
    pDefault(id, type, pArr, duration, targetDir) {
        let durPath = path.join(AnimRoot, type, pArr.join(path.sep) + ".dur");
        fs.writeFileSync(durPath, JSON.stringify(duration, null, "    "), "utf-8");

        let act = pArr[1];
        let actType = /\D+/.exec(act)[0];
        let actName = NameMap[actType] + act.replace(actType, "");

        let dir = NameMap[pArr[2]];

        let targetName = `${actName}_${dir}`;
        fs.copyFileSync(path.join(AnimRoot, type, pArr.join(path.sep) + ".png"), path.join(targetDir, targetName + ".png"));

        let str = fs.readFileSync(path.join(AnimRoot, type, pArr.join(path.sep) + ".json"), "utf-8");
        let cfg = JSON.parse(str);
        let result = [];
        let keys = Object.keys(cfg.frames);
        for (let i = 0, n = keys.length; i < n; i++) {
            let key = keys[i];
            let frame = cfg.frames[key];
            result.push([frame.x, frame.y, frame.w, frame.h, frame.offX, frame.offY, frame.sourceW, frame.sourceH, duration[i]]);
        }
        fs.writeFileSync(path.join(targetDir, targetName + ".json"), JSON.stringify(result), "utf-8");
    }

    async saveDur(dir, duration, client) {
        let durPath = path.join(AnimRoot, dir + ".dur");
        fs.writeFileSync(durPath, JSON.stringify(duration, null, "    "), "utf-8");
        this.sendTo(MsgId.saveDur, {
            "res": 0
        }, client);
    }

    requestSaveDur(msg, client) {
        let {
            p,
            duration
        } = msg;
        this.saveDur(p, duration, client);
    }

    async doAutoPublish(typeList, client) {
        await ShellUtil.svnUpdate(AnimRoot);
        await ShellUtil.svnUpdate(PublishRoot);
        for (let type of typeList) {
            let targetDir = path.join(PublishRoot, type);
            let nameList = this.getAnimationList({
                p: type
            }).list;
            for (let name of nameList) {
                let id = this.getAnimationList({
                    p: type + "/" + name
                }).id;
                if (type === "effect") {
                    let duration = this.getAnimationList({
                        p: type + "/" + name
                    }).time;
                    this.pEffect(id, type, [name], duration, targetDir);
                    continue;
                }
                if (type === "skill") {
                    let dirList = this.getAnimationList({
                        p: type + "/" + name
                    }).list;
                    for (let dir of dirList) {
                        let duration = this.getAnimationList({
                            p: type + "/" + name + "/" + dir
                        }).time;
                        this.pSkill(id, type, [name, dir], duration, targetDir);
                    }
                    continue;
                }
                let actList = this.getAnimationList({
                    p: type + "/" + name
                }).list;
                for (let act of actList) {
                    let dirList = this.getAnimationList({
                        p: type + "/" + name + "/" + act
                    }).list;
                    for (let dir of dirList) {
                        let duration = this.getAnimationList({
                            p: type + "/" + name + "/" + act + "/" + dir
                        }).time;
                        let pArr = [name, act, dir];
                        targetDir = path.join(PublishRoot, type, id);
                        if (!fs.existsSync(targetDir)) {
                            FileUtil.mkdirsSync(targetDir);
                        }
                        this.pDefault(id, type, pArr, duration, targetDir);
                    }
                }
            }
        }
        let files = FileUtil.walkSync(PublishRoot, undefined, ".json");
        let result = [];
        for (let f of files) {
            if (f === AnimBin) {
                continue;
            }
            let key = "assets/anim" + f.replace(PublishRoot, "").replace(/\\/g, "/");
            let value = JSON.parse(fs.readFileSync(f, "utf-8"));
            let obj = {
                key,
                value
            };
            result.push(JSON.stringify(obj));
        }
        fs.writeFileSync(AnimBin, JSON.stringify(result, null, "  "), "utf-8");
        await ShellUtil.svnCommit(PublishRoot, "editor publish anim cfg");
        this.processing = false;
        this.sendTo(MsgId.publishAnimation, {
            "res": PublishCode.success
        }, client);
    }

    autoPublish(msg, client) {
        if (this.processing) {
            return {
                "res": PublishCode.busy
            };
        }
        this.processing = true;
        let typeList = msg.list;
        this.processing = true;
        this.doAutoPublish(typeList, client).catch(reason => console.error(reason));
        return {
            "res": PublishCode.start
        };
    }

    async getAllType(client) {
        await ShellUtil.svnUpdate(AnimRoot);
        await ShellUtil.svnUpdate(PublishRoot);
        let files = FileUtil.readDirListSync(AnimRoot);
        files.sort();
        let list = [];
        for (let f of files) {
            if (ValidName[0].indexOf(f) > -1) {
                list.push(f);
            }
        }
        this.sendTo(MsgId.getAnimationList, {
            p: "",
            list
        }, client);
    }

    getAnimationList(msg, client) {
        let {
            p
        } = msg;
        let pArr = p && p !== "" ? p.split("/") : [];
        if (pArr.length === 0) {
            this.getAllType(client).catch(reason => console.error(reason));
            return;
        }
        let type = pArr.shift();
        let id;
        let time;
        let list = [];
        if (type === "effect") {
            id = this.getEffectId(type, pArr);
            time = this.getEffectTime(type, pArr);
            list = this.getEffectList(type, pArr);
        } else if (type === "skill") {
            id = this.getSkillId(type, pArr);
            time = this.getSkillTime(type, pArr);
            list = this.getSkillList(type, pArr);
        } else {
            id = this.getDefaultId(type, pArr);
            time = this.getDefaultTime(type, pArr);
            list = this.getDefaultList(type, pArr);
        }
        return {
            p,
            list,
            id,
            time
        };
    }

    getDefaultId(type, pArr) {
        if (!pArr.length) {
            return undefined;
        }
        let str = pArr[0];
        let files = FileUtil.readFileListSync(path.join(AnimRoot, type, str), ".id");
        if (files.length) {
            let f = files[0];
            return f.replace(".id", "");
        }
        let reg = /^[a-z0-9A-Z_\-]+$/;
        if (str.match(reg)) {
            return str;
        }
    }

    setDefaultId(type, pArr, id) {
        if (!pArr.length) {
            return false;
        }
        let tar = path.join(AnimRoot, type, pArr[0]);
        let dirs = FileUtil.readDirListSync(path.join(AnimRoot, type));
        for (let d of dirs) {
            let p = path.join(AnimRoot, type, d, id + ".id");
            if (fs.existsSync(p)) {
                return p === path.join(tar, id + ".id");
            }
        }
        let files = FileUtil.readFileListSync(tar, ".id");
        for (let f of files) {
            fs.unlinkSync(path.join(tar, f));
        }
        fs.writeFileSync(path.join(tar, id + ".id"), id, "utf-8");
        return true;
    }

    getDefaultTime(type, pArr) {
        if (pArr.length === 3) {
            let jsonPath = path.join(AnimRoot, type, pArr.join(path.sep) + ".json");
            let json = JSON.parse(fs.readFileSync(jsonPath));
            let keys = Object.keys(json.frames);
            let durPath = path.join(AnimRoot, type, pArr.join(path.sep) + ".dur");
            let times;
            if (fs.existsSync(durPath)) {
                let str = fs.readFileSync(durPath, "utf-8");
                times = JSON.parse(str);
                if (times.length !== keys.length) {
                    times = null;
                }
            }
            if (!times) {
                times = [];
                for (let i = 0, n = keys.length; i < n; i++) {
                    times.push(n === 4 ? Math.floor(1000 / 6) : Math.floor(1000 / 12));
                }
                fs.writeFileSync(durPath, JSON.stringify(times, null, "    "), "utf-8");
            }
            return times;
        }
    }

    getDefaultList(type, pArr) {
        let files;
        let list;
        if (pArr.length === 0) {
            list = FileUtil.readDirListSync(path.join(AnimRoot, type));
            list.sort();
        } else if (pArr.length === 1) {
            list = [];
            files = FileUtil.readDirListSync(path.join(AnimRoot, type, pArr.join(path.sep)));
            let regs = ValidName[2];
            files.forEach(f => {
                for (let r of regs) {
                    if (f.match(r)) {
                        list.push(f);
                    }
                }
            });
            list.sort();
        } else if (pArr.length === 2) {
            list = [];
            files = FileUtil.readFileListSync(path.join(AnimRoot, type, pArr.join(path.sep)), ".png");
            let regs = ValidName[3];
            files.forEach(f => {
                let t = f.replace(".png", "");
                if (regs.indexOf(t) > -1) {
                    list.push(t);
                }
            });
            list.sort((a, b) => NameMap[b] - NameMap[a]);
        }
        return list;
    }

    /**
     *
     * @param {string} id
     * @param {string} type
     * @param {string[]} pArr
     * @param {number[]} duration
     * @param {string} targetDir
     * @param {WebSocket} client
     * @return {Promise<void>}
     */
    async publishDefault(id, type, pArr, duration, targetDir, client) {
        if (fs.existsSync(targetDir)) {
            await ShellUtil.svnUpdate(targetDir);
        } else {
            FileUtil.mkdirsSync(targetDir);
        }
        this.pDefault(id, type, pArr, duration, targetDir);
        await ShellUtil.svnCommit(targetDir, "editor publish anim cfg");
        this.onPublishSucc(targetDir, pArr.toString(), client);
    }

    getEffectId(type, pArr) {
        if (pArr.length > 0) {
            let ext = "." + pArr[0] + "-id";
            let files = FileUtil.readFileListSync(path.join(AnimRoot, type), ext);
            if (files.length) {
                let f = files[0];
                return f.replace(ext, "");
            }
            let str = pArr[0];
            let reg = /^[a-z0-9A-Z_\-]+$/;
            if (str.match(reg)) {
                return str;
            }
        }
        return null;
    }

    setEffectId(type, pArr, id) {
        if (pArr.length === 0) {
            return false;
        }
        let name = pArr[0];
        let tar = path.join(AnimRoot, type);
        let files = FileUtil.readFileListSync(tar, ".png");
        for (let f of files) {
            let n = f.replace(".png", "");
            let p = path.join(tar, id + "." + n + "-id");
            if (fs.existsSync(p)) {
                return n === name;
            }
        }
        files = FileUtil.readFileListSync(tar, "." + name + "-id");
        for (let f of files) {
            fs.unlinkSync(path.join(tar, f));
        }
        fs.writeFileSync(path.join(tar, id + "." + name + "-id"), id, "utf-8");
        return true;
    }

    getEffectTime(type, pArr) {
        if (pArr.length > 0) {
            let jsonPath = path.join(AnimRoot, type, pArr[0] + ".json");
            let json = JSON.parse(fs.readFileSync(jsonPath));
            let keys = Object.keys(json.frames);
            let durPath = path.join(AnimRoot, type, pArr[0] + ".dur");
            let times;
            if (fs.existsSync(durPath)) {
                let str = fs.readFileSync(durPath, "utf-8");
                times = JSON.parse(str);
                if (times.length !== keys.length) {
                    times = null;
                }
            }
            if (!times) {
                times = [];
                for (let i = 0, n = keys.length; i < n; i++) {
                    times.push(n === 4 ? Math.floor(1000 / 6) : Math.floor(1000 / 12));
                }
                fs.writeFileSync(durPath, JSON.stringify(times, null, "    "), "utf-8");
            }
            return times;
        }
    }

    getEffectList(type, pArr) {
        let files;
        let list;
        list = [];
        files = FileUtil.readFileListSync(path.join(AnimRoot, type), ".png");
        files.forEach(f => {
            list.push(f.replace(".png", ""));
        });
        list.sort();
        return list;
    }

    /**
     *
     * @param {string} id
     * @param {string} type
     * @param {string[]} pArr
     * @param {number[]} duration
     * @param {string} targetDir
     * @param {WebSocket} client
     * @return {Promise<void>}
     */
    async publishEffect(id, type, pArr, duration, targetDir, client) {
        if (fs.existsSync(targetDir)) {
            await ShellUtil.svnUpdate(targetDir);
        } else {
            FileUtil.mkdirsSync(targetDir);
        }
        this.pEffect(id, type, pArr, duration, targetDir);
        await ShellUtil.svnCommit(targetDir, "editor publish anim cfg");
        this.onPublishSucc(targetDir, id, client);
    }

    getSkillId(type, pArr) {
        if (pArr.length > 0) {
            let files = FileUtil.readFileListSync(path.join(AnimRoot, type, pArr[0]), ".id");
            if (files.length) {
                let f = files[0];
                return f.replace(".id", "");
            }
        }
        return undefined;
    }

    setSkillId(type, pArr, id) {
        if (pArr.length === 0) {
            return false;
        }
        let tar = path.join(AnimRoot, type, pArr[0]);
        let dirs = FileUtil.readDirListSync(path.join(AnimRoot, type));
        for (let d of dirs) {
            let p = path.join(AnimRoot, type, d, id + ".id");
            if (fs.existsSync(p)) {
                return p === path.join(tar, id + ".id");
            }
        }
        let files = FileUtil.readFileListSync(tar, ".id");
        for (let f of files) {
            fs.unlinkSync(path.join(tar, f));
        }
        fs.writeFileSync(path.join(tar, id + ".id"), id, "utf-8");
        return true;
    }

    getSkillTime(type, pArr) {
        if (pArr.length === 2) {
            let jsonPath = path.join(AnimRoot, type, pArr.join(path.sep) + ".json");
            let json = JSON.parse(fs.readFileSync(jsonPath));
            let keys = Object.keys(json.frames);
            let durPath = path.join(AnimRoot, type, pArr.join(path.sep) + ".dur");
            let times;
            if (fs.existsSync(durPath)) {
                let str = fs.readFileSync(durPath, "utf-8");
                times = JSON.parse(str);
                if (times.length !== keys.length) {
                    times = null;
                }
            }
            if (!times) {
                times = [];
                for (let i = 0, n = keys.length; i < n; i++) {
                    times.push(n === 4 ? Math.floor(1000 / 6) : Math.floor(1000 / 12));
                }
                fs.writeFileSync(durPath, JSON.stringify(times, null, "    "), "utf-8");
            }
            return times;
        }
    }

    getSkillList(type, pArr) {
        let files;
        let list;
        if (pArr.length === 0) {
            list = FileUtil.readDirListSync(path.join(AnimRoot, type));
            list.sort();
        } else if (pArr.length === 1) {
            list = [];
            files = FileUtil.readFileListSync(path.join(AnimRoot, type, pArr.join(path.sep)), ".png");
            let regs = ValidName[3];
            files.forEach(f => {
                let t = f.replace(".png", "");
                if (regs.indexOf(t) > -1) {
                    list.push(t);
                }
            });
            list.sort((a, b) => NameMap[b] - NameMap[a]);
        }
        return list;
    }

    /**
     *
     * @param {string} id
     * @param {string} type
     * @param {string[]} pArr
     * @param {number[]} duration
     * @param {string} targetDir
     * @param {WebSocket} client
     */
    async publishSkill(id, type, pArr, duration, targetDir, client) {
        if (fs.existsSync(targetDir)) {
            await ShellUtil.svnUpdate(targetDir);
        } else {
            FileUtil.mkdirsSync(targetDir);
        }
        this.pSkill(id, type, pArr, duration, targetDir);
        await ShellUtil.svnCommit(targetDir, "editor publish anim cfg");
        this.onPublishSucc(targetDir, pArr.toString(), client);
    }

    importAnimation(msg, client) {
        let {
            p,
            id
        } = msg;
        let pArr = p.split("/");
        if (pArr.length === 0) {
            return {
                "res": PublishCode.not_exists
            };
        }
        let type = pArr.shift();
        if (type === "effect") {
            if (this.setEffectId(type, pArr, id)) {
                return {
                    "res": PublishCode.success
                };
            }
            return {
                "res": PublishCode.id_exists
            };
        }
        if (type === "skill") {
            if (this.setSkillId(type, pArr, id)) {
                return {
                    "res": PublishCode.success
                };
            }
            return {
                "res": PublishCode.id_exists
            };
        }
        if (this.setDefaultId(type, pArr, id)) {
            return {
                "res": PublishCode.success
            };
        }
        return {
            "res": PublishCode.id_exists
        };
    }

    publishAnimation(msg, client) {
        if (this.processing) {
            return {
                "res": PublishCode.busy
            };
        }
        let {
            p,
            duration
        } = msg;
        let pArr = p.split("/");
        if (pArr.length === 0) {
            return {
                "res": PublishCode.not_exists
            };
        }
        this.processing = true;
        let type = pArr.shift();
        if (type === "effect") {
            if (pArr.length < 1) {
                return {
                    "res": PublishCode.not_exists
                };
            }
            let id = this.getEffectId(type, pArr);
            if (!id) {
                return {
                    "res": PublishCode.not_init
                };
            }
            let targetDir = path.join(PublishRoot, type);
            this.publishEffect(id, type, pArr, duration, targetDir, client).catch(reason => console.error(reason));
            return {
                "res": PublishCode.start
            };
        }
        if (type === "skill") {
            if (pArr.length < 2) {
                return {
                    "res": PublishCode.not_exists
                };
            }
            let id = this.getSkillId(type, pArr);
            if (!id) {
                return {
                    "res": PublishCode.not_init
                };
            }
            let targetDir = path.join(PublishRoot, type);
            this.publishSkill(id, type, pArr, duration, targetDir, client).catch(reason => console.error(reason));
            return {
                "res": PublishCode.start
            };
        }
        if (pArr.length < 3) {
            return {
                "res": PublishCode.not_exists
            };
        }
        let id = this.getDefaultId(type, pArr);
        if (!id) {
            return {
                "res": PublishCode.not_init
            };
        }
        let targetDir = path.join(PublishRoot, type, id);
        this.publishDefault(id, type, pArr, duration, targetDir, client).catch(reason => console.error(reason));
        return {
            "res": PublishCode.start
        };
    }

    onPublishSucc(targetDir, targetName, client) {
        let files = FileUtil.walkSync(PublishRoot, undefined, ".json");
        let result = [];
        let t = Date.now();
        for (let f of files) {
            if (f === AnimBin) {
                continue;
            }
            let key = "assets/anim" + f.replace(PublishRoot, "").replace(/\\/g, "/");
            let value = JSON.parse(fs.readFileSync(f, "utf-8"));
            let obj = {
                key,
                value
            };
            result.push(JSON.stringify(obj));
        }
        fs.writeFileSync(AnimBin, JSON.stringify(result, null, "  "), "utf-8");
        console.log("write anim.bin cost:", Date.now() - t);
        ShellUtil.svnCommit(AnimBin, "editor publish anim cfg").then(() => {
            this.processing = false;
            this.sendTo(MsgId.publishAnimation, {
                "res": PublishCode.success
            }, client);
            console.log(path.join(targetDir, targetName), "发布完成");
        });
    }

    getEftList(msg, client) {
        let files = FileUtil.walkSync(EffectRoot, undefined, ".json");
        let list = [];
        for (let f of files) {
            list.push(fs.readFileSync(f, "utf-8"));
        }
        return {
            list
        };
    }

    async doPublishEft(id, data, client) {
        let p = path.join(EffectRoot, id + ".json");
        if (typeof data === "string") {
            fs.writeFileSync(p, data, "utf-8");
            await ShellUtil.svnCommit(p, "editor publish effect cfg");
            this.processing = false;
            this.sendTo(MsgId.publishEft, {
                "res": PublishCode.success
            }, client);
            console.log(p, "发布完成");
            return;
        }
        if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            await ShellUtil.svnDel(p, "editor publish effect cfg");
            this.processing = false;
            this.sendTo(MsgId.publishEft, {
                "res": PublishCode.success
            }, client);
            console.log(p, "删除发布完成");
        }
    }

    publishEft(msg, client) {
        if (this.processing) {
            return {
                "res": PublishCode.busy
            };
        }
        this.processing = true;
        let {
            id,
            data
        } = msg;
        this.doPublishEft(id, data, client).catch(reason => console.error(reason));
        return {
            "res": PublishCode.start
        };
    }

}

module.exports = Anim;