import React, { useEffect, useCallback } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { useFlowState } from './useFlowState';
import { useFlowActions } from './useFlowActions';
import { useFlowEffects } from './useFlowEffects';
import FlowHeader from './FlowHeader';
import FlowCanvas from './FlowCanvas';
import NodeDrawer from './NodeDrawer';
import FlowDialog from './FlowDialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSaveNodes } from '../../components/Layout';
import { useParams } from 'react-router-dom';

const Flow: React.FC = () => {
  const { flowId } = useParams<{ flowId: string }>();
  const state = useFlowState();
  const actions = useFlowActions(state);
  const { setSaveNodes } = useSaveNodes();

  useFlowEffects(state, actions);

  const memoizedSaveNodesAndEdges = useCallback(() => {
    console.log('Calling saveNodesAndEdges');
    return actions.handleSaveNodesAndEdges();
  }, [actions.handleSaveNodesAndEdges]);

  useEffect(() => {
    console.log('Setting saveNodesAndEdges function');
    setSaveNodes(memoizedSaveNodesAndEdges);
  }, [memoizedSaveNodesAndEdges, setSaveNodes]);

  useEffect(() => {
    if (flowId) {
      actions.loadFlow(flowId);
    }
  }, [flowId, actions]);

  return (
    <div className="h-full w-full flex flex-col">
      {state.alert && (
        <Alert variant={state.alert.variant}>
          <AlertTitle>{state.alert.title}</AlertTitle>
          <AlertDescription>{state.alert.description}</AlertDescription>
        </Alert>
      )}
      {state.isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <FlowHeader 
            title={state.flowTitle} 
            onEditFlow={() => state.setIsFlowModalOpen(true)}
            onBackToDashboard={actions.handleBackToDashboard}
          />
          <div className="flex-1">
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
            />
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
            onSave={actions.handleSave}
            onChange={(field, value) => {
              if (field === 'title') state.setFlowTitle(value);
              if (field === 'description') state.setFlowDescription(value);
            }}
          />
        </>
      )}
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <Flow />
  </ReactFlowProvider>
);