'use strict';

const assert = require('chai').assert;
const td = require('testdouble');

const grimmTransport = td.replace('./grimm-transport');
const createGrimmService = require('./..');

const host = 'http://example.com';
const apikey = 'foo';

describe('add()', () => {
	it('should require name', () => {
		const subject = createGrimmService(host, apikey);
		const event = {
			foo: false
		};

		assert.throws(() => {
			subject.add(event);
		});
	});

	it('should require name to be a token', () => {
		const subject = createGrimmService(host, apikey);
		const event = {
			name: 'Name with spaces'
		};

		assert.throws(() => {
			subject.add(event);
		});

	});

	it('should fail on extra keys', () => {
		const subject = createGrimmService(host, apikey);
		const event = {
			name: 'SomeEvent',
			foo: false,
			bar: true
		};

		assert.throws(() => {
			subject.add(event);
		});

	});

	it('should accept valid events', () => {
		const subject = createGrimmService(host, apikey);
		const event = {
			name: 'SomeEvent',
			time: '2016-06-14 14:01:23.779 +0200',
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

		td.when(grimmTransport.send(`${host}/event`, apikey, [event])).thenReturn(Promise.resolve(''));

		subject.process().then((actual) => {
			assert.equal(actual, 'Pushed 1 events to Grimm.');
			done();
		})
			.catch(done);
	});
});
