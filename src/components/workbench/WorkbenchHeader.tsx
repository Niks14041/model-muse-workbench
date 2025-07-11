import React, { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Settings, 
  Wifi, 
  WifiOff, 
  Plus,
  Save,
  Download
} from 'lucide-react';
import { useWorkbenchStore, useActiveNotebook } from '@/store/workbench-store';
import { JupyterConnectionDialog } from './JupyterConnectionDialog';

export const WorkbenchHeader: React.FC = () => {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const {
    createNotebook,
    isExecuting,
    jupyterConnection
  } = useWorkbenchStore();
  
  const activeNotebook = useActiveNotebook();

  const handleCreateNotebook = async () => {
    await createNotebook();
  };

  const handleSaveNotebook = () => {
    // In a real implementation, this would save to Jupyter backend
    console.log('Saving notebook...');
  };

  const handleExportNotebook = () => {
    if (activeNotebook) {
      // Create a simplified export
      const exportData = {
        name: activeNotebook.name,
        cells: activeNotebook.cells.map(cell => ({
          code: cell.code,
          cellType: cell.cellType,
          output: cell.output
        })),
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeNotebook.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <header className="h-16 bg-card border-b border-border flex items-center px-4 shadow-sm">
        <div className="flex items-center space-x-4 flex-1">
          {/* Sidebar trigger */}
          <SidebarTrigger className="lg:hidden" />
          
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">AryaXAI Workbench</h1>
              {activeNotebook && (
                <p className="text-sm text-muted-foreground">{activeNotebook.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center actions */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreateNotebook}
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Notebook</span>
          </Button>

          {activeNotebook && (
            <>
              <Button
                onClick={handleSaveNotebook}
                variant="outline"
                size="sm"
                className="hidden md:flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </Button>

              <Button
                onClick={handleExportNotebook}
                variant="outline"
                size="sm"
                className="hidden md:flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4 ml-4">
          {/* Execution status */}
          {isExecuting && (
            <div className="flex items-center space-x-2 text-code-running">
              <div className="w-2 h-2 bg-code-running rounded-full animate-pulse" />
              <span className="text-sm font-medium hidden sm:inline">Executing...</span>
            </div>
          )}

          {/* Jupyter connection status */}
          <button
            onClick={() => setShowConnectionDialog(true)}
            className="flex items-center space-x-2 text-sm"
          >
            {jupyterConnection.isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-success" />
                <Badge variant="outline" className="border-success text-success hidden sm:inline-flex">
                  Connected
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-muted-foreground" />
                <Badge variant="outline" className="border-muted-foreground text-muted-foreground hidden sm:inline-flex">
                  Disconnected
                </Badge>
              </>
            )}
          </button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <JupyterConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
      />
    </>
  );
};