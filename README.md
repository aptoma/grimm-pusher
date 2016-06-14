Grimm Pusher
============

Node module for pushing events to Grimm.

Usage
-----

```js
const createGrimmService = require('@aptoma/grimm-pusher');

const grimmUrl = 'http://grimm.example.com'
const grimmApiKey = 'secret';
const grimmService = createGrimmService(grimmUrl, grimmApiKey);

// Add events for sending later
grimmService.add({
    name: "SomeMetric",
    time: "2016-06-14 14:01:23.779 +0200",
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
