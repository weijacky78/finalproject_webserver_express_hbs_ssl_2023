const axios = require("axios");
const db = require("../modules/db");

const minExpire = 30;

module.exports = class {
    static async fetchUrl(url) {
        const dbConn = await db.getConnection();

        const rows = await dbConn.query("select `data`, timestampdiff(minute,`date`,NOW()) as age from cache where url like ? and timestampdiff(minute,`date`,NOW()) <= ? order by `date` desc limit 1",
            [url, minExpire]);

        if (rows.length > 0) {
            dbConn.end(); // close the dbconn to release resources
            let age = Number(rows[0].age); // minutes from datediff can be big, so stored as BigInt, but ours is small so we convert
            let diff = minExpire - age; // time until cache miss
            let data = JSON.parse(rows[0].data); // parse as json
            data.cache = { age: age, expires: diff };
            return data;
        }

        // cache is too old, or nonexistent

        try {
            const fetch = await axios.get(url, { timeout: 1500 });

            let data = fetch.data;
            // insert new cache data for url
            let row = await dbConn.query("INSERT INTO cache (url,`data`) VALUES (?,?);", [url, JSON.stringify(data)]);
            dbConn.end();
            data.cache = { age: 0, expires: minExpire }; // provide same data structure as cache hit
            return data;


        } catch (err) {

            const rows = await dbConn.query("select `data`, timestampdiff(minute,`date`,NOW()) as age from cache where url like ? order by `date` desc limit 1", [url]);
            if (rows.length > 0) {

                dbConn.end(); // close the dbconn to release resources
                let age = Number(rows[0].age); // minutes from datediff can be big, so stored as BigInt, but ours is small so we convert
                let diff = minExpire - age; // time until cache miss
                let data = JSON.parse(rows[0].data); // parse as json
                data.cache = { age: age, expires: diff };

                return data;
            }

            dbConn.end();
            return { error: `unable to retrieve requested data from: ${url}`, url: url };

        }
    }
};