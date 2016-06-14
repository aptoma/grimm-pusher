'use strict';

const Promise = require('bluebird');
const grimmTransport = require('./grimm-transport');
const Joi = require('joi');
const moment = require('moment-timezone');

/**
 * @typedef {Object} GrimmEvent
 * @property {String} name
 * @property {Object} [fields]
 * @property {Object} [tags]
 * @property {String} [timestamp] Timestamp formatted as 'YYYY-MM-DD HH:mm:ss.SSS ZZ'
 */

/**
 * This event validation should match the event validation in Grimm
 * @see https://github.com/aptoma/grimm/blob/3d57cbf9bb2e336606dea37342bd2593cf415ccf/src/routes/event/index.js#L6-L11
 */
const eventValidation = Joi.object({
	name: Joi.string().token().description('Event name'),
	time: Joi.date().timestamp('javascript').optional().description('When this event occured.'),
	fields: Joi.object().optional(),
	tags: Joi.object().optional()
});

class GrimmService {

	/**
	 * @param {String} host
	 * @param {String} apikey
	 */
	constructor(host, apikey) {
		this.host = host;
		this.apikey = apikey;
		this.events = [];
	}

	/**
	 * Add event to event queue
	 *
	 * @param {GrimmEvent} event
	 */
	add(event) {
		Joi.validate(event, eventValidation, (err, result) => {
			if (err) {
				throw Error(`Invalid event: ${err.message}`);
			}
			result.time = timestamp(result.time);
			this.events.push(result);
		});
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

		if (!(this.host && this.apikey)) {
			return Promise.reject(`Missing Grimm host or apikey config, unable to send ${this.events.length} events to Grimm.`);
		}

		const eventsToSend = [].concat(this.events);
		this.events.length = 0;

		return grimmTransport
			.send(`${this.host}/event`, this.apikey, eventsToSend)
			.then(() => `Pushed ${eventsToSend.length} events to Grimm.`);
	}
}

module.exports = GrimmService;

function timestamp(date) {
	const m = moment(date);
	m.tz('Europe/Oslo');
	return m.format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
}
