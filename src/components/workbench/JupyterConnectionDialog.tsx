import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Server,
  Key
} from 'lucide-react';
import { useWorkbenchStore } from '@/store/workbench-store';

interface JupyterConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JupyterConnectionDialog: React.FC<JupyterConnectionDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [baseUrl, setBaseUrl] = useState('http://localhost:8888');
  const [token, setToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const {
    jupyterConnection,
    connectToJupyter,
    disconnectFromJupyter
  } = useWorkbenchStore();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await connectToJupyter(baseUrl, token);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectFromJupyter();
  };

  const testDockerSetup = () => {
    // Show instructions for Docker setup
    alert(`To run Jupyter with Docker:

1. Pull Jupyter image:
   docker pull jupyter/base-notebook

2. Run with port mapping:
   docker run -p 8888:8888 jupyter/base-notebook

3. Copy the token from container logs
4. Use http://localhost:8888 as base URL`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Server className="w-5 h-5" />
            <span>Jupyter Connection</span>
          </DialogTitle>
          <DialogDescription>
            Connect to a Jupyter server to enable code execution and real-time output.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              {jupyterConnection.isConnected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Disconnected</span>
                </>
              )}
            </div>
            
            <Badge 
              variant={jupyterConnection.isConnected ? "default" : "secondary"}
              className={jupyterConnection.isConnected ? "bg-success" : ""}
            >
              {jupyterConnection.isConnected ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* Connection Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl" className="flex items-center space-x-2">
                <Server className="w-4 h-4" />
                <span>Server URL</span>
              </Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:8888"
                disabled={jupyterConnection.isConnected}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="token" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Token (Optional)</span>
              </Label>
              <Input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Authentication token"
                disabled={jupyterConnection.isConnected}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            {jupyterConnection.isConnected ? (
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full"
              >
                <WifiOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !baseUrl}
                className="w-full bg-gradient-primary text-white hover:shadow-md"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={testDockerSetup}
              variant="outline"
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185"/>
              </svg>
              Docker Setup Guide
            </Button>
          </div>

          {/* Current Connection Info */}
          {jupyterConnection.isConnected && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Server:</span>
                  <span className="font-mono text-xs">{jupyterConnection.baseUrl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-success font-medium">Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};