export type PaymentRecoveryLookupSource =
  | "existing-state"
  | "order-code"
  | "query-transaction-code"
  | "callback-checkout-token"
  | "pending-checkout-token"
  | "pending-transaction-code"
  | "session-recovery"
  | "purpose-recovery"
  | "latest-user-recovery"
  | "none";

export type CancelTransactionCodeSource =
  | "query-transaction-code"
  | "context-transaction-code"
  | "pending-transaction-code"
  | "order-code-fallback"
  | "none";

export interface ResolveCancelTransactionCodeInput {
  queryTransactionCode?: string;
  contextTransactionCode?: string;
  pendingTransactionCode?: string;
  orderCode?: string;
  callbackCheckoutToken?: string;
  status?: string;
  cancelFlag?: string | boolean | null;
}

export interface ResolvedCancelTransactionCode {
  value: string;
  source: CancelTransactionCodeSource;
  usedOrderCodeFallback: boolean;
}

export interface CallbackIdentifierInput {
  orderCode?: string;
  transactionCode?: string;
  checkoutToken?: string;
}

export interface CallbackIdentifierMismatch {
  hasMismatch: boolean;
  mismatchedKeys: Array<"orderCode" | "transactionCode" | "checkoutToken">;
}

const asTrimmedString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

const isCancelStatus = (status?: string): boolean => {
  const normalized = asTrimmedString(status).toUpperCase();
  return (
    normalized === "CANCELLED" ||
    normalized === "CANCELED" ||
    normalized === "CANCEL" ||
    normalized === "FAILED"
  );
};

const isTruthyFlag = (value: string | boolean | null | undefined): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = asTrimmedString(value).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "y";
};

export const isCancelCallbackSignal = (params: {
  callbackCheckoutToken?: string;
  status?: string;
  cancelFlag?: string | boolean | null;
}): boolean => {
  const checkoutToken = asTrimmedString(params.callbackCheckoutToken);
  if (checkoutToken) {
    return true;
  }

  if (isCancelStatus(params.status)) {
    return true;
  }

  return isTruthyFlag(params.cancelFlag);
};

export const shouldUseOrderCodeAsTransactionCode = (
  input: ResolveCancelTransactionCodeInput
): boolean => {
  const hasKnownTransactionCode =
    asTrimmedString(input.queryTransactionCode) ||
    asTrimmedString(input.contextTransactionCode) ||
    asTrimmedString(input.pendingTransactionCode);

  if (hasKnownTransactionCode) {
    return false;
  }

  const orderCode = asTrimmedString(input.orderCode);
  if (!orderCode) {
    return false;
  }

  return isCancelCallbackSignal({
    callbackCheckoutToken: input.callbackCheckoutToken,
    status: input.status,
    cancelFlag: input.cancelFlag,
  });
};

export const resolveCancelTransactionCode = (
  input: ResolveCancelTransactionCodeInput
): ResolvedCancelTransactionCode => {
  const queryTransactionCode = asTrimmedString(input.queryTransactionCode);
  if (queryTransactionCode) {
    return {
      value: queryTransactionCode,
      source: "query-transaction-code",
      usedOrderCodeFallback: false,
    };
  }

  const contextTransactionCode = asTrimmedString(input.contextTransactionCode);
  if (contextTransactionCode) {
    return {
      value: contextTransactionCode,
      source: "context-transaction-code",
      usedOrderCodeFallback: false,
    };
  }

  const pendingTransactionCode = asTrimmedString(input.pendingTransactionCode);
  if (pendingTransactionCode) {
    return {
      value: pendingTransactionCode,
      source: "pending-transaction-code",
      usedOrderCodeFallback: false,
    };
  }

  if (shouldUseOrderCodeAsTransactionCode(input)) {
    return {
      value: asTrimmedString(input.orderCode),
      source: "order-code-fallback",
      usedOrderCodeFallback: true,
    };
  }

  return {
    value: "",
    source: "none",
    usedOrderCodeFallback: false,
  };
};

export const getCallbackIdentifierMismatch = (
  callback: CallbackIdentifierInput,
  context: CallbackIdentifierInput | null
): CallbackIdentifierMismatch => {
  if (!context) {
    return {
      hasMismatch: false,
      mismatchedKeys: [],
    };
  }

  const callbackOrderCode = asTrimmedString(callback.orderCode);
  const callbackTransactionCode = asTrimmedString(callback.transactionCode);
  const callbackCheckoutToken = asTrimmedString(callback.checkoutToken);

  const contextOrderCode = asTrimmedString(context.orderCode);
  const contextTransactionCode = asTrimmedString(context.transactionCode);
  const contextCheckoutToken = asTrimmedString(context.checkoutToken);

  const mismatchedKeys: Array<"orderCode" | "transactionCode" | "checkoutToken"> = [];

  if (callbackOrderCode && contextOrderCode && callbackOrderCode !== contextOrderCode) {
    mismatchedKeys.push("orderCode");
  }

  if (
    callbackTransactionCode &&
    contextTransactionCode &&
    callbackTransactionCode !== contextTransactionCode
  ) {
    mismatchedKeys.push("transactionCode");
  }

  if (
    callbackCheckoutToken &&
    contextCheckoutToken &&
    callbackCheckoutToken !== contextCheckoutToken
  ) {
    mismatchedKeys.push("checkoutToken");
  }

  return {
    hasMismatch: mismatchedKeys.length > 0,
    mismatchedKeys,
  };
};

export const isLowConfidenceRecoverySource = (source: PaymentRecoveryLookupSource): boolean => {
  return source === "latest-user-recovery";
};
