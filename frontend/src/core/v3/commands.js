import { applyExecution, dismissInstance, INSTANCE_STATUS } from "./engine";
import { closeExecutionDay, DAY_CLOSE_SOURCE } from "./dayClose";

export const COMMAND=Object.freeze({LOG:"LOG",COMPLETE:"COMPLETE",DISMISS:"DISMISS",CLOSE_DAY:"CLOSE_DAY"});
const instancesOf=state=>Array.isArray(state?.instances)?state.instances:[];
function updateInstance(state,instanceId,updater){if(!instanceId)throw new Error("CBE v3 command requires instanceId");let found=false;const instances=instancesOf(state).map(instance=>{if(instance.id!==instanceId)return instance;found=true;return updater(instance)});if(!found)throw new Error(`CBE v3 instance not found: ${instanceId}`);return{...state,instances};}
export function executeCommand(state,command){
  if(!command?.type)throw new Error("CBE v3 command requires type");
  const at=command.at||null;
  switch(command.type){
    case COMMAND.LOG:return updateInstance(state,command.instanceId,instance=>applyExecution(instance,command.amount??1,at));
    case COMMAND.COMPLETE:return updateInstance(state,command.instanceId,instance=>{if(instance.status!==INSTANCE_STATUS.ACTIVE)return instance;const left=Math.max(0,Number(instance.target||0)-Number(instance.progress||0));return applyExecution(instance,left||1,at)});
    case COMMAND.DISMISS:return updateInstance(state,command.instanceId,instance=>dismissInstance(instance,at,command.reason||"dismissed"));
    case COMMAND.CLOSE_DAY:return closeExecutionDay(state,{date:command.date,source:command.source||DAY_CLOSE_SOURCE.MANUAL,at,resolutions:command.resolutions||{}});
    default:throw new Error(`Unknown CBE v3 command: ${command.type}`);
  }
}
