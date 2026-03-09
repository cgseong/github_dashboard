// 사이드바 네비게이션 컴포넌트 (반응형: 데스크톱 고정, 모바일 토글)
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    GitBranch,
    Brain,
    Github,
    X,
    Settings,
    BookOpen,
    LogOut,
} from 'lucide-react';

/** 사이드바 네비게이션 메뉴 항목 */
const navItems = [
    { to: '/', icon: LayoutDashboard, label: '대시보드', desc: '저장소 개요' },
    { to: '/contributors', icon: Users, label: '기여자 분석', desc: '개별 기여도' },
    { to: '/insights', icon: GitBranch, label: '코드 인사이트', desc: '코드 변경 추이' },
    { to: '/ai-evaluation', icon: Brain, label: 'AI 평가', desc: '종합 평가' },
];

interface SidebarProps {
    /** 모바일에서 사이드바 열림 여부 */
    isOpen: boolean;
    /** 모바일에서 사이드바 닫기 핸들러 */
    onClose: () => void;
    /** 팀 관리 모달 열기 핸들러 */
    onOpenTeamManager?: () => void;
    /** 수업 목록으로 돌아가기 핸들러 */
    onBackToCourses?: () => void;
    /** 전체 시스템 로그아웃 핸들러 */
    onLogout?: () => void;
}

/** 사이드바 컴포넌트 */
export default function Sidebar({ isOpen, onClose, onOpenTeamManager, onBackToCourses, onLogout }: SidebarProps) {
    return (
        <>
            {/* 모바일 오버레이 배경 - 열려 있을 때만 표시 */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden
                     animate-[fadeIn_0.2s_ease-out]"
                    onClick={onClose}
                />
            )}

            {/* 사이드바 본체 */}
            <aside
                className={`
          fixed left-0 top-0 h-screen w-64 glass border-r border-white/5 z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                {/* 로고 영역 */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <Github className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">GitCollab</h1>
                                <p className="text-xs text-surface-200/60">협업 분석 플랫폼</p>
                            </div>
                        </div>
                        {/* 모바일 닫기 버튼 */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1.5 rounded-lg text-surface-200/50 hover:text-white 
                         hover:bg-white/10 transition-colors duration-200"
                            aria-label="사이드바 닫기"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 네비게이션 메뉴 */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={onClose} // 모바일에서 메뉴 클릭 시 사이드바 닫기
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                                    : 'text-surface-200/60 hover:text-white hover:bg-white/5'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                            <div>
                                <div className="text-sm font-medium">{item.label}</div>
                                <div className="text-xs opacity-60">{item.desc}</div>
                            </div>
                        </NavLink>
                    ))}
                </nav>

                {/* 하단 정보 */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    {/* 팀 관리 버튼 */}
                    {onOpenTeamManager && (
                        <button
                            onClick={onOpenTeamManager}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                                     text-xs text-surface-200/50 hover:text-primary-400
                                     hover:bg-primary-500/10 transition-colors duration-200"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            팀 관리
                        </button>
                    )}
                    {/* 수업 목록 버튼 */}
                    {onBackToCourses && (
                        <button
                            onClick={onBackToCourses}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                                     text-xs text-surface-200/50 hover:text-accent-400
                                     hover:bg-accent-500/10 transition-colors duration-200"
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            수업 목록
                        </button>
                    )}
                    {/* 로그아웃 버튼 */}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                                     text-xs text-surface-200/50 hover:text-danger-400 mt-2
                                     hover:bg-danger-500/10 transition-colors duration-200"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            로그아웃
                        </button>
                    )}

                    <div className="glass-card p-3 mt-4">
                        <p className="text-xs text-surface-200/50 text-center">
                            GitHub API 기반 분석
                        </p>
                        <p className="text-xs text-primary-400/70 text-center mt-1">
                            v1.0.0
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
