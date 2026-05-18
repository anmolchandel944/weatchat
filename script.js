//  //  Paste your Firebase config here
//   const firebaseConfig = {
//   apiKey: "AIzaSyAIwDDBXWiPEYY8Jrc-zc5VBn7ltzbG70c",
//   authDomain: "weatchat-5aab7.firebaseapp.com",
//   projectId: "weatchat-5aab7",
//   storageBucket: "weatchat-5aab7.firebasestorage.app",
//   messagingSenderId: "191457153693",
//   appId: "1:191457153693:web:8bce5b0ed3440949507a74",
//   measurementId: "G-HGMG6NJELZ"
// };
  


        
const firebaseConfig = {
  apiKey: "AIzaSyCJXo31QFHzYoddFzPL1kpADJnRXTmNeXQ",
  authDomain: "weatchat-51532.firebaseapp.com",
  projectId: "weatchat-51532",
  storageBucket: "weatchat-51532.firebasestorage.app",
  messagingSenderId: "284999544512",
  appId: "1:284999544512:web:369bade75772203e64c725",
  measurementId: "G-DMJ5ER1PVE"
};

        let app, auth, db, storage;
        let currentUser = null;
        let currentChatId = null;
        let currentChatUser = null;
        let usersData = {};
        let messagesRef = null;
        function initializeFirebase() {
            app = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.database();
            storage = firebase.storage();
        }

        function handleGoogleLogin() {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).catch(err => alert("Login failed: " + err.message));
        }

        // Show Logout Confirmation Popup
function logout() {
    const popup = document.getElementById("logout-confirm-popup");
    popup.classList.remove("hidden");
    popup.classList.add("flex");
}

// Cancel Logout
function cancelLogout() {
    const popup = document.getElementById("logout-confirm-popup");
    popup.classList.add("hidden");
    popup.classList.remove("flex");
}

// Confirm Logout
function confirmLogout() {
    const popup = document.getElementById("logout-confirm-popup");
    
    if (currentUser?.uid) {
        db.ref('users/' + currentUser.uid).update({
            isOnline: false,
            lastOnline: Date.now()
        });
    }

    auth.signOut().then(() => {
        popup.classList.add("hidden");
        popup.classList.remove("flex");
        
        // Success Message
        showCustomPopup("👋 Logged out successfully", "logout");
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    });
}

        function checkAndSetDisplayName(user) {
            db.ref('users/' + user.uid).once('value', snapshot => {
                const profile = snapshot.val();
                if (!profile || !profile.displayName) {
                    document.getElementById('name-modal').classList.remove('hidden');
                    window.tempGoogleProfile = { uid: user.uid, email: user.email, photoURL: user.photoURL || 'https://i.pravatar.cc/128' };
                } else {
                    currentUser = { ...user, ...profile };
                    renderCurrentUserAvatar();
                    loadAllUsers();
                }
            });
        }

        function saveDisplayName() {
    const nameInput = document.getElementById('display-name-input');
    const name = nameInput.value.trim();

    if (!name) return showCustomPopup("Please enter a name", true);
    if (name.length < 3) return showCustomPopup("Name should be at least 3 characters long", true);

    db.ref('users').once('value', snapshot => {
        const allUsers = snapshot.val() || {};
        let nameTaken = false;

        Object.values(allUsers).forEach(user => {
            if (user.displayName && user.displayName.toLowerCase() === name.toLowerCase()) {
                nameTaken = true;
            }
        });

        if (nameTaken) {
            showCustomPopup(`❌ "${name}" is already taken!<br><br>Please add some characters or numbers.<br>Example: ${name}123, ${name}X, ${name}07`, true);
            nameInput.focus();
        } else {
            // Save Name
            const profileData = {
                ...window.tempGoogleProfile,
                displayName: name,
                isOnline: true,
                lastOnline: Date.now()
            };

            db.ref('users/' + profileData.uid).set(profileData).then(() => {
                hideNameModal();
                currentUser = profileData;
                renderCurrentUserAvatar();
                loadAllUsers();
                showCustomPopup(`Welcome, ${name}! 🎉`, false);
            });
        }
    });
}

        // function saveDisplayName() {
        //     const name = document.getElementById('display-name-input').value.trim();
        //     if (!name) return alert("Please enter a name");

        //     const profileData = {
        //         ...window.tempGoogleProfile,
        //         displayName: name,
        //         isOnline: true,
        //         lastOnline: Date.now()
        //     };

        //     db.ref('users/' + profileData.uid).set(profileData).then(() => {
        //         hideNameModal();
        //         currentUser = profileData;
        //         renderCurrentUserAvatar();
        //         loadAllUsers();
        //     });
        // }

        function hideNameModal() {
            document.getElementById('name-modal').classList.add('hidden');
        }

        function renderCurrentUserAvatar() {
            if (currentUser?.photoURL) {
                document.getElementById('current-user-photo').src = currentUser.photoURL;
            }
        }

        function loadAllUsers() {
            db.ref('users').on('value', snapshot => {
                usersData = snapshot.val() || {};
                filterUsers();
            });
        }

        function filterUsers() {
            const term = document.getElementById('search-input').value.toLowerCase().trim();
            const container = document.getElementById('users-list');
            container.innerHTML = '';

            let hasResult = false;

            Object.keys(usersData).forEach(uid => {
                const user = usersData[uid];
                if (uid === currentUser?.uid) return;

                if (!term || user.displayName?.toLowerCase().includes(term)) {
                    hasResult = true;
                    const div = document.createElement('div');
                    div.className = `flex items-center gap-3 px-4 py-4 rounded-3xl cursor-pointer hover:bg-white/10`;
                    div.innerHTML = `
                        <img src="${user.photoURL || 'https://i.pravatar.cc/128'}" class="w-10 h-10 rounded-2xl">
                        <div>
                            <p class="font-medium">${user.displayName}</p>
                            <p class="text-xs text-emerald-400">Online</p>
                        </div>
                    `;
                    div.onclick = () => openChat(user);
                    container.appendChild(div);
                }
            });

            if (!hasResult) {
                container.innerHTML = `<div class="text-center py-12 text-slate-400">
                    ${term ? `No user found for "<b>${term}</b>"` : "No other users yet.<br>Share your link to invite friends!"}
                </div>`;
            }
        }

     function openChat(user) { 
    currentChatUser = user;
    currentChatId = [currentUser.uid, user.uid].sort().join('_');
        if(window.innerWidth < 768){

    sidebar.classList.remove("active");

}
    // ✅ RESET ONLY HERE (correct place)
    document.getElementById('messages-container').innerHTML = "";

    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('chat-header').classList.remove('hidden');

    document.getElementById('chat-header-photo').src = user.photoURL;
    document.getElementById('chat-header-name').textContent = user.displayName;

    listenMessages();
}

