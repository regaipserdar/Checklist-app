import { useCallback } from 'react';
import { Node, Edge, Viewport } from 'reactflow';
import pb from './Pb-getFlowService';
import { useToast } from "@/hooks/use-toast";
import { RecordModel } from 'pocketbase';
import log from 'loglevel';
import { CustomNodeData } from '@/components/CustomNode';

// Temel veri tipleri
interface FlowData {
    nodes: Node<CustomNodeData>[];
    edges: Edge[];
    viewport: Viewport;
}

interface SaveData {
    flowId: string | null;
    title: string;
    description: string;
    flow: FlowData;
    userId: string;
}

interface SaveResult {
    flowId: string;
    title: string;
    description: string;
    flow: FlowData;
}

export const useSaveService = () => {
    const { toast } = useToast();

    // Flow kaydetme fonksiyonu
    const saveChanges = useCallback(async (changes: SaveData): Promise<SaveResult> => {
        log.info('[SaveService.saveChanges] Starting save process:', {
            flowId: changes.flowId,
            title: changes.title,
            nodesCount: changes.flow.nodes.length
        });

        try {
            const { flowId, title, description, flow, userId } = changes;

            // Flow verilerini temizle
            const cleanFlow = {
                nodes: flow.nodes.map(node => ({
                    ...node,
                    data: {
                        ...node.data,
                        onEdit: undefined,
                        onDelete: undefined
                    }
                })),
                edges: flow.edges,
                viewport: flow.viewport
            };

            // Kayıt için veriyi hazırla
            const saveData = {
                title,
                description,
                flow: JSON.stringify(cleanFlow),
                creator: userId ? [userId] : [],
                isSystemFlow: false,
                isShared: true,
            };

            log.debug('[SaveService.saveChanges] Prepared save data, attempting save...');

            let savedFlow: RecordModel;
            if (flowId) {
                log.debug(`[SaveService.saveChanges] Updating existing flow: ${flowId}`);
                savedFlow = await pb.collection('flows').update(flowId, saveData);
            } else {
                log.debug('[SaveService.saveChanges] Creating new flow');
                savedFlow = await pb.collection('flows').create(saveData);
            }

            log.info('[SaveService.saveChanges] Flow saved successfully:', {
                flowId: savedFlow.id,
                title: savedFlow.title
            });

            // Kaydedilen veriyi parse et
            const parsedFlow = typeof savedFlow.flow === 'string' 
                ? JSON.parse(savedFlow.flow) 
                : savedFlow.flow;

            return {
                flowId: savedFlow.id,
                title: savedFlow.title,
                description: savedFlow.description,
                flow: parsedFlow
            };
        } catch (error) {
            log.error('[SaveService.saveChanges] Error saving flow:', error);
            toast({
                title: "Error",
                description: "Failed to save flow. Check console for details.",
                variant: "destructive"
            });
            throw error;
        }
    }, [toast]);

    // Flow yükleme fonksiyonu
    const loadFlow = useCallback(async (flowId: string) => {
        log.info(`[SaveService.loadFlow] Loading flow: ${flowId}`);
        try {
            const loadedFlow = await pb.collection('flows').getOne(flowId);
            log.debug('[SaveService.loadFlow] Raw loaded flow:', {
                id: loadedFlow.id,
                title: loadedFlow.title,
                hasFlow: !!loadedFlow.flow
            });

            const flowData = typeof loadedFlow.flow === 'string' 
                ? JSON.parse(loadedFlow.flow) 
                : loadedFlow.flow;

            log.debug('[SaveService.loadFlow] Parsed flow data:', {
                nodesCount: flowData.nodes?.length || 0,
                edgesCount: flowData.edges?.length || 0,
                hasViewport: !!flowData.viewport
            });

            const result = {
                title: loadedFlow.title,
                description: loadedFlow.description,
                nodes: flowData.nodes || [],
                edges: flowData.edges || [],
                viewport: flowData.viewport,
            };

            toast({
                title: "Success",
                description: "Flow loaded successfully.",
            });

            log.info('[SaveService.loadFlow] Flow loaded successfully:', {
                id: loadedFlow.id,
                nodesCount: result.nodes.length
            });

            return result;
        } catch (error) {
            log.error('[SaveService.loadFlow] Error loading flow:', error);
            
            // 404 hatası kontrolü
            if (error instanceof Error && 'status' in error && (error as any).status === 404) {
                log.warn(`[SaveService.loadFlow] Flow with ID ${flowId} not found`);
                toast({
                    title: "Warning",
                    description: "The requested flow was not found. It may have been deleted.",
                    variant: "destructive"
                });
                return null;
            }

            toast({
                title: "Error",
                description: "Failed to load flow. Please try again.",
                variant: "destructive"
            });
            throw error;
        }
    }, [toast]);

    return { saveChanges, loadFlow };
};