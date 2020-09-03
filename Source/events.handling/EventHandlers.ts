// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Subject, Observable } from 'rxjs';
import { map, filter, delay, groupBy, first, skip } from 'rxjs/operators';
import { Logger } from 'winston';

import { IArtifacts, ArtifactMap } from '@dolittle/sdk.artifacts';
import { IContainer } from '@dolittle/sdk.common';
import { IExecutionContextManager } from '@dolittle/sdk.execution';
import { Cancellation, retryPipe } from '@dolittle/sdk.resilience';

import { EventHandlersClient } from '@dolittle/runtime.contracts/Runtime/Events.Processing/EventHandlers_grpc_pb';

import { EventHandler, internal, IEventHandlers, EventHandlerDecoratedTypes, EventHandlerDecoratedType, HandlesDecoratedMethods, EventHandlerSignature, IEventHandler } from './index';
import { ScopeId } from '@dolittle/sdk.events';

class EventHandlerRegistration {
    constructor(
        readonly eventHandler: IEventHandler,
        readonly cancellation: Cancellation,
        readonly decoratedType?: Function) {
    }
}

/**
 * Represents an implementation of {IEventHandlers}.
 */
export class EventHandlers implements IEventHandlers {

    private readonly _eventHandlers: Subject<EventHandlerRegistration> = new Subject<EventHandlerRegistration>();

    /**
     * Initializes an instance of {@link EventHandlers}.
     * @param {EventHandlersClient} _eventHandlersClient Client to use for connecting to the runtime.
     * @param {IContainer} _container The container for creating instances needed.
     * @param {IExecutionContextManager} _executionContextManager For managing execution context.
     * @param {IArtifacts} _artifacts For mapping artifacts.
     * @param {Logger} _logger For logging.
     * @param {Cancellation} _cancellation For handling cancellation.
     */
    constructor(
        private readonly _eventHandlersClient: EventHandlersClient,
        private readonly _container: IContainer,
        private readonly _executionContextManager: IExecutionContextManager,
        private readonly _artifacts: IArtifacts,
        private readonly _logger: Logger,
        private readonly _cancellation: Cancellation,
    ) {
        this.registerEventHandlers();
        this.registerDecoratedEventHandlerTypes();
    }

    /** @inheritdoc */
    register(eventHandler: IEventHandler, cancellation = Cancellation.default): void {
        this._eventHandlers.next(new EventHandlerRegistration(eventHandler, cancellation));
    }

    private registerDecoratedEventHandlerTypes() {
        EventHandlerDecoratedTypes.types.pipe(
            filter((value: EventHandlerDecoratedType) => {
                if (HandlesDecoratedMethods.methodsPerEventHandler.has(value.type)) {
                    return true;
                } else {
                    this._logger.warn(`EventHandler with Id '${value.eventHandlerId}' does not handle any events. This event handler will not be registered.`);
                    return false;
                }
            }),
            map((value: EventHandlerDecoratedType) => {
                const methodsByArtifact = new ArtifactMap<EventHandlerSignature<any>>();
                for (const method of HandlesDecoratedMethods.methodsPerEventHandler.get(value.type)!) {
                    const artifact = this._artifacts.getFor(method.eventType);
                    methodsByArtifact.set(artifact, (event, eventContext) => {
                        if (method.owner) {
                            let instance: any;
                            try {
                                instance = this._container.get(method.owner);
                            } catch (ex) {
                                this._logger.error('Unable to create instance of event handler.', ex);
                                throw ex;
                            }
                            return method.method.call(instance, event, eventContext);
                        }
                        return method.method(event, eventContext);
                    });
                }
                const eventHandler = new EventHandler(value.eventHandlerId, value.scopeId || ScopeId.default, true, methodsByArtifact);
                return new EventHandlerRegistration(eventHandler, this._cancellation, value.type);
            })
        ).subscribe(this._eventHandlers);
    }

    private registerEventHandlers() {
        this._eventHandlers.pipe(
            groupBy((value: EventHandlerRegistration) => {
                return value.eventHandler.eventHandlerId.toString();
            })
        ).subscribe({
            next: (eventHandlersById: Observable<EventHandlerRegistration>) => {
                eventHandlersById.pipe(
                    first()
                ).subscribe({
                    next: (registration: EventHandlerRegistration) => {
                        const eventHandler = registration.eventHandler;
                        const eventProcessor = new internal.EventHandlerProcessor(
                            eventHandler.eventHandlerId,
                            eventHandler.scopeId,
                            eventHandler.partitioned,
                            eventHandler,
                            this._eventHandlersClient,
                            this._executionContextManager,
                            this._artifacts,
                            this._logger);
                        this._logger.debug(`Registering a ${eventHandler.partitioned ? 'partitioned' : 'unpartitioned'} EventHandler with Id '${eventHandler.eventHandlerId}' for scope '${eventHandler.scopeId}'.`);
                        eventProcessor.registerForeverWithPolicy(retryPipe(delay(1000)), registration.cancellation).subscribe({
                            error: (error: Error) => {
                                this._logger.error(`Failed to register event handler: ${error}`);
                            },
                            complete: () => {
                                this._logger.debug(`Event handler registration completed.`);
                            }
                        });
                    }
                });
                eventHandlersById.pipe(
                    skip(1)
                ).subscribe({
                    next: (registration: EventHandlerRegistration) => {
                        if (registration.decoratedType) {
                            this._logger.error(`EventHandlerId '${registration.eventHandler.eventHandlerId}' is already used. The event handler ${registration.decoratedType.name} will not be registered.`);
                        } else {
                            this._logger.error(`EventHandlerId '${registration.eventHandler.eventHandlerId}' is already used. The event handler will not be registered.`);
                        }
                    }
                });
            }
        });
    }
}
