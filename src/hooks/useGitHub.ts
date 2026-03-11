// GitHub 데이터를 관리하는 커스텀 훅
import { useState, useCallback } from 'react';
import type {
    PeriodType,
    RepoConfig,
    CommitData,
    PullRequestData,
    IssueData,
    ReviewData,
    Contributor,
    ContributorStats,
    DailyActivity,
    RepoSummary,
    WeeklyCodeChange,
    RepoTreeItem,
} from '../types';
import {
    fetchContributors,
    fetchCommits,
    fetchPullRequests,
    fetchIssues,
    fetchReviews,
    fetchRepoTree,
    fetchSubmodules,
    calculateContributorStats,
    calculateDailyActivity,
    calculateRepoSummary,
    calculateWeeklyCodeChanges,
} from '../services/github';

/** 훅의 반환 타입 */
interface UseGitHubReturn {
    loading: boolean;
    error: string | null;
    contributors: Contributor[];
    commits: CommitData[];
    pullRequests: PullRequestData[];
    issues: IssueData[];
    reviews: ReviewData[];
    contributorStats: ContributorStats[];
    dailyActivity: DailyActivity[];
    repoSummary: RepoSummary | null;
    weeklyCodeChanges: WeeklyCodeChange[];
    repoTree: RepoTreeItem[];
    loadData: (config: RepoConfig, period: PeriodType) => Promise<void>;
}

/** GitHub 데이터를 가져오고 관리하는 훅 */
export function useGitHub(): UseGitHubReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [commits, setCommits] = useState<CommitData[]>([]);
    const [pullRequests, setPullRequests] = useState<PullRequestData[]>([]);
    const [issues, setIssues] = useState<IssueData[]>([]);
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [contributorStats, setContributorStats] = useState<ContributorStats[]>([]);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [repoSummary, setRepoSummary] = useState<RepoSummary | null>(null);
    const [weeklyCodeChanges, setWeeklyCodeChanges] = useState<WeeklyCodeChange[]>([]);
    const [repoTree, setRepoTree] = useState<RepoTreeItem[]>([]);

    /** 데이터 로드 함수 */
    const loadData = useCallback(async (config: RepoConfig, period: PeriodType) => {
        setLoading(true);
        setError(null);

        try {
            // 0단계: 서브모듈 확인
            const submodules = await fetchSubmodules(config.token, config.owner, config.repo);
            const allRepos = [{owner: config.owner, repo: config.repo, path: ''}, ...submodules];

            // 1단계 & 2단계: 메인 레포지토리 및 서브모듈 데이터 병렬 로드
            const repoPromises = allRepos.map(async (r) => {
                const [contribs, commitData, prData, issueData, treeData] = await Promise.all([
                    fetchContributors(config.token, r.owner, r.repo),
                    fetchCommits(config.token, r.owner, r.repo, period),
                    fetchPullRequests(config.token, r.owner, r.repo, period),
                    fetchIssues(config.token, r.owner, r.repo, period),
                    fetchRepoTree(config.token, r.owner, r.repo),
                ]);
                const reviewData = await fetchReviews(config.token, r.owner, r.repo, prData);
                return { contribs, commitData, prData, issueData, treeData, reviewData, path: r.path };
            });

            const results = await Promise.all(repoPromises);

            // 데이터 취합
            const contribMap = new Map<string, Contributor>();
            const commitMap = new Map<string, CommitData>();
            let mergedPrData: PullRequestData[] = [];
            let mergedIssueData: IssueData[] = [];
            let mergedReviewData: ReviewData[] = [];
            let mergedTreeData: RepoTreeItem[] = [];

            results.forEach((res, index) => {
                // 기여자 병합
                res.contribs.forEach(c => {
                    const existing = contribMap.get(c.login);
                    if (existing) {
                        existing.contributions += c.contributions;
                    } else {
                        contribMap.set(c.login, { ...c });
                    }
                });

                // 커밋 병합 (SHA 중복 제거)
                res.commitData.forEach(c => {
                    if (!commitMap.has(c.sha)) {
                        commitMap.set(c.sha, c);
                    }
                });

                mergedPrData = mergedPrData.concat(res.prData);
                mergedIssueData = mergedIssueData.concat(res.issueData);
                mergedReviewData = mergedReviewData.concat(res.reviewData);

                // 트리 병합
                if (index === 0) {
                    mergedTreeData = res.treeData; // 메인 저장소 트리
                } else if (res.path) {
                    // 서브모듈 트리 병합
                    const pathParts = res.path.split('/');
                    let currentLevel = mergedTreeData;
                    
                    for (let i = 0; i < pathParts.length; i++) {
                        const part = pathParts[i];
                        const isLast = i === pathParts.length - 1;
                        
                        let node = currentLevel.find(n => n.name === part && n.type === 'tree');
                        if (!node) {
                            node = {
                                path: pathParts.slice(0, i + 1).join('/'),
                                name: part,
                                type: 'tree',
                                size: 0,
                                children: []
                            };
                            currentLevel.push(node);
                        }
                        
                        if (isLast) {
                            const prefixTree = (items: RepoTreeItem[], prefix: string): RepoTreeItem[] => {
                                return items.map(item => ({
                                    ...item,
                                    path: `${prefix}/${item.path}`,
                                    children: item.children ? prefixTree(item.children, prefix) : undefined
                                }));
                            };
                            node.children = prefixTree(res.treeData, res.path);
                        } else {
                            if (!node.children) node.children = [];
                            currentLevel = node.children;
                        }
                    }
                }
            });

            const contribs = Array.from(contribMap.values());
            const commitData = Array.from(commitMap.values()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const prData = mergedPrData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const issueData = mergedIssueData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const reviewData = mergedReviewData;
            const treeData = mergedTreeData;

            // 3단계: 통계 계산
            const stats = calculateContributorStats(contribs, commitData, prData, issueData, reviewData);
            const daily = calculateDailyActivity(commitData, prData, issueData, reviewData, period);
            const summary = calculateRepoSummary(commitData, prData, issueData, contribs, daily);
            const weeklyChanges = calculateWeeklyCodeChanges(commitData);

            // 상태 업데이트
            setContributors(contribs);
            setCommits(commitData);
            setPullRequests(prData);
            setIssues(issueData);
            setReviews(reviewData);
            setContributorStats(stats);
            setDailyActivity(daily);
            setRepoSummary(summary);
            setWeeklyCodeChanges(weeklyChanges);
            setRepoTree(treeData);
        } catch (err) {
            const message = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        contributors,
        commits,
        pullRequests,
        issues,
        reviews,
        contributorStats,
        dailyActivity,
        repoSummary,
        weeklyCodeChanges,
        repoTree,
        loadData,
    };
}
