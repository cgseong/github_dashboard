// 대시보드 메인 페이지 - 저장소 개요 및 활동 요약
import {
    GitCommit,
    GitPullRequest,
    AlertCircle,
    Users,
    TrendingUp,
    CalendarDays,
    Code2,
    ArrowUpRight,
    ArrowDownRight,
    FolderTree,
    Folder,
    FolderOpen,
    FileCode2,
    FileText,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import type { RepoSummary, DailyActivity, PullRequestData, IssueData, RepoTreeItem } from '../types';
import { useState } from 'react';

interface DashboardProps {
    summary: RepoSummary | null;
    dailyActivity: DailyActivity[];
    pullRequests: PullRequestData[];
    issues: IssueData[];
    repoTree: RepoTreeItem[];
}

/** 파이 차트 색상 팔레트 */
const PIE_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171'];

/** 메트릭 카드 컴포넌트 */
function MetricCard({
    icon: Icon,
    label,
    value,
    sub,
    color,
    delay,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
    delay: number;
}) {
    return (
        <div
            className="glass-card p-5 animate-fadeInUp"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} 
                        flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                {sub && (
                    <span className="text-xs text-accent-400 flex items-center gap-0.5 font-medium">
                        {Number(sub) >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                        ) : (
                            <ArrowDownRight className="w-3 h-3 text-danger-400" />
                        )}
                        {sub}
                    </span>
                )}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs text-surface-200/50">{label}</div>
        </div>
    );
}

/** 파일 확장자에 따른 아이콘 선택 */
function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase();
    const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'go', 'rs', 'c', 'cpp', 'h', 'cs', 'rb', 'php', 'swift', 'kt', 'vue', 'svelte'];
    if (ext && codeExts.includes(ext)) return FileCode2;
    return FileText;
}

