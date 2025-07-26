import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrderService } from '../services/workOrders';
import { WorkOrder, WorkOrderForm, WorkOrderQuery } from '../types';

export const useWorkOrders = (query?: WorkOrderQuery) => {
  return useQuery({
    queryKey: ['workOrders', query],
    queryFn: () => workOrderService.getWorkOrders(query),
  });
};

export const useWorkOrder = (id: string) => {
  return useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => workOrderService.getWorkOrder(id),
    enabled: !!id,
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WorkOrderForm) => workOrderService.createWorkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useUpdateWorkOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrderForm> }) =>
      workOrderService.updateWorkOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.id] });
    },
  });
};

export const useDeleteWorkOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => workOrderService.deleteWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });
};

export const useAssignPerson = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ workOrderId, data }: { workOrderId: string; data: { personId: string; role: string; accessLevel: string } }) =>
      workOrderService.assignPerson(workOrderId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.workOrderId] });
    },
  });
};

export const useRemoveAssignment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ workOrderId, assignmentId }: { workOrderId: string; assignmentId: string }) =>
      workOrderService.removeAssignment(workOrderId, assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workOrder', variables.workOrderId] });
    },
  });
};