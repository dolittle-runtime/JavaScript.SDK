import { MyEvent } from './MyEvent';
import { Client } from '@dolittle/sdk';
import { MyEventHandler } from './MyEventHandler';

const client = Client
                    .for('7a6155dd-9109-4488-8f6f-c57fe4b65bfb')
                    .withEventHandlers(_ => _.from(MyEventHandler))
                    .build();
client.executionContextManager.currentFor('900893e7-c4cc-4873-8032-884e965e4b97');

const event = new MyEvent();
event.anInteger = 42;
event.aString = 'Forty two';
client.eventStore.commit(event, 'd8cb7301-4bec-4451-a72b-2db53c6dc05d');