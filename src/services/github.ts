// GitHub API 서비스 - 저장소 데이터를 가져오는 함수들
import { Octokit } from '@octokit/rest';
import type {
    PeriodType,
    CommitData,
    PullRequestData,
    IssueData,
    ReviewData,
    ContributorStats,
    DailyActivity,
    RepoSummary,
    WeeklyCodeChange,
    Contributor,
    RepoTreeItem,
} from '../types';

/** 기간에 따른 시작 날짜 계산 */
function getStartDate(period: PeriodType): Date {
    const now = new Date();
    switch (period) {
        case '1w': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '1m': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '2m': return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        case '3m': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        case '6m': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
}

/** Octokit 인스턴스 생성 */
function createOctokit(token: string): Octokit {
    return new Octokit({ auth: token });
}

/** 모든 페이지네이션된 결과를 가져오는 헬퍼 */
async function fetchAllPages<T>(
    _octokit: Octokit,
    method: (params: Record<string, unknown>) => Promise<{ data: T[] }>,
    params: Record<string, unknown>,
    maxPages: number = 5
): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (page <= maxPages) {
        try {
            const { data } = await method({ ...params, per_page: 100, page });
            if (data.length === 0) break;
            results.push(...data);
            if (data.length < 100) break;
            page++;
        } catch {
            break;
        }
    }

    return results;
}

/** 서브모듈 정보 가져오기 */
export async function fetchSubmodules(
    token: string, owner: string, repo: string
): Promise<{owner: string, repo: string, path: string}[]> {
    const octokit = createOctokit(token);
    try {
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: '.gitmodules',
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fileData = data as any;
        if (!Array.isArray(fileData) && fileData.type === 'file' && fileData.content) {
            // Base64 디코딩 (브라우저 환경 지원, 줄바꿈 제거)
            const textContent = decodeURIComponent(escape(window.atob(fileData.content.replace(/\n/g, ''))));
            const lines = textContent.split('\n');
            const submodules: {owner: string, repo: string, path: string}[] = [];
            
            let currentPath = '';
            for (const line of lines) {
                const pathMatch = line.match(/^\s*path\s*=\s*(.+?)\s*$/);
                if (pathMatch) {
                    currentPath = pathMatch[1];
                }
                
                const urlMatch = line.match(/^\s*url\s*=\s*(?:https:\/\/github\.com\/|git@github\.com:)([^/]+)\/(.+?)(?:\.git)?\s*$/);
                if (urlMatch && currentPath) {
                    submodules.push({
                        owner: urlMatch[1],
                        repo: urlMatch[2],
                        path: currentPath
                    });
                    currentPath = '';
                }
            }
            return submodules;
        }
    } catch {
        // .gitmodules 없거나 실패 시 무시
    }
    return [];
}

/** 기여자 목록 조회 */
export async function fetchContributors(
    token: string, owner: string, repo: string
): Promise<Contributor[]> {
    const octokit = createOctokit(token);

    const { data } = await octokit.repos.listContributors({
        owner, repo, per_page: 100,
    });

    return (data || []).map((c: Record<string, unknown>) => ({
        login: c.login as string,
        avatar_url: c.avatar_url as string,
        html_url: c.html_url as string,
        contributions: c.contributions as number,
    }));
}

