export type StaffProfile = {role:'admin'|'hod'|'lecturer';active:boolean;displayName:string;departmentId?:string;departmentName?:string};
export type Student = {id:string;departmentId:string;name:string;matricNumber:string;matricKey:string;programme:string;level:string;session:string;email:string;admissionSession?:string;currentCGPA?:number;gender?:string};
export type Project = {id:string;departmentId:string;studentId:string;supervisorId:string;coSupervisorId:string;supervisorName:string;coSupervisorName:string;title:string;status:string;lastAllocationEventId:string;lastSupervisorUpdateAt?:{toDate:()=>Date};releaseState?:string;releaseRequestId?:string;completedDate?:string;completedByName?:string;lastDefenceEventId?:string;defenceCleared?:boolean;defenceDate?:{toDate:()=>Date};defenceByName?:string;defenceNote?:string;abstract?:string;lastFeedbackEventId?:string;lastFeedbackBy?:string;lastFeedbackAt?:{toDate:()=>Date};lastTopicEventId?:string;topicDecision?:string;decisionNote?:string;topicApprovedBy?:string;topicApprovedAt?:{toDate:()=>Date};milestones?:Record<string,import('./workflow').Milestone>};
export type Lecturer = {id:string;displayName:string};


