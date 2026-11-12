const $ = id => document.getElementById(id);
const categories = ["Roblox Luau","Webentwicklung","App-Entwicklung","Fehlersuche","UI & Design","Python","Projektplanung"];
const KEY = "meine-ai-data-v1";
const fresh = () => ({ endpoint:"http://127.0.0.1:11434", model:"qwen2.5-coder:7b", focus:["Roblox Luau","Fehlersuche"], scores:Object.fromEntries(categories.map(x=>[x,10])), good:0, bad:0, notes:[], messages:[] });
let data;
try { data = {...fresh(), ...JSON.parse(localStorage.getItem(KEY)||"{}")}; data.scores={...fresh().scores,...(data.scores||{})}; } catch { data=fresh(); }
data.messages=Array.isArray(data.messages)?data.messages.slice(-40):[];
data.notes=Array.isArray(data.notes)?data.notes.slice(-60):[];
let busy=false;
const persist=()=>localStorage.setItem(KEY,JSON.stringify(data));
const average=()=>Math.round(Object.values(data.scores).reduce((a,b)=>a+(Number(b)||0),0)/categories.length);
const level=()=>data.good+data.bad===0?"Startprofil":average()<25?"Erste Erfahrungen":average()<50?"Im Aufbau":average()<75?"Fortgeschrittenes Profil":"Viele Übungen gesammelt";
function renderStats(){
 const v=average(); $("total").textContent=v+"%"; $("bigTotal").textContent=v+"%"; $("totalBar").style.width=v+"%"; $("bigBar").style.width=v+"%"; $("level").textContent=level();
 $("good").textContent=data.good; $("bad").textContent=data.bad; $("notesCount").textContent=data.notes.length;
 $("miniSkills").replaceChildren(); $("allSkills").replaceChildren();
 categories.forEach(name=>{
  const score=Math.max(0,Math.min(100,Number(data.scores[name])||0));
  const mini=document.createElement("div"); mini.className="miniskill"; mini.innerHTML='<div><span></span><b></b></div><i class="skillbar"><span></span></i>'; mini.querySelector("span").textContent=name; mini.querySelector("b").textContent=score+"%"; mini.querySelector("i span").style.width=score+"%"; $("miniSkills").append(mini);
  const row=document.createElement("div"); row.className="skillrow"; row.innerHTML='<div><span></span><span></span></div><i class="skillbar"><span></span></i>'; row.querySelector("div span").textContent=name; row.querySelector("div span:last-child").textContent=score+"%"; row.querySelector("i span").style.width=score+"%"; $("allSkills").append(row);
 });
 $("notes").replaceChildren();
 if(!data.notes.length){const p=document.createElement("p");p.className="muted";p.textContent="Noch keine Notizen. Bewerte KI-Antworten im Chat mit 👍 oder 👎."; $("notes").append(p);}
 data.notes.slice().reverse().forEach(n=>{const d=document.createElement("div");d.className="noteitem";d.textContent=n.text;const s=document.createElement("small");s.textContent=new Date(n.date).toLocaleString("de-DE");d.append(s);$("notes").append(d);});
}
function renderFocus(){ $("focus").replaceChildren(); categories.forEach(name=>{const label=document.createElement("label");label.className="focusopt";const input=document.createElement("input");input.type="checkbox";input.value=name;input.checked=data.focus.includes(name);const span=document.createElement("span");span.textContent=name;label.append(input,span);$("focus").append(label);}); }
function switchPage(name){["chat","learn","projects"].forEach(p=>$(p+"Page").classList.toggle("hidden",p!==name));document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===name));$("pageTitle").textContent={chat:"Chat & Code",learn:"Lernzentrum",projects:"Projekte"}[name];}
function addText(parent,text){if(!text)return;const div=document.createElement("div");div.className="bodytext";div.textContent=text;parent.append(div);}
function renderCode(parent,lang,code){
 const box=document.createElement("div");box.className="codebox";const top=document.createElement("div");top.className="codetop";const title=document.createElement("span");title.textContent=(lang||"CODE").toUpperCase();const actions=document.createElement("span");
 const copy=document.createElement("button");copy.textContent="⧉ Kopieren";copy.onclick=async()=>{try{await navigator.clipboard.writeText(code);copy.textContent="Kopiert ✓";setTimeout(()=>copy.textContent="⧉ Kopieren",1400);}catch{copy.textContent="Nicht möglich";}};
 const save=document.createElement("button");save.textContent="↓ Datei speichern";save.onclick=async()=>{try{const ok=await window.meineAI.save({code,language:lang});if(ok){save.textContent="Gespeichert ✓";setTimeout(()=>save.textContent="↓ Datei speichern",1400);}}catch(e){alert(e.message);}};
 actions.append(copy,save);top.append(title,actions);const pre=document.createElement("pre");const codeEl=document.createElement("code");codeEl.textContent=code;pre.append(codeEl);box.append(top,pre);parent.append(box);
}
function renderChat(){
 $("messages").replaceChildren();$("welcome").classList.toggle("hidden",data.messages.length>0);
 data.messages.forEach((m,index)=>{
  const article=document.createElement("article");article.className="message "+m.role;const who=document.createElement("div");who.className="who";who.textContent=m.role==="user"?"DU":"MEINE AI";article.append(who);
  if(m.role==="user")addText(article,m.content);else{
   const regex=/```([a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)```/g;let last=0,match;
   while((match=regex.exec(m.content))!==null){addText(article,m.content.slice(last,match.index).trim());renderCode(article,match[1],match[2].replace(/\n+$/,""));last=regex.lastIndex;}
   addText(article,m.content.slice(last).trim());
   const feedback=document.createElement("div");feedback.className="feedback";
   if(!m.rating){for(const [label,good] of [["👍 Hilfreich",true],["👎 Verbessern",false]]){const b=document.createElement("button");b.textContent=label;b.onclick=()=>rate(index,good);feedback.append(b);}}
   else feedback.textContent=m.rating==="good"?"✓ Als hilfreich gespeichert":"✓ Verbesserungswunsch gespeichert";
   article.append(feedback);
  }
  $("messages").append(article);
 });$("messages").scrollTop=$("messages").scrollHeight;
}
function rate(index,good){const m=data.messages[index];if(!m||m.rating)return;m.rating=good?"good":"bad";const category=data.focus[0]||"Projektplanung";if(good){data.good++;data.scores[category]=Math.min(100,data.scores[category]+2);data.notes.push({text:"Positive Rückmeldung für den Bereich "+category+". Dieses Feedback dient als Hinweis für spätere Antworten.",date:new Date().toISOString()});}else{data.bad++;data.notes.push({text:"Verbesserungswunsch im Bereich "+category+". Künftige ähnliche Aufgaben genauer erklären und Anforderungen prüfen.",date:new Date().toISOString()});}data.notes=data.notes.slice(-60);persist();renderStats();renderChat();}
function systemPrompt(){return [
"Du bist Meine AI, ein deutschsprachiger Programmierassistent.",
"Hilf mit Roblox Studio und Luau, Webseiten, Desktop- und mobilen Apps, Python und JavaScript.",
"Wenn nach einem Script gefragt wird, liefere ein vollständiges, möglichst direkt verwendbares Script. Erkläre anschließend Einbauort, benötigte Objekte und Tests.",
"Beachte Roblox Server-/Client-Trennung, RemoteEvent-Sicherheit und DataStores.",
"Behaupte nie, Code ausgeführt oder getestet zu haben, wenn du das nicht wirklich getan hast. Führe keinen generierten Code automatisch aus.",
"Schreibe Code in Markdown-Codeblöcke mit Sprachkennung.",
"Vom Nutzer gewählte Lernschwerpunkte: "+(data.focus.join(", ")||"ausgewogen"),
"Gespeichertes Feedback (wird nur als Kontext genutzt, trainiert keine Modellgewichte):\n"+data.notes.slice(-10).map(n=>"- "+n.text).join("\n")
].join("\n\n");}
async function send(){
 if(busy)return;const text=$("prompt").value.trim();if(!text)return;$("prompt").value="";data.messages.push({role:"user",content:text});data.messages=data.messages.slice(-40);persist();renderChat();busy=true;$("send").disabled=true;$("send").textContent="Antwortet …";
 try{const messages=data.messages.slice(-16).map(({role,content})=>({role,content}));const answer=await window.meineAI.chat({endpoint:data.endpoint,model:data.model,messages:[{role:"system",content:systemPrompt()},...messages]});data.messages.push({role:"assistant",content:answer});}
 catch(e){data.messages.push({role:"assistant",content:"Ich konnte Ollama nicht erreichen. "+e.message+"\n\nPrüfe, ob Ollama läuft und ob das Modell '"+data.model+"' installiert ist. In den Einstellungen kannst du die Verbindung testen."});}
 finally{data.messages=data.messages.slice(-40);persist();renderChat();busy=false;$("send").disabled=false;$("send").textContent="Senden ↑";}
}
async function check(show){
 try{const models=await window.meineAI.check(data.endpoint);$("status").textContent="● Ollama erreichbar";$("status").style.color="#75dca9";$("modelStatus").textContent="Verbunden · "+data.model; $("modelStatus").style.color="#8ce0b5";if(show)$("testResult").textContent=models.some(m=>m===data.model||m.startsWith(data.model+":"))?"Verbindung und Modell erfolgreich.":"Ollama läuft, aber Modell nicht gefunden. Verfügbare Modelle: "+models.join(", ");}
 catch(e){$("status").textContent="● Ollama nicht erreichbar";$("status").style.color="#e5b96f";$("modelStatus").textContent="KI nicht verbunden";if(show)$("testResult").textContent="Fehler: "+e.message;}
}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
document.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>switchPage(b.dataset.goto));
document.querySelectorAll("[data-prompt]").forEach(b=>b.onclick=()=>{$("prompt").value=b.dataset.prompt;$("prompt").focus();});
document.querySelectorAll("[data-chat]").forEach(b=>b.onclick=()=>{switchPage("chat");$("prompt").value=b.dataset.chat;$("prompt").focus();});
$("send").onclick=send;$("prompt").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};
$("newChat").onclick=()=>{data.messages=[];persist();renderChat();$("prompt").focus();};
$("saveFocus").onclick=()=>{data.focus=[...$("focus").querySelectorAll("input:checked")].map(x=>x.value);persist();$("saved").textContent="Gespeichert ✓";setTimeout(()=>$("saved").textContent="",1600);};
$("clearNotes").onclick=()=>{if(confirm("Alle Lernnotizen und Feedback-Zähler löschen?")){data.notes=[];data.good=0;data.bad=0;data.scores=Object.fromEntries(categories.map(x=>[x,10]));persist();renderStats();}};
$("settingsOpen").onclick=()=>{$("endpoint").value=data.endpoint;$("model").value=data.model;$("testResult").textContent="";$("modal").classList.remove("hidden");};
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("modal").onclick=e=>{if(e.target===$("modal"))$("modal").classList.add("hidden");};
$("save").onclick=()=>{data.endpoint=$("endpoint").value.trim().replace(/\/$/,"");data.model=$("model").value.trim();persist();$("modal").classList.add("hidden");check(false);};
$("test").onclick=()=>{data.endpoint=$("endpoint").value.trim().replace(/\/$/,"");data.model=$("model").value.trim();check(true);};
renderStats();renderFocus();renderChat();check(false);