/** 커밋 데이터 조회 */
export async function fetchCommits(
    token: string, owner: string, repo: string, period: PeriodType
): Promise<CommitData[]> {
    const octokit = createOctokit(token);
    const since = getStartDate(period).toISOString();

    const commits = await fetchAllPages(
        octokit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((p: any) => octokit.repos.listCommits(p)) as any,
        { owner, repo, since }
    );

    // 각 커밋의 상세 정보 가져오기 (병렬, 최대 50개)
    const limited = commits.slice(0, 50);
    const detailed = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        limited.map(async (c: any) => {
            try {
                const { data } = await octokit.repos.getCommit({
                    owner, repo, ref: c.sha,
                });
                return {
                    sha: c.sha,
                    message: c.commit?.message || '',
                    author: c.author?.login || c.commit?.author?.name || 'unknown',
                    authorAvatar: c.author?.avatar_url || '',
                    date: c.commit?.author?.date || '',
                    additions: data.stats?.additions || 0,
                    deletions: data.stats?.deletions || 0,
                    filesChanged: data.files?.length || 0,
                };
            } catch {
                return {
                    sha: c.sha,
                    message: c.commit?.message || '',
                    author: c.author?.login || c.commit?.author?.name || 'unknown',
                    authorAvatar: c.author?.avatar_url || '',
                    date: c.commit?.author?.date || '',
                    additions: 0,
                    deletions: 0,
                    filesChanged: 0,
                };
            }
        })
    );

    return detailed;
}

/** PR 데이터 조회 */
export async function fetchPullRequests(
    token: string, owner: string, repo: string, period: PeriodType
): Promise<PullRequestData[]> {
    const octokit = createOctokit(token);
    const since = getStartDate(period);

    const prs = await fetchAllPages(
        octokit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((p: any) => octokit.pulls.list(p)) as any,
        { owner, repo, state: 'all', sort: 'created', direction: 'desc' }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return prs.filter((pr: any) => new Date(pr.created_at) >= since).map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.merged_at ? 'merged' : pr.state,
        author: pr.user?.login || 'unknown',
        authorAvatar: pr.user?.avatar_url || '',
        createdAt: pr.created_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
        additions: pr.additions || 0,
        deletions: pr.deletions || 0,
        reviewComments: pr.review_comments || 0,
        comments: pr.comments || 0,
    }));
}

/** 이슈 데이터 조회 */
export async function fetchIssues(
    token: string, owner: string, repo: string, period: PeriodType
): Promise<IssueData[]> {
    const octokit = createOctokit(token);
    const since = getStartDate(period).toISOString();

    const issues = await fetchAllPages(
        octokit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((p: any) => octokit.issues.listForRepo(p)) as any,
        { owner, repo, state: 'all', since, sort: 'created', direction: 'desc' }
    );

    // PR이 아닌 순수 이슈만 필터링
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return issues.filter((i: any) => !i.pull_request).map((i: any) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        author: i.user?.login || 'unknown',
        authorAvatar: i.user?.avatar_url || '',
        createdAt: i.created_at,
        closedAt: i.closed_at,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        labels: (i.labels || []).map((l: any) => (typeof l === 'string' ? l : l.name)),
        comments: i.comments || 0,
    }));
}

