export type CompKey = 'academic' | 'career' | 'community';

export type ActivityEval = {
  score: number;
  stars: number;
  why: string;
  fix: string;
};

export type Activity = {
  name: string;
  type: string;
  typeTone: string;
  subject: string;
  summary: string;
  eval: { academic: ActivityEval; career: ActivityEval; community: ActivityEval };
};

export type SegibuAnalysis = {
  studentName: string;
  school: string;
  grade: string;
  targetDept: string;
  radar: { compKey: CompKey; value: number }[];
  totalScore: number;
  percentile: string;
  aiComment: string;
  words: { text: string; size: number }[];
  stats: { subjectCount: number; keywordCount: number };
  competencies: { compKey: CompKey; title: string; score: number; items: string[] }[];
  activities: Activity[];
  yearlySubjects: {
    '1': { name: string; score: string; keyword: string }[];
    '2': { name: string; score: string; keyword: string }[];
    '3': { name: string; score: string; keyword: string }[];
  };
  reportSections: { num: number; title: string; compKey: CompKey; good: string; fix: string }[];
  suggestions: { title: string; desc: string; c: CompKey }[];
};
