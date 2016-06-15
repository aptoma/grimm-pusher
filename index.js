'use strict';

const GrimmService = require('./lib/grimm-service');
const processDeciders = require('./lib/process-deciders');

/**
 *
 * Create an instance of the GrimmService
 *
 * @param {String} host
 * @param {String} apikey
 * @param {Function} processDecider
 * @return {GrimmService}
 */
exports.createGrimmService = (host, apikey, processDecider) => {
	return new GrimmService(host, apikey, processDecider);
};

exports.processDeciders = processDeciders;
