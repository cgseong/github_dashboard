import { useState } from 'react';
import { Github, Key, LogIn, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
    onLogin: (password: string) => boolean;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = onLogin(password);
        if (!success) {
            setError('관리자 비밀번호가 일치하지 않습니다.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm animate-fadeInUp">
                {/* 로고 영역 */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 
                          flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                        <Github className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold gradient-text mb-2">GitCollab 관리자</h1>
                    <p className="text-surface-200/60 text-sm">
                        시스템 관리자 로그인이 필요합니다
                    </p>
                </div>

                {/* 로그인 폼 */}
                <div className="glass-card p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm text-surface-200/70 ml-1">
                                시스템 관리자 비밀번호
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200/40" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="비밀번호를 입력하세요"
                                    className="w-full bg-surface-900/60 border border-white/10 rounded-lg pl-10 pr-4 py-2.5
                                             text-white text-sm placeholder:text-surface-200/30
                                             focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                                             transition-all duration-200"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-danger-500/10 border border-danger-500/20 animate-fadeIn fade-in-up">
                                <AlertCircle className="w-4 h-4 text-danger-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-danger-400">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!password.trim()}
                            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500
                                     text-white font-medium text-sm flex items-center justify-center gap-2
                                     hover:from-primary-500 hover:to-primary-400 hover:shadow-primary-500/30
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                     shadow-lg shadow-primary-500/20"
                        >
                            <LogIn className="w-4 h-4" />
                            접속하기
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
