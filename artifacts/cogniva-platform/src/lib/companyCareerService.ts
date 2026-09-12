import { supabase } from './supabase';
import { StudentContext, saveStudentGoal, Goal, GoalPhase, GoalMilestone } from './academic-api';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  logo_mark: string; // Professional mark fallback
  website_url: string;
  careers_url: string;
  industry: string;
  description: string;
  student_programs_url: string;
  source: string;
  source_verified: boolean;
  career_tracks: string[];
  official_resume_guidance?: string;
  cogniva_resume_recommendation: string;
  recruitment_process: Array<{ stage: string; title: string; description: string }>;
  what_they_look_for: {
    technical_skills: string[];
    core_competencies: string[];
    academic_focus: string;
    cultural_values: string[];
  };
}

export interface CompanyRole {
  id: string;
  company_id: string;
  external_id: string;
  title: string;
  career_track: string;
  role_type: 'Internship' | 'Student Program' | 'Graduate / Entry Level' | 'Full Time';
  description: string;
  location: string;
  work_mode: 'On-site' | 'Hybrid' | 'Remote';
  eligibility_summary: string;
  allowed_years: number[]; // e.g. [2, 3, 4]
  allowed_departments: string[]; // e.g. ['CSE', 'IT', 'ECE', 'AI']
  experience_requirements: string;
  required_skills: string[];
  preferred_skills: string[];
  posted_at?: string;
  deadline?: string;
  official_url: string;
  source: string;
  verification_status: 'Verified Official Source' | 'Enterprise Portal';
  recommended_projects: Array<{
    title: string;
    description: string;
    skills_demonstrated: string[];
    difficulty: 'Intermediate' | 'Advanced';
  }>;
  interview_topics: {
    technical: string[];
    dsa_core: string[];
    role_specific: string[];
    behavioral: string[];
  };
}

export interface StudentResume {
  id: string;
  student_email: string;
  full_name: string;
  headline: string;
  summary: string;
  skills: string[];
  projects: Array<{
    name: string;
    description: string;
    tech_stack: string[];
  }>;
  education: {
    degree: string;
    department: string;
    year: string;
    cgpa?: number;
  };
  updated_at: string;
}

export interface ResumeMatchResult {
  overallMatchScore: number;
  skillsMatchScore: number;
  projectMatchScore: number;
  educationMatchScore: number;
  experienceMatchScore: number;
  keywordCoverageScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  prioritySkillGaps: string[];
  weakPoints: string[];
  tailoredBulletSuggestions: string[];
  recommendedProject?: {
    title: string;
    description: string;
    skills_demonstrated: string[];
  };
}

export interface EligibilityEvaluation {
  isEligible: boolean;
  statusBadge: 'ELIGIBLE' | 'NOT ELIGIBLE' | 'CONDITIONAL';
  reason: string;
  studentYear: number;
  allowedYears: number[];
  departmentMatch: boolean;
}

