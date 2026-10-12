import test from 'node:test';import assert from 'node:assert/strict';import {validateTopicRevision} from '../src/topicRevision.ts';
test('topic decisions reject intervening decisions even if the decision label is unchanged',()=>{
 assert.throws(()=>validateTopicRevision({topicDecision:'Changes requested',lastTopicEventId:'new'},'old'),/newer topic decision/);
 assert.throws(()=>validateTopicRevision({topicDecision:'Rejected',lastTopicEventId:'first'},undefined),/newer topic decision/);
});
test('topic decisions preserve approved locks and allow current or legacy unapproved revisions',()=>{
 assert.throws(()=>validateTopicRevision({topicDecision:'Approved',lastTopicEventId:'same'},'same'),/already been approved/);
 assert.doesNotThrow(()=>validateTopicRevision({topicDecision:'Rejected',lastTopicEventId:'same'},'same'));
 assert.doesNotThrow(()=>validateTopicRevision({},undefined));
});
