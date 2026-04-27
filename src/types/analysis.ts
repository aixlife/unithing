export type CompKey = 'academic' | 'career' | 'community';

// ── 원본 생기부 분석 타입 (생기부-분석-ai-리포트_ver-최종-완성2 기준) ──

export interface CategoryGrades {
  s1_1: number | null;
  s1_2: number | null;
  s2_1: number | null;
  s2_2: number | null;
  s3_1: number | null;
  avg: number | null;
}

export interface GradeMatrix {
  korean: CategoryGrades;
  math: CategoryGrades;
  english: CategoryGrades;
  social: CategoryGrades;
  science: CategoryGrades;
  others: CategoryGrades;
  total: CategoryGrades;
}

export interface CompHighlight {
  academic: string;
  career: string;
  community: string;
}

export interface YearHighlights {
  y1: CompHighlight;
  y2: CompHighlight;
  y3: CompHighlight;
}

export interface YearData {
  y1: string;
  y2: string;
  y3: string;
}

export interface ReadinessIssue {
  competency: 'academic' | 'career' | 'community';
  issue: string;
  evidence: string;
  recommendation: string;
}

export interface RoadmapAction {
  priority: 1 | 2 | 3 | 4 | 5;
  action: string;
  linkedService: 'university' | 'subject' | 'seteuk' | 'report';
  reason: string;
}

export interface AnalysisReliability {
  confidence: 'high' | 'medium' | 'low';
  missingData: string[];
  notes: string;
}

export interface AdmissionsReadiness {
  overall: string;
  criticalWeaknesses: ReadinessIssue[];
  nextActions: RoadmapAction[];
  reliability: AnalysisReliability;
}

export interface SegibuAnalysis {
  report: string;                  // 마크다운 심층 분석 리포트
  scores: {
    academic: number;
    career: number;
    community: number;
  };
  grades: GradeMatrix;
  groupAverages: {
    all: number | null;
    kems: number | null;
    kemSo: number | null;
    kemSc: number | null;
  };
  summaryHighlights: {
    academic: string;
    career: string;
    community: string;
  };
  futureStrategy: {
    deepDive: string;
    subjects: string;
  };
  admissionsReadiness?: AdmissionsReadiness;
  highlights: {
    changche: {
      individual: YearHighlights;
      club: YearHighlights;
      career_act: YearHighlights;
    };
    curriculum: {
      korean: YearHighlights;
      math: YearHighlights;
      english: YearHighlights;
      social: YearHighlights;
      science: YearHighlights;
      liberal: YearHighlights;
      arts_phys: YearHighlights;
    };
    behavior: YearHighlights;
  };
  structuredData: {
    changche: {
      individual: YearData;
      club: YearData;
      career_act: YearData;
    };
    curriculum: {
      korean: YearData;
      math: YearData;
      english: YearData;
      social: YearData;
      science: YearData;
      liberal: YearData;
      arts_phys: YearData;
    };
    behavior: YearData;
  };
  // 메타 (선택)
  studentName?: string;
  school?: string;
  grade?: string;
  targetDept?: string;
}
