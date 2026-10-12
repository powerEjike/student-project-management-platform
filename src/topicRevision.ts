export function validateTopicRevision(current:{lastTopicEventId?:string;topicDecision?:string},expected:string|undefined){
 if(current.topicDecision==='Approved')throw new Error('This topic has already been approved.');
 if(current.lastTopicEventId!==expected)throw new Error('A newer topic decision was recorded while this form was open. Review the latest topic history and check the title again before saving.');
}
