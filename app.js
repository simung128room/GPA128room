import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, 
    updateProfile, RecaptchaVerifier, signInWithPhoneNumber, signOut,
    createUserWithEmailAndPassword, signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onChildAdded } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB7Fl1Rx76SUj7ghBD3DyVEFaN00Db4RYk",
    authDomain: "niopq-63e4e.firebaseapp.com",
    projectId: "niopq-63e4e",
    storageBucket: "niopq-63e4e.firebasestorage.app",
    messagingSenderId: "916346045665",
    appId: "1:916346045665:web:f569dc874af0ce9ba7a3a0",
    databaseURL: "https://niopq-63e4e-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const loginPage = document.getElementById('login-page');
const appUi = document.getElementById('app-ui');
const profileModal = document.getElementById('profileModal');

// --- 1. จัดการสถานะ User ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginPage.style.display = 'none';
        appUi.style.display = 'flex';
        document.getElementById('user-name').innerText = user.displayName || "นักเรียน 1/6";
        document.getElementById('user-pic').src = user.photoURL || "https://img5.pic.in.th/file/secure-sv1/IMG_4348aa10cad205e09096.png";
        
        // เซ็ตค่าลงใน Modal
        document.getElementById('edit-name').value = user.displayName || "";
        document.getElementById('edit-pic').value = user.photoURL || "";
    } else {
        loginPage.style.display = 'flex';
        appUi.style.display = 'none';
    }
});

// --- 2. ระบบ Login ---
// Google Login
document.getElementById('google-login').addEventListener('click', () => {
    signInWithRedirect(auth, provider);
});

// Phone Login (แก้ไขเพิ่มการล็อค +66)
try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
    document.getElementById('phone-login').addEventListener('click', async () => {
        let phoneInput = document.getElementById('phone-input').value.trim();
        if (!phoneInput) return alert("กรุณาใส่เบอร์โทรศัพท์");
        
        // แปลงเบอร์: ตัดเลข 0 ตัวหน้าสุดออกถ้ามี แล้วเติม +66
        if (phoneInput.startsWith('0')) phoneInput = phoneInput.substring(1);
        const finalPhoneNumber = "+66" + phoneInput;

        try {
            const confirmationResult = await signInWithPhoneNumber(auth, finalPhoneNumber, window.recaptchaVerifier);
            const code = prompt("ใส่รหัส OTP 6 หลักที่ได้รับทาง SMS:");
            if (code) await confirmationResult.confirm(code);
        } catch (error) {
            console.error("Phone Auth Error:", error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    });
} catch (error) {
    console.error("Recaptcha Setup Error:", error);
}

// Email/Password Auth (เพิ่มใหม่)
document.getElementById('email-register').addEventListener('click', () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;
    if(email && pass.length >= 6) {
        createUserWithEmailAndPassword(auth, email, pass)
            .then(() => alert("สมัครสมาชิกสำเร็จ!"))
            .catch(err => alert("ข้อผิดพลาด: " + err.message));
    } else {
        alert("กรุณากรอกอีเมลและรหัสผ่าน (6 ตัวอักษรขึ้นไป)");
    }
});

document.getElementById('email-login').addEventListener('click', () => {
    const email = document.getElementById('email-input').value;
    const pass = document.getElementById('password-input').value;
    if(email && pass) {
        signInWithEmailAndPassword(auth, email, pass)
            .catch(err => alert("ข้อผิดพลาด: เข้าสู่ระบบไม่สำเร็จ ตรวจสอบข้อมูลอีกครั้ง"));
    }
});

// --- 3. ระบบจัดการหน้าต่างโปรไฟล์ ---
document.getElementById('open-profile-btn').addEventListener('click', () => profileModal.showModal());
document.getElementById('close-profile-btn').addEventListener('click', () => profileModal.close());

