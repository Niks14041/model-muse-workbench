import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  GripVertical, 
  Trash2, 
  Plus,
  Square,
  Copy,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useWorkbenchStore, CodeCell as CodeCellType } from '@/store/workbench-store';
import { formatDistanceToNow } from 'date-fns';

interface CodeCellProps {
  notebookId: string;
  cell: CodeCellType;
  cellIndex: number;
}

export const CodeCell: React.FC<CodeCellProps> = ({ notebookId, cell, cellIndex }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [editorHeight, setEditorHeight] = useState(120);
  const editorRef = useRef<any>(null);
  
  const {
    updateCell,
    deleteCell,
    addCell,
    executeCell
  } = useWorkbenchStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cell.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Handle code changes
  const handleCodeChange = (value: string | undefined) => {
    updateCell(notebookId, cell.id, { code: value || '' });
  };

  // Handle cell execution
  const handleExecute = async () => {
    await executeCell(notebookId, cell.id);
  };

  // Handle cell deletion
  const handleDelete = () => {
    if (confirm('Delete this cell?')) {
      deleteCell(notebookId, cell.id);
    }
  };

  // Add cell below
  const handleAddBelow = () => {
    addCell(notebookId, 'code', cellIndex + 1);
  };

  // Copy cell
  const handleCopy = () => {
    navigator.clipboard.writeText(cell.code);
  };

  // Auto-resize editor based on content
  useEffect(() => {
    if (editorRef.current) {
      const lineCount = cell.code.split('\n').length;
      const newHeight = Math.max(120, Math.min(400, lineCount * 20 + 40));
      setEditorHeight(newHeight);
    }
  }, [cell.code]);

  // Format execution time
  const formatExecutionTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const getStatusIcon = () => {
    switch (cell.status) {
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-code-running" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-code-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-code-error" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (cell.status) {
      case 'running':
        return 'border-l-code-running bg-code-running/5';
      case 'completed':
        return 'border-l-code-success bg-code-success/5';
      case 'error':
        return 'border-l-code-error bg-code-error/5';
      default:
        return 'border-l-border bg-card';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border-l-4 transition-all duration-200 ${getStatusColor()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex">
        {/* Left gutter with execution count and drag handle */}
        <div className="w-16 flex-shrink-0 flex flex-col items-center justify-start p-2 bg-muted/30">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className={`p-1 rounded hover:bg-muted transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Execution count or status */}
          <div className="flex flex-col items-center space-y-1 mt-2">
            {getStatusIcon()}
            {cell.executionCount !== null && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {cell.executionCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Main cell content */}
        <div className="flex-1 min-w-0">
          {/* Cell toolbar */}
          <div className={`flex items-center justify-between p-2 border-b border-border/50 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {cell.cellType}
              </Badge>
              {cell.lastExecuted && (
                <span className="text-xs text-muted-foreground">
                  {formatExecutionTime(cell.lastExecuted)}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <Button
                onClick={handleExecute}
                size="sm"
                variant="ghost"
                disabled={cell.status === 'running'}
                className="h-7 px-2"
              >
                {cell.status === 'running' ? (
                  <Square className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </Button>

              <Button
                onClick={handleCopy}
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                title="Copy cell"
              >
                <Copy className="w-3 h-3" />
              </Button>

              <Button
                onClick={handleAddBelow}
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                title="Add cell below"
              >
                <Plus className="w-3 h-3" />
              </Button>

              <Button
                onClick={handleDelete}
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-destructive hover:text-destructive"
                title="Delete cell"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Code editor */}
          <div className="relative">
            <Editor
              height={editorHeight}
              defaultLanguage={cell.cellType === 'code' ? 'python' : 'markdown'}
              value={cell.code}
              onChange={handleCodeChange}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              theme="vs-light" // Will be handled by Monaco's theme system
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                glyphMargin: false,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                bracketPairColorization: { enabled: true },
                suggest: { preview: true },
                quickSuggestions: true,
              }}
              className="border-0"
            />
          </div>

          {/* Output area */}
          {cell.output.length > 0 && (
            <div className="bg-code-bg border-t border-code-border">
              <div className="p-3 max-h-64 overflow-auto">
                {cell.output.map((line, index) => (
                  <div
                    key={index}
                    className={`font-mono text-sm ${
                      cell.status === 'error' 
                        ? 'text-code-error' 
                        : 'text-foreground'
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};