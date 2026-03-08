// AI 평가 페이지 - 생성형 AI 기반 종합 평가
import { useState } from 'react';
import { Brain, Sparkles, Loader2, User, Award, Target, Lightbulb, AlertTriangle } from 'lucide-react';
import type { ContributorStats, RepoSummary, CommitData, PullRequestData, ReviewData } from '../types';

interface AIEvaluationProps {
    contributorStats: ContributorStats[];
    repoSummary: RepoSummary | null;
    commits: CommitData[];
    pullRequests: PullRequestData[];
    reviews: ReviewData[];
}

// AI 평가 결과 타입
interface EvalResult {
    contributor: string;
    avatar: string;
    score: number;
    codingPattern: string;
    collaborationStyle: string;
    strengths: string[];
    improvements: string[];
    summary: string;
}

// 로컬 AI 평가 생성 (API 없이도 동작)
function generateLocalEvaluation(
    stats: ContributorStats[],
    summary: RepoSummary | null,
    commits: CommitData[],
    prs: PullRequestData[],
    reviews: ReviewData[]
): EvalResult[] {
    if (!summary || stats.length === 0) return [];
    const maxScore = Math.max(...stats.map(s => s.score), 1);
    return stats.map(s => {
        const norm = Math.round((s.score / maxScore) * 100);
        const commitRatio = summary.totalCommits > 0 ? s.totalCommits / summary.totalCommits : 0;
        const prRatio = summary.totalPRs > 0 ? s.prsCreated / summary.totalPRs : 0;
        const userCommits = commits.filter(c => c.author === s.login);
        const avgAdditions = userCommits.length > 0 ? userCommits.reduce((a, c) => a + c.additions, 0) / userCommits.length : 0;
        const userReviews = reviews.filter(r => r.user === s.login);
        const userPRs = prs.filter(p => p.author === s.login);
        // 코딩 패턴 분석
        let codingPattern = '균형형';
        if (avgAdditions > 200) codingPattern = '대규모 변경형';
        else if (avgAdditions < 30 && s.totalCommits > 5) codingPattern = '점진적 개선형';
        else if (s.totalCommits > 10 && avgAdditions < 100) codingPattern = '빈번한 소규모 커밋형';
        // 협업 스타일
        let collaborationStyle = '독립 개발형';
        if (s.prsReviewed > 3 && s.prsCreated > 2) collaborationStyle = '적극적 협업형';
        else if (s.prsReviewed > s.prsCreated) collaborationStyle = '리뷰 중심형';
        else if (s.prsCreated > 3 && s.prsReviewed < 2) collaborationStyle = 'PR 창출형';
        else if (s.issuesCreated > 3) collaborationStyle = '이슈 관리형';
        // 강점
        const strengths: string[] = [];
        if (commitRatio > 0.3) strengths.push('팀 내 높은 코드 기여율');
        if (s.prsReviewed > 2) strengths.push('적극적인 코드 리뷰 참여');
        if (s.prsMerged > 2) strengths.push('PR 병합 실적 우수');
        if (s.issuesCreated > 2) strengths.push('이슈 관리에 적극적');
        if (avgAdditions > 0 && avgAdditions < 100) strengths.push('적절한 커밋 크기 유지');
        if (userPRs.some(p => p.comments > 3)) strengths.push('활발한 PR 토론 참여');
        if (userReviews.some(r => r.body && r.body.length > 50)) strengths.push('상세한 리뷰 코멘트 작성');
        if (strengths.length === 0) strengths.push('꾸준한 참여');
        // 개선점
        const improvements: string[] = [];
        if (s.prsReviewed < 1) improvements.push('코드 리뷰 참여를 늘려보세요');
        if (s.totalCommits > 0 && s.prsCreated < 1) improvements.push('PR을 통한 코드 기여를 시작해보세요');
        if (avgAdditions > 300) improvements.push('커밋 크기를 줄여 리뷰 효율을 높여보세요');
        if (s.issuesCreated < 1) improvements.push('이슈를 활용한 작업 관리를 권장합니다');
        if (prRatio < 0.1 && s.totalCommits > 0) improvements.push('PR 기반 워크플로우를 더 활용해보세요');
        if (improvements.length === 0) improvements.push('현재 수준을 유지하세요');
        // 요약
        const summary2 = `${s.login}님은 ${codingPattern} 코딩 패턴을 보이며, ${collaborationStyle} 성향의 협업 스타일을 가지고 있습니다. ` +
            `총 ${s.totalCommits}개의 커밋과 ${s.prsCreated}개의 PR을 생성했으며, ${s.prsReviewed}건의 코드 리뷰에 참여했습니다. ` +
            `종합 기여도 점수는 ${norm}점입니다.`;
        return { contributor: s.login, avatar: s.avatar_url, score: norm, codingPattern, collaborationStyle, strengths, improvements, summary: summary2 };
    });
}

