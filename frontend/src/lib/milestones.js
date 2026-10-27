export const milestoneId=()=>`ms-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
export const completedMilestones=(metric,value)=>(metric?.milestones||[]).filter(m=>Number(value)>=Number(m.target));
export const nextMilestone=(metric,value)=>(metric?.milestones||[]).filter(m=>Number(m.target)>Number(value)).sort((a,b)=>Number(a.target)-Number(b.target))[0]||null;
