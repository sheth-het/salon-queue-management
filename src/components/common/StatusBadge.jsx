import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function StatusBadge({ status }) {
  const { t } = useLanguage();

  const configs = {
    waiting: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
      label: t('status.waiting'),
    },
    called: {
      bg: 'bg-gold-500/20',
      text: 'text-gold-300 font-bold',
      border: 'border-gold-500/60',
      dot: 'bg-gold-400 animate-ping',
      label: t('status.called'),
    },
    in_service: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400 animate-pulse',
      label: t('status.in_service'),
    },
    completed: {
      bg: 'bg-zinc-700/30',
      text: 'text-zinc-400',
      border: 'border-zinc-600/30',
      dot: 'bg-zinc-400',
      label: t('status.completed'),
    },
    no_show: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400',
      label: t('status.no_show'),
    },
    cancelled: {
      bg: 'bg-rose-900/20',
      text: 'text-rose-400',
      border: 'border-rose-800/30',
      dot: 'bg-rose-500',
      label: t('status.cancelled'),
    },
  };

  const current = configs[status] || configs.waiting;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}
