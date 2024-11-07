import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { ReactFlowProvider, ReactFlowInstance, NodeTypes, Node } from 'reactflow';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlowState } from './useFlowState';
import { useFlowActions } from './useFlowActions';
import FlowHeader from './FlowHeader';
import FlowCanvas from './FlowCanvas';
import NodeDrawer from './NodeDrawer';
import FlowEditDialog from './FlowDialog';
import { useSaveService } from '../../services/SaveService';
import CustomNode from '@/components/CustomNode';
import { useToast } from "@/hooks/use-toast";
import log from 'loglevel';
import 'reactflow/dist/style.css';

log.setLevel('debug');

const FlowContent: React.FC = () => {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadFlow } = useSaveService();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const loadingRef = useRef(false);
  const previousFlowIdRef = useRef<string | null>(null);

  const state = useFlowState();
  const actions = useFlowActions(state.nodes, state.edges);

  const nodeTypes = useMemo<NodeTypes>(() => ({
    customNode: CustomNode
  }), []);

  // Node event handlers
  const handleNodeEdit = useCallback((event: React.MouseEvent, node: Node) => {
    log.debug('[Flow] Opening node edit drawer:', node);
    event.stopPropagation();
    actions.setSelectedNode(node);
    actions.setIsDrawerOpen(true);
  }, [actions]);

  const handleNodeDelete = useCallback((event: React.MouseEvent, nodeId: string) => {
    log.debug('[Flow] Deleting node:', nodeId);
    event.stopPropagation();
    actions.onNodeDelete(event, nodeId);
    toast({
      title: "Success",
      description: "Node deleted successfully",
      duration: 1500,
    });
  }, [actions, toast]);

  const loadFlowData = useCallback(async () => {
    if (loadingRef.current || !flowId || flowId === 'new') return;
    
    loadingRef.current = true;
    state.setIsLoading(true);

    try {
      const flowInfo = await loadFlow(flowId);
      if (!flowInfo) {
        toast({
          title: "Error",
          description: "Flow not found.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      const transformedNodes = flowInfo.nodes.map((node: Node) => ({
        ...node,
        type: 'customNode',
        data: {
          ...node.data,
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete,
          type: node.data.type || 'normal'
        }
      }));

      state.setFlowTitle(flowInfo.title);
      state.setFlowDescription(flowInfo.description);
      actions.setNodes(transformedNodes);
      actions.setEdges(flowInfo.edges);

      if (flowInfo.viewport && state.reactFlowInstanceRef.current) {
        state.reactFlowInstanceRef.current.setViewport(flowInfo.viewport);
      }

      previousFlowIdRef.current = flowId;
    } catch (error) {
      log.error('[Flow] Error loading flow:', error);
      toast({
        title: "Error",
        description: "Failed to load the flow. Please try again.",
        variant: "destructive"
      });
    } finally {
      loadingRef.current = false;
      state.setIsLoading(false);
    }
  }, [flowId, loadFlow, navigate, state, actions, handleNodeEdit, handleNodeDelete, toast]);

  // Load flow data when flowId changes
  useEffect(() => {
    if (previousFlowIdRef.current !== flowId) {
      // Reset state before loading new data
      actions.setNodes([]);
      actions.setEdges([]);
      state.setFlowTitle('');
      state.setFlowDescription('');
      loadFlowData();
    }
  }, [flowId, loadFlowData, actions, state]);

  const handleSaveFlow = useCallback(async () => {
    if (!flowId || flowId === 'new') return;
    
    try {
      await actions.onSave(flowId, state.flowTitle, state.flowDescription);
      toast({
        title: "Success",
        description: "Flow saved successfully.",
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save flow. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    }
  }, [flowId, actions, state.flowTitle, state.flowDescription, toast]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    state.reactFlowInstanceRef.current = instance;
  }, [state]);

  const handleFlowUpdate = useCallback(async (title: string, description: string) => {
    if (!flowId || flowId === 'new') return;

    try {
      await actions.updateFlow(flowId, title, description);
      state.setFlowTitle(title);
      state.setFlowDescription(description);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Flow updated successfully.",
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flow. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    }
  }, [flowId, actions, state, toast]);

  const handleDrawerClose = useCallback(() => {
    actions.setIsDrawerOpen(false);
    actions.setSelectedNode(null);
  }, [actions]);

  const canvasProps = useMemo(() => ({
    nodes: actions.nodes,
    edges: actions.edges,
    onNodesChange: actions.onNodesChange,
    onEdgesChange: actions.onEdgesChange,
    onConnect: actions.onConnect,
    onDrop: actions.onDrop,
    onDragOver: actions.onDragOver,
    onNodeClick: handleNodeEdit,
    reactFlowWrapper: state.reactFlowWrapper,
    nodeTypes,
    onInit
  }), [
    actions.nodes,
    actions.edges,
    actions.onNodesChange,
    actions.onEdgesChange,
    actions.onConnect,
    actions.onDrop,
    actions.onDragOver,
    state.reactFlowWrapper,
    nodeTypes,
    onInit,
    handleNodeEdit
  ]);

  if (state.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div key={flowId} className="flex flex-col h-full w-full bg-background">
      <div className="flex-shrink-0 p-4 border-b border-border">
        <FlowHeader 
          title={state.flowTitle || "Untitled Flow"}
          onEditFlow={() => setIsEditDialogOpen(true)}
          onSaveFlow={handleSaveFlow}
          onBackToDashboard={actions.handleBackToDashboard}
        />
      </div>

      <div className="flex-1 relative min-h-0">
        <FlowCanvas {...canvasProps} />
      </div>

      <NodeDrawer 
        isOpen={actions.isDrawerOpen}
        onClose={handleDrawerClose}
        node={actions.selectedNode}
        onSave={actions.handleSaveNodeData}
      />

      <FlowEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title={state.flowTitle}
        description={state.flowDescription}
        onUpdate={handleFlowUpdate}
        onChange={(field: string, value: string) => {
          if (field === 'title') state.setFlowTitle(value);
          if (field === 'description') state.setFlowDescription(value);
        }}
      />
    </div>
  );
};

const Flow: React.FC = () => (
  <ReactFlowProvider>
    <FlowContent />
  </ReactFlowProvider>
);

export default React.memo(Flow);