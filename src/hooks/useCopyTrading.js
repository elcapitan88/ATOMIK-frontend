import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { copyTradingApi } from '@/services/api/copyTradingApi';

const COPY_TRADING_KEYS = {
  all: ['copyGroups'],
};

export function useCopyTrading() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch all copy groups
  const { data: copyGroups = [], isLoading } = useQuery({
    queryKey: COPY_TRADING_KEYS.all,
    queryFn: async () => {
      const resp = await copyTradingApi.getGroups();
      return resp.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
  });

  // Derived state
  const activeCopyGroups = useMemo(
    () => copyGroups.filter((g) => g.status === 'active'),
    [copyGroups]
  );

  const copyLeaderAccountIds = useMemo(
    () => new Set(activeCopyGroups.map((g) => String(g.leader_account_id))),
    [activeCopyGroups]
  );

  const copyFollowerAccountIds = useMemo(
    () =>
      new Set(
        activeCopyGroups.flatMap((g) =>
          g.followers.filter((f) => f.is_active).map((f) => String(f.follower_account_id))
        )
      ),
    [activeCopyGroups]
  );

  // Map follower_account_id -> info
  const followerInfo = useMemo(() => {
    const map = {};
    activeCopyGroups.forEach((g) => {
      g.followers.forEach((f) => {
        if (f.is_active) {
          map[String(f.follower_account_id)] = {
            leaderAccountId: g.leader_account_id,
            leaderName: g.leader_account_name || g.name,
            ratio: f.ratio,
            groupId: g.id,
            followerId: f.id,
          };
        }
      });
    });
    return map;
  }, [activeCopyGroups]);

  // Map leader_account_id -> info
  const leaderInfo = useMemo(() => {
    const map = {};
    activeCopyGroups.forEach((g) => {
      map[String(g.leader_account_id)] = {
        groupId: g.id,
        name: g.name,
        followerCount: g.followers.filter((f) => f.is_active).length,
      };
    });
    return map;
  }, [activeCopyGroups]);

  // Helper: get copy mode for an account
  const getAccountCopyMode = (accountId) => {
    const id = String(accountId);
    if (copyLeaderAccountIds.has(id)) return 'copy-leader';
    if (copyFollowerAccountIds.has(id)) return 'copy-follower';
    return null;
  };

  // Helper: get full copy info for an account (leader or follower)
  const getCopyInfo = (accountId) => {
    const id = String(accountId);
    if (leaderInfo[id]) return { mode: 'copy-leader', ...leaderInfo[id] };
    if (followerInfo[id]) return { mode: 'copy-follower', ...followerInfo[id] };
    return null;
  };

  // Find group for a given account (leader or follower)
  const getGroupForAccount = (accountId) => {
    const id = String(accountId);
    return copyGroups.find(
      (g) =>
        String(g.leader_account_id) === id ||
        g.followers.some((f) => String(f.follower_account_id) === id)
    );
  };

  // Mutations
  const createGroup = useMutation({
    mutationFn: async (data) => {
      const resp = await copyTradingApi.createGroup(data);
      // Auto-activate after creation
      await copyTradingApi.activateGroup(resp.data.id);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(COPY_TRADING_KEYS.all);
      toast({
        title: 'Copy Trading Started',
        description: 'Trades will now be copied to follower accounts.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Start Copy Trading',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (groupId) => copyTradingApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(COPY_TRADING_KEYS.all);
      toast({
        title: 'Copy Trading Stopped',
        description: 'Copy group has been removed.',
        status: 'info',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Stop Copy Trading',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const pauseGroup = useMutation({
    mutationFn: (groupId) => copyTradingApi.pauseGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(COPY_TRADING_KEYS.all);
      toast({
        title: 'Copy Trading Paused',
        status: 'info',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Pause',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const activateGroup = useMutation({
    mutationFn: (groupId) => copyTradingApi.activateGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries(COPY_TRADING_KEYS.all);
      toast({
        title: 'Copy Trading Resumed',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Resume',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }) => copyTradingApi.updateGroup(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(COPY_TRADING_KEYS.all);
      toast({
        title: 'Copy Group Updated',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Group',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const updateFollowerMutation = useMutation({
    mutationFn: ({ groupId, followerId, data }) =>
      copyTradingApi.updateFollower(groupId, followerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(COPY_TRADING_KEYS.all);
      toast({
        title: 'Follower Updated',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Follower',
        description: error.response?.data?.detail || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    },
  });

  return {
    // Data
    copyGroups,
    activeCopyGroups,
    isLoading,

    // Derived sets/maps
    copyLeaderAccountIds,
    copyFollowerAccountIds,
    followerInfo,
    leaderInfo,

    // Helpers
    getAccountCopyMode,
    getCopyInfo,
    getGroupForAccount,

    // Mutations
    createGroup,
    deleteGroup,
    pauseGroup,
    activateGroup,
    updateGroup: updateGroupMutation,
    updateFollower: updateFollowerMutation,
  };
}

export default useCopyTrading;
