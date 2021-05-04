// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@dolittle/rudiments';
import { EmbeddingStoreClient } from '@dolittle/runtime.contracts/Embeddings/Store_grpc_pb';
import { ExecutionContext, TenantId } from '@dolittle/sdk.execution';
import { IProjectionAssociations } from '@dolittle/sdk.projections';
import { Logger } from 'winston';
import { EmbeddingStore, IEmbeddingStore } from '..';

/**
 * Represents a builder for builing an embedding store.
 */
export class EmbeddingStoreBuilder {

    /**
     * Initialises an instance of {@link EmbeddingStoreBuilder}.
     * @param {EmbeddingStoreClient} _embeddingsClient The embedding store client.
     * @param {ExecutionContext} _executionContext The execution context.
     * @param {IProjectionAssociations} _embeddingAssociations The embedding associations.
     * @param {Logger} _logger The logger.
     */
    constructor(
        private readonly _embeddingsClient: EmbeddingStoreClient,
        private readonly _executionContext: ExecutionContext,
        private readonly _embeddingAssociations: IProjectionAssociations,
        private readonly _logger: Logger) {
    }

    /**
     * Build an {@link IEmbeddingStore} for the given tenant.
     * @param {TenantId | Guid | string} tenantId The tenant id.
     * @returns {IEmbeddingStore} The embedding store.
     */
    forTenant(tenantId: TenantId | Guid | string): IEmbeddingStore {
        const executionContext = this._executionContext
            .forTenant(tenantId)
            .forCorrelation(Guid.create());

        return new EmbeddingStore(
            this._embeddingsClient,
            executionContext,
            this._embeddingAssociations,
            this._logger);
    }
}
