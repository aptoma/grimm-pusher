Grimm Pusher
============

Node module for pushing events to Grimm.

Usage
-----

Install with npm:

    $ npm install --save @aptoma/grimm-pusher

Include it in your code:

```js
const grimm = require('@aptoma/grimm-pusher');

const grimmUrl = 'http://grimm.example.com'
const grimmApiKey = 'secret';

// Use process decider to control when items are actually sent
const processDecider = grimm.processDeciders.never();
const grimmService = grimm.createGrimmService(grimmUrl, grimmApiKey, processDecider);

// Add events for sending later
grimmService.add({
    name: "SomeMetric",
    time: Date.now(), // Optional, will be set automatically if left out
    fields: {
        msec: 12
    },
    tags: {
        service: "my-service"
    }
});

// Send queued events
grimmService.process();
```

### Process deciders

Process deciders let you control how items are sent to Grimm. Process deciders are queried in every add, and if the decider returns true, all pending events are processed. You can always process events manually, by calling `grimmService.process()`.

For better performance, it's recommended to batch events. You can safely send a several hundred events in a batch. If event volume is moderate, sending every second or so is a good baseline.

A decider is a function like `(items, previousTimestamp) => true|fase;`. You are free to create your own decider, but we've also supplied a few standard deciders, available on `grimm.processDeciders`:

- `never()`: Will never process on add, call `.process()` explicitly to send events
- `always()`: Will process events on every call to `.add()`
- `minItems(count)`: Will process events once there are at least `count` number of queued events
- `debounce(delayMs)`: Will process events once there are at least `delayMs` since the last call to process
- `some([decider1, decider2])`: Will process events if any of the provided deciders return true, eg. once there are 10 events or a second has passed since the last send
- `every([decider1, decider2])`: Will process events if all of the provided deciders return true
