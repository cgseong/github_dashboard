// 팀 선택 탭 컴포넌트 - 등록된 팀 간 전환
import { Users } from 'lucide-react';
import type { TeamConfig } from '../types';

interface TeamSelectorProps {
    /** 등록된 팀 목록 */
    teams: TeamConfig[];
    /** 현재 선택된 팀 ID */
    selectedTeamId: string;
    /** 팀 선택 핸들러 */
    onSelectTeam: (teamId: string) => void;
    /** 로딩 중인 팀 ID (null이면 로딩 없음) */
    loadingTeamId: string | null;
}

/** 팀 선택 탭 바 */
export default function TeamSelector({
    teams,
    selectedTeamId,
    onSelectTeam,
    loadingTeamId,
}: TeamSelectorProps) {
    return (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {/* 팀 아이콘 */}
            <Users className="w-5 h-5 text-surface-200/40 shrink-0" />

            {/* 팀 탭 목록 */}
            {teams.map((team) => {
                const isSelected = team.id === selectedTeamId;
                const isLoading = team.id === loadingTeamId;

                return (
                    <button
                        key={team.id}
                        onClick={() => onSelectTeam(team.id)}
                        disabled={isLoading}
                        className={`
                            shrink-0 px-5 py-2.5 rounded-xl text-base font-medium
                            transition-all duration-200 flex items-center gap-2.5
                            ${isSelected
                                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/25 shadow-sm shadow-primary-500/10'
                                : 'text-surface-200/50 hover:text-white hover:bg-white/5 border border-transparent'
                            }
                            ${isLoading ? 'opacity-60' : ''}
                        `}
                    >
                        {/* 로딩 스피너 */}
                        {isLoading && (
                            <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                        )}

                        {/* 팀 이름 */}
                        <span>{team.teamName}</span>

                        {/* 저장소 이름 (작은 텍스트) */}
                        <span className={`text-sm font-mono ${isSelected ? 'text-primary-400/60' : 'text-surface-200/30'}`}>
                            {team.repo}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
