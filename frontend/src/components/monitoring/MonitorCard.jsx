'use client';
import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Activity, Globe, Clock, Power } from 'lucide-react';
import Button from '../ui/Button';

export default function MonitorCard({ monitor, onToggle, onDelete }) {
  const lastCheck = monitor.checks?.[0];
  const isUp = lastCheck?.success ?? true;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-base font-bold text-white">{monitor.name}</h4>
            <Badge variant={isUp ? 'UP' : 'DOWN'}>{isUp ? 'UP' : 'DOWN'}</Badge>
          </div>
          <p className="text-xs font-mono text-gray-400 flex items-center space-x-1 truncate">
            <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0 mr-1" />
            <span className="truncate">{monitor.url}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggle && onToggle(monitor.id)}
            title={monitor.active ? 'Deactivate Monitor' : 'Activate Monitor'}
            className={`p-2 rounded-lg transition ${
              monitor.active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-gray-800 text-gray-500 hover:text-white'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800/60 text-xs">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Method</p>
          <p className="font-semibold text-gray-300 font-mono">{monitor.method}</p>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Interval</p>
          <p className="font-semibold text-gray-300 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-purple-400" />
            <span>Every {monitor.intervalMinutes}m</span>
          </p>
        </div>

        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Last Check</p>
          <p className="font-semibold text-gray-300">
            {lastCheck ? `${lastCheck.responseTimeMs}ms` : 'Pending...'}
          </p>
        </div>
      </div>
    </Card>
  );
}
