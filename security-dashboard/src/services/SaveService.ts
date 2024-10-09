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

        try {
            // Validate nodes
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
                // Node tipini belirle
                let nodeType;
                switch (node.type) {
                    case 'start':
                        nodeType = 'start';
                        break;
                    case 'end':
                        nodeType = 'end';
                        break;
                    case 'sticky':
                        nodeType = 'sticky_note';
                        break;
                    default:
                        nodeType = 'normal'; // process node için varsayılan tip
                }

                const nodeData = {
                    flow: savedFlow.id,
                    title: node.data.label,
                    description: node.data.description || '',
                    tips: node.data.tips || '',
                    position: JSON.stringify(node.position),
                    types: nodeType,
                    usable_pentest_tools: node.data.usable_pentest_tools || '',
                };

                let savedNode;
                const cachedPocketbaseId = this.nodeCache.get(node.id);
                if (cachedPocketbaseId) {
                    console.log(`[SaveService] Updating existing node: ${cachedPocketbaseId}`);
                    savedNode = await pb.collection('nodes').update(cachedPocketbaseId, nodeData);
                } else {
                    console.log('[SaveService] Creating new node');
                    savedNode = await pb.collection('nodes').create(nodeData);
                    this.nodeCache.set(node.id, savedNode.id);
                }
                console.log(`[SaveService] Node saved successfully: ${savedNode.id}`);
                return { ...node, data: { ...node.data, pocketbaseId: savedNode.id } };
            }));

            // Save edges
            console.log(`[SaveService] Saving ${edges.length} edges`);
            const savedEdges = await Promise.all(edges.map(async (edge) => {
                const edgeData = {
                    flow: savedFlow.id,
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: edge.targetHandle,
                    label: edge.label,
                };

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
                console.log(`[SaveService] Edge saved successfully: ${savedEdge.id}`);
                return { ...edge, id: savedEdge.id };
            }));

            console.log('[SaveService] All changes saved successfully');
            this.pendingChanges = null;
            toast({
                title: "Success",
                description: "All changes saved successfully.",
            });
            return { flowId: savedFlow.id, nodes: savedNodes, edges: savedEdges };
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