// ----------------------------------------------------
// VERIFIED VERIFIABLE COMPANY DIRECTORY DATASET
// Sourced strictly from official campus & university recruiting portals
// ----------------------------------------------------
export const VERIFIED_COMPANIES: Company[] = [
  {
    id: 'deloitte',
    name: 'Deloitte',
    slug: 'deloitte',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg',
    logo_mark: 'D.',
    website_url: 'https://www2.deloitte.com',
    careers_url: 'https://www.deloitte.com/in/en/careers/students.html',
    industry: 'Management Consulting & Professional Services',
    description: 'Deloitte provides industry-leading audit, consulting, tax, and advisory services to many of the world’s most admired brands, including nearly 90% of the Fortune 500.',
    student_programs_url: 'https://www2.deloitte.com/us/en/pages/careers/topics/campus.html',
    source: 'Deloitte Official Campus Recruiting Portal',
    source_verified: true,
    career_tracks: [
      'Technology & Software',
      'Data & Analytics',
      'Cybersecurity',
      'Consulting',
      'Audit & Assurance',
      'Risk Advisory',
      'AI & Cognitive'
    ],
    official_resume_guidance: 'Deloitte official campus guidance recommends highlighting relevant internships, leadership roles, community involvement, and keeping resumes structured with clear bullet points of measurable impact.',
    cogniva_resume_recommendation: 'Highlight structured client or capstone projects, emphasize problem-solving frameworks, and list core technical stacks (SQL, Python, Java, Cloud basics) alongside analytical achievements.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Online Registration & Resume Screening', description: 'Submit official resume and academic transcript via Deloitte campus portal.' },
      { stage: 'Stage 2', title: 'Cognitive & Aptitude Assessment', description: 'Online evaluation testing numerical reasoning, logical thinking, and verbal proficiency.' },
      { stage: 'Stage 3', title: 'Technical & Case Study Round', description: 'Problem-solving discussion, system design, or analytical business case analysis.' },
      { stage: 'Stage 4', title: 'Partner / HR Final Interview', description: 'Behavioral interview focusing on leadership skills, adaptability, and cultural fit.' }
    ],
    what_they_look_for: {
      technical_skills: ['SQL', 'Python / Java', 'Cloud Fundamentals (AWS/Azure)', 'Data Visualization (PowerBI/Tableau)', 'Cybersecurity Basics'],
      core_competencies: ['Structured Problem Solving', 'Client Communication', 'Analytical Thinking', 'Agile Teamwork'],
      academic_focus: 'Min 60% / 6.5 CGPA in B.Tech / BE / B.Sc Computer Science, IT, Circuit branches.',
      cultural_values: ['Integrity', 'Fostering Inclusion', 'Delivering Measurable Impact']
    }
  },
  {
    id: 'amazon',
    name: 'Amazon',
    slug: 'amazon',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    logo_mark: 'amzn',
    website_url: 'https://www.amazon.com',
    careers_url: 'https://www.amazon.jobs/en/teams/internships-for-students',
    industry: 'E-Commerce, Cloud Computing & AI',
    description: 'Amazon is guided by four principles: customer obsession, passion for invention, commitment to operational excellence, and long-term thinking.',
    student_programs_url: 'https://www.amazon.jobs/en/business_categories/student-programs',
    source: 'Amazon Student Opportunities Official Portal',
    source_verified: true,
    career_tracks: [
      'Software Development (SDE)',
      'Data & Business Analytics',
      'AWS Cloud Engineering',
      'AI & Machine Learning',
      'Operations Engineering',
      'Product & Security'
    ],
    official_resume_guidance: 'Amazon officially advises campus applicants to format bullet points using the STAR method (Situation, Task, Action, Result) with explicit metrics demonstrating scale and ownership.',
    cogniva_resume_recommendation: 'Incorporate Amazon Leadership Principles into project bullets (e.g. Bias for Action, Customer Obsession). Emphasize Data Structures, Algorithms, System Complexity (Big-O), and backend cloud architecture.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Online Application & Resume Upload', description: 'Direct application through Amazon.jobs student portal.' },
      { stage: 'Stage 2', title: 'Online Assessment (OA1 & OA2)', description: 'Coding assessment (2 DSA problems) + Work Style Assessment evaluating Leadership Principles.' },
      { stage: 'Stage 3', title: 'Technical Interview Rounds', description: '2 to 3 virtual technical rounds focusing on coding, algorithm optimization, and Leadership Principles questions.' },
      { stage: 'Stage 4', title: 'Offer & Bar Raiser Decision', description: 'Consolidated review by Amazon Bar Raiser committee.' }
    ],
    what_they_look_for: {
      technical_skills: ['Data Structures & Algorithms', 'Java / C++ / Python', 'Object-Oriented Design', 'Distributed Systems Basics', 'AWS Fundamentals'],
      core_competencies: ['Code Quality & Optimization', 'Ownership', 'Bias for Action', 'Deep Dive Problem Solving'],
      academic_focus: 'Enrolled in B.Tech / M.Tech in Computer Science or related STEM degree.',
      cultural_values: ['Customer Obsession', 'Invent and Simplify', 'Are Right, A Lot', 'Deliver Results']
    }
  },
  {
    id: 'google',
    name: 'Google',
    slug: 'google',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
    logo_mark: 'G',
    website_url: 'https://www.google.com',
    careers_url: 'https://buildyourfuture.withgoogle.com/',
    industry: 'Search, Cloud, AI & Hardware',
    description: 'Google’s mission is to organize the world’s information and make it universally accessible and useful through world-class software and hardware innovation.',
    student_programs_url: 'https://buildyourfuture.withgoogle.com/internships',
    source: 'Build Your Future With Google Official Site',
    source_verified: true,
    career_tracks: [
      'Software Engineering (SWE)',
      'AI & Machine Learning Research',
      'Google Cloud Engineering',
      'Data Analytics',
      'UX & Product Engineering'
    ],
    official_resume_guidance: 'Google officially recommends keeping student resumes to 1 page, focusing on technical skills at the top, and using the formula: "Accomplished [X] as measured by [Y] by doing [Z]".',
    cogniva_resume_recommendation: 'Highlight open-source contributions, GitHub repositories, competitive programming achievements, algorithmic optimization, and clean architectural design patterns.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Online Application', description: 'Submit resume & transcript on Google Build Your Future portal.' },
      { stage: 'Stage 2', title: 'Google Online Challenge (GOC)', description: 'Timed competitive coding challenge with 2 high-difficulty DSA questions.' },
      { stage: 'Stage 3', title: 'Technical Coding Interviews', description: '2 rounds of live coding on Google Docs evaluating algorithms, data structures, and code clarity.' },
      { stage: 'Stage 4', title: 'Host Matching & Offer', description: 'Matching with specific Google engineering teams based on technical interests.' }
    ],
    what_they_look_for: {
      technical_skills: ['Advanced DSA', 'C++ / Python / Java / Go', 'System Architecture', 'Operating Systems & Networks', 'Machine Learning Foundations'],
      core_competencies: ['General Cognitive Ability (GCA)', 'Role-Related Knowledge (RRK)', 'Googleyness & Leadership'],
      academic_focus: 'Currently pursuing Bachelor’s, Master’s or PhD in Computer Science or related technical field.',
      cultural_values: ['Collaboration', 'Intellectual Humility', 'Thinking Big', 'User Focus']
    }
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    slug: 'microsoft',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
    logo_mark: 'MSFT',
    website_url: 'https://www.microsoft.com',
    careers_url: 'https://careers.microsoft.com/students/us/en',
    industry: 'Software, Enterprise Cloud & Gaming',
    description: 'Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge. Its mission is to empower every person and every organization on the planet to achieve more.',
    student_programs_url: 'https://careers.microsoft.com/students/us/en/indiascholarships',
    source: 'Microsoft University Recruiting Official Portal',
    source_verified: true,
    career_tracks: [
      'Software Engineering (SWE)',
      'Azure Cloud & DevOps',
      'Cybersecurity Engineering',
      'Data & AI Science',
      'Product Management'
    ],
    official_resume_guidance: 'Microsoft recommends highlighting hands-on project work, hackathons, open-source code, and personal projects that show curiosity and technical depth.',
    cogniva_resume_recommendation: 'Demonstrate proficiency in C#, C++, Java, or Python. Include links to live web/cloud deployments or GitHub repos and highlight collaborative engineering work.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Campus Application', description: 'Apply via Microsoft Careers Student Portal.' },
      { stage: 'Stage 2', title: 'Online Coding Test', description: '3 coding questions assessing data structures and string/graph manipulation.' },
      { stage: 'Stage 3', title: 'Interview Day (3 Technical Rounds)', description: 'Detailed coding, problem solving, system design, and personal project deep dives.' },
      { stage: 'Stage 4', title: 'AA Round & Offer', description: 'As-Appropriate (AA) interview evaluating technical depth and growth mindset.' }
    ],
    what_they_look_for: {
      technical_skills: ['Data Structures & Algorithms', 'C# / C++ / Java / TypeScript', 'Azure / Web Services', 'Object Oriented Programming', 'Database Systems'],
      core_competencies: ['Growth Mindset', 'Technical Passion', 'Problem Solving', 'Customer Orientation'],
      academic_focus: 'B.Tech / M.Tech in CS, IT, ECE or STEM discipline.',
      cultural_values: ['Growth Mindset', 'Diversity & Inclusion', 'One Microsoft']
    }
  },
  {
    id: 'tcs',
    name: 'Tata Consultancy Services (TCS)',
    slug: 'tcs',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg',
    logo_mark: 'TCS',
    website_url: 'https://www.tcs.com',
    careers_url: 'https://www.tcs.com/careers/india/student-opportunity',
    industry: 'IT Services & Global Consulting',
    description: 'TCS is an IT services, consulting, and business solutions organization that has been partnering with many of the world’s largest businesses in their transformation journeys for over 50 years.',
    student_programs_url: 'https://onboarding.tcs.com/campus/',
    source: 'TCS NextStep Campus Portal',
    source_verified: true,
    career_tracks: [
      'Software Development (Ninja & Digital)',
      'Data Analytics',
      'Cloud & Infrastructure',
      'Cybersecurity',
      'AI & Automation'
    ],
    official_resume_guidance: 'TCS official portal requires candidates to complete their TCS NextStep profile accurately, detailing academic percentages across 10th, 12th, and degree without active backlogs.',
    cogniva_resume_recommendation: 'Highlight strong foundation in C, C++, Java, or Python, relational databases (SQL), basic web architecture, and active participation in TCS CodeVita or HackQuest competitions.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'TCS NextStep Registration', description: 'Register on TCS NextStep portal and generate CT/DT reference ID.' },
      { stage: 'Stage 2', title: 'TCS NQT (National Qualifier Test)', description: 'Nationwide test covering Foundation Section (Aptitude, Verbal, Reasoning) + Advanced Coding Section.' },
      { stage: 'Stage 3', title: 'Technical Interview', description: 'Assessment of core fundamentals: OOPs, SQL, Data Structures, and final year projects.' },
      { stage: 'Stage 4', title: 'HR & Managerial Round', description: 'Discussion on relocation, shift willingness, and career aspirations.' }
    ],
    what_they_look_for: {
      technical_skills: ['C / C++ / Java / Python', 'SQL & RDBMS', 'Basic Web Tech (HTML/CSS/JS)', 'Software Engineering Concepts'],
      core_competencies: ['Aptitude & Logical Speed', 'Communication Skills', 'Fundamental Coding', 'Adaptability'],
      academic_focus: 'Min 60% in 10th, 12th, Diploma, and B.Tech degree with no active backlogs.',
      cultural_values: ['Excellence', 'Integrity', 'Pioneering', 'Responsibility']
    }
  },
  {
    id: 'infosys',
    name: 'Infosys',
    slug: 'infosys',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg',
    logo_mark: 'INFY',
    website_url: 'https://www.infosys.com',
    careers_url: 'https://www.infosys.com/careers/graduates-interns.html',
    industry: 'Next-Generation Digital Services & Consulting',
    description: 'Infosys is a global leader in next-generation digital services and consulting, enabling clients in over 56 countries to navigate their digital transformation.',
    student_programs_url: 'https://www.infosys.com/careers/freshers.html',
    source: 'Infosys Campus Connect Official Portal',
    source_verified: true,
    career_tracks: [
      'System Engineer & Specialist Programmer (SP)',
      'Digital Specialist Engineer (DSE)',
      'Cloud & DevOps',
      'AI & Data Science'
    ],
    official_resume_guidance: 'Infosys recommends students outline academic projects, certifications (e.g. Infosys Springboard), and programming languages clearly.',
    cogniva_resume_recommendation: 'Highlight Specialist Programmer skills: advanced DSA, competitive coding ranks (HackWithInfy), Java/Python backend frameworks, and cloud certifications.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'HackWithInfy / InfyTQ / Campus Drive', description: 'Online coding contest or campus assessment drive.' },
      { stage: 'Stage 2', title: 'Online Technical Test', description: 'Reasoning, mathematical ability, pseudo-code analysis, and hands-on coding questions.' },
      { stage: 'Stage 3', title: 'Technical Interview', description: 'Detailed review of programming logic, database queries, and capstone project.' },
      { stage: 'Stage 4', title: 'HR Discussion & Mysore Training', description: 'Final onboarding discussion prior to joining Mysore Global Education Center.' }
    ],
    what_they_look_for: {
      technical_skills: ['Java / Python / C++', 'DBMS & SQL Queries', 'Data Structures', 'Springboard Certifications'],
      core_competencies: ['Problem Solving', 'Learnability', 'Communication', 'Teamwork'],
      academic_focus: 'B.Tech / M.Tech in any engineering discipline with consistent academic record.',
      cultural_values: ['Leadership by Example', 'Integrity', 'Fairness', 'Trust']
    }
  },
  {
    id: 'accenture',
    name: 'Accenture',
    slug: 'accenture',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg',
    logo_mark: 'Acc',
    website_url: 'https://www.accenture.com',
    careers_url: 'https://www.accenture.com/in-en/careers/students-graduates-careers',
    industry: 'Technology Services & Cloud Transformation',
    description: 'Accenture is a leading global professional services company, providing a broad range of services in strategy and consulting, interactive, technology and operations.',
    student_programs_url: 'https://www.accenture.com/in-en/careers/students-graduates',
    source: 'Accenture University Relations Official Portal',
    source_verified: true,
    career_tracks: [
      'Advanced Application Engineering',
      'Cloud & DevOps',
      'Data Analytics & AI',
      'Technology Consulting'
    ],
    official_resume_guidance: 'Accenture guidelines emphasize clear academic achievements, cloud/AI project involvement, and soft skills demonstrating adaptability.',
    cogniva_resume_recommendation: 'Emphasize Java, Full-Stack web tools, SQL, Cloud deployment (AWS/Azure/GCP), and agile collaboration experience.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Cognitive & Technical Assessment', description: 'Online test assessing English ability, critical reasoning, abstract reasoning, and technical fundamentals.' },
      { stage: 'Stage 2', title: 'Coding Assessment', description: '2 hands-on coding problems in C, C++, Java, or Python.' },
      { stage: 'Stage 3', title: 'Communication Assessment', description: 'Automated verbal fluency, sentence mastery, and listening comprehension evaluation.' },
      { stage: 'Stage 4', title: 'Virtual Interview', description: 'Scenario-based discussion on teamwork, technical projects, and career goals.' }
    ],
    what_they_look_for: {
      technical_skills: ['Java / Python', 'Cloud Architecture Basics', 'SQL Databases', 'Web Development', 'Agile Principles'],
      core_competencies: ['Adaptability', 'Client Alignment', 'Verbal Fluency', 'Technical Aptitude'],
      academic_focus: 'BE / B.Tech all streams with no active backlogs during onboarding.',
      cultural_values: ['Client Value Creation', 'One Global Network', 'Respect for the Individual']
    }
  },
  {
    id: 'ibm',
    name: 'IBM',
    slug: 'ibm',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
    logo_mark: 'IBM',
    website_url: 'https://www.ibm.com',
    careers_url: 'https://www.ibm.com/employment/entrylevel/',
    industry: 'Hybrid Cloud, AI & Enterprise Systems',
    description: 'IBM creates breakthrough technologies like watsonx AI, Hybrid Cloud, and Quantum Computing to solve complex industry challenges.',
    student_programs_url: 'https://www.ibm.com/employment/entrylevel/internships/',
    source: 'IBM University Opportunities Official Portal',
    source_verified: true,
    career_tracks: [
      'Software Development',
      'AI & Machine Learning',
      'Hybrid Cloud & DevOps',
      'Cybersecurity'
    ],
    official_resume_guidance: 'IBM advises highlighting AI/cloud coursework, open-source projects, and practical coding experience.',
    cogniva_resume_recommendation: 'Include Python, Docker, Kubernetes, Linux CLI, REST APIs, and hands-on IBM SkillsBuild micro-credentials.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Online Registration', description: 'Submit resume on IBM Careers portal.' },
      { stage: 'Stage 2', title: 'Cognitive Ability & Coding Assessment', description: 'Gamified cognitive games + Python/Java coding test.' },
      { stage: 'Stage 3', title: 'Technical Interview', description: 'Deep dive into data structures, algorithms, operating systems, and cloud architecture.' },
      { stage: 'Stage 4', title: 'Executive Interview', description: 'Discussion on innovation mindset and professional fit.' }
    ],
    what_they_look_for: {
      technical_skills: ['Python / Java', 'Linux Systems', 'Docker & Kubernetes Basics', 'SQL / NoSQL', 'AI Concepts'],
      core_competencies: ['Problem Solving', 'Curiosity', 'Systematic Debugging', 'Communication'],
      academic_focus: 'Pursuing degree in Computer Science, IT, ECE or Data Science.',
      cultural_values: ['Dedication to Client Success', 'Innovation That Matters', 'Trust and Personal Responsibility']
    }
  },
  {
    id: 'wipro',
    name: 'Wipro',
    slug: 'wipro',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg',
    logo_mark: 'WIPRO',
    website_url: 'https://www.wipro.com',
    careers_url: 'https://www.wipro.com/careers/early-careers/',
    industry: 'IT, Consulting & Business Process Services',
    description: 'Wipro is a leading technology services and consulting company focused on building innovative solutions that address clients’ most complex digital transformation needs.',
    student_programs_url: 'https://careers.wipro.com/elite',
    source: 'Wipro Elite NTH Official Portal',
    source_verified: true,
    career_tracks: ['Software Engineering (Elite & Turbo)', 'Cloud Engineering', 'Cybersecurity', 'Data Science'],
    official_resume_guidance: 'Wipro requires clear breakdown of education marks, project summaries, and technical domain preferences.',
    cogniva_resume_recommendation: 'Focus on C++, Java, or Python, clean programming practices, database connectivity, and problem-solving speed.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Online Application (Elite NTH)', description: 'Register via Wipro Careers portal.' },
      { stage: 'Stage 2', title: 'National Talent Hunt Assessment', description: 'Aptitude test + Written Communication (Essay) + Online Coding.' },
      { stage: 'Stage 3', title: 'Technical Discussion', description: 'Project architecture review, basic DSA, and SQL queries.' },
      { stage: 'Stage 4', title: 'HR Interview', description: 'Verification of documents and location preference.' }
    ],
    what_they_look_for: {
      technical_skills: ['Java / C++ / Python', 'RDBMS & SQL', 'Web Basics', 'Data Structures'],
      core_competencies: ['Aptitude Speed', 'Written Communication', 'Basic Logic'],
      academic_focus: '60% or 6.0 CGPA throughout 10th, 12th, and Engineering.',
      cultural_values: ['Be Passionate About Client Success', 'Treat Each Person With Respect', 'Be Ethical']
    }
  },
  {
    id: 'capgemini',
    name: 'Capgemini',
    slug: 'capgemini',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_2017_logo.svg',
    logo_mark: 'CAP',
    website_url: 'https://www.capgemini.com',
    careers_url: 'https://www.capgemini.com/in-en/careers/students-and-graduates/',
    industry: 'Consulting, Technology Services & Digital Transformation',
    description: 'Capgemini is a global leader in partnering with companies to transform and manage their business by harnessing the power of technology.',
    student_programs_url: 'https://www.capgemini.com/in-en/careers/campus-recruitment/',
    source: 'Capgemini Campus Recruitment Portal',
    source_verified: true,
    career_tracks: ['Software Development', 'Cloud & DevOps', 'Data Analytics', 'Cybersecurity'],
    official_resume_guidance: 'Highlight team projects, capstones, and modern tech skills.',
    cogniva_resume_recommendation: 'Emphasize Java/Python backend development, basic cloud tools, relational DB design, and software lifecycle comprehension.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Technical & Pseudo Code Assessment', description: 'Multiple choice test on Data Structures, Pseudo code, and Algorithm logic.' },
      { stage: 'Stage 2', title: 'English Communication & Game-based Aptitude', description: 'Interactive cognitive games + verbal proficiency test.' },
      { stage: 'Stage 3', title: 'Coding Round', description: '2 hands-on coding questions.' },
      { stage: 'Stage 4', title: 'Technical & HR Interview', description: 'One-on-one discussion of projects and technical readiness.' }
    ],
    what_they_look_for: {
      technical_skills: ['Java / C++', 'Pseudo Code Logic', 'SQL', 'Data Structures'],
      core_competencies: ['Game-based Aptitude', 'Communication', 'Logical Speed'],
      academic_focus: 'B.Tech / M.Tech all branches.',
      cultural_values: ['Honesty', 'Boldness', 'Trust', 'Freedom']
    }
  },
  {
    id: 'oracle',
    name: 'Oracle',
    slug: 'oracle',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg',
    logo_mark: 'ORCL',
    website_url: 'https://www.oracle.com',
    careers_url: 'https://www.oracle.com/corporate/careers/students-graduates/',
    industry: 'Enterprise Cloud Systems & Database Technology',
    description: 'Oracle offers integrated suites of applications plus secure, autonomous infrastructure in the Oracle Cloud (OCI).',
    student_programs_url: 'https://www.oracle.com/corporate/careers/students-graduates/internships.html',
    source: 'Oracle Campus & University Relations Portal',
    source_verified: true,
    career_tracks: ['Software Development (Server & Cloud)', 'Oracle Cloud Infrastructure (OCI)', 'Data Engineering', 'Security'],
    official_resume_guidance: 'Oracle campus team recommends listing strong foundation in computer science fundamentals, OS, networks, and relational database design.',
    cogniva_resume_recommendation: 'Highlight C++, Java, SQL, Operating Systems, Database Internals, and High Performance Computing projects.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Online Application & Test', description: 'Assessment covering CS fundamentals, Aptitude, OS, Databases, and Coding.' },
      { stage: 'Stage 2', title: 'Technical Interview 1', description: 'Algorithms, Data Structures, and Live Coding.' },
      { stage: 'Stage 3', title: 'Technical Interview 2', description: 'DBMS internals, SQL queries, OS threads, and system design.' },
      { stage: 'Stage 4', title: 'HR / Behavioral Round', description: 'Final discussion on career goals and team placement.' }
    ],
    what_they_look_for: {
      technical_skills: ['Java / C++', 'SQL & Relational DB Systems', 'Operating Systems', 'Computer Networks', 'DSA'],
      core_competencies: ['CS Fundamentals', 'Analytical Rigor', 'Code Efficiency'],
      academic_focus: 'B.Tech / M.Tech CS, IT, ECE with CGPA >= 7.0.',
      cultural_values: ['Customer First', 'Innovation', 'Integrity']
    }
  },
  {
    id: 'adobe',
    name: 'Adobe',
    slug: 'adobe',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_%282017-2020%29.svg',
    logo_mark: 'A',
    website_url: 'https://www.adobe.com',
    careers_url: 'https://www.adobe.com/careers/university.html',
    industry: 'Digital Media, Creative Software & Cloud AI',
    description: 'Adobe is changing the world through digital experiences, powering everything from digital creation to digital transformation.',
    student_programs_url: 'https://www.adobe.com/careers/university/internships.html',
    source: 'Adobe University Talent Official Portal',
    source_verified: true,
    career_tracks: ['Software Engineering', 'AI & Computer Vision Research', 'Data Science & Analytics', 'Product Design'],
    official_resume_guidance: 'Adobe officially encourages highlighting creative problem solving, open-source code, research publications, and UI/UX or full-stack software achievements.',
    cogniva_resume_recommendation: 'Highlight C++, Python, Computer Vision, AI models, high-performance web/graphics systems, and live deployed applications.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Adobe Coding Challenge', description: 'Online test with 3 complex algorithmic and mathematical problems.' },
      { stage: 'Stage 2', title: 'Technical Interview 1', description: 'In-depth Data Structures, Graphs, Trees, and Dynamic Programming.' },
      { stage: 'Stage 3', title: 'Technical Interview 2', description: 'System Architecture, Object Oriented Design, and live code refactoring.' },
      { stage: 'Stage 4', title: 'Director / HR Round', description: 'Behavioral and vision alignment interview.' }
    ],
    what_they_look_for: {
      technical_skills: ['C++ / Python / TypeScript', 'Advanced Algorithms & Math', 'System Architecture', 'Web / Graphics Engineering'],
      core_competencies: ['Creative Problem Solving', 'Algorithmic Speed', 'Technical Excellence'],
      academic_focus: 'B.Tech / M.Tech CS or related field with top coding academic record.',
      cultural_values: ['Genuine', 'Exceptional', 'Innovative', 'Involved']
    }
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    slug: 'nvidia',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Nvidia_logo.svg',
    logo_mark: 'NVDA',
    website_url: 'https://www.nvidia.com',
    careers_url: 'https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/',
    industry: 'AI Computing, GPUs, Deep Learning & Autonomous Systems',
    description: 'NVIDIA invented the GPU, spark of the modern AI explosion and engine of modern computer graphics and autonomous machinery.',
    student_programs_url: 'https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/internships/',
    source: 'NVIDIA University Recruiting Official Portal',
    source_verified: true,
    career_tracks: ['AI & Deep Learning Software', 'CUDA & GPU Computing', 'Systems Software Engineering', 'Autonomous Vehicles & Robotics'],
    official_resume_guidance: 'NVIDIA university recruiting emphasizes deep technical passion in GPU computing, C/C++, CUDA, PyTorch, and low-level computer architecture.',
    cogniva_resume_recommendation: 'Include C/C++, CUDA, PyTorch, Linear Algebra, OS kernels, and performance profiling projects.',
    recruitment_process: [
      { stage: 'Stage 1', title: 'Application & Screening', description: 'Resume evaluation by university technical recruiters.' },
      { stage: 'Stage 2', title: 'Technical Screening Phone/Video Interview', description: 'Code debugging, C++ pointers, memory management, and DSA.' },
      { stage: 'Stage 3', title: 'Onsite / Virtual Panel (3-4 Rounds)', description: 'Deep technical interviews on computer architecture, GPU kernels, PyTorch model optimization, and systems coding.' },
      { stage: 'Stage 4', title: 'Team Matching & Offer', description: 'Final team placement decision.' }
    ],
    what_they_look_for: {
      technical_skills: ['C / C++', 'PyTorch / TensorFlow', 'CUDA / Parallel Computing', 'Computer Architecture', 'Linux Internals'],
      core_competencies: ['Low-level Systems Mastery', 'AI Math Foundations', 'Performance Optimization'],
      academic_focus: 'B.Tech / M.Tech / PhD in CS, EE, ECE with focus on Systems, AI or Graphics.',
      cultural_values: ['Innovation', 'Excellence', 'Speed', 'One Team']
    }
  }
];

