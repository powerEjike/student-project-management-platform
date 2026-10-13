export const feedbackCategories=['Content','Methodology','Referencing','Language','Formatting'] as const;
export const feedbackPriorities=['Action required','Suggestion'] as const;
export type FeedbackInput={category:string;priority:string;milestoneKey:string;comment:string;summary:string};
export function feedbackValue(input:FeedbackInput,milestones:Record<string,{name:string}>={}){
 if(!feedbackCategories.includes(input.category as typeof feedbackCategories[number])||!feedbackPriorities.includes(input.priority as typeof feedbackPriorities[number]))throw Error('Choose a valid feedback category and priority.');
 if(input.milestoneKey&&!milestones[input.milestoneKey])throw Error('This milestone is no longer available. Choose the current stage again.');
 const comment=input.comment.trim();const summary=input.summary.trim();if(!comment||comment.length>2000||summary.length>2000)throw Error('Enter feedback up to 2,000 characters and an optional summary up to 2,000 characters.');
 return {...input,comment,summary,milestoneName:input.milestoneKey?milestones[input.milestoneKey].name:'Overall project'};
}
