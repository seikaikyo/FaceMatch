import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractorService } from '../services/contractors';
import { Contractor, ContractorForm, ContractorQuery } from '../types';

export const useContractors = (query?: ContractorQuery) => {
  return useQuery({
    queryKey: ['contractors', query],
    queryFn: () => contractorService.getContractors(query),
  });
};

export const useContractor = (id: string) => {
  return useQuery({
    queryKey: ['contractor', id],
    queryFn: () => contractorService.getContractor(id),
    enabled: !!id,
  });
};

export const useCreateContractor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ContractorForm) => contractorService.createContractor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
    },
  });
};

export const useUpdateContractor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractorForm> }) =>
      contractorService.updateContractor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['contractor', variables.id] });
    },
  });
};

export const useDeleteContractor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => contractorService.deleteContractor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
    },
  });
};