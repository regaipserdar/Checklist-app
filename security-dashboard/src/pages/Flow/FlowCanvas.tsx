import React, { useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Node, 
  Edge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect,
  NodeTypes, 
  ReactFlowInstance,
  BackgroundVariant,
  Panel,
  ConnectionMode,
} from 'reactflow';
import CustomNode from '../../components/CustomNode';

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  onInit: (instance: ReactFlowInstance) => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
  onNodeClick,
  reactFlowWrapper,
  onInit,
}) => {
  const nodeTypes = React.useMemo<NodeTypes>(() => ({
    customNode: CustomNode
  }), []);

  const edgeOptions = React.useMemo(() => ({
    type: 'bezier',
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: 'hsl(var(--foreground))'
    }
  }), []);

  const handleResize = useCallback(() => {
    if (reactFlowWrapper.current) {
      const { offsetWidth, offsetHeight } = reactFlowWrapper.current;
      console.log('[FlowCanvas] Current dimensions:', {
        width: offsetWidth,
        height: offsetHeight
      });
    }
  }, [reactFlowWrapper]);

  useEffect(() => {
    console.log('[FlowCanvas] Mounting component');
    window.addEventListener('resize', handleResize);
    
    // Initial size check
    handleResize();

    return () => {
      console.log('[FlowCanvas] Unmounting component');
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div className="w-full h-full flex-1" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        defaultEdgeOptions={edgeOptions}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
        minZoom={0.2}
        maxZoom={4}
        className="w-full h-full bg-background"
        style={{ width: '100%', height: '100%' }}
      >
        <Panel position="top-left" className="bg-background/50 backdrop-blur-sm p-2 rounded-lg border border-border">
          <div className="text-xs text-muted-foreground">
            Drag and drop nodes to create your flow
          </div>
        </Panel>
        
        <Background 
          variant={BackgroundVariant.Dots}
          gap={12}
          size={1}
          color="hsl(var(--muted-foreground))"
          style={{ 
            backgroundColor: 'hsl(var(--background))',
            width: '100%',
            height: '100%'
          }}
        />
        
        <Controls 
          position="bottom-right"
          showInteractive={false}
          className="bg-background border border-border rounded-lg shadow-sm"
        />
      </ReactFlow>
    </div>
  );
};

export default React.memo(FlowCanvas);