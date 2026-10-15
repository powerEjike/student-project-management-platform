import test from 'node:test';import assert from 'node:assert/strict';import {replyRoot,replyContext,threadMessages,messageText,unreadMessages,searchMessages} from '../src/chat.ts';
const rows=[{id:'new',senderId:'other',senderName:'Élodie',body:'Review the defence schedule',removed:false,createdAt:{seconds:20,nanoseconds:0}},{id:'own',senderId:'me',body:'My reply',removed:false,createdAt:{seconds:21,nanoseconds:0}},{id:'removed',senderId:'other',body:'',removed:true,createdAt:{seconds:22,nanoseconds:0}},{id:'old',senderId:'other',body:'Earlier message',removed:false,createdAt:{seconds:10,nanoseconds:0}}];
test('chat unread counts exclude own, removed and already read messages',()=>{assert.equal(unreadMessages(rows,'me',{seconds:10,nanoseconds:0}),1);assert.equal(unreadMessages(rows,'me',{seconds:20,nanoseconds:0}),0);assert.equal(unreadMessages(rows,'me'),2);});
test('chat search combines staff and message words and excludes removed contents',()=>{assert.deepEqual(searchMessages(rows,'e\u0301lodie schedule').map(r=>r.id),['new']);assert.deepEqual(searchMessages(rows,'review earlier'),[]);assert.equal(searchMessages(rows,'').length,4);});
test('chat messages trim input and reject blank or oversized messages',()=>{assert.equal(messageText('  Hello\nteam  '),'Hello\nteam');assert.throws(()=>messageText(' \n '));assert.throws(()=>messageText('x'.repeat(4001)));});
test('chat threads retain original and direct replies, normalize reply targets and follow current original edits',()=>{
 const root={...rows[0],id:'root'},reply={...rows[1],id:'reply',replyToId:'root'},other={...rows[0],id:'other'},list=[reply,other,root];
 assert.deepEqual(threadMessages(list,'root').map(r=>r.id),['reply','root']);assert.equal(replyRoot(list,reply).id,'root');assert.equal(replyRoot(list,root).id,'root');
 assert.equal(replyContext(list,'root'),'Élodie: Review the defence schedule');root.body='Edited original';assert.equal(replyContext(list,'root'),'Élodie: Edited original');
 assert.deepEqual(searchMessages(threadMessages(list,'root'),'edited').map(r=>r.id),['root']);
});
test('removed and missing originals expose no copied text and cannot receive new replies',()=>{
 const root={...rows[0],id:'root',removed:true,body:'Hidden original'},reply={...rows[1],id:'reply',replyToId:'root'},nested={...rows[1],id:'nested',replyToId:'reply'};
 assert.equal(replyContext([root,reply],'root'),'Original message removed');assert.equal(replyContext([],'root'),'Original message unavailable');assert.equal(replyRoot([root,reply],reply),null);assert.equal(replyRoot([reply,nested],nested),null);assert.equal(replyRoot([reply],reply),null);
 assert.equal(threadMessages([root,reply],'root').length,2);
});
