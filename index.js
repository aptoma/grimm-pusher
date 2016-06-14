'use strict';

const GrimmService = require('./lib/grimm-service');

/**
 *
 * @param {String} host
 * @param {String} apikey
 * @return {GrimmService}
 */
module.exports = (host, apikey) => {
	return new GrimmService(host, apikey);
};
