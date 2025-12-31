const mongoose = require('mongoose');
const Student = require('./models/Student');
const Alert = require('./models/Alert');
const User = require('./models/User');
const connectDB = require('./utils/db');
require('dotenv').config();

const courses = ['AI&DS', 'CIVIL', 'CSBS', 'CSE', 'AIML', 'ECE', 'EEE', 'ICE', 'IT', 'MECH', 'MBA'];
const names = [
    "Emma Thompson", "Liam Chen", "Sofia Rodriguez", "Noah Kim", "Olivia Johnson", 
    "Aiden Patel", "Mia Smith", "Lucas Silva", "Isabella Gupta", "Ethan Brown",
    "Ava Martinez", "Mason Lee", "Harper Wilson", "Logan Anderson", "Amelia Taylor"
];

const generateRandomStudent = (id, name, riskProfile) => {
    let attendance, cgpa, feeDelay, participation, assignments;

    if (riskProfile === 'High') {
        attendance = Math.floor(Math.random() * (60 - 30) + 30);
        cgpa = (Math.random() * (5.5 - 2.0) + 2.0).toFixed(1);
        feeDelay = Math.random() > 0.5 ? Math.floor(Math.random() * 60 + 30) : 0;
        participation = Math.floor(Math.random() * 4);
        assignments = Math.floor(Math.random() * 50);
    } else if (riskProfile === 'Medium') {
        attendance = Math.floor(Math.random() * (80 - 60) + 60);
        cgpa = (Math.random() * (7.5 - 5.5) + 5.5).toFixed(1);
        feeDelay = Math.random() > 0.7 ? Math.floor(Math.random() * 20 + 5) : 0;
        participation = Math.floor(Math.random() * (7 - 4) + 4);
        assignments = Math.floor(Math.random() * (80 - 50) + 50);
    } else { // Low
        attendance = Math.floor(Math.random() * (100 - 85) + 85);
        cgpa = (Math.random() * (10.0 - 7.5) + 7.5).toFixed(1);
        feeDelay = 0;
        participation = Math.floor(Math.random() * (11 - 7) + 7);
        assignments = Math.floor(Math.random() * (100 - 85) + 85);
    }

    // Simplified Risk Calc for Seed
    // In real app, we use the ML service. Here we just mock what we expect.
    let riskScore = 0;
    if (riskProfile === 'High') riskScore = 85;
    if (riskProfile === 'Medium') riskScore = 55;
    if (riskProfile === 'Low') riskScore = 15;

    return {
        studentId: `S2024${id.toString().padStart(3, '0')}`,
        name: name,
        email: `${name.toLowerCase().replace(' ', '.')}@university.edu`,
        course: courses[Math.floor(Math.random() * courses.length)],
        enrollmentYear: 2024,
        attendancePercentage: attendance,
        cgpa: Number(cgpa),
        feeDelayDays: feeDelay,
        classParticipationScore: participation,
        assignmentsCompleted: assignments,
        riskScore: riskScore,
        riskLevel: riskProfile,
        riskFactors: riskProfile === 'Low' ? [] : ['Simulated Risk Factor']
    };
};

