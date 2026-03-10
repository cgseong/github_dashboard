// 메인 앱 컴포넌트 - 다중 수업/팀 관리, 라우팅 및 전역 상태 관리
import { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { PeriodType, CourseConfig, TeamConfig, RepoConfig } from './types';
import { useGitHub } from './hooks/useGitHub';
import Layout from './components/Layout';
import CourseSelector from './components/CourseSelector';
import PeriodSelector from './components/PeriodSelector';
import TeamSelector from './components/TeamSelector';
import TeamManager from './components/TeamManager';
import AdminLogin from './components/AdminLogin';
import Dashboard from './pages/Dashboard';
import Contributors from './pages/Contributors';
import CodeInsights from './pages/CodeInsights';
import AIEvaluation from './pages/AIEvaluation';

// 파일 API를 통해 수업 설정을 data/courses.json에 저장/불러오기
// Vite 플러그인이 /api/courses 엔드포인트를 제공 (별도 서버 불필요)

/** 서버 파일에서 수업 목록 불러오기 */
async function fetchCoursesFromFile(): Promise<CourseConfig[]> {
  try {
    const res = await fetch('/api/courses');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data as CourseConfig[];
    }
    return [];
  } catch {
    console.warn('파일 API 연결 실패, localStorage에서 불러옵니다.');
    // 폴백: localStorage에서 불러오기
    try {
      const stored = localStorage.getItem('gitcollab_courses');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

/** 서버 파일에 수업 목록 저장 */
async function saveCoursesToFile(courses: CourseConfig[]) {
  try {
    await fetch('/api/courses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courses),
    });
  } catch {
    console.warn('파일 API 저장 실패, localStorage에 저장합니다.');
  }
  // localStorage에도 백업 저장
  localStorage.setItem('gitcollab_courses', JSON.stringify(courses));
}

function App() {
  // 수업 목록 상태
  const [courses, setCourses] = useState<CourseConfig[]>([]);
  // 현재 선택된 수업
  const [selectedCourse, setSelectedCourse] = useState<CourseConfig | null>(null);
  // 대시보드 진입 여부
  const [connected, setConnected] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('1w');
  // 로드 완료 여부 상태
  const [isInitializing, setIsInitializing] = useState(true);

  // 전체 관리자 로그인 상태
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return sessionStorage.getItem('gitcollab_admin_logged_in') === 'true';
  });

  // 현재 선택된 팀 ID
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  // 로딩 중인 팀 ID
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  // 팀 관리 모달 열림 상태
  const [showTeamManager, setShowTeamManager] = useState(false);
  // 초기 로드 완료 여부 (중복 로드 방지용)
  const initialLoadDone = useRef(false);

  // GitHub 데이터 훅
  const github = useGitHub();

  /** 선택된 팀의 RepoConfig 생성 헬퍼 */
  const getRepoConfig = useCallback((team: TeamConfig, token: string): RepoConfig => ({
    owner: team.owner,
    repo: team.repo,
    token,
  }), []);

  /** 앱 시작 시 파일에서 수업 목록 불러오기 (수업 선택 화면 표시) */
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    // 파일 API로 수업 목록 조회 (실패 시 localStorage 폴백)
    fetchCoursesFromFile().then(savedCourses => {
      setCourses(savedCourses);
      setIsInitializing(false);
    });
  }, []);

  /** 수업 목록 업데이트 (CourseSelector에서 호출) → 파일에 저장 */
  const handleUpdateCourses = (updatedCourses: CourseConfig[]) => {
    setCourses(updatedCourses);
    saveCoursesToFile(updatedCourses);
  };

  /** 수업 선택 (대시보드 진입) */
  const handleSelectCourse = async (course: CourseConfig) => {
    setSelectedCourse(course);

    if (course.teams.length > 0) {
      const firstTeam = course.teams[0];
      setSelectedTeamId(firstTeam.id);
      setLoadingTeamId(firstTeam.id);

      try {
        await github.loadData(getRepoConfig(firstTeam, course.token), period);
        setConnected(true);
      } finally {
        setLoadingTeamId(null);
      }
    }
  };

  /** 수업 목록으로 돌아가기 */
  const handleBackToCourses = () => {
    setConnected(false);
    setSelectedCourse(null);
    setSelectedTeamId('');
    // 서버 파일에서 수업 목록을 다시 불러오기 (최신 상태 반영)
    fetchCoursesFromFile().then(latest => setCourses(latest));
  };

  /** 팀 전환 핸들러 */
  const handleSelectTeam = async (teamId: string) => {
    if (!selectedCourse || teamId === selectedTeamId || loadingTeamId) return;

    const team = selectedCourse.teams.find(t => t.id === teamId);
    if (!team) return;

    setSelectedTeamId(teamId);
    setLoadingTeamId(teamId);

    try {
      await github.loadData(getRepoConfig(team, selectedCourse.token), period);
    } finally {
      setLoadingTeamId(null);
    }
  };

  /** 기간 변경 핸들러 */
  const handlePeriodChange = async (newPeriod: PeriodType) => {
    setPeriod(newPeriod);

    if (!selectedCourse) return;
    const team = selectedCourse.teams.find(t => t.id === selectedTeamId);
    if (!team) return;

    setLoadingTeamId(team.id);
    try {
      await github.loadData(getRepoConfig(team, selectedCourse.token), newPeriod);
    } finally {
      setLoadingTeamId(null);
    }
  };

  /** 팀 목록 업데이트 핸들러 (팀 관리 모달에서 호출) */
  const handleUpdateTeams = async (updatedTeams: TeamConfig[]) => {
    if (!selectedCourse) return;

    // 팀이 모두 삭제된 경우 → 수업 목록으로 돌아감
    if (updatedTeams.length === 0) {
      const updatedCourses = courses.filter(c => c.id !== selectedCourse.id);
      setCourses(updatedCourses);
      saveCoursesToFile(updatedCourses);
      handleBackToCourses();
      return;
    }

    // 업데이트된 수업 설정 생성
    const updatedCourse: CourseConfig = { ...selectedCourse, teams: updatedTeams };
    setSelectedCourse(updatedCourse);

    // 전체 수업 목록도 업데이트
    const updatedCourses = courses.map(c => c.id === selectedCourse.id ? updatedCourse : c);
    setCourses(updatedCourses);
    saveCoursesToFile(updatedCourses);

    // 현재 선택된 팀이 삭제되었는지 확인
    const currentTeamExists = updatedTeams.find(t => t.id === selectedTeamId);
    if (!currentTeamExists) {
      const firstTeam = updatedTeams[0];
      setSelectedTeamId(firstTeam.id);
      setLoadingTeamId(firstTeam.id);
      try {
        await github.loadData(getRepoConfig(firstTeam, selectedCourse.token), period);
      } finally {
        setLoadingTeamId(null);
      }
    } else {
      // owner/repo가 변경되었는지 확인
      const originalTeam = selectedCourse.teams.find(t => t.id === selectedTeamId);
      if (originalTeam && (originalTeam.owner !== currentTeamExists.owner || originalTeam.repo !== currentTeamExists.repo)) {
        setLoadingTeamId(currentTeamExists.id);
        try {
          await github.loadData(getRepoConfig(currentTeamExists, selectedCourse.token), period);
        } finally {
          setLoadingTeamId(null);
        }
      }
    }
  };

  // 현재 선택된 팀 정보
  const selectedTeam = selectedCourse?.teams.find(t => t.id === selectedTeamId);

  // 글로벌 관리자 로그인 핸들러
  const handleGlobalAdminLogin = (password: string) => {
    // 임시 하드코딩된 시스템 관리자 비밀번호
    if (password === 'admin7856') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('gitcollab_admin_logged_in', 'true');
      return true;
    }
    return false;
  };

  // 글로벌 관리자 로그아웃 핸들러
  const handleGlobalAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('gitcollab_admin_logged_in');
  };

  // 0. 초기 데이터 로딩 중 화면
  if (isInitializing) {
    return <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // 1. 관리자 로그인 미완료 시 로그인 화면 표시
  if (!isAdminLoggedIn) {
    return <AdminLogin onLogin={handleGlobalAdminLogin} />;
  }

  // 2. 대시보드 미진입: 수업 선택/관리 화면
  if (!connected) {
    return (
      <CourseSelector
        courses={courses}
        onUpdateCourses={handleUpdateCourses}
        onSelectCourse={handleSelectCourse}
        loading={github.loading}
      />
    );
  }

  return (
    <BrowserRouter>
      {/* 팀 관리 모달 */}
      {showTeamManager && selectedCourse && (
        <TeamManager
          teams={selectedCourse.teams}
          onUpdateTeams={handleUpdateTeams}
          onClose={() => setShowTeamManager(false)}
        />
      )}

      <Routes>
        <Route element={
          <Layout
            onOpenTeamManager={() => setShowTeamManager(true)}
            onBackToCourses={handleBackToCourses}
            onLogout={handleGlobalAdminLogout}
          />
        }>
          <Route
            path="/"
            element={
              <div className="space-y-4">
                {/* 상단 바: 수업 정보 + 팀 탭 + 기간 선택 */}
                <div className="space-y-3">
                  {/* 첫 번째 줄: 수업 이름 + 기간 선택 */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-white">{selectedCourse?.courseName}</h2>
                      {selectedTeam && (
                        <span className="font-mono text-xs bg-surface-800 px-2 py-0.5 rounded text-primary-300">
                          {selectedTeam.owner}/{selectedTeam.repo}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <PeriodSelector value={period} onChange={handlePeriodChange} />
                      {loadingTeamId && (
                        <div className="flex items-center gap-2 text-sm text-primary-400">
                          <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                          로딩 중...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 두 번째 줄: 팀 탭 (2개 이상일 때만 표시) */}
                  {selectedCourse && selectedCourse.teams.length > 1 && (
                    <TeamSelector
                      teams={selectedCourse.teams}
                      selectedTeamId={selectedTeamId}
                      onSelectTeam={handleSelectTeam}
                      loadingTeamId={loadingTeamId}
                    />
                  )}
                </div>

                <Dashboard
                  summary={github.repoSummary}
                  dailyActivity={github.dailyActivity}
                  pullRequests={github.pullRequests}
                  issues={github.issues}
                  repoTree={github.repoTree}
                />
              </div>
            }
          />
          <Route
            path="/contributors"
            element={
              <div className="space-y-4">
                {selectedCourse && selectedCourse.teams.length > 1 && (
                  <TeamSelector
                    teams={selectedCourse.teams}
                    selectedTeamId={selectedTeamId}
                    onSelectTeam={handleSelectTeam}
                    loadingTeamId={loadingTeamId}
                  />
                )}
                <Contributors
                  contributorStats={github.contributorStats}
                  commits={github.commits}
                />
              </div>
            }
          />
          <Route
            path="/insights"
            element={
              <div className="space-y-4">
                {selectedCourse && selectedCourse.teams.length > 1 && (
                  <TeamSelector
                    teams={selectedCourse.teams}
                    selectedTeamId={selectedTeamId}
                    onSelectTeam={handleSelectTeam}
                    loadingTeamId={loadingTeamId}
                  />
                )}
                <CodeInsights
                  weeklyCodeChanges={github.weeklyCodeChanges}
                  dailyActivity={github.dailyActivity}
                  commits={github.commits}
                  contributorStats={github.contributorStats}
                />
              </div>
            }
          />
          <Route
            path="/ai-evaluation"
            element={
              <div className="space-y-4">
                {selectedCourse && selectedCourse.teams.length > 1 && (
                  <TeamSelector
                    teams={selectedCourse.teams}
                    selectedTeamId={selectedTeamId}
                    onSelectTeam={handleSelectTeam}
                    loadingTeamId={loadingTeamId}
                  />
                )}
                <AIEvaluation
                  contributorStats={github.contributorStats}
                  repoSummary={github.repoSummary}
                  commits={github.commits}
                  pullRequests={github.pullRequests}
                  reviews={github.reviews}
                />
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
