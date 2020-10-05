const path = require("path");
let fs = require("fs");
let config = {};
exports.config = config;
const conf_path = path.resolve(__dirname, "config.json");

function loadConfig(){
    let str = fs.readFileSync(conf_path);
    config = JSON.parse(str);
}

exports.getOutDir = function (){
    return path.resolve(__dirname, config.editorout);
}

exports.getPubDir = function (){
    return path.resolve(__dirname, config.editorpub);
}

loadConfig();