export default function AIEvaluation({ contributorStats, repoSummary, commits, pullRequests, reviews }: AIEvaluationProps) {
    const [evaluations, setEvaluations] = useState<EvalResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const handleGenerate = () => {
        setLoading(true);
        setTimeout(() => {
            const results = generateLocalEvaluation(contributorStats, repoSummary, commits, pullRequests, reviews);
            setEvaluations(results);
            setGenerated(true);
            setLoading(false);
            if (results.length > 0) setSelectedUser(results[0].contributor);
        }, 1500);
    };

    if (contributorStats.length === 0) {
        return <div className="flex items-center justify-center h-64"><p className="text-surface-200/50">데이터를 불러와주세요.</p></div>;
    }

    const selected = evaluations.find(e => e.contributor === selectedUser);

    return (
        <div className="space-y-6">
            <div className="animate-fadeInUp">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Brain className="w-6 h-6 text-primary-400" />AI 종합 평가</h2>
                <p className="text-sm text-surface-200/50 mt-1">생성형 AI 기반 협업 참여도 및 코딩 패턴 분석</p>
            </div>

            {!generated ? (
                <div className="glass-card p-8 text-center animate-fadeInUp">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">AI 평가 생성</h3>
                    <p className="text-sm text-surface-200/50 mb-6 max-w-md mx-auto">
                        수집된 데이터를 기반으로 각 기여자의 코딩 패턴, 협업 스타일, 강점 및 개선점을 AI가 종합 분석합니다.
                    </p>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white font-medium hover:from-primary-500 hover:to-accent-400 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/20 flex items-center gap-2 mx-auto"
                    >
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" />분석 중...</> : <><Sparkles className="w-5 h-5" />평가 생성하기</>}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 기여자 리스트 */}
                    <div className="glass-card p-4 space-y-2 lg:col-span-1">
                        <h3 className="text-sm font-semibold text-surface-200/60 px-2 mb-2">기여자 목록</h3>
                        {evaluations.map((ev, i) => (
                            <button key={ev.contributor} onClick={() => setSelectedUser(ev.contributor)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left animate-fadeInUp ${selectedUser === ev.contributor ? 'bg-primary-500/15 border border-primary-500/20' : 'hover:bg-white/5'
                                    }`} style={{ animationDelay: `${i * 50}ms` }}>
                                <img src={ev.avatar} alt={ev.contributor} className="w-9 h-9 rounded-full ring-2 ring-white/10" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">{ev.contributor}</div>
                                    <div className="text-xs text-surface-200/50">{ev.codingPattern}</div>
                                </div>
                                <div className={`text-sm font-bold ${ev.score >= 80 ? 'text-accent-400' : ev.score >= 50 ? 'text-warning-400' : 'text-surface-200/60'}`}>
                                    {ev.score}점
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* 상세 평가 */}
                    {selected && (
                        <div className="lg:col-span-2 space-y-4 animate-fadeInUp">
                            {/* 헤더 */}
                            <div className="glass-card p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={selected.avatar} alt={selected.contributor} className="w-14 h-14 rounded-full ring-2 ring-primary-500/30" />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{selected.contributor}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-300">{selected.codingPattern}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-300">{selected.collaborationStyle}</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto text-center">
                                        <div className={`text-3xl font-bold ${selected.score >= 80 ? 'text-accent-400' : selected.score >= 50 ? 'text-warning-400' : 'text-danger-400'}`}>{selected.score}</div>
                                        <div className="text-xs text-surface-200/50">종합 점수</div>
                                    </div>
                                </div>
                                {/* 점수 바 */}
                                <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-1000" style={{ width: `${selected.score}%` }} />
                                </div>
                            </div>

                            {/* 요약 */}
                            <div className="glass-card p-5">
                                <div className="flex items-center gap-2 mb-3"><User className="w-4 h-4 text-primary-400" /><h4 className="text-sm font-semibold text-white">종합 요약</h4></div>
                                <p className="text-sm text-surface-200/70 leading-relaxed">{selected.summary}</p>
                            </div>

                            {/* 강점 & 개선점 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-card p-5">
                                    <div className="flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-accent-400" /><h4 className="text-sm font-semibold text-white">강점</h4></div>
                                    <ul className="space-y-2">
                                        {selected.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-surface-200/70">
                                                <Lightbulb className="w-3.5 h-3.5 text-accent-400 mt-0.5 shrink-0" />{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="glass-card p-5">
                                    <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-warning-400" /><h4 className="text-sm font-semibold text-white">개선 제안</h4></div>
                                    <ul className="space-y-2">
                                        {selected.improvements.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-surface-200/70">
                                                <AlertTriangle className="w-3.5 h-3.5 text-warning-400 mt-0.5 shrink-0" />{s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
