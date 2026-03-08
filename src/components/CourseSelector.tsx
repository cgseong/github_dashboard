// 수업 선택/관리 컴포넌트 - 수업 목록 표시, 추가/삭제/수정/선택
import { useState } from 'react';
import {
    Github, Key, Plus, X, Pencil, Trash2, Check, Users,
    BookOpen, AlertTriangle, ChevronRight, Loader2,
} from 'lucide-react';
import type { CourseConfig, TeamConfig } from '../types';

interface CourseSelectorProps {
    /** 등록된 수업 목록 */
    courses: CourseConfig[];
    /** 수업 목록 업데이트 */
    onUpdateCourses: (courses: CourseConfig[]) => void;
    /** 수업 선택 (대시보드 진입) */
    onSelectCourse: (course: CourseConfig) => void;
    /** 로딩 중 여부 */
    loading: boolean;
}

/** 입력 필드 공통 스타일 */
const inputClass = `w-full bg-surface-900/60 border border-white/10 rounded-lg px-4 py-2.5
    text-white text-sm placeholder:text-surface-200/30
    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
    transition-all duration-200`;

/** 수업 선택/관리 화면 */
export default function CourseSelector({
    courses, onUpdateCourses, onSelectCourse, loading,
}: CourseSelectorProps) {
    // 새 수업 추가 모드
    const [showAddForm, setShowAddForm] = useState(courses.length === 0);
    // 수정 중인 수업 ID
    const [editingId, setEditingId] = useState<string | null>(null);
    // 삭제 확인 중인 수업 ID
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // 새 수업 폼 상태
    const [newCourseName, setNewCourseName] = useState('');
    const [newToken, setNewToken] = useState('');
    const [newTeams, setNewTeams] = useState<TeamConfig[]>([]);
    const [newTeamName, setNewTeamName] = useState('');
    const [newOwner, setNewOwner] = useState('');
    const [newRepo, setNewRepo] = useState('');

    // 수정 폼 상태
    const [editName, setEditName] = useState('');
    const [editToken, setEditToken] = useState('');

    /** 새 수업에 팀 추가 */
    const handleAddTeamToNew = () => {
        if (!newTeamName.trim() || !newOwner.trim() || !newRepo.trim()) return;
        setNewTeams(prev => [...prev, {
            id: `team-${Date.now()}`,
            teamName: newTeamName.trim(),
            owner: newOwner.trim(),
            repo: newRepo.trim(),
        }]);
        setNewTeamName('');
        setNewOwner('');
        setNewRepo('');
    };

    /** 새 수업 저장 */
    const handleCreateCourse = () => {
        if (!newCourseName.trim() || !newToken.trim() || newTeams.length === 0) return;

        const newCourse: CourseConfig = {
            id: `course-${Date.now()}`,
            courseName: newCourseName.trim(),
            token: newToken.trim(),
            teams: newTeams,
        };
        onUpdateCourses([...courses, newCourse]);
        // 폼 초기화
        setNewCourseName('');
        setNewToken('');
        setNewTeams([]);
        setShowAddForm(false);
    };

    /** 수정 시작 */
    const startEdit = (course: CourseConfig) => {
        setEditingId(course.id);
        setEditName(course.courseName);
        setEditToken(course.token);
        setDeletingId(null);
    };

    /** 수정 저장 */
    const saveEdit = () => {
        if (!editingId || !editName.trim() || !editToken.trim()) return;
        const updated = courses.map(c =>
            c.id === editingId ? { ...c, courseName: editName.trim(), token: editToken.trim() } : c
        );
        onUpdateCourses(updated);
        setEditingId(null);
    };

    /** 수업 삭제 */
    const handleDelete = (id: string) => {
        onUpdateCourses(courses.filter(c => c.id !== id));
        setDeletingId(null);
    };

    const canAddTeam = newTeamName.trim() && newOwner.trim() && newRepo.trim();
    const canCreate = newCourseName.trim() && newToken.trim() && newTeams.length > 0;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-fadeInUp">
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

                {/* 수업 목록 */}
                {courses.length > 0 && !showAddForm && (
                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary-400" />
                                수업 목록
                            </h2>
                            <span className="text-xs text-surface-200/40">{courses.length}개 수업</span>
                        </div>

                        {courses.map((course) => (
                            <div key={course.id} className="glass-card overflow-hidden">
                                {/* 수정 모드 */}
                                {editingId === course.id ? (
                                    <div className="p-5 space-y-3">
                                        <p className="text-xs text-primary-400 font-medium">수업 정보 수정</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-surface-200/40 mb-1 block">수업 이름</label>
                                                <input type="text" value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className={inputClass} placeholder="수업 이름" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-surface-200/40 mb-1 block">GitHub 토큰</label>
                                                <input type="password" value={editToken}
                                                    onChange={e => setEditToken(e.target.value)}
                                                    className={inputClass} placeholder="ghp_..." />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 rounded-lg text-xs text-surface-200/50 hover:text-white hover:bg-white/5 transition-colors">
                                                취소
                                            </button>
                                            <button onClick={saveEdit}
                                                disabled={!editName.trim() || !editToken.trim()}
                                                className="px-3 py-1.5 rounded-lg text-xs bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors disabled:opacity-30 flex items-center gap-1">
                                                <Check className="w-3 h-3" /> 저장
                                            </button>
                                        </div>
                                    </div>
                                ) : deletingId === course.id ? (
                                    /* 삭제 확인 */
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-warning-400">
                                            <AlertTriangle className="w-4 h-4" />
                                            <p className="text-sm font-medium">"{course.courseName}" 수업을 삭제하시겠습니까?</p>
                                        </div>
                                        <p className="text-xs text-surface-200/40">
                                            {course.teams.length}개 팀 데이터가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                                        </p>
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setDeletingId(null)}
                                                className="px-3 py-1.5 rounded-lg text-xs text-surface-200/50 hover:text-white hover:bg-white/5 transition-colors">
                                                취소
                                            </button>
                                            <button onClick={() => handleDelete(course.id)}
                                                className="px-3 py-1.5 rounded-lg text-xs bg-danger-500/20 text-danger-400 hover:bg-danger-500/30 transition-colors flex items-center gap-1">
                                                <Trash2 className="w-3 h-3" /> 삭제
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* 기본 보기 */
                                    <div className="flex items-center gap-4 p-5 group">
                                        {/* 수업 아이콘 */}
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-accent-500/20
                                                      border border-primary-500/15 flex items-center justify-center shrink-0">
                                            <BookOpen className="w-5 h-5 text-primary-400" />
                                        </div>

                                        {/* 수업 정보 */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold text-white truncate">{course.courseName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Users className="w-3.5 h-3.5 text-surface-200/40" />
                                                <span className="text-xs text-surface-200/40">{course.teams.length}개 팀</span>
                                                <span className="text-xs text-surface-200/20">•</span>
                                                <span className="text-xs text-surface-200/30 font-mono truncate">
                                                    {course.teams.map(t => t.repo).join(', ')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 액션 버튼들 */}
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(course)} title="수업 수정"
                                                className="p-2 rounded-lg text-surface-200/30 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => { setDeletingId(course.id); setEditingId(null); }} title="수업 삭제"
                                                className="p-2 rounded-lg text-surface-200/30 hover:text-danger-400 hover:bg-danger-500/10 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* 선택 버튼 */}
                                        <button
                                            onClick={() => onSelectCourse(course)}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0
                                                     bg-primary-500/10 text-primary-400 text-sm font-medium
                                                     hover:bg-primary-500/20 transition-all duration-200
                                                     disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    선택
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* 새 수업 추가 버튼 */}
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-3 rounded-xl border border-dashed border-primary-500/30
                                     text-primary-400 text-sm font-medium
                                     hover:bg-primary-500/10 hover:border-primary-500/50
                                     transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            새 수업 추가
                        </button>
                    </div>
                )}

                {/* 새 수업 추가 폼 */}
                {showAddForm && (
                    <div className="space-y-5">
                        {/* 수업 정보 */}
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">
                                    {courses.length === 0 ? '수업 설정' : '새 수업 추가'}
                                </h2>
                                {courses.length > 0 && (
                                    <button onClick={() => setShowAddForm(false)}
                                        className="p-1.5 rounded-lg text-surface-200/30 hover:text-white hover:bg-white/10 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-surface-200/70 mb-1.5">수업/프로젝트 이름</label>
                                <input type="text" value={newCourseName}
                                    onChange={e => setNewCourseName(e.target.value)}
                                    placeholder="예: 2026 소프트웨어공학" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm text-surface-200/70 mb-1.5">GitHub Personal Access Token</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/40" />
                                    <input type="password" value={newToken}
                                        onChange={e => setNewToken(e.target.value)}
                                        placeholder="ghp_xxxxxxxxxxxx" className={`${inputClass} !pl-10`} />
                                </div>
                                <p className="text-xs text-surface-200/40 mt-1.5">모든 팀 저장소에 접근 가능한 토큰 1개만 입력</p>
                            </div>
                        </div>

                        {/* 팀 등록 */}
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary-400" />
                                    팀 등록
                                </h2>
                                <span className="text-xs text-surface-200/40">{newTeams.length}개 팀</span>
                            </div>

                            {/* 등록된 팀 목록 */}
                            {newTeams.length > 0 && (
                                <div className="space-y-2">
                                    {newTeams.map((team, idx) => (
                                        <div key={team.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-surface-900/50 border border-white/5">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20
                                                          border border-primary-500/20 flex items-center justify-center shrink-0">
                                                <span className="text-xs font-bold text-primary-300">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{team.teamName}</p>
                                                <p className="text-xs text-surface-200/40 truncate font-mono">{team.owner}/{team.repo}</p>
                                            </div>
                                            <button onClick={() => setNewTeams(prev => prev.filter(t => t.id !== team.id))}
                                                className="p-1.5 rounded-lg text-surface-200/30 hover:text-danger-400 hover:bg-danger-500/10 transition-colors">
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
                                    <input type="text" value={newTeamName}
                                        onChange={e => setNewTeamName(e.target.value)}
                                        placeholder="팀 이름" className={`${inputClass} text-xs`} />
                                    <input type="text" value={newOwner}
                                        onChange={e => setNewOwner(e.target.value)}
                                        placeholder="소유자 (owner)" className={`${inputClass} text-xs`} />
                                    <input type="text" value={newRepo}
                                        onChange={e => setNewRepo(e.target.value)}
                                        placeholder="저장소 (repo)" className={`${inputClass} text-xs`} />
                                </div>
                                <button onClick={handleAddTeamToNew}
                                    disabled={!canAddTeam}
                                    className="w-full py-2 rounded-lg border border-dashed border-primary-500/30
                                             text-primary-400 text-sm font-medium hover:bg-primary-500/10
                                             disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> 팀 추가
                                </button>
                            </div>
                        </div>

                        {/* 저장 버튼 */}
                        <button onClick={handleCreateCourse}
                            disabled={!canCreate || loading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500
                                     text-white font-medium text-sm hover:from-primary-500 hover:to-primary-400
                                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300
                                     transform hover:scale-[1.02] active:scale-[0.98]
                                     shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2">
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> 저장 중...</>
                            ) : (
                                `수업 저장 (${newTeams.length}개 팀)`
                            )}
                        </button>
                    </div>
                )}

                {/* 안내 텍스트 */}
                <p className="text-center text-xs text-surface-200/30 mt-4">
                    GitHub API를 통해 저장소 데이터를 안전하게 분석합니다.
                    <br />토큰은 브라우저에서만 사용되며 서버로 전송되지 않습니다.
                </p>
            </div>
        </div>
    );
}
