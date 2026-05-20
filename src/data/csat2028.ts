const CSAT_2028_SUBJECTS = new Set([
  '화법과언어',
  '독서와작문',
  '문학',
  '대수',
  '미적분1',
  '확률과통계',
  '영어1',
  '영어2',
  '영어독해와작문',
  '한국사',
  '한국사1',
  '한국사2',
  '통합사회',
  '통합사회1',
  '통합사회2',
  '통합과학',
  '통합과학1',
  '통합과학2',
]);

export function normalizeCsatSubjectName(name: string) {
  return name
    .replace(/\s+/g, '')
    .replace(/II/g, '2')
    .replace(/I/g, '1')
    .replace(/Ⅰ/g, '1')
    .replace(/Ⅱ/g, '2')
    .replace(/Ⅲ/g, '3')
    .replace(/Ⅳ/g, '4')
    .replace(/Ⅴ/g, '5')
    .replace(/Ⅵ/g, '6')
    .replace(/Ⅶ/g, '7')
    .replace(/Ⅷ/g, '8')
    .replace(/Ⅸ/g, '9')
    .replace(/Ⅹ/g, '10')
    .toLowerCase();
}

export function isCsat2028Subject(name: string) {
  return CSAT_2028_SUBJECTS.has(normalizeCsatSubjectName(name));
}
