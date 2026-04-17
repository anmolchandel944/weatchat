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
            apiKey: "AIzaSyAIwDDBXWiPEYY8Jrc-zc5VBn7ltzbG70c",
            authDomain: "weatchat-5aab7.firebaseapp.com",
            projectId: "weatchat-5aab7",
            storageBucket: "weatchat-5aab7.firebasestorage.app",
            messagingSenderId: "191457153693",
            appId: "1:191457153693:web:8bce5b0ed3440949507a74"
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

        function logout() {
            if (confirm("Log out of WeatChat?")) {
                auth.signOut().then(() => window.location.reload());
            }
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
            const name = document.getElementById('display-name-input').value.trim();
            if (!name) return alert("Please enter a name");

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
            });
        }

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

    if (!newName) return alert("Enter name");

    db.ref("users/" + currentUser.uid).update({
        displayName: newName
    });

    currentUser.displayName = newName;
    alert("Name updated 😏");
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
                } else {
                    document.getElementById('login-screen').classList.remove('hidden');
                    document.getElementById('main-app').classList.add('hidden');
                }
            });
        }

        window.onload = startApp;



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




const emojis = ["💬", "🔥", "✨", "🚀", "💻", "📱", "❤️", "😏", "👀", "🎯"];

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

