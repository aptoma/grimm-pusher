'use strict';

const request = require('request-prom');

/**
 * @param {String} url
 * @param {String} apikey
 * @param {Object} payload
 * @return {Promise<Object>} Resolve with response from HTTP request
 */
exports.send = (url, apikey, payload) => {
	return request
		.post(url, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `apikey ${apikey}`
			},
			body: JSON.stringify(payload)
		});
};
