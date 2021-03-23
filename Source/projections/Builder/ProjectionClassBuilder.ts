// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Logger } from 'winston';

import { EventType, EventTypeId, EventTypeMap, Generation, IEventTypes } from '@dolittle/sdk.artifacts';
import { IContainer } from '@dolittle/sdk.common';
import { ExecutionContext } from '@dolittle/sdk.execution';
import { Constructor } from '@dolittle/types';

import { IProjections } from '../IProjections';
// import { ProjectionsClient } from '@dolittle/runtime.contracts/Runtime/Projections/Projections_grpc_pb';
type ProjectionsClient = any;

import { CannotRegisterProjectionThatIsNotAClass } from './CannotRegisterProjectionThatIsNotAClass';
import { ICanBuildAndRegisterAProjection } from './ICanBuildAndRegisterAProjection';
import { Cancellation } from '@dolittle/sdk.resilience';
import { ProjectionDecoratedTypes } from './ProjectionDecoratedTypes';
import { projection as projectionDecorator } from './projectionDecorator';
import { on as onDecorator } from './onDecorator';
import { OnDecoratedMethods } from './OnDecoratedMethods';
import { OnDecoratedMethod } from './OnDecoratedMethod';
import { ProjectionSignature } from '../ProjectionSignature';
import { Projection } from '../Projection';
import { ProjectionDecoratedType } from './ProjectionDecoratedType';
import { Guid } from '@dolittle/rudiments';
import { ReadModelAlreadyRegistered } from './ReadModelAlreadyRegistered';
import { CouldNotCreateInstanceOfProjection } from './CouldNotCreateInstanceOfProjection';

export class ProjectionClassBuilder<T> implements ICanBuildAndRegisterAProjection {
    private readonly _projectionType: Constructor<T>;
    private readonly _getInstance: (container: IContainer) => T;

    constructor(typeOrInstance: Constructor<T> | T) {
        if (typeOrInstance instanceof Function) {
            this._projectionType = typeOrInstance;
            this._getInstance = container => container.get(typeOrInstance);

        } else {
            this._projectionType = Object.getPrototypeOf(typeOrInstance).constructor;
            if (this._projectionType === undefined) {
                throw new CannotRegisterProjectionThatIsNotAClass(typeOrInstance);
            }
            this._getInstance = _ => typeOrInstance;
        }
    }

    /** @inheritdoc */
    buildAndRegister(
        client: ProjectionsClient,
        eventHandlers: IProjections,
        container: IContainer,
        executionContext: ExecutionContext,
        eventTypes: IEventTypes,
        logger: Logger,
        cancellation: Cancellation): void {

        logger.debug(`Building projection of type ${this._projectionType.name}`);
        const decoratedType = ProjectionDecoratedTypes.types.find(_ => _.type === this._projectionType);
        if (decoratedType === undefined) {
            logger.warn(`The projection class ${this._projectionType.name} must be decorated with an @${projectionDecorator.name} decorator`);
            return;
        }

        this.ThrowIfReadModelAlreadyRegistered(ProjectionDecoratedTypes.types);

        logger.debug(`Building projection ${decoratedType.projectionId} processing events in scope ${decoratedType.scopeId} from type ${this._projectionType.name}`);

        const methods = OnDecoratedMethods.methodsPerProjection.get(this._projectionType);
        if (methods === undefined) {
            logger.warn(`There are no projection methods to register in projection ${this._projectionType.name}. An projection must to be decorated with @${onDecorator.name}`);
            return;
        }
        const eventTypesToMethods = new EventTypeMap<ProjectionSignature<any>>();
        if (!this.tryAddAllProjectionMethods(eventTypesToMethods, methods, eventTypes, container, logger)) {
            logger.warn(`Could not create projection ${this._projectionType.name} because it contains invalid projection methods`);
            return;
        }
        const eventHandler = new Projection(decoratedType.projectionId, decoratedType.readModel, decoratedType.scopeId, eventTypesToMethods);
        eventHandlers.register(
            new internal.ProjectionProcessor(
                eventHandler,
                client,
                executionContext,
                eventTypes,
                logger), cancellation);

    }



    private tryAddAllProjectionMethods(eventTypesToMethods: EventTypeMap<ProjectionSignature<any>>, methods: OnDecoratedMethod[], eventTypes: IEventTypes, container: IContainer, logger: Logger): boolean {
        let allMethodsValid = true;
        for (const method of methods) {
            const [hasEventType, eventType] = this.tryGetEventTypeFromMethod(method, eventTypes);

            if (!hasEventType) {
                allMethodsValid = false;
                logger.warn(`Could not create projection method ${method.name} in projection ${this._projectionType.name} because it is not associated to an event type`);
                continue;
            }

            const eventHandlerMethod = this.createProjectionMethod(method, container);

            if (eventTypesToMethods.has(eventType!)) {
                allMethodsValid = false;
                logger.warn(`Event handler ${this._projectionType.name} has multiple projection methods handling event type ${eventType}`);
                continue;
            }
            eventTypesToMethods.set(eventType!, eventHandlerMethod);
        }
        return allMethodsValid;
    }

    private createProjectionMethod(method: OnDecoratedMethod, container: IContainer): ProjectionSignature<any> {
        return (event, eventContext) => {
            let instance: T;
            try {
                instance = this._getInstance(container);
            } catch (ex) {
                throw new CouldNotCreateInstanceOfProjection(this._projectionType, ex);
            }
            method.method.call(instance, event, eventContext);
        };
    }

    private tryGetEventTypeFromMethod(method: OnDecoratedMethod, eventTypes: IEventTypes): [boolean, EventType | undefined] {
        if (this.eventTypeIsId(method.eventTypeOrId)) {
            return [
                true,
                new EventType(
                    EventTypeId.from(method.eventTypeOrId),
                    method.generation ? Generation.from(method.generation) : Generation.first)
            ];
        } else if (!eventTypes.hasFor(method.eventTypeOrId)) {
            return [false, undefined];
        } else {
            return [true, eventTypes.getFor(method.eventTypeOrId)];
        }
    }

    private eventTypeIsId(eventTypeOrId: Constructor<any> | EventTypeId | Guid | string): eventTypeOrId is EventTypeId | Guid | string {
        return eventTypeOrId instanceof EventTypeId || eventTypeOrId instanceof Guid || typeof eventTypeOrId === 'string';
    }

    private ThrowIfReadModelAlreadyRegistered(types: ProjectionDecoratedType[]): void {
        const readModels = types
            .map(type => type.readModel);
        // make it into a Set so that we only get the unique duplicate values
        const duplicateReadmodels = new Set(
            readModels.filter((readModel, index) => readModels.indexOf(readModel) !== index));

        if (duplicateReadmodels) {
            for (var duplicateReadModel of new Set(duplicateReadmodels)) {
                const duplicateTypes = types.filter(type => type.readModel === duplicateReadModel);
                throw new ReadModelAlreadyRegistered(duplicateReadModel, duplicateTypes);
            }
        }
    }
}
