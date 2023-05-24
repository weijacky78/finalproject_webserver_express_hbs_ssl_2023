const user = require('../models/user');
module.exports = async (req, res, next) => {

	req.login = { loggedIn: false };

	if (req.body.username != undefined && req.body.password != undefined && req.body.action == 'login') {
		let auth = await user.passwordLogin(
			req.body.username,
			req.body.password);

		req.login = auth;

		// if logged in, set cookies
		if (req.login.loggedIn) {
			// store a cookie for the user_id
			res.cookie('uid', req.login.user.user_id, { maxAge: 1000 * 60 * 60 * 24 * 5 });
			// store as cookie for cookie code
			res.cookie('ch', req.login.cookie, { maxAge: 1000 * 60 * 60 * 24 * 5 });
			//console.log("requested redirect:" + req.body.redirect);
			if (req.body.redirect != undefined &&
				req.body.redirect != '' &&
				req.body.redirect != null
			) {
				res.redirect(req.body.redirect); // if redirect location specified... redirect there
			} else {
				res.redirect('/'); // redirect location is blank, redirect to home page
			}
		}
	}

	if (!req.login.loggedIn && req.cookies.uid != undefined && req.cookies.ch != undefined) {
		// if uid and cookie code are set, try logging in with cookies
		let auth = await user.cookieLogin(req.cookies.uid, req.cookies.ch);
		req.login = auth;

		if (req.query.logout != undefined) {
			// clear cookies
			req.login = { loggedIn: false };
			res.clearCookie('uid');
			res.clearCookie('ch');

		}

	}

	next();
}