/** 리뷰 데이터 조회 */
export async function fetchReviews(
    token: string, owner: string, repo: string, prs: PullRequestData[]
): Promise<ReviewData[]> {
    const octokit = createOctokit(token);
    const reviews: ReviewData[] = [];

    // 최대 20개 PR의 리뷰만 가져오기
    const limited = prs.slice(0, 20);

    await Promise.all(
        limited.map(async (pr) => {
            try {
                const { data } = await octokit.pulls.listReviews({
                    owner, repo, pull_number: pr.number,
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data.forEach((r: any) => {
                    reviews.push({
                        id: r.id,
                        user: r.user?.login || 'unknown',
                        userAvatar: r.user?.avatar_url || '',
                        state: r.state,
                        body: r.body || '',
                        submittedAt: r.submitted_at || '',
                        prNumber: pr.number,
                    });
                });
            } catch {
                // 리뷰 가져오기 실패 시 무시
            }
        })
    );

    return reviews;
}

/** 기여자별 통계 계산 */
export function calculateContributorStats(
    contributors: Contributor[],
    commits: CommitData[],
    prs: PullRequestData[],
    issues: IssueData[],
    reviews: ReviewData[]
): ContributorStats[] {
    const statsMap = new Map<string, ContributorStats>();

    // 기여자 초기화
    contributors.forEach(c => {
        statsMap.set(c.login, {
            login: c.login,
            avatar_url: c.avatar_url,
            totalCommits: 0,
            totalAdditions: 0,
            totalDeletions: 0,
            prsCreated: 0,
            prsMerged: 0,
            prsReviewed: 0,
            issuesCreated: 0,
            issuesClosed: 0,
            reviewComments: 0,
            score: 0,
        });
    });

    // 커밋 통계
    commits.forEach(c => {
        const stat = statsMap.get(c.author);
        if (stat) {
            stat.totalCommits++;
            stat.totalAdditions += c.additions;
            stat.totalDeletions += c.deletions;
        }
    });

    // PR 통계
    prs.forEach(pr => {
        const stat = statsMap.get(pr.author);
        if (stat) {
            stat.prsCreated++;
            if (pr.state === 'merged') stat.prsMerged++;
        }
    });

    // 이슈 통계
    issues.forEach(i => {
        const stat = statsMap.get(i.author);
        if (stat) {
            stat.issuesCreated++;
            if (i.state === 'closed') stat.issuesClosed++;
        }
    });

    // 리뷰 통계
    reviews.forEach(r => {
        const stat = statsMap.get(r.user);
        if (stat) {
            stat.prsReviewed++;
            if (r.body) stat.reviewComments++;
        }
    });

    // 종합 점수 계산 (가중치 기반)
    const allStats = Array.from(statsMap.values());
    allStats.forEach(s => {
        s.score = Math.round(
            s.totalCommits * 3 +
            s.prsCreated * 5 +
            s.prsMerged * 8 +
            s.prsReviewed * 4 +
            s.issuesCreated * 2 +
            s.issuesClosed * 3 +
            s.reviewComments * 2 +
            Math.min(s.totalAdditions, 5000) * 0.01 +
            Math.min(s.totalDeletions, 3000) * 0.005
        );
    });

    return allStats.sort((a, b) => b.score - a.score);
}

/** 일별 활동 데이터 계산 */
export function calculateDailyActivity(
    commits: CommitData[],
    prs: PullRequestData[],
    issues: IssueData[],
    reviews: ReviewData[],
    period: PeriodType
): DailyActivity[] {
    const startDate = getStartDate(period);
    const endDate = new Date();
    const activityMap = new Map<string, DailyActivity>();

    // 기간 내 모든 날짜 초기화
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        activityMap.set(dateStr, {
            date: dateStr,
            commits: 0,
            prsOpened: 0,
            prsMerged: 0,
            issuesOpened: 0,
            issuesClosed: 0,
            reviews: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 커밋 집계
    commits.forEach(c => {
        const dateStr = c.date.split('T')[0];
        const activity = activityMap.get(dateStr);
        if (activity) activity.commits++;
    });

    // PR 집계
    prs.forEach(pr => {
        const createdDate = pr.createdAt.split('T')[0];
        const activity = activityMap.get(createdDate);
        if (activity) activity.prsOpened++;

        if (pr.mergedAt) {
            const mergedDate = pr.mergedAt.split('T')[0];
            const mergedActivity = activityMap.get(mergedDate);
            if (mergedActivity) mergedActivity.prsMerged++;
        }
    });

    // 이슈 집계
    issues.forEach(i => {
        const createdDate = i.createdAt.split('T')[0];
        const activity = activityMap.get(createdDate);
        if (activity) activity.issuesOpened++;

        if (i.closedAt) {
            const closedDate = i.closedAt.split('T')[0];
            const closedActivity = activityMap.get(closedDate);
            if (closedActivity) closedActivity.issuesClosed++;
        }
    });

    // 리뷰 집계
    reviews.forEach(r => {
        if (r.submittedAt) {
            const dateStr = r.submittedAt.split('T')[0];
            const activity = activityMap.get(dateStr);
            if (activity) activity.reviews++;
        }
    });

    return Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** 저장소 요약 통계 계산 */
export function calculateRepoSummary(
    commits: CommitData[],
    prs: PullRequestData[],
    issues: IssueData[],
    contributors: Contributor[],
    dailyActivity: DailyActivity[]
): RepoSummary {
    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);

    // 가장 활동적인 날 찾기
    const mostActiveDay = dailyActivity.reduce((max, d) =>
        (d.commits + d.prsOpened + d.issuesOpened) > (max.commits + max.prsOpened + max.issuesOpened)
            ? d : max
        , dailyActivity[0] || { date: '-', commits: 0, prsOpened: 0, issuesOpened: 0 });

    const daysCount = Math.max(dailyActivity.length, 1);

    return {
        totalCommits: commits.length,
        totalPRs: prs.length,
        mergedPRs: prs.filter(p => p.state === 'merged').length,
        openPRs: prs.filter(p => p.state === 'open').length,
        closedPRs: prs.filter(p => p.state === 'closed').length,
        totalIssues: issues.length,
        openIssues: issues.filter(i => i.state === 'open').length,
        closedIssues: issues.filter(i => i.state === 'closed').length,
        totalContributors: contributors.length,
        totalAdditions,
        totalDeletions,
        mostActiveDay: mostActiveDay?.date || '-',
        avgCommitsPerDay: Math.round((commits.length / daysCount) * 10) / 10,
    };
}

/** 주간 코드 변경 추이 계산 */
export function calculateWeeklyCodeChanges(commits: CommitData[]): WeeklyCodeChange[] {
    const weekMap = new Map<string, WeeklyCodeChange>();

    commits.forEach(c => {
        const date = new Date(c.date);
        // 해당 주의 월요일 날짜를 계산
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        const weekStr = monday.toISOString().split('T')[0];

        if (!weekMap.has(weekStr)) {
            weekMap.set(weekStr, { week: weekStr, additions: 0, deletions: 0 });
        }

        const week = weekMap.get(weekStr)!;
        week.additions += c.additions;
        week.deletions += c.deletions;
    });

    return Array.from(weekMap.values()).sort((a, b) => a.week.localeCompare(b.week));
}

/** 저장소 트리 구조 가져오기 (기본 브랜치 기준) */
export async function fetchRepoTree(
    token: string, owner: string, repo: string
): Promise<RepoTreeItem[]> {
    const octokit = createOctokit(token);

    try {
        // 기본 브랜치 정보 가져오기
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const defaultBranch = repoData.default_branch || 'main';

        // Git Tree API로 전체 트리 가져오기 (recursive)
        const { data: treeData } = await octokit.git.getTree({
            owner,
            repo,
            tree_sha: defaultBranch,
            recursive: '1',
        });

        // 플랫 리스트를 계층적 트리 구조로 변환
        const root: RepoTreeItem[] = [];
        const nodeMap = new Map<string, RepoTreeItem>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (treeData.tree || []).map((item: any) => ({
            path: item.path as string,
            name: (item.path as string).split('/').pop() || item.path as string,
            type: ((item.type === 'commit' || item.type === 'tree') ? 'tree' : 'blob') as 'tree' | 'blob',
            size: (item.size as number) || 0,
            children: (item.type === 'tree' || item.type === 'commit') ? [] : undefined,
        }));

        // 모든 노드를 맵에 등록
        items.forEach((item: RepoTreeItem) => {
            nodeMap.set(item.path, item);
        });

        // 부모-자식 관계 설정
        items.forEach((item: RepoTreeItem) => {
            const lastSlash = item.path.lastIndexOf('/');
            if (lastSlash === -1) {
                // 루트 레벨 항목
                root.push(item);
            } else {
                // 부모 폴더 찾기
                const parentPath = item.path.substring(0, lastSlash);
                const parent = nodeMap.get(parentPath);
                if (parent && parent.children) {
                    parent.children.push(item);
                }
            }
        });

        // 정렬: 폴더 먼저, 그 다음 파일 (각각 이름순)
        const sortTree = (nodes: RepoTreeItem[]) => {
            nodes.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            nodes.forEach(n => { if (n.children) sortTree(n.children); });
        };
        sortTree(root);

        return root;
    } catch (err) {
        console.error('트리 구조를 가져오는 중 오류:', err);
        return [];
    }
}
