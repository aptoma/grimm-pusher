'use strict';

const assert = require('chai').assert;
const td = require('testdouble');

const grimmTransport = td.replace('./grimm-transport');
const createGrimmService = require('./..').createGrimmService;

const host = 'http://example.com';
const apikey = 'foo';
const grimmEventUrl = `${host}/event`;

describe('add()', () => {
	afterEach(() => {
		td.reset();
	});

	describe('event validation', () => {
		const validTimestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3} \+\d{4}$/;

		it('should set time to now when time is not provided', () => {
			const subject = createGrimmService(host, apikey);
			const event = {
				name: 'SomeEvent'
			};

			subject.add(event);

			assert.match(subject.events[0].time, validTimestampRegex);
		});

		it('should convert javascript timestamp to date string', () => {
			const subject = createGrimmService(host, apikey);
			const event = {
				name: 'SomeEvent',
				time: Date.now()
			};

			subject.add(event);

			assert.match(subject.events[0].time, validTimestampRegex);
		});

		it('should convert javascript date to date string', () => {
			const subject = createGrimmService(host, apikey);
			const event = {
				name: 'SomeEvent',
				time: new Date()
			};

			subject.add(event);

			assert.match(subject.events[0].time, validTimestampRegex);
		});

		it('should accept valid events', () => {
			const subject = createGrimmService(host, apikey);
			const event = {
				name: 'SomeEvent',
				time: Date.now(),
				tags: {
					service: 'foo-service'
				},
				fields: {
					msec: 12
				}
			};

			subject.add(event);
			assert(subject.events.length === 1, 'Event should be added to subject.events');
		});
	});

	describe('batch processing', () => {
		it('should trigger process if batch manager returns true', () => {
			const subject = createGrimmService(host, apikey, () => {
				return true;
			});

			td.when(grimmTransport.send(), {ignoreExtraArgs: true}).thenReturn((Promise.resolve('')));
			subject.add({name: 'foo'});
			assert.lengthOf(subject.events, 0);
		});

		it('should not trigger process if batch manager returns false', () => {
			const subject = createGrimmService(host, apikey, () => {
				return false;
			});

			td.when(grimmTransport.send(), {ignoreExtraArgs: true}).thenReturn((Promise.resolve('')));
			subject.add({name: 'foo'});
			assert.lengthOf(subject.events, 1);
		});
	});
});

describe('process()', () => {
	afterEach(() => {
		td.reset();
	});

	it('should resolve when there are no pending events', (done) => {
		const subject = createGrimmService(host, apikey);
		const expected = 'No pending Grimm events.';

		subject.process().then((actual) => {
			assert.equal(actual, expected);
			done();
		});
	});

	it('should reject when apikey is missing', (done) => {
		const subject = createGrimmService(host);
		subject.add({name: 'foo'});

		subject.process().catch(() => {
			done();
		});
	});

	it('should send events and resolve when there are pending events', (done) => {
		const subject = createGrimmService(host, apikey);
		const event = {name: 'foo'};
		subject.add(event);


		td.when(grimmTransport.send(grimmEventUrl, apikey, [subject.events[0]])).thenReturn(Promise.resolve(''));

		subject.process().then((actual) => {
			assert.equal(actual, 'Pushed 1 events to Grimm.');
			done();
		})
			.catch(done);
	});
});