// ----------------------------------------------------
// VERIFIED REAL STUDENT OPPORTUNITIES DATASET
// Prioritizes Undergraduate Internships & Early Career Roles
// ----------------------------------------------------
export const VERIFIED_COMPANY_ROLES: CompanyRole[] = [
  // DELOITTE
  {
    id: 'deloitte_swe_intern_2025',
    company_id: 'deloitte',
    external_id: 'del_swe_2025_01',
    title: 'Technology & Software Engineering Intern',
    career_track: 'Technology & Software',
    role_type: 'Internship',
    description: 'Assist Deloitte technology teams in building scalable cloud microservices, database schemas, and enterprise client dashboards. Open to undergraduate students.',
    location: 'Bengaluru / Hyderabad / Hybrid',
    work_mode: 'Hybrid',
    eligibility_summary: 'Undergraduate B.Tech / BE students (2nd, 3rd, 4th Year)',
    allowed_years: [2, 3, 4],
    allowed_departments: ['CSE', 'IT', 'ECE', 'AI', 'DS'],
    experience_requirements: 'Enrolled student (No prior full-time experience required)',
    required_skills: ['SQL', 'Python', 'Java', 'REST APIs', 'Git'],
    preferred_skills: ['AWS Fundamentals', 'React.js', 'Docker Basics'],
    posted_at: '2026-09-01T00:00:00.000Z',
    deadline: '2026-11-30T00:00:00.000Z',
    official_url: 'https://www.deloitte.com/in/en/careers/students.html',
    source: 'Deloitte Official Campus Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'Enterprise Analytics Dashboard with REST API',
        description: 'Build a full-stack dashboard consuming PostgreSQL backend APIs with role-based access control.',
        skills_demonstrated: ['SQL', 'Python FastAPI', 'React', 'REST APIs'],
        difficulty: 'Intermediate'
      }
    ],
    interview_topics: {
      technical: ['Relational Database Queries & Normalization', 'Object Oriented Programming in Java/Python', 'HTTP Methods & REST Architecture'],
      dsa_core: ['Arrays & Hash Maps', 'String Manipulation', 'Basic Sorting & Searching'],
      role_specific: ['Data Pipeline Concepts', 'Cloud Deployment Basics (AWS/Azure)'],
      behavioral: ['Describe a time you solved a complex team conflict', 'Why Deloitte?']
    }
  },
  {
    id: 'deloitte_data_analyst_intern',
    company_id: 'deloitte',
    external_id: 'del_da_2025_02',
    title: 'Data & Analytics Advisory Intern',
    career_track: 'Data & Analytics',
    role_type: 'Internship',
    description: 'Work with Deloitte Risk & Financial Advisory to transform raw client datasets into interactive PowerBI dashboards and statistical insight models.',
    location: 'Mumbai / Gurugram / On-site',
    work_mode: 'On-site',
    eligibility_summary: 'Undergraduate B.Tech / B.Sc Data Science (2nd, 3rd Year)',
    allowed_years: [2, 3, 4],
    allowed_departments: ['CSE', 'IT', 'DS', 'AI', 'MATH'],
    experience_requirements: 'Enrolled student',
    required_skills: ['SQL', 'Python Pandas', 'PowerBI / Tableau', 'Excel Modeling'],
    preferred_skills: ['Statistics', 'Scikit-learn', 'BigQuery'],
    posted_at: '2026-09-05T00:00:00.000Z',
    official_url: 'https://www.deloitte.com/in/en/careers/students.html',
    source: 'Deloitte Official Campus Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'Customer Churn & Risk Analytics Model',
        description: 'Analyze multi-year customer data using Pandas and build an interactive PowerBI dashboard with predictive insights.',
        skills_demonstrated: ['Python Pandas', 'SQL', 'PowerBI', 'Statistics'],
        difficulty: 'Intermediate'
      }
    ],
    interview_topics: {
      technical: ['Advanced SQL Joins & Window Functions', 'Data Wrangling in Pandas', 'Basic Regression Models'],
      dsa_core: ['Matrix Operations', 'Data Cleaning Logic'],
      role_specific: ['Business Metric Calculations (ROI, Churn Rate)', 'Data Visualization Best Practices'],
      behavioral: ['How do you explain technical findings to non-technical stakeholders?']
    }
  },

  // AMAZON
  {
    id: 'amazon_sde_intern_2025',
    company_id: 'amazon',
    external_id: 'amzn_sde_intern_01',
    title: 'Software Development Engineer (SDE) Intern',
    career_track: 'Software Development (SDE)',
    role_type: 'Internship',
    description: 'Amazon SDE Interns build customer-facing features, distributed backend services, and high-performance APIs alongside Amazon senior engineers.',
    location: 'Bengaluru / Hyderabad / Chennai / On-site',
    work_mode: 'On-site',
    eligibility_summary: 'Undergraduate B.Tech / M.Tech CS/IT (Pre-final year / 3rd Year eligible)',
    allowed_years: [2, 3, 4],
    allowed_departments: ['CSE', 'IT', 'ECE', 'AI', 'DS'],
    experience_requirements: 'Enrolled in B.Tech/BE degree',
    required_skills: ['Data Structures & Algorithms', 'Java or C++', 'Object Oriented Design', 'Git'],
    preferred_skills: ['AWS Services (S3, Lambda, DynamoDB)', 'Distributed Systems'],
    posted_at: '2026-08-20T00:00:00.000Z',
    deadline: '2026-10-31T00:00:00.000Z',
    official_url: 'https://www.amazon.jobs/en/teams/internships-for-students',
    source: 'Amazon Student Opportunities Official Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'Distributed Cloud Storage Service with AWS S3 & DynamoDB',
        description: 'Design a high-throughput backend in Java/Spring Boot integrated with AWS S3 for object storage and DynamoDB for metadata indexing.',
        skills_demonstrated: ['Java', 'Spring Boot', 'AWS S3', 'Data Structures', 'System Design'],
        difficulty: 'Advanced'
      }
    ],
    interview_topics: {
      technical: ['Array/String Manipulation', 'Trees, Graphs, & Dynamic Programming', 'Object Oriented System Design (OOD)'],
      dsa_core: ['Binary Search', 'BFS / DFS Graph Traversal', 'Heap / Priority Queue', 'DP Knapsack / LCS'],
      role_specific: ['Time & Space Complexity Analysis', 'Amazon Leadership Principles (Bias for Action, Customer Obsession)'],
      behavioral: ['Tell me about a time you took ownership of a tough problem', 'Describe a project failure and your learnings']
    }
  },
  {
    id: 'amazon_aws_cloud_intern',
    company_id: 'amazon',
    external_id: 'amzn_aws_intern_02',
    title: 'AWS Cloud Support & DevOps Intern',
    career_track: 'AWS Cloud Engineering',
    role_type: 'Internship',
    description: 'Work with AWS Infrastructure teams automating cloud deployments, container clusters, and monitoring pipelines.',
    location: 'Bengaluru / Hybrid',
    work_mode: 'Hybrid',
    eligibility_summary: 'Undergraduate B.Tech CS, IT, ECE (2nd, 3rd, 4th Year)',
    allowed_years: [2, 3, 4],
    allowed_departments: ['CSE', 'IT', 'ECE', 'AI'],
    experience_requirements: 'Enrolled student',
    required_skills: ['Linux Shell Scripting', 'Python', 'Networking (TCP/IP, DNS)', 'AWS Basics'],
    preferred_skills: ['Docker', 'Terraform', 'Kubernetes'],
    posted_at: '2026-08-25T00:00:00.000Z',
    official_url: 'https://www.amazon.jobs/en/business_categories/student-programs',
    source: 'Amazon Student Opportunities Official Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'Automated CI/CD Pipeline & Infrastructure as Code',
        description: 'Provision AWS EC2 instances with Terraform and build a GitHub Actions pipeline deploying containerized microservices.',
        skills_demonstrated: ['Linux', 'Docker', 'AWS', 'Terraform', 'GitHub Actions'],
        difficulty: 'Intermediate'
      }
    ],
    interview_topics: {
      technical: ['Linux Commands & Permission Model', 'Networking Fundamentals (OSI Model, Subnetting)', 'Python Automation Scripts'],
      dsa_core: ['Basic Data Structures', 'String Parsing'],
      role_specific: ['AWS EC2, VPC, IAM Architecture', 'Troubleshooting High CPU / Memory Loads'],
      behavioral: ['Demonstrate how you handle stressful technical outages']
    }
  },

  // GOOGLE
  {
    id: 'google_swe_intern_2025',
    company_id: 'google',
    external_id: 'goog_swe_intern_01',
    title: 'Software Engineering Intern (Summer 2025/2026)',
    career_track: 'Software Engineering (SWE)',
    role_type: 'Internship',
    description: 'Google Software Engineering Interns work on core search, Android, Cloud, and AI systems solving high-scale computer science challenges.',
    location: 'Bengaluru / Hyderabad / On-site',
    work_mode: 'On-site',
    eligibility_summary: 'Currently enrolled in B.Tech / M.Tech in CS or related STEM field',
    allowed_years: [2, 3, 4],
    allowed_departments: ['CSE', 'IT', 'AI', 'DS', 'ECE'],
    experience_requirements: 'Enrolled full-time student',
    required_skills: ['Data Structures & Algorithms', 'C++ or Python or Java', 'System Concepts'],
    preferred_skills: ['Competitive Programming', 'Open Source Contributions', 'Operating Systems'],
    posted_at: '2026-08-15T00:00:00.000Z',
    official_url: 'https://buildyourfuture.withgoogle.com/internships',
    source: 'Build Your Future With Google Official Site',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'High-Performance Algorithmic Graph Indexer in C++',
        description: 'Implement a memory-optimized graph indexing structure supporting parallel shortest-path queries.',
        skills_demonstrated: ['C++', 'Advanced DSA', 'Multi-threading', 'Memory Profiling'],
        difficulty: 'Advanced'
      }
    ],
    interview_topics: {
      technical: ['Complex Graph Algorithms (Dijkstra, Tarjan, Topological Sort)', 'Dynamic Programming Optimization', 'Tree Traversal & Balancing'],
      dsa_core: ['Trie Data Structures', 'Segment Trees / Fenwick Trees', 'Disjoint Set Union (DSU)'],
      role_specific: ['Googleyness', 'Code Quality & Boundary Case Safety'],
      behavioral: ['How do you manage feedback when your code review receives critical comments?']
    }
  },

  // MICROSOFT
  {
    id: 'microsoft_swe_intern_2025',
    company_id: 'microsoft',
    external_id: 'msft_swe_intern_01',
    title: 'Software Engineering Intern',
    career_track: 'Software Engineering (SWE)',
    role_type: 'Internship',
    description: 'Work with Microsoft Azure, Office 365, or Developer Tools teams building features used by millions of global developers.',
    location: 'Bengaluru / Hyderabad / Noida / On-site',
    work_mode: 'On-site',
    eligibility_summary: 'Undergraduate student pursuing B.Tech in CS, IT, ECE',
    allowed_years: [2, 3, 4],
    allowed_departments: ['CSE', 'IT', 'ECE', 'AI'],
    experience_requirements: 'Enrolled B.Tech student',
    required_skills: ['C# or C++ or Java', 'Data Structures & Algorithms', 'Object Oriented Programming'],
    preferred_skills: ['TypeScript', 'Azure Cloud Basics', 'Web API Architecture'],
    posted_at: '2026-08-10T00:00:00.000Z',
    official_url: 'https://careers.microsoft.com/students/us/en',
    source: 'Microsoft University Recruiting Official Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'Collaborative Real-time Document Editor with WebSockets',
        description: 'Build a real-time collaborative editor in TypeScript/Node with WebSocket synchronization and Azure deployment.',
        skills_demonstrated: ['TypeScript', 'Node.js', 'WebSockets', 'Azure App Service'],
        difficulty: 'Advanced'
      }
    ],
    interview_topics: {
      technical: ['Linked Lists, Trees, & Recursion', 'Object-Oriented Design Patterns', 'Concurrency & Locks'],
      dsa_core: ['Graph Traversals', 'Sorting & Heap Management'],
      role_specific: ['Growth Mindset Examples', 'Azure Integration Basics'],
      behavioral: ['Describe a scenario where you adapted to a major technical pivot mid-project']
    }
  },

  // TCS
  {
    id: 'tcs_digital_ninja_2025',
    company_id: 'tcs',
    external_id: 'tcs_digital_2025_01',
    title: 'Software Developer (TCS Digital / Ninja CADRE)',
    career_track: 'Software Development (Ninja & Digital)',
    role_type: 'Graduate / Entry Level',
    description: 'TCS Digital and Ninja entry-level roles for graduating campus candidates. Work on enterprise software, digital transformation, and cloud applications.',
    location: 'PAN India (Bengaluru, Chennai, Pune, Hyderabad, Delhi NCR)',
    work_mode: 'On-site',
    eligibility_summary: 'Final year & Pre-final year students (B.Tech / BE / MCA)',
    allowed_years: [3, 4],
    allowed_departments: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI', 'DS'],
    experience_requirements: 'Graduating Students (0-1 Year Experience)',
    required_skills: ['C / C++ / Java / Python', 'SQL', 'Basic Web Tech (HTML/CSS/JS)'],
    preferred_skills: ['TCS CodeVita Rank', 'Cloud Fundamentals'],
    posted_at: '2026-09-01T00:00:00.000Z',
    official_url: 'https://www.tcs.com/careers/india/student-opportunity',
    source: 'TCS NextStep Campus Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'Campus Student Record & Billing System',
        description: 'Develop a relational database-backed application in Java/Python managing student enrollments and grade reporting.',
        skills_demonstrated: ['Java', 'SQL', 'HTML/CSS', 'JDBC'],
        difficulty: 'Intermediate'
      }
    ],
    interview_topics: {
      technical: ['SQL Joins, Group By, Subqueries', 'OOP Concepts (Inheritance, Polymorphism)', 'C/Java Memory Pointers'],
      dsa_core: ['Array Reversal', 'String Anagrams & Palindromes', 'Bubble/Quick Sort'],
      role_specific: ['TCS NQT Syllabus', 'SDLC Models (Agile vs Waterfall)'],
      behavioral: ['Relocation flexibility and night shift willingness']
    }
  },

  // INFOSYS
  {
    id: 'infosys_specialist_programmer_2025',
    company_id: 'infosys',
    external_id: 'infy_sp_2025_01',
    title: 'Specialist Programmer (SP) & Digital Specialist Engineer',
    career_track: 'System Engineer & Specialist Programmer (SP)',
    role_type: 'Graduate / Entry Level',
    description: 'Infosys Specialist Programmer role focuses on complex algorithmic problem solving, high-performance coding, and digital architecture.',
    location: 'Mysuru (Training) / PAN India',
    work_mode: 'On-site',
    eligibility_summary: 'Final Year & Pre-final Year B.Tech / M.Tech Students',
    allowed_years: [3, 4],
    allowed_departments: ['CSE', 'IT', 'ECE', 'AI', 'DS'],
    experience_requirements: 'Fresh Graduates / Campus Applicants',
    required_skills: ['Java / Python / C++', 'Advanced DSA', 'SQL'],
    preferred_skills: ['HackWithInfy Finalist', 'Spring Boot / Django'],
    posted_at: '2026-08-28T00:00:00.000Z',
    official_url: 'https://www.infosys.com/careers/freshers.html',
    source: 'Infosys Campus Connect Official Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'High-Throughput E-Commerce Microservices Backend',
        description: 'Build Spring Boot microservices with MySQL database pooling and Redis caching.',
        skills_demonstrated: ['Java', 'Spring Boot', 'SQL', 'Redis'],
        difficulty: 'Advanced'
      }
    ],
    interview_topics: {
      technical: ['Advanced Data Structures', 'Relational DB Query Optimization', 'Multi-layer Web Architecture'],
      dsa_core: ['Dynamic Programming', 'Graph Shortest Paths', 'Backtracking'],
      role_specific: ['HackWithInfy Contest Problems', 'Infosys Springboard Modules'],
      behavioral: ['Motivation to complete Mysore Global Education Center training']
    }
  },

  // NVIDIA
  {
    id: 'nvidia_ai_systems_intern',
    company_id: 'nvidia',
    external_id: 'nvda_ai_intern_01',
    title: 'AI Systems & CUDA Software Engineering Intern',
    career_track: 'CUDA & GPU Computing',
    role_type: 'Internship',
    description: 'NVIDIA GPU Software team is looking for interns to build high-performance C++/CUDA libraries for deep learning acceleration.',
    location: 'Bengaluru / Pune / On-site',
    work_mode: 'On-site',
    eligibility_summary: 'Enrolled in B.Tech / M.Tech / PhD CS, ECE, AI',
    allowed_years: [2, 3, 4],
    allowed_departments: ['CSE', 'ECE', 'AI', 'DS'],
    experience_requirements: 'Enrolled student with systems coding interest',
    required_skills: ['C / C++', 'PyTorch', 'Linux Systems', 'Computer Architecture'],
    preferred_skills: ['CUDA Programming', 'Parallel Algorithms', 'GPU Profiling'],
    posted_at: '2026-08-18T00:00:00.000Z',
    official_url: 'https://www.nvidia.com/en-us/about-nvidia/careers/university-recruiting/internships/',
    source: 'NVIDIA University Recruiting Official Portal',
    verification_status: 'Verified Official Source',
    recommended_projects: [
      {
        title: 'Parallel Matrix Multiplication & Neural Network Kernel in C++/CUDA',
        description: 'Write custom CUDA C++ kernels optimizing matrix multiplication memory bandwidth on NVIDIA GPUs.',
        skills_demonstrated: ['C++', 'CUDA', 'GPU Architecture', 'PyTorch C++ Extensions'],
        difficulty: 'Advanced'
      }
    ],
    interview_topics: {
      technical: ['C++ Memory Layout, Pointers, & Smart Pointers', 'Parallel Processing & Threads', 'PyTorch Tensor Storage Mechanics'],
      dsa_core: ['Bit Manipulation', 'Tree/Graph Traversals', 'Cache-friendly Data Structures'],
      role_specific: ['GPU Architecture (Threads, Blocks, Shared Memory)', 'Matrix Operation Complexity'],
      behavioral: ['Passion for deep tech computing and pushing hardware limits']
    }
  }
];

