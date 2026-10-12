
/* ==========================================
   OVERTHINKERS PARADISE — USER PROFILES
   ========================================== */

const PROFILE_SUPABASE_URL =
  "https://tpdwnkkmchjttymxlsat.supabase.co";

const PROFILE_SUPABASE_KEY =
  "sb_publishable_KavQZ3fzUphVv1Ibhih1bg_IEvt5Zri";

const profileDB = window.supabase.createClient(
  PROFILE_SUPABASE_URL,
  PROFILE_SUPABASE_KEY
);

const profileEl = (selector) => document.querySelector(selector);

let profileUser = null;
let currentAvatarURL = null;

function profileEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function profileMessage(message) {
  profileEl("#profileMessage").textContent = message;
}

function defaultUsername(user) {
  const part = (user.email || "stargazer")
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .slice(0, 20);

  return part.length >= 3 ? part : "star_" + part;
}

function showProfilePreview() {
  const username =
    profileEl("#profileUsername").value.trim() || "Your username";

  const bio =
    profileEl("#profileBio").value.trim() || "Your story starts here.";

  profileEl("#profileDisplayName").textContent = "@" + username;
  profileEl("#profileDisplayBio").textContent = bio;

  profileEl("#bioCount").textContent =
    profileEl("#profileBio").value.length;
}

profileEl("#profileUsername").addEventListener(
  "input",
  showProfilePreview
);

profileEl("#profileBio").addEventListener(
  "input",
  showProfilePreview
);

// Preview an avatar before uploading it.
profileEl("#avatarFile").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if (!allowedTypes.includes(file.type)) {
    profileMessage("Please choose a JPG, PNG, WebP, or GIF image.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    profileMessage("Your image must be 2 MB or smaller.");
    event.target.value = "";
    return;
  }

  const previewURL = URL.createObjectURL(file);
  profileEl("#avatarPreview").src = previewURL;
  profileMessage("");
});

// Load this member's profile.
async function loadMyProfile() {
  if (!profileUser) {
    profileMessage("Sign in to create and edit your profile.");
    profileEl("#profileForm").hidden = true;
    profileEl("#myPosts").innerHTML = "";
    profileEl("#myPostsEmpty").hidden = false;
    profileEl("#myPostsEmpty").textContent =
      "Sign in to see your profile and your posts.";
    return;
  }

  profileEl("#profileForm").hidden = false;
  profileMessage("Loading your profile…");

  const { data, error } = await profileDB
    .from("profiles")
    .select("id, username, bio, avatar_url")
    .eq("id", profileUser.id)
    .maybeSingle();

  if (error) {
    profileMessage("Couldn't load your profile: " + error.message);
    return;
  }

  if (data) {
    profileEl("#profileUsername").value = data.username || "";
    profileEl("#profileBio").value = data.bio || "";
    currentAvatarURL = data.avatar_url || null;

    profileEl("#avatarPreview").src =
      currentAvatarURL ||
      "https://placehold.co/120x120/17152d/c8b7ff?text=%E2%9C%A6";
  } else {
    profileEl("#profileUsername").value = defaultUsername(profileUser);
    profileEl("#profileBio").value = "";
    currentAvatarURL = null;

    profileEl("#avatarPreview").src =
      "https://placehold.co/120x120/17152d/c8b7ff?text=%E2%9C%A6";
  }

  showProfilePreview();
  profileMessage(
    data ? "Profile loaded. You can edit it below." :
    "Welcome! Choose your username and save your first profile."
  );

  await loadMyPosts();
}

// Save the member's profile and optional avatar.
profileEl("#profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!profileUser) {
    profileMessage("Please sign in before saving your profile.");
    return;
  }

  const username = profileEl("#profileUsername").value.trim();
  const bio = profileEl("#profileBio").value.trim();
  const file = profileEl("#avatarFile").files[0];
  const saveButton = profileEl("#saveProfile");

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    profileMessage(
      "Username must be 3–20 characters using letters, numbers, or underscores."
    );
    return;
  }

  if (bio.length > 160) {
    profileMessage("Your bio must be 160 characters or fewer.");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving your orbit…";
  profileMessage("");

  try {
    let avatarURL = currentAvatarURL;

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Your image must be 2 MB or smaller.");
      }

      const extensionByType = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
      };

      const extension = extensionByType[file.type];

      if (!extension) {
        throw new Error("Please choose a supported image file.");
      }

      // Use a unique path for each upload.
      const path =
        `${profileUser.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await profileDB.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = profileDB.storage
        .from("avatars")
        .getPublicUrl(path);

      avatarURL = publicData.publicUrl;
    }

    const { error: saveError } = await profileDB
      .from("profiles")
      .upsert({
        id: profileUser.id,
        username,
        bio,
        avatar_url: avatarURL,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "id"
      });

    if (saveError) throw saveError;

    currentAvatarURL = avatarURL;
    profileEl("#avatarFile").value = "";

    profileMessage("Your profile has been saved! ✦");
    showProfilePreview();

  } catch (error) {
    console.error("Profile save error:", error);
    profileMessage(
      error.message || "Something went wrong while saving your profile."
    );
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save my profile ✦";
  }
});

// Show this member's posts.
async function loadMyPosts() {
  const container = profileEl("#myPosts");
  const emptyMessage = profileEl("#myPostsEmpty");

  if (!profileUser) return;

  container.innerHTML = "<p>Loading your thoughts…</p>";
  emptyMessage.hidden = true;

  const { data, error } = await profileDB
    .from("questions")
    .select("id, title, body, category, created_at")
    .eq("user_id", profileUser.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    container.innerHTML = "";
    emptyMessage.hidden = false;
    emptyMessage.textContent =
      "Couldn't load your posts: " + error.message;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "";
    emptyMessage.hidden = false;
    emptyMessage.textContent =
      "You haven't posted any thoughts yet. Share one with the universe! ✦";
    return;
  }

  emptyMessage.hidden = true;

  container.innerHTML = data.map((post) => {
    const category = ["life", "school", "random"].includes(post.category)
      ? post.category
      : "random";

    const labels = {
      life: "LIFE & FEELINGS",
      school: "SCHOOL",
      random: "RANDOM"
    };

    return `
      <article class="card">
        <div class="cardtop">
          <span class="tag ${category}">${labels[category]}</span>
          <span>✦</span>
        </div>
        <h3>${profileEscape(post.body)}</h3>
        <p>Posted by you · ${profileEscape(
          new Date(post.created_at).toLocaleDateString()
        )}</p>
      </article>
    `;
  }).join("");
}

// Track sign-in, sign-out, and existing sessions.
async function startProfiles() {
  const { data, error } = await profileDB.auth.getSession();

  if (error) {
    profileMessage("Couldn't check your sign-in status. Please refresh.");
    return;
  }

  profileUser = data.session?.user || null;
  await loadMyProfile();

  profileDB.auth.onAuthStateChange((event, session) => {
    profileUser = session?.user || null;

    // Defer database work until the auth callback has completed.
    setTimeout(() => {
      loadMyProfile();
    }, 0);
  });
}

startProfiles();
