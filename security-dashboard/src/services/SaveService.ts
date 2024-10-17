import { useCallback, useState } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow';
import pb from './Pb-getFlowService';
import { useToast } from "@/hooks/use-toast";
import { RecordModel } from 'pocketbase';
import log from 'loglevel';

interface SaveData {
    flowId: string | null;
    flowTitle: string;
    flowDescription: string;
    nodes: Node[];
    edges: Edge[];
    userId: string;
}

interface SaveResult {
    flowId: string;
    nodes: Node[];
    edges: Edge[];
}

interface PocketBaseEdge extends RecordModel {
    flow: string;
    source: string;
    target: string;
    sourceHandle: string | null;
    targetHandle: string | null;
    label: string | undefined;
}

function mapNodeType(reactFlowType: string): string {
    switch (reactFlowType) {
        case 'start':
            return 'start';
        case 'end':
            return 'end';
        case 'sticky':
            return 'sticky_note';
        default:
            return 'normal';
    }
}

const useSaveService = () => {
    const { toast } = useToast();
    const [pendingChanges, setPendingChanges] = useState<SaveData | null>(null);
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);

    const saveNodes = async (nodes: Node[], flowId: string, existingNodes: RecordModel[]) => {
        return Promise.all(nodes.map(async (node) => {
            const existingNode = existingNodes.find(n => n.id === node.data.pocketbaseId);
            const nodeData = {
                flow: [flowId],
                title: node.data.label,
                description: node.data.description || '',
                tips: node.data.tips || '',
                position: JSON.stringify(node.position),
                types: mapNodeType(node.data.type),
                inputCount: node.data.inputCount || 0,
                outputCount: node.data.outputCount || 0,
                usable_pentest_tools: node.data.usable_pentest_tools || '',
                order: node.data.order || 0,
            };

            if (existingNode && node.data.pocketbaseId) {
                log.debug(`[SaveService.saveNodes] Updating existing node: ${existingNode.id}`);
                const updatedNode = await pb.collection('nodes').update(existingNode.id, nodeData);
                return { ...node, data: { ...node.data, pocketbaseId: updatedNode.id } };
            } else {
                log.debug(`[SaveService.saveNodes] Creating new node`);
                const createdNode = await pb.collection('nodes').create(nodeData);
                return { ...node, data: { ...node.data, pocketbaseId: createdNode.id } };
            }
        }));
    };

    const saveEdges = async (edges: Edge[], flowId: string, existingEdges: RecordModel[], nodeIdMap: Map<string, string>): Promise<(PocketBaseEdge | null)[]> => {
        return Promise.all(edges.map(async (edge) => {
            const sourceNodeId = nodeIdMap.get(edge.source);
            const targetNodeId = nodeIdMap.get(edge.target);
    
            if (!sourceNodeId || !targetNodeId) {
                log.error(`Source or target node not found for edge: ${edge.id}`);
                return null;
            }
    
            const edgeData = {
                flow: flowId,
                source: sourceNodeId,
                target: targetNodeId,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                label: typeof edge.label === 'string' ? edge.label : undefined,
            };
    
            const existingEdge = existingEdges.find(e => e.id === edge.id);
            
            try {
                if (existingEdge) {
                    log.debug(`[SaveService.saveEdges] Updating existing edge: ${existingEdge.id}`);
                    return await pb.collection('edges').update<PocketBaseEdge>(existingEdge.id, edgeData);
                } else {
                    log.debug('[SaveService.saveEdges] Creating new edge');
                    return await pb.collection('edges').create<PocketBaseEdge>(edgeData);
                }
            } catch (error) {
                log.error(`Error saving edge: ${edge.id}`, error);
                return null;
            }
        }));
    };

    const saveChanges = useCallback(async (changes?: SaveData): Promise<SaveResult> => {
        log.debug('[SaveService.saveChanges] Starting save process');
        log.debug('[SaveService.saveChanges] Changes to save:', changes);
        const changesToSave = changes || pendingChanges;

        if (!changesToSave) {
            log.warn('[SaveService.saveChanges] No changes to save');
            return Promise.reject(new Error('No changes to save'));
        }

        const { flowId, flowTitle, flowDescription, nodes, edges, userId } = changesToSave;

        log.debug(`[SaveService.saveChanges] Preparing to save flow: ${flowId || 'new flow'}`);

        try {
            let savedFlow: RecordModel;
            if (flowId) {
                log.debug(`[SaveService.saveChanges] Updating existing flow: ${flowId}`);
                savedFlow = await pb.collection('flows').update(flowId, {
                    title: flowTitle,
                    description: flowDescription,
                });
            } else {
                log.debug('[SaveService.saveChanges] Creating new flow');
                savedFlow = await pb.collection('flows').create({
                    title: flowTitle,
                    description: flowDescription,
                    creator: userId,
                    isSystemFlow: false,
                    isShared: true,
                });
            }
            log.debug(`[SaveService.saveChanges] Flow saved successfully:`, savedFlow);

            const existingNodes = await pb.collection('nodes').getFullList<RecordModel>({ filter: `flow="${savedFlow.id}"` });
            const existingEdges = await pb.collection('edges').getFullList<RecordModel>({ filter: `flow="${savedFlow.id}"` });

            const savedNodes = await saveNodes(nodes, savedFlow.id, existingNodes);
            log.debug('[SaveService.saveChanges] Nodes saved:', savedNodes.map(n => ({ id: n.id, pocketbaseId: n.data.pocketbaseId })));

            const nodeIdMap = new Map(savedNodes.map(node => [node.id, node.data.pocketbaseId]));

            // saveChanges fonksiyonu içinde:
            const savedEdges = await saveEdges(edges, savedFlow.id, existingEdges, nodeIdMap);
            log.debug('[SaveService.saveChanges] Edges saved:', savedEdges.filter((e): e is PocketBaseEdge => e !== null).map(e => ({ id: e.id, source: e.source, target: e.target })));

            const convertedEdges: Edge[] = savedEdges
                .filter((pocketBaseEdge): pocketBaseEdge is PocketBaseEdge => pocketBaseEdge !== null)
                .map(pocketBaseEdge => ({
                    id: pocketBaseEdge.id,
                    source: pocketBaseEdge.source,
                    target: pocketBaseEdge.target,
                    sourceHandle: pocketBaseEdge.sourceHandle,
                    targetHandle: pocketBaseEdge.targetHandle,
                    label: pocketBaseEdge.label,
                }));

            log.debug('[SaveService.saveChanges] All changes saved successfully');
            toast({
                title: "Success",
                description: "All changes saved successfully.",
            });

            setNodes(savedNodes);
            setEdges(convertedEdges);

            return { flowId: savedFlow.id, nodes: savedNodes, edges: convertedEdges };
        } catch (error) {
            log.error('[SaveService.saveChanges] Error saving changes:', error);
            let errorMessage = "Failed to save changes. Please try again.";
            if (error instanceof Error) {
                log.error('[SaveService.saveChanges] Error details:', error.message);
                log.error('[SaveService.saveChanges] Error stack:', error.stack);
                errorMessage = error.message;
            }
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
            throw error;
        }
    }, [toast, pendingChanges, setNodes, setEdges]);

    return { saveChanges, setPendingChanges, nodes, edges, setNodes, setEdges };
};

export { useSaveService };