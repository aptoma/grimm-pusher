'use strict';

const GrimmService = require('./lib/grimm-service');

/**
 *
 * Create an instance of the GrimmService
 *
 * @param {String} host
 * @param {String} apikey
 * @return {GrimmService}
 */
module.exports = (host, apikey) => {
	return new GrimmService(host, apikey);
};