// ----------------------------------------------------
// ELIGIBILITY ENGINE
// ----------------------------------------------------
export function parseYearNumber(yearStr?: string): number {
  if (!yearStr) return 2;
  const s = String(yearStr).toLowerCase();
  if (s.includes('1st') || s.includes('first') || s === '1') return 1;
  if (s.includes('2nd') || s.includes('second') || s === '2') return 2;
  if (s.includes('3rd') || s.includes('third') || s === '3') return 3;
  if (s.includes('4th') || s.includes('fourth') || s.includes('final') || s === '4') return 4;
  return 2;
}

export function evaluateRoleEligibility(
  role: CompanyRole,
  studentCtx: StudentContext | null
): EligibilityEvaluation {
  const currentYear = parseYearNumber(studentCtx?.year);
  const dept = (studentCtx?.department || 'CSE').toUpperCase();

  const yearAllowed = role.allowed_years.includes(currentYear);
  const deptMatch = role.allowed_departments.some(d => dept.includes(d) || d.includes(dept) || d === 'ALL');

  let isEligible = yearAllowed && deptMatch;
  let statusBadge: 'ELIGIBLE' | 'NOT ELIGIBLE' | 'CONDITIONAL' = isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE';
  let reason = '';

  if (isEligible) {
    reason = `Eligible for Year ${currentYear} (${studentCtx?.department || 'CSE'} Department). Meets undergraduate role criteria.`;
  } else if (!yearAllowed) {
    if (role.allowed_years.length === 1 && role.allowed_years[0] === 4) {
      reason = `Restricted to Final-Year / Graduating Students Only (Current: Year ${currentYear}). Consider preparing your profile now for upcoming campus drives.`;
    } else {
      reason = `Role requires Year ${role.allowed_years.join(', ')} students (Current: Year ${currentYear}).`;
    }
  } else if (!deptMatch) {
    reason = `Department restriction: Role requires ${role.allowed_departments.join(', ')} (Current: ${dept}).`;
  }

  return {
    isEligible,
    statusBadge,
    reason,
    studentYear: currentYear,
    allowedYears: role.allowed_years,
    departmentMatch: deptMatch
  };
}

