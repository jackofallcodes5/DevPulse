'use client';
import React from 'react';
import Avatar from '../ui/Avatar';

export default function CommentList({ comments = [] }) {
  if (comments.length === 0) {
    return <p className="text-xs text-gray-500 py-4 italic">No comments yet. Be the first to comment!</p>;
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="glass-card p-4 rounded-xl space-y-2 border border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Avatar src={c.author?.avatarUrl} name={c.author?.name || 'Author'} size="sm" />
              <div>
                <span className="text-xs font-semibold text-white">{c.author?.name}</span>
                <span className="text-[11px] text-gray-400 ml-1.5">@{c.author?.username}</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-500">
              {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed pl-8">
            {c.body}
          </p>
        </div>
      ))}
    </div>
  );
}
