// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { EventSourceId, EventType, EventTypeId, Generation } from '@dolittle/sdk.events';
import { AggregateRoot } from '../AggregateRoot';

describe('when applying public events', () => {
    const event = { something: 42 };

    const eventType = new EventType(EventTypeId.from('7b078c73-5843-434e-9b4d-ecae4e91469e'), Generation.first);
    const aggregateRoot = new AggregateRoot(EventSourceId.from('8f58f9d5-fded-49f3-8334-a3c1f447d4da'));
    aggregateRoot.applyPublic(event, eventType);

    it('should have one event applied', () => aggregateRoot.appliedEvents.length.should.equal(1));
    it('should have the event applied be public', () => aggregateRoot.appliedEvents[0].isPublic.should.be.true);
});