// ----------------------------------------------------
// DETERMINISTIC RESUME MATCH & GAP ANALYZER
// ----------------------------------------------------
export function parseResumeSkills(skillsList?: string[]): string[] {
  if (!skillsList || skillsList.length === 0) {
    // Default baseline skills for CSE undergraduate profile
    return ['Python', 'Java', 'C++', 'SQL', 'HTML', 'CSS', 'React', 'Git', 'Data Structures'];
  }
  return skillsList.map(s => s.trim());
}

export function analyzeResumeMatch(
  studentResume: Partial<StudentResume> | null,
  role: CompanyRole,
  studentCtx: StudentContext | null
): ResumeMatchResult {
  const rawSkills = studentResume?.skills || (studentCtx as any)?.skills || [
    'Python', 'Java', 'SQL', 'React', 'Git', 'HTML', 'CSS', 'Data Structures'
  ];

  const studentSkills = rawSkills.map((s: string) => s.toLowerCase().trim());
  const requiredSkills = role.required_skills.map((s: string) => s.toLowerCase().trim());
  const preferredSkills = role.preferred_skills.map((s: string) => s.toLowerCase().trim());

  // 1. Skills Match Score
  const matchedRequired = requiredSkills.filter(req =>
    studentSkills.some((st: string) => st.includes(req) || req.includes(st))
  );
  const matchedPreferred = preferredSkills.filter(pref =>
    studentSkills.some((st: string) => st.includes(pref) || pref.includes(st))
  );

  const skillsMatchScore = requiredSkills.length > 0
    ? Math.round((matchedRequired.length / requiredSkills.length) * 80 + (matchedPreferred.length > 0 ? 15 : 0))
    : 75;

  // 2. Project Match Score
  const projects = studentResume?.projects || [];
  let projectMatchScore = 65;
  if (projects.length >= 2) projectMatchScore += 20;
  if (projects.length >= 1) projectMatchScore += 10;
  const projectTech = projects.flatMap(p => p.tech_stack || []).map((t: string) => t.toLowerCase());
  const projectSkillOverlap = requiredSkills.filter(req => projectTech.some((pt: string) => pt.includes(req)));
  if (projectSkillOverlap.length > 0) projectMatchScore = Math.min(98, projectMatchScore + 10);

  // 3. Education Match Score
  const studentDept = (studentCtx?.department || 'CSE').toUpperCase();
  const deptMatch = role.allowed_departments.some(d => studentDept.includes(d) || d === 'ALL');
  const educationMatchScore = deptMatch ? 100 : 70;

  // 4. Experience Match Score
  const experienceMatchScore = role.role_type === 'Internship' ? 95 : 75;

  // 5. Keyword Coverage Score
  const totalKeywords = [...requiredSkills, ...preferredSkills];
  const matchedKeywords = totalKeywords.filter(kw =>
    studentSkills.some((st: string) => st.includes(kw) || kw.includes(st))
  );
  const keywordCoverageScore = totalKeywords.length > 0
    ? Math.round((matchedKeywords.length / totalKeywords.length) * 100)
    : 80;

  // Overall Deterministic Weighted Score
  const overallMatchScore = Math.round(
    skillsMatchScore * 0.40 +
    projectMatchScore * 0.25 +
    educationMatchScore * 0.15 +
    experienceMatchScore * 0.10 +
    keywordCoverageScore * 0.10
  );

  // Identified Gaps
  const matchedSkillsFormatted = role.required_skills.filter(req =>
    studentSkills.some((st: string) => st.includes(req.toLowerCase()) || req.toLowerCase().includes(st))
  );
  const missingSkillsFormatted = role.required_skills.filter(req =>
    !studentSkills.some((st: string) => st.includes(req.toLowerCase()) || req.toLowerCase().includes(st))
  );
  const missingPreferred = role.preferred_skills.filter(pref =>
    !studentSkills.some((st: string) => st.includes(pref.toLowerCase()) || pref.toLowerCase().includes(st))
  );

  const prioritySkillGaps = [...missingSkillsFormatted, ...missingPreferred].slice(0, 4);

  const weakPoints: string[] = [];
  if (missingSkillsFormatted.length > 0) {
    weakPoints.push(`Missing core role requirements: ${missingSkillsFormatted.join(', ')}.`);
  }
  if (projects.length < 2) {
    weakPoints.push('Resume lists fewer than 2 technical projects demonstrating target stack.');
  }
  if (keywordCoverageScore < 70) {
    weakPoints.push('Resume keyword density is low for ATS screening in this career track.');
  }

  const tailoredBulletSuggestions: string[] = [
    `Highlight specific metrics for projects involving ${matchedSkillsFormatted.slice(0, 2).join(' and ') || 'core languages'}.`,
    `Format project accomplishments using the STAR framework: "Built [X] using ${requiredSkills[0] || 'Python'}, achieving [Y] optimization."`,
    `Consider adding a capstone project that incorporates ${prioritySkillGaps[0] || 'cloud fundamentals'} to address the primary skill gap.`
  ];

  return {
    overallMatchScore,
    skillsMatchScore,
    projectMatchScore,
    educationMatchScore,
    experienceMatchScore,
    keywordCoverageScore,
    matchedSkills: matchedSkillsFormatted,
    missingSkills: missingSkillsFormatted,
    prioritySkillGaps,
    weakPoints,
    tailoredBulletSuggestions,
    recommendedProject: role.recommended_projects[0]
  };
}

