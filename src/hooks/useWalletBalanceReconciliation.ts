import { useCallback } from "react";

import type { User } from "@/interfaces";
import { reconcileWalletBalance, type WalletBalanceResolution } from "@/lib";
import { transactionManager, usersAdminManager } from "@/services";
import { useAuthStore } from "@/stores/authStore";

type WalletRefreshResult = WalletBalanceResolution & {
  userData?: User;
};

const toValidUserId = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.trunc(parsed);
    }
  }

  return undefined;
};

export const useWalletBalanceReconciliation = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const refreshWalletBalance = useCallback(
    async (inputUserId?: number): Promise<WalletRefreshResult> => {
      const resolvedUserId = toValidUserId(inputUserId ?? user?.id);
      const authStoreBalance =
        typeof user?.walletBalance === "number" && Number.isFinite(user.walletBalance)
          ? user.walletBalance
          : undefined;

      if (!resolvedUserId) {
        return {
          source: "unavailable",
          authStoreBalance,
          hasMismatch: false,
        };
      }

      let userResponse: Awaited<ReturnType<typeof usersAdminManager.getById>>;
      let transactionResponse: Awaited<ReturnType<typeof transactionManager.getByUserId>>;

      try {
        [userResponse, transactionResponse] = await Promise.all([
          usersAdminManager.getById(resolvedUserId),
          transactionManager.getByUserId(resolvedUserId),
        ]);
      } catch (error) {
        console.warn("Wallet refresh failed", {
          userId: resolvedUserId,
          error,
        });

        return {
          source: typeof authStoreBalance === "number" ? "auth-store" : "unavailable",
          walletBalance: authStoreBalance,
          userDetailBalance: undefined,
          transactionBalance: undefined,
          authStoreBalance,
          hasMismatch: false,
        };
      }

      const userData = userResponse.success && userResponse.data ? userResponse.data : undefined;
      const resolution = reconcileWalletBalance({
        userDetailBalance:
          userData && typeof userData.walletBalance === "number"
            ? userData.walletBalance
            : undefined,
        transactions: transactionResponse.success ? transactionResponse.data : undefined,
        authStoreBalance,
      });

      if (resolution.hasMismatch) {
        console.warn("Wallet balance mismatch detected", {
          userId: resolvedUserId,
          source: resolution.source,
          userDetailBalance: resolution.userDetailBalance,
          transactionBalance: resolution.transactionBalance,
          authStoreBalance: resolution.authStoreBalance,
        });
      }

      if (user && typeof resolution.walletBalance === "number") {
        if (user.walletBalance !== resolution.walletBalance) {
          setUser({
            ...user,
            walletBalance: resolution.walletBalance,
          });
        }
      } else if (!user && userData) {
        const hydratedUser = {
          ...(userData as User),
          ...(typeof resolution.walletBalance === "number"
            ? { walletBalance: resolution.walletBalance }
            : {}),
        };
        setUser({
          ...hydratedUser,
        });
      }

      return {
        ...resolution,
        userData,
      };
    },
    [setUser, user]
  );

  return {
    refreshWalletBalance,
  };
};
