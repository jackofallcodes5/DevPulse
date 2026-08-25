'use client';
import React, { useState } from 'react';
import Button from '../ui/Button';

export default function CommentEditor({ onSubmit, isLoading }) {
  const [body, setBody] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    onSubmit(body);
    setBody('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        rows={3}
        placeholder="Write a comment... (use @username to mention team members)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full px-3.5 py-2.5 text-sm bg-gray-900/80 text-white rounded-xl border border-gray-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder-gray-500"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" isLoading={isLoading} disabled={!body.trim()}>
          Comment
        </Button>
      </div>
    </form>
  );
}
