'use strict';

const GrimmPusher = require('./lib/grimm-pusher');

let singleton;

/**
 * @return {GrimmPusher}
 */
exports.singleton = () => {
	if (!singleton) {
		singleton = new GrimmPusher();
	}

	return singleton;
};

/**
 * Create an instance of the GrimmPusher service
 *
 * @param {GrimmPusherOptions} options
 * @return {GrimmPusher}
 */
exports.createService = (options) => {
	const service = new GrimmPusher();
	service.configure(options);
	return service;
};
