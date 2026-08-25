'use client';
import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function IssueForm({ initialStatus = 'TODO', onSubmit, onCancel, isLoading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState('MEDIUM');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      description,
      status,
      priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        placeholder="e.g. Fix API login timeout"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-300">Description</label>
        <textarea
          rows={4}
          placeholder="Describe the issue, reproduction steps, or context..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-gray-900/80 text-white rounded-lg border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder-gray-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-300">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-300">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-gray-900 text-white rounded-lg border border-gray-800 focus:border-purple-500 outline-none"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
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
          Create Issue
        </Button>
      </div>
    </form>
  );
}
