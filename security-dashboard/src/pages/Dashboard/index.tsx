import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import { createDefaultNode } from '../../services/DefaultNodesService';
import { createSystemFlowNodes } from '../../services/SystemFlow-Nodes';
import { createUserFlowNode } from '../../services/UserFlowService';

const MemoizedCustomNode = React.memo(CustomNode);

const FlowWithProvider: React.FC = () => {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editedNodeData, setEditedNodeData] = useState<{ 
    label: string; 
    description: string;
    tips: string;
    usable_pentest_tools: string;
  }>({ label: '', description: '', tips: '', usable_pentest_tools: '' });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { screenToFlowPosition } = useReactFlow();
  const { systemFlows } = useSystemFlows();
  const { userFlows } = useUserFlows();

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      console.log('Dropped item type:', type);
      console.log('Dropped at position:', position);

      try {
        const parsedData = JSON.parse(type);
        console.log('Parsed data:', parsedData);

        if (parsedData.type === 'systemFlow') {
          const systemFlow = systemFlows.find(flow => flow.id === parsedData.flowId);
          if (systemFlow) {
            console.log('Found system flow:', systemFlow);
            const result = await createSystemFlowNodes(systemFlow, position);
            console.log('Created system flow nodes:', result);
            
            setNodes((nds) => [...nds, ...result.nodes]);
            setEdges((eds) => [...eds, ...result.edges]);
            
            console.log('Updated nodes:', [...nodes, ...result.nodes]);
            console.log('Updated edges:', [...edges, ...result.edges]);
          }
        } else if (parsedData.type === 'userFlow') {
          const userFlow = userFlows.find(flow => flow.id === parsedData.flowId);
          if (userFlow) {
            const newNode = createUserFlowNode(userFlow, position);
            setNodes((nds) => [...nds, newNode]);
          }
        }
      } catch (error) {
        console.error('Error processing dropped item:', error);
        const newNode = createDefaultNode(type, position, type, '');
        setNodes((nds) => [...nds, newNode]);
      }
    },
    [screenToFlowPosition, setNodes, setEdges, systemFlows, userFlows, nodes, edges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSelected: n.id === node.id,
        },
      }))
    );
    setSelectedNode(node);
    setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    setIsDrawerOpen(true);
  }, [setNodes]);

  const handleEdit = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    setSelectedNode(node);
    setEditedNodeData({ 
      label: node.data.label, 
      description: node.data.description || '',
      tips: node.data.tips || '',
      usable_pentest_tools: node.data.usable_pentest_tools || '',
    });
    setIsDrawerOpen(true);
  }, []);

  const handleDelete = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setSelectedNode(null);
    setIsDrawerOpen(false);
    toast({
      title: "Node Deleted",
      description: "The node has been successfully removed.",
    });
  }, [setNodes, toast]);

  const handleNodeDataChange = useCallback((field: keyof typeof editedNodeData, value: string) => {
    setEditedNodeData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveNodeData = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, ...editedNodeData, isSelected: false } }
            : node
        )
      );
      setSelectedNode(null);
      setIsDrawerOpen(false);
      toast({
        title: "Node Updated",
        description: "The node has been successfully updated.",
      });
    }
  }, [selectedNode, editedNodeData, setNodes, toast]);

  const memoizedNodeTypes = useMemo<NodeTypes>(() => ({
    customNode: (props: any) => (
      <MemoizedCustomNode {...props}>
        {props.data.isSelected && (
          <div className="absolute top-0 right-0 flex">
            <Button
              size="icon"
              variant="ghost"
              onClick={(event) => handleEdit(event, props)}
              className="h-6 w-6"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(event) => handleDelete(event, props.id)}
              className="h-6 w-6"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </MemoizedCustomNode>
    ),
  }), [handleEdit, handleDelete]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1" ref={reactFlowWrapper}>
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

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Edit Node</DrawerTitle>
              <DrawerDescription>
                Edit the details of this node.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <Input
                value={editedNodeData.label}
                onChange={(e) => handleNodeDataChange('label', e.target.value)}
                className="mb-2 bg-input text-input-foreground"
                placeholder="Node Label"
              />
              <Textarea
                value={editedNodeData.description}
                onChange={(e) => handleNodeDataChange('description', e.target.value)}
                className="mb-2 bg-input text-input-foreground"
                placeholder="Node Description"
              />
              <Textarea
                value={editedNodeData.tips}
                onChange={(e) => handleNodeDataChange('tips', e.target.value)}
                className="mb-2 bg-input text-input-foreground"
                placeholder="Tips"
              />
              <Textarea
                value={editedNodeData.usable_pentest_tools}
                onChange={(e) => handleNodeDataChange('usable_pentest_tools', e.target.value)}
                className="mb-2 bg-input text-input-foreground"
                placeholder="Usable Pentest Tools"
              />
            </div>
            <DrawerFooter>
              <Button onClick={handleSaveNodeData}>Save</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

const Dashboard: React.FC = () => (
  <ReactFlowProvider>
    <FlowWithProvider />
  </ReactFlowProvider>
);

export default Dashboard;