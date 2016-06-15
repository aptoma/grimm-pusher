'use strict';

const assert = require('chai').assert;

const processDeciders = require('./process-deciders');

describe('ProcessDecider', () => {
	describe('never', () => {
		it('should always return false', () => {
			const subject = processDeciders.never();
			assert.isFalse(subject());
		});
	});

	describe('always', () => {
		it('should always return false', () => {
			const subject = processDeciders.always();
			assert.isTrue(subject());
		});
	});

	describe('minItems', () => {
		it('should return false if items.length is less than minItems', () => {
			const subject = processDeciders.minItems(3);
			assert.isFalse(subject([0, 1]));
		});

		it('should return true if items.length is equal to minItems', () => {
			const subject = processDeciders.minItems(2);
			assert.isTrue(subject([0, 1]));
		});

		it('should return true if items.length is greater than minItems', () => {
			const subject = processDeciders.minItems(2);
			assert.isTrue(subject([0, 1, 2]));
		});
	});

	describe('debounce', () => {
		it('should return false if the current time is less than `interval` apart from last batch', () => {
			const subject = processDeciders.debounce(500);
			assert.isFalse(subject([], Date.now() - 100));
		});

		it('should return true if the current time is more than `interval` apart from last batch', () => {
			const subject = processDeciders.debounce(500);
			assert.isTrue(subject([], Date.now() - 1000));
		});
	});

	describe('every', () => {
		it('should return true if all matchers return true', () => {
			const subject = processDeciders.every([
				processDeciders.always(),
				processDeciders.minItems(1)
			]);

			assert.isTrue(subject([1]));
		});

		it('should return false if any matcher returns false', () => {
			const subject = processDeciders.every([
				processDeciders.never(),
				processDeciders.minItems(1)
			]);

			assert.isFalse(subject([1]));
		});
	});

	describe('some', () => {
		it('should return true if some matchers return true', () => {
			const subject = processDeciders.some([
				processDeciders.never(),
				processDeciders.minItems(1)
			]);

			assert.isTrue(subject([1]));
		});

		it('should return false if no matchers return true', () => {
			const subject = processDeciders.some([
				processDeciders.never(),
				processDeciders.minItems(2)
			]);

			assert.isFalse(subject([1]));
		});
	});
});
