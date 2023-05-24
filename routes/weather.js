const router = require('express').Router();
const axios = require('axios');
const cors = require('cors');
const cache = require("../models/cache");

router.use(cors());

/* GET home page. */
router.get('/', async function (req, res, next) {

    let url = `https://api.openweathermap.org/data/2.5/weather?lat=45.4028986&lon=-75.683692&appid=82dc1d787a7efd97503ecec1a230ad4f&units=metric`;
    let fetch = await cache.fetchUrl(url);
    let out = {
        "city": fetch.name,
        "country": fetch.sys.country,
        "wDescriptions": fetch.weather.description,
        "wIcon": fetch.weather.icon,
        "temp_min": fetch.main.temp_min,
        "temp_max": fetch.main.temp_max,
        "humidity": fetch.main.humidity,
        "feels_like_temp": fetch.main.feels_like

    };
    res.json(out);
});

module.exports = router;