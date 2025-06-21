// src/hooks/useAffiliate.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import affiliateService from '@/services/affiliateService';
import logger from '@/utils/logger';

/**
 * Query keys for affiliate-related queries
 */
export const affiliateKeys = {
  all: ['affiliate'],
  dashboard: () => [...affiliateKeys.all, 'dashboard'],
  referrals: (params) => [...affiliateKeys.all, 'referrals', params],
  stats: () => [...affiliateKeys.all, 'stats']
};

/**
 * Hook for managing affiliate dashboard data
 */
export const useAffiliateDashboard = () => {
  return useQuery({
    queryKey: affiliateKeys.dashboard(),
    queryFn: affiliateService.getDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching affiliate dashboard:', error);
    }
  });
};

/**
 * Hook for managing affiliate referrals with pagination
 */
export const useAffiliateReferrals = (params = {}) => {
  const { page = 1, limit = 20, status = null } = params;
  
  return useQuery({
    queryKey: affiliateKeys.referrals({ page, limit, status }),
    queryFn: () => affiliateService.getReferrals({ page, limit, status }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // Keep previous page data while loading new page
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching affiliate referrals:', error);
    }
  });
};

/**
 * Hook for managing detailed affiliate statistics
 */
export const useAffiliateStats = () => {
  return useQuery({
    queryKey: affiliateKeys.stats(),
    queryFn: affiliateService.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching affiliate stats:', error);
    }
  });
};

/**
 * Hook for becoming an affiliate
 */
export const useBecomeAffiliate = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: affiliateService.becomeAffiliate,
    onSuccess: (data) => {
      // Invalidate and refetch affiliate queries
      queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
      
      logger.info('Successfully became an affiliate');
      toast({
        title: "Welcome to our affiliate program!",
        description: "Your referral link is ready to use.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    },
    onError: (error) => {
      logger.error('Error becoming affiliate:', error);
      
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Failed to join affiliate program';
      
      toast({
        title: "Failed to join affiliate program",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    }
  });
};

/**
 * Hook for deactivating affiliate account
 */
export const useDeactivateAffiliate = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: affiliateService.deactivateAffiliate,
    onSuccess: () => {
      // Invalidate and refetch affiliate queries
      queryClient.invalidateQueries({ queryKey: affiliateKeys.all });
      
      logger.info('Successfully deactivated affiliate account');
      toast({
        title: "Affiliate account deactivated",
        description: "You have left the affiliate program.",
        status: "info",
        duration: 4000,
        isClosable: true,
        position: "top-right"
      });
    },
    onError: (error) => {
      logger.error('Error deactivating affiliate:', error);
      
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          'Failed to deactivate affiliate account';
      
      toast({
        title: "Failed to deactivate account",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    }
  });
};

/**
 * Hook for copying referral link
 */
export const useCopyReferralLink = () => {
  const toast = useToast();

  const copyLink = async (referralLink) => {
    try {
      await affiliateService.copyReferralLink(referralLink);
      
      toast({
        title: "Referral link copied!",
        description: "The link has been copied to your clipboard.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
      
      return true;
    } catch (error) {
      logger.error('Error copying referral link:', error);
      
      toast({
        title: "Failed to copy link",
        description: "Please try copying the link manually.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top-right"
      });
      
      return false;
    }
  };

  return { copyLink };
};

/**
 * Combined hook that provides all affiliate functionality
 */
export const useAffiliate = (referralsParams = {}) => {
  const dashboard = useAffiliateDashboard();
  const referrals = useAffiliateReferrals(referralsParams);
  const stats = useAffiliateStats();
  const becomeAffiliate = useBecomeAffiliate();
  const deactivateAffiliate = useDeactivateAffiliate();
  const { copyLink } = useCopyReferralLink();

  // Determine if user is an affiliate based on dashboard data
  const isAffiliate = dashboard.data?.success && dashboard.data?.affiliate;
  
  // Check if any query is loading
  const isLoading = dashboard.isLoading || referrals.isLoading || stats.isLoading;
  
  // Check if any query has an error
  const hasError = dashboard.error || referrals.error || stats.error;

  return {
    // Data
    dashboard: dashboard.data,
    referrals: referrals.data,
    stats: stats.data,
    
    // State
    isAffiliate,
    isLoading,
    hasError,
    
    // Individual loading states
    isDashboardLoading: dashboard.isLoading,
    isReferralsLoading: referrals.isLoading,
    isStatsLoading: stats.isLoading,
    
    // Individual error states
    dashboardError: dashboard.error,
    referralsError: referrals.error,
    statsError: stats.error,
    
    // Actions
    becomeAffiliate: becomeAffiliate.mutate,
    deactivateAffiliate: deactivateAffiliate.mutate,
    copyReferralLink: copyLink,
    
    // Action states
    isBecomingAffiliate: becomeAffiliate.isPending,
    isDeactivating: deactivateAffiliate.isPending,
    
    // Refetch functions
    refetchDashboard: dashboard.refetch,
    refetchReferrals: referrals.refetch,
    refetchStats: stats.refetch,
    
    // Utility functions
    formatCurrency: affiliateService.formatCurrency,
    formatPercentage: affiliateService.formatPercentage,
    formatDate: affiliateService.formatDate,
    getStatusColor: affiliateService.getStatusColor,
    getStatusText: affiliateService.getStatusText
  };
};