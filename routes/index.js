const defaultPage = 'index';

const router = require('express').Router();


/* GET home page. */
router.get('/', function (req, res, next) {
	res.send("loaded");
});



module.exports = router;
