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
import { useSaveNodes } from '../../components/Layout';

const Flow: React.FC = () => {
  const { flowId: paramFlowId } = useParams<{ flowId?: string }>();
  const [flowId, setFlowId] = useState<string | null>(
    paramFlowId && paramFlowId !== 'new' ? paramFlowId : null
  );

  const { setSaveNodes } = useSaveNodes();
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

  const createNewFlow = async (title: string, description: string) => {
    if (!user) {
      throw new Error('User is not authenticated');
    }
    const newFlowData = {
      title,
      description,
      creator: user.id,
      isSystemFlow: false,
      isShared: true,
    };
    const newFlow = await pb.collection('flows').create(newFlowData);
    return newFlow;
  };

  useEffect(() => {
    const loadFlow = async () => {
      setIsLoading(true);
      try {
        if (flowId && flowId !== 'new') {
          const record = await pb.collection('flows').getOne(flowId);
          setFlowTitle(record.title);
          setFlowDescription(record.description);
          await loadNodesAndEdges(flowId);
        } else if (!flowId || flowId === 'new') {
          setIsNewFlowModalOpen(true);
        }
      } catch (error) {
        console.error('Error loading flow:', error);
        if (error instanceof Error && (error as any).status === 404) {
          setIsNewFlowModalOpen(true);
        } else {
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
    try {
      const nodes = await pb.collection('nodes').getFullList({
        filter: `flow="${flowId}"`,
      });
      setNodes(nodes.map(node => ({
        id: node.id,
        type: 'customNode',
        position: JSON.parse(node.position),
        data: {
          ...JSON.parse(node.data),
          nodeType: node.types,
          pocketbaseId: node.id
        },
      })));

      const edges = await pb.collection('edges').getFullList({
        filter: `flow="${flowId}"`,
        expand: 'source,target',
      });
      setEdges(edges.map(edge => ({
        id: edge.id,
        source: edge.expand?.source?.id,
        target: edge.expand?.target?.id,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
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
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
  
      if (!reactFlowWrapper.current) return;
  
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
  
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
  
      console.log('Dropped item type:', type);
      console.log('Dropped position:', position);
  
      try {
        let parsedData;
        try {
          parsedData = JSON.parse(type);
        } catch (error) {
          console.log('Type is not JSON, using as string:', type);
          parsedData = { type: type };
        }
  
        console.log('Parsed drop data:', parsedData);
  
        if (parsedData.type === "systemFlow") {
          console.log('Dropping system flow');
          const systemFlow = systemFlows.find(
            (flow) => flow.id === parsedData.flowId,
          );
          if (systemFlow) {
            const result = await createSystemFlowNodes(systemFlow, position);
            console.log('Created system flow nodes:', result);
            setNodes((nds) => [...nds, ...result.nodes]);
            setEdges((eds) => [...eds, ...result.edges]);
          } else {
            console.log('System flow not found');
          }
        } else if (parsedData.type === "userFlow") {
          console.log('Dropping user flow');
          const userFlow = userFlows.find(
            (flow) => flow.id === parsedData.flowId,
          );
          if (userFlow) {
            const newNode = createUserFlowNode(userFlow, position);
            console.log('Created user flow node:', newNode);
            setNodes((nds) => [...nds, newNode]);
          } else {
            console.log('User flow not found');
          }
        } else {
          console.log('Dropping default node');
          const newNode = createDefaultNode(parsedData.type, position);
          console.log('Created default node:', newNode);
          setNodes((nds) => [...nds, newNode]);
        }
      } catch (error) {
        console.error("Error processing dropped item:", error);
      }
    },
    [screenToFlowPosition, setNodes, setEdges, systemFlows, userFlows]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
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
    setEditedNodeData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveNodeData = useCallback(() => {
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

  const saveNodesAndEdges = useCallback(async () => {
    if (!flowId) {
      console.error('Flow ID is missing. Cannot save nodes and edges.');
      setAlert({
        title: "Error",
        description: "Flow ID is missing. Cannot save nodes and edges.",
        variant: "destructive"
      });
      return;
    }
  
    try {
      // Save nodes
      const savedNodes = await Promise.all(nodes.map(async (node) => {
        const nodeData = {
          title: node.data.label || '',
          description: node.data.description || '',
          tips: node.data.tips || '',
          flow: flowId,
          position: JSON.stringify(node.position),
          types: node.data.nodeType || 'normal',
          inputCount: node.data.inputCount || 0,
          outputCount: node.data.outputCount || 0,
          usable_pentest_tools: node.data.usable_pentest_tools || '',
        };
  
        console.log('Attempting to save node:', nodeData);
  
        if (!node.data.pocketbaseId) {
          try {
            const savedNode = await pb.collection('nodes').create(nodeData);
            console.log('Successfully created new node:', savedNode);
            return { ...node, data: { ...node.data, pocketbaseId: savedNode.id } };
          } catch (error) {
            console.error('Error creating new node:', error);
            throw error;
          }
        } else {
          try {
            const updatedNode = await pb.collection('nodes').update(node.data.pocketbaseId, nodeData);
            console.log('Successfully updated node:', updatedNode);
            return node;
          } catch (error) {
            console.error('Error updating node:', error);
            throw error;
          }
        }
      }));
  
      setNodes(savedNodes);
  
      // Save edges
      const existingEdges = await pb.collection('edges').getFullList({
        filter: `flow="${flowId}"`,
      });
  
      const savedEdges = await Promise.all(edges.map(async (edge) => {
        const edgeData = {
          flow: flowId,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label || '',
        };
  
        console.log('Attempting to save edge:', edgeData);
  
        const existingEdge = existingEdges.find(e => e.id === edge.id);
        if (existingEdge) {
          try {
            const updatedEdge = await pb.collection('edges').update(edge.id, edgeData);
            console.log('Successfully updated edge:', updatedEdge);
            return updatedEdge;
          } catch (error) {
            console.error('Error updating edge:', error);
            throw error;
          }
        } else {
          try {
            const newEdge = await pb.collection('edges').create(edgeData);
            console.log('Successfully created new edge:', newEdge);
            return newEdge;
          } catch (error) {
            console.error('Error creating new edge:', error);
            throw error;
          }
        }
      }));
  
      // Delete edges that no longer exist
      await Promise.all(existingEdges.map(async (existingEdge) => {
        if (!edges.some(e => e.id === existingEdge.id)) {
          try {
            await pb.collection('edges').delete(existingEdge.id);
            console.log('Successfully deleted edge:', existingEdge.id);
          } catch (error) {
            console.error('Error deleting edge:', error);
            throw error;
          }
        }
      }));
  
      setAlert({
        title: "Success",
        description: "Nodes and edges saved successfully.",
      });
  
    } catch (error) {
      console.error('Error saving nodes and edges:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      if ((error as any).data) {
        console.error('API error details:', (error as any).data);
      }
      setAlert({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save nodes and edges. Please try again.',
        variant: "destructive"
      });
    }
  }, [flowId, nodes, edges, setNodes]);

  useEffect(() => {
    setSaveNodes(() => saveNodesAndEdges);
  }, [setSaveNodes, saveNodesAndEdges]);

  const handleSave = async () => {
    if (!user) {
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
        creator: user.id,
        isSystemFlow: false,
        isShared: true,
      };

      let savedFlow;
      if (flowId) {
        savedFlow = await pb.collection('flows').update(flowId, flowData);
      } else {
        savedFlow = await pb.collection('flows').create(flowData);
      }

      setFlowId(savedFlow.id);
      if (!flowId) {
        navigate(`/flows/${savedFlow.id}`, { replace: true });
      }

      await saveNodesAndEdges();

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
    try {
      const newFlow = await createNewFlow(flowTitle, flowDescription);
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
                      Make changes to your flow here.
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