document.getElementById('save-profile-btn').addEventListener('click', () => {
    if(!auth.currentUser) return;
    updateProfile(auth.currentUser, {
        displayName: document.getElementById('edit-name').value,
        photoURL: document.getElementById('edit-pic').value
    }).then(() => location.reload());
});

document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth).then(() => profileModal.close());
});

// --- 4. ระบบงานที่ได้รับมอบหมาย ---
document.getElementById('add-task-btn').addEventListener('click', () => {
    const subject = document.getElementById('task-subject').value;
    const desc = document.getElementById('task-desc').value;
    if(desc && auth.currentUser) {
        push(ref(db, 'tasks'), { subject, desc, user: auth.currentUser.displayName || "ไม่ระบุชื่อ" });
        document.getElementById('task-desc').value = '';
    }
});

onChildAdded(ref(db, 'tasks'), (snap) => {
    const data = snap.val();
    const div = document.createElement('div');
    div.className = 'task-row';
    div.innerHTML = `<span><b>${data.subject}</b>: ${data.desc}</span> <button style="color:red; border:none; background:none; cursor:pointer;" onclick="this.parentElement.remove()">ลบ</button>`;
    document.getElementById('task-list-container').appendChild(div);
});

// --- 5. ระบบคำนวณเกรด ---
const subjects = [
    {id: 'math', name: 'ค20212 คณิตศาสตร์', credit: 1.0},
    {id: 'sci', name: 'ว21102 วิทยาศาสตร์', credit: 1.5},
    {id: 'eng', name: 'อ21102 ภาษาอังกฤษ', credit: 1.0},
    {id: 'thai', name: 'ท21102 ภาษาไทย', credit: 1.0},
    {id: 'soc', name: 'ส21103 สังคมศึกษา', credit: 1.0}
];

const gradeDiv = document.getElementById('grade-list');
subjects.forEach(s => {
    gradeDiv.innerHTML += `
        <div style="margin-bottom:10px;">
            <label style="font-size:12px;">${s.name} (${s.credit} นก.)</label>
            <input type="number" class="score-input" data-credit="${s.credit}" placeholder="คะแนน 0-100">
        </div>
    `;
});

document.getElementById('calc-gpa-btn').addEventListener('click', () => {
    let totalPoint = 0, totalCredit = 0;
    document.querySelectorAll('.score-input').forEach(input => {
        const score = parseFloat(input.value) || 0;
        const credit = parseFloat(input.dataset.credit);
        let grade = 0;
        if(score >= 80) grade = 4;
        else if(score >= 75) grade = 3.5;
        else if(score >= 70) grade = 3;
        else if(score >= 65) grade = 2.5;
        else if(score >= 60) grade = 2;
        else if(score >= 55) grade = 1.5;
        else if(score >= 50) grade = 1;
        totalPoint += grade * credit;
        totalCredit += credit;
    });
    const gpa = totalCredit > 0 ? (totalPoint / totalCredit).toFixed(2) : "0.00";
    document.getElementById('gpa-display').innerText = gpa;
});

// --- 6. ระบบห้องแชท ---
document.getElementById('send-btn').addEventListener('click', () => {
    const msg = document.getElementById('chat-input').value;
    if(msg && auth.currentUser) {
        push(ref(db, 'chats'), { user: auth.currentUser.displayName || "ไม่ระบุชื่อ", text: msg });
        document.getElementById('chat-input').value = '';
    }
});

onChildAdded(ref(db, 'chats'), (snap) => {
    const data = snap.val();
    const div = document.createElement('div');
    div.innerHTML = `<p style="font-size:14px; margin-bottom:5px;"><b>${data.user}:</b> ${data.text}</p>`;
    const container = document.getElementById('chat-messages');
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
});

// --- 7. Tabs Logic ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-view').forEach(t => t.style.display = 'none');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const target = e.currentTarget.getAttribute('data-target');
        document.getElementById('section-' + target).style.display = 'block';
        e.currentTarget.classList.add('active');
    });
});
