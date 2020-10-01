// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import no_associations from '../given/no_associations';
import { EventType } from '../../EventType';
import { EventTypeId } from '../../EventTypeId';

describe('when resolving from object and input is event type', () => {
    const artifact = new EventType(EventTypeId.from('ec0111e1-84e4-4d1a-b7f3-a2f6c4427609'));
    const result = no_associations.eventTypes.resolveFrom({}, artifact);

    it('should return same as input', () => result.should.equal(artifact));
});
