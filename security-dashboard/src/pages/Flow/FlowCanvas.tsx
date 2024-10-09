import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, NodeTypes, ReactFlowInstance } from 'reactflow';
import CustomNode from '../../components/CustomNode';
import 'reactflow/dist/style.css';
import '../../index.css';

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
  const nodeTypes = useMemo<NodeTypes>(() => ({ customNode: CustomNode }), []);

  return (
    <div className="w-full h-full" style={{ height: '100vh' }} ref={reactFlowWrapper}>
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
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;