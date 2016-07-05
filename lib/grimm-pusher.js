'use strict';

const EventEmitter = require('events');
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
 * @typedef {Object} GrimmPusherOptions
 * @property {String} host
 * @property {String} apikey
 * @property {Number} [throttleMs] Default 0
 * @property {Number} [maxBatchSize] Default 1
 */

class GrimmPusher extends EventEmitter {

	constructor() {
		super();
		this.events = [];
		this.options = {
			maxBatchSize: 1,
			throttleMs: 0
		};
	}

	/**
	 * @param {GrimmPusherOptions} options
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
	 * @return {Promise<void>} Listen to success or error event to intercept events, promise should only be used to know when handling is completed
	 */
	process() {
		return Promise.try(() => {
			// process() might be called directly, deschedule any throttled calls
			if (this.options.throttleMs > 0) {
				this.throttledProcess.cancel();
			}

			if (!this.events.length) {
				return 'No pending Grimm events';
			}

			if (!(this.options.host && this.options.apikey)) {
				throw new Error(`Missing Grimm host or apikey config, unable to send ${this.events.length} events to Grimm`);
			}

			const eventsToSend = [].concat(this.events);
			this.events.length = 0;

			return grimmTransport
				.send(`${this.options.host}/event`, this.options.apikey, eventsToSend)
				.then(() => `Pushed ${eventsToSend.length} events to Grimm`)
				.catch((err) => {
					err.data = {events: eventsToSend};
					throw err;
				});
		})
			.then((message) => {
				this.emit('success', message);
			})
			.catch((err) => {
				this.emit('error', err);
			});
	}
}

module.exports = GrimmPusher;

/**
 * Process or schedule processing of events
 *
 * Unless throttling is enabled, events are processed immediately. When throttling is enabled, the queue is flushed
 * once the number of events matches service.options.maxBatchSize
 *
 * @param {GrimmPusher} service
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
