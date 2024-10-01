import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Hexagon, Plus } from 'lucide-react';
import { Flow } from '../../services/Pb-getFlowService';
import { useSystemFlows } from '../../services/FlowContexts';
import { getDefaultNodes, DefaultNode } from '../../services/DefaultNodesService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import pb from '../../services/Pb-getFlowService';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [userFlows, setUserFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  const { systemFlows, loading: systemLoading } = useSystemFlows();
  const defaultNodes = getDefaultNodes();

  useEffect(() => {
    const fetchUserFlows = async () => {
      if (user && user.id) {
        try {
          console.log('Fetching user flows for user:', user.id);
          const records = await pb.collection('flows').getFullList<Flow>({
            sort: '-created',
            filter: `creator ?~ "${user.id}" && isShared = true`,
          });
          console.log('Fetched user flows:', records);
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

  useEffect(() => {
    console.log('User flows updated:', userFlows);
  }, [userFlows]);

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
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-3/4 mt-6" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-3/4 mt-6" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full mt-6" />
    </div>
  );

  return (
    <aside className="w-64 bg-background text-foreground h-full flex flex-col overflow-hidden border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center bg-primary rounded-full h-12 w-12 mb-2">
            <Hexagon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-center">Pentest Checklist</h1>
        </div>
      </div>
      <div className='p-4'>
        <Input 
          type="search" 
          placeholder="Search..." 
          className="w-full bg-input text-input-foreground mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <nav className="flex-1 overflow-y-auto p-4">
        {loading || systemLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">DEFAULT NODES</h2>
            <ul className="space-y-2 mb-6">
              {filteredItems.filter((item): item is DefaultNode => 'type' in item).map((item, index) => (
                <li key={index}>
                  <div
                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground p-2 rounded cursor-move transition-colors duration-200"
                    draggable
                    onDragStart={(event) => onDragStart(event, item.type)}
                  >
                    {item.label}
                  </div>
                </li>
              ))}
            </ul>
            
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">SYSTEM FLOWS</h2>
            <ul className="space-y-2 mb-6">
              {filteredItems.filter((item): item is Flow => 'isSystemFlow' in item && item.isSystemFlow).map((flow) => (
                <li key={flow.id}>
                  <div
                    className="bg-primary hover:bg-primary/80 text-primary-foreground p-2 rounded cursor-pointer transition-colors duration-200"
                    draggable
                    onDragStart={(event) => onDragStart(event, 'systemFlow', flow)}
                    onClick={() => handleFlowClick(flow.id)}
                  >
                    {flow.title}
                  </div>
                </li>
              ))}
            </ul>
            
            {user && (
              <>
                <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">YOUR FLOWS</h2>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : userFlows.length > 0 ? (
                  <ul className="space-y-2 mb-6">
                    {userFlows.map((flow) => (
                      <li key={flow.id}>
                        <div
                          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground p-2 rounded cursor-pointer transition-colors duration-200"
                          draggable
                          onDragStart={(event) => onDragStart(event, 'userFlow', flow)}
                          onClick={() => handleFlowClick(flow.id)}
                        >
                          {flow.title}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No flows found.</p>
                )}
                <Button 
                  onClick={handleCreateNewFlow} 
                  className="w-full flex items-center justify-center"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Flow
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