const seed = async () => {
    await connectDB();
    
    console.log("Clearing existing data...");
    await Student.deleteMany({});
    await Alert.deleteMany({});
    await User.deleteMany({}); 

    console.log("Seeding Users (Admin & Mentors)...");
    const users = [];
    
    // 1. Admin
    const admin = await User.create({
        username: 'admin',
        password: 'admin', // In prod use hash
        role: 'admin',
        name: 'System Admin',
        email: 'admin@university.edu',
        mentorId: 'admin'
    });
    users.push(admin);

    // 2. Mentors
    const mentors = [
        { "name": "Dr. S Ravimaran", "dept": "AI&DS", "id": "M25101", "email": "ravimaran@college.edu" },
        { "name": "Dr. A Belin Jude", "dept": "CIVIL", "id": "M25102", "email": "belinjude@college.edu" },
        { "name": "Dr. S Venkatasubramanian", "dept": "CSBS", "id": "M25103", "email": "venkatasubramanian@college.edu" },
        { "name": "Dr. V Punitha", "dept": "CSE", "id": "M25104", "email": "punitha@college.edu" },
        { "name": "Dr. A Delphin Carolina Rani", "dept": "AIML", "id": "M25105", "email": "delphinrani@college.edu" },
        { "name": "Dr. M Santhi", "dept": "ECE", "id": "M25106", "email": "santhi@college.edu" },
        { "name": "Dr. C Krishnakumar", "dept": "EEE", "id": "M25107", "email": "krishnakumar@college.edu" },
        { "name": "Dr. K Gaayathry", "dept": "ICE", "id": "M25108", "email": "gaayathry@college.edu" },
        { "name": "Dr. R Thillaikarasi", "dept": "IT", "id": "M25109", "email": "thillaikarasi@college.edu" },
        { "name": "Dr. R Rekha", "dept": "MECH", "id": "M25110", "email": "rekha@college.edu" },
        { "name": "Dr. K Karthikeyan", "dept": "MBA", "id": "M25111", "email": "karthikeyan@college.edu" }
    ];

    for (const m of mentors) {
        users.push(await User.create({
            username: m.id,
            password: m.id, // Legacy auth: id=password
            role: 'mentor',
            name: m.name,
            email: m.email,
            mentorId: m.id,
            department: m.dept
        }));
    }

    const customStudents = [
  { "name": "Aarav Kumar", "studentId": "S25101", "email": "aarav.aids@college.edu", "course": "AI&DS", "cgpa": 8.6, "attendancePercentage": 91 },
  { "name": "Arjun Mehta", "studentId": "S25102", "email": "arjun.aids@college.edu", "course": "AI&DS", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Dev Anand", "studentId": "S25103", "email": "dev.aids@college.edu", "course": "AI&DS", "cgpa": 6.9, "attendancePercentage": 76 },
  { "name": "Kavin Raj", "studentId": "S25104", "email": "kavin.aids@college.edu", "course": "AI&DS", "cgpa": 8.3, "attendancePercentage": 90 },
  { "name": "Manoj K", "studentId": "S25105", "email": "manoj.aids@college.edu", "course": "AI&DS", "cgpa": 6.4, "attendancePercentage": 78 },
  { "name": "Nikhil S", "studentId": "S25106", "email": "nikhil.aids@college.edu", "course": "AI&DS", "cgpa": 8.7, "attendancePercentage": 94 },
  { "name": "Pranav R", "studentId": "S25107", "email": "pranav.aids@college.edu", "course": "AI&DS", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Rohit M", "studentId": "S25108", "email": "rohit.aids@college.edu", "course": "AI&DS", "cgpa": 6.7, "attendancePercentage": 72 },
  { "name": "Sanjay V", "studentId": "S25109", "email": "sanjay.aids@college.edu", "course": "AI&DS", "cgpa": 8.4, "attendancePercentage": 92 },
  { "name": "Vignesh P", "studentId": "S25110", "email": "vignesh.aids@college.edu", "course": "AI&DS", "cgpa": 8.2, "attendancePercentage": 89 },

  { "name": "Akash R", "studentId": "S25111", "email": "akash.civil@college.edu", "course": "CIVIL", "cgpa": 7.5, "attendancePercentage": 83 },
  { "name": "Bharath S", "studentId": "S25112", "email": "bharath.civil@college.edu", "course": "CIVIL", "cgpa": 8.0, "attendancePercentage": 88 },
  { "name": "Deepak K", "studentId": "S25113", "email": "deepak.civil@college.edu", "course": "CIVIL", "cgpa": 6.2, "attendancePercentage": 68 },
  { "name": "Gokul P", "studentId": "S25114", "email": "gokul.civil@college.edu", "course": "CIVIL", "cgpa": 8.1, "attendancePercentage": 90 },
  { "name": "Hari V", "studentId": "S25115", "email": "hari.civil@college.edu", "course": "CIVIL", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Karthik M", "studentId": "S25116", "email": "karthik.civil@college.edu", "course": "CIVIL", "cgpa": 8.3, "attendancePercentage": 91 },
  { "name": "Naveen R", "studentId": "S25117", "email": "naveen.civil@college.edu", "course": "CIVIL", "cgpa": 6.8, "attendancePercentage": 74 },
  { "name": "Prakash T", "studentId": "S25118", "email": "prakash.civil@college.edu", "course": "CIVIL", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Suresh D", "studentId": "S25119", "email": "suresh.civil@college.edu", "course": "CIVIL", "cgpa": 7.8, "attendancePercentage": 85 },
  { "name": "Vimal J", "studentId": "S25120", "email": "vimal.civil@college.edu", "course": "CIVIL", "cgpa": 8.0, "attendancePercentage": 87 },

  { "name": "Abhishek R", "studentId": "S25121", "email": "abhishek.csbs@college.edu", "course": "CSBS", "cgpa": 8.4, "attendancePercentage": 92 },
  { "name": "Aravind K", "studentId": "S25122", "email": "aravind.csbs@college.edu", "course": "CSBS", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Balaji M", "studentId": "S25123", "email": "balaji.csbs@college.edu", "course": "CSBS", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Dinesh V", "studentId": "S25124", "email": "dinesh.csbs@college.edu", "course": "CSBS", "cgpa": 6.9, "attendancePercentage": 75 },
  { "name": "Gautham P", "studentId": "S25125", "email": "gautham.csbs@college.edu", "course": "CSBS", "cgpa": 8.5, "attendancePercentage": 93 },
  { "name": "Kishore S", "studentId": "S25126", "email": "kishore.csbs@college.edu", "course": "CSBS", "cgpa": 6.7, "attendancePercentage": 78 },
  { "name": "Madhan R", "studentId": "S25127", "email": "madhan.csbs@college.edu", "course": "CSBS", "cgpa": 8.2, "attendancePercentage": 90 },
  { "name": "Nithin K", "studentId": "S25128", "email": "nithin.csbs@college.edu", "course": "CSBS", "cgpa": 6.3, "attendancePercentage": 70 },
  { "name": "Sathish M", "studentId": "S25129", "email": "sathish.csbs@college.edu", "course": "CSBS", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Vasanth J", "studentId": "S25130", "email": "vasanth.csbs@college.edu", "course": "CSBS", "cgpa": 8.3, "attendancePercentage": 91 },

  { "name": "Ajay R", "studentId": "S25131", "email": "ajay.cse@college.edu", "course": "CSE", "cgpa": 8.6, "attendancePercentage": 93 },
  { "name": "Bala K", "studentId": "S25132", "email": "bala.cse@college.edu", "course": "CSE", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Charan V", "studentId": "S25133", "email": "charan.cse@college.edu", "course": "CSE", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Deepesh M", "studentId": "S25134", "email": "deepesh.cse@college.edu", "course": "CSE", "cgpa": 6.6, "attendancePercentage": 73 },
  { "name": "Girish P", "studentId": "S25135", "email": "girish.cse@college.edu", "course": "CSE", "cgpa": 8.4, "attendancePercentage": 91 },
  { "name": "Kiran S", "studentId": "S25136", "email": "kiran.cse@college.edu", "course": "CSE", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Lokesh R", "studentId": "S25137", "email": "lokesh.cse@college.edu", "course": "CSE", "cgpa": 6.1, "attendancePercentage": 69 },
  { "name": "Naveen T", "studentId": "S25138", "email": "naveen.cse@college.edu", "course": "CSE", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Saran V", "studentId": "S25139", "email": "saran.cse@college.edu", "course": "CSE", "cgpa": 7.8, "attendancePercentage": 85 },
  { "name": "Vijay K", "studentId": "S25140", "email": "vijay.cse@college.edu", "course": "CSE", "cgpa": 8.3, "attendancePercentage": 90 },

  { "name": "Ananya R", "studentId": "S25141", "email": "ananya.aiml@college.edu", "course": "AIML", "cgpa": 8.5, "attendancePercentage": 92 },
  { "name": "Bhavya K", "studentId": "S25142", "email": "bhavya.aiml@college.edu", "course": "AIML", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Divya S", "studentId": "S25143", "email": "divya.aiml@college.edu", "course": "AIML", "cgpa": 6.8, "attendancePercentage": 76 },
  { "name": "Kavya M", "studentId": "S25144", "email": "kavya.aiml@college.edu", "course": "AIML", "cgpa": 8.3, "attendancePercentage": 90 },
  { "name": "Megha P", "studentId": "S25145", "email": "megha.aiml@college.edu", "course": "AIML", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Nandhini V", "studentId": "S25146", "email": "nandhini.aiml@college.edu", "course": "AIML", "cgpa": 8.6, "attendancePercentage": 94 },
  { "name": "Pavithra R", "studentId": "S25147", "email": "pavithra.aiml@college.edu", "course": "AIML", "cgpa": 6.2, "attendancePercentage": 71 },
  { "name": "Revathi T", "studentId": "S25148", "email": "revathi.aiml@college.edu", "course": "AIML", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Swetha K", "studentId": "S25149", "email": "swetha.aiml@college.edu", "course": "AIML", "cgpa": 8.4, "attendancePercentage": 91 },
  { "name": "Yamini J", "studentId": "S25150", "email": "yamini.aiml@college.edu", "course": "AIML", "cgpa": 6.9, "attendancePercentage": 74 },

  { "name": "Arun K", "studentId": "S25151", "email": "arun.ece@college.edu", "course": "ECE", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Bhuvanesh R", "studentId": "S25152", "email": "bhuvanesh.ece@college.edu", "course": "ECE", "cgpa": 7.8, "attendancePercentage": 85 },
  { "name": "Ganesh M", "studentId": "S25153", "email": "ganesh.ece@college.edu", "course": "ECE", "cgpa": 8.3, "attendancePercentage": 91 },
  { "name": "Karthikeyan P", "studentId": "S25154", "email": "karthikeyan.ece@college.edu", "course": "ECE", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Muthukumar S", "studentId": "S25155", "email": "muthukumar.ece@college.edu", "course": "ECE", "cgpa": 6.4, "attendancePercentage": 70 },
  { "name": "Prakash V", "studentId": "S25156", "email": "prakash.ece@college.edu", "course": "ECE", "cgpa": 8.4, "attendancePercentage": 92 },
  { "name": "Ramesh T", "studentId": "S25157", "email": "ramesh.ece@college.edu", "course": "ECE", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Sathya N", "studentId": "S25158", "email": "sathya.ece@college.edu", "course": "ECE", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Surya D", "studentId": "S25159", "email": "surya.ece@college.edu", "course": "ECE", "cgpa": 8.5, "attendancePercentage": 93 },
  { "name": "Vimal R", "studentId": "S25160", "email": "vimal.ece@college.edu", "course": "ECE", "cgpa": 6.8, "attendancePercentage": 77 },

  { "name": "Ajith K", "studentId": "S25161", "email": "ajith.eee@college.edu", "course": "EEE", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Balakrishnan S", "studentId": "S25162", "email": "balakrishnan.eee@college.edu", "course": "EEE", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Chandru M", "studentId": "S25163", "email": "chandru.eee@college.edu", "course": "EEE", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Dhanush R", "studentId": "S25164", "email": "dhanush.eee@college.edu", "course": "EEE", "cgpa": 6.5, "attendancePercentage": 73 },
  { "name": "Gopal P", "studentId": "S25165", "email": "gopal.eee@college.edu", "course": "EEE", "cgpa": 8.4, "attendancePercentage": 91 },
  { "name": "Hariharan V", "studentId": "S25166", "email": "hariharan.eee@college.edu", "course": "EEE", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Manikandan T", "studentId": "S25167", "email": "manikandan.eee@college.edu", "course": "EEE", "cgpa": 6.9, "attendancePercentage": 78 },
  { "name": "Naveen K", "studentId": "S25168", "email": "naveen.eee@college.edu", "course": "EEE", "cgpa": 8.3, "attendancePercentage": 90 },
  { "name": "Ravichandran S", "studentId": "S25169", "email": "ravichandran.eee@college.edu", "course": "EEE", "cgpa": 6.3, "attendancePercentage": 69 },
  { "name": "Senthil M", "studentId": "S25170", "email": "senthil.eee@college.edu", "course": "EEE", "cgpa": 8.5, "attendancePercentage": 94 },

  { "name": "Aravind S", "studentId": "S25171", "email": "aravind.ice@college.edu", "course": "ICE", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Balamurugan K", "studentId": "S25172", "email": "balamurugan.ice@college.edu", "course": "ICE", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Deepan R", "studentId": "S25173", "email": "deepan.ice@college.edu", "course": "ICE", "cgpa": 8.3, "attendancePercentage": 91 },
  { "name": "Kumaravel M", "studentId": "S25174", "email": "kumaravel.ice@college.edu", "course": "ICE", "cgpa": 6.6, "attendancePercentage": 74 },
  { "name": "Mohanraj P", "studentId": "S25175", "email": "mohanraj.ice@college.edu", "course": "ICE", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Pradeep S", "studentId": "S25176", "email": "pradeep.ice@college.edu", "course": "ICE", "cgpa": 8.4, "attendancePercentage": 92 },
  { "name": "Ranjith V", "studentId": "S25177", "email": "ranjith.ice@college.edu", "course": "ICE", "cgpa": 7.8, "attendancePercentage": 85 },
  { "name": "Saravanan K", "studentId": "S25178", "email": "saravanan.ice@college.edu", "course": "ICE", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Sivakumar T", "studentId": "S25179", "email": "sivakumar.ice@college.edu", "course": "ICE", "cgpa": 6.1, "attendancePercentage": 68 },
  { "name": "Vijayalakshmi R", "studentId": "S25180", "email": "vijayalakshmi.ice@college.edu", "course": "ICE", "cgpa": 8.5, "attendancePercentage": 93 },

  { "name": "Anand K", "studentId": "S25181", "email": "anand.it@college.edu", "course": "IT", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Bhuvaneswari M", "studentId": "S25182", "email": "bhuvaneswari.it@college.edu", "course": "IT", "cgpa": 8.4, "attendancePercentage": 91 },
  { "name": "Dinesh R", "studentId": "S25183", "email": "dinesh.it@college.edu", "course": "IT", "cgpa": 7.8, "attendancePercentage": 85 },
  { "name": "Keerthana S", "studentId": "S25184", "email": "keerthana.it@college.edu", "course": "IT", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Logesh P", "studentId": "S25185", "email": "logesh.it@college.edu", "course": "IT", "cgpa": 6.5, "attendancePercentage": 72 },
  { "name": "Monisha V", "studentId": "S25186", "email": "monisha.it@college.edu", "course": "IT", "cgpa": 8.5, "attendancePercentage": 93 },
  { "name": "Praveen T", "studentId": "S25187", "email": "praveen.it@college.edu", "course": "IT", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Sathish K", "studentId": "S25188", "email": "sathish.it@college.edu", "course": "IT", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Sneha R", "studentId": "S25189", "email": "sneha.it@college.edu", "course": "IT", "cgpa": 8.3, "attendancePercentage": 90 },
  { "name": "Vasanth M", "studentId": "S25190", "email": "vasanth.it@college.edu", "course": "IT", "cgpa": 6.2, "attendancePercentage": 69 },

  { "name": "Arunachalam S", "studentId": "S25191", "email": "arunachalam.mech@college.edu", "course": "MECH", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Bharani K", "studentId": "S25192", "email": "bharani.mech@college.edu", "course": "MECH", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Dinesh P", "studentId": "S25193", "email": "dinesh.mech@college.edu", "course": "MECH", "cgpa": 6.4, "attendancePercentage": 71 },
  { "name": "Gokul R", "studentId": "S25194", "email": "gokul.mech@college.edu", "course": "MECH", "cgpa": 8.4, "attendancePercentage": 91 },
  { "name": "Karthik S", "studentId": "S25195", "email": "karthik.mech@college.edu", "course": "MECH", "cgpa": 8.0, "attendancePercentage": 87 },
  { "name": "Madhan V", "studentId": "S25196", "email": "madhan.mech@college.edu", "course": "MECH", "cgpa": 6.9, "attendancePercentage": 78 },
  { "name": "Prabhu T", "studentId": "S25197", "email": "prabhu.mech@college.edu", "course": "MECH", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Raghavan M", "studentId": "S25198", "email": "raghavan.mech@college.edu", "course": "MECH", "cgpa": 6.7, "attendancePercentage": 75 },
  { "name": "Sivaram K", "studentId": "S25199", "email": "sivaram.mech@college.edu", "course": "MECH", "cgpa": 8.3, "attendancePercentage": 90 },
  { "name": "Venkatesh R", "studentId": "S25200", "email": "venkatesh.mech@college.edu", "course": "MECH", "cgpa": 8.5, "attendancePercentage": 94 },

  { "name": "Aishwarya N", "studentId": "S25201", "email": "aishwarya.mba@college.edu", "course": "MBA", "cgpa": 8.6, "attendancePercentage": 93 },
  { "name": "Balaji R", "studentId": "S25202", "email": "balaji.mba@college.edu", "course": "MBA", "cgpa": 8.2, "attendancePercentage": 89 },
  { "name": "Deepika S", "studentId": "S25203", "email": "deepika.mba@college.edu", "course": "MBA", "cgpa": 8.4, "attendancePercentage": 91 },
  { "name": "Kamalraj P", "studentId": "S25204", "email": "kamalraj.mba@college.edu", "course": "MBA", "cgpa": 7.9, "attendancePercentage": 86 },
  { "name": "Lavanya M", "studentId": "S25205", "email": "lavanya.mba@college.edu", "course": "MBA", "cgpa": 8.1, "attendancePercentage": 88 },
  { "name": "Mohan K", "studentId": "S25206", "email": "mohan.mba@college.edu", "course": "MBA", "cgpa": 6.6, "attendancePercentage": 74 },
  { "name": "Priyanka V", "studentId": "S25207", "email": "priyanka.mba@college.edu", "course": "MBA", "cgpa": 8.3, "attendancePercentage": 90 },
  { "name": "Rakesh T", "studentId": "S25208", "email": "rakesh.mba@college.edu", "course": "MBA", "cgpa": 6.2, "attendancePercentage": 70 },
  { "name": "Sowmiya R", "studentId": "S25209", "email": "sowmiya.mba@college.edu", "course": "MBA", "cgpa": 8.5, "attendancePercentage": 92 },
  { "name": "Vignesh K", "studentId": "S25210", "email": "vignesh.mba@college.edu", "course": "MBA", "cgpa": 8.0, "attendancePercentage": 87 }
    ];

    // Import ML Service (Dynamic Requirement)
    const { predictRisk } = require('./utils/mlService');

    const students = [];
    
    for (const data of customStudents) {
        // Calculate dynamic risk using the Unified ML Service
        // This will attempt to hit the Python API if running, or prompt to use JS fallback
        const riskAnalysis = await predictRisk(
             data.attendancePercentage,
             data.cgpa,
             // Fee Delay Logic: High risk profile in mock had 45 fee delay, Low had 0.
             // We can infer fee delay from simple logic for seeding:
             // If low attendance/cgpa, assume high fee delay for realism in dataset
             (data.attendancePercentage < 75 || data.cgpa < 6) ? 45 : 0, 
             (data.attendancePercentage < 75) ? 3 : 8, // Participation
             (data.attendancePercentage < 75) ? 50 : 90 // Assignments
        );

        const riskScore = riskAnalysis.score;
        const riskProfile = riskAnalysis.level;
        const riskFactors = riskAnalysis.factors;

        const studentData = {
           ...data,
           enrollmentYear: 2025,
           feeDelayDays: riskProfile === 'High' ? 45 : 0,
           classParticipationScore: riskProfile === 'High' ? 3 : 8,
           assignmentsCompleted: riskProfile === 'High' ? 50 : 90,
           riskScore,
           riskLevel: riskProfile,
           riskFactors
        };
        
        const student = await Student.create(studentData);
        students.push(student);

        // Student User
        await User.create({
            username: data.studentId,
            password: data.studentId, 
            role: 'student',
            name: data.name,
            email: data.email,
            studentId: data.studentId
        });

        // Parent User
        await User.create({
            username: `p_${data.studentId}`,
            password: `p_${data.studentId}`,
            role: 'parent',
            name: `Parent of ${data.name}`,
            email: `parent.${data.email}`,
            studentId: data.studentId
        });

        if (riskProfile === 'High' || riskProfile === 'Medium') {
             // Create mock alert
            await Alert.create({
                studentId: student._id, 
                studentName: student.name,
                severity: riskProfile,
                message: `Risk Alert: ${riskProfile} Risk detected for ${student.name}`,
                status: 'Active'
            });
        }
    }

    console.log(`✅ Seeded ${students.length} students, corresponding users, and alerts.`);
    process.exit();
};

seed();
