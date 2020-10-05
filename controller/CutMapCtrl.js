const BaseCtrl = require("./BaseCtrl");

let images = require("images");
let path = require("path");
const MsgId = require("../lib/MsgId");
const { get } = require("http");
const { getOutDir, config } = require("../config");
const FileUtil = require("../lib/FileUtil");
const ShellUtil = require("../lib/ShellUtil");
const PublishCode = require("../lib/PublishCode");
const fs = require("fs");

const srcRoot = path.join(getOutDir(), "cutmap");
const tarRoot = path.join(getOutDir(), "map");

class CutMapCtrl extends BaseCtrl {

    constructor() {
        super()
        this.handlerMap[MsgId.cutMap] = this.cupMap;
        this.handlerMap[MsgId.cutMapList] = this.readCutMapList;
    }

    readCutMapList(msg, client) {
        ShellUtil.svnUpdate(srcRoot).then(() => {
            let list = FileUtil.readFileListSync(srcRoot);
            list.sort((a, b) => parseInt(a) - parseInt(b));
            this.sendTo(MsgId.cutMapList, list, client);
        })
    }

    cupMap(msg, client) {
        let { name, width, height, rate } = msg;
        this.sendTo(MsgId.cutMap, { "res": PublishCode.start }, client);
        let ret = this.cut(name, width, height, rate);
        this.sendTo(MsgId.cutMap, { "res": ret }, client);
    }

    cut(name, width, height, rate) {
        if (width <= 0 || height <= 0)
            return PublishCode.input_error;
        let src = images(path.join(srcRoot, name));
        if (!src)
            return PublishCode.not_exists;
        let size = src.size();
        let w = size.width;
        let h = size.height;
        let row = Math.ceil(h / height);
        let colomn = Math.ceil(w / width);
        let dir = path.join(tarRoot, path.basename(name, '.jpg'));
        let picDir = path.join(dir, 'pic');
        FileUtil.mkdirsSync(picDir);
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < colomn; j++) {
                let tar = images(width, height);
                tar.copyFromImage(src, j * width, i * height, width, height).width(width).height(height).save(path.join(picDir, `${j}_${i}.jpg`), "jpg");
            }
        }
        src.resize(w / rate).save(path.join(dir, 'blur.jpg'), "jpg");

        fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify({
            imageWidth: w,
            imageHeight: h,
            sliceWidth: width,
            sliceHeight: height,
            cellWidth: 48,
            cellHeight: 32
        }), "utf-8");
        return PublishCode.success;
    }
}

module.exports = CutMapCtrl;