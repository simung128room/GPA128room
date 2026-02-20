import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB7Fl1Rx76SUj7ghBD3DyVEFaN00Db4RYk",
    authDomain: "niopq-63e4e.firebaseapp.com",
    projectId: "niopq-63e4e",
    databaseURL: "https://niopq-63e4e-default-rtdb.firebaseio.com/",
    storageBucket: "niopq-63e4e.firebasestorage.app",
    messagingSenderId: "916346045665",
    appId: "1:916346045665:web:f569dc874af0ce9ba7a3a0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// กำหนด Google Client ID ที่คุณให้มา
provider.setCustomParameters({
    'client_id': '916346045665-pin7klmphmfgodsb37obe1ko2e6lmbml.apps.googleusercontent.com'
});

// 2. Authentication Logic
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('app-ui').style.display = 'flex';
        document.getElementById('display-name').innerText = user.displayName || user.phoneNumber;
        document.getElementById('display-pic').src = user.photoURL || 'https://via.placeholder.com/50';
        initTimetableFeatures();
    } else {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('app-ui').style.display = 'none';
    }
});

// ล็อคอินด้วย Google
document.getElementById('google-login-btn').onclick = () => signInWithRedirect(auth, provider);

// ล็อคอินด้วยเบอร์โทร (Phone OTP)
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
document.getElementById('send-otp-btn').onclick = async () => {
    const phone = document.getElementById('phone-number').value;
    try {
        const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
        const code = prompt("กรุณาใส่รหัส OTP 6 หลักที่ได้รับ (หรือ 123456 สำหรับเบอร์เทส):");
        if (code) await result.confirm(code);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
};

// 3. ระบบจัดการงานค้าง (อิงตารางเรียน ม.1/6)
function initTimetableFeatures() {
    const taskRef = ref(db, 'tasks');
    
    document.getElementById('add-task-btn').onclick = () => {
        const sub = document.getElementById('task-subject').value;
        const msg = document.getElementById('task-input').value;
        if(msg) push(taskRef, { subject: sub, task: msg, time: Date.now() });
    };

    onValue(taskRef, (snap) => {
        const list = document.getElementById('task-list');
        list.innerHTML = "";
        snap.forEach((child) => {
            const data = child.val();
            list.innerHTML += `<li><b>[${data.subject}]</b> ${data.task}</li>`;
        });
    });

    // สร้างวิชาสำหรับคำนวณเกรด (ดึงจากรูปตารางเรียน)
    const subjects = [
        { id: 'S21103', name: 'ส21103 สังคมศึกษา', cr: 1.0 },
        { id: 'K20212', name: 'ค20212 คณิตฯ เพิ่ม', cr: 1.0 },
        { id: 'V21102', name: 'ว21102 วิทยาศาสตร์', cr: 1.5 },
        { id: 'T21102', name: 'ท21102 ภาษาไทย', cr: 1.0 }
    ];

    const gradeContainer = document.getElementById('grade-inputs-container');
    gradeContainer.innerHTML = subjects.map(s => `
        <div class="grade-row">
            <span>${s.name}</span>
            <input type="number" class="grade-input" data-credit="${s.cr}" placeholder="คะแนน 0-100">
        </div>
    `).join('');
}

// 4. Tab Switching Logic
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = (e) => {
        const tabId = e.currentTarget.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
    };
});

// ออกจากระบบ
document.getElementById('logout-btn').onclick = () => signOut(auth);
document.getElementById('profile-trigger').onclick = () => document.getElementById('profile-modal').showModal();
document.getElementById('close-modal').onclick = () => document.getElementById('profile-modal').close();
