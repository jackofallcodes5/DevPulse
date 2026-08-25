'use client';
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import IssueCard from './IssueCard';
import Button from '../ui/Button';
import { Plus } from 'lucide-react';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'border-slate-700/60' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-500/40' },
  { id: 'REVIEW', title: 'In Review', color: 'border-amber-500/40' },
  { id: 'DONE', title: 'Done', color: 'border-emerald-500/40' },
];

export default function KanbanBoard({ columnsData = {}, onStatusChange, onOpenCreate, onSelectIssue }) {
  const [columns, setColumns] = useState({
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
    ...columnsData,
  });

  useEffect(() => {
    setColumns({
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      ...columnsData,
    });
  }, [columnsData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeIssueId = active.id;
    let targetColumn = over.id;

    // Find column if dropped over an issue item
    if (!['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].includes(targetColumn)) {
      for (const [colId, issues] of Object.entries(columns)) {
        if (issues.some((i) => i.id === over.id)) {
          targetColumn = colId;
          break;
        }
      }
    }

    if (!['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].includes(targetColumn)) return;

    // Find current column of active issue
    let sourceColumn = null;
    let draggedIssue = null;

    for (const [colId, issues] of Object.entries(columns)) {
      const found = issues.find((i) => i.id === activeIssueId);
      if (found) {
        sourceColumn = colId;
        draggedIssue = found;
        break;
      }
    }

    if (!draggedIssue || sourceColumn === targetColumn) return;

    // Optimistic UI update
    setColumns((prev) => {
      const sourceList = prev[sourceColumn].filter((i) => i.id !== activeIssueId);
      const targetList = [...prev[targetColumn], { ...draggedIssue, status: targetColumn }];
      return {
        ...prev,
        [sourceColumn]: sourceList,
        [targetColumn]: targetList,
      };
    });

    onStatusChange(draggedIssue.id, targetColumn);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {COLUMNS.map((col) => {
          const issues = columns[col.id] || [];

          return (
            <div
              key={col.id}
              className={`glass-panel p-4 rounded-2xl border-t-2 ${col.color} flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-400">
                    {issues.length}
                  </span>
                </div>
                {onOpenCreate && (
                  <button
                    onClick={() => onOpenCreate(col.id)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sortable Column List */}
              <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {issues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} onClick={() => onSelectIssue && onSelectIssue(issue)} />
                  ))}
                  {issues.length === 0 && (
                    <div className="h-24 border border-dashed border-gray-800/80 rounded-xl flex items-center justify-center text-xs text-gray-600">
                      Empty column
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
