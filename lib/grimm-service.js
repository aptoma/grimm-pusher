'use strict';

const Promise = require('bluebird');
const grimmTransport = require('./grimm-transport');
const moment = require('moment-timezone');
const throttle = require('lodash.throttle');

/**
 * @typedef {Object} GrimmEvent
 * @property {String} name
 * @property {Object} [fields]
 * @property {Object} [tags]
 * @property {Number|String|Date} [time]
 */

/**
 * @typedef {Object} GrimmServiceOptions
 * @property {String} host
 * @property {String} apikey
 * @property {Number} [throttleMs] Default 0
 * @property {Number} [maxBatchSize] Default 1
 * @property {Function} [onError]
 */

class GrimmService {

	constructor() {
		this.events = [];
		this.options = {
			maxBatchSize: 1,
			throttleMs: 0,
			onError: (err) => {
				throw err;
			}
		};
	}

	/**
	 * @param {GrimmServiceOptions} options
     */
	configure(options) {
		Object.assign(this.options, options);

		if (this.options.throttleMs > 0) {
			this.throttledProcess = throttle(this.process.bind(this), this.options.throttleMs, {leading: false});
		}
	}

	/**
	 * Add event to event queue
	 *
	 * @param {GrimmEvent} event
	 */
	add(event) {
		event.time = formatDateForGrimm(event.time);
		this.events.push(event);
		onEventAdded(this);
	}

	/**
	 * Send pending events to Grimm
	 *
	 * @return {Promise<String>} Text representing the result of pushing events to Grimm
	 */
	process() {
		if (!this.events.length) {
			return Promise.resolve('No pending Grimm events.');
		}

		if (!(this.options.host && this.options.apikey)) {
			return Promise.reject(`Missing Grimm host or apikey config, unable to send ${this.events.length} events to Grimm.`);
		}

		const eventsToSend = [].concat(this.events);
		this.events.length = 0;

		return grimmTransport
			.send(`${this.options.host}/event`, this.options.apikey, eventsToSend)
			.then(() => `Pushed ${eventsToSend.length} events to Grimm.`)
			.catch((err) => {
				return this.options.onError(err, eventsToSend);
			});
	}
}

module.exports = GrimmService;

/**
 * Process or schedule processing of events
 *
 * Unless throttling is enabled, events are processed immediately. When throttling is enabled, the queue is flushed
 * once the number of events matches service.options.maxBatchSize
 *
 * @param {GrimmService} service
 */
function onEventAdded(service) {
	if (!service.throttledProcess) {
		service.process();
		return;
	}

	service.throttledProcess();

	if (service.events.length === service.options.maxBatchSize) {
		service.throttledProcess.flush();
	}
}

/**
 * @param {*} date Some value that can be parsed by Moment, typically a Date object
 * @return {String}
 */
function formatDateForGrimm(date) {
	const m = moment(date);
	m.tz('Europe/Oslo');
	return m.format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
}
