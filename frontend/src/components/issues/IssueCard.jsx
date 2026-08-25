'use client';
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { MessageSquare, GitCommit } from 'lucide-react';

export default function IssueCard({ issue, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="glass-card p-3.5 rounded-xl border border-white/5 hover:border-purple-500/30 cursor-grab active:cursor-grabbing space-y-2.5 transition group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-purple-400 font-medium">#{issue.number}</span>
        <Badge variant={issue.priority} className="text-[10px]" />
      </div>

      <h4 className="text-xs font-semibold text-white group-hover:text-purple-300 transition line-clamp-2">
        {issue.title}
      </h4>

      <div className="flex items-center justify-between pt-1 border-t border-gray-800/40 text-[11px] text-gray-500">
        <div className="flex items-center space-x-2">
          {issue._count?.comments > 0 && (
            <span className="flex items-center space-x-1 text-gray-400">
              <MessageSquare className="w-3 h-3" />
              <span>{issue._count.comments}</span>
            </span>
          )}
          {issue._count?.commits > 0 && (
            <span className="flex items-center space-x-1 text-purple-400">
              <GitCommit className="w-3 h-3" />
              <span>{issue._count.commits}</span>
            </span>
          )}
        </div>

        {issue.assignee && (
          <Avatar src={issue.assignee.avatarUrl} name={issue.assignee.name} size="sm" />
        )}
      </div>
    </div>
  );
}
