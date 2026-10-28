import {useEffect} from "react";

const SUCCESS_LABELS=["done","done now","save session","log session"];

export default function HapticFeedback(){
 useEffect(()=>{
  const onClick=e=>{
   const button=e.target?.closest?.("button");
   if(!button||button.disabled||typeof navigator==="undefined"||typeof navigator.vibrate!=="function")return;
   const label=(button.textContent||"").trim().toLowerCase().replace(/\s+/g," ");
   if(SUCCESS_LABELS.some(x=>label===x||label.startsWith(`${x} `)))navigator.vibrate(35);
  };
  document.addEventListener("click",onClick,true);
  return()=>document.removeEventListener("click",onClick,true);
 },[]);
 return null;
}
