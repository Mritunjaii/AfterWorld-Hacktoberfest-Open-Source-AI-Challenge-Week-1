'use client';

import React from 'react';
import { History, Eye, Sparkles } from 'lucide-react';

export type TimeMode = 'past' | 'present' | 'future';

interface TimeTabsProps {
  currentMode: TimeMode;
  onSelectMode: (mode: TimeMode) => void;
}

export default function TimeTabs({ currentMode, onSelectMode }: TimeTabsProps) {
  const tabs: { id: TimeMode; label: string; icon: React.ReactNode; subtitle: string }[] = [
    {
      id: 'past',
      label: 'Past',
      subtitle: 'Documented History',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'present',
      label: 'Present',
      subtitle: 'Current Context',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      id: 'future',
      label: 'Future',
      subtitle: 'Imagined Horizon',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#f0eee6] rounded-xl border border-[#e8e5de]">
      {tabs.map((tab) => {
        const isActive = currentMode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectMode(tab.id)}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg transition-all duration-150 text-center ${
              isActive
                ? 'bg-white text-[#1c1c1a] shadow-xs font-medium'
                : 'text-[#73716b] hover:text-[#1c1c1a] hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className={isActive ? 'text-[#2e6059]' : 'text-[#73716b]'}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </div>
            <span className="text-[10px] text-[#73716b] hidden sm:block mt-0.5">
              {tab.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}
