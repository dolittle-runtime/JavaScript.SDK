// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { EventType, EventTypeId } from '@dolittle/sdk.artifacts';
import { EventSourceId } from './EventSourceId';

/**
 * Represents and uncommitted event
 */
export interface UncommittedEvent {
    /**
     * The source of the event - a unique identifier that is associated with the event.
     */
    eventSourceId: EventSourceId;

    /**
     * An event type or an identifier representing the event type.
     * @summary If no event type identifier or event type is supplied, it will look for associated event types based
     * on the actual type of the event.
     */
    eventType?: EventType | EventTypeId;

    /**
     * The content of the event.
     */
    content: any;

    /**
     * Indicates whether the event is public or not.
     */
    public?: boolean;
}
