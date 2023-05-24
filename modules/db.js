const db = require('mariadb');
const dbConfig = require('../config/dbConfig');

let dbPool = {

    connected: false,
    init: () => {
        this.pool = db.createPool(dbConfig);
        this.connected = true;
    },
    getConnection: async () => {
        if (this.connected) {
            return await this.pool.getConnection();
        } else {
            throw "MariaDB not connected";
        }
    }
};

module.exports = dbPool;