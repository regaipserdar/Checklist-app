import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import { ReactFlowProvider, ReactFlowInstance } from 'reactflow';
import { useFlowState } from './useFlowState';
import { useFlowActions } from './useFlowActions';
import FlowHeader from './FlowHeader';
import FlowCanvas from './FlowCanvas';
import NodeDrawer from './NodeDrawer';
import FlowDialog from './FlowDialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSaveNodes } from '../../components/Layout';
import { useParams } from 'react-router-dom';
import { useSaveService } from '../../services/SaveService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from "@/hooks/use-toast"
import '../../index.css';

const Flow: React.FC = React.memo(() => {
  const { flowId } = useParams<{ flowId: string }>();
  const state = useFlowState();
  const actions = useFlowActions(state);
  const { setSaveNodes } = useSaveNodes();
  const { user } = useAuth();
  const { toast } = useToast();
  const { saveChanges } = useSaveService();
  const renderCountRef = useRef(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`[Flow] Component rendered ${renderCountRef.current} times`);
    return () => console.log('[Flow] Component unmounted');
  });



  useEffect(() => {
    if (isInitialMount.current) {
      console.log('[Flow] Initial mount, skipping loadFlow');
      isInitialMount.current = false;
      return;
    }
    
    console.log('[Flow] Component useEffect triggered, flowId:', flowId);
    if (flowId && !actions.isLoading && state.nodes.length === 0) {
      console.log('[Flow] Calling loadFlow with flowId:', flowId);
      actions.loadFlow(flowId);
    } else {
      console.log('[Flow] Conditions not met for loadFlow:',
        'flowId:', !!flowId,
        'not loading:', !actions.isLoading,
        'nodes empty:', state.nodes.length === 0
      );
    }
  }, [flowId, actions.loadFlow, actions.isLoading, state.nodes.length]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log('[Flow] ReactFlow instance initialized');
    state.reactFlowInstanceRef.current = instance;
  }, [state.reactFlowInstanceRef]);
 
  //Handle SAve
  const handleSave = useCallback(async () => {
    console.log('[Flow] Saving flow');
    if (!user) {
      console.error('[Flow] No user logged in');
      toast({
        title: "Error",
        description: "You must be logged in to save a flow.",
        variant: "destructive"
      });
      return;
    }
  
    const changes = {
      flowId: state.flowId,
      flowTitle: state.flowTitle,
      flowDescription: state.flowDescription,
      nodes: state.nodes,
      edges: state.edges,
      userId: user.id,
    };
  
    console.log('[Flow] Preparing changes to save:', changes);
  
    try {
      const result = await saveChanges(changes);
      console.log('[Flow] Save completed', result);
      if (result) {
        state.setFlowId(result.flowId);
        state.setNodes(result.nodes);
        state.setEdges(result.edges);
        state.setIsFlowModalOpen(false);
        toast({
          title: "Success",
          description: "Flow saved successfully.",
        });
      }
    } catch (error) {
      console.error('[Flow] Save failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save the flow. Please try again.',
        variant: "destructive"
      });
    }
  }, [state, user, saveChanges, toast]);

    //USE EFFECT HANDLE SAVE
  useEffect(() => {
    console.log('[Flow] Setting up save function');
    setSaveNodes(handleSave);
  }, [setSaveNodes, handleSave]);

  const memoizedFlowCanvas = useMemo(() => {
    console.log('[Flow] Memoizing FlowCanvas');
    return (
      <FlowCanvas 
        nodes={state.nodes}
        edges={state.edges}
        onNodesChange={state.onNodesChange}
        onEdgesChange={state.onEdgesChange}
        onConnect={actions.onConnect}
        onDrop={actions.onDrop}
        onDragOver={actions.onDragOver}
        onNodeClick={actions.onNodeClick}
        reactFlowWrapper={state.reactFlowWrapper}
        onInit={onInit}
      />
    );
  }, [state.nodes, state.edges, state.onNodesChange, state.onEdgesChange, actions, onInit, state.reactFlowWrapper]);

  console.log('[Flow] Rendering Flow component');

  if (actions.isLoading) {
    console.log('[Flow] Rendering loading state');
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {state.alert && (
        <Alert variant={state.alert.variant}>
          <AlertTitle>{state.alert.title}</AlertTitle>
          <AlertDescription>{state.alert.description}</AlertDescription>
        </Alert>
      )}
      <FlowHeader 
        title={state.flowTitle} 
        onEditFlow={() => {
          console.log('[Flow] Opening flow modal');
          state.setIsFlowModalOpen(true);
        }}
        onBackToDashboard={actions.handleBackToDashboard}
      />
      <div className="flex-1">
        {memoizedFlowCanvas}
      </div>
      <NodeDrawer 
        isOpen={state.isDrawerOpen}
        onClose={() => {
          console.log('[Flow] Closing node drawer');
          state.setIsDrawerOpen(false);
        }}
        node={state.selectedNode}
        onSave={actions.handleSaveNodeData}
      />
      <FlowDialog 
        isOpen={state.isFlowModalOpen}
        onClose={() => {
          console.log('[Flow] Closing flow modal');
          state.setIsFlowModalOpen(false);
        }}
        title={state.flowTitle}
        description={state.flowDescription}
        onSave={handleSave}
        onChange={(field, value) => {
          console.log(`[Flow] Changing ${field} to:`, value);
          if (field === 'title') state.setFlowTitle(value);
          if (field === 'description') state.setFlowDescription(value);
        }}
      />
    </div>
  );
});

const WrappedFlow = () => (
  <ReactFlowProvider>
    <Flow />
  </ReactFlowProvider>
);

export default WrappedFlow;