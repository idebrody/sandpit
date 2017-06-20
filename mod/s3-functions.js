/**
	* Module responsible for getting files from sharepoint
	* 
	* @module mod/sharepoint-functions
    
	*/

// eams-cloud-media/downloads/eams/index.yml

require('dotenv').config({silent: true});
const _ = require('lodash');
const AWS = require('aws-sdk');


const s3Options = {
	apiVersion: '2006-03-01',
	accessKeyId: process.env.S3_ACCESSKEY,
	secretAccessKey: process.env.S3_SECRETKEY
};
const s3_bucket=process.env.S3_BUCKET;
const s3 = new AWS.S3(s3Options);

exports.getFile = (req, res) => {
	const params = {
		Bucket: s3_bucket,
		Key: req.params[0] //'downloads/eams/index.yml' //req.params.path
	};
	//console.log (params);
	//console.log (req.params[0]);
	s3.getObject(params)
	.on('httpHeaders', (code, headers) => {
		if (code < 300) {
			res.set(_.pick(
				headers, 
				'content-type', 
				'content-length', 
				'last-modified'
			));
		}                            
	})
    .createReadStream()
    .pipe(res);
};

