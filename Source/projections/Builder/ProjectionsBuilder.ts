// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Logger } from 'winston';

import { Guid } from '@dolittle/rudiments';
import { IEventTypes } from '@dolittle/sdk.artifacts';
import { IContainer } from '@dolittle/sdk.common';
import { ExecutionContext } from '@dolittle/sdk.execution';
import { Constructor } from '@dolittle/types';
import { IProjections } from '../IProjections';
// import { ProjectionsClient } from '@dolittle/runtime.contracts/Runtime/Projections/Projections_grpc_pb';
type ProjectionsClient = any;

import { ProjectionId } from '../ProjectionId';
import { ICanBuildAndRegisterAProjection } from './ICanBuildAndRegisterAProjection';
import { ProjectionBuilder } from './ProjectionBuilder';
import { Cancellation } from '@dolittle/sdk.resilience';
import { Projections } from '../Projections';
import { ProjectionClassBuilder } from './ProjectionClassBuilder';

export type ProjectionsBuilderCallback = (builder: ProjectionsBuilderCallback) => void;

export class ProjectionsBuilder {
    private _projectionBuilders: ICanBuildAndRegisterAProjection[] = [];

    /**
     * Start building a projection.
     * @param {ProjectionId | Guid | string} projectionId  The unique identifier of the projection
     * @returns {ProjectionBuilder}
     */
    createProjection(projectionId: ProjectionId | Guid | string): ProjectionBuilder {
        const builder = new ProjectionBuilder(ProjectionId.from(projectionId));
        this._projectionBuilders.push(builder);
        return builder;
    }

    /**
     * Register a type as a projection
     * @param type The type to register as a projection.
     */
    register<T = any>(type: Constructor<T>): ProjectionsBuilder;
    /**
     * Register an instance as an event handler.
     * @param instance The instance to register as an event handler.
     */
    register<T = any>(instance: T): ProjectionsBuilder;
    register<T = any>(typeOrInstance: Constructor<T> | T): ProjectionsBuilder {
        this._projectionBuilders.push(new ProjectionClassBuilder(typeOrInstance));
        return this;
    }

    buildAndRegister(
        client: ProjectionsClient,
        container: IContainer,
        executionContext: ExecutionContext,
        eventTypes: IEventTypes,
        logger: Logger,
        cancellation: Cancellation): IProjections {
        const projections = new Projections(logger);

        for (const projectionBuilder of this._projectionBuilders) {
            projectionBuilder.buildAndRegister(client, projections, container, executionContext, eventTypes, logger, cancellation);
        }

        return projections;
    }
}