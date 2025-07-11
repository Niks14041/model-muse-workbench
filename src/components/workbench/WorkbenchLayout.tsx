import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { WorkbenchSidebar } from './WorkbenchSidebar';
import { NotebookEditor } from './NotebookEditor';
import { WorkbenchHeader } from './WorkbenchHeader';
import { useWorkbenchStore } from '@/store/workbench-store';

export const WorkbenchLayout: React.FC = () => {
  const { activeNotebookId, isNotebookListOpen } = useWorkbenchStore();

  return (
    <SidebarProvider defaultOpen={isNotebookListOpen}>
      <div className="min-h-screen w-full bg-background">
        {/* Header */}
        <WorkbenchHeader />
        
        {/* Main content area */}
        <div className="flex h-[calc(100vh-4rem)] w-full">
          {/* Sidebar */}
          <WorkbenchSidebar />
          
          {/* Main editor */}
          <main className="flex-1 overflow-hidden bg-gradient-surface border-l border-border">
            {activeNotebookId ? (
              <NotebookEditor notebookId={activeNotebookId} />
            ) : (
              <WelcomeScreen />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

const WelcomeScreen: React.FC = () => {
  const createNotebook = useWorkbenchStore((state) => state.createNotebook);

  const handleCreateNotebook = async () => {
    await createNotebook('New Analysis');
  };

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-muted/50">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AryaXAI Workbench
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Interactive environment for model analysis and experimentation. 
            Create notebooks, run code cells, and document your findings.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateNotebook}
            className="inline-flex items-center px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg shadow-md hover:shadow-glow transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Notebook
          </button>
          
          <div className="text-sm text-muted-foreground">
            Or select an existing notebook from the sidebar
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-primary mb-2">Code Execution</h3>
            <p className="text-muted-foreground">
              Real-time code execution with Jupyter backend integration
            </p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold text-primary mb-2">Performance</h3>
            <p className="text-muted-foreground">
              Virtualized rendering for hundreds of code cells
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};