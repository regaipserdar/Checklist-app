import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  NodeTypes,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import CustomNode from '../../components/CustomNode';
import { useSystemFlows, useUserFlows } from '../../services/FlowContexts';
import { createDefaultNode } from '../../services/DefaultNodesService';
import { createSystemFlowNodes } from '../../services/SystemFlow-Nodes';
import { createUserFlowNode } from '../../services/UserFlowService';
import { useAuth } from '../../context/AuthContext'; 
import pb from '../../services/Pb-getFlowService';

const Flow: React.FC = () => {
  console.log('Flow component rendered');

  const { flowId: paramFlowId } = useParams<{ flowId?: string }>();
  const [flowId, setFlowId] = useState<string | null>(
    paramFlowId && paramFlowId !== 'new' ? paramFlowId : null
  );
  console.log('Initial flowId:', flowId);

  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowTitle, setFlowTitle] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const [editedNodeData, setEditedNodeData] = useState<{ 
    label: string; 
    description: string;
    tips: string;
    usable_pentest_tools: string;
  }>({ label: '', description: '', tips: '', usable_pentest_tools: '' });
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { screenToFlowPosition } = useReactFlow();
  const { systemFlows } = useSystemFlows();
  const { userFlows } = useUserFlows();
  const { user } = useAuth();

  console.log('Current user:', user);

  const createNewFlow = async (title: string, description: string) => {
    console.log('Creating new flow');
    const newFlowData = {
      title,
      description,
      creator: user?.id,
      isSystemFlow: false,
      isShared: true,
    };
    console.log('New flow data:', newFlowData);
    const newFlow = await pb.collection('flows').create(newFlowData);
    console.log('New flow created:', newFlow);
    return newFlow;
  };

  useEffect(() => {
    console.log('useEffect triggered for flow loading');
    const loadFlow = async () => {
      console.log('Loading flow, flowId:', flowId);
      setIsLoading(true);
      try {
        if (flowId && flowId !== 'new') {
          console.log('Fetching existing flow');
          const record = await pb.collection('flows').getOne(flowId);
          console.log('Fetched flow:', record);
          
          setFlowTitle(record.title);
          setFlowDescription(record.description);
          await loadNodesAndEdges(flowId);
        } else if (!flowId || flowId === 'new') {
          console.log('Opening new flow modal');
          setIsNewFlowModalOpen(true);
        }
      } catch (error) {
        console.error('Error loading flow:', error);
        if (error instanceof Error && (error as any).status === 404) {
          console.log('Flow not found, opening new flow modal');
          setIsNewFlowModalOpen(true);
        } else {
          console.error('Unexpected error:', error);
          setAlert({
            title: "Error",
            description: error instanceof Error ? error.message : 'Failed to load the flow. Please try again.',
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFlow();
  }, [flowId]);

  const loadNodesAndEdges = async (flowId: string) => {
    console.log('Loading nodes and edges for flow:', flowId);
    try {
      // Fetch nodes
      const nodes = await pb.collection('nodes').getFullList({
        filter: `flows="${flowId}"`,
      });
      console.log('Fetched nodes:', nodes);
      setNodes(nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: JSON.parse(node.position),
        data: JSON.parse(node.data),
      })));

      // Fetch edges
      const edges = await pb.collection('edges').getFullList({
        filter: `flows="${flowId}"`,
      });
      console.log('Fetched edges:', edges);
      setEdges(edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })));
    } catch (error) {
      console.error('Error loading nodes and edges:', error);
      setAlert({
        title: "Error",
        description: "Failed to load nodes and edges. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onConnect = useCallback((params: Connection | Edge) => {
    console.log('Connecting nodes:', params);
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      console.log('Node dropped');
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      try {
        const parsedData = JSON.parse(type);
        console.log('Parsed drop data:', parsedData);

        if (parsedData.type === 'systemFlow') {
          console.log('Dropping system flow');
          const systemFlow = systemFlows.find(flow => flow.id === parsedData.flowId);
          if (systemFlow) {
            const result = createSystemFlowNodes(systemFlow, position);
            console.log("System flow nodes created:", result);
            // TODO: Implement system flow node creation
          }
        } else if (parsedData.type === 'userFlow') {
          console.log('Dropping user flow');
          const userFlow = userFlows.find(flow => flow.id === parsedData.flowId);
          if (userFlow) {
            const newNode = createUserFlowNode(userFlow, position);
            console.log('New user flow node:', newNode);
            setNodes((nds) => [...nds, newNode]);
          }
        }
      } catch (error) {
        console.log('Dropping default node');
        const newNode = createDefaultNode(type, position);
        console.log('New default node:', newNode);
        setNodes((nds) => [...nds, newNode]);
      }
    },
    [screenToFlowPosition, setNodes, setEdges, systemFlows, userFlows]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
    setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    setIsDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((node: Node) => {
    console.log('Editing node:', node);
    setSelectedNode(node);
    setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    setIsDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((nodeId: string) => {
    console.log('Deleting node:', nodeId);
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setSelectedNode(null);
    setIsDrawerOpen(false);
    setAlert({
      title: "Node Deleted",
      description: "The node has been successfully removed.",
      variant: "destructive"
    });
  }, [setNodes]);

  const handleNodeDataChange = useCallback((field: keyof typeof editedNodeData, value: string) => {
    console.log('Node data changed:', field, value);
    setEditedNodeData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveNodeData = useCallback(() => {
    console.log('Saving node data');
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  ...editedNodeData,
                } 
              }
            : node
        )
      );
      setSelectedNode(null);
      setIsDrawerOpen(false);
      setAlert({
        title: "Node Updated",
        description: "The node has been successfully updated.",
      });
    }
  }, [selectedNode, editedNodeData, setNodes]);

  const handleSave = async () => {
    console.log('Saving flow');
    if (!user || !user.id) {
      console.error('No user logged in');
      setAlert({
        title: "Error",
        description: "You must be logged in to save a flow.",
        variant: "destructive"
      });
      return;
    }

    try {
      const flowData = {
        title: flowTitle,
        description: flowDescription,
        nodes: nodes,
        edges: edges,
        creator: user.id,
        isSystemFlow: false,
        isShared: true,
      };
      console.log('Flow data to save:', flowData);

      let savedFlow;
      if (flowId) {
        savedFlow = await pb.collection('flows').update(flowId, flowData);
      } else {
        savedFlow = await pb.collection('flows').create(flowData);
      }
      console.log('Saved flow:', savedFlow);

      setFlowId(savedFlow.id);
      if (!flowId) {
        console.log('Navigating to saved flow');
        navigate(`/flows/${savedFlow.id}`, { replace: true });
      }

      setAlert({
        title: "Success",
        description: `Flow ${flowId ? 'updated' : 'created'} successfully.`,
      });
      setIsFlowModalOpen(false);
    } catch (error) {
      console.error('Error saving flow:', error);
      setAlert({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save the flow. Please try again.',
        variant: "destructive"
      });
    }
  };

  const handleCreateNewFlow = async () => {
    console.log('Creating new flow');
    try {
      const newFlow = await createNewFlow(flowTitle, flowDescription);
      console.log('New flow created:', newFlow);
      setFlowId(newFlow.id);
      setIsNewFlowModalOpen(false);
      navigate(`/flows/${newFlow.id}`, { replace: true });
      setAlert({
        title: "Success",
        description: "New flow created successfully.",
      });
    } catch (error) {
      console.error('Error creating new flow:', error);
      setAlert({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create new flow. Please try again.',
        variant: "destructive"
      });
    }
  };

  const handleBackToDashboard = () => {
    console.log('Navigating back to dashboard');
    navigate('/');
  };

  const memoizedNodeTypes = useMemo<NodeTypes>(() => ({
    customNode: (props: any) => (
      <CustomNode 
        {...props}
        data={{
          ...props.data,
          onEdit: () => handleEdit(props),
          onDelete: () => handleDelete(props.id),
        }}
      />
    ),
  }), [handleEdit, handleDelete]);

  console.log('Rendering Flow component');
  return (
    <div className="h-full w-full flex flex-col">
      {alert && (
        <Alert variant={alert.variant}>
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">{flowTitle || 'Untitled Flow'}</h1>
            <div>
              <Dialog open={isFlowModalOpen} onOpenChange={setIsFlowModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mr-2">Edit Flow</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Flow</DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      value={flowTitle}
                      onChange={(e) => setFlowTitle(e.target.value)}
                      placeholder="Flow Title"
                      className="mb-2"
                    />
                    <Textarea
                      value={flowDescription}
                      onChange={(e) => setFlowDescription(e.target.value)}
                      placeholder="Flow Description"
                      className="mb-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSave}>Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={handleBackToDashboard} variant="outline">Back to Dashboard</Button>
            </div>
          </div>
          <div className="flex-1 h-[calc(100vh-4rem)]" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              nodeTypes={memoizedNodeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </>
      )}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Edit Node</DrawerTitle>
              <DrawerDescription>Make changes to your node here.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <Input
                value={editedNodeData.label}
                onChange={(e) => handleNodeDataChange('label', e.target.value)}
                className="mb-2"
                placeholder="Node Label"
              />
              <Textarea
                value={editedNodeData.description}
                onChange={(e) => handleNodeDataChange('description', e.target.value)}
                className="mb-2"
                placeholder="Node Description"
              />
              <Textarea
                value={editedNodeData.tips}
                onChange={(e) => handleNodeDataChange('tips', e.target.value)}
                className="mb-2"
                placeholder="Tips"
              />
              <Textarea
                value={editedNodeData.usable_pentest_tools}
                onChange={(e) => handleNodeDataChange('usable_pentest_tools', e.target.value)}
                className="mb-2"
                placeholder="Usable Pentest Tools"
              />
            </div>
            <DrawerFooter>
              <Button onClick={handleSaveNodeData}>Save changes</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      <Dialog open={isNewFlowModalOpen} onOpenChange={setIsNewFlowModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Flow</DialogTitle>
            <DialogDescription>
              Enter the details for your new flow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={flowTitle}
              onChange={(e) => setFlowTitle(e.target.value)}
              placeholder="Flow Title"
              className="mb-2"
            />
            <Textarea
              value={flowDescription}
              onChange={(e) => setFlowDescription(e.target.value)}
              placeholder="Flow Description"
              className="mb-2"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateNewFlow}>Create Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default () => (
  <ReactFlowProvider>
    <Flow />
  </ReactFlowProvider>
);