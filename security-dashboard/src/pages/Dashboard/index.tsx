import React, { useState, useRef, useCallback, useMemo } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import CustomNode from "../../components/CustomNode";
import { useSystemFlows, useUserFlows } from "../../services/FlowContexts";
import { useToast } from "@/hooks/use-toast";
import { createDefaultNode } from "../../services/DefaultNodesService";
import { createSystemFlowNodes } from "../../services/SystemFlow-Nodes";
import { createUserFlowNode } from "../../services/UserFlowService";

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
  }>({ label: "", description: "", tips: "", usable_pentest_tools: "" });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { screenToFlowPosition } = useReactFlow();
  const { systemFlows } = useSystemFlows();
  const { userFlows } = useUserFlows();

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
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

      try {
        let parsedData;
        try {
          parsedData = JSON.parse(type);
        } catch (error) {
          parsedData = { type: type };
        }

        if (parsedData.type === "systemFlow") {
          const systemFlow = systemFlows.find(
            (flow) => flow.id === parsedData.flowId,
          );
          if (systemFlow) {
            const result = await createSystemFlowNodes(systemFlow, position);
            setNodes((nds) => [...nds, ...result.nodes]);
            setEdges((eds) => [...eds, ...result.edges]);
          }
        } else if (parsedData.type === "userFlow") {
          const userFlow = userFlows.find(
            (flow) => flow.id === parsedData.flowId,
          );
          if (userFlow) {
            const newNode = createUserFlowNode(userFlow, position);
            setNodes((nds) => [...nds, newNode]);
          }
        } else {
          const newNode = createDefaultNode(parsedData.type, position);
          setNodes((nds) => [...nds, newNode]);
        }
      } catch (error) {
        console.error("Error processing dropped item:", error);
      }
    },
    [screenToFlowPosition, setNodes, setEdges, systemFlows, userFlows],
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isSelected: n.id === node.id,
          },
        })),
      );
      setSelectedNode(node);
      setEditedNodeData({
        label: node.data.label,
        description: node.data.description || "",
        tips: node.data.tips || "",
        usable_pentest_tools: node.data.usable_pentest_tools || "",
      });
      setIsDrawerOpen(true);
    },
    [setNodes],
  );

  const handleEdit = useCallback((node: Node) => {
    setSelectedNode(node);
    setEditedNodeData({
      label: node.data.label,
      description: node.data.description || "",
      tips: node.data.tips || "",
      usable_pentest_tools: node.data.usable_pentest_tools || "",
    });
    setIsDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setSelectedNode(null);
      setIsDrawerOpen(false);
      toast({
        title: "Node Deleted",
        description: "The node has been successfully removed.",
      });
    },
    [setNodes, toast],
  );

  const handleNodeDataChange = useCallback(
    (field: keyof typeof editedNodeData, value: string) => {
      setEditedNodeData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

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
                  isSelected: false,
                },
              }
            : node,
        ),
      );
      setSelectedNode(null);
      setIsDrawerOpen(false);
      toast({
        title: "Node Updated",
        description: "The node has been successfully updated.",
      });
    }
  }, [selectedNode, editedNodeData, setNodes, toast]);

  const memoizedNodeTypes = useMemo<NodeTypes>(
    () => ({
      customNode: (props: any) => (
        <MemoizedCustomNode
          {...props}
          data={{
            ...props.data,
            onEdit: () => handleEdit(props),
            onDelete: () => handleDelete(props.id),
          }}
        />
      ),
    }),
    [handleEdit, handleDelete],
  );

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
                onChange={(e) => handleNodeDataChange("label", e.target.value)}
                className="mb-2 bg-input text-input-foreground"
                placeholder="Node Label"
              />
              <Textarea
                value={editedNodeData.description}
                onChange={(e) =>
                  handleNodeDataChange("description", e.target.value)
                }
                className="mb-2 bg-input text-input-foreground"
                placeholder="Node Description"
              />
              <Textarea
                value={editedNodeData.tips}
                onChange={(e) => handleNodeDataChange("tips", e.target.value)}
                className="mb-2 bg-input text-input-foreground"
                placeholder="Tips"
              />
              <Textarea
                value={editedNodeData.usable_pentest_tools}
                onChange={(e) =>
                  handleNodeDataChange("usable_pentest_tools", e.target.value)
                }
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
