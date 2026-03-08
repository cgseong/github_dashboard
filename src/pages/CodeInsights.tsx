// 코드 인사이트 페이지
import { Code2, TrendingUp, Activity, FileCode, GitBranch } from 'lucide-react';
import {
    Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line,
} from 'recharts';
import type { WeeklyCodeChange, DailyActivity, CommitData, ContributorStats } from '../types';

interface CodeInsightsProps {
    weeklyCodeChanges: WeeklyCodeChange[];
    dailyActivity: DailyActivity[];
    commits: CommitData[];
    contributorStats: ContributorStats[];
}

// 히트맵 셀 색상 등급
function getHeatmapLevel(value: number, max: number): number {
    if (value === 0) return 0;
    const ratio = value / max;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

// 공통 툴팁 스타일
const tooltipStyle = {
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '12px',
};

export default function CodeInsights({ weeklyCodeChanges, dailyActivity, commits, contributorStats }: CodeInsightsProps) {
    if (dailyActivity.length === 0) {
        return <div className="flex items-center justify-center h-64"><p className="text-surface-200/50">데이터를 불러와주세요.</p></div>;
    }

    const weeklyChartData = weeklyCodeChanges.map(w => ({ ...w, label: w.week.slice(5), 순변경: w.additions - w.deletions }));
    const dailyChartData = dailyActivity.map(d => ({
        ...d,
        label: `${new Date(d.date).getMonth() + 1}/${new Date(d.date).getDate()}`,
        총활동: d.commits + d.prsOpened + d.prsMerged + d.issuesOpened + d.reviews,
    }));

    const maxDailyCommits = Math.max(...dailyActivity.map(d => d.commits), 1);
    const weeks: DailyActivity[][] = [];
    let currentWeek: DailyActivity[] = [];
    dailyActivity.forEach((d, i) => {
        currentWeek.push(d);
        if ((i + 1) % 7 === 0 || i === dailyActivity.length - 1) { weeks.push([...currentWeek]); currentWeek = []; }
    });

    const fileChangeData = contributorStats.slice(0, 8).map(s => ({ name: s.login, 추가: s.totalAdditions, 삭제: s.totalDeletions }));

    const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
    const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
    const codeChurn = totalAdditions > 0 ? Math.round(totalDeletions / totalAdditions * 100) : 0;
    const avgFiles = commits.length > 0 ? Math.round(commits.reduce((s, c) => s + c.filesChanged, 0) / commits.length * 10) / 10 : 0;
    const activeCont = contributorStats.filter(s => s.totalCommits > 0).length;

    return (
        <div className="space-y-6">
            <div className="animate-fadeInUp">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Code2 className="w-6 h-6 text-primary-400" />코드 인사이트
                </h2>
                <p className="text-sm text-surface-200/50 mt-1">코드 변경 추이 및 건강도 분석</p>
            </div>
            {/* 지표 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: TrendingUp, color: 'from-accent-500 to-accent-600', label: '코드 성장률', value: `+${totalAdditions.toLocaleString()}`, sub: '라인 추가' },
                    { icon: Activity, color: 'from-danger-400 to-danger-500', label: '코드 Churn', value: `${codeChurn}%`, sub: '삭제/추가 비율' },
                    { icon: FileCode, color: 'from-primary-500 to-primary-600', label: '커밋당 변경 파일', value: `${avgFiles}`, sub: '평균 파일 수' },
                    { icon: GitBranch, color: 'from-info-400 to-info-500', label: '활성 기여자', value: `${activeCont}`, sub: '코드 기여자 수' },
                ].map((item, i) => (
                    <div key={i} className="glass-card p-5 animate-fadeInUp" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}><item.icon className="w-4 h-4 text-white" /></div>
                            <span className="text-xs text-surface-200/50">{item.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{item.value}</div>
                        <div className="text-xs text-surface-200/40 mt-1">{item.sub}</div>
                    </div>
                ))}
            </div>
            {/* 주간 코드 변경 */}
            <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-400" />주간 코드 변경 추이</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={weeklyChartData}>
                            <defs>
                                <linearGradient id="addG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                                <linearGradient id="delG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.3} /><stop offset="95%" stopColor="#f87171" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="additions" name="추가" stroke="#34d399" fill="url(#addG)" strokeWidth={2} />
                            <Area type="monotone" dataKey="deletions" name="삭제" stroke="#f87171" fill="url(#delG)" strokeWidth={2} />
                            <Line type="monotone" dataKey="순변경" name="순변경" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* 일별 활동 & 히트맵 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '250ms' }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-accent-400" />일별 종합 활동</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyChartData.slice(-30)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                                <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} interval="preserveStartEnd" />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="총활동" name="총 활동" fill="#818cf8" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">커밋 히트맵</h3>
                    <div className="space-y-1">
                        <div className="flex gap-1 mb-2 ml-10">
                            {['월', '화', '수', '목', '금', '토', '일'].map(d => <div key={d} className="w-4 h-4 text-xs text-surface-200/40 flex items-center justify-center">{d}</div>)}
                        </div>
                        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                            {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="flex items-center gap-1">
                                    <div className="w-8 text-xs text-surface-200/30 text-right pr-1 shrink-0">W{wIdx + 1}</div>
                                    {week.map((day, dIdx) => (
                                        <div key={dIdx} className={`w-4 h-4 rounded-sm heatmap-${getHeatmapLevel(day.commits, maxDailyCommits)} transition-all duration-200 hover:scale-150 cursor-pointer`} title={`${day.date}: ${day.commits}개 커밋`} />
                                    ))}
                                    {Array.from({ length: 7 - week.length }).map((_, i) => <div key={`e-${i}`} className="w-4 h-4" />)}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3 justify-end">
                            <span className="text-xs text-surface-200/40">적음</span>
                            {[0, 1, 2, 3, 4].map(l => <div key={l} className={`w-3 h-3 rounded-sm heatmap-${l}`} />)}
                            <span className="text-xs text-surface-200/40">많음</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* 기여자별 코드량 */}
            <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Code2 className="w-5 h-5 text-primary-400" />기여자별 코드 변경량</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fileChangeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(148,163,184,0.1)' }} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Bar dataKey="추가" fill="#34d399" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="삭제" fill="#f87171" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* 건강도 요약 */}
            <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                <h3 className="text-lg font-semibold text-white mb-4">코드 건강도 요약</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/3">
                        <div className="text-sm text-surface-200/60 mb-2">코드 Churn 비율</div>
                        <span className={`text-3xl font-bold ${codeChurn < 30 ? 'text-accent-400' : codeChurn < 60 ? 'text-warning-400' : 'text-danger-400'}`}>{codeChurn}%</span>
                        <span className="text-xs text-surface-200/40 ml-2">{codeChurn < 30 ? '✅ 안정적' : codeChurn < 60 ? '⚠️ 보통' : '🔴 높음'}</span>
                        <div className="h-2 bg-surface-800 rounded-full mt-3 overflow-hidden">
                            <div className={`h-full rounded-full ${codeChurn < 30 ? 'bg-accent-500' : codeChurn < 60 ? 'bg-warning-500' : 'bg-danger-500'}`} style={{ width: `${Math.min(codeChurn, 100)}%` }} />
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/3">
                        <div className="text-sm text-surface-200/60 mb-2">커밋당 변경 파일</div>
                        <span className={`text-3xl font-bold ${avgFiles <= 5 ? 'text-accent-400' : avgFiles <= 15 ? 'text-warning-400' : 'text-danger-400'}`}>{avgFiles}</span>
                        <span className="text-xs text-surface-200/40 ml-2">{avgFiles <= 5 ? '✅ 적절' : '⚠️ 다소 많음'}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/3">
                        <div className="text-sm text-surface-200/60 mb-2">기여 분산도</div>
                        <span className="text-3xl font-bold text-primary-400">{activeCont}</span>
                        <span className="text-xs text-surface-200/40 ml-2">명 활발히 기여</span>
                        <p className="text-xs text-surface-200/40 mt-2">{activeCont >= 3 ? '✅ 기여가 잘 분산됨' : '⚠️ 더 많은 참여 필요'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
