import { getUserFriendlyError } from './error-handler';

export interface AiResponse {
  success: boolean;
  answer?: string;
  error?: string;
  context?: any;
}

export async function askAdminAi(prompt: string, userEmail?: string): Promise<AiResponse> {
  try {
    const res = await fetch('/api/ai/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        userRole: 'admin',
        userEmail: userEmail || 'cdc@gmail.com'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: getUserFriendlyError(err.error, 'AI_SERVICE', 'AI assistance is temporarily unavailable. Please try again.') };
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: getUserFriendlyError(err, 'AI_SERVICE', 'AI assistance is temporarily unavailable. Please try again.') };
  }
}

export async function askFacultyAi(
  prompt: string,
  userEmail?: string,
  studentRegno?: string,
  action?: string
): Promise<AiResponse> {
  try {
    const res = await fetch('/api/ai/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        userRole: 'faculty',
        userEmail: userEmail || 'anjali.menon@example.edu',
        studentRegno,
        action
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: getUserFriendlyError(err.error, 'AI_SERVICE', 'AI assistance is temporarily unavailable. Please try again.') };
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: getUserFriendlyError(err, 'AI_SERVICE', 'AI assistance is temporarily unavailable. Please try again.') };
  }
}

export async function askStudentAi(
  prompt: string,
  userEmail?: string,
  action?: string
): Promise<AiResponse> {
  try {
    const res = await fetch('/api/ai/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        userRole: 'student',
        userEmail,
        action
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: getUserFriendlyError(err.error, 'AI_SERVICE', 'AI assistance is temporarily unavailable. Please try again.') };
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: getUserFriendlyError(err, 'AI_SERVICE', 'AI assistance is temporarily unavailable. Please try again.') };
  }
}

export interface ComebackPlanResult {
  targetMath: string;
  actionableSteps: string[];
  targetIa2Score?: number;
  realisticGoalText?: string;
  keyFocusTopics?: string[];
}

export async function generateIa2ComebackPlan(
  subjectName: string,
  ia1Score: number,
  studentName?: string,
  userEmail?: string
): Promise<ComebackPlanResult> {
  const prompt = `You are a strict but empathetic academic advisor AI. A student scored a low mark in their first Internal Assessment (${ia1Score} out of 30) for ${subjectName}. The passing grade is 15.
Task 1: Calculate exactly what they realistically need to score in IA-2 and the Final Exam to maintain a safe CGPA.
Task 2: Write a 3-bullet-point 'Comeback Strategy' focusing on how they must change their study habits for this specific subject to achieve that target.
Return the response in pure JSON format with two keys: 'targetMath' (a short string explaining the exact scores needed) and 'actionableSteps' (an array of 3 short strings).`;

  try {
    const res = await askFacultyAi(prompt, userEmail);
    if (res.success && res.answer) {
      const jsonMatch = res.answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.targetMath && Array.isArray(parsed.actionableSteps)) {
          return {
            targetMath: String(parsed.targetMath),
            actionableSteps: parsed.actionableSteps.map(String)
          };
        }
      }
    }
  } catch {}

  const neededIA2 = Math.min(30, Math.max(18, 30 - ia1Score + 12));
  const neededFinal = Math.min(100, Math.max(65, 140 - (ia1Score * 2)));

  return {
    targetMath: `Target for IA-2: ${neededIA2}/30 and Final Exam: ${neededFinal}/100 to maintain a safe CGPA (70%+ aggregate).`,
    actionableSteps: [
      `Dedicate 45 minutes daily to solving past question papers and core numerical problems for ${subjectName}.`,
      `Attend weekly doubt-clearing sessions with the professor to master difficult concepts.`,
      `Form a 2-person study group with a peer to practice active recall and mock testing before IA-2.`
    ]
  };
}

export interface RoadmapGenResult {
  phases: Array<{
    title: string;
    description?: string;
    milestones: Array<{
      title: string;
      description: string;
      why_it_matters: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      estimated_hours: number;
      order: number;
    }>;
  }>;
}

export async function generateGoalRoadmapAi(
  goalTitle: string,
  goalDescription?: string,
  targetDate?: string,
  studentContext?: {
    dept?: string;
    year?: string;
    cgpa?: number;
    skills?: string[];
  },
  userEmail?: string
): Promise<RoadmapGenResult | null> {
  const prompt = `You are Cogniva's Student Goal Planning Assistant.
Convert the student's academic/career goal into a realistic, structured, actionable roadmap.

Goal: "${goalTitle}"
${goalDescription ? `Description/Why it matters: "${goalDescription}"` : ''}
${targetDate ? `Target Date: "${targetDate}"` : ''}
Student Context:
- Department: ${studentContext?.dept || 'CSE'}
- Year: ${studentContext?.year || '2nd Year'}
- CGPA: ${studentContext?.cgpa || 8.2}
- Skills: ${(studentContext?.skills || ['Java', 'Python', 'React', 'AI']).join(', ')}

Generate 3 to 4 sequential phases. Each phase must contain 2 to 4 actionable milestones.
For each milestone return:
- "title": Short action-oriented title
- "description": Concise description of what to build or study
- "why_it_matters": Explanation of how this milestone creates evidence or supports the goal
- "priority": "HIGH" or "MEDIUM" or "LOW"
- "estimated_hours": Integer estimated hours (e.g. 5, 8, 12, 15)
- "order": Integer sequence order starting from 1

Return STRICT JSON ONLY.
Schema:
{
  "phases": [
    {
      "title": "Phase Title",
      "milestones": [
        {
          "title": "Milestone Title",
          "description": "Milestone description",
          "why_it_matters": "Why this milestone matters",
          "priority": "HIGH",
          "estimated_hours": 10,
          "order": 1
        }
      ]
    }
  ]
}`;

  try {
    const res = await askStudentAi(prompt, userEmail, 'generate_roadmap');
    if (res.success && res.answer) {
      const jsonMatch = res.answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.phases) && parsed.phases.length > 0) {
          return parsed as RoadmapGenResult;
        }
      }
    }
  } catch (err) {
    console.warn('AI Roadmap Generation fallback triggered:', err);
  }

  return getDomainSpecificRoadmap(goalTitle);
}

