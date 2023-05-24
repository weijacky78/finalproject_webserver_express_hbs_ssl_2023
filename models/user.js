const db = require("../modules/db");
const crypto = require('crypto');

module.exports = {
	'isUser': async function (username) {
		let conn = await db.getConnection();
		const result = await conn.query("select user_id from user where username = ?", [username]);
		conn.end();
		return result.length > 0;
	},
	'addUser': async function (username, email, password) {
		if (!await this.isUser(username)) {
			let conn = await db.getConnection();

			// hash the password 
			// (sha256 "hasher")
			// update generates a hash "object"
			// digest outputs it to a value
			const passHash = (crypto.createHash('sha256')).update(password).digest('base64');

			const validateCode = (crypto.createHash('sha256')).update('' + Math.random() * 99999999999999).digest('base64');


			const result = await conn.query("insert into user (username, email, passHash, validate_code) values (?,?,?,?)", [username, email, passHash, validateCode]);
			conn.end();
			result.code = validateCode;

			result.user = { username: username, email: email, user_id: result.insertId };

			return result;
		} else {
			return false;
		}
	},
	'validateUser': async function (user_id, code) {
		let conn = await db.getConnection();
		console.log(user_id, code);
		const result = await conn.query("select user_id from user where user_id = ? and validate_code = ?", [user_id, code]);
		conn.end();
		if (result.length > 0) {
			conn = await db.getConnection();
			const result = await conn.query("update user set validate_code = null where user_id = ?", [user_id]);
			return true;
		} else {
			return false;
		}
	},
	'logout': async function (user_id) {
		let conn = await db.getConnection();
		const result = await conn.query("update user set cookieHash = null where user_id = ?", [user_id]);
		conn.end();
		return result;
	},
	'cookieLogin': async function (user_id, cookie) {

		let conn = await db.getConnection();
		const cookieHash = (crypto.createHash('sha256')).update(cookie).digest('base64');

		// check if the user_id and cookieHash EXIST in the database
		const result = await conn.query("select user_id,username,email from `user` where user_id = ? and cookieHash = ? and validate_code is null",
			[user_id, cookieHash]);

		conn.end();
		if (result.length > 0) {
			const ret = {
				user: result[0],
				loggedIn: true
			};
			return ret;
		}
		return { loggedIn: false };
	},
	'passwordLogin': async function (username, password) {
		let conn = await db.getConnection();

		const passHash = (crypto.createHash('sha256')).update(password).digest('base64');

		const result = await conn.query("select user_id,username,email from `user` where username = ? and passHash = ? and validate_code is null",
			[username, passHash]);

		conn.end();

		if (result.length > 0) {

			// a secret code, to allow the user to logijn with cookies
			// must match the stored cookieHash, to login with cookies
			let cookie = (crypto.createHash('sha256')).update('' + Math.random() * 99999999999999).digest('base64');
			// hash of cookie, to be store, so when logging in with cookies:
			// the cookie is hashed, and compared to the stored hash
			let cookieHash = (crypto.createHash('sha256')).update(cookie).digest('base64');


			// store the cookieHash in the database
			const connCookie = await db.getConnection();
			const resultCookie = await conn.query("update `user` set cookieHash = ? where user_id = ?",
				[cookieHash, result[0].user_id]);

			connCookie.end();

			// return the user data, the cookie, and a flag to indicate that the user is logged in
			const ret = {
				user: result[0],
				cookie: cookie,
				loggedIn: true
			};
			return ret;
		}

		return { loggedIn: false };
	}
};