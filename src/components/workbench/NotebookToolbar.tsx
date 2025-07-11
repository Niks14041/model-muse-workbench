import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Play, 
  Square, 
  RotateCcw,
  Save,
  Settings,
  Code,
  Type
} from 'lucide-react';
import { useWorkbenchStore, useNotebookCells } from '@/store/workbench-store';

interface NotebookToolbarProps {
  notebookId: string;
}

export const NotebookToolbar: React.FC<NotebookToolbarProps> = ({ notebookId }) => {
  const cells = useNotebookCells(notebookId);
  const { 
    addCell, 
    isExecuting,
    executeCell 
  } = useWorkbenchStore();

  const handleAddCodeCell = () => {
    addCell(notebookId, 'code');
  };

  const handleAddMarkdownCell = () => {
    addCell(notebookId, 'markdown');
  };

  const handleRunAll = async () => {
    // Execute all code cells sequentially
    for (const cell of cells) {
      if (cell.cellType === 'code' && cell.code.trim()) {
        await executeCell(notebookId, cell.id);
      }
    }
  };

  const handleStopExecution = () => {
    // In a real implementation, this would stop the kernel execution
    console.log('Stopping execution...');
  };

  const handleRestartKernel = () => {
    // In a real implementation, this would restart the Jupyter kernel
    console.log('Restarting kernel...');
  };

  const runningCells = cells.filter(cell => cell.status === 'running').length;
  const completedCells = cells.filter(cell => cell.status === 'completed').length;
  const errorCells = cells.filter(cell => cell.status === 'error').length;

  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Cell actions */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleAddCodeCell}
            size="sm"
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </Button>

          <Button
            onClick={handleAddMarkdownCell}
            size="sm"
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Type className="w-4 h-4" />
            <span>Markdown</span>
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          {isExecuting ? (
            <Button
              onClick={handleStopExecution}
              size="sm"
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              onClick={handleRunAll}
              size="sm"
              className="bg-gradient-primary text-white hover:shadow-md flex items-center space-x-2"
              disabled={cells.length === 0}
            >
              <Play className="w-4 h-4" />
              <span>Run All</span>
            </Button>
          )}

          <Button
            onClick={handleRestartKernel}
            size="sm"
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
        </div>

        {/* Right side - Status and info */}
        <div className="flex items-center space-x-4">
          {/* Cell status badges */}
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-muted-foreground rounded-full" />
              <span>{cells.length} total</span>
            </Badge>

            {runningCells > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1 border-code-running text-code-running">
                <span className="w-2 h-2 bg-code-running rounded-full animate-pulse" />
                <span>{runningCells} running</span>
              </Badge>
            )}

            {completedCells > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1 border-code-success text-code-success">
                <span className="w-2 h-2 bg-code-success rounded-full" />
                <span>{completedCells} completed</span>
              </Badge>
            )}

            {errorCells > 0 && (
              <Badge variant="secondary" className="flex items-center space-x-1 border-code-error text-code-error">
                <span className="w-2 h-2 bg-code-error rounded-full" />
                <span>{errorCells} errors</span>
              </Badge>
            )}
          </div>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};