import{test}from'node:test';import assert from'node:assert/strict';import{defaultIntakePolicy,intakePolicyValue,checkIntakeFile,intakePolicyLabel}from'../src/intakePolicy.ts';
test('document intake policies bound the engine limits, require at least one type and retain an audit reason',()=>{
 assert.deepEqual(intakePolicyValue(5,true,false,'  Department decision  '),{maxMiB:5,pdfAllowed:true,wordAllowed:false,note:'Department decision'});
 for(const args of[[0,true,true,'Reason'],[21,true,true,'Reason'],[1.5,true,true,'Reason'],[5,false,false,'Reason'],[5,'true',false,'Reason'],[5,true,true,' '],[5,true,true,'x'.repeat(501)]])assert.throws(()=>intakePolicyValue(...args));
});
test('intake validation checks exact byte boundaries and actual extension independently of filename case',()=>{
 const policy={maxMiB:5,pdfAllowed:true,wordAllowed:false};checkIntakeFile(policy,'Draft.PDF',5*1024*1024);checkIntakeFile(defaultIntakePolicy,'Draft.DOCX',20*1024*1024);
 for(const [name,size]of[['Draft.pdf',5*1024*1024+1],['Draft.docx',100],['Draft.pdf.exe',100],['Draft.pdf',0],['Draft.pdf',1.5]])assert.throws(()=>checkIntakeFile(policy,name,size));
 assert.throws(()=>checkIntakeFile({...policy,maxMiB:Infinity},'Draft.pdf',1));assert.throws(()=>checkIntakeFile({...policy,pdfAllowed:false},'Draft.pdf',1));
 assert.equal(intakePolicyLabel(policy),'5 MB per file · PDF');
});
