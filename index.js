'use strict';

const GrimmService = require('./lib/grimm-service');
const processDeciders = require('./lib/process-deciders');

let singleton;

/**
 * @return {GrimmService}
 */
exports.singleton = () => {
	if (!singleton) {
		singleton = new GrimmService();
	}

	return singleton;
};

/**
 * Create an instance of the GrimmService
 *
 * @param {Object} options
 * @param {String} options.host
 * @param {String} options.apikey
 * @param {Function} [options.processDecider]
 * @param {Function} [options.onSendError]
 * @return {GrimmService}
 */
exports.createGrimmService = (options) => {
	const service = new GrimmService();
	service.configure(options);
	return service;
};

exports.processDeciders = processDeciders;
