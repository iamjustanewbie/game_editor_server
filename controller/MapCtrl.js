const BaseCtrl = require("./BaseCtrl");
const MsgId = require("../lib/MsgId");
const PublishCode = require("../lib/PublishCode");
const fs = require("fs");
const path = require("path");
const FileUtil = require("../lib/FileUtil");
const ShellUtil = require("../lib/ShellUtil");
const ByteArray = require("../lib/ByteArray");
const zlib = require("zlib");
const { getOutDir, getPubDir } = require("../config");

const MapRoot = path.join(getOutDir(), "./map/");
const PublishRoot = path.join(getPubDir(), "./client/map/");
const ServerRoot = path.join(getPubDir(), "./server/");

function getInfoPath(mapId) {
    return path.join(MapRoot, mapId.toString(), "info.json");
}

class Map extends BaseCtrl {

    constructor() {
        super();
        this.handlerMap[MsgId.getMapList] = this.getMapList;
        this.handlerMap[MsgId.getMapInfo] = this.getMapInfo;
        this.handlerMap[MsgId.setMapInfo] = this.setMapInfo;
        this.handlerMap[MsgId.publishMap] = this.publishMap;
    }

    getMapList(msg, client) {
        ShellUtil.svnUpdate(MapRoot).then(() => {
            let list = FileUtil.readDirListSync(MapRoot);
            list.sort((a, b) => parseInt(a) - parseInt(b));
            this.sendTo(MsgId.getMapList, list, client);
        });
    }

    getMapInfo(msg, client) {
        let {
            mapId
        } = msg;
        let p = getInfoPath(mapId);
        let str = fs.readFileSync(p, "utf-8");
        let obj = JSON.parse(str);
        if (!obj.data) {
            obj.cellWidth = 32;
            obj.cellHeight = 32;
            obj.data = [];
            let numCol = obj.imageWidth / obj.cellWidth;
            let numRow = obj.imageHeight / obj.cellHeight;
            for (let i = 0, n = numCol * numRow; i < n; i++) {
                obj.data[i] = 0;
            }
            fs.writeFileSync(p, JSON.stringify(obj, null, "    "), "utf-8");
        }
        client.curMapId = mapId;
        return obj;
    }

    setMapInfo(msg, client) {
        let {
            mapId,
            idx,
            status
        } = msg;
        let p = getInfoPath(mapId);
        let str = fs.readFileSync(p, "utf-8");
        let obj = JSON.parse(str);
        if (obj.data) {
            obj.data[idx] = status;
        }
        fs.writeFileSync(p, JSON.stringify(obj, null, "    "), "utf-8");
        this.getClients().forEach(tc => {
            if (tc !== client && tc.curMapId === mapId) {
                this.sendTo(MsgId.setMapInfo, msg, tc);
            }
        });
        return null;
    }

