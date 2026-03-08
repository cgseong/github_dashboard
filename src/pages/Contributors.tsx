// 기여자 분석 페이지 - 개별 기여자별 상세 분석
import { useState } from 'react';
import {
    Users,
    GitCommit,
    GitPullRequest,
    MessageSquare,
    Trophy,
    ChevronDown,
    ChevronUp,
    Code2,
    Star,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Legend,
} from 'recharts';
import type { ContributorStats, CommitData } from '../types';

interface ContributorsProps {
    contributorStats: ContributorStats[];
    commits: CommitData[];
}

/** 기여자 분석 페이지 */
export default function Contributors({ contributorStats, commits }: ContributorsProps) {
    // 선택된 기여자 (상세 보기용)
    const [selectedContributor, setSelectedContributor] = useState<string | null>(null);

    if (contributorStats.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-surface-200/50">데이터를 불러와주세요.</p>
            </div>
        );
    }

    // 최고 점수를 기준으로 정규화 (100점 만점)
    const maxScore = Math.max(...contributorStats.map(s => s.score), 1);

    // 기여자별 커밋 수 비교 차트 데이터
    const commitChartData = contributorStats
        .filter(s => s.totalCommits > 0)
        .slice(0, 10)
        .map(s => ({
            name: s.login,
            커밋: s.totalCommits,
            'PR 생성': s.prsCreated,
            'PR 병합': s.prsMerged,
            '코드 리뷰': s.prsReviewed,
        }));

    // 레이더 차트 데이터 (선택된 기여자)
    const getRadarData = (stat: ContributorStats) => {
        const normalize = (val: number, max: number) => Math.min(Math.round((val / Math.max(max, 1)) * 100), 100);
        const maxCommits = Math.max(...contributorStats.map(s => s.totalCommits), 1);
        const maxPRs = Math.max(...contributorStats.map(s => s.prsCreated), 1);
        const maxReviews = Math.max(...contributorStats.map(s => s.prsReviewed), 1);
        const maxIssues = Math.max(...contributorStats.map(s => s.issuesCreated), 1);
        const maxAdditions = Math.max(...contributorStats.map(s => s.totalAdditions), 1);

        return [
            { subject: '커밋', value: normalize(stat.totalCommits, maxCommits) },
            { subject: 'PR 생성', value: normalize(stat.prsCreated, maxPRs) },
            { subject: '코드 리뷰', value: normalize(stat.prsReviewed, maxReviews) },
            { subject: '이슈 활동', value: normalize(stat.issuesCreated, maxIssues) },
            { subject: '코드 기여량', value: normalize(stat.totalAdditions, maxAdditions) },
        ];
    };

    // 선택된 기여자의 커밋 기록
    const selectedStats = contributorStats.find(s => s.login === selectedContributor);
    const selectedCommits = selectedContributor
        ? commits.filter(c => c.author === selectedContributor).slice(0, 10)
        : [];

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="animate-fadeInUp">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary-400" />
                    기여자 분석
                </h2>
                <p className="text-sm text-surface-200/50 mt-1">팀원별 기여도 및 활동 비교</p>
            </div>

            {/* 기여자 순위 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {contributorStats.map((stat, index) => {
                    const normalizedScore = Math.round((stat.score / maxScore) * 100);
                    const isSelected = selectedContributor === stat.login;

                    return (
                        <div
                            key={stat.login}
                            className={`glass-card p-5 cursor-pointer animate-fadeInUp transition-all duration-300 ${isSelected ? 'ring-2 ring-primary-500/50 bg-primary-500/5' : ''
                                }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                            onClick={() => setSelectedContributor(isSelected ? null : stat.login)}
                        >
                            <div className="flex items-start gap-4">
                                {/* 순위 배지 */}
                                <div className="relative">
                                    <img
                                        src={stat.avatar_url}
                                        alt={stat.login}
                                        className="w-12 h-12 rounded-full ring-2 ring-white/10"
                                    />
                                    {index < 3 && (
                                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                                    'bg-amber-600 text-amber-100'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-white truncate">{stat.login}</h3>
                                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-400" />}
                                    </div>

                                    {/* 점수 바 */}
                                    <div className="mt-2 mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-surface-200/50">기여 점수</span>
                                            <span className="text-primary-400 font-medium">{normalizedScore}점</span>
                                        </div>
                                        <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700"
                                                style={{ width: `${normalizedScore}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* 미니 통계 */}
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="text-center">
                                            <div className="text-xs text-surface-200/40">
                                                <GitCommit className="w-3 h-3 mx-auto mb-0.5" />
                                            </div>
                                            <div className="text-xs font-medium text-white">{stat.totalCommits}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-surface-200/40">
                                                <GitPullRequest className="w-3 h-3 mx-auto mb-0.5" />
                                            </div>
                                            <div className="text-xs font-medium text-white">{stat.prsCreated}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-surface-200/40">
                                                <MessageSquare className="w-3 h-3 mx-auto mb-0.5" />
                                            </div>
                                            <div className="text-xs font-medium text-white">{stat.prsReviewed}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-surface-200/40">
                                                <Code2 className="w-3 h-3 mx-auto mb-0.5" />
                                            </div>
                                            <div className="text-xs font-medium text-white">
                                                +{stat.totalAdditions > 999 ? `${(stat.totalAdditions / 1000).toFixed(1)}k` : stat.totalAdditions}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 확장 아이콘 */}
                                <div className="text-surface-200/30">
                                    {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 기여자별 비교 차트 */}
            <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-warning-400" />
                    기여자 활동 비교
                </h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={commitChartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                            <XAxis
                                type="number"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
                                width={100}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(148,163,184,0.15)',
                                    borderRadius: '12px',
                                    color: '#e2e8f0',
                                    fontSize: '12px',
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Bar dataKey="커밋" fill="#818cf8" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="PR 생성" fill="#34d399" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="PR 병합" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="코드 리뷰" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 선택된 기여자 상세 정보 */}
            {selectedStats && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp">
                    {/* 레이더 차트 */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            {selectedStats.login}의 역량 분석
                        </h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={getRadarData(selectedStats)} cx="50%" cy="50%" outerRadius="70%">
                                    <PolarGrid stroke="rgba(148,163,184,0.15)" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    />
                                    <PolarRadiusAxis
                                        angle={90}
                                        domain={[0, 100]}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    />
                                    <Radar
                                        name={selectedStats.login}
                                        dataKey="value"
                                        stroke="#818cf8"
                                        fill="#818cf8"
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 최근 커밋 목록 */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            {selectedStats.login}의 최근 커밋
                        </h3>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {selectedCommits.map(c => (
                                <div
                                    key={c.sha}
                                    className="p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
                                >
                                    <p className="text-sm text-white truncate font-mono">{c.message}</p>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-200/50">
                                        <span>{new Date(c.date).toLocaleDateString('ko-KR')}</span>
                                        <span className="text-accent-400">+{c.additions}</span>
                                        <span className="text-danger-400">-{c.deletions}</span>
                                        <span>{c.filesChanged} files</span>
                                    </div>
                                </div>
                            ))}
                            {selectedCommits.length === 0 && (
                                <p className="text-sm text-surface-200/40 text-center py-4">
                                    해당 기간에 커밋이 없습니다.
                                </p>
                            )}
                        </div>

                        {/* 상세 통계 */}
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
                            <div className="text-center p-2 rounded-lg bg-white/3">
                                <div className="text-lg font-bold text-white">{selectedStats.totalCommits}</div>
                                <div className="text-xs text-surface-200/50">총 커밋</div>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-white/3">
                                <div className="text-lg font-bold text-white">{selectedStats.prsMerged}</div>
                                <div className="text-xs text-surface-200/50">PR 병합</div>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-white/3">
                                <div className="text-lg font-bold text-accent-400">+{selectedStats.totalAdditions.toLocaleString()}</div>
                                <div className="text-xs text-surface-200/50">라인 추가</div>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-white/3">
                                <div className="text-lg font-bold text-danger-400">-{selectedStats.totalDeletions.toLocaleString()}</div>
                                <div className="text-xs text-surface-200/50">라인 삭제</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
