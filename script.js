// ==========================================
// OVERTHINKERS PARADISE — Supabase connection
// ==========================================

// Your Supabase project URL
const SUPABASE_URL = "https://tpdwnkkmchjttymxlsat.supabase.co";

// Replace this with your own Supabase Publishable key
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KavQZ3fzUphVv1Ibhih1bg_IEvt5Zri";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const $ = (selector) => document.querySelector(selector);

const grid = $("#grid");
const empty = $("#empty");
const search = $("#search");
const modal = $("#modal");
const signInButton = $("#signIn");

let filter = "all";
let currentUser = null;
let cloudPosts = [];
let authMessage = "";
let authMode = "signin";

const samples = [
  {
    text: "Do you ever miss a version of yourself that doesn't exist anymore?",
    category: "life",
    note: "Sometimes growing up feels like saying goodbye to people you used to be.",
    author: "moonchild",
    initial: "M",
    time: "Community favourite"
  },
  {
    text: "Why does one embarrassing moment replay in 4K at 2 AM?",
    category: "school",
    note: "My brain has a cinema and apparently I'm the only audience member.",
    author: "sleepy.star",
    initial: "S",
    time: "Community favourite"
  },
  {
    text: "If animals could talk, which one would be the biggest gossip?",
    category: "random",
    note: "I'm putting my money on the neighbourhood crow.",
    author: "astrobean",
    initial: "A",
    time: "Community favourite"
  }
];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatTime(dateString) {
  const date = new Date(dateString);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

// Load real posts from Supabase
async function loadPosts() {
  const { data, error } = await db
    .from("questions")
    .select("id, title, body, category, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Could not load community thoughts:", error.message);
    return;
  }

 const posts = data || [];

const userIds = [...new Set(posts.map(post => post.user_id))];

let profilesById = {};

if (userIds.length > 0) {
  const { data: profiles, error: profileError } = await db
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);

  if (!profileError) {
    profilesById = Object.fromEntries(
      (profiles || []).map(profile => [profile.id, profile])
    );
  }
}

cloudPosts = posts.map((post) => {
  const profile = profilesById[post.user_id];

  return {
    id: post.id,
    text: post.body,
    category: post.category || "random",
    note: "Shared with the community ✦",
    author: profile?.username || "community member",
    initial: profile?.username?.[0]?.toUpperCase() || "✦",
    avatar: profile?.avatar_url || null,
    time: formatTime(post.created_at)
  };
});
  render();
}

// Display sample and real community posts
function render() {
  const query = search.value.trim().toLowerCase();

  const allPosts = [...cloudPosts, ...samples].filter((post) => {
    const categoryMatches =
      filter === "all" || post.category === filter;

    const searchMatches =
      post.text.toLowerCase().includes(query) ||
      (post.note || "").toLowerCase().includes(query);

    return categoryMatches && searchMatches;
  });

  grid.innerHTML = allPosts.map((post) => `
    <article class="card">
      <div class="cardtop">
        <span class="tag ${escapeHTML(post.category)}">
          ${{ life: "LIFE & FEELINGS", school: "SCHOOL", random: "RANDOM" }[post.category] || "THOUGHT"}
        </span>
        <span>✦</span>
      </div>
      <h3>${escapeHTML(post.text)}</h3>
      <p>${escapeHTML(post.note)}</p>
      <div class="foot">
        <span class="avatar">${escapeHTML(post.initial)}</span>
        <span>${escapeHTML(post.author)}</span>
        <span>·</span>
        <span>${escapeHTML(post.time)}</span>
      </div>
    </article>
  `).join("");

  empty.hidden = allPosts.length > 0;
}

// Category filters
document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    filter = button.dataset.filter;
    render();
  });
});

// Search
search.addEventListener("input", render);

// Character counter
$("#thought").addEventListener("input", (event) => {
  $("#count").textContent = `${event.target.value.length} / 240`;
});