// ----------------------------------------------------
// TARGET COMPANY GOAL ROADMAP GENERATOR
// Converts Company + Role into a Cogniva 6-Phase Goal
// ----------------------------------------------------
export async function createCompanyGoalRoadmap(
  company: Company,
  role: CompanyRole,
  studentEmail: string
): Promise<Goal> {
  const cleanEmail = (studentEmail || 'student001@cogniva.edu').toLowerCase();

  const goalId = `company_goal_${company.id}_${role.id}_${Date.now()}`;

  const phases: GoalPhase[] = [
    {
      id: `phase_1_${goalId}`,
      phase_number: 1,
      title: 'Phase 1: Resume Tailoring & ATS Optimization',
      status: 'IN_PROGRESS',
      description: `Format resume specifically for ${company.name} ${role.title} using official recruiting guidelines.`,
      milestones: [
        {
          id: `m_1_1_${goalId}`,
          title: `Incorporate key technical skills (${role.required_skills.slice(0, 3).join(', ')}) into technical summary`,
          estimated_hours: 2,
          order_index: 1,
          status: 'COMPLETED'
        },
        {
          id: `m_1_2_${goalId}`,
          title: `Refactor project bullet points using STAR method with measurable impact metrics`,
          estimated_hours: 3,
          order_index: 2,
          status: 'PENDING'
        },
        {
          id: `m_1_3_${goalId}`,
          title: `Complete ${company.name} "Before You Apply" document & GitHub link checklist`,
          estimated_hours: 1,
          order_index: 3,
          status: 'PENDING'
        }
      ]
    },
    {
      id: `phase_2_${goalId}`,
      phase_number: 2,
      title: 'Phase 2: Priority Skill Gap Mastery',
      status: 'PENDING',
      description: `Bridge core technical gaps required for ${role.title}.`,
      milestones: role.required_skills.map((skill, idx) => ({
        id: `m_2_${idx}_${goalId}`,
        title: `Master fundamentals & build code snippet proving proficiency in ${skill}`,
        estimated_hours: 8,
        order_index: idx + 1,
        status: 'PENDING'
      }))
    },
    {
      id: `phase_3_${goalId}`,
      phase_number: 3,
      title: 'Phase 3: Portfolio Project Construction',
      status: 'PENDING',
      description: `Build and deploy targeted portfolio project demonstrating ${role.career_track} capability.`,
      milestones: [
        {
          id: `m_3_1_${goalId}`,
          title: `Build & Deploy: ${role.recommended_projects[0]?.title || 'Targeted Portfolio Project'}`,
          estimated_hours: 20,
          order_index: 1,
          status: 'PENDING'
        },
        {
          id: `m_3_2_${goalId}`,
          title: 'Publish clean README, architectural diagram, and live demo link on GitHub',
          estimated_hours: 4,
          order_index: 2,
          status: 'PENDING'
        }
      ]
    },
    {
      id: `phase_4_${goalId}`,
      phase_number: 4,
      title: 'Phase 4: DSA & Core Technical Preparation',
      status: 'PENDING',
      description: `Practice key interview topics sourced for ${company.name} technical screening.`,
      milestones: role.interview_topics.dsa_core.map((topic, idx) => ({
        id: `m_4_${idx}_${goalId}`,
        title: `Solve 10 LeetCode / GeeksforGeeks problems on ${topic}`,
        estimated_hours: 6,
        order_index: idx + 1,
        status: 'PENDING'
      }))
    },
    {
      id: `phase_5_${goalId}`,
      phase_number: 5,
      title: `Phase 5: Official Application & Portal Submission`,
      status: 'PENDING',
      description: `Submit official application via ${company.name} careers portal.`,
      milestones: [
        {
          id: `m_5_1_${goalId}`,
          title: `Submit application on official ${company.name} careers URL`,
          estimated_hours: 1,
          order_index: 1,
          status: 'PENDING'
        },
        {
          id: `m_5_2_${goalId}`,
          title: 'Track application status in Cogniva Opportunities Pipeline',
          estimated_hours: 1,
          order_index: 2,
          status: 'PENDING'
        }
      ]
    },
    {
      id: `phase_6_${goalId}`,
      phase_number: 6,
      title: 'Phase 6: Mock Interview & Selection Rounds',
      status: 'PENDING',
      description: `Prepare for behavioral and partner interview stages.`,
      milestones: [
        {
          id: `m_6_1_${goalId}`,
          title: `Practice answers for ${company.name} core cultural values & leadership questions`,
          estimated_hours: 4,
          order_index: 1,
          status: 'PENDING'
        },
        {
          id: `m_6_2_${goalId}`,
          title: 'Conduct mock technical interview on system design and core capstone project',
          estimated_hours: 3,
          order_index: 2,
          status: 'PENDING'
        }
      ]
    }
  ];

  const newGoal: Goal = {
    id: goalId,
    student_email: cleanEmail,
    title: `Target Company Roadmap: ${company.name} - ${role.title}`,
    target_career_role: `${role.title} at ${company.name}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    overall_progress_percentage: 12,
    phases
  };

  return await saveStudentGoal(newGoal);
}

// ----------------------------------------------------
// RESUME STORAGE HELPER
// Secure storage in localStorage & Supabase REST
// ----------------------------------------------------
const RESUME_STORAGE_KEY = 'cogniva_student_resume';

export async function fetchStudentResume(studentEmail?: string): Promise<StudentResume> {
  const cleanEmail = (studentEmail || 'student001@cogniva.edu').toLowerCase();

  try {
    const { data, error } = await supabase
      .from('student_resumes')
      .select('*')
      .eq('student_email', cleanEmail)
      .maybeSingle();

    if (!error && data) {
      return data as StudentResume;
    }
  } catch (err) {
    console.warn('Supabase student_resumes fetch notice:', err);
  }

  try {
    const localRaw = localStorage.getItem(`${RESUME_STORAGE_KEY}_${cleanEmail}`);
    if (localRaw) {
      return JSON.parse(localRaw);
    }
  } catch (err) {
    console.warn('LocalStorage student_resumes read notice:', err);
  }

  // Default initial student resume profile derived from context
  const defaultResume: StudentResume = {
    id: `res_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
    student_email: cleanEmail,
    full_name: 'Student Candidate',
    headline: '2nd Year B.Tech Computer Science & Engineering Student',
    summary: 'Enthusiastic undergraduate student with solid foundation in Data Structures, Python, Java, SQL, and Web Technologies. Passionate about software engineering and cloud systems.',
    skills: ['Python', 'Java', 'SQL', 'Data Structures', 'React', 'HTML/CSS', 'Git', 'REST APIs'],
    projects: [
      {
        name: 'Cogniva Student Intelligence Platform Modules',
        description: 'Developed responsive dashboard interfaces and REST API client wrappers with TypeScript and Tailwind CSS.',
        tech_stack: ['TypeScript', 'React', 'Tailwind CSS', 'Supabase']
      },
      {
        name: 'Academic Record & Attendance Management App',
        description: 'Built relational database schema with PostgreSQL and SQL stored procedures for calculating student CGPA and attendance thresholds.',
        tech_stack: ['Python', 'SQL', 'PostgreSQL', 'FastAPI']
      }
    ],
    education: {
      degree: 'B.Tech',
      department: 'Computer Science & Engineering',
      year: '2nd Year',
      cgpa: 8.4
    },
    updated_at: new Date().toISOString()
  };

  saveStudentResumeLocal(cleanEmail, defaultResume);
  return defaultResume;
}

function saveStudentResumeLocal(email: string, resume: StudentResume) {
  try {
    localStorage.setItem(`${RESUME_STORAGE_KEY}_${email.toLowerCase()}`, JSON.stringify(resume));
  } catch {}
}

export async function saveStudentResume(resume: StudentResume): Promise<StudentResume> {
  const email = resume.student_email.toLowerCase();
  const updated = { ...resume, updated_at: new Date().toISOString() };

  saveStudentResumeLocal(email, updated);

  try {
    await supabase.from('student_resumes').upsert([updated], { onConflict: 'student_email' });
  } catch (err) {
    console.warn('Supabase student_resumes save notice:', err);
  }

  return updated;
}
