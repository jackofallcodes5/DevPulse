'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { monitorAPI } from '../../../../../lib/api';
import MonitorCard from '../../../../../components/monitoring/MonitorCard';
import MonitorForm from '../../../../../components/monitoring/MonitorForm';
import Modal from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import EmptyState from '../../../../../components/ui/EmptyState';
import { useSocket } from '../../../../../lib/socket';
import { Activity, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function APIMonitoringPage() {
  const params = useParams();
  const projectId = params.projectId;

  const [monitors, setMonitors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socket = useSocket(null, projectId);

  const fetchMonitors = useCallback(() => {
    if (!projectId) return;
    monitorAPI
      .getAll({ projectId })
      .then((res) => {
        if (res.data?.monitors) setMonitors(res.data.monitors);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  useEffect(() => {
    if (!socket) return;

    const handleCheck = ({ monitorId, check }) => {
      setMonitors((prev) =>
        prev.map((m) => (m.id === monitorId ? { ...m, checks: [check, ...(m.checks || [])] } : m))
      );
    };

    const handleIncident = ({ status }) => {
      toast(status === 'DOWN' ? `ALERT: Monitor is DOWN!` : `RECOVERY: Monitor is back UP!`, {
        icon: status === 'DOWN' ? '🚨' : '✅',
      });
      fetchMonitors();
    };

    socket.on('monitor:check', handleCheck);
    socket.on('monitor:incident', handleIncident);

    return () => {
      socket.off('monitor:check', handleCheck);
      socket.off('monitor:incident', handleIncident);
    };
  }, [socket, fetchMonitors]);

  const handleCreateMonitor = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await monitorAPI.create(formData);
      if (res.data?.monitor) {
        toast.success('API monitor created!');
        setMonitors([res.data.monitor, ...monitors]);
        setCreateModalOpen(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create monitor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (monitorId) => {
    try {
      const res = await monitorAPI.toggle(monitorId);
      if (res.data?.monitor) {
        setMonitors((prev) => prev.map((m) => (m.id === monitorId ? res.data.monitor : m)));
        toast.success(`Monitor ${res.data.monitor.active ? 'activated' : 'paused'}`);
      }
    } catch (err) {
      toast.error('Failed to toggle monitor');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            <span>API Health Monitoring</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Automated BullMQ background health checks, uptime metrics, and instant incident alerts
          </p>
        </div>

        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add API Monitor
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
        </div>
      ) : monitors.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No API Monitors Configured"
          description="Add your production or staging API health endpoints (e.g. GET /api/health) to automatically track response time and downtime incidents."
          actionLabel="Add API Monitor"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} onToggle={handleToggle} />
          ))}
        </div>
      )}

      {/* Create Monitor Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add API Endpoint Monitor"
        maxWidth="max-w-md"
      >
        <MonitorForm
          workspaceId={monitors[0]?.workspaceId || 'ws_default'}
          projectId={projectId}
          onSubmit={handleCreateMonitor}
          onCancel={() => setCreateModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}
