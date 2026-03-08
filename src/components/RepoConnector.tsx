// 수업 설정 컴포넌트 - 다중 팀(저장소) 등록
import { useState } from 'react';
import { Github, Key, Loader2, AlertCircle, Plus, X, Users } from 'lucide-react';
import type { CourseConfig, TeamConfig } from '../types';

interface RepoConnectorProps {
    onConnect: (config: CourseConfig) => void;
    loading: boolean;
    error: string | null;
}

/** 입력 필드 공통 스타일 */
const inputClass = `w-full bg-surface-900/60 border border-white/10 rounded-lg px-4 py-2.5
    text-white text-sm placeholder:text-surface-200/30
    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
    transition-all duration-200`;

/** 수업 설정 및 다중 저장소 등록 폼 */
export default function RepoConnector({ onConnect, loading, error }: RepoConnectorProps) {
    // 수업 이름
    const [courseName, setCourseName] = useState('');
    // 공통 GitHub 토큰
    const [token, setToken] = useState('');
    // 등록된 팀 목록
    const [teams, setTeams] = useState<TeamConfig[]>([]);
    // 새 팀 추가 폼 상태
    const [newTeamName, setNewTeamName] = useState('');
    const [newOwner, setNewOwner] = useState('');
    const [newRepo, setNewRepo] = useState('');

    /** 팀 추가 */
    const handleAddTeam = () => {
        if (!newTeamName.trim() || !newOwner.trim() || !newRepo.trim()) return;

        const newTeam: TeamConfig = {
            id: `team-${Date.now()}`,
            teamName: newTeamName.trim(),
            owner: newOwner.trim(),
            repo: newRepo.trim(),
        };

        setTeams(prev => [...prev, newTeam]);
        setNewTeamName('');
        setNewOwner('');
        setNewRepo('');
    };

    /** 팀 제거 */
    const handleRemoveTeam = (id: string) => {
        setTeams(prev => prev.filter(t => t.id !== id));
    };

    /** 분석 시작 */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (courseName && token && teams.length > 0) {
            onConnect({ 
                id: crypto.randomUUID(), 
                courseName, 
                token, 
                teams 
            });
        }
    };

    // 제출 가능 여부
    const canSubmit = courseName.trim() && token.trim() && teams.length > 0;
    // 팀 추가 가능 여부
    const canAddTeam = newTeamName.trim() && newOwner.trim() && newRepo.trim();

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg animate-fadeInUp">
                {/* 로고 */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 
                          flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                        <Github className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">GitCollab</h1>
                    <p className="text-surface-200/60 text-sm">
                        팀 협업 기여도 분석 플랫폼
                    </p>
                </div>

                {/* 설정 폼 */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* 수업 정보 카드 */}
                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-white">수업 설정</h2>

                        {/* 수업 이름 */}
                        <div>
                            <label className="block text-sm text-surface-200/70 mb-1.5">
                                수업/프로젝트 이름
                            </label>
                            <input
                                type="text"
                                value={courseName}
                                onChange={(e) => setCourseName(e.target.value)}
                                placeholder="예: 2026 소프트웨어공학"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* GitHub 토큰 */}
                        <div>
                            <label className="block text-sm text-surface-200/70 mb-1.5">
                                GitHub Personal Access Token
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/40" />
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxx"
                                    className={`${inputClass} !pl-10`}
                                    required
                                />
                            </div>
                            <p className="text-xs text-surface-200/40 mt-1.5">
                                모든 팀 저장소에 접근 가능한 토큰 1개만 입력하면 됩니다
                            </p>
                        </div>
                    </div>

                    {/* 팀 등록 카드 */}
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary-400" />
                                팀 등록
                            </h2>
                            <span className="text-xs text-surface-200/40">
                                {teams.length}개 팀 등록됨
                            </span>
                        </div>

                        {/* 등록된 팀 목록 */}
                        {teams.length > 0 && (
                            <div className="space-y-2">
                                {teams.map((team, idx) => (
                                    <div
                                        key={team.id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/50
                                                 border border-white/5 animate-fadeInUp"
                                    >
                                        {/* 팀 번호 뱃지 */}
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20
                                                      border border-primary-500/20 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-primary-300">{idx + 1}</span>
                                        </div>

                                        {/* 팀 정보 */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{team.teamName}</p>
                                            <p className="text-xs text-surface-200/40 truncate font-mono">
                                                {team.owner}/{team.repo}
                                            </p>
                                        </div>

                                        {/* 제거 버튼 */}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTeam(team.id)}
                                            className="p-1.5 rounded-lg text-surface-200/30 hover:text-danger-400
                                                     hover:bg-danger-500/10 transition-colors duration-200"
                                            aria-label="팀 제거"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 새 팀 추가 폼 */}
                        <div className="p-4 rounded-xl bg-surface-900/30 border border-dashed border-white/10 space-y-3">
                            <p className="text-xs text-surface-200/50 font-medium">새 팀 추가</p>

                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="팀 이름"
                                    className={`${inputClass} text-xs`}
                                />
                                <input
                                    type="text"
                                    value={newOwner}
                                    onChange={(e) => setNewOwner(e.target.value)}
                                    placeholder="소유자 (owner)"
                                    className={`${inputClass} text-xs`}
                                />
                                <input
                                    type="text"
                                    value={newRepo}
                                    onChange={(e) => setNewRepo(e.target.value)}
                                    placeholder="저장소 (repo)"
                                    className={`${inputClass} text-xs`}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleAddTeam}
                                disabled={!canAddTeam}
                                className="w-full py-2 rounded-lg border border-dashed border-primary-500/30
                                         text-primary-400 text-sm font-medium
                                         hover:bg-primary-500/10 hover:border-primary-500/50
                                         disabled:opacity-30 disabled:cursor-not-allowed
                                         transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                팀 추가
                            </button>
                        </div>
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20">
                            <AlertCircle className="w-4 h-4 text-danger-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-danger-400">{error}</p>
                        </div>
                    )}

                    {/* 제출 버튼 */}
                    <button
                        type="submit"
                        disabled={loading || !canSubmit}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500
                             text-white font-medium text-sm
                             hover:from-primary-500 hover:to-primary-400
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                             shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30
                             flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                데이터 분석 중...
                            </>
                        ) : (
                            `${teams.length}개 팀 분석 시작`
                        )}
                    </button>
                </form>

                {/* 안내 텍스트 */}
                <p className="text-center text-xs text-surface-200/30 mt-4">
                    GitHub API를 통해 저장소 데이터를 안전하게 분석합니다.
                    <br />토큰은 브라우저에서만 사용되며 서버로 전송되지 않습니다.
                </p>
            </div>
        </div>
    );
}
