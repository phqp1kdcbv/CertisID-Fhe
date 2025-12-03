import { toast } from "sonner";
import { ExternalLink, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io/tx";

/**
 * Show transaction pending toast with hash link
 */
export const toastTxPending = (hash: `0x${string}`, message?: string) => {
  toast.loading(
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{message || "Transaction submitted"}</span>
      </div>
      <a
        href={`${SEPOLIA_EXPLORER}/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View on Etherscan
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>,
    {
      id: hash,
      duration: Infinity
    }
  );
};

/**
 * Show transaction success toast with hash link
 */
export const toastTxSuccess = (hash: `0x${string}`, message: string) => {
  toast.success(
    <div className="flex flex-col gap-1">
      <div className="font-semibold">{message}</div>
      <a
        href={`${SEPOLIA_EXPLORER}/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View on Etherscan
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>,
    {
      id: hash,
      duration: 5000
    }
  );
};

/**
 * Show transaction error toast with optional hash link
 */
export const toastTxError = (hash: `0x${string}` | undefined, error: Error | string) => {
  const errorMessage = typeof error === "string" ? error : (error.message || "Transaction failed");

  // Extract a user-friendly message
  let displayMessage = errorMessage;
  if (errorMessage.includes("execution reverted")) {
    const match = errorMessage.match(/reason="([^"]+)"/);
    displayMessage = match ? match[1] : "Transaction reverted";
  } else if (errorMessage.length > 100) {
    displayMessage = errorMessage.substring(0, 100) + "...";
  }

  toast.error(
    <div className="flex flex-col gap-1">
      <div className="font-semibold">Transaction Failed</div>
      <div className="text-sm text-muted-foreground">{displayMessage}</div>
      {hash && (
        <a
          href={`${SEPOLIA_EXPLORER}/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View on Etherscan
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>,
    {
      id: hash || `error-${Date.now()}`,
      duration: 7000
    }
  );
};

/**
 * Show user rejected transaction toast
 */
export const toastUserRejected = () => {
  toast.error(
    <div className="flex items-center gap-2">
      <AlertTriangle className="h-4 w-4" />
      <span>Transaction rejected by user</span>
    </div>,
    {
      duration: 3000
    }
  );
};

/**
 * Show info toast for encryption/processing status
 */
export const toastInfo = (message: string) => {
  toast.info(message, {
    duration: 3000
  });
};

/**
 * Show loading toast for long operations
 */
export const toastLoading = (message: string, id?: string) => {
  return toast.loading(
    <div className="flex items-center gap-2">
      <span>{message}</span>
    </div>,
    {
      id: id || `loading-${Date.now()}`,
      duration: Infinity
    }
  );
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (id: string) => {
  toast.dismiss(id);
};

/**
 * Check if error is a user rejection
 */
export const isUserRejectedError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || "";
  return (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("rejected the request") ||
    error?.code === 4001 ||
    error?.code === "ACTION_REJECTED"
  );
};

/**
 * Show appropriate toast based on error type
 */
export const handleTxError = (hash: `0x${string}` | undefined, error: any) => {
  if (isUserRejectedError(error)) {
    toastUserRejected();
  } else {
    toastTxError(hash, error);
  }
};
