import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Types for the workbench
export interface CodeCell {
  id: string;
  code: string;
  output: string[];
  executionCount: number | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  cellType: 'code' | 'markdown';
  createdAt: string;
  lastExecuted?: string;
}

export interface Notebook {
  id: string;
  name: string;
  cells: CodeCell[];
  kernelId?: string;
  sessionId?: string;
  createdAt: string;
  lastModified: string;
  metadata: {
    kernelspec?: {
      name: string;
      display_name: string;
    };
  };
}

export interface JupyterConnection {
  baseUrl: string;
  token?: string;
  isConnected: boolean;
  websocket?: WebSocket;
}

export interface WorkbenchState {
  // Notebooks management
  notebooks: Notebook[];
  activeNotebookId: string | null;
  
  // UI state
  isNotebookListOpen: boolean;
  isExecuting: boolean;
  
  // Jupyter connection
  jupyterConnection: JupyterConnection;
  
  // Actions for notebooks
  createNotebook: (name?: string) => Promise<string>;
  deleteNotebook: (notebookId: string) => void;
  setActiveNotebook: (notebookId: string | null) => void;
  updateNotebook: (notebookId: string, updates: Partial<Notebook>) => void;
  
  // Actions for cells
  addCell: (notebookId: string, cellType?: 'code' | 'markdown', index?: number) => string;
  deleteCell: (notebookId: string, cellId: string) => void;
  updateCell: (notebookId: string, cellId: string, updates: Partial<CodeCell>) => void;
  reorderCells: (notebookId: string, fromIndex: number, toIndex: number) => void;
  executeCell: (notebookId: string, cellId: string) => Promise<void>;
  
  // UI actions
  toggleNotebookList: () => void;
  
  // Jupyter connection actions
  connectToJupyter: (baseUrl: string, token?: string) => Promise<boolean>;
  disconnectFromJupyter: () => void;
  initializeKernel: (notebookId: string) => Promise<boolean>;
}

// Helper functions
const generateId = () => crypto.randomUUID();

const createNewCell = (cellType: 'code' | 'markdown' = 'code'): CodeCell => ({
  id: generateId(),
  code: '',
  output: [],
  executionCount: null,
  status: 'idle',
  cellType,
  createdAt: new Date().toISOString(),
});

const createNewNotebook = (name?: string): Notebook => {
  const timestamp = new Date().toISOString();
  return {
    id: generateId(),
    name: name || `Untitled Notebook ${new Date().toLocaleString()}`,
    cells: [createNewCell('code')], // Start with one empty code cell
    createdAt: timestamp,
    lastModified: timestamp,
    metadata: {
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3'
      }
    }
  };
};

// Zustand store with advanced state management
export const useWorkbenchStore = create<WorkbenchState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      notebooks: [],
      activeNotebookId: null,
      isNotebookListOpen: true,
      isExecuting: false,
      jupyterConnection: {
        baseUrl: 'http://localhost:8888',
        isConnected: false,
      },

      // Notebook management actions
      createNotebook: async (name?: string) => {
        const newNotebook = createNewNotebook(name);
        
        set((state) => ({
          notebooks: [...state.notebooks, newNotebook],
          activeNotebookId: newNotebook.id,
        }));

        // Try to create notebook in Jupyter backend if connected
        const { jupyterConnection } = get();
        if (jupyterConnection.isConnected) {
          try {
            const response = await fetch(`${jupyterConnection.baseUrl}/api/contents/${newNotebook.name}.ipynb`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(jupyterConnection.token && { 'Authorization': `token ${jupyterConnection.token}` })
              },
              body: JSON.stringify({
                type: 'notebook',
                format: 'json',
                content: {
                  cells: newNotebook.cells.map(cell => ({
                    cell_type: cell.cellType,
                    source: cell.code,
                    metadata: {},
                    outputs: [],
                    execution_count: cell.executionCount
                  })),
                  metadata: newNotebook.metadata,
                  nbformat: 4,
                  nbformat_minor: 4
                }
              })
            });

            if (response.ok) {
              console.log('Notebook created in Jupyter backend');
            }
          } catch (error) {
            console.warn('Failed to create notebook in Jupyter backend:', error);
          }
        }

        return newNotebook.id;
      },

      deleteNotebook: (notebookId: string) => {
        set((state) => {
          const newNotebooks = state.notebooks.filter(nb => nb.id !== notebookId);
          const newActiveId = state.activeNotebookId === notebookId 
            ? (newNotebooks.length > 0 ? newNotebooks[0].id : null)
            : state.activeNotebookId;
          
          return {
            notebooks: newNotebooks,
            activeNotebookId: newActiveId,
          };
        });
      },

      setActiveNotebook: (notebookId: string | null) => {
        set({ activeNotebookId: notebookId });
      },

      updateNotebook: (notebookId: string, updates: Partial<Notebook>) => {
        set((state) => ({
          notebooks: state.notebooks.map(notebook =>
            notebook.id === notebookId
              ? { ...notebook, ...updates, lastModified: new Date().toISOString() }
              : notebook
          ),
        }));
      },

      // Cell management actions
      addCell: (notebookId: string, cellType: 'code' | 'markdown' = 'code', index?: number) => {
        const newCell = createNewCell(cellType);
        
        set((state) => ({
          notebooks: state.notebooks.map(notebook => {
            if (notebook.id === notebookId) {
              const cells = [...notebook.cells];
              const insertIndex = index !== undefined ? index : cells.length;
              cells.splice(insertIndex, 0, newCell);
              
              return {
                ...notebook,
                cells,
                lastModified: new Date().toISOString()
              };
            }
            return notebook;
          }),
        }));

        return newCell.id;
      },

      deleteCell: (notebookId: string, cellId: string) => {
        set((state) => ({
          notebooks: state.notebooks.map(notebook =>
            notebook.id === notebookId
              ? {
                  ...notebook,
                  cells: notebook.cells.filter(cell => cell.id !== cellId),
                  lastModified: new Date().toISOString()
                }
              : notebook
          ),
        }));
      },

      updateCell: (notebookId: string, cellId: string, updates: Partial<CodeCell>) => {
        set((state) => ({
          notebooks: state.notebooks.map(notebook =>
            notebook.id === notebookId
              ? {
                  ...notebook,
                  cells: notebook.cells.map(cell =>
                    cell.id === cellId ? { ...cell, ...updates } : cell
                  ),
                  lastModified: new Date().toISOString()
                }
              : notebook
          ),
        }));
      },

      reorderCells: (notebookId: string, fromIndex: number, toIndex: number) => {
        set((state) => ({
          notebooks: state.notebooks.map(notebook => {
            if (notebook.id === notebookId) {
              const cells = [...notebook.cells];
              const [movedCell] = cells.splice(fromIndex, 1);
              cells.splice(toIndex, 0, movedCell);
              
              return {
                ...notebook,
                cells,
                lastModified: new Date().toISOString()
              };
            }
            return notebook;
          }),
        }));
      },

      executeCell: async (notebookId: string, cellId: string) => {
        const { notebooks, jupyterConnection } = get();
        const notebook = notebooks.find(nb => nb.id === notebookId);
        const cell = notebook?.cells.find(c => c.id === cellId);
        
        if (!cell || !jupyterConnection.isConnected) {
          console.warn('Cannot execute cell: missing cell or Jupyter connection');
          return;
        }

        // Update cell status to running
        get().updateCell(notebookId, cellId, { 
          status: 'running', 
          output: [],
          lastExecuted: new Date().toISOString()
        });

        set({ isExecuting: true });

        try {
          // Execute cell via Jupyter kernel API
          // This is a simplified implementation - real implementation would use WebSocket
          console.log('Executing cell:', cell.code);
          
          // Simulate execution delay
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          
          // Simulate output
          const mockOutput = [
            `Executed: ${cell.code}`,
            `Result: ${Math.random() > 0.8 ? 'Error occurred' : 'Success'}`
          ];
          
          const status = Math.random() > 0.8 ? 'error' : 'completed';
          
          get().updateCell(notebookId, cellId, {
            status,
            output: mockOutput,
            executionCount: (cell.executionCount || 0) + 1,
          });

        } catch (error) {
          console.error('Cell execution failed:', error);
          get().updateCell(notebookId, cellId, {
            status: 'error',
            output: [`Error: ${error}`],
          });
        } finally {
          set({ isExecuting: false });
        }
      },

      // UI actions
      toggleNotebookList: () => {
        set((state) => ({ isNotebookListOpen: !state.isNotebookListOpen }));
      },

      // Jupyter connection actions
      connectToJupyter: async (baseUrl: string, token?: string) => {
        try {
          // Test connection to Jupyter server
          const response = await fetch(`${baseUrl}/api/kernelspecs`, {
            headers: {
              ...(token && { 'Authorization': `token ${token}` })
            }
          });

          if (response.ok) {
            set((state) => ({
              jupyterConnection: {
                ...state.jupyterConnection,
                baseUrl,
                token,
                isConnected: true,
              },
            }));
            return true;
          } else {
            throw new Error(`Failed to connect: ${response.statusText}`);
          }
        } catch (error) {
          console.error('Failed to connect to Jupyter:', error);
          set((state) => ({
            jupyterConnection: {
              ...state.jupyterConnection,
              isConnected: false,
            },
          }));
          return false;
        }
      },

      disconnectFromJupyter: () => {
        const { jupyterConnection } = get();
        
        if (jupyterConnection.websocket) {
          jupyterConnection.websocket.close();
        }

        set((state) => ({
          jupyterConnection: {
            ...state.jupyterConnection,
            isConnected: false,
            websocket: undefined,
          },
        }));
      },

      initializeKernel: async (notebookId: string) => {
        const { jupyterConnection } = get();
        
        if (!jupyterConnection.isConnected) {
          return false;
        }

        try {
          // Start a new kernel session
          const response = await fetch(`${jupyterConnection.baseUrl}/api/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(jupyterConnection.token && { 'Authorization': `token ${jupyterConnection.token}` })
            },
            body: JSON.stringify({
              name: `notebook-${notebookId}`,
              type: 'notebook',
              kernel: { name: 'python3' }
            })
          });

          if (response.ok) {
            const session = await response.json();
            
            get().updateNotebook(notebookId, {
              kernelId: session.kernel.id,
              sessionId: session.id,
            });

            return true;
          }
        } catch (error) {
          console.error('Failed to initialize kernel:', error);
        }

        return false;
      },
    })),
    { name: 'workbench-store' }
  )
);

// Computed selectors for better performance
export const useActiveNotebook = () => 
  useWorkbenchStore((state) => 
    state.notebooks.find(nb => nb.id === state.activeNotebookId)
  );

export const useNotebookCells = (notebookId: string | null) =>
  useWorkbenchStore((state) => 
    notebookId 
      ? state.notebooks.find(nb => nb.id === notebookId)?.cells || []
      : []
  );