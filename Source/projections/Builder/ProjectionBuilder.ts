// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Logger } from 'winston';

import { Guid } from '@dolittle/rudiments';
import { IEventTypes } from '@dolittle/sdk.artifacts';
import { IContainer } from '@dolittle/sdk.common';
import { ScopeId } from '@dolittle/sdk.events';
import { ExecutionContext } from '@dolittle/sdk.execution';
import { Cancellation } from '@dolittle/sdk.resilience';
import { Constructor } from '@dolittle/types';

import { ProjectionsClient } from '@dolittle/runtime.contracts/Runtime/Events.Processing/Projections_grpc_pb';

import { IProjections, ProjectionId } from '../';

import { ICanBuildAndRegisterAProjection } from './ICanBuildAndRegisterAProjection';
import { ProjectionBuilderForReadModel } from './ProjectionBuilderForReadModel';
import { ReadModelAlreadyDefinedForProjection } from './ReadModelAlreadyDefinedForProjection';

export class ProjectionBuilder implements ICanBuildAndRegisterAProjection {
    private _scopeId: ScopeId = ScopeId.default;
    private _readModelType?: Constructor<any>;
    private _builder?: ProjectionBuilderForReadModel<any>;

    /**
     * Initializes a new instance of {@link ProjectionBuilder}.
     * @param {ProjectionId} _projectionId  The unique identifier of the projection to build for
     */
    constructor(private _projectionId: ProjectionId) { }

    /**
     * Defines the projection to operate on a specific {@link ScopeId}.
     * @param {ScopeId | Guid | string} scopeId Scope the projection operates on.
     * @returns {ProjectionBuilder}
     */
    inScope(scopeId: ScopeId | Guid | string): ProjectionBuilder {
        this._scopeId = ScopeId.from(scopeId);
        return this;
    }

    /**
     * Defines which readmodel to build a projection for.
     * @param {Constructor<T>} readModelType The type of the read model.
     * @returns {ProjectionBuilderForReadModel<T>}
     */
    forReadModel<T>(readModelType: Constructor<T>): ProjectionBuilderForReadModel<T> {
        if (this._readModelType) {
            throw new ReadModelAlreadyDefinedForProjection(this._projectionId, readModelType, this._readModelType);
        }
        this._readModelType = readModelType;
        this._builder = new ProjectionBuilderForReadModel(this._projectionId, readModelType, this._scopeId);
        return this._builder;
    }

    /** @inheritdoc */
    buildAndRegister(
        client: ProjectionsClient,
        projections: IProjections,
        container: IContainer,
        executionContext: ExecutionContext,
        eventTypes: IEventTypes,
        logger: Logger,
        cancellation: Cancellation): void {
        if (!this._builder) {
            logger.warn(`Failed to register projection ${this._projectionId}. No read models defined for projection.`);
            return;
        }
        this._builder!.buildAndRegister(
            client,
            projections,
            container,
            executionContext,
            eventTypes,
            logger,
            cancellation);
    }
}
