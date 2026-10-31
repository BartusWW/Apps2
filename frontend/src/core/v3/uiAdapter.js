import { COMMAND } from "./commands";
import { selectExecutionDay, selectDayExecutionSummary } from "./selectors";

export function createV3UIAdapter({getState,dispatch}){
  if(typeof getState!=="function"||typeof dispatch!=="function")throw new Error("CBE v3 UI adapter requires getState and dispatch");
  return{
    day:date=>selectExecutionDay(getState(),date),
    summary:date=>selectDayExecutionSummary(getState(),date),
    log:(instanceId,amount=1,at=null)=>dispatch({type:COMMAND.LOG,instanceId,amount,at}),
    complete:(instanceId,at=null)=>dispatch({type:COMMAND.COMPLETE,instanceId,at}),
    dismiss:(instanceId,reason="dismissed",at=null)=>dispatch({type:COMMAND.DISMISS,instanceId,reason,at}),
    closeDay:(date,source="manual",at=null,resolutions={})=>dispatch({type:COMMAND.CLOSE_DAY,date,source,at,resolutions}),
  };
}
