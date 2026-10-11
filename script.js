const starterQuestions = [
  {id:1,title:"Why do we replay conversations in our heads at 2 AM?",details:"I can remember one awkward sentence from three years ago, but forget what I went into a room for.",category:"Life",author:"moonlitmind",minutes:12,answers:8},
  {id:2,title:"How do you know if a friendship is changing or just growing?",details:"Nothing dramatic happened. Things just feel a little different lately.",category:"Friendships",author:"littleorbit",minutes:38,answers:14},
  {id:3,title:"Does anyone else feel like everyone has a plan except them?",details:"I'm trying my best, but sometimes it feels like everybody got a guidebook I missed.",category:"School",author:"softstatic",minutes:64,answers:21},
  {id:4,title:"If memories change every time we remember them, what is the past?",details:"Are we remembering what happened, or the last version of the memory?",category:"Philosophy",author:"curiouscomet",minutes:105,answers:6},
  {id:5,title:"What's a tiny thing that instantly makes your day better?",details:"Mine is when the sky looks extra pretty on the way home.",category:"Random",author:"bluehour",minutes:180,answers:32},
  {id:6,title:"Why is it easier to give advice than to follow it ourselves?",details:"I know exactly what I'd tell a friend, but somehow can't say the same thing to myself.",category:"Life",author:"afterglow",minutes:240,answers:11}
];
let selectedCategory = "All";
let questions = loadQuestions();

function loadQuestions(){
  try {
    const saved = localStorage.getItem("op_questions");
    return saved ? JSON.parse(saved) : starterQuestions;
  } catch { return starterQuestions; }
}
function saveQuestions(){ localStorage.setItem("op_questions", JSON.stringify(questions)); }
function timeLabel(minutes){
  if(minutes < 60) return `${minutes}m ago`;
  if(minutes < 1440) return `${Math.floor(minutes/60)}h ago`;
  return `${Math.floor(minutes/1440)}d ago`;
}
function escapeHTML(value){
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function renderQuestions(){
  const search = document.getElementById("searchInput").value.trim().toLowerCase();
  const filtered = questions.filter(q => (selectedCategory === "All" || q.category === selectedCategory) &&
    (q.title.toLowerCase().includes(search) || (q.details || "").toLowerCase().includes(search) || q.category.toLowerCase().includes(search)));
  const grid = document.getElementById("questionGrid");
  grid.innerHTML = filtered.map(q => `
    <article class="question-card">
      <div class="card-top"><span class="category-pill">${escapeHTML(q.category)}</span><span class="time">${q.minutes === 0 ? "just now" : timeLabel(q.minutes)}</span></div>
      <h3>${escapeHTML(q.title)}</h3>
      ${q.details ? `<p>${escapeHTML(q.details)}</p>` : `<p>A thought shared with the community.</p>`}
      <div class="card-footer"><span>✦ ${escapeHTML(q.author || "you")}</span><span class="answer-count">☾ ${q.answers || 0} answers</span></div>
    </article>`).join("");
  document.getElementById("emptyState").classList.toggle("hidden", filtered.length !== 0);
  grid.classList.toggle("hidden", filtered.length === 0);
}
const backdrop = document.getElementById("modalBackdrop");
function openModal(){ backdrop.classList.remove("hidden"); document.getElementById("questionTitle").focus(); }
function closeModal(){ backdrop.classList.add("hidden"); }
["askTopBtn","askHeroBtn","emptyAskBtn"].forEach(id => document.getElementById(id).addEventListener("click", openModal));
document.getElementById("closeModal").addEventListener("click", closeModal);
backdrop.addEventListener("click", e => { if(e.target === backdrop) closeModal(); });
document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });
document.getElementById("searchInput").addEventListener("input", renderQuestions);
document.getElementById("filters").addEventListener("click", e => {
  const btn = e.target.closest("[data-category]");
  if(!btn) return;
  selectedCategory = btn.dataset.category;
  document.querySelectorAll(".filter").forEach(el => el.classList.toggle("active", el === btn));
  renderQuestions();
});
document.getElementById("questionForm").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("questionTitle").value.trim();
  const details = document.getElementById("questionDetails").value.trim();
  const category = document.getElementById("questionCategory").value;
  if(!title) return;
  questions.unshift({id:Date.now(),title,details,category,author:"you",minutes:0,answers:0});
  saveQuestions();
  selectedCategory = "All";
  document.querySelectorAll(".filter").forEach(el => el.classList.toggle("active", el.dataset.category === "All"));
  document.getElementById("searchInput").value = "";
  document.getElementById("questionForm").reset();
  closeModal();
  renderQuestions();
  document.getElementById("questions").scrollIntoView({behavior:"smooth"});
  const toast = document.getElementById("toast");
  toast.textContent = "Your thought is saved in this browser ✦";
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3200);
});
function explainPreview(){
  document.getElementById("toast").textContent = "Login and shared community features are coming in the backend setup step.";
  document.getElementById("toast").classList.remove("hidden");
  setTimeout(() => document.getElementById("toast").classList.add("hidden"), 3600);
}
["loginBtn","joinBtn"].forEach(id => document.getElementById(id).addEventListener("click", explainPreview));
renderQuestions();
