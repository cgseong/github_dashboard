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
            // 1단계: 기본 데이터 병렬 로드
            const [contribs, commitData, prData, issueData, treeData] = await Promise.all([
                fetchContributors(config.token, config.owner, config.repo),
                fetchCommits(config.token, config.owner, config.repo, period),
                fetchPullRequests(config.token, config.owner, config.repo, period),
                fetchIssues(config.token, config.owner, config.repo, period),
                fetchRepoTree(config.token, config.owner, config.repo),
            ]);

            // 2단계: PR 기반 리뷰 데이터 로드
            const reviewData = await fetchReviews(config.token, config.owner, config.repo, prData);

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
