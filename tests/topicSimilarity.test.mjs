import {test} from 'node:test';import assert from 'node:assert/strict';import {findTopicMatches} from '../src/topicSimilarity.ts';
const entry=(title,extra={})=>({id:'one',departmentId:'bio',title,titleKey:'',author:'Synthetic',year:2024,programme:'Biochemistry',active:true,...extra});
test('topic search ranks exact first, recognises reordered titles and minor spelling changes',()=>{
 const title='Aflatoxin contamination in stored groundnuts';const items=[entry('Stored groundnuts: assessment of aflatoxin contamination',{id:'similar'}),entry(title,{id:'exact'}),entry('Aflatoxin contaminaton in stored groundnuts',{id:'typo'})];const result=findTopicMatches(title,items);assert.equal(result[0].matchKind,'exact');assert.equal(result[0].id,'exact');assert.equal(result.length,3);assert.ok(result.slice(1).every(m=>m.matchKind==='similar'));
});
test('generic research words, unrelated topics, short queries and withdrawn records do not produce misleading matches',()=>{
 assert.deepEqual(findTopicMatches('Effect of glucose metabolism in diabetic rats',[entry('Effect of oxidative stability in palm oil')]),[]);
 assert.deepEqual(findTopicMatches('Effect of',[entry('Effect of nutrient composition in maize')]),[]);
 assert.deepEqual(findTopicMatches('Glucose metabolism',[entry('Glucose metabolism in diabetic rats')]),[]);
 assert.deepEqual(findTopicMatches('Glucose metabolism in diabetic rats',[entry('Glucose metabolism in diabetic rats',{active:false})]),[]);
});
