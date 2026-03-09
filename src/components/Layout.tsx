// 레이아웃 컴포넌트 - 사이드바 + 콘텐츠 영역 (반응형)
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

interface LayoutProps {
    /** 팀 관리 모달 열기 핸들러 */
    onOpenTeamManager?: () => void;
    /** 수업 목록으로 돌아가기 핸들러 */
    onBackToCourses?: () => void;
    /** 시스템 로그아웃 핸들러 */
    onLogout?: () => void;
}

/** 메인 레이아웃 - 사이드바와 콘텐츠 영역으로 구성 */
export default function Layout({ onOpenTeamManager, onBackToCourses, onLogout }: LayoutProps) {
    // 모바일 사이드바 열림/닫힘 상태
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen">
            {/* 사이드바 */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                onOpenTeamManager={onOpenTeamManager}
                onBackToCourses={onBackToCourses}
                onLogout={onLogout}
            />

            {/* 사이드바 너비만큼 밀어주는 래퍼 - fixed 사이드바와 겹치지 않도록 */}
            <div className="sidebar-offset">
                {/* 메인 콘텐츠 영역 */}
                <main className="min-h-screen p-4 sm:p-6 overflow-x-hidden">
                    {/* 모바일 상단 헤더: 토글 버튼 + 타이틀 */}
                    <div className="lg:hidden flex items-center gap-3 mb-4 -mt-1">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl glass text-surface-200/70 hover:text-white 
                           hover:bg-white/10 transition-all duration-200 active:scale-95"
                            aria-label="메뉴 열기"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg font-bold gradient-text">GitCollab</h1>
                    </div>

                    <Outlet />
                </main>
            </div>
        </div>
    );
}

