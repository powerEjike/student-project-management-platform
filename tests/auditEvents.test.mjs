import test from 'node:test';import assert from 'node:assert/strict';import {filterAuditEvents} from '../src/auditEvents.ts';
const event=(id,kind,date)=>({id,kind,createdAt:date?{toDate:()=>new Date(date)}:undefined});
test('audit filters use inclusive Nigerian calendar dates across UTC midnight and preserve chronological order',()=>{
 const events=[event('older','staff','2026-10-10T22:59:00Z'),event('midnight','roster','2026-10-10T23:00:00Z'),event('latest','staff','2026-10-11T22:59:00Z'),event('next','roster','2026-10-11T23:00:00Z')];
 assert.deepEqual(filterAuditEvents(events,'','2026-10-11','2026-10-11').map(e=>e.id),['latest','midnight']);assert.deepEqual(filterAuditEvents(events,'roster','2026-10-11','2026-10-11').map(e=>e.id),['midnight']);assert.deepEqual(filterAuditEvents(events,'','2026-10-12','2026-10-11'),[]);
});
test('unknown audit dates remain visible without date filters and are never assigned a guessed date',()=>{
 const events=[event('unknown','staff'),event('known','roster','2026-10-11')];assert.deepEqual(filterAuditEvents(events,'','','').map(e=>e.id),['known','unknown']);assert.deepEqual(filterAuditEvents(events,'staff','2026-10-10',''),[]);
});
