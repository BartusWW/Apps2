export const canHaptic=()=>typeof navigator!=="undefined"&&typeof navigator.vibrate==="function";

export function haptic(pattern=18){
  if(!canHaptic())return false;
  try{return navigator.vibrate(pattern)}catch{return false}
}

export const hapticSuccess=()=>haptic(22);
export const hapticStrong=()=>haptic([28,35,28]);
