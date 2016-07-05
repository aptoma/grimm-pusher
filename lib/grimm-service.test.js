'use strict';

const assert = require('chai').assert;
const td = require('testdouble');

const grimmTransport = td.replace('./grimm-transport');
const createGrimmService = require('./..').createGrimmService;
const singleton = require('./..').singleton;

const options = {
	host: 'http://example.com',
	apikey: 'foo',
	throttleMs: 100,
	maxBatchSize: 2,
	processDecider: () => false
};

const optionsWithoutThrottling = Object.assign({}, options, {throttleMs: 0});
const optionsWithoutMaxBatchSize = Object.assign({}, options, {throttleMs: 0});
delete optionsWithoutMaxBatchSize.maxBatchSize;

const grimmEventUrl = `${options.host}/event`;

function mockGrimmTransportSendOK() {
	td.when(grimmTransport.send(), {ignoreExtraArgs: true}).thenReturn((Promise.resolve('')));
}

describe('singleton()', () => {
	it('should allow instantiation as singleton', () => {
		const instanceA = singleton();
		instanceA.configure(options);
		const instanceB = singleton();

		assert.equal(instanceA, instanceB);
		assert.equal('foo', instanceA.options.apikey);
		assert.equal('foo', instanceB.options.apikey);
	});
});

describe('add()', () => {
	const validTimestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{3} \+\d{4}$/;
	let subject;

	afterEach(() => {
		td.reset();
		if (subject.throttledProcess) {
			subject.throttledProcess.cancel();
		}
	});

	it('should add event', () => {
		subject = createGrimmService(options);

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

		assert.lengthOf(subject.events, 1, 'Event should be added to subject.events');
	});

	describe('date handling', () => {
		it('should set time to now when time is not provided', () => {
			subject = createGrimmService(options);

			const event = {
				name: 'SomeEvent'
			};
			subject.add(event);

			assert.match(subject.events[0].time, validTimestampRegex);
		});

		it('should convert javascript timestamp to date string', () => {
			subject = createGrimmService(options);

			const event = {
				name: 'SomeEvent',
				time: Date.now()
			};
			subject.add(event);

			assert.match(subject.events[0].time, validTimestampRegex);
		});

		it('should convert javascript date to date string', () => {
			subject = createGrimmService(options);

			const event = {
				name: 'SomeEvent',
				time: new Date()
			};

			subject.add(event);

			assert.match(subject.events[0].time, validTimestampRegex);
		});
	});

	describe('batch processing', () => {
		it('should default to a batch size of 1', () => {
			subject = createGrimmService(optionsWithoutMaxBatchSize);
			mockGrimmTransportSendOK();

			subject.add({name: 'foo'});
			assert.lengthOf(subject.events, 0);
		});

		it('should trigger process if max batch size is reached', () => {
			subject = createGrimmService(Object.assign({}, optionsWithoutThrottling, {maxBatchSize: 2}));
			subject.events.push({name: 'bar'});

			mockGrimmTransportSendOK();
			subject.add({name: 'foo'});
			assert.lengthOf(subject.events, 0);
		});

		it('should not trigger process if max batch size is not reached', () => {
			subject = createGrimmService(options);

			subject.add({name: 'foo'});
			assert.lengthOf(subject.events, 1);
		});
	});

	describe('throttling', () => {
		it('should not trigger processing before throttle delay has passed', () => {
			subject = createGrimmService(Object.assign({}, options, {throttleMs: 1000, maxBatchSize: 2}));

			subject.add({name: 'foo'});
			assert.lengthOf(subject.events, 1);
		});

		it('should trigger processing when throttle delay has passed', (done) => {
			subject = createGrimmService(Object.assign({}, options, {throttleMs: 5, maxBatchSize: 2}));

			mockGrimmTransportSendOK();
			subject.add({name: 'foo'});
			setTimeout(() => {
				assert.lengthOf(subject.events, 0);
				done();
			}, 10);
		});

		it('should trigger processing when throttling is set to 0 ms', () => {
			subject = createGrimmService(Object.assign({}, options, {throttleMs: 0, maxBatchSize: 2}));

			mockGrimmTransportSendOK();
			subject.add({name: 'foo'});
			assert.lengthOf(subject.events, 0);
		});

		it('should trigger processing when max batch size is reached, even when throttling is enabled', () => {
			subject = createGrimmService(Object.assign({}, options, {throttleMs: 100, maxBatchSize: 1}));
			mockGrimmTransportSendOK();
			subject.add({name: 'foo'});

			assert.lengthOf(subject.events, 0);
		});
	});
});

describe('process()', () => {
	afterEach(() => {
		td.reset();
	});

	it('should resolve when there are no pending events', (done) => {
		const subject = createGrimmService(options);
		const expected = 'No pending Grimm events.';

		subject.process().then((actual) => {
			assert.equal(actual, expected);
			done();
		});
	});

	it('should reject when apikey is missing', (done) => {
		const subject = createGrimmService(Object.assign({}, options, {apikey: null}));
		subject.events.push({name: 'foo'});

		subject.process().catch(() => {
			done();
		});
	});

	it('should send events and resolve when there are pending events', (done) => {
		const subject = createGrimmService(options);
		const event = {name: 'foo'};
		subject.add(event);
		td.when(grimmTransport.send(grimmEventUrl, options.apikey, [subject.events[0]])).thenReturn(Promise.resolve(''));

		subject.process()
			.then((actual) => {
				assert.equal(actual, 'Pushed 1 events to Grimm.');
				done();
			})
			.catch(done);
	});

	it('should call custom onError callback if provided', (done) => {
		const subject = createGrimmService(Object.assign({}, options, {
			onError: (err, events) => {
				assert.equal('Error occured', err.message);
				assert.lengthOf(events, 1);
				done();
			}
		}));
		const event = {name: 'foo'};
		subject.events.push(event);

		td.when(grimmTransport.send(grimmEventUrl, options.apikey, [subject.events[0]])).thenReturn(Promise.reject(Error('Error occured')));

		subject.process().catch(done);
	});
});
