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
import { saveService } from '../../services/SaveService';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const Flow: React.FC = React.memo(() => {
  const { flowId } = useParams<{ flowId: string }>();
  const state = useFlowState();
  const actions = useFlowActions(state);
  const { setSaveNodes, triggerSave } = useSaveNodes();
  const { user } = useAuth();

  const renderCountRef = useRef(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    renderCountRef.current += 1;
    console.log(`[Flow] Component rendered ${renderCountRef.current} times`);
    return () => console.log('[Flow] Component unmounted');
  });

  const setSaveNodesCallback = useCallback(() => {
    console.log('[Flow] Save function triggered');
    if (user) {
      saveService.setPendingChanges({
        flowId: state.flowId,
        flowTitle: state.flowTitle,
        flowDescription: state.flowDescription,
        nodes: state.nodes,
        edges: state.edges,
        userId: user.id,
      });
    } else {
      console.error('[Flow] No user logged in');
    }
  }, [state.flowId, state.flowTitle, state.flowDescription, state.nodes, state.edges, user]);

  useEffect(() => {
    console.log('[Flow] Setting up save function');
    setSaveNodes(setSaveNodesCallback);
  }, [setSaveNodes, setSaveNodesCallback]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    console.log('[Flow] Component useEffect triggered, flowId:', flowId);
    if (flowId && !actions.isLoading && state.nodes.length === 0) {
      console.log('[Flow] Calling loadFlow with flowId:', flowId);
      actions.loadFlow(flowId);
    }
  }, [flowId, actions.loadFlow, actions.isLoading, state.nodes.length]);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log('[Flow] ReactFlow instance initialized');
    state.reactFlowInstanceRef.current = instance;
  }, [state.reactFlowInstanceRef]);

  const memoizedFlowCanvas = useMemo(() => (
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
  ), [state.nodes, state.edges, state.onNodesChange, state.onEdgesChange, actions, onInit, state.reactFlowWrapper]);

  console.log('[Flow] Rendering Flow component');

  if (actions.isLoading) {
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
        onClose={() => state.setIsDrawerOpen(false)}
        node={state.selectedNode}
        onSave={actions.handleSaveNodeData}
      />
      <FlowDialog 
        isOpen={state.isFlowModalOpen}
        onClose={() => state.setIsFlowModalOpen(false)}
        title={state.flowTitle}
        description={state.flowDescription}
        onSave={() => {
          actions.handleSave();
          triggerSave();
        }}
        onChange={(field, value) => {
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