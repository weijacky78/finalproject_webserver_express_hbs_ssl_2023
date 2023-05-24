const db = require("../modules/db");

module.exports = {

	// method to retrieve a page from the database
	'getPage': async function (key) { // key ==> care
		let conn = await db.getConnection();
		key = key.toLowerCase();

		// query to retrieve data for the page with `key` ==> "care"
		const result = await conn.query("select page_id,title,content,`key` from page where `key` = ?", [key]);



		let status = conn.end(); // release the connection back to the pool
		//console.log(result.length);

		let ret; // define ret at this scope level
		if (result.length < 1) { // check that there is at least 1 row
			// define result structure - no results
			return {
				'row': null,
				'status': false
			}
		} else {
			// define result structure: row has first (only) row of results in object notation
			return {
				'row': result[0],
				'status': true
			};
		}


	},
	'getMenuItems': async function (currentKey = null) {
		let conn = await db.getConnection();
		const result = await conn.query("select page_id,title,`key` from page where menu_order is not null order by menu_order");
		conn.end();

		if (currentKey != null) {
			for (let i = 0; i < result.length; i++) {
				if (result[i].key == currentKey) {
					result[i].current = true;
				}
			}
		}

		return result;
	},
	'updatePage': async function (key, user_id, title, content) {
		let conn = await db.getConnection();
		key = key.toLowerCase();
		const result = await conn.query(
			"update page set title = ?, content = ? where `key` = ?",
			[title, content, key]);
		conn.end();

		let connHistory = await db.getConnection();
		const resultHistory = await connHistory.query(
			"INSERT INTO page_history (page_key,user_id,content) VALUES(?, ?, ?)",
			[key, user_id, content]);
		return result;
	},
	'addPage': async function (key, user_id, title, content, menu_order = 1) {
		let conn = await db.getConnection();
		key = key.toLowerCase();
		if (key == "" || title == "") {
			return false;
		}
		let result = false;
		try {
			result = await conn.query(
				"insert into page (`key`,title,content,menu_order) values (?,?,?,?)",
				[key, title, content, menu_order]);

			let connHistory = await db.getConnection();
			const resultHistory = await connHistory.query(
				"INSERT INTO page_history (page_key,user_id,content) VALUES(?, ?, ?)",
				[key, user_id, content]);
		} catch (e) {
			console.log(e);
		}
		conn.end();
		return result;
	},
	'deletePage': async function (key) {
		let conn = await db.getConnection();
		key = key.toLowerCase();
		const result = await conn.query(
			"delete from page where `key` = ?",
			[key]);
		conn.end();
		return result;
	}
};