function getDomainSpecificRoadmap(title: string): RoadmapGenResult {
  const t = title.toLowerCase();

  if (t.includes('research') || t.includes('internship') || t.includes('ml') || t.includes('ai')) {
    return {
      phases: [
        {
          title: 'Phase 1: Build Core Foundations',
          milestones: [
            {
              title: 'Master NumPy & Pandas for Applied ML',
              description: 'Strengthen data manipulation, array vectorization, and data processing skills.',
              why_it_matters: 'Core prerequisite for implementing data pipelines and model training code.',
              priority: 'HIGH',
              estimated_hours: 8,
              order: 1
            },
            {
              title: 'Study Core Machine Learning Algorithms',
              description: 'Implement linear regression, decision trees, and SVMs from scratch.',
              why_it_matters: 'Builds deep technical intuition needed for research lab technical interviews.',
              priority: 'HIGH',
              estimated_hours: 12,
              order: 2
            }
          ]
        },
        {
          title: 'Phase 2: Build Empirical Evidence',
          milestones: [
            {
              title: 'Construct an End-to-End ML Evaluation Notebook',
              description: 'Build a reproducible benchmark notebook comparing baseline models on public datasets.',
              why_it_matters: 'Demonstrates practical experimentation capability to prospective research mentors.',
              priority: 'HIGH',
              estimated_hours: 15,
              order: 3
            },
            {
              title: 'Publish Open-Source ML Repository on GitHub',
              description: 'Clean code, write comprehensive README, and add model performance visualizations.',
              why_it_matters: 'Serves as visible proof of code quality for applications.',
              priority: 'MEDIUM',
              estimated_hours: 6,
              order: 4
            }
          ]
        },
        {
          title: 'Phase 3: Application & Outreach',
          milestones: [
            {
              title: 'Craft Research-Focused Technical Resume',
              description: 'Highlight ML coursework, GitHub projects, and quantitative metrics.',
              why_it_matters: 'Ensures ATS screening and faculty review pass cleanly.',
              priority: 'HIGH',
              estimated_hours: 4,
              order: 5
            },
            {
              title: 'Shortlist & Contact 5 Target Research Labs',
              description: 'Draft tailored emails referencing recent lab papers and proposed contributions.',
              why_it_matters: 'Direct outreach creates research internship opportunities.',
              priority: 'HIGH',
              estimated_hours: 8,
              order: 6
            }
          ]
        }
      ]
    };
  }

  if (t.includes('distinction') || t.includes('gpa') || t.includes('semester')) {
    return {
      phases: [
        {
          title: 'Phase 1: Assessment Protection',
          milestones: [
            {
              title: 'Map Subject Priority Matrix',
              description: 'Identify subjects below 8.0 target GPA and protect 45-min daily revision blocks.',
              why_it_matters: 'Early focus prevents score drop before midterms.',
              priority: 'HIGH',
              estimated_hours: 5,
              order: 1
            },
            {
              title: 'Complete All Pending Subject Assignments',
              description: 'Finish lab reports and theory submissions 48 hours before deadline.',
              why_it_matters: 'Secures full internal assessment marks.',
              priority: 'HIGH',
              estimated_hours: 10,
              order: 2
            }
          ]
        },
        {
          title: 'Phase 2: Exam Preparation',
          milestones: [
            {
              title: 'Solve Past 5-Year Question Papers',
              description: 'Practice timed paper solving for core subjects.',
              why_it_matters: 'Familiarizes with faculty examination patterns.',
              priority: 'HIGH',
              estimated_hours: 14,
              order: 3
            },
            {
              title: 'Faculty Doubt Clearing Sessions',
              description: 'Attend office hours to resolve complex topics in weak subjects.',
              why_it_matters: 'Clarifies high-weightage topics prior to finals.',
              priority: 'MEDIUM',
              estimated_hours: 4,
              order: 4
            }
          ]
        }
      ]
    };
  }

  return {
    phases: [
      {
        title: 'Phase 1: Discovery & Fundamentals',
        milestones: [
          {
            title: `Learn Core Concepts for ${title}`,
            description: `Study key principles, terminology, and tools related to ${title}.`,
            why_it_matters: 'Establishes a solid knowledge base needed for advanced execution.',
            priority: 'HIGH',
            estimated_hours: 10,
            order: 1
          },
          {
            title: 'Set Up Environment & Tooling',
            description: 'Configure software, repositories, and study schedules.',
            why_it_matters: 'Removes friction and prepares workflow for practical projects.',
            priority: 'MEDIUM',
            estimated_hours: 4,
            order: 2
          }
        ]
      },
      {
        title: 'Phase 2: Practical Implementation',
        milestones: [
          {
            title: `Build Hands-On Project for ${title}`,
            description: 'Create a working project demonstrating applied skills.',
            why_it_matters: 'Converts theoretical learning into verifiable achievement.',
            priority: 'HIGH',
            estimated_hours: 15,
            order: 3
          }
        ]
      },
      {
        title: 'Phase 3: Review & Completion',
        milestones: [
          {
            title: 'Final Review & Target Goal Evaluation',
            description: 'Assess completion against target metrics and document outcomes.',
            why_it_matters: 'Validates full goal achievement and prepares next steps.',
            priority: 'HIGH',
            estimated_hours: 6,
            order: 4
          }
        ]
      }
    ]
  };
}

