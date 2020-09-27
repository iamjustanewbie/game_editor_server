let fs = require("fs");
let path = require("path");
let FileUtil = require("./lib/FileUtil");
let ShellUtil = require("./lib/ShellUtil");
let ByteArray = require("./lib/ByteArray");
let zlib = require("zlib");

const MapRoot = path.resolve(process.cwd(), "../editorout/map/");
const PublishRoot = path.resolve(process.cwd(), "../editorpub/client/map/");
const ServerRoot = path.resolve(process.cwd(), "../editorpub/server/map/");

function revertMsk() {
    let list = FileUtil.readDirListSync(PublishRoot);
    for (let p of list) {
        let buffer = fs.readFileSync(path.join(PublishRoot, p, "data.msk"));
        let bytes = new ByteArray(zlib.inflateSync(Buffer.from(buffer)));
        let jpg = bytes.readUTFBytes(bytes.readInt());
        let info = {};
        info.imageWidth = bytes.readInt();
        info.imageHeight = bytes.readInt();
        info.sliceWidth = bytes.readInt();
        info.sliceHeight = bytes.readInt();
        info.cellWidth = bytes.readInt();
        info.cellHeight = bytes.readInt();
        info.data = [];
        while (bytes.bytesAvailable) {
            info.data.push(bytes.readShort());
        }
        fs.writeFileSync(path.join(MapRoot, p, "info.json"), JSON.stringify(info, null, "    "), "utf-8");
    }
}

function getTabNum(str) {
    let n = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === "\t") {
            n++;
        }
    }
    return n;
}

function revertMonster() {
    let list = FileUtil.readFileListSync(ServerRoot, "monster");
    for (let p of list) {
        let str = fs.readFileSync(path.join(ServerRoot, p), "utf-8");
        let arr = str.split("\n");
        arr.shift();//return\n
        arr.shift();//{\n
        arr.pop();//\n
        arr.pop();//}
        let info = [];
        let obj;
        for (let i = 0, len = arr.length; i < len; i++) {
            obj = {};
            let isPath = false;
            for (; i < len; i++) {
                let s = arr[i];
                if (s.indexOf("\t[") === 0) {
                    continue;
                }
                if (s.indexOf("\t\tpath_coords") === 0) {
                    isPath = true;
                    obj.pts = [];
                }
                if (s.indexOf("\t\tmonsters") === 0) {
                    isPath = false;
                    obj.monsters = [];
                }
                if (s.indexOf("\t\t\t[") === 0) {
                    if (isPath) {
                        obj.pts.push({});
                    } else {
                        obj.monsters.push({});
                    }
                }
                if (
                    s.indexOf("\t\t\t\tx") === 0
                    || s.indexOf("\t\t\t\ty") === 0
                    || s.indexOf("\t\t\t\tindex") === 0
                ) {
                    let k = s.split(" = ")[0].replace("\t\t\t\t", "");
                    if (k === "index") {
                        k = "idx"
                    }
                    let v = parseInt(s.split(" = ")[1].replace(",", ""));
                    if (isPath) {
                        obj.pts[obj.pts.length - 1][k] = v;
                    } else {
                        obj.monsters[obj.monsters.length - 1][k] = v;
                    }
                }
                if (s === "\t},") {
                    break;
                }
            }
            info.push(obj);
        }
        fs.writeFileSync(path.join(MapRoot, p.replace(".monster", ""), "monster.json"),
            JSON.stringify(info, null, "    "), "utf-8");
    }
}

revertMsk();
revertMonster();