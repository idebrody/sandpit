/**
	* Module responsible for getting files from sharepoint
	* 
	* @module mod/sharepoint-functions
	
	*/

const spauth    = require('node-sp-auth');
const request   = require('request');
const rest 		= require('restler');

const loginCredentials = {
	username: process.env.SP_USERNAME,
	password: process.env.SP_PASSWORD
};
const spSite = process.env.SP_SITE;


/**
	* Function will connect to sharepoint using the credentials provided in 
	* the config.
	* @param {object} req - The request object supplied from the login call.
	* Request must have the routing parameter guid which is provided using 
	* express router's path. E.g. (/getspfile/:guid)
	* It also takes an optional query parameter (filename), which can be used
	* to specify a filename in the Content-Disposition header.
	* @param {object} res - The response object from express which is where 
	* the response from sharepoint is piped.
	* Because the function will only act as a proxy, the response to the request
	* will exactly the same as the response from sharepoint, i.e.
	* a octet-stream of the file if everything is ok, or an odata-error object
	* should the request fail.
	*
	*/
exports.getSPFile = (req, res) => {
	let strContentDispostion='attachment';
	
	// Add the filename to the Content-Disposition string 
	// that will be added to the response header.
	// This functionality is not really needed for OHub requests, but 
	// it could be used to provide a filename should it be saved by a browser.
	if (req.query.hasOwnProperty('filename')) {
		strContentDispostion='attachment; filename="'+req.query.filename+'"';
	}
	
	//Build the url using the guid defined within the routing of express
	const url = `${spSite}/_api/web/GetFileById('${req.params.guid}')/$value`;
	spauth.getAuth(url, loginCredentials)
		.then((options) => {
			const headers = options.headers;
			// in case of an error the response will be a json
			headers['Accept']='application/json;odata=nometadata';
			request.get({
				url: url,
				headers: headers
			}).on('response', (response) => {
				response.headers['content-disposition']=strContentDispostion;
			}).pipe(res);
		
		});
};

/**
	* Function will connect to sharepoint using the credentials provided in 
	* the config and downloads the file with the quid and returns it as a 
	* buffer.
	* @param {String} guid  - The global unique ID of the file in SharePoint.
	* @return {Promise} promise - A promise with the a {Buffer} of the file 
	* downloaded, in form fileBuffer, error and status.
	*/
exports.getSPFileBuffer = (guid) => {
	return new Promise((resolve,reject) => {
		//Build the url using the guid defined within the routing of express
		const url = `${spSite}/_api/web/GetFileById('${guid}')/$value`;
		spauth.getAuth(url, loginCredentials)
			.then((options) => {
				const headers = options.headers;
				// in case of an error the response will be a json
				headers['Accept']='application/json;odata=nometadata';
				rest.get(url, {
					headers: headers,
					decoding: 'buffer'
				}).on('success', (fileBuffer) => {
					resolve(fileBuffer);
					return;
				}).on('fail', (data,response) => {
					// On failure, build the error message
					let error;
					const errorJson = JSON.parse(data);
					if (errorJson['odata.error']) {
						error = {
							error: errorJson['odata.error'].message.value
						};
					} else {
						error = {
							error: undefined
						};
					}
					reject({error, status: response.statusCode});
					return;
				}).on('error', (err) => {
					// On parse or connection failure, attempt to return the bad news
					const error = {error: err.code || undefined};
					reject({error, status: 500});
					return;
				});
			});	
	});
};