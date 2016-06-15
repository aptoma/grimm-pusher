'use strict';

const Promise = require('bluebird');
const grimmTransport = require('./grimm-transport');
const moment = require('moment-timezone');

/**
 * @typedef {Object} GrimmEvent
 * @property {String} name
 * @property {Object} [fields]
 * @property {Object} [tags]
 * @property {Number|String|Date} [time]
 */

class GrimmService {

	constructor() {
		this.events = [];
		this.lastBatchTime = Date.now();
	}

	/**
	 * @param {Object} options
	 * @param {String} options.host
	 * @param {String} options.apikey
	 * @param {Function} [options.processDecider]
	 * @param {Function} [options.onSendError]
     */
	configure(options) {
		this.host = options.host;
		this.apikey = options.apikey;
		this.processDecider = options.processDecider || (() => true);
		this.onSendError = options.onSendError || null;
	}

	/**
	 * Add event to event queue
	 *
	 * @param {GrimmEvent} event
	 */
	add(event) {
		event.time = formatDateForGrimm(event.time);
		this.events.push(event);

		if (this.processDecider(this.events, this.lastBatchTime)) {
			this.process();
		}
	}

	/**
	 * Send pending events to Grimm
	 *
	 * @return {Promise<String>} Text representing the result of pushing events to Grimm
	 */
	process() {
		this.lastBatchTime = Date.now();
		if (!this.events.length) {
			return Promise.resolve('No pending Grimm events.');
		}

		if (!(this.host && this.apikey)) {
			return Promise.reject(`Missing Grimm host or apikey config, unable to send ${this.events.length} events to Grimm.`);
		}

		const eventsToSend = [].concat(this.events);
		this.events.length = 0;

		return grimmTransport
			.send(`${this.host}/event`, this.apikey, eventsToSend)
			.then(() => `Pushed ${eventsToSend.length} events to Grimm.`)
			.catch((err) => {
				if (this.onSendError) {
					return this.onSendError(err, eventsToSend);
				}

				throw err;
			});
	}
}

module.exports = GrimmService;

/**
 * @param {*} date Some value that can be parsed by Moment, typically a Date object
 * @return {String}
 */
function formatDateForGrimm(date) {
	const m = moment(date);
	m.tz('Europe/Oslo');
	return m.format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
}
