const fs=require("fs");
const html=fs.readFileSync("./index.html","utf8");
const script=html.split("<script>")[1].split("</script>")[0];
const logic=script.split("/* ============ UI wiring")[0]; // strip DOM code
eval(logic+"\n;Object.assign(globalThis,{CATALOG,THEME_NAMES,selectControls,chunk,buildPrompt,parseModelJSON,normalizeResults,score,priorityGaps,esc,csvCell,toMarkdown,toCSV});");

let pass=0,fail=0;
function t(name,cond){ if(cond){pass++;} else {fail++;console.log("FAIL:",name);} }

/* 1. catalog integrity */
t("93 controls", CATALOG.length===93);
const counts={};CATALOG.forEach(c=>counts[c.theme]=(counts[c.theme]||0)+1);
t("A.5=37",counts["A.5"]===37); t("A.6=8",counts["A.6"]===8);
t("A.7=14",counts["A.7"]===14); t("A.8=34",counts["A.8"]===34);
t("unique IDs", new Set(CATALOG.map(c=>c.id)).size===93);

/* 2. select + chunk */
t("scope ALL", selectControls("ALL").length===93);
t("scope A.7", selectControls("A.7").length===14);
const batches=chunk(selectControls("ALL"),16);
t("6 batches of 93", batches.length===6 && batches.reduce((a,b)=>a+b.length,0)===93);

/* 3. parseModelJSON */
t("clean JSON", parseModelJSON('[{"id":"A.5.1","s":"C","e":"x","r":"y"}]').length===1);
t("fenced JSON", parseModelJSON('```json\n[{"id":"A.5.1","s":"M","e":"","r":"y"}]\n```').length===1);
t("preamble JSON", parseModelJSON('Here you go:\n[{"id":"A.6.1","s":"P","e":"a","r":"b"}] thanks').length===1);
t("garbage -> null", parseModelJSON("no json here")===null);
t("object not array -> null", parseModelJSON('{"id":"A.5.1"}')===null);

/* 4. normalizeResults */
const batch=selectControls("A.6"); // 8 controls
const raw=[{id:"A.6.1",s:"C",e:"screening at hire",r:"none"},{id:"A.6.3",s:"X",e:"?",r:"?"},{id:"A.6.7",s:"P",e:"vpn required",r:"add device standards"}];
const norm=normalizeResults(raw,batch);
t("normalize keeps batch length", norm.length===8);
t("missing items default M", norm.find(x=>x.id==="A.6.2").s==="M");
t("invalid status -> M", norm.find(x=>x.id==="A.6.3").s==="M");
t("M has empty evidence", norm.find(x=>x.id==="A.6.2").e==="");
t("valid P preserved", norm.find(x=>x.id==="A.6.7").s==="P");
t("default rec present", norm.find(x=>x.id==="A.6.4").r.length>0);

/* 5. score */
const fake=[{s:"C",theme:"A.5"},{s:"C",theme:"A.5"},{s:"P",theme:"A.6"},{s:"M",theme:"A.6"}].map((x,i)=>({id:"A.9."+i,title:"t",...x,e:"",r:""}));
const sc=score(fake);
t("totals", sc.totals.C===2&&sc.totals.P===1&&sc.totals.M===1);
t("pct = (2+0.5)/4 = 63", sc.pct===63);
t("theme rollup", sc.themes["A.6"].M===1);

/* 6. priorityGaps ordering */
const pg=priorityGaps([
 {id:"A.5.10",title:"a",theme:"A.5",s:"P",e:"",r:""},
 {id:"A.5.2",title:"b",theme:"A.5",s:"M",e:"",r:""},
 {id:"A.5.1",title:"c",theme:"A.5",s:"C",e:"",r:""},
 {id:"A.5.9",title:"d",theme:"A.5",s:"M",e:"",r:""}]);
t("C excluded", !pg.some(x=>x.s==="C"));
t("M before P", pg[0].s==="M"&&pg[1].s==="M"&&pg[2].s==="P");
t("numeric id sort", pg[0].id==="A.5.2"&&pg[1].id==="A.5.9");

/* 7. exports */
const res=normalizeResults([{id:"A.6.1",s:"C",e:'has "quotes", commas',r:"r1"}],selectControls("A.6"));
const md=toMarkdown(res,score(res),"A.6 People (8)");
t("md has header", md.includes("# ISO 27001:2022 Annex A"));
t("md has ledger rows", (md.match(/\| A\.6\./g)||[]).length===8);
const csv=toCSV(res);
t("csv rows", csv.trim().split("\n").length===9);
t("csv escapes quotes", csv.includes('"has ""quotes"", commas"'));

/* 8. esc */
t("html escape", esc('<b>"x"&</b>')==="&lt;b&gt;&quot;x&quot;&amp;&lt;/b&gt;");

/* 9. prompt sanity */
const p=buildPrompt(selectControls("A.7").slice(0,3),"POLICY BODY");
t("prompt lists controls", p.includes("A.7.1")&&p.includes("A.7.3"));
t("prompt embeds policy", p.includes("POLICY BODY"));
t("prompt demands JSON only", p.includes("ONLY a JSON array"));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
