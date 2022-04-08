const express = require('express');
const router = express.Router();
const UrlController = require("../Controller/UrlController")


router.post("/url/shorten",UrlController.createUrl)

router.get("/:urlCode",UrlController.getUrl)

module.exports = router;