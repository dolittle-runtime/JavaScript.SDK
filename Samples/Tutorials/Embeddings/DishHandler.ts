// Copyright (c) Dolittle. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// Sample code for the tutorial at https://dolittle.io/tutorials/projections/typescript/

import { EventContext } from '@dolittle/sdk.events';
import { eventHandler, handles } from '@dolittle/sdk.events.handling';
import { DishPrepared } from './DishPrepared';
import { DishRemoved } from './DishRemoved';

@eventHandler('f2d366cf-c00a-4479-acc4-851e04b6fbba')
export class DishHandler {

    @handles(DishPrepared)
    dishPrepared(event: DishPrepared, eventContext: EventContext) {
        console.log(`The dish ${event.Dish} has been prepared. Yummm!`);
    }

    @handles(DishRemoved)
    dishRemoved(event: DishRemoved, context: EventContext) {
        console.log(`The dish ${event.Dish} has been removed. Awwww!`);
    }
}
