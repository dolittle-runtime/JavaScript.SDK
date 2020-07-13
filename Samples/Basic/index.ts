import { MyEvent } from './MyEvent';
import { Client } from '@dolittle/sdk';
import { EventContext } from '@dolittle/sdk.events';

import './MyEventHandler';

const client = Client
                    .for('7a6155dd-9109-4488-8f6f-c57fe4b65bfb')
                    .configureLogging(_ => _.level = 'debug')
                    .withEventHandlers(_ => {
                        _.for('a0be3ef0-113f-45a6-800e-061d375407c2', ehb => {
                            ehb.handle(MyEvent, (myEvent: MyEvent, context: EventContext) => {
                                console.log('Handled and happy');
                            });
                        });
                    })
                    .withFilters(_ => {
                        _.for('79e12ab3-2751-47e1-b959-d898dc4d6ee8', fb => {
                            fb
                                .private()
                                .handle((event: any, context: EventContext) => {
                                    console.log('Filtering event', event);
                                    return false;
                                });
                        });
                    })
                    .build();
client.executionContextManager.currentFor('900893e7-c4cc-4873-8032-884e965e4b97');

// const event = new MyEvent();
// event.anInteger = 42;
// event.aString = 'Forty two';
// client.eventStore.commit(event, 'd8cb7301-4bec-4451-a72b-2db53c6dc05d');
