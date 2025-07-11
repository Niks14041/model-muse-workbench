import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CodeCell } from './CodeCell';
import { NotebookToolbar } from './NotebookToolbar';
import { useWorkbenchStore, useNotebookCells } from '@/store/workbench-store';

interface NotebookEditorProps {
  notebookId: string;
}

export const NotebookEditor: React.FC<NotebookEditorProps> = ({ notebookId }) => {
  const cells = useNotebookCells(notebookId);
  const { reorderCells } = useWorkbenchStore();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create parent ref for virtualizer
  const parentRef = React.useRef<HTMLDivElement>(null);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: cells.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated cell height
    overscan: 5, // Render 5 extra items outside viewport
  });

  // Memoize cell IDs for DnD
  const cellIds = useMemo(() => cells.map(cell => cell.id), [cells]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = cellIds.indexOf(active.id);
      const newIndex = cellIds.indexOf(over.id);
      
      reorderCells(notebookId, oldIndex, newIndex);
    }
  };

  if (cells.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">Empty Notebook</h3>
            <p className="text-muted-foreground">Add your first code cell to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Notebook toolbar */}
      <NotebookToolbar notebookId={notebookId} />

      {/* Virtualized cell list */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={cellIds} strategy={verticalListSortingStrategy}>
            <div
              ref={parentRef}
              className="h-full overflow-auto"
              style={{
                contain: 'strict',
              }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const cell = cells[virtualItem.index];
                  if (!cell) return null;

                  return (
                    <div
                      key={cell.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <CodeCell
                        notebookId={notebookId}
                        cell={cell}
                        cellIndex={virtualItem.index}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};