/** 파일 크기 포맷 */
function formatSize(bytes: number): string {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 트리 노드 컴포넌트 (재귀) */
function TreeNode({ item, depth }: { item: RepoTreeItem; depth: number }) {
    const [open, setOpen] = useState(depth < 1); // 루트 레벨만 기본 열림
    const isFolder = item.type === 'tree';
    const FileIcon = getFileIcon(item.name);

    return (
        <div>
            <button
                onClick={() => isFolder && setOpen(!open)}
                className={`w-full flex items-center gap-2 py-1.5 px-2 rounded-lg text-left text-sm
                    transition-colors duration-150
                    ${isFolder ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
                    ${depth === 0 ? '' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {/* 화살표 (폴더만) */}
                {isFolder ? (
                    open ? <ChevronDown className="w-3.5 h-3.5 text-surface-200/40 shrink-0" />
                        : <ChevronRight className="w-3.5 h-3.5 text-surface-200/40 shrink-0" />
                ) : (
                    <span className="w-3.5 shrink-0" />
                )}

                {/* 아이콘 */}
                {isFolder ? (
                    open ? <FolderOpen className="w-4 h-4 text-warning-400 shrink-0" />
                        : <Folder className="w-4 h-4 text-warning-400 shrink-0" />
                ) : (
                    <FileIcon className="w-4 h-4 text-surface-200/50 shrink-0" />
                )}

                {/* 이름 */}
                <span className={`truncate ${isFolder ? 'text-white font-medium' : 'text-surface-200/70'}`}>
                    {item.name}
                </span>

                {/* 크기 (파일만) */}
                {!isFolder && item.size > 0 && (
                    <span className="ml-auto text-xs text-surface-200/30 shrink-0">{formatSize(item.size)}</span>
                )}

                {/* 하위 항목 수 (폴더만) */}
                {isFolder && item.children && (
                    <span className="ml-auto text-xs text-surface-200/30 shrink-0">{item.children.length}</span>
                )}
            </button>

            {/* 하위 항목 (열려있을 때만) */}
            {isFolder && open && item.children && (
                <div>
                    {item.children.map((child) => (
                        <TreeNode key={child.path} item={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

/** 대시보드 페이지 */
export default function Dashboard({ summary, dailyActivity, pullRequests, issues, repoTree }: DashboardProps) {
    if (!summary) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-surface-200/50">데이터를 불러와주세요.</p>
            </div>
        );
    }

    // PR 상태 분포 데이터
    const prStatusData = [
        { name: '병합됨', value: summary.mergedPRs },
        { name: '열림', value: summary.openPRs },
        { name: '닫힘', value: summary.closedPRs },
    ].filter(d => d.value > 0);

    // 이슈 상태 분포 데이터
    const issueStatusData = [
        { name: '열림', value: summary.openIssues },
        { name: '닫힘', value: summary.closedIssues },
    ].filter(d => d.value > 0);

    // 최근 PR 목록 (최신 5개)
    const recentPRs = [...pullRequests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    // 최근 이슈 목록 (최신 5개)
    const recentIssues = [...issues]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    // 일별 활동 차트 데이터 (라벨을 MM/DD 형식으로 변환)
    const chartData = dailyActivity.map(d => ({
        ...d,
        label: `${new Date(d.date).getMonth() + 1}/${new Date(d.date).getDate()}`,
    }));

    return (
        <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div className="animate-fadeInUp">
                <h2 className="text-2xl font-bold text-white">대시보드</h2>
                <p className="text-sm text-surface-200/50 mt-1">저장소 활동 개요 및 요약</p>
            </div>

            {/* 메트릭 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={GitCommit}
                    label="총 커밋 수"
                    value={summary.totalCommits}
                    sub={`일 평균 ${summary.avgCommitsPerDay}`}
                    color="from-primary-500 to-primary-700"
                    delay={0}
                />
                <MetricCard
                    icon={GitPullRequest}
                    label="Pull Requests"
                    value={summary.totalPRs}
                    sub={`${summary.mergedPRs} 병합됨`}
                    color="from-accent-500 to-accent-600"
                    delay={50}
                />
                <MetricCard
                    icon={AlertCircle}
                    label="이슈"
                    value={summary.totalIssues}
                    sub={`${summary.closedIssues} 해결됨`}
                    color="from-warning-400 to-warning-500"
                    delay={100}
                />
                <MetricCard
                    icon={Users}
                    label="기여자 수"
                    value={summary.totalContributors}
                    color="from-info-400 to-info-500"
                    delay={150}
                />
            </div>

            {/* 추가 메트릭 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    icon={TrendingUp}
                    label="코드 추가"
                    value={`+${summary.totalAdditions.toLocaleString()}`}
                    color="from-accent-500 to-accent-600"
                    delay={200}
                />
                <MetricCard
                    icon={Code2}
                    label="코드 삭제"
                    value={`-${summary.totalDeletions.toLocaleString()}`}
                    color="from-danger-400 to-danger-500"
                    delay={250}
                />
                <MetricCard
                    icon={CalendarDays}
                    label="가장 활동적인 날"
                    value={summary.mostActiveDay}
                    color="from-primary-400 to-primary-600"
                    delay={300}
                />
            </div>

            {/* 활동 타임라인 차트 */}
            <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '350ms' }}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-400" />
                    활동 타임라인
                </h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="prGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
                                tickLine={false}
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
                            <Legend
                                wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="commits"
                                name="커밋"
                                stroke="#818cf8"
                                fill="url(#commitGradient)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="prsOpened"
                                name="PR 생성"
                                stroke="#34d399"
                                fill="url(#prGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* PR 및 이슈 상태 분포 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PR 상태 파이 차트 */}
                <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '400ms' }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <GitPullRequest className="w-5 h-5 text-accent-400" />
                        PR 상태 분포
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={prStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    fill="#818cf8"
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={{ stroke: '#94a3b8' }}
                                >
                                    {prStatusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(15, 23, 42, 0.95)',
                                        border: '1px solid rgba(148,163,184,0.15)',
                                        borderRadius: '12px',
                                        color: '#e2e8f0',
                                        fontSize: '12px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 이슈 상태 바 차트 */}
                <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '450ms' }}>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-warning-400" />
                        이슈 현황
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={issueStatusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
                                />
                                <YAxis
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
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
                                <Bar dataKey="value" name="이슈 수" radius={[6, 6, 0, 0]}>
                                    {issueStatusData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 최근 활동 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 최근 PR */}
                <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">최근 Pull Requests</h3>
                    <div className="space-y-3">
                        {recentPRs.map(pr => (
                            <div key={pr.number} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                                <img src={pr.authorAvatar} alt={pr.author} className="w-8 h-8 rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        #{pr.number} {pr.title}
                                    </p>
                                    <p className="text-xs text-surface-200/50 mt-0.5">
                                        {pr.author} · <span className={
                                            pr.state === 'merged' ? 'text-primary-400' :
                                                pr.state === 'open' ? 'text-accent-400' : 'text-danger-400'
                                        }>{pr.state === 'merged' ? '병합됨' : pr.state === 'open' ? '열림' : '닫힘'}</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                        {recentPRs.length === 0 && (
                            <p className="text-sm text-surface-200/40 text-center py-4">등록된 PR이 없습니다.</p>
                        )}
                    </div>
                </div>

                {/* 최근 이슈 */}
                <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '550ms' }}>
                    <h3 className="text-lg font-semibold text-white mb-4">최근 이슈</h3>
                    <div className="space-y-3">
                        {recentIssues.map(issue => (
                            <div key={issue.number} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                                <img src={issue.authorAvatar} alt={issue.author} className="w-8 h-8 rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        #{issue.number} {issue.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-xs text-surface-200/50">
                                            {issue.author} · <span className={
                                                issue.state === 'open' ? 'text-accent-400' : 'text-primary-400'
                                            }>{issue.state === 'open' ? '열림' : '닫힘'}</span>
                                        </p>
                                        {issue.labels.slice(0, 2).map(label => (
                                            <span key={label} className="text-xs px-1.5 py-0.5 rounded bg-primary-500/15 text-primary-300">
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentIssues.length === 0 && (
                            <p className="text-sm text-surface-200/40 text-center py-4">등록된 이슈가 없습니다.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 저장소 구조 */}
            {repoTree.length > 0 && (
                <div className="glass-card p-6 animate-fadeInUp" style={{ animationDelay: '600ms' }}>
                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        <FolderTree className="w-5 h-5 text-warning-400" />
                        저장소 구조
                    </h3>
                    <p className="text-xs text-surface-200/40 mb-4">
                        {(() => {
                            // 전체 파일/폴더 수 계산
                            const countItems = (items: RepoTreeItem[]): { files: number; folders: number } => {
                                let files = 0, folders = 0;
                                items.forEach(i => {
                                    if (i.type === 'tree') { folders++; if (i.children) { const c = countItems(i.children); files += c.files; folders += c.folders; } }
                                    else files++;
                                });
                                return { files, folders };
                            };
                            const { files, folders } = countItems(repoTree);
                            return `${folders}개 폴더, ${files}개 파일`;
                        })()}
                    </p>
                    <div className="max-h-96 overflow-y-auto rounded-lg bg-surface-900/40 p-2">
                        {repoTree.map((item) => (
                            <TreeNode key={item.path} item={item} depth={0} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
