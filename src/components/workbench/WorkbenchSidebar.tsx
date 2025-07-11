import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FileText, 
  Play, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  Clock
} from 'lucide-react';
import { useWorkbenchStore } from '@/store/workbench-store';
import { formatDistanceToNow } from 'date-fns';

export const WorkbenchSidebar: React.FC = () => {
  const { open } = useSidebar();
  const {
    notebooks,
    activeNotebookId,
    createNotebook,
    setActiveNotebook,
    deleteNotebook
  } = useWorkbenchStore();

  const handleCreateNotebook = async () => {
    await createNotebook();
  };

  const handleSelectNotebook = (notebookId: string) => {
    setActiveNotebook(notebookId);
  };

  const handleDeleteNotebook = (notebookId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this notebook?')) {
      deleteNotebook(notebookId);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-foreground ${!open && 'sr-only'}`}>
            Notebooks
          </h2>
          <Button
            onClick={handleCreateNotebook}
            size="sm"
            className="bg-gradient-primary text-white hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            {open && <span className="ml-2">New</span>}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={`${!open && 'sr-only'}`}>
            Recent Notebooks ({notebooks.length})
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {notebooks.length === 0 ? (
                <div className={`p-4 text-center text-muted-foreground ${!open && 'hidden'}`}>
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notebooks yet</p>
                  <p className="text-xs">Create your first notebook to get started</p>
                </div>
              ) : (
                notebooks.map((notebook) => (
                  <SidebarMenuItem key={notebook.id}>
                    <SidebarMenuButton
                      onClick={() => handleSelectNotebook(notebook.id)}
                      className={`w-full p-3 rounded-lg transition-all group ${
                        activeNotebookId === notebook.id
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center w-full">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        
                        {open && (
                          <div className="flex-1 ml-3 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate text-sm">
                                {notebook.name}
                              </h3>
                              
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handleDeleteNotebook(notebook.id, e)}
                                  className="p-1 hover:bg-destructive/20 rounded text-destructive"
                                  title="Delete notebook"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                              <div className="flex items-center space-x-2 text-xs opacity-70">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(notebook.lastModified)}</span>
                                </div>
                              </div>
                              
                              <Badge variant="secondary" className="text-xs">
                                {notebook.cells.length} cells
                              </Badge>
                            </div>
                            
                            {/* Cell status indicators */}
                            <div className="flex items-center space-x-1 mt-2">
                              {notebook.cells.slice(0, 5).map((cell, index) => (
                                <div
                                  key={cell.id}
                                  className={`w-2 h-2 rounded-full ${
                                    cell.status === 'running' 
                                      ? 'bg-code-running animate-pulse' 
                                      : cell.status === 'error'
                                      ? 'bg-code-error'
                                      : cell.status === 'completed'
                                      ? 'bg-code-success'
                                      : 'bg-muted-foreground/30'
                                  }`}
                                  title={`Cell ${index + 1}: ${cell.status}`}
                                />
                              ))}
                              {notebook.cells.length > 5 && (
                                <span className="text-xs opacity-50">
                                  +{notebook.cells.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};