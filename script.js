document.addEventListener('DOMContentLoaded', () => {
    // --- Data Storage (using localStorage) ---
    const getStoredData = (key, defaultValue) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    };

    const setStoredData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    let availableSubjects = getStoredData('availableSubjects', [
        { code: 'ส21103', name: 'สังคมศึกษา', credits: 1.0, teacher: 'ครูกวิสรา' },
        { code: 'ค20212', name: 'คณิตศาสตร์พื้นฐาน', credits: 1.5, teacher: 'ครูนิตานันท' },
        { code: 'อ21102', name: 'ภาษาอังกฤษ', credits: 1.0, teacher: 'ครูมุกตา' },
        { code: 'ท21102', name: 'ภาษาไทย', credits: 1.0, teacher: 'ครูปานหทัย' },
        { code: 'ว21102', name: 'วิทยาศาสตร์', credits: 1.5, teacher: 'ครูวนิดา' },
        { code: 'พ21104', name: 'สุขศึกษาและพลศึกษา', credits: 0.5, teacher: 'ครูคมกฤช' },
        { code: 'ศ21103', name: 'ทัศนศิลป์', credits: 0.5, teacher: 'ครูกรรณิการ์' },
        { code: 'EN20222', name: 'ภาษาอังกฤษเชิงวิชาการ', credits: 1.0, teacher: 'ครูNew' },
    ]);

    let selectedSubjects = getStoredData('selectedSubjects', []);
    let assignments = getStoredData('assignments', []); // { id, subjectCode, name, dueDate, description, completed }
    let subjectScores = getStoredData('subjectScores', {}); // { subjectCode: [{ name: 'Midterm', score: 85 }, { name: 'Final', score: 90 }], ... }

    // --- DOM Elements ---
    const navLinks = document.querySelectorAll('nav a');
    const contentSections = document.querySelectorAll('.content-section');

    // Dashboard elements
    const totalAssignmentsDisplay = document.getElementById('total-assignments');
    const pendingAssignmentsDisplay = document.getElementById('pending-assignments');
    const registeredSubjectsDisplay = document.getElementById('registered-subjects');
    const gpaDisplay = document.getElementById('gpa-display');
    const upcomingAssignmentsList = document.getElementById('upcoming-assignments-list');

    // Assignment elements
    const assignmentForm = document.getElementById('assignment-form');
    const assignmentSubjectSelect = document.getElementById('assignment-subject');
    const assignmentNameInput = document.getElementById('assignment-name');
    const assignmentDueDateInput = document.getElementById('assignment-due-date');
    const assignmentDescriptionTextarea = document.getElementById('assignment-description');
    const assignmentsList = document.getElementById('assignments-list');

    // Subject elements
    const availableSubjectsDiv = document.getElementById('available-subjects');
    const selectedSubjectsDiv = document.getElementById('selected-subjects');

    // Grades elements
    const scoreForm = document.getElementById('score-form');
    const scoreSubjectSelect = document.getElementById('score-subject');
    const scoreInputsContainer = document.getElementById('score-inputs-container');
    const addScoreItemBtn = document.getElementById('add-score-item');
    const summaryGpaDisplay = document.getElementById('summary-gpa');
    const gpaTableContainer = document.getElementById('gpa-table-container');
    const subjectGradesDetail = document.getElementById('subject-grades-detail');

    // --- Helper Functions ---

    // Function to calculate letter grade
    const calculateLetterGrade = (score) => {
        if (score >= 80) return 'A';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 55) return 'D+';
        if (score >= 50) return 'D';
        return 'F';
    };

    // Function to get grade point
    const getGradePoint = (grade) => {
        switch (grade) {
            case 'A': return 4.0;
            case 'B+': return 3.5;
            case 'B': return 3.0;
            case 'C+': return 2.5;
            case 'C': return 2.0;
            case 'D+': return 1.5;
            case 'D': return 1.0;
            case 'F': return 0.0;
            default: return 0.0;
        }
    };

    // --- Navigation ---
    const showSection = (sectionId) => {
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        navLinks.forEach(link => {
            link.classList.remove('active-nav');
            if (link.dataset.section === sectionId) {
                link.classList.add('active-nav');
            }
        });

        // Re-render content specific to the section being shown
        if (sectionId === 'dashboard') {
            renderDashboard();
        } else if (sectionId === 'assignments') {
            renderAssignmentList();
            populateAssignmentSubjectSelect();
        } else if (sectionId === 'subjects') {
            renderSubjectLists();
        } else if (sectionId === 'grades') {
            populateScoreSubjectSelect();
            renderGradesSummary();
            renderSubjectGradesDetail();
        }
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(e.target.dataset.section);
        });
    });

    // Default to dashboard
    showSection('dashboard');

    // --- Dashboard Functions ---
    const renderDashboard = () => {
        const pending = assignments.filter(a => !a.completed).length;
        const total = assignments.length;

        totalAssignmentsDisplay.textContent = total;
        pendingAssignmentsDisplay.textContent = pending;
        registeredSubjectsDisplay.textContent = selectedSubjects.length;

        // Upcoming assignments (next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcoming = assignments.filter(a =>
            !a.completed && new Date(a.dueDate) >= today && new Date(a.dueDate) <= nextWeek
        ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        upcomingAssignmentsList.innerHTML = '';
        if (upcoming.length === 0) {
            upcomingAssignmentsList.innerHTML = '<li>ไม่มีงานค้างในช่วง 7 วันนี้</li>';
        } else {
            upcoming.forEach(assignment => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${assignment.subjectCode}: ${assignment.name}</strong> (กำหนดส่ง: ${assignment.dueDate})`;
                upcomingAssignmentsList.appendChild(li);
            });
        }

        calculateGPA(); // Update GPA on dashboard
    };

    // --- Assignment Functions ---
    const populateAssignmentSubjectSelect = () => {
        assignmentSubjectSelect.innerHTML = '<option value="">-- เลือกวิชา --</option>';
        selectedSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.code;
            option.textContent = `${subject.code} - ${subject.name}`;
            assignmentSubjectSelect.appendChild(option);
        });
    };

    assignmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newAssignment = {
            id: Date.now(),
            subjectCode: assignmentSubjectSelect.value,
            name: assignmentNameInput.value,
            dueDate: assignmentDueDateInput.value,
            description: assignmentDescriptionTextarea.value,
            completed: false
        };
        assignments.push(newAssignment);
        setStoredData('assignments', assignments);
        assignmentForm.reset();
        renderAssignmentList();
        renderDashboard(); // Update dashboard after adding assignment
        alert('เพิ่มงานค้างเรียบร้อยแล้ว!');
    });

    const renderAssignmentList = () => {
        assignmentsList.innerHTML = '';
        if (assignments.length === 0) {
            assignmentsList.innerHTML = '<li>ไม่มีงานค้าง</li>';
            return;
        }

        // Sort by due date, then by completion status
        const sortedAssignments = [...assignments].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1; // Incomplete first
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        sortedAssignments.forEach(assignment => {
            const li = document.createElement('li');
            li.classList.add(assignment.completed ? 'completed' : '');
            const subject = availableSubjects.find(s => s.code === assignment.subjectCode);
            const subjectName = subject ? subject.name : assignment.subjectCode;

            li.innerHTML = `
                <div>
                    <strong>${subjectName}: ${assignment.name}</strong><br>
                    <small>กำหนดส่ง: ${assignment.dueDate}</small>
                    ${assignment.description ? `<p>${assignment.description}</p>` : ''}
                </div>
                <div>
                    <button class="btn complete ${assignment.completed ? 'secondary' : ''}" data-id="${assignment.id}">
                        ${assignment.completed ? 'ยกเลิกเสร็จสิ้น' : 'ทำเครื่องหมายว่าเสร็จ'}
                    </button>
                    <button class="btn delete" data-id="${assignment.id}">ลบ</button>
                </div>
            `;
            assignmentsList.appendChild(li);
        });
    };

    assignmentsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete')) {
            const id = parseInt(e.target.dataset.id);
            assignments = assignments.filter(a => a.id !== id);
            setStoredData('assignments', assignments);
            renderAssignmentList();
            renderDashboard();
            alert('ลบงานค้างแล้ว!');
        } else if (e.target.classList.contains('complete')) {
            const id = parseInt(e.target.dataset.id);
            const assignment = assignments.find(a => a.id === id);
            if (assignment) {
                assignment.completed = !assignment.completed;
                setStoredData('assignments', assignments);
                renderAssignmentList();
                renderDashboard();
                alert(`งานถูกทำเครื่องหมายว่า ${assignment.completed ? 'เสร็จสิ้น' : 'ยังไม่เสร็จ'}!`);
            }
        }
    });

    // --- Subject Functions ---
    const renderSubjectLists = () => {
        availableSubjectsDiv.innerHTML = '<h4>วิชาที่สามารถลงทะเบียนได้</h4><ul></ul>';
        selectedSubjectsDiv.innerHTML = '<h4>วิชาที่ลงทะเบียนแล้ว</h4><ul></ul>';

        const availableUl = availableSubjectsDiv.querySelector('ul');
        const selectedUl = selectedSubjectsDiv.querySelector('ul');

        // Filter out subjects already selected
        const remainingAvailableSubjects = availableSubjects.filter(
            subj => !selectedSubjects.some(s => s.code === subj.code)
        );

        remainingAvailableSubjects.forEach(subject => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${subject.code} - ${subject.name} (${subject.credits} หน่วยกิต)</span>
                <button class="btn primary" data-code="${subject.code}" data-action="add">ลงทะเบียน</button>
            `;
            availableUl.appendChild(li);
        });

        if (remainingAvailableSubjects.length === 0) {
            availableUl.innerHTML = '<li>ไม่มีวิชาให้ลงทะเบียนเพิ่ม</li>';
        }

        selectedSubjects.forEach(subject => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${subject.code} - ${subject.name} (${subject.credits} หน่วยกิต)</span>
                <button class="btn delete" data-code="${subject.code}" data-action="remove">ถอนรายวิชา</button>
            `;
            selectedUl.appendChild(li);
        });

        if (selectedSubjects.length === 0) {
            selectedUl.innerHTML = '<li>ยังไม่มีวิชาที่ลงทะเบียน</li>';
        }

        // Add event listeners for buttons
        availableSubjectsDiv.addEventListener('click', handleSubjectAction);
        selectedSubjectsDiv.addEventListener('click', handleSubjectAction);
    };

    const handleSubjectAction = (e) => {
        if (e.target.tagName === 'BUTTON') {
            const code = e.target.dataset.code;
            const action = e.target.dataset.action;
            const subject = availableSubjects.find(s => s.code === code);

            if (!subject) return;

            if (action === 'add') {
                selectedSubjects.push(subject);
                setStoredData('selectedSubjects', selectedSubjects);
                alert(`ลงทะเบียนวิชา ${subject.name} เรียบร้อยแล้ว!`);
            } else if (action === 'remove') {
                selectedSubjects = selectedSubjects.filter(s => s.code !== code);
                // Also remove scores associated with this subject
                delete subjectScores[code];
                setStoredData('selectedSubjects', selectedSubjects);
                setStoredData('subjectScores', subjectScores);
                alert(`ถอนรายวิชา ${subject.name} เรียบร้อยแล้ว!`);
            }
            renderSubjectLists();
            renderDashboard();
            populateAssignmentSubjectSelect(); // Update assignment subject dropdown
            populateScoreSubjectSelect(); // Update score subject dropdown
        }
    };

    // --- Grades Functions ---
    const populateScoreSubjectSelect = () => {
        scoreSubjectSelect.innerHTML = '<option value="">-- เลือกวิชาที่ลงทะเบียนแล้ว --</option>';
        selectedSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.code;
            option.textContent = `${subject.code} - ${subject.name}`;
            scoreSubjectSelect.appendChild(option);
        });
    };

    const addScoreInputField = (scoreName = '', scoreValue = '') => {
        const div = document.createElement('div');
        div.classList.add('score-input-group');
        div.innerHTML = `
            <label>รายการคะแนน:</label>
            <input type="text" class="score-item-name" placeholder="เช่น กลางภาค" value="${scoreName}" required>
            <label>คะแนนที่ได้:</label>
            <input type="number" class="score-item-value" min="0" max="100" value="${scoreValue}" required>
            <button type="button" class="btn delete-score-item">X</button>
        `;
        scoreInputsContainer.appendChild(div);
    };

    addScoreItemBtn.addEventListener('click', () => addScoreInputField());

    scoreInputsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-score-item')) {
            e.target.closest('.score-input-group').remove();
        }
    });

    scoreForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const subjectCode = scoreSubjectSelect.value;
        if (!subjectCode) {
            alert('กรุณาเลือกวิชา');
            return;
        }

        const scores = [];
        const scoreItemNames = scoreInputsContainer.querySelectorAll('.score-item-name');
        const scoreItemValues = scoreInputsContainer.querySelectorAll('.score-item-value');

        for (let i = 0; i < scoreItemNames.length; i++) {
            const name = scoreItemNames[i].value.trim();
            const value = parseFloat(scoreItemValues[i].value);
            if (name && !isNaN(value) && value >= 0 && value <= 100) {
                scores.push({ name, score: value });
            } else {
                alert('กรุณากรอกชื่อรายการคะแนนและคะแนนที่ถูกต้อง (0-100)');
                return;
            }
        }

        subjectScores[subjectCode] = scores;
        setStoredData('subjectScores', subjectScores);
        alert(`บันทึกคะแนนสำหรับวิชา ${subjectCode} เรียบร้อยแล้ว!`);
        renderGradesSummary();
        renderSubjectGradesDetail();
        renderDashboard(); // Update GPA on dashboard
    });

    scoreSubjectSelect.addEventListener('change', () => {
        const subjectCode = scoreSubjectSelect.value;
        scoreInputsContainer.innerHTML = ''; // Clear previous inputs

        if (subjectCode && subjectScores[subjectCode] && subjectScores[subjectCode].length > 0) {
            subjectScores[subjectCode].forEach(scoreItem => {
                addScoreInputField(scoreItem.name, scoreItem.score);
            });
        } else {
            addScoreInputField(); // Add a default empty one if no existing scores or new subject
        }
    });


    const calculateGPA = () => {
        let totalGradePoints = 0;
        let totalCredits = 0;

        selectedSubjects.forEach(subject => {
            const scores = subjectScores[subject.code] || [];
            if (scores.length > 0) {
                // For simplicity, let's just average the scores to get a final subject score
                const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
                const averageScore = totalScore / scores.length;
                const grade = calculateLetterGrade(averageScore);
                const gradePoint = getGradePoint(grade);

                totalGradePoints += gradePoint * subject.credits;
                totalCredits += subject.credits;
            }
        });

        const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
        gpaDisplay.textContent = gpa;
        summaryGpaDisplay.textContent = gpa;
        return gpa;
    };

    const renderGradesSummary = () => {
        const gpa = calculateGPA();
        summaryGpaDisplay.textContent = gpa;

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>รหัสวิชา</th>
                        <th>ชื่อวิชา</th>
                        <th>หน่วยกิต</th>
                        <th>คะแนนเฉลี่ย</th>
                        <th>เกรด</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (selectedSubjects.length === 0) {
            tableHTML += `<tr><td colspan="5">ยังไม่มีวิชาที่ลงทะเบียน</td></tr>`;
        } else {
            selectedSubjects.forEach(subject => {
                const scores = subjectScores[subject.code] || [];
                let averageScore = 'N/A';
                let grade = 'N/A';
                if (scores.length > 0) {
                    const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
                    averageScore = (totalScore / scores.length).toFixed(2);
                    grade = calculateLetterGrade(parseFloat(averageScore));
                }
                tableHTML += `
                    <tr>
                        <td>${subject.code}</td>
                        <td>${subject.name}</td>
                        <td>${subject.credits}</td>
                        <td>${averageScore}</td>
                        <td>${grade}</td>
                    </tr>
                `;
            });
        }

        tableHTML += `
                </tbody>
            </table>
        `;
        gpaTableContainer.innerHTML = tableHTML;
    };


    const renderSubjectGradesDetail = () => {
        subjectGradesDetail.innerHTML = '';
        if (selectedSubjects.length === 0) {
            subjectGradesDetail.innerHTML = '<p>ยังไม่มีวิชาที่ลงทะเบียนเพื่อแสดงรายละเอียดคะแนน</p>';
            return;
        });
