export const initialFinance=()=>({accounts:[{id:"emergency",name:"Emergency Fund",percent:85,target:0},{id:"rewards",name:"Rewards Budget",percent:5,target:0},{id:"bwss",name:"BWSS Budget",percent:10,target:0}],transactions:[]});
export const financeBalance=(f,id)=> (f?.transactions||[]).filter(t=>t.accountId===id).reduce((s,t)=>s+t.amount,0);
export const financeMoney=n=>new Intl.NumberFormat("en-IE",{style:"currency",currency:"EUR"}).format(n/100);
export const cents=v=>Math.round(Number(v)*100);
export function allocate(amount,accounts){
 if(!Number.isSafeInteger(amount)||amount<=0||accounts.some(a=>!Number.isFinite(a.percent)||a.percent<0)||Math.abs(accounts.reduce((s,a)=>s+a.percent,0)-100)>1e-8)return [];
 const rows=accounts.map(a=>({accountId:a.id,amount:Math.floor(amount*a.percent/100),fraction:amount*a.percent/100%1}));
 let remaining=amount-rows.reduce((s,a)=>s+a.amount,0);
 const order=[...rows].sort((a,b)=>b.fraction-a.fraction);
 for(let i=0;i<remaining;i++)order[i%order.length].amount++;
 return rows.map(({accountId,amount})=>({accountId,amount}));
}
