import test from 'node:test';import assert from 'node:assert/strict';import {contactTotals} from '../src/contactTotals.ts';
test('contact totals separate recorded meetings from other successful contacts and unsuccessful attempts',()=>{
 const rows=[{channel:'Meeting',outcome:'Contacted',date:'2026-10-02'},{channel:'Meeting',outcome:'No response',date:'2026-10-12'},{channel:'Phone',outcome:'Contacted',date:'2026-10-10'},{channel:'Meeting',outcome:'Cancelled',date:'2026-10-11'},{channel:'Meeting',outcome:'Contacted',date:'2026-10-01'}];
 assert.deepEqual(contactTotals(rows),{meetings:2,otherContacts:1,noResponse:1,cancelled:1,lastMeeting:'2026-10-02'});
 assert.deepEqual(contactTotals([...rows].reverse()),contactTotals(rows));
});
test('empty records retain unknown last meeting and multiple same-day records remain explicit records',()=>{
 assert.deepEqual(contactTotals([]),{meetings:0,otherContacts:0,noResponse:0,cancelled:0,lastMeeting:''});
 assert.equal(contactTotals(Array.from({length:2},()=>({channel:'Meeting',outcome:'Contacted',date:'2026-10-01'}))).meetings,2);
});
