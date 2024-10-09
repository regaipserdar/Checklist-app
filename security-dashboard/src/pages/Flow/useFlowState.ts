// useFlowState.ts
import { useState, useRef, MutableRefObject } from 'react';
import { useNodesState, useEdgesState, ReactFlowInstance } from 'reactflow';
import { useParams } from 'react-router-dom';

export interface FlowState {
  flowId: string | null;
  reactFlowWrapper: MutableRefObject<HTMLDivElement | null>;
  setFlowId: React.Dispatch<React.SetStateAction<string | null>>;
  saveNodesFunction: (() => void) | null;
  setSaveNodesFunction: React.Dispatch<React.SetStateAction<(() => void) | null>>;
  nodes: any[];
  setNodes: any;
  onNodesChange: any;
  edges: any[];
  setEdges: any;
  onEdgesChange: any;
  flowTitle: string;
  setFlowTitle: React.Dispatch<React.SetStateAction<string>>;
  flowDescription: string;
  setFlowDescription: React.Dispatch<React.SetStateAction<string>>;
  selectedNode: any;
  setSelectedNode: React.Dispatch<React.SetStateAction<any>>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isFlowModalOpen: boolean;
  setIsFlowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNewFlowModalOpen: boolean;
  setIsNewFlowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  alert: AlertState | null;
  setAlert: React.Dispatch<React.SetStateAction<AlertState | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  editedNodeData: any;
  setEditedNodeData: React.Dispatch<React.SetStateAction<any>>;
  reactFlowInstance: ReactFlowInstance;
  systemFlows: any[];
  setSystemFlows: React.Dispatch<React.SetStateAction<any[]>>;
  userFlows: any[];
  setUserFlows: React.Dispatch<React.SetStateAction<any[]>>;
}

interface AlertState {
  title: string;
  description: string;
  variant: 'default' | 'destructive';
}

export const useFlowState = () => {
  const { flowId: paramFlowId } = useParams<{ flowId?: string }>();
  const [saveNodesFunction, setSaveNodesFunction] = useState<(() => void) | null>(null);
  const [flowId, setFlowId] = useState<string | null>(paramFlowId && paramFlowId !== 'new' ? paramFlowId : null);
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowTitle, setFlowTitle] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editedNodeData, setEditedNodeData] = useState({ label: '', description: '', tips: '', usable_pentest_tools: '' });
  const [systemFlows, setSystemFlows] = useState<any[]>([]);
  const [userFlows, setUserFlows] = useState<any[]>([]);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  return {
    flowId,
    reactFlowWrapper,
    setFlowId,
    saveNodesFunction,
    setSaveNodesFunction,
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    flowTitle,
    setFlowTitle,
    flowDescription,
    setFlowDescription,
    selectedNode,
    setSelectedNode,
    isDrawerOpen,
    setIsDrawerOpen,
    isFlowModalOpen,
    setIsFlowModalOpen,
    isNewFlowModalOpen,
    setIsNewFlowModalOpen,
    alert,
    setAlert,
    isLoading,
    setIsLoading,
    editedNodeData,
    setEditedNodeData,
    reactFlowInstanceRef,
    systemFlows,
    setSystemFlows,
    userFlows,
    setUserFlows,
  };
};