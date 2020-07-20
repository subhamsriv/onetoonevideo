var express = require('express');
var router = express.Router();
const path = require('path');

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log(__dirname);
  res.sendFile('/conference.html',{
    root: path.join( __dirname, '/../public' )
  });
});

module.exports = router;
