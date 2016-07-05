'use strict';

const GrimmService = require('./lib/grimm-service');

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
 * @param {GrimmServiceOptions} options
 * @return {GrimmService}
 */
exports.createGrimmService = (options) => {
	const service = new GrimmService();
	service.configure(options);
	return service;
};
