export type UniversitySubjectRecord = {
  id: string;
  region: string;
  location: string;
  university: string;
  college: string;
  major: string;
  unit: string;
  core: string;
  recommended: string;
  coreSubjects: string[];
  recommendedSubjects: string[];
  note: string;
};

export type SubjectRecommendationPlan = {
  summary: string;
  grade2: {
    subject: string;
    reason: string;
    priority: 'core' | 'recommended' | 'supporting';
  }[];
  grade3: {
    subject: string;
    reason: string;
    priority: 'core' | 'recommended' | 'supporting';
  }[];
  cautions: string[];
  evidence: string[];
};
