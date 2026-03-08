// 팀 관리 모달 컴포넌트 - 등록된 팀 수정/삭제/추가
import { useState } from 'react';
import { X, Pencil, Trash2, Check, Plus, Users, AlertTriangle } from 'lucide-react';
import type { TeamConfig } from '../types';

interface TeamManagerProps {
    /** 현재 등록된 팀 목록 */
    teams: TeamConfig[];
    /** 팀 목록 업데이트 핸들러 */
    onUpdateTeams: (teams: TeamConfig[]) => void;
    /** 모달 닫기 핸들러 */
    onClose: () => void;
}

/** 입력 필드 공통 스타일 */
const inputClass = `w-full bg-surface-900/60 border border-white/10 rounded-lg px-3 py-2
    text-white text-sm placeholder:text-surface-200/30
    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
    transition-all duration-200`;

/** 팀 관리 모달 */
export default function TeamManager({ teams, onUpdateTeams, onClose }: TeamManagerProps) {
    // 편집 중인 팀 ID (null이면 편집 모드 아님)
    const [editingId, setEditingId] = useState<string | null>(null);
    // 편집 폼 상태
    const [editForm, setEditForm] = useState({ teamName: '', owner: '', repo: '' });
    // 새 팀 추가 폼 상태
    const [newTeamName, setNewTeamName] = useState('');
    const [newOwner, setNewOwner] = useState('');
    const [newRepo, setNewRepo] = useState('');
    // 삭제 확인 중인 팀 ID
    const [deletingId, setDeletingId] = useState<string | null>(null);

    /** 편집 모드 시작 */
    const startEdit = (team: TeamConfig) => {
        setEditingId(team.id);
        setEditForm({ teamName: team.teamName, owner: team.owner, repo: team.repo });
        setDeletingId(null);
    };

    /** 편집 취소 */
    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ teamName: '', owner: '', repo: '' });
    };

    /** 편집 저장 */
    const saveEdit = () => {
        if (!editingId || !editForm.teamName.trim() || !editForm.owner.trim() || !editForm.repo.trim()) return;

        const updatedTeams = teams.map(t =>
            t.id === editingId
                ? { ...t, teamName: editForm.teamName.trim(), owner: editForm.owner.trim(), repo: editForm.repo.trim() }
                : t
        );
        onUpdateTeams(updatedTeams);
        setEditingId(null);
        setEditForm({ teamName: '', owner: '', repo: '' });
    };

    /** 팀 삭제 */
    const deleteTeam = (id: string) => {
        const updatedTeams = teams.filter(t => t.id !== id);
        onUpdateTeams(updatedTeams);
        setDeletingId(null);
    };

    /** 새 팀 추가 */
    const addTeam = () => {
        if (!newTeamName.trim() || !newOwner.trim() || !newRepo.trim()) return;

        const newTeam: TeamConfig = {
            id: `team-${Date.now()}`,
            teamName: newTeamName.trim(),
            owner: newOwner.trim(),
            repo: newRepo.trim(),
        };
        onUpdateTeams([...teams, newTeam]);
        setNewTeamName('');
        setNewOwner('');
        setNewRepo('');
    };

    const canAddTeam = newTeamName.trim() && newOwner.trim() && newRepo.trim();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* 오버레이 배경 */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 모달 본체 */}
            <div className="relative w-full max-w-xl glass-card p-0 animate-fadeInUp overflow-hidden max-h-[85vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-400" />
                        팀 관리
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-surface-200/50 hover:text-white
                                 hover:bg-white/10 transition-colors duration-200"
                        aria-label="닫기"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 팀 목록 (스크롤 가능) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {teams.length === 0 && (
                        <div className="text-center py-8 text-surface-200/40 text-sm">
                            등록된 팀이 없습니다.
                        </div>
                    )}

                    {teams.map((team, idx) => (
                        <div key={team.id} className="rounded-xl bg-surface-900/50 border border-white/5 overflow-hidden">
                            {/* 편집 모드 */}
                            {editingId === team.id ? (
                                <div className="p-4 space-y-3">
                                    <p className="text-xs text-primary-400 font-medium">팀 정보 수정</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-surface-200/40 mb-1 block">팀 이름</label>
                                            <input
                                                type="text"
                                                value={editForm.teamName}
                                                onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                                                className={inputClass}
                                                placeholder="팀 이름"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-surface-200/40 mb-1 block">소유자</label>
                                            <input
                                                type="text"
                                                value={editForm.owner}
                                                onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                                                className={inputClass}
                                                placeholder="owner"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-surface-200/40 mb-1 block">저장소</label>
                                            <input
                                                type="text"
                                                value={editForm.repo}
                                                onChange={(e) => setEditForm({ ...editForm, repo: e.target.value })}
                                                className={inputClass}
                                                placeholder="repo"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={cancelEdit}
                                            className="px-3 py-1.5 rounded-lg text-xs text-surface-200/50
                                                     hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            disabled={!editForm.teamName.trim() || !editForm.owner.trim() || !editForm.repo.trim()}
                                            className="px-3 py-1.5 rounded-lg text-xs bg-primary-500/20 text-primary-400
                                                     hover:bg-primary-500/30 transition-colors
                                                     disabled:opacity-30 disabled:cursor-not-allowed
                                                     flex items-center gap-1"
                                        >
                                            <Check className="w-3 h-3" />
                                            저장
                                        </button>
                                    </div>
                                </div>
                            ) : deletingId === team.id ? (
                                /* 삭제 확인 모드 */
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-warning-400">
                                        <AlertTriangle className="w-4 h-4" />
                                        <p className="text-sm font-medium">
                                            "{team.teamName}" 팀을 삭제하시겠습니까?
                                        </p>
                                    </div>
                                    <p className="text-xs text-surface-200/40">
                                        {team.owner}/{team.repo} — 이 작업은 되돌릴 수 없습니다.
                                    </p>
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => setDeletingId(null)}
                                            className="px-3 py-1.5 rounded-lg text-xs text-surface-200/50
                                                     hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={() => deleteTeam(team.id)}
                                            className="px-3 py-1.5 rounded-lg text-xs bg-danger-500/20 text-danger-400
                                                     hover:bg-danger-500/30 transition-colors
                                                     flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* 기본 보기 모드 */
                                <div className="flex items-center gap-3 p-4">
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

                                    {/* 수정 버튼 */}
                                    <button
                                        onClick={() => startEdit(team)}
                                        className="p-2 rounded-lg text-surface-200/30 hover:text-primary-400
                                                 hover:bg-primary-500/10 transition-colors duration-200"
                                        aria-label="팀 수정"
                                        title="팀 정보 수정"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>

                                    {/* 삭제 버튼 */}
                                    <button
                                        onClick={() => { setDeletingId(team.id); setEditingId(null); }}
                                        className="p-2 rounded-lg text-surface-200/30 hover:text-danger-400
                                                 hover:bg-danger-500/10 transition-colors duration-200"
                                        aria-label="팀 삭제"
                                        title="팀 삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 하단: 새 팀 추가 */}
                <div className="p-6 border-t border-white/5 space-y-3">
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
                        onClick={addTeam}
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
        </div>
    );
}
