import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Activity, Play, AudioWaveform, BringToFront, Workflow, StickyNote } from 'lucide-react';
import { Flow } from '../../services/Pb-getFlowService';
import { useSystemFlows, useUserFlows } from '../../services/FlowContexts';
import pb from '../../services/Pb-getFlowService';
import { getDefaultNodes, DefaultNode } from '../../services/DefaultNodesService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import log from 'loglevel';
import { useToast } from "@/hooks/use-toast";
import NewFlowModal from '../NewFlowModal';

log.setLevel("debug");

interface SidebarProps {
  isExpanded: boolean;
  searchTerm: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, searchTerm }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const { systemFlows, loading: systemLoading } = useSystemFlows();
  const { userFlows, loading: userLoading, refreshUserFlows } = useUserFlows();
  const defaultNodes = getDefaultNodes();

  // Effect for refreshing user flows when user changes
  useEffect(() => {
    if (user?.id) {
      refreshUserFlows();
    }
  }, [user, refreshUserFlows]);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, flow?: Flow) => {
    log.debug(`[Sidebar] Drag started: ${nodeType}`, flow);
    if (flow) {
      event.dataTransfer.setData('application/reactflow', JSON.stringify({
        type: flow.isSystemFlow ? 'systemFlow' : 'userFlow',
        flowId: flow.id
      }));
    } else {
      event.dataTransfer.setData('application/reactflow', nodeType);
    }
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleCreateNewFlow = useCallback(async (name: string, description: string) => {
    log.debug(`[Sidebar] Creating new flow: ${name}, ${description}`);
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a new flow.",
        variant: "destructive"
      });
      return;
    }

    try {
      log.debug('[Sidebar] Creating new flow in PocketBase');
      const newFlow = await pb.collection('flows').create({
        title: name,
        description: description,
        creator: user.id,
        isSystemFlow: false,
        isShared: true,
        flow: JSON.stringify({ nodes: [], edges: [], viewport: {} })
      });

      log.debug('[Sidebar] New flow created:', newFlow);
      await refreshUserFlows(); // Refresh user flows after creating new one

      toast({
        title: "Success",
        description: "New flow created successfully.",
      });

      setIsNewFlowModalOpen(false);
      navigate(`/flows/${newFlow.id}`);
    } catch (error) {
      log.error('[Sidebar] Error creating new flow:', error);
      toast({
        title: "Error",
        description: "Failed to create new flow. Please try again.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast, refreshUserFlows]);

  const handleFlowClick = useCallback((flowId: string) => {
    log.debug(`[Sidebar] Flow clicked: ${flowId}`);
    const currentFlowId = location.pathname.split('/').pop();
    
    if (currentFlowId === flowId) {
      // If clicking the same flow, force a refresh
      refreshUserFlows().then(() => {
        navigate(`/flows/${flowId}`, { replace: true });
      });
    } else {
      // Navigate to new flow
      navigate(`/flows/${flowId}`, { replace: true });
    }
  }, [navigate, location.pathname, refreshUserFlows]);

  const filteredItems = React.useMemo(() => [
    ...defaultNodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    ...systemFlows.filter(flow => 
      flow.title.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    ...userFlows.filter(flow => 
      flow.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ], [defaultNodes, systemFlows, userFlows, searchTerm]);

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  );

  const getNodeColor = useCallback((type: string) => {
    switch (type) {
      case 'start':
        return 'bg-green-200 hover:bg-green-300 text-green-800';
      case 'end':
        return 'bg-red-200 hover:bg-red-300 text-red-800';
      case 'sticky_note':
        return 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-200 hover:bg-blue-300 text-blue-800';
    }
  }, []);

  const getNodeIcon = useCallback((type: string) => {
    switch (type) {
      case 'start':
        return <Play className="h-5 w-5" />;
      case 'normal':
        return <AudioWaveform className="h-5 w-5" />;
      case 'end':
        return <BringToFront className="h-5 w-5" />;
      case 'sticky_note':
        return <StickyNote className="h-5 w-5" />;
      default:
        return <AudioWaveform className="h-5 w-5" />;
    }
  }, []);

  const isLoading = systemLoading || userLoading;

  return (
    <>
      <aside 
        className={`${
          isExpanded ? "w-64" : "w-16"
        } bg-background text-foreground h-full flex flex-col overflow-hidden border-r border-border transition-all duration-300`}
      >
        <nav className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Default Nodes Section */}
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">
                {isExpanded ? 'DEFAULT NODES' : ''}
              </h2>
              <ul className="space-y-1 mb-4">
                {filteredItems
                  .filter((item): item is DefaultNode => 'type' in item)
                  .map((item, index) => (
                    <li key={`${item.type}-${index}`}>
                      <div
                        className={`${getNodeColor(
                          item.type
                        )} rounded cursor-move transition-colors duration-200 flex items-center ${
                          isExpanded ? 'px-3 py-2' : 'justify-center p-2'
                        }`}
                        draggable
                        onDragStart={(event) => onDragStart(event, item.type)}
                        title={item.label}
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          {getNodeIcon(item.type)}
                        </div>
                        {isExpanded && (
                          <span className="ml-3 truncate">{item.label}</span>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>

              {/* System Flows Section */}
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">
                {isExpanded ? 'SYSTEM FLOWS' : ''}
              </h2>
              <ul className="space-y-1 mb-4">
                {filteredItems
                  .filter(
                    (item): item is Flow =>
                      'isSystemFlow' in item && item.isSystemFlow
                  )
                  .map((flow) => (
                    <li key={flow.id}>
                      <div
                        className={`bg-primary hover:bg-primary/80 text-primary-foreground rounded cursor-pointer transition-colors duration-200 flex items-center ${
                          isExpanded ? 'px-3 py-2' : 'justify-center p-2'
                        }`}
                        draggable
                        onDragStart={(event) =>
                          onDragStart(event, 'systemFlow', flow)
                        }
                        onClick={() => handleFlowClick(flow.id)}
                        title={flow.title}
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          <Workflow className="h-5 w-5" />
                        </div>
                        {isExpanded && (
                          <span className="ml-3 truncate">{flow.title}</span>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>

              {/* User Flows Section */}
              {user && (
                <>
                  <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">
                    {isExpanded ? 'YOUR FLOWS' : ''}
                  </h2>
                  {userFlows.length > 0 ? (
                    <ul className="space-y-1 mb-4">
                      {userFlows.map((flow) => (
                        <li key={flow.id}>
                          <div
                            className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded cursor-pointer transition-colors duration-200 flex items-center ${
                              isExpanded ? 'px-3 py-2' : 'justify-center p-2'
                            }`}
                            draggable
                            onDragStart={(event) =>
                              onDragStart(event, 'userFlow', flow)
                            }
                            onClick={() => handleFlowClick(flow.id)}
                            title={flow.title}
                          >
                            <div className="flex items-center justify-center w-5">
                              <Activity className="h-5 w-5" />
                            </div>
                            {isExpanded && (
                              <span className="ml-3 truncate">{flow.title}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground px-2">
                      No flows found.
                    </p>
                  )}

                  {/* New Flow Button */}
                  <Button
                    onClick={() => setIsNewFlowModalOpen(true)}
                    className={`w-full flex items-center justify-center ${
                      isExpanded ? 'px-3 py-2' : 'p-2'
                    }`}
                    title="New Flow"
                  >
                    <Plus className="h-5 w-5" />
                    {isExpanded && <span className="ml-3">New Flow</span>}
                  </Button>
                </>
              )}
            </>
          )}
        </nav>
      </aside>

      <NewFlowModal
        isOpen={isNewFlowModalOpen}
        onClose={() => setIsNewFlowModalOpen(false)}
        onCreateFlow={handleCreateNewFlow}
      />
    </>
  );
};

export default React.memo(Sidebar);