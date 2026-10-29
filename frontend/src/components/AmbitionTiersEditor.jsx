import {useMemo} from "react";

export const EMPTY_AMBITION={enabled:false,ambitiousTarget:0,ambitiousBonus:0,veryAmbitiousTarget:0,veryAmbitiousBonus:0};
export const normalizeAmbition=v=>({...EMPTY_AMBITION,...(v||{}),enabled:!!v?.enabled,ambitiousTarget:Math.max(0,Number(v?.ambitiousTarget)||0),ambitiousBonus:Math.max(0,Number(v?.ambitiousBonus)||0),veryAmbitiousTarget:Math.max(0,Number(v?.veryAmbitiousTarget)||0),veryAmbitiousBonus:Math.max(0,Number(v?.veryAmbitiousBonus)||0)});

export default function AmbitionTiersEditor({value,onChange,unit="units",targetLabel="Target",hint}){
 const v=useMemo(()=>({...EMPTY_AMBITION,...(value||{})}),[value]);
 const patch=p=>onChange({...v,...p});
 return <section className="border theme-tertiary-border rounded-xl p-3 space-y-3">
  <label className="flex items-center justify-between gap-3 text-xs"><span><b>Ambition tiers</b><small className="block text-neutral-600">Optional stretch targets with one-time CBE bonuses.</small></span><input type="checkbox" checked={!!v.enabled} onChange={e=>patch({enabled:e.target.checked})}/></label>
  {v.enabled&&<><div className="grid grid-cols-2 gap-2"><Field label={`Ambitious ${targetLabel} (${unit})`} value={v.ambitiousTarget} onChange={x=>patch({ambitiousTarget:x})}/><Field label="Ambitious bonus CBE" value={v.ambitiousBonus} onChange={x=>patch({ambitiousBonus:x})}/></div><div className="grid grid-cols-2 gap-2"><Field label={`Very Ambitious (${unit})`} value={v.veryAmbitiousTarget} onChange={x=>patch({veryAmbitiousTarget:x})}/><Field label="Very Ambitious bonus CBE" value={v.veryAmbitiousBonus} onChange={x=>patch({veryAmbitiousBonus:x})}/></div>{hint&&<p className="text-[9px] text-neutral-600">{hint}</p>}</>}
 </section>
}
function Field({label,value,onChange}){return <label className="text-[9px] uppercase text-neutral-500">{label}<input type="number" min="0" step="any" value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full bg-neutral-950 border theme-tertiary-border rounded-lg px-3 py-2 text-sm"/></label>}
