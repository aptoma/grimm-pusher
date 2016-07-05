Grimm Pusher
============

Node module for pushing events to Grimm.

Usage
-----

Install with npm:

    $ npm install --save @aptoma/grimm-pusher

Include it in your code:

```js
const grimmPusher = require('@aptoma/grimm-pusher');

const options = {
	host: 'https://grimm.example.com',
	apiKey: 'secret',
	// Batch events within this number of milliseconds
	throttleMs: 1000,
	// Send regardless of throttling once this many events are queued
	maxBatchSize: 100
};

// Create instance
const grimmService = grimmPusher.createService(options);
// Or as singleton
const grimmServiceSingleton = grimmPusher.singleton();
grimmServiceSingleton.configure(options);

// Fired when events are successfully processed
grimmService.on('success', console.info);
// Fired when an error occurs
grimmService.on('error', console.error);

// Add events for sending later
grimmService.add({
    name: 'SomeMetric',
    time: Date.now(), // Optional, will be set automatically if left out
    fields: {
        msec: 12
    },
    tags: {
        service: 'my-service'
    }
});

// Process any unsent events, should be called just before script terminates, to ensure there are no pending events
grimmService.process();
```

### Batching

For better performance, it's recommended to batch events. The default is to send each event immediately, but you are strongly encouraged to enable batching.

You can safely send several hundred events in a batch. If event volume is moderate, sending every second is a good baseline.

### Logging and events

`GrimmPusher` is an `EventEmitter`. The following events may fire:

- `success`: When `process()` succeeds, either due to no pending events, or successful delivery of all events
- `error`: When `process()` fails, either due to missing config or bad response from the backend
