'use client';
import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function MonitorForm({ workspaceId, projectId, onSubmit, onCancel, isLoading }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [intervalMinutes, setIntervalMinutes] = useState(5);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    onSubmit({
      name,
      url,
      method,
      expectedStatus: parseInt(expectedStatus, 10),
      intervalMinutes: parseInt(intervalMinutes, 10),
      workspaceId,
      projectId: projectId || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Monitor Name"
        placeholder="e.g. Production Health API"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label="URL to Monitor"
        placeholder="https://example.com/api/health"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-300">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="HEAD">HEAD</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-300">Expected Status</label>
          <input
            type="number"
            value={expectedStatus}
            onChange={(e) => setExpectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-300">Interval (min)</label>
          <select
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
          >
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="15">15 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Create Monitor
        </Button>
      </div>
    </form>
  );
}
