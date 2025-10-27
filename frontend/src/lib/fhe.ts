import { hexlify, getAddress, keccak256, toUtf8Bytes } from "ethers";

declare global {
  interface Window {
    relayerSDK?: {
      initSDK: () => Promise<void>;
      createInstance: (config: Record<string, unknown>) => Promise<any>;
      SepoliaConfig: Record<string, unknown>;
    };
    ethereum?: any;
    okxwallet?: { provider?: any };
    coinbaseWalletExtension?: any;
  }
}

const SDK_URL = "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

let fheInstance: any = null;
let fheInstancePromise: Promise<any> | null = null;
let sdkPromise: Promise<any> | null = null;

const loadSdk = async (): Promise<any> => {
  if (typeof window === "undefined") {
    throw new Error("FHE SDK requires browser environment");
  }

  if (window.relayerSDK) {
    return window.relayerSDK;
  }

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SDK_URL}"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(window.relayerSDK));
        existing.addEventListener("error", () => reject(new Error("Failed to load FHE SDK")));
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (window.relayerSDK) {
          resolve(window.relayerSDK);
        } else {
          reject(new Error("relayerSDK unavailable after load"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load FHE SDK"));
      document.body.appendChild(script);
    });
  }

  return sdkPromise;
};


const ensureHandlePayload = (result: any) => {
  const handles = result?.handles ?? (result?.handle ? [result.handle] : undefined);
  const proof = result?.inputProof ?? result?.proof;

  if (!handles?.length || !proof) {
    throw new Error("FHE encryption failed: missing handles or proof");
  }

  return { handles, proof };
};

export async function initializeFHE(provider?: any): Promise<any> {
  if (fheInstance) {
    console.log("✅ Using cached FHE instance");
    return fheInstance;
  }

  if (fheInstancePromise) {
    console.log("⏳ Waiting for existing FHE initialization...");
    return fheInstancePromise;
  }

  fheInstancePromise = (async () => {
    console.log("🔧 Starting FHE SDK initialization...");

    if (typeof window === "undefined") {
      throw new Error("FHE SDK requires browser environment");
    }

    // Get Ethereum provider from multiple sources
    const ethereumProvider = provider ||
      window.ethereum ||
      (window as any).okxwallet?.provider ||
      (window as any).okxwallet ||
      (window as any).coinbaseWalletExtension;

    if (!ethereumProvider) {
      console.error("❌ No Ethereum provider found");
      throw new Error("Ethereum provider not found. Please connect your wallet first.");
    }
    console.log("✅ Ethereum provider found");

    const sdk = await loadSdk();
    if (!sdk) {
      console.error("❌ FHE SDK not loaded");
      throw new Error("FHE SDK not available");
    }
    console.log("✅ FHE SDK loaded");

    console.log("⏳ Initializing SDK...");
    await sdk.initSDK();
    console.log("✅ SDK initialized");

    const config = {
      ...sdk.SepoliaConfig,
      network: ethereumProvider,
    };
    console.log("⏳ Creating FHE instance with config:", config);

    fheInstance = await sdk.createInstance(config);
    console.log("✅ FHE instance created successfully");
    return fheInstance;
  })();

  try {
    return await fheInstancePromise;
  } finally {
    fheInstancePromise = null;
  }
}

export const encryptUint8 = async (
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  if (value < 0 || value > 255) {
    throw new Error("Value out of range for uint8 encryption");
  }

  console.log(`🔒 Encrypting uint8: ${value}`);
  const fhe = await initializeFHE();
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  input.add8(value);

  console.log("⏳ Encrypting...");
  const result = await input.encrypt();
  const { handles, proof } = ensureHandlePayload(result);
  console.log("✅ Encrypted uint8");

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(proof),
  };
};

export const encryptUint16 = async (
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  console.log(`🔒 Encrypting uint16: ${value}`);
  const fhe = await initializeFHE();
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  input.add16(value);

  console.log("⏳ Encrypting...");
  const result = await input.encrypt();
  const { handles, proof } = ensureHandlePayload(result);
  console.log("✅ Encrypted uint16");

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(proof),
  };
};

export const encryptUint32 = async (
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ handle: string; proof: string }> => {
  console.log(`🔒 Encrypting uint32: ${value}`);
  const fhe = await initializeFHE();
  const checksumContract = getAddress(contractAddress);
  const checksumUser = getAddress(userAddress);

  const input = fhe.createEncryptedInput(checksumContract, checksumUser);
  input.add32(value);

  console.log("⏳ Encrypting...");
  const result = await input.encrypt();
  const { handles, proof } = ensureHandlePayload(result);
  console.log("✅ Encrypted uint32");

  return {
    handle: hexlify(handles[0]),
    proof: hexlify(proof),
  };
};

export const hashString = (value: string): number => {
  const hash = keccak256(toUtf8Bytes(value));
  const hashBigInt = BigInt(hash);
  return Number(hashBigInt & BigInt(0xffffffff));
};

export const calculateAge = (dateOfBirth: string): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, Math.min(255, age));
};

// Backwards compatibility alias
export const initFhevm = initializeFHE;
