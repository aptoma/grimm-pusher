'use strict';

exports.never = () => () => false;
exports.always = () => () => true;

exports.minItems = (minItems) => (items) => items.length >= minItems;
exports.debounce = (interval) => (items, previousTimestamp) => Date.now() - previousTimestamp > interval;

exports.every = (matchers) => (items, previousTimestamp) => {
	return matchers.every((matcher) => matcher(items, previousTimestamp));
};

exports.some = (matchers) => (items, previousTimestamp) => {
	return matchers.some((matcher) => matcher(items, previousTimestamp));
};
