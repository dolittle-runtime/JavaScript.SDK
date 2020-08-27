// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { TenantId } from '@dolittle/sdk.execution';
import { Subscription, SubscriptionCallbacks } from './index';

/**
 * Represents an event horizon.
 */
export class TenantWithSubscriptions {

    /**
     * Initializes a new instance of {EventHorizon}.
     * @param {TenantId} tenant The tenant in our microservice.
     * @param {Subscription[]} subscriptions The subscriptions to
     * @param {SubscriptionCallbacks} callbacks Callbacks for handling responses of subscribing.
     */
    constructor(
        readonly tenant: TenantId,
        readonly subscriptions: Subscription[],
        readonly callbacks: SubscriptionCallbacks) {
    }
}
