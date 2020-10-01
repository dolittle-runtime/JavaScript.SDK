// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Constructor } from '@dolittle/types';
import { Guid } from '@dolittle/rudiments';
import { EventType, IEventTypes, EventTypeMap, EventTypeId } from '@dolittle/sdk.artifacts';
import { ScopeId } from '@dolittle/sdk.events';

import { IEventHandler } from './IEventHandler';
import { EventHandler } from './EventHandler';
import { EventHandlerSignature } from './EventHandlerSignature';
import { EventHandlerId } from './EventHandlerId';

export type EventHandlerBuilderCallback = (builder: EventHandlerBuilder) => void;

/**
 * Represents a builder for building {@link IEventHandler} - event handlers.
 */
export class EventHandlerBuilder {
    private _handlers: Map<Constructor<any> | EventType | Guid | string, EventHandlerSignature<any>> = new Map();
    private _scopeId: ScopeId = ScopeId.default;
    private _partitioned = true;

    /**
     * Initializes a new instance of {@link EventHandlerBuilder}.
     * @param {EventHandlerId} _eventHandlerId The unique identifier of the event handler to build for.
     */
    constructor(private _eventHandlerId: EventHandlerId) {
    }

    /**
     * Gets the {@link ScopeId} the event handler operates on.
     * @returns {ScopeId}
     */
    get scopeId(): ScopeId {
        return this._scopeId;
    }

    /**
     * Gets whether or not the event handler is partitioned.
     * @returns {boolean}
     */
    get isPartitioned(): boolean {
        return this._partitioned;
    }

    /**
     * Defines the event handler to be partitioned - this is default for a event handler.
     * @returns {EventHandlerBuilder}
     */
    partitioned(): EventHandlerBuilder {
        this._partitioned = true;
        return this;
    }

    /**
     * Defines the event handler to be unpartitioned. By default it will be partitioned.
     * @returns {EventHandlerBuilder}
     */
    unpartitioned(): EventHandlerBuilder {
        this._partitioned = false;
        return this;
    }

    /**
     * Defines the event handler to operate on a specific {@link ScopeId}.
     * @param {Guid | string} scopeId Scope the event handler operates on.
     * @returns {EventHandlerBuilder}
     */
    inScope(scopeId: Guid | string): EventHandlerBuilder {
        this._scopeId = ScopeId.from(scopeId);
        return this;
    }

    /**
     * Add a handler method for handling the event.
     * @template T Type of event, when using type rather than artifact - default is any.
     * @param {Constructor<T>|EventType|Guid|string} typeOrArtifact The type of event or the artifact or identifier of the artifact.
     * @param {EventHandlerSignature<T>} method Method to call for each event.
     */
    handle<T = any>(typeOrArtifact: Constructor<T> | EventType | Guid | string, method: EventHandlerSignature<T>) {
        this._handlers.set(typeOrArtifact, method);
    }

    /**
     * Builds the {@link IEventHandler}.
     * @param {IEventTypes} eventTypes Event types for resolving event types.
     * @returns {IEventHandler}
     */
    build(eventTypes: IEventTypes): IEventHandler {
        const evenTypeToMethods = new EventTypeMap<EventHandlerSignature<any>>();

        for (const [typeOrEventTypeOrId, method] of this._handlers) {
            let eventType: EventType;
            if (typeOrEventTypeOrId instanceof EventType) {
                eventType = typeOrEventTypeOrId;
            } else if (typeOrEventTypeOrId instanceof Guid || typeof typeOrEventTypeOrId === 'string') {
                eventType = new EventType(EventTypeId.from(typeOrEventTypeOrId));
            } else {
                eventType = eventTypes.getFor(typeOrEventTypeOrId);
            }

            evenTypeToMethods.set(eventType, method);
        }

        return new EventHandler(this._eventHandlerId, this._scopeId, this._partitioned, evenTypeToMethods);
    }
}
