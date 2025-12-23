const fs = require('fs');
const path = require('path');

const studentsPath = path.join(__dirname, '../data/students.json');
const usersPath = path.join(__dirname, '../data/users.json');
const mentorsPath = path.join(__dirname, '../data/mentors.json');

const students = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
let mentors = [];
if (fs.existsSync(mentorsPath)) {
    mentors = JSON.parse(fs.readFileSync(mentorsPath, 'utf8'));
}

const users = [];

// 1. Generate Mentor Users
// If mentors.json exists, use it, otherwise create defaults
if (mentors.length > 0) {
    mentors.forEach((m, idx) => {
        users.push({
            id: `m${idx + 1}`,
            username: m.email.split('@')[0], // e.g. sarah.jones
            password: "password123",
            role: "mentor",
            name: m.name,
            email: m.email
        });
    });
} else {
    users.push({
        id: "m1",
        username: "mentor1",
        password: "password123",
        role: "mentor",
        name: "Sarah Mentor",
        email: "mentor1@example.com"
    });
}

// 2. Generate Student & Parent Users
students.forEach((s, idx) => {
    // Student User
    const firstName = s.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const studentUsername = `${firstName}${s.studentId.slice(-3)}`; 
    const studentPassword = `${firstName}@123`; // Unique password: name@123

    users.push({
        id: `u_s_${s._id}`,
        username: studentUsername,
        password: studentPassword, 
        role: "student",
        studentId: s.studentId, 
        name: s.name,
        email: s.email
    });

    // Parent User
    const parentUsername = `p_${firstName}${s.studentId.slice(-3)}`;
    const parentPassword = `parent@${firstName}`; // Unique parent password

    users.push({
        id: `u_p_${s._id}`,
        username: parentUsername,
        password: parentPassword,
        role: "parent",
        studentId: s.studentId, 
        name: `Parent of ${s.name}`,
        email: `parent.${s.email}`
    });
});

fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

console.log(`Successfully generated ${users.length} users with UNIQUE passwords.`);
console.log("------------------------------------------------");
console.log("SAMPLE CREDENTIALS:");
console.log(`Mentor:  ${users[0].username}  /  password123`);
console.log(`Student: ${users[users.length-2].username}  /  ${users[users.length-2].password}`);
console.log(`Parent:  ${users[users.length-1].username}  /  ${users[users.length-1].password}`);
console.log("------------------------------------------------");
