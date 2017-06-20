// server.js
const express = require('express');
const s3api = require('./mod/s3-functions');

const port = 8000;
const app = express();
const router = express.Router();

require('dotenv').config({silent: true});


app.listen(port, () => {
	console.log('We are live on ' + port);
});

app.use('/',router);
router.get('/s3download/*', s3api.getFile);