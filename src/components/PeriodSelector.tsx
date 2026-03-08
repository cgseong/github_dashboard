// 기간 선택 컴포넌트
import { Calendar } from 'lucide-react';
import type { PeriodType } from '../types';
import { PERIOD_LABELS } from '../types';

interface PeriodSelectorProps {
    value: PeriodType;
    onChange: (period: PeriodType) => void;
    className?: string;
}

/** 기간 선택 드롭다운 */
export default function PeriodSelector({ value, onChange, className = '' }: PeriodSelectorProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Calendar className="w-4 h-4 text-primary-400" />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as PeriodType)}
                className="bg-surface-800/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
                   focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                   transition-all duration-200 cursor-pointer hover:bg-surface-700/80"
            >
                {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-surface-800">
                        {label}
                    </option>
                ))}
            </select>
        </div>
    );
}
