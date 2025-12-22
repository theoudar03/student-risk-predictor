const fs = require('fs');
const path = require('path');
const { predictRisk } = require('./utils/mlService');

const STUDENTS_FILE = path.join(__dirname, 'data/students.json');
const ALERTS_FILE = path.join(__dirname, 'data/alerts.json');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Kaggle-inspired synthetic dataset
// Mix of distributions: 
// - 10% High Risk (Critical)
// - 20% Medium Risk 
// - 70% Low Risk (Safe)

const courses = ['Computer Science', 'Data Science', 'Mechanical Eng.', 'Psychology', 'Business Admin', 'Bio-Tech'];
const names = [
    "Emma Thompson", "Liam Chen", "Sofia Rodriguez", "Noah Kim", "Olivia Johnson", 
    "Aiden Patel", "Mia Smith", "Lucas Silva", "Isabella Gupta", "Ethan Brown",
    "Ava Martinez", "Mason Lee", "Harper Wilson", "Logan Anderson", "Amelia Taylor",
    "James Thomas", "Elizabeth Jackson", "Benjamin White", "Charlotte Harris", "Henry Martin",
    "Alexander Thompson", "Daniel Garcia", "Matthew Robinson", "Joseph Clark", "Samuel Lewis",
    "David Walker", "John Hall", "Ryan Allen", "Jacob Young", "Michael King"
];

const generateRandomStudent = (id, name, riskProfile) => {
    let attendance, cgpa, feeDelay, participation, assignments;

    if (riskProfile === 'High') {
        attendance = Math.floor(Math.random() * (60 - 30) + 30); // 30-60%
        cgpa = (Math.random() * (5.5 - 2.0) + 2.0).toFixed(1); // 2.0-5.5
        feeDelay = Math.random() > 0.5 ? Math.floor(Math.random() * 60 + 30) : 0; // High fees or none
        participation = Math.floor(Math.random() * 4); // 0-3
        assignments = Math.floor(Math.random() * 50); // 0-50%
    } else if (riskProfile === 'Medium') {
        attendance = Math.floor(Math.random() * (80 - 60) + 60); // 60-80%
        cgpa = (Math.random() * (7.5 - 5.5) + 5.5).toFixed(1); // 5.5-7.5
        feeDelay = Math.random() > 0.7 ? Math.floor(Math.random() * 20 + 5) : 0;
        participation = Math.floor(Math.random() * (7 - 4) + 4); // 4-6
        assignments = Math.floor(Math.random() * (80 - 50) + 50); // 50-80%
    } else { // Low
        attendance = Math.floor(Math.random() * (100 - 85) + 85); // 85-100%
        cgpa = (Math.random() * (10.0 - 7.5) + 7.5).toFixed(1); // 7.5-10.0
        feeDelay = 0;
        participation = Math.floor(Math.random() * (11 - 7) + 7); // 7-10
        assignments = Math.floor(Math.random() * (100 - 85) + 85); // 85-100%
    }

    // Run through ML Service to get consistent risk score
    const analysis = predictRisk(attendance, Number(cgpa), feeDelay, participation, assignments);

    return {
        _id: id.toString(),
        studentId: `S2024${id.toString().padStart(3, '0')}`,
        name: name,
        email: `${name.toLowerCase().replace(' ', '.')}@university.edu`,
        course: courses[Math.floor(Math.random() * courses.length)],
        enrollmentYear: 2023,
        attendancePercentage: attendance,
        cgpa: Number(cgpa),
        feeDelayDays: feeDelay,
        classParticipationScore: participation,
        assignmentsCompleted: assignments,
        riskScore: analysis.score,
        riskLevel: analysis.level,
        riskFactors: analysis.factors,
        createdAt: new Date().toISOString()
    };
};

const seed = () => {
    const students = [];
    const alerts = [];

    names.forEach((name, index) => {
        // Distribute risk: First 4 High, next 8 Medium, rest Low
        let profile = 'Low';
        if (index < 4) profile = 'High';
        else if (index < 12) profile = 'Medium';
        
        const student = generateRandomStudent(index + 101, name, profile);
        students.push(student);

        if (student.riskLevel === 'High') {
            alerts.push({
                _id: `ALT${Date.now()}${index}`,
                studentId: student._id,
                studentName: student.name,
                severity: 'High',
                message: `Critical Dropout Risk detected (${student.riskScore}/100). Primary factor: ${student.riskFactors[0] || 'Multiple metrics low'}.`,
                status: 'Active',
                date: new Date().toISOString()
            });
        }
    });

    // Write to files
    try {
        fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
        fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
        console.log(`✅ Successfully seeded ${students.length} students and ${alerts.length} alerts.`);
    } catch (err) {
        console.error('Error writing data:', err);
    }
};

seed();
