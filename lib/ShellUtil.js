let child_process = require("child_process");
const { promises } = require("fs");

class ShellUtil {
    static async shell(command, ...args) {
        let cfg = {maxBuffer: 1024 * 1024 * 100, encoding: "utf8"};
        return new Promise((resolve, reject) => {
            const cmd = command + " " + args.join(" ");
            let child = child_process.exec(cmd, cfg, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
            child.stdout.pipe(process.stdout);
        });
    }

    static async svnUpdate(tar) {
        //await ShellUtil.shell("svn", "up", `${tar}`, "--accept", "tc");
        return new Promise((resolve)=>{
            resolve();
        })
    }

    static async svnCommit(tar, ciMsg) {
        await ShellUtil.shell("svn", "add", "--force", `${tar}`, "--auto-props", "--parents", "--depth", "infinity", "-q");
        await ShellUtil.shell("svn", "ci", `"${tar}"`, "-m", `"${ciMsg}"`);
    }

    static async svnDel(tar, ciMsg) {
        await ShellUtil.shell("svn", "del", "--force", `${tar}`);
        await ShellUtil.shell("svn", "ci", `"${tar}"`, "-m", `"${ciMsg}"`);
    }

}

module.exports = ShellUtil;