// Authentication window
function showAuth(mode = "signin", message = "") {
  authMode = mode;
  authMessage = message;

  modal.innerHTML = `
    <button class="x" id="closeAuth" aria-label="Close">×</button>
    <b>✦</b>
    <div class="eyebrow">WELCOME, STARGAZER</div>
    <h2>${mode === "signup" ? "Join the universe." : "Your orbit awaits."}</h2>
    <p>
      ${mode === "signup"
        ? "Create an account to share your thoughts with the community."
        : "Sign in to share your thoughts with the universe."}
    </p>

    <form id="authForm">
      <label for="authEmail">Email address</label>
      <input id="authEmail" type="email" required
        autocomplete="email" placeholder="you@example.com"
        style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px;padding:12px;border-radius:10px;">

      <label for="authPassword">Password</label>
      <input id="authPassword" type="password" required minlength="8"
        autocomplete="${mode === "signup" ? "new-password" : "current-password"}"
        placeholder="At least 8 characters"
        style="display:block;width:100%;box-sizing:border-box;margin:8px 0 16px;padding:12px;border-radius:10px;">

      <p id="authMessage" role="status">${escapeHTML(message)}</p>

      <button class="primary" id="authSubmit" type="submit">
        ${mode === "signup" ? "Create account ✦" : "Sign in ✦"}
      </button>
    </form>

    <p>
      ${mode === "signup" ? "Already have an account?" : "New to Overthinkers Paradise?"}
      <button type="button" id="switchAuth"
        style="background:none;border:0;color:#b9a5ff;cursor:pointer;">
        ${mode === "signup" ? "Sign in" : "Create account"}
      </button>
    </p>
  `;

  if (!modal.open) modal.showModal();
}

modal.addEventListener("click", (event) => {
  if (event.target.id === "closeAuth") modal.close();

  if (event.target.id === "switchAuth") {
    showAuth(authMode === "signup" ? "signin" : "signup");
  }
});

// Sign in / sign up form
modal.addEventListener("submit", async (event) => {
  if (event.target.id !== "authForm") return;

  event.preventDefault();

  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const submitButton = $("#authSubmit");
  const message = $("#authMessage");

  submitButton.disabled = true;
  submitButton.textContent = "Connecting…";
  message.textContent = "";

  let result;

  if (authMode === "signup") {
    result = await db.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.href
      }
    });
  } else {
    result = await db.auth.signInWithPassword({
      email,
      password
    });
  }

  submitButton.disabled = false;
  submitButton.textContent =
    authMode === "signup" ? "Create account ✦" : "Sign in ✦";

  if (result.error) {
    message.textContent = result.error.message;
    return;
  }

  if (authMode === "signup" && !result.data.session) {
    message.textContent =
      "Account created! Check your email for the confirmation link before signing in.";
    return;
  }

  modal.close();
});

// Sign in / sign out button
signInButton.addEventListener("click", async () => {
  if (currentUser) {
    const { error } = await db.auth.signOut();

    if (error) {
      alert(error.message);
    }
  } else {
    showAuth("signin");
  }
});

// Keep the page updated when authentication changes
db.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
  signInButton.textContent = currentUser ? "Sign out ↗" : "Sign in ↗";
});

// Publish a thought to the shared database
$("#form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = $("#thought").value.trim();
  const category = $("#category").value;
  const submitButton = event.submitter;

  if (text.length < 10) {
    alert("Please write at least 10 characters for your thought.");
    return;
  }

  if (!currentUser) {
    showAuth("signin", "Sign in first to share a thought with the community ✦");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending your thought…";

  const { error } = await db.from("questions").insert({
    user_id: currentUser.id,
    title: text.slice(0, 150),
    body: text,
    category
  });

  submitButton.disabled = false;
  submitButton.textContent = "Release your thought ✦";

  if (error) {
    alert("Your thought couldn't be posted: " + error.message);
    return;
  }

  $("#thought").value = "";
  $("#count").textContent = "0 / 240";

  filter = "all";
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  await loadPosts();
  $("#explore").scrollIntoView({ behavior: "smooth" });
});

// Footer year
$("#year").textContent = new Date().getFullYear();

// Start the website
async function startWebsite() {
  const { data } = await db.auth.getSession();

  currentUser = data.session?.user || null;
  signInButton.textContent = currentUser ? "Sign out ↗" : "Sign in ↗";

  render();
  await loadPosts();
}

startWebsite();
