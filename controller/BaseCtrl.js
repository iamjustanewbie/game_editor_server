class BaseCtrl {
    constructor() {
        this.handlerMap = {};
    }

    /**
     * @param {ServerBase} server
     */
    setOwner(server) {
        this.owner = server;
    }

    handle(id, msg, client) {
        let handler = this.handlerMap[id];
        if (handler) {
            return handler.call(this, msg, client);
        }
    }

    /**
     * @return {Set}
     */
    getClients() {
        return this.owner.wsServer.clients;
    }

    /**
     * send msg to client
     * @param {number} id
     * @param {object} msg
     * @param {WebSocket} client
     * @return {void}
     */
    sendTo(id, msg, client) {
        if (!client) {
            return;
        }
        this.owner.sendTo(id, msg, client);
    }

}

module.exports = BaseCtrl;