function closeChat() {

    // ❌ STOP FIREBASE LISTENER
    if (messagesRef) {
        messagesRef.off();
        messagesRef = null;
    }

    // ❌ CLEAR CHAT UI
    document.getElementById('messages-container').innerHTML = "";

    // RESET
    currentChatId = null;
    currentChatUser = null;

    // UI SWITCH
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('chat-header').classList.add('hidden');
    document.getElementById('welcome-screen').classList.remove('hidden');
}

        function sendTextMessage() {
            const input = document.getElementById('message-input');
            const text = input.value.trim();
            if (!text || !currentChatId) return;

            db.ref(`chats/${currentChatId}/messages`).push({
                senderId: currentUser.uid,
                text: text,
                timestamp: Date.now()
            });
            input.value = '';
        }

        function handleImageUpload(e) {
            const file = e.target.files[0];
            if (!file || !currentChatId) return;

            const uploadRef = storage.ref(`chat_images/${currentChatId}/${Date.now()}_${file.name}`);
            uploadRef.put(file).then(snapshot => snapshot.ref.getDownloadURL())
                .then(url => {
                    db.ref(`chats/${currentChatId}/messages`).push({
                        senderId: currentUser.uid,
                        imageUrl: url,
                        type: 'image',
                        timestamp: Date.now()
                    });
                });
        }

        // ================== FIXED SHARE LINK ==================
        async function copyShareLink() {
            if (!currentUser) {
                alert("Please login first");
                return;
            }

            const shareLink = `${window.location.origin}${window.location.pathname}?invite=${currentUser.uid}`;

            try {
                await navigator.clipboard.writeText(shareLink);
                alert(`✅ Share link copied successfully!\n\nLink:\n${shareLink}\n\nSend this to your friends so they can join WeatChat!`);
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = shareLink;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert(`✅ Share link copied!\n\n${shareLink}`);
            }
        }

        function showProfileModal() {
            alert("Profile editing coming soon!");
        }

 function listenMessages() {
    if (!currentChatId) return;

    const container = document.getElementById('messages-container');

    // ❌ REMOVE THIS LINE (important)
    // container.innerHTML = "";

    // db.ref(`chats/${currentChatId}/messages`).off();
    messagesRef = db.ref(`chats/${currentChatId}/messages`);

    db.ref(`chats/${currentChatId}/messages`)
    .on('child_added', snapshot => {
        const msg = snapshot.val();

        const div = document.createElement('div');
        div.className = "message-container flex " + 
            (msg.senderId === currentUser.uid ? "justify-end" : "justify-start");

        div.innerHTML = `
            <div class="chat-bubble-${msg.senderId === currentUser.uid ? "sent" : "received"} px-4 py-2">
                ${msg.text ? msg.text : `<img src="${msg.imageUrl}" class="rounded-xl">`}
            </div>
        `;

        container.appendChild(div);

        // 🔥 REAL FIX (no timing issues)
        container.scrollTop = container.scrollHeight;
    });
}


function showProfileModal() {
    document.getElementById("profileModal").classList.remove("hidden");

    document.getElementById("profilePreview").src = currentUser.photoURL;
    document.getElementById("editName").value = currentUser.displayName;
}

function closeProfileModal() {
    document.getElementById("profileModal").classList.add("hidden");
}

function updateName() {
    const newName = document.getElementById("editName").value.trim();

    if (!newName) {
        showCustomPopup("Please enter a name", "error");
        return;
    }

    if (!currentUser) return;

    db.ref("users/" + currentUser.uid).update({
        displayName: newName
    }).then(() => {
        currentUser.displayName = newName;
        
        // Update avatar name if needed
        renderCurrentUserAvatar();
        
        // Show Success Popup
        showCustomPopup(`✅ Name updated successfully!<br><b>${newName}</b>`, "success");
        
        // Auto close profile modal after 1.5 sec
        setTimeout(() => {
            closeProfileModal();
        }, 1800);
    });
}

      // Start the app
function startApp() {
    initializeFirebase();
    
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            
            currentUser = user;
            checkAndSetDisplayName(user);
            
            // Better way: Call after user data is fully loaded
            setTimeout(() => {
                if (currentUser?.uid) {
                    handleInviteLink();
                }
            }, 1800);

        } else {
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('main-app').classList.add('hidden');
        }
    });
}

window.onload = startApp;


        // Handle Invite Link when someone opens shared link
function handleInviteLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteUid = urlParams.get('invite');

    if (inviteUid && currentUser) {
        // Agar current user khud hi apna link khola to ignore
        if (inviteUid === currentUser.uid) return;

        db.ref('users/' + inviteUid).once('value', snapshot => {
            const invitedUser = snapshot.val();
            
            if (invitedUser) {
                // Auto open chat with that user
                openChat(invitedUser);
                
                // Optional: Show nice toast
                showToast(`Opened profile of ${invitedUser.displayName}`);
            }
        });
    }
}

// Simple Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = "fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-2xl z-[99999]";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}


     const GIPHY_API_KEY = "94014f96cc74db1d734668b57c906f3b2d260f4e"; // get from giphy

function openGifPicker() {
    document.getElementById("gifModal").classList.remove("hidden");
}

function closeGifPicker() {
    document.getElementById("gifModal").classList.add("hidden");
}

// search gif
function searchGif() {
    let query = document.getElementById("gifSearch").value;

    fetch(`https://api.giphy.com/v1/gifs/search?q=${query}&api_key=${GIPHY_API_KEY}&limit=10`)
    .then(res => res.json())
    .then(data => {
        let container = document.getElementById("gifResults");
        container.innerHTML = "";

        data.data.forEach(gif => {
            let img = document.createElement("img");
            img.src = gif.images.fixed_height.url;
            img.className = "cursor-pointer rounded-xl";

            img.onclick = () => sendGif(gif.images.fixed_height.url);

            container.appendChild(img);
        });
    });
}

// send gif
function sendGif(url) {
    db.ref(`chats/${currentChatId}/messages`).push({
        senderId: currentUser.uid,
        imageUrl: url,
        type: "gif",
        timestamp: Date.now()
    });

    closeGifPicker();
}




const emojis = ["💬", "🔥", "💔", "✨", "🚀", "😎", "💻", "😘",  "📱", "❤️", "😏", "👀", "🎯",  "🤭", "🧟"];

function createEmoji() {
    const emoji = document.createElement("div");
    emoji.className = "emoji";
    emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];

    emoji.style.left = Math.random() * 100 + "vw";
    emoji.style.fontSize = (20 + Math.random() * 20) + "px";
    emoji.style.animationDuration = (5 + Math.random() * 10) + "s";

    document.getElementById("emoji-bg").appendChild(emoji);

    // remove after animation
    setTimeout(() => {
        emoji.remove();
    }, 15000);
}

// continuously create
setInterval(createEmoji, 800);

// footer 
document.getElementById("year").innerText = new Date().getFullYear();



 
const menuBtn = document.getElementById("menu-btn");
const hamburgerIcon = document.getElementById("hamburger-icon");
const sidebar = document.getElementById("sidebar");
const chatContainer = document.getElementById("chat-container");

// Dragging Variables
let isDragging = false;
let xOffset = 16;
let yOffset = 16;
let initialX = 0;

function openMenu() {
    sidebar.classList.add("active");
    menuBtn.classList.add("active");        // ← Rotation Trigger
    chatContainer.classList.add("hidden");
}

function closeMenu() {
    sidebar.classList.remove("active");
    menuBtn.classList.remove("active");     // ← Reset Rotation
    chatContainer.classList.remove("hidden");
}

// Click Toggle
menuBtn.addEventListener("click", (e) => {
    if (!isDragging) {
        if (sidebar.classList.contains("active")) {
            closeMenu();
        } else {
            openMenu();
        }
    }
});

// ==================== DRAG HAMBURGER ICON ====================
menuBtn.addEventListener("touchstart", dragStart, { passive: true });
menuBtn.addEventListener("mousedown", dragStart);

function dragStart(e) {
    if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
    } else {
        initialX = e.clientX - xOffset;
    }
    isDragging = true;
}

document.addEventListener("touchmove", drag, { passive: false });
document.addEventListener("mousemove", drag);

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    let currentX = (e.type === "touchmove") ? e.touches[0].clientX - initialX : e.clientX - initialX;

    const maxX = window.innerWidth - menuBtn.offsetWidth - 16;
    xOffset = Math.min(Math.max(16, currentX), maxX);

    menuBtn.style.left = xOffset + "px";
    menuBtn.style.top = yOffset + "px";
}

document.addEventListener("touchend", () => { isDragging = false; });
document.addEventListener("mouseup", () => { isDragging = false; });

// Optional: Tap on chat area to close menu
chatContainer.addEventListener("click", () => {
    if (sidebar.classList.contains("active")) closeMenu();
});





 // ================== FIXED & IMPROVED SHARE PROFILE ==================
function showShareModal() {
    if (!currentUser) {
        alert("Please login first!");
        return;
    }

    const modal = document.getElementById("share-modal");
    const linkInput = document.getElementById("share-link-input");

    // Auto Generate Unique Link for every user
    const shareLink = `${window.location.origin}${window.location.pathname}?invite=${currentUser.uid}`;

    linkInput.value = shareLink;
    
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeShareModal() {
    const modal = document.getElementById("share-modal");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

async function copyProfileLink() {
    const linkInput = document.getElementById("share-link-input");
    const copyBtn = document.getElementById("copy-btn");

    try {
        await navigator.clipboard.writeText(linkInput.value);
        
        // Success Animation
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="ri-check-line text-xl"></i><span>Copied!</span>`;
        copyBtn.style.background = "linear-gradient(to right, #22c55e, #86efac)";

        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = "";
        }, 2200);

    } catch (err) {
        alert("Failed to copy");
    }
}




// same username error suggestion 
// Show Custom Popup

function showCustomPopup(message, type = "success") {
    const popup = document.getElementById("custom-popup");
    const content = document.getElementById("popup-content");

    let icon = "";
    if (type === "success") {
        icon = `<i class="ri-check-circle-fill text-5xl text-green-400"></i>`;
    } else if (type === "error") {
        icon = `<i class="ri-error-warning-fill text-5xl text-red-400"></i>`;
    } else if (type === "logout") {
        icon = `<i class="ri-logout-circle-r-line text-5xl text-violet-400"></i>`;
    }

    content.innerHTML = `
        <div class="mb-6">${icon}</div>
        <p class="text-xl font-medium leading-relaxed">${message}</p>
    `;

    popup.classList.remove("hidden");
    popup.classList.add("flex");
}

function closeCustomPopup() {
    const popup = document.getElementById("custom-popup");
    popup.classList.add("hidden");
    popup.classList.remove("flex");
}
