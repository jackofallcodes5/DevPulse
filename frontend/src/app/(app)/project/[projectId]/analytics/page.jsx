'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { analyticsAPI } from '../../../../../lib/api';
import Card from '../../../../../components/ui/Card';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function AnalyticsPage() {
  const params = useParams();
  const projectId = params.projectId;

  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      analyticsAPI
        .getProject(projectId)
        .then((res) => {
          if (res.data?.analytics) setAnalytics(res.data.analytics);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [projectId]);

  const issueChartData = [
    { name: 'To Do', count: analytics?.issues?.byStatus?.TODO || 0, fill: '#64748b' },
    { name: 'In Progress', count: analytics?.issues?.byStatus?.IN_PROGRESS || 0, fill: '#3b82f6' },
    { name: 'In Review', count: analytics?.issues?.byStatus?.REVIEW || 0, fill: '#f59e0b' },
    { name: 'Done', count: analytics?.issues?.byStatus?.DONE || 0, fill: '#10b981' },
  ];

  const responseTimeData = [
    { time: '12:00', ms: 142 },
    { time: '12:05', ms: 156 },
    { time: '12:10', ms: 138 },
    { time: '12:15', ms: 189 },
    { time: '12:20', ms: 145 },
    { time: '12:25', ms: 150 },
    { time: '12:30', ms: 162 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <span>Engineering Analytics</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Velocity metrics, issue resolution distribution, and API performance telemetry
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issue Distribution Bar Chart */}
            <Card className="space-y-4 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Issue Status Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={issueChartData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#161b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Response Time Area Chart */}
            <Card className="space-y-4 p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                API Response Time (ms)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={responseTimeData}>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: '#161b2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="ms" stroke="#06b6d4" fill="rgba(6,182,212,0.15)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
