// GitHub 데이터 관련 타입 정의

/** 기간 선택 옵션 타입 */
export type PeriodType = '1w' | '1m' | '2m' | '3m' | '6m';

/** 기간 라벨 매핑 */
export const PERIOD_LABELS: Record<PeriodType, string> = {
    '1w': '최근 1주일',
    '1m': '최근 1개월',
    '2m': '최근 2개월',
    '3m': '최근 3개월',
    '6m': '최근 6개월',
};

/** 기여자 정보 */
export interface Contributor {
    login: string;
    avatar_url: string;
    html_url: string;
    contributions: number;
}

/** 커밋 정보 */
export interface CommitData {
    sha: string;
    message: string;
    author: string;
    authorAvatar: string;
    date: string;
    additions: number;
    deletions: number;
    filesChanged: number;
}

/** PR 정보 */
export interface PullRequestData {
    number: number;
    title: string;
    state: string;
    author: string;
    authorAvatar: string;
    createdAt: string;
    mergedAt: string | null;
    closedAt: string | null;
    additions: number;
    deletions: number;
    reviewComments: number;
    comments: number;
}

/** 이슈 정보 */
export interface IssueData {
    number: number;
    title: string;
    state: string;
    author: string;
    authorAvatar: string;
    createdAt: string;
    closedAt: string | null;
    labels: string[];
    comments: number;
}

/** 코드 리뷰 데이터 */
export interface ReviewData {
    id: number;
    user: string;
    userAvatar: string;
    state: string;
    body: string;
    submittedAt: string;
    prNumber: number;
}

/** 기여자 통계 */
export interface ContributorStats {
    login: string;
    avatar_url: string;
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    prsCreated: number;
    prsMerged: number;
    prsReviewed: number;
    issuesCreated: number;
    issuesClosed: number;
    reviewComments: number;
    score: number;
}

/** 일별 활동 데이터 */
export interface DailyActivity {
    date: string;
    commits: number;
    prsOpened: number;
    prsMerged: number;
    issuesOpened: number;
    issuesClosed: number;
    reviews: number;
}

/** 저장소 요약 통계 */
export interface RepoSummary {
    totalCommits: number;
    totalPRs: number;
    mergedPRs: number;
    openPRs: number;
    closedPRs: number;
    totalIssues: number;
    openIssues: number;
    closedIssues: number;
    totalContributors: number;
    totalAdditions: number;
    totalDeletions: number;
    mostActiveDay: string;
    avgCommitsPerDay: number;
}

/** 주간 코드 변경 추이 */
export interface WeeklyCodeChange {
    week: string;
    additions: number;
    deletions: number;
}

/** AI 평가 결과 */
export interface AIEvaluation {
    contributor: string;
    overallScore: number;
    codingPattern: string;
    collaborationStyle: string;
    strengths: string[];
    improvements: string[];
    summary: string;
}

/** 저장소 설정 (단일 팀용 - 내부 API 호출에 사용) */
export interface RepoConfig {
    owner: string;
    repo: string;
    token: string;
}

/** 팀 설정 */
export interface TeamConfig {
    id: string;        // 고유 식별자
    teamName: string;  // 팀 이름 (예: "1팀")
    owner: string;     // 저장소 소유자
    repo: string;      // 저장소 이름
}

/** 수업/프로젝트 설정 */
export interface CourseConfig {
    id: string;              // 고유 식별자
    courseName: string;      // 수업 이름
    token: string;           // 공통 GitHub 토큰
    teams: TeamConfig[];     // 등록된 팀 목록
}

/** GitHub API 응답의 일관된 에러 타입 */
export interface GitHubError {
    message: string;
    status?: number;
}

/** 저장소 트리 구조 항목 */
export interface RepoTreeItem {
    path: string;          // 파일/폴더 경로
    name: string;          // 파일/폴더 이름
    type: 'tree' | 'blob'; // tree = 폴더, blob = 파일
    size: number;          // 파일 크기 (바이트, 폴더는 0)
    children?: RepoTreeItem[]; // 하위 항목 (폴더인 경우)
}