    async startPublish(mapId, info, client) {
        await this.svnUpdate(mapId);
        let dir = path.join(MapRoot, mapId.toString());
        let tarDir = dir.replace(MapRoot, PublishRoot);
        let files = FileUtil.walkSync(dir);
        for (let f of files) {
            let extname = path.extname(f);
            if (extname !== ".jpg") {
                continue;
            }
            let tf = f.replace(MapRoot, PublishRoot);
            let td = path.dirname(tf);
            FileUtil.mkdirsSync(td);
            if (path.basename(f) === "small.jpg") {
                tf = tf.replace("small.jpg", "blur.jpg");
            }
            fs.copyFileSync(f, tf);
        }

        let jsonList = FileUtil.walkSync(MapRoot, undefined, ".json");
        let data = [];
        let serverData = {};
        for (let jsonP of jsonList) {
            if (path.basename(jsonP) !== "info.json") {
                continue;
            }
            let maskP = jsonP.replace(MapRoot + path.sep, "assets/map/").replace(/\\/g, "/").replace("info.json", "mask.bin");
            let mapInfo = JSON.parse(fs.readFileSync(jsonP, "utf-8"));
            let mapData = {};
            mapData.mW = mapInfo.imageWidth;
            mapData.mH = mapInfo.imageHeight;
            mapData.sW = mapInfo.sliceWidth;
            mapData.sH = mapInfo.sliceHeight;
            mapData.cW = mapInfo.cellWidth;
            mapData.cH = mapInfo.cellHeight;
            mapData.d = [];
            mapData.s = [];
            for (let i = 0, n = mapInfo.data.length; i < n; i++) {
                if (mapInfo.data[i]) {
                    mapData.d.push(i);
                }
                if (mapInfo.data[i] == 2) {
                    mapData.s.push(i);
                }
            }

            data.push(JSON.stringify({
                key: maskP,
                value: mapData
            }));

            serverData[path.basename(path.dirname(jsonP))] = {
                mW: mapData.mW,
                mH: mapData.mH,
                sW: mapData.sW,
                sH: mapData.sH,
                cW: mapData.cW,
                cH: mapData.cH,
                d: mapData.d,
            }
        }
        let time = Date.now();
        //data.unshift(JSON.stringify({key: "assets/map/map_version", value: time.toString()}));
        let dataPath = path.join(PublishRoot, "map.json");

        let serverPath = path.join(ServerRoot, "map.js");
        fs.writeFileSync(dataPath, JSON.stringify(data, null, "  "), "utf-8");
        fs.writeFileSync(serverPath, "export const MapData =" + JSON.stringify(serverData, null, "  "), "utf-8");

        // let serverData = new ByteArray();
        // serverData.writeInt(info.imageWidth);
        // serverData.writeInt(info.imageHeight);
        // serverData.writeInt(info.cellWidth);
        // serverData.writeInt(info.cellHeight);
        // for (let i = 0, n = info.data.length; i < n; i++) {
        //     serverData.writeShort(info.data[i]);
        // }
        // let serverPath = path.join(ServerRoot, mapId.toString() + ".msk");
        // fs.writeFileSync(serverPath, Buffer.from(serverData.buffer));
        // serverData.clear();
        await this.svnCommit(serverPath, tarDir, time, mapId);
        this.processing = false;
        console.log(tarDir, "发布完成");
        this.sendTo(MsgId.publishMap, {
            "res": PublishCode.success
        }, client);
    }

    publishMap(msg, client) {
        let {
            mapId
        } = msg;
        if (this.processing) {
            return {
                "res": PublishCode.busy
            };
        }
        let p = getInfoPath(mapId);
        let info;
        try {
            let str = fs.readFileSync(p, "utf-8");
            info = JSON.parse(str);
            if (!info.data) {
                return {
                    "res": PublishCode.not_init
                };
            }
        } catch (e) {
            return {
                "res": PublishCode.not_exists
            };
        }
        this.processing = true;
        this.startPublish(mapId, info, client);
        return {
            "res": PublishCode.start
        };
    }

    async svnUpdate(mapId) {
        await ShellUtil.svnUpdate(path.join(MapRoot, mapId.toString()));
        await ShellUtil.svnUpdate(ServerRoot);
        await ShellUtil.svnUpdate(PublishRoot);
    }

    async svnCommit(serverPath, tarDir, time, mapId) {
        await ShellUtil.svnCommit(getInfoPath(mapId), "editor publish map cfg");
        fs.writeFileSync(path.join(ServerRoot, "map_version"), time.toString(), "utf8");
        await ShellUtil.svnCommit(path.join(ServerRoot, "map_version"), "editor publish map cfg");
        await ShellUtil.svnCommit(serverPath, "editor publish map cfg");
        await ShellUtil.svnCommit(tarDir, "editor publish map cfg");
        await ShellUtil.svnCommit(path.join(PublishRoot, "map.json"), "editor publish map cfg");
    }

}

module.exports = Map;