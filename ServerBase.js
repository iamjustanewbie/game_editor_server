const WebSocketServer = require("ws").Server;
const ByteArray = require("./lib/ByteArray");
const BaseCtrl = require("./controller/BaseCtrl");

class ServerBase {

    constructor() {
        this.ctrlMap = {};
        this.wsServer = null;
        this.bytes = new ByteArray();
    }

    /**
     * start server
     * @param {string} host
     * @param {number} port
     */
    start(host, port) {
        this.wsServer = new WebSocketServer({host, port});
        this.wsServer.on("connection", this.onConnection.bind(this));
        this.wsServer.on("error", this.onError.bind(this));
    }

    /**
     * @private
     */
    onError(err) {
        console.error(err);
    }

    /**
     * @private
     * @param {WebSocket} client
     * @param {IncomingMessage} req
     */
    onConnection(client, req) {
        let clientIp = ServerBase.getClientIP(req);
        console.log("connect from:", clientIp);
        client.clientIp = clientIp;
        client.onopen = this.onClientOpen.bind(this);
        client.onclose = this.onClientClose.bind(this);
        client.onmessage = this.onClientMessage.bind(this);
        client.onerror = this.onClientError.bind(this);
    }

    /**
     * broadcast msg
     * @param {object} msg msg to send
     * @param {WebSocket} [sender] sender socket
     * @return {void}
     */
    broadcast(msg, sender) {
        if (!this.wsServer) {
            return;
        }

        /**
         * @param {WebSocket} client
         */
        function sendTo(client) {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(msg, undefined, undefined);
            }
        }

        this.wsServer.clients.forEach(sendTo);
    }

    /**
     * send msg to client
     * @param {number} id
     * @param {object} msg
     * @param {WebSocket} client
     */
    sendTo(id, msg, client) {
        if (!this.wsServer.clients.has(client)) {
            return;
        }
        console.log("send to:", client.clientIp, id, msg);
        try {
            this.bytes.clear();
            this.bytes.writeInt(id);
            if (msg) {
                this.bytes.writeUTFBytes(JSON.stringify(msg));
            }
            client.send(this.bytes.bytes, undefined, undefined);
        } catch (e) {
            console.error(e);
        }
    }

    /**
     *
     * @param {number} type
     * @param {BaseCtrl} ctrl
     * @return {void}
     */
    add(type, ctrl) {
        ctrl.setOwner(this);
        this.ctrlMap[type] = ctrl;
    }

    /**
     * @private
     * @param {OpenEvent}e
     * @param {WebSocket}e.target
     */
    onClientOpen(e) {
        let client = e.target;
    }

    /**
     * @private
     * @param {MessageEvent} e
     * @param {WebSocket} e.target
     * @param {(String|Buffer|ArrayBuffer|Buffer[])} e.data
     */
    onClientMessage(e) {
        let id = 0;
        let r = null;
        let client = e.target;
        let buffer = e.data;
        let self = this;
        try {
            self.bytes.clear();
            self.bytes.buffer = buffer;
            id = self.bytes.readInt();
            let msg = undefined;
            if (self.bytes.bytesAvailable) {
                let str = self.bytes.readUTFBytes(self.bytes.bytesAvailable);
                msg = JSON.parse(str);
            }
            console.log("receive from:", client.clientIp, id, msg);
            let type = Math.floor(id / 100);
            let ctrl = self.ctrlMap[type];
            if (ctrl) {
                r = ctrl.handle(id, msg, client);
            }
        } catch (e) {
            console.error(e);
        }
        if (r) {
            self.sendTo(id, r, client);
        }
    }

    /**
     * @private
     * @param {CloseEvent} e
     * @param {WebSocket} e.target
     */
    onClientClose(e) {
        let client = e.target;
        let self = this;
        console.log("close:", client.clientIp, "code:", e.code, "reason:", e.reason);
    }

    /**
     * @private
     * @param {ErrorEvent} e
     */
    onClientError(e) {
        let client = this;
        let self = this;
        console.log("client err:", client.clientIp, e.error);
    }

    static getClientIP(req) {
        return req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
            req.connection.remoteAddress || // 判断 connection 的远程 IP
            req.socket.remoteAddress || // 判断后端的 socket 的 IP
            req.connection.socket.remoteAddress;
    }

}

ServerBase.ins = new ServerBase();

module.exports = ServerBase;