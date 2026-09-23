const app=document.getElementById("app");

const pages={

"/":()=>`
<section class="hero">
  <div class="hero-content">
    <span class="eyebrow">THE DEVELOPER PLATFORM</span>

    <h1>Build your <span>next idea.</span></h1>

    <p class="hero-description">
      Learn programming, sharpen your skills, build real projects and connect
      with developers through one connected platform.
    </p>

    <div class="hero-actions">
      <button class="btn btn-primary btn-large"
        onclick="location.hash='#/register'">
        Start Coding
      </button>

      <button class="btn btn-secondary btn-large"
        onclick="location.hash='#/learning'">
        Explore Platform
      </button>
    </div>

    <div class="hero-points">
      <span>Learn</span>
      <span>Practice</span>
      <span>Build</span>
      <span>Connect</span>
    </div>
  </div>

  <div class="code-preview">
    <div class="editor">
      <div class="editor-header">
        <div class="window-controls">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <span class="file-name">codem.js</span>
      </div>

      <div class="editor-body">
        <pre><code><span class="keyword">const</span> codem = {
  learn: <span class="keyword">true</span>,
  practice: <span class="keyword">true</span>,
  build: <span class="keyword">true</span>,
  community: <span class="keyword">true</span>
};

<span class="keyword">export default</span> codem;</code></pre>
      </div>
    </div>
  </div>
</section>

<section class="platform">
  <div class="section-heading">
    <span class="eyebrow">ONE PLATFORM</span>

    <h2>Everything you need to keep building.</h2>

    <p>
      Codem brings learning, practice, projects and developer community
      together in one environment.
    </p>
  </div>

  <div class="feature-grid">
    <article class="feature-card">
      <div class="feature-icon">&lt;/&gt;</div>
      <h3>Learn</h3>
      <p>
        Follow structured learning paths designed to help you develop
        practical programming skills.
      </p>
    </article>

    <article class="feature-card">
      <div class="feature-icon">⚡</div>
      <h3>Practice</h3>
      <p>
        Solve programming challenges and turn concepts into usable
        problem-solving skills.
      </p>
    </article>

    <article class="feature-card">
      <div class="feature-icon">◎</div>
      <h3>Build</h3>
      <p>
        Create and manage projects that demonstrate what you can actually
        build.
      </p>
    </article>

    <article class="feature-card">
      <div class="feature-icon">◇</div>
      <h3>Connect</h3>
      <p>
        Share ideas, ask questions and participate in a community built
        around developers.
      </p>
    </article>
  </div>
</section>

<section class="community-preview">
  <div>
    <span class="eyebrow">LEARN BY BUILDING</span>

    <h2>Turn knowledge into something real.</h2>

    <p>
      Learning becomes more useful when you can apply it. Codem connects
      structured learning with practical challenges and project work so
      developers can move from understanding concepts to building with them.
    </p>

    <div class="hero-actions">
      <button class="btn btn-primary"
        onclick="location.hash='#/learning'">
        Explore Learning
      </button>

      <button class="btn btn-secondary"
        onclick="location.hash='#/practice'">
        View Challenges
      </button>
    </div>
  </div>

  <div class="community-card">
    <div class="discussion">
      <div class="avatar">&lt;/&gt;</div>

      <div>
        <strong>Learning</strong>
        <p>Build a stronger foundation through structured learning paths.</p>
        <span>Learn at your own pace</span>
      </div>
    </div>

    <div class="discussion">
      <div class="avatar">⚡</div>

      <div>
        <strong>Practice</strong>
        <p>Work through programming problems and develop practical skills.</p>
        <span>Challenge yourself</span>
      </div>
    </div>

    <div class="discussion">
      <div class="avatar">◎</div>

      <div>
        <strong>Projects</strong>
        <p>Turn your ideas into software you can build, manage and share.</p>
        <span>Build something real</span>
      </div>
    </div>

    <div class="discussion">
      <div class="avatar">◇</div>

      <div>
        <strong>Community</strong>
        <p>Exchange knowledge with developers working through similar problems.</p>
        <span>Build together</span>
      </div>
    </div>
  </div>
</section>

<section class="platform">
  <div class="section-heading">
    <span class="eyebrow">THE CODEM WORKFLOW</span>

    <h2>Learn. Practice. Build. Share.</h2>

    <p>
      A connected development journey that gives you somewhere to go after
      finishing the tutorial.
    </p>
  </div>

  <div class="feature-grid">
    <article class="feature-card">
      <div class="feature-icon">01</div>
      <h3>Learn</h3>
      <p>Develop your understanding through structured learning experiences.</p>
    </article>

    <article class="feature-card">
      <div class="feature-icon">02</div>
      <h3>Practice</h3>
      <p>Reinforce concepts by solving practical programming challenges.</p>
    </article>

    <article class="feature-card">
      <div class="feature-icon">03</div>
      <h3>Build</h3>
      <p>Apply your skills to projects and create work that represents you.</p>
    </article>

    <article class="feature-card">
      <div class="feature-icon">04</div>
      <h3>Share</h3>
      <p>Connect with developers, exchange ideas and contribute to the community.</p>
    </article>
  </div>
</section>

<section class="community-preview">
  <div>
    <span class="eyebrow">DEVELOPER NETWORK</span>

    <h2>Build in public. Learn from people.</h2>

    <p>
      Codem gives developers a place to discover other developers, explore
      profiles, discuss technical problems and share what they are building.
    </p>

    <div class="hero-actions">
      <button class="btn btn-primary"
        onclick="location.hash='#/register'">
        Join Codem
      </button>

      <button class="btn btn-secondary"
        onclick="location.hash='#/developers'">
        Discover Developers
      </button>
    </div>
  </div>

  <div class="community-card">
    <div class="discussion">
      <div class="avatar">&lt;/&gt;</div>

      <div>
        <strong>Developer Profiles</strong>
        <p>Create a developer identity that represents your skills and work.</p>
        <span>Build your profile</span>
      </div>
    </div>

    <div class="discussion">
      <div class="avatar">◇</div>

      <div>
        <strong>Community Discussions</strong>
        <p>Ask questions, exchange solutions and learn from other developers.</p>
        <span>Share knowledge</span>
      </div>
    </div>

    <div class="discussion">
      <div class="avatar">◎</div>

      <div>
        <strong>Project Work</strong>
        <p>Show what you are building and keep your development work organized.</p>
        <span>Build your portfolio</span>
      </div>
    </div>
  </div>
</section>

<section class="platform">
  <div class="section-heading">
    <span class="eyebrow">START BUILDING</span>

    <h2>Your next project starts here.</h2>

    <p>
      Create your Codem account and begin exploring the platform.
    </p>
  </div>

  <div class="hero-actions">
    <button class="btn btn-primary btn-large"
      onclick="location.hash='#/register'">
      Create Your Account
    </button>

    <button class="btn btn-secondary btn-large"
      onclick="location.hash='#/login'">
      Log In
    </button>
  </div>
</section>

<footer class="site-footer">
  <div>
    <strong>Codem International</strong>
    <span> · Powered by Aureon Systems</span>
  </div>

  <div>
    <a href="#/privacy">Privacy Policy</a>
    <span> · </span>
    <a href="#/terms">Terms of Service</a>
  </div>
</footer>
`,
"/login":()=>`
<section class="auth-page">
<div class="auth-card">
<h2>Welcome Back</h2>
<p class="auth-subtitle">Sign in to continue to Codem.</p>

<form id="login-form">
<input id="login-email" class="input" type="email" placeholder="Email" autocomplete="email" required>
<input id="login-pass" class="input" type="password" placeholder="Password" autocomplete="current-password" required>
<button class="btn btn-primary auth-btn" type="submit">Log In</button>
</form>

<p class="auth-switch">
Don't have an account?
<a href="#/register">Create one</a>
</p>
</div>
</section>`,

"/register":()=>`
<section class="auth-page">
<div class="auth-card">
<h2>Create Account</h2>
<p class="auth-subtitle">Start building your developer identity.</p>

<form id="register-form">
<input id="reg-user" class="input" placeholder="Username" autocomplete="username" required minlength="3">
<input id="reg-email" class="input" type="email" placeholder="Email" autocomplete="email" required>
<input id="reg-pass" class="input" type="password" placeholder="Password" autocomplete="new-password" required minlength="8">
<button class="btn btn-primary auth-btn" type="submit">Create Account</button>
</form>

<p class="auth-switch">
Already have an account?
<a href="#/login">Log in</a>
</p>
</div>
</section>`,

"/dashboard":()=>`
<section class="dashboard page">
<div class="dashboard-header">
<div>
<span class="eyebrow">DEVELOPER WORKSPACE</span>
<h1>Dashboard</h1>
<p>Welcome back, ${CodemUI.escape(CodemAuth.user()?.username || "Developer")}.</p>
</div>
</div>

<div id="dashboard-content">
${CodemUI.loading("Loading your workspace...")}
</div>
</section>`,

"/learning":()=>`
<section class="page learning-page">

<div class="page-header learning-header">
<div>
<span class="eyebrow">CODEM LEARNING</span>
<h1>Learn by building.</h1>
<p>
Structured courses designed to help you understand concepts,
practice them and apply them to real development work.
</p>
</div>
</div>

<div class="learning-toolbar">

<div class="learning-search">
<label for="course-search">Search courses</label>
<input
id="course-search"
type="search"
placeholder="Search by course name or topic..."
autocomplete="off"
oninput="filterCourses(this.value)"
>
</div>

<div class="learning-summary">
<span id="course-count">Loading courses...</span>
</div>

</div>

<div id="learning-content">
${CodemUI.loading("Loading courses...")}
</div>

</section>`,

"/practice":()=>`
<section class="page">
<div class="page-header">
<div>
<span class="eyebrow">PRACTICE</span>
<h1>Challenges</h1>
<p>Test your skills with practical programming problems.</p>
</div>
</div>

<div id="practice-content">
${CodemUI.loading("Loading challenges...")}
</div>
</section>`,

"/projects":()=>`
<section class="page">
<div class="page-header projects-header">
<div>
<span class="eyebrow">WORKSPACE</span>
<h1>Projects</h1>
<p>Build, manage and share your developer work.</p>
</div>

<button class="btn btn-primary" onclick="showProjectForm()">
New Project
</button>
</div>

<div id="project-form-container"></div>

<div id="projects-content">
${CodemUI.loading("Loading your projects...")}
</div>
</section>`,

"/community":()=>`
<section class="page">
<div class="page-header">
<div>
<span class="eyebrow">COMMUNITY</span>
<h1>Developer Community</h1>
<p>Ask questions, share solutions and build with other developers.</p>
</div>

<button class="btn btn-primary" onclick="showPostForm()">
New Post
</button>
</div>

<div id="post-form-container"></div>
<div id="community-content">
${CodemUI.loading("Loading community...")}
</div>
</section>`,

"/developers":()=>`
<section class="page">
<div class="page-header">
<div>
<span class="eyebrow">NETWORK</span>
<h1>Developers</h1>
<p>Discover developers and explore their work.</p>
</div>
</div>

<div class="developer-search">
<input
id="developer-search"
class="input"
placeholder="Search developers..."
oninput="filterDevelopers(this.value)">
</div>

<div id="developers-content">
${CodemUI.loading("Loading developers...")}
</div>
</section>`

};

function openChallenge(challengeId){
if(!challengeId) return;

const target=document.getElementById("practice-content");

if(!target) return;

const existing=document.getElementById("challenge-workspace");
if(existing) existing.remove();

const workspace=document.createElement("div");
workspace.id="challenge-workspace";
workspace.className="challenge-workspace feature-card";

workspace.innerHTML=`
<div class="course-workspace-header">
<div>
<span class="card-label">SUBMISSION</span>
<h3>Submit Solution</h3>
</div>

<button class="btn btn-secondary"
onclick="document.getElementById('challenge-workspace')?.remove()">
Close
</button>
</div>

<form id="challenge-submit-form">
<textarea
id="challenge-code"
class="input code-input"
rows="14"
placeholder="Write your solution here..."
required></textarea>

<div class="card-actions">
<button class="btn btn-primary" type="submit">
Submit Solution
</button>
</div>
</form>`;

target.prepend(workspace);

document
.getElementById("challenge-submit-form")
?.addEventListener("submit",event=>{
submitChallenge(event,challengeId);
});
}

async function submitChallenge(event,challengeId){
event.preventDefault();

const code=document.getElementById("challenge-code")?.value.trim();

if(!code){
CodemUI.toast("Write a solution before submitting","error");
return;
}

const button=event.target.querySelector("button[type=submit]");

if(button) button.disabled=true;

try{
await CodemAPI.post("/submissions",{
challenge_id:challengeId,
code
});

CodemUI.toast("Solution submitted");
document.getElementById("challenge-workspace")?.remove();
}catch(e){
CodemUI.toast(e.message,"error");
}finally{
if(button) button.disabled=false;
}
}

let codemDevelopers=[];

async function loadDevelopers(){
const target=document.getElementById("developers-content");

if(!target) return;

try{
const result=await CodemAPI.get("/developers");

codemDevelopers=Array.isArray(result)
?result
:result?.data||result?.developers||result?.items||[];

renderDevelopers(codemDevelopers);
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

function renderDevelopers(developers){
const target=document.getElementById("developers-content");

if(!target) return;

if(!developers.length){
target.innerHTML=CodemUI.empty("No developers found.");
return;
}

target.innerHTML=`
<div class="feature-grid developer-grid">
${developers.map(user=>`
<article class="feature-card developer-card">
<div class="developer-identity">
<div class="codem-avatar">
${CodemUI.initials(
user.username||
user.display_name||
user.name||
"Developer"
)}
</div>

<div>
<h3>
${CodemUI.escape(
user.display_name||
user.username||
user.name||
"Developer"
)}
</h3>

<span class="developer-handle">
@${CodemUI.escape(user.username||"developer")}
</span>
</div>
</div>

<p>
${CodemUI.escape(
user.bio||
"Developer on Codem."
)}
</p>

<button class="btn btn-secondary"
onclick="openDeveloper('${CodemUI.escape(user.id||user.user_id||"")}')">
View Profile
</button>
</article>
`).join("")}
</div>`;
}

function filterDevelopers(query){
const q=String(query||"").toLowerCase().trim();

const filtered=codemDevelopers.filter(user=>{
const text=[
user.username,
user.display_name,
user.name,
user.bio
].filter(Boolean).join(" ").toLowerCase();

return !q||text.includes(q);
});

renderDevelopers(filtered);
}

async function openDeveloper(userId){
if(!userId) return;

const target=document.getElementById("developers-content");

if(!target) return;

target.innerHTML=CodemUI.loading("Loading developer profile...");

try{
const result=await CodemAPI.get(
`/developers/${encodeURIComponent(userId)}`
);

const user=result?.data||result?.user||result;

target.innerHTML=`
<div class="developer-profile feature-card">
<div class="developer-identity">
<div class="codem-avatar">
${CodemUI.initials(
user.username||
user.display_name||
"Developer"
)}
</div>

<div>
<h2>
${CodemUI.escape(
user.display_name||
user.username||
"Developer"
)}
</h2>

<span class="developer-handle">
@${CodemUI.escape(user.username||"developer")}
</span>
</div>
</div>

<p class="profile-bio">
${CodemUI.escape(user.bio||"No bio available.")}
</p>

<div class="profile-links">
${user.location
?`<span>${CodemUI.escape(user.location)}</span>`:""}

${user.website_url
?`<a href="${CodemUI.escape(user.website_url)}"
target="_blank" rel="noopener">Website</a>`:""}

${user.github_url
?`<a href="${CodemUI.escape(user.github_url)}"
target="_blank" rel="noopener">GitHub</a>`:""}

${user.linkedin_url
?`<a href="${CodemUI.escape(user.linkedin_url)}"
target="_blank" rel="noopener">LinkedIn</a>`:""}
</div>

<div class="card-actions">
<button class="btn btn-secondary"
onclick="loadDevelopers()">
Back to Developers
</button>
</div>
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

async function loadProfile(){
const target=document.getElementById("profile-content");
const current=CodemAuth.user();

if(!target) return;

if(!current?.id){
target.innerHTML=CodemUI.error("Unable to identify the current user.");
return;
}

try{
const result=await CodemAPI.get(
`/developers/${encodeURIComponent(current.id)}`
);

const user=result?.data||result?.user||result;

renderProfile(user);
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

function renderProfile(user){
const target=document.getElementById("profile-content");

target.innerHTML=`
<div class="profile-layout">

<div class="feature-card profile-card">
<div class="profile-hero">
<div class="codem-avatar codem-avatar-large">
${CodemUI.initials(
user.display_name||
user.username||
"Developer"
)}
</div>

<div>
<h2>
${CodemUI.escape(
user.display_name||
user.username||
"Developer"
)}
</h2>

<p class="developer-handle">
@${CodemUI.escape(user.username||"developer")}
</p>
</div>
</div>

<div class="profile-summary">
<p>${CodemUI.escape(user.bio||"No bio added yet.")}</p>

${user.location
?`<span>${CodemUI.escape(user.location)}</span>`:""}
</div>

<div class="profile-links">
${user.website_url
?`<a href="${CodemUI.escape(user.website_url)}"
target="_blank" rel="noopener">Website</a>`:""}

${user.github_url
?`<a href="${CodemUI.escape(user.github_url)}"
target="_blank" rel="noopener">GitHub</a>`:""}

${user.linkedin_url
?`<a href="${CodemUI.escape(user.linkedin_url)}"
target="_blank" rel="noopener">LinkedIn</a>`:""}
</div>
</div>

<div class="feature-card">
<h3>Edit Profile</h3>

<form id="profile-form" class="profile-form">

<label>
Display name
<input class="input" id="profile-display-name"
value="${CodemUI.escape(user.display_name||"")}"
maxlength="100">
</label>

<label>
Bio
<textarea class="input" id="profile-bio"
rows="5" maxlength="1000">${CodemUI.escape(user.bio||"")}</textarea>
</label>

<label>
Location
<input class="input" id="profile-location"
value="${CodemUI.escape(user.location||"")}"
maxlength="120">
</label>

<label>
Website
<input class="input" id="profile-website"
value="${CodemUI.escape(user.website_url||"")}"
maxlength="300">
</label>

<label>
GitHub
<input class="input" id="profile-github"
value="${CodemUI.escape(user.github_url||"")}"
maxlength="300">
</label>

<label>
LinkedIn
<input class="input" id="profile-linkedin"
value="${CodemUI.escape(user.linkedin_url||"")}"
maxlength="300">
</label>

<button class="btn btn-primary" type="submit">
Save Profile
</button>

</form>
</div>

</div>`;

document.getElementById("profile-form")
?.addEventListener("submit",updateProfile);
}

async function updateProfile(event){
event.preventDefault();

const current=CodemAuth.user();

if(!current?.id) return;

const button=event.target.querySelector("button[type=submit]");
if(button) button.disabled=true;

const body={
display_name:document.getElementById("profile-display-name")?.value.trim(),
bio:document.getElementById("profile-bio")?.value.trim(),
location:document.getElementById("profile-location")?.value.trim(),
website_url:document.getElementById("profile-website")?.value.trim(),
github_url:document.getElementById("profile-github")?.value.trim(),
linkedin_url:document.getElementById("profile-linkedin")?.value.trim()
};

try{
const result=await CodemAPI.patch(
`/developers/${encodeURIComponent(current.id)}`,
body
);

const updated=result?.data||result?.user||result;

CodemAuth.save(CodemAuth.token(),updated);
CodemUI.toast("Profile updated");
renderProfile(updated);
}catch(e){
CodemUI.toast(e.message,"error");
}finally{
if(button) button.disabled=false;
}
}

async function loadNotifications(){
const target=document.getElementById("notifications-content");

if(!target) return;

try{
const result=await CodemAPI.get("/notifications");

const notifications=Array.isArray(result)
?result
:result?.data||result?.notifications||result?.items||[];

if(!notifications.length){
target.innerHTML=CodemUI.empty(
"No notifications yet."
);
return;
}

target.innerHTML=`
<div class="notification-list">
${notifications.map(item=>`
<article class="notification-item">
<div class="notification-dot"></div>

<div>
<strong>
${CodemUI.escape(
item.title||
item.type||
"Codem Activity"
)}
</strong>

<p>
${CodemUI.escape(
item.message||
item.content||
item.body||
""
)}
</p>

<span class="post-meta">
${CodemUI.escape(item.created_at||"")}
</span>
</div>
</article>
`).join("")}
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

function saveSetting(key,value){
localStorage.setItem(
`codem_setting_${key}`,
JSON.stringify(value)
);

CodemUI.toast("Setting saved");
}

function loadSettings(){
const dark=localStorage.getItem("codem_setting_dark_mode");

const checkbox=document.getElementById("setting-dark");

if(checkbox && dark!==null){
checkbox.checked=JSON.parse(dark);
}

const user=CodemAuth.user();
const target=document.getElementById("settings-account");

if(target && user){
target.innerHTML=`
<div class="settings-account">
<strong>
${CodemUI.escape(
user.display_name||
user.username||
"Developer"
)}
</strong>

<span>
${CodemUI.escape(user.email||"")}
</span>
</div>`;
}
}

async function loadCommunity(){
const target=document.getElementById("community-content");

if(!target) return;

try{
const result=await CodemAPI.get("/community");

const posts=Array.isArray(result)
?result
:result?.data||result?.posts||result?.items||[];

if(!posts.length){
target.innerHTML=CodemUI.empty("No community posts yet.");
return;
}

target.innerHTML=`
<div class="community-feed">
${posts.map(post=>{
const id=post.id||post.post_id||"";

return `
<article class="community-post">
<div class="post-header">
<div class="codem-avatar">
${CodemUI.initials(post.username||post.author?.username||"Developer")}
</div>

<div>
<strong>
${CodemUI.escape(post.username||post.author?.username||"Developer")}
</strong>

<span class="post-meta">
${CodemUI.escape(post.created_at||"")}
</span>
</div>
</div>

<h3>${CodemUI.escape(post.title||"Community Post")}</h3>

<p class="post-body">
${CodemUI.escape(post.content||post.body||"")}
</p>

<div class="post-actions">
<button class="btn btn-secondary"
onclick="reactToPost('${CodemUI.escape(id)}')">
React
</button>

<button class="btn btn-secondary"
onclick="bookmarkPost('${CodemUI.escape(id)}')">
Bookmark
</button>

<button class="btn btn-secondary"
onclick="showComments('${CodemUI.escape(id)}')">
Comments
</button>
</div>

<div id="comments-${CodemUI.escape(id)}"></div>
</article>`;
}).join("")}
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

async function reactToPost(postId){
if(!postId) return;

try{
await CodemAPI.post("/reactions",{
target_type:"post",
target_id:postId
});

CodemUI.toast("Reaction added");
}catch(e){
CodemUI.toast(e.message,"error");
}
}

async function bookmarkPost(postId){
if(!postId) return;

try{
await CodemAPI.post("/bookmarks",{
target_type:"post",
target_id:postId
});

CodemUI.toast("Post bookmarked");
}catch(e){
CodemUI.toast(e.message,"error");
}
}

async function showComments(postId){
if(!postId) return;

const target=document.getElementById(`comments-${postId}`);

if(!target) return;

target.innerHTML=CodemUI.loading("Loading comments...");

try{
const result=await CodemAPI.get(
`/comments?post_id=${encodeURIComponent(postId)}`
);

const comments=Array.isArray(result)
?result
:result?.data||result?.comments||result?.items||[];

target.innerHTML=`
<div class="comments-panel">
${comments.length
?comments.map(comment=>`
<div class="comment">
<strong>
${CodemUI.escape(
comment.username||
comment.author?.username||
"Developer"
)}
</strong>

<p>
${CodemUI.escape(comment.content||comment.body||"")}
</p>
</div>
`).join("")
:CodemUI.empty("No comments yet.")}

<form class="comment-form"
onsubmit="createComment(event,'${CodemUI.escape(postId)}')">

<input
class="input"
placeholder="Write a comment..."
maxlength="2000"
required>

<button class="btn btn-primary" type="submit">
Comment
</button>
</form>
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

async function createComment(event,postId){
event.preventDefault();

const input=event.target.querySelector("input");
const content=input?.value.trim();

if(!content) return;

try{
await CodemAPI.post("/comments",{
post_id:postId,
content
});

CodemUI.toast("Comment added");
await showComments(postId);
}catch(e){
CodemUI.toast(e.message,"error");
}
}

function showPostForm(){
const target=document.getElementById("post-form-container");

if(!target) return;

target.innerHTML=`
<div class="post-form feature-card">
<h3>Create Post</h3>

<form id="post-create-form">
<input
id="post-title"
class="input"
placeholder="Post title"
maxlength="160"
required>

<textarea
id="post-content"
class="input"
rows="6"
placeholder="Share something with the community..."
maxlength="5000"
required></textarea>

<div class="card-actions">
<button class="btn btn-primary" type="submit">
Publish
</button>

<button class="btn btn-secondary" type="button"
onclick="document.getElementById('post-form-container').innerHTML=''">
Cancel
</button>
</div>
</form>
</div>`;

document
.getElementById("post-create-form")
?.addEventListener("submit",createPost);
}

async function createPost(event){
event.preventDefault();

const title=document.getElementById("post-title")?.value.trim();
const content=document.getElementById("post-content")?.value.trim();

if(!title||!content){
CodemUI.toast("Title and content are required","error");
return;
}

const button=event.target.querySelector("button[type=submit]");
if(button) button.disabled=true;

try{
await CodemAPI.post("/community",{
title,
content
});

CodemUI.toast("Post published");
document.getElementById("post-form-container").innerHTML="";
await loadCommunity();
}catch(e){
CodemUI.toast(e.message,"error");
}finally{
if(button) button.disabled=false;
}
}

async function loadProjects(){
const target=document.getElementById("projects-content");

if(!target || !CodemAuth.loggedIn()) return;

try{
const result=await CodemAPI.get("/projects/mine");

const projects=Array.isArray(result)
?result
:result?.data||result?.projects||[];

if(!projects.length){
target.innerHTML=CodemUI.empty("You haven't created any projects yet.");
return;
}

target.innerHTML=`
<div class="feature-grid">
${projects.map(project=>`
<article class="feature-card">
<span class="card-label">PROJECT</span>
<h3>${CodemUI.escape(project.name||project.title||"Untitled Project")}</h3>
<p>${CodemUI.escape(project.description||"No description provided.")}</p>

<div class="card-actions">
<span class="project-status">
${CodemUI.escape(project.status||"Active")}
</span>

<button class="btn btn-secondary"
onclick="editProject('${CodemUI.escape(project.id||project.project_id||"")}')">
Edit
</button>

<button class="btn btn-secondary"
onclick="deleteProject('${CodemUI.escape(project.id||project.project_id||"")}')">
Delete
</button>
</div>
</article>
`).join("")}
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

function editProject(projectId){
if(!projectId) return;

const target=document.getElementById("project-form-container");

if(!target) return;

target.innerHTML=`
<div class="project-form feature-card">
<h3>Edit Project</h3>

<form id="project-edit-form">
<input
id="project-name"
class="input"
placeholder="Project name"
required
maxlength="120">

<textarea
id="project-description"
class="input"
placeholder="Project description"
rows="4"
maxlength="2000"></textarea>

<div class="card-actions">
<button class="btn btn-primary" type="submit">
Save Changes
</button>

<button
class="btn btn-secondary"
type="button"
onclick="document.getElementById('project-form-container').innerHTML=''">
Cancel
</button>
</div>
</form>
</div>`;

document
.getElementById("project-edit-form")
?.addEventListener("submit",async event=>{
event.preventDefault();

const name=document.getElementById("project-name")?.value.trim();
const description=document.getElementById("project-description")?.value.trim();

if(!name){
CodemUI.toast("Project name is required","error");
return;
}

const button=event.target.querySelector("button[type=submit]");
if(button) button.disabled=true;

try{
await CodemAPI.patch(`/projects/${encodeURIComponent(projectId)}`,{
name,
description
});

CodemUI.toast("Project updated");
target.innerHTML="";
await loadProjects();
}catch(e){
CodemUI.toast(e.message,"error");
}finally{
if(button) button.disabled=false;
}
});
}

async function deleteProject(projectId){
if(!projectId) return;

if(!confirm("Delete this project? This action cannot be undone.")){
return;
}

try{
await CodemAPI.delete(`/projects/${encodeURIComponent(projectId)}`);
CodemUI.toast("Project deleted");
await loadProjects();
}catch(e){
CodemUI.toast(e.message,"error");
}
}

function showProjectForm(){
const target=document.getElementById("project-form-container");

if(!target) return;

target.innerHTML=`
<div class="project-form feature-card">
<h3>Create Project</h3>

<form id="project-create-form">
<input
id="project-name"
class="input"
placeholder="Project name"
required
maxlength="120">

<textarea
id="project-description"
class="input"
placeholder="Describe your project"
rows="4"
maxlength="2000"></textarea>

<div class="card-actions">
<button class="btn btn-primary" type="submit">
Create Project
</button>

<button
class="btn btn-secondary"
type="button"
onclick="document.getElementById('project-form-container').innerHTML=''">
Cancel
</button>
</div>
</form>
</div>`;

const form=document.getElementById("project-create-form");

form?.addEventListener("submit",createProject);
}

async function createProject(event){
event.preventDefault();

const name=document.getElementById("project-name")?.value.trim();
const description=document.getElementById("project-description")?.value.trim();

if(!name){
CodemUI.toast("Project name is required","error");
return;
}

const button=event.target.querySelector("button[type=submit]");

if(button) button.disabled=true;

try{
await CodemAPI.post("/projects",{
name,
description
});

CodemUI.toast("Project created");

document.getElementById("project-form-container").innerHTML="";
await loadProjects();
}catch(e){
CodemUI.toast(e.message,"error");
}finally{
if(button) button.disabled=false;
}
}

async function loadChallenges(){
const target=document.getElementById("practice-content");

if(!target) return;

try{
const result=await CodemAPI.get("/challenges");

const challenges=Array.isArray(result)
?result
:result?.data||result?.challenges||[];

if(!challenges.length){
target.innerHTML=CodemUI.empty("No challenges are available yet.");
return;
}

target.innerHTML=`
<div class="feature-grid">
${challenges.map(challenge=>`
<article class="feature-card">
<span class="card-label">CHALLENGE</span>
<h3>${CodemUI.escape(challenge.title||challenge.name||"Untitled Challenge")}</h3>
<p>${CodemUI.escape(challenge.description||"Solve this developer challenge.")}</p>

<div class="challenge-meta">
<span>${CodemUI.escape(challenge.difficulty||"Practice")}</span>
</div>

<div class="card-actions">
<button class="btn btn-primary"
onclick="openChallenge('${CodemUI.escape(challenge.id||challenge.challenge_id||"")}')">
Solve
</button>
</div>
</article>
`).join("")}
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

async function loadCourses(){
const target=document.getElementById("learning-content");

if(!target) return;

try{
const result=await CodemAPI.get("/courses");

const courses=Array.isArray(result)
?result
:result?.data||result?.courses||[];

if(!courses.length){
target.innerHTML=CodemUI.empty("No courses are available yet.");
return;
}

target.innerHTML=`
<div class="feature-grid">
${courses.map(course=>`
<article class="feature-card">
<span class="card-label">COURSE</span>
<h3>${CodemUI.escape(course.title||course.name||"Untitled Course")}</h3>
<p>${CodemUI.escape(course.description||"Explore this learning path.")}</p>
<div class="card-actions">
<button class="btn btn-primary"
onclick="openCourse('${CodemUI.escape(course.id||course.course_id||"")}')">
Open Course
</button>
</div>
</article>
`).join("")}
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

async function enrollCourse(courseId){
if(!courseId) return;

try{
await CodemAPI.post(`/courses/${encodeURIComponent(courseId)}/enroll`,{});
CodemUI.toast("Course enrollment successful");
}catch(e){
CodemUI.toast(e.message,"error");
}
}

async function loadDashboard(){
const target=document.getElementById("dashboard-content");

if(!target || !CodemAuth.loggedIn()) return;

try{
const [projects,courses,challenges]=await Promise.all([
CodemAPI.get("/projects/mine").catch(()=>({data:[]})),
CodemAPI.get("/courses").catch(()=>({data:[]})),
CodemAPI.get("/challenges").catch(()=>({data:[]}))
]);

const projectList=Array.isArray(projects)
?projects
:projects?.data||projects?.projects||[];

const courseList=Array.isArray(courses)
?courses
:courses?.data||courses?.courses||[];

const challengeList=Array.isArray(challenges)
?challenges
:challenges?.data||challenges?.challenges||[];

target.innerHTML=`
<div class="stats">
<div class="stat">
<h3>${projectList.length}</h3>
<p>Projects</p>
</div>

<div class="stat">
<h3>${courseList.length}</h3>
<p>Courses</p>
</div>

<div class="stat">
<h3>${challengeList.length}</h3>
<p>Challenges</p>
</div>

<div class="stat">
<h3>0</h3>
<p>XP</p>
</div>
</div>

<div class="dashboard-grid">
<article class="feature-card">
<h3>Continue Learning</h3>
<p>Explore courses and track your progress.</p>
<a class="btn btn-secondary" href="#/learning">Open Learning</a>
</article>

<article class="feature-card">
<h3>Practice</h3>
<p>Sharpen your skills with developer challenges.</p>
<a class="btn btn-secondary" href="#/practice">Practice Now</a>
</article>

<article class="feature-card">
<h3>Your Projects</h3>
<p>Build, manage and share your work.</p>
<a class="btn btn-secondary" href="#/projects">View Projects</a>
</article>
</div>`;
}catch(e){
target.innerHTML=CodemUI.error(e.message);
}
}

function grid(title,items){
return `
<section class="page">
<h1>${title}</h1>
<div class="feature-grid">
${items.map(i=>`
<article class="feature-card">
<h3>${i}</h3>
<p>Open module</p>
</article>`).join("")}
</div>
</section>`;
}

function normalizeRoute(){
const hash=location.hash||"#/";
return hash.replace(/^#/, "")||"/";
}

function requireAuthRoute(route){
const protectedRoutes=[
"/dashboard",
"/learning",
"/practice",
"/projects",
"/community",
"/developers",
"/profile",
"/settings",
"/notifications"
];

return protectedRoutes.includes(route);
}

function updateDocumentState(route){
document.body.dataset.route=route;

document.body.classList.toggle(
"codem-authenticated",
CodemAuth.loggedIn()
);

document.body.classList.toggle(
"codem-protected-page",
requireAuthRoute(route)
);

window.scrollTo({
top:0,
behavior:"instant"
});
}

function nav(route=normalizeRoute()){
const box=document.getElementById("nav-auth");

document.querySelectorAll(".codem-nav a,.codem-sidebar-bottom a")
.forEach(link=>{
const href=link.getAttribute("href")||"";
link.classList.toggle(
"codem-nav-active",
href===`#${route}`
);
});

if(!box)return;

if(CodemAuth.loggedIn()){
const u=CodemAuth.user();

box.innerHTML=`
<div class="codem-user">
<span class="codem-avatar">${CodemUI.initials(u?.username||"Developer")}</span>
<span class="codem-user-name">${CodemUI.escape(u?.username||"Developer")}</span>
</div>
<button class="btn btn-secondary" onclick="CodemAuth.logout()">Logout</button>`;
}else{
box.innerHTML=`
<a class="btn btn-secondary" href="#/login">Log In</a>
<a class="btn btn-primary" href="#/register">Create Account</a>`;
}
}

function render(){
const route=normalizeRoute();

if(requireAuthRoute(route) && !CodemAuth.loggedIn()){
if(location.hash!=="#/login"){
location.hash="#/login";
}
return;
}

if((route==="/login" || route==="/register") && CodemAuth.loggedIn()){
if(location.hash!=="#/dashboard"){
location.hash="#/dashboard";
}
return;
}

updateDocumentState(route);

app.innerHTML=(pages[route]||pages["/"])();

nav(route);

if(route==="/dashboard"){
loadDashboard();
}

if(route==="/learning"){
loadCourses();
}

if(route==="/practice"){
loadChallenges();
}

if(route==="/projects"){
loadProjects();
}

if(route==="/community"){
loadCommunity();
}

if(route==="/developers"){
loadDevelopers();
}

if(route==="/profile"){
loadProfile();
}

if(route==="/notifications"){
loadNotifications();
}

if(route==="/settings"){
loadSettings();
}
}

async function login(){
const email=gid("login-email")?.value.trim();
const password=gid("login-pass")?.value;

if(!email || !password){
CodemUI.toast("Enter your email and password","error");
return;
}

const button=document.querySelector("#login-form button");

if(button)button.disabled=true;

try{
const r=await CodemAPI.post("/auth/login",{
email,
password
});

CodemAuth.save(r.data.token,r.data.user);

CodemUI.toast("Welcome back");

location.hash="#/dashboard";

}catch(e){
CodemUI.toast(e.message,"error");

}finally{
if(button)button.disabled=false;
}
}

async function register(){
const username=gid("reg-user")?.value.trim();
const email=gid("reg-email")?.value.trim();
const password=gid("reg-pass")?.value;

if(!username || !email || !password){
CodemUI.toast("Complete all required fields","error");
return;
}

if(username.length<3){
CodemUI.toast("Username must be at least 3 characters","error");
return;
}

if(password.length<8){
CodemUI.toast("Password must be at least 8 characters","error");
return;
}

const button=document.querySelector("#register-form button");

if(button)button.disabled=true;

try{
const r=await CodemAPI.post("/auth/register",{
username,
email,
password
});

CodemAuth.save(r.data.token,r.data.user);

CodemUI.toast("Account created");

location.hash="#/dashboard";

}catch(e){
CodemUI.toast(e.message,"error");

}finally{
if(button)button.disabled=false;
}
}

function gid(id){
return document.getElementById(id);
}

window.login=login;
window.register=register;

document.addEventListener("submit",event=>{
if(event.target.id==="login-form"){
event.preventDefault();
login();
}

if(event.target.id==="register-form"){
event.preventDefault();
register();
}
});

window.addEventListener("hashchange",render);
window.addEventListener("DOMContentLoaded",render);

/* Mobile navigation */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("codem-menu-toggle");
  const sidebar = document.getElementById("codem-sidebar");

  if (!toggle || !sidebar) return;

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("codem-sidebar-open");
  });

  sidebar.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      sidebar.classList.remove("codem-sidebar-open");
    }
  });
});


