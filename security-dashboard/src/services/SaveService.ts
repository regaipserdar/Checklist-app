import pb from './Pb-getFlowService';
import { Node, Edge } from 'reactflow';
import { useToast } from "@/hooks/use-toast";

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

class SaveService {
    private pendingChanges: SaveData | null = null;
    private nodeCache: Map<string, string> = new Map(); // node.id -> pocketbaseId
    private edgeCache: Map<string, string> = new Map(); // edge.id -> pocketbaseId

    setPendingChanges(changes: SaveData) {
        console.log('[SaveService] Setting pending changes:', changes);
        this.pendingChanges = changes;
    }

    private determineNodeType(node: Node): string {
        console.log(`[SaveService] Determining node type for node:`, node);
        if (node.type === 'start') return 'start';
        if (node.type === 'end') return 'end';
        if (node.type === 'sticky') return 'sticky_note';
        if (node.type === 'customNode') {
            return node.data.type === 'userFlow' ? 'userFlow' : 'normal';
        }
        // Eğer node.data.type varsa ve geçerli bir değerse, onu kullan
        if (node.data.type && ['start', 'end', 'sticky_note', 'normal', 'userFlow'].includes(node.data.type)) {
            return node.data.type;
        }
        // Varsayılan olarak 'normal' tipini döndür
        return 'normal';
    }

    async saveChanges(toast: ReturnType<typeof useToast>['toast']): Promise<SaveResult> {
        console.log('[SaveService] saveChanges called');
        if (!this.pendingChanges) {
            console.log('[SaveService] No pending changes to save');
            toast({
                title: "Error",
                description: "No changes to save.",
                variant: "destructive",
            });
            throw new Error('No pending changes to save');
        }

        const { flowId, flowTitle, flowDescription, nodes, edges, userId } = this.pendingChanges;
        console.log(`[SaveService] Preparing to save flow: ${flowId || 'new flow'}`);
        console.log('[SaveService] Nodes to save:', nodes);

        try {
            // Validate nodes
            console.log('[SaveService] Validating nodes');
            const invalidNodes = nodes.filter(node => 
                !node.data.label || !node.data.description || !node.data.tips
            );

            if (invalidNodes.length > 0) {
                console.error('[SaveService] Invalid nodes found:', invalidNodes);
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "All nodes must have a title, description, and tips.",
                });
                throw new Error('Invalid nodes found');
            }

            // Save or update flow
            let savedFlow;
            if (flowId) {
                console.log(`[SaveService] Updating existing flow: ${flowId}`);
                savedFlow = await pb.collection('flows').update(flowId, {
                    title: flowTitle,
                    description: flowDescription,
                });
            } else {
                console.log('[SaveService] Creating new flow');
                savedFlow = await pb.collection('flows').create({
                    title: flowTitle,
                    description: flowDescription,
                    creator: userId,
                    isSystemFlow: false,
                    isShared: true,
                });
            }
            console.log(`[SaveService] Flow saved successfully: ${savedFlow.id}`);

            // Save nodes
            console.log(`[SaveService] Saving ${nodes.length} nodes`);
            const savedNodes = await Promise.all(nodes.map(async (node) => {
                console.log(`[SaveService] Processing node: ${node.id}`);
                console.log('[SaveService] Node data:', node);
                
                const nodeType = this.determineNodeType(node);
                console.log(`[SaveService] Node type determined: ${nodeType}`);

                const nodeData = {
                    flow: savedFlow.id,
                    title: node.data.label,
                    description: node.data.description || '',
                    tips: node.data.tips || '',
                    position: JSON.stringify(node.position),
                    types: nodeType,
                    usable_pentest_tools: node.data.usable_pentest_tools || '',
                };
                console.log(`[SaveService] Node data prepared:`, nodeData);

                let savedNode;
                const cachedPocketbaseId = this.nodeCache.get(node.id);
                if (cachedPocketbaseId) {
                    try {
                        console.log(`[SaveService] Updating existing node: ${cachedPocketbaseId}`);
                        savedNode = await pb.collection('nodes').update(cachedPocketbaseId, nodeData);
                    } catch (error) {
                        if ((error as any).status === 404) {
                            console.log(`[SaveService] Node not found in PocketBase, creating new: ${node.id}`);
                            savedNode = await pb.collection('nodes').create(nodeData);
                            this.nodeCache.set(node.id, savedNode.id);
                        } else {
                            throw error;
                        }
                    }
                } else {
                    console.log('[SaveService] Creating new node');
                    savedNode = await pb.collection('nodes').create(nodeData);
                    this.nodeCache.set(node.id, savedNode.id);
                }
                console.log(`[SaveService] Node saved successfully:`, savedNode);
                return { ...node, data: { ...node.data, pocketbaseId: savedNode.id } };
            }));

            console.log('[SaveService] All nodes saved:', savedNodes);

            // Create a map of React Flow node IDs to PocketBase node IDs
            const nodeIdMap = new Map(savedNodes.map(node => [node.id, node.data.pocketbaseId]));

            // Save edges
            console.log(`[SaveService] Saving ${edges.length} edges`);
            const savedEdges = await Promise.all(edges.map(async (edge) => {
                console.log(`[SaveService] Processing edge: ${edge.id}`);
                const sourceNodeId = nodeIdMap.get(edge.source);
                const targetNodeId = nodeIdMap.get(edge.target);

                if (!sourceNodeId || !targetNodeId) {
                    console.error(`[SaveService] Source or target node not found for edge: ${edge.id}`);
                    return null;
                }

                const edgeData = {
                    flow: savedFlow.id,
                    source: sourceNodeId,
                    target: targetNodeId,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: edge.targetHandle,
                    label: edge.label,
                };
                console.log(`[SaveService] Edge data prepared:`, edgeData);

                let savedEdge;
                const cachedPocketbaseId = this.edgeCache.get(edge.id);
                if (cachedPocketbaseId) {
                    console.log(`[SaveService] Updating existing edge: ${cachedPocketbaseId}`);
                    savedEdge = await pb.collection('edges').update(cachedPocketbaseId, edgeData);
                } else {
                    console.log('[SaveService] Creating new edge');
                    savedEdge = await pb.collection('edges').create(edgeData);
                    this.edgeCache.set(edge.id, savedEdge.id);
                }
                console.log(`[SaveService] Edge saved successfully:`, savedEdge);
                return savedEdge ? { ...edge, id: savedEdge.id } : null;
            }));

            const validSavedEdges = savedEdges.filter(edge => edge !== null);
            console.log('[SaveService] All valid edges saved:', validSavedEdges);

            if (validSavedEdges.length !== edges.length) {
                console.warn(`[SaveService] Some edges could not be saved. Saved ${validSavedEdges.length} out of ${edges.length} edges.`);
            }

            console.log('[SaveService] All changes saved successfully');
            this.pendingChanges = null;
            toast({
                title: "Success",
                description: "All changes saved successfully.",
            });
            return { flowId: savedFlow.id, nodes: savedNodes, edges: validSavedEdges };
        } catch (error) {
            console.error('[SaveService] Error saving changes:', error);
            if (error instanceof Error) {
                console.error('[SaveService] Error details:', error.message);
                console.error('[SaveService] Error stack:', error.stack);
            }
            toast({
                title: "Error",
                description: "Failed to save changes. Please try again.",
                variant: "destructive",
            });
            throw error;
        }
    }
}

export const saveService = new SaveService();