import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Activity, Play, AudioWaveform, BringToFront, Workflow, StickyNote } from 'lucide-react';
import { Flow } from '../../services/Pb-getFlowService';
import { useSystemFlows } from '../../services/FlowContexts';
import { getDefaultNodes, DefaultNode } from '../../services/DefaultNodesService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import pb from '../../services/Pb-getFlowService';

interface SidebarProps {
  isExpanded: boolean;
  searchTerm: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, searchTerm }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userFlows, setUserFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  const { systemFlows, loading: systemLoading } = useSystemFlows();
  const defaultNodes = getDefaultNodes();

  useEffect(() => {
    const fetchUserFlows = async () => {
      if (user && user.id) {
        try {
          const records = await pb.collection('flows').getFullList<Flow>({
            sort: '-created',
            filter: `creator ?~ "${user.id}" && isShared = true`,
          });
          setUserFlows(records);
        } catch (error) {
          console.error('Error fetching user flows:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserFlows();
  }, [user]);

  const onDragStart = (event: React.DragEvent, nodeType: string, flow?: Flow) => {
    if (flow) {
      event.dataTransfer.setData('application/reactflow', JSON.stringify({
        type: flow.isSystemFlow ? 'systemFlow' : 'userFlow',
        flowId: flow.id
      }));
    } else {
      event.dataTransfer.setData('application/reactflow', nodeType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleCreateNewFlow = () => {
    navigate('/flows/new');
  };

  const handleFlowClick = (flowId: string) => {
    navigate(`/flows/${flowId}`);
  };

  const filteredItems = [
    ...defaultNodes.filter(node => node.label.toLowerCase().includes(searchTerm.toLowerCase())),
    ...systemFlows.filter(flow => flow.title.toLowerCase().includes(searchTerm.toLowerCase())),
    ...userFlows.filter(flow => flow.title.toLowerCase().includes(searchTerm.toLowerCase()))
  ];

  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  );

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start':
        return 'bg-green-200 hover:bg-green-300 text-green-800';
      case 'end':
        return 'bg-red-200 hover:bg-red-300 text-red-800';
      case 'sticky':
        return 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800';
      default:
        return 'bg-blue-200 hover:bg-blue-300 text-blue-800';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start':
        return <Play className="h-5 w-5" />;
      case 'normal':
        return <AudioWaveform className="h-5 w-5" />;
      case 'end':
        return <BringToFront className="h-5 w-5" />;
      case 'sticky':
        return <StickyNote className="h-5 w-5" />;
      default:
        return <AudioWaveform className="h-5 w-5" />;
    }
  };

  return (
    <aside className={`${isExpanded ? "w-64" : "w-16"} bg-background text-foreground h-full flex flex-col overflow-hidden border-r border-border transition-all duration-300`}>
      <nav className="flex-1 overflow-y-auto p-2">
        {loading || systemLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">
              {isExpanded ? 'DEFAULT NODES' : ''}
            </h2>
            <ul className="space-y-1 mb-4">
              {filteredItems.filter((item): item is DefaultNode => 'type' in item).map((item, index) => (
                <li key={index}>
                  <div
                    className={`${getNodeColor(item.type)} rounded cursor-move transition-colors duration-200 flex items-center ${isExpanded ? 'px-3 py-2' : 'justify-center p-2'}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, item.type)}
                    title={item.label}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {getNodeIcon(item.type)}
                    </div>
                    {isExpanded && <span className="ml-3 truncate">{item.label}</span>}
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">
              {isExpanded ? 'SYSTEM FLOWS' : ''}
            </h2>
            <ul className="space-y-1 mb-4">
              {filteredItems.filter((item): item is Flow => 'isSystemFlow' in item && item.isSystemFlow).map((flow) => (
                <li key={flow.id}>
                  <div
                    className={`bg-primary hover:bg-primary/80 text-primary-foreground rounded cursor-pointer transition-colors duration-200 flex items-center ${isExpanded ? 'px-3 py-2' : 'justify-center p-2'}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, 'systemFlow', flow)}
                    onClick={() => handleFlowClick(flow.id)}
                    title={flow.title}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      <Workflow className="h-5 w-5" />
                    </div>
                    {isExpanded && <span className="ml-3 truncate">{flow.title}</span>}
                  </div>
                </li>
              ))}
            </ul>

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
                          className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded cursor-pointer transition-colors duration-200 flex items-center ${isExpanded ? 'px-3 py-2' : 'justify-center p-2'}`}
                          draggable
                          onDragStart={(event) => onDragStart(event, 'userFlow', flow)}
                          onClick={() => handleFlowClick(flow.id)}
                          title={flow.title}
                        >
                          <div className="flex items-center justify-center w-5 h-5">
                            <Activity className="h-5 w-5" />
                          </div>
                          {isExpanded && <span className="ml-3 truncate">{flow.title}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground px-2">No flows found.</p>
                )}
                <Button 
                  onClick={handleCreateNewFlow} 
                  className={`w-full flex items-center justify-center ${isExpanded ? 'px-3 py-2' : 'p-2'}`}
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
  );
};

export default Sidebar;