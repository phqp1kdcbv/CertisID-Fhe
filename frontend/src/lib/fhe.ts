import { bytesToHex, getAddress, keccak256, stringToBytes } from "viem";
import type { Address } from "viem";

declare global {
    interface Window {
        RelayerSDK?: any;
        relayerSDK?: any;
        ethereum?: any;
        okxwallet?: any;
    }
}

let fheInstance: any = null;

const getSDK = () => {
    if (typeof window === "undefined") {
        throw new Error("FHE SDK requires a browser environment");
    }
    const sdk = window.RelayerSDK || window.relayerSDK;
    if (!sdk) {
        throw new Error("Relayer SDK not loaded. Ensure the CDN script tag is present.");
    }
    return sdk;
};

export const initializeFHE = async (provider?: any) => {
    if (fheInstance) return fheInstance;
    if (typeof window === "undefined") {
        throw new Error("FHE SDK requires a browser environment");
    }

    const ethereumProvider =
        provider || window.ethereum || window.okxwallet?.provider || window.okxwallet;
    if (!ethereumProvider) {
        throw new Error("No wallet provider detected. Connect a wallet first.");
    }

    const sdk = getSDK();
    const { initSDK, createInstance, SepoliaConfig } = sdk;
    await initSDK();
    const config = { ...SepoliaConfig, network: ethereumProvider };
    fheInstance = await createInstance(config);
    return fheInstance;
};

const getInstance = async (provider?: any) => {
    if (fheInstance) return fheInstance;
    return initializeFHE(provider);
};

/**
 * Encrypt a uint8 value for identity fields
 * @param contractAddress - The contract address
 * @param userAddress - The user's wallet address
 * @param value - The value to encrypt (0-255)
 * @param provider - Optional ethereum provider
 */
export const encryptUint8 = async (
    value: number,
    contractAddress: string,
    userAddress: string,
    provider?: any
): Promise<{
    handle: `0x${string}`;
    proof: `0x${string}`;
}> => {
    if (value < 0 || value > 255) {
        throw new Error("Value out of range for uint8 encryption");
    }

    console.log('[FHE] Encrypting uint8:', value);
    const instance = await getInstance(provider);
    const contractAddr = getAddress(contractAddress as Address);
    const userAddr = getAddress(userAddress as Address);

    const input = instance.createEncryptedInput(contractAddr, userAddr);
    input.add8(value);

    console.log('[FHE] Encrypting input...');
    const { handles, inputProof } = await input.encrypt();
    console.log('[FHE] Encryption complete');

    if (handles.length < 1) {
        throw new Error('FHE SDK returned insufficient handles');
    }

    return {
        handle: bytesToHex(handles[0]) as `0x${string}`,
        proof: bytesToHex(inputProof) as `0x${string}`,
    };
};

/**
 * Encrypt a uint16 value for identity fields (e.g., country code)
 * @param contractAddress - The contract address
 * @param userAddress - The user's wallet address
 * @param value - The value to encrypt (0-65535)
 * @param provider - Optional ethereum provider
 */
export const encryptUint16 = async (
    value: number,
    contractAddress: string,
    userAddress: string,
    provider?: any
): Promise<{
    handle: `0x${string}`;
    proof: `0x${string}`;
}> => {
    if (value < 0 || value > 65535) {
        throw new Error("Value out of range for uint16 encryption");
    }

    console.log('[FHE] Encrypting uint16:', value);
    const instance = await getInstance(provider);
    const contractAddr = getAddress(contractAddress as Address);
    const userAddr = getAddress(userAddress as Address);

    const input = instance.createEncryptedInput(contractAddr, userAddr);
    input.add16(value);

    console.log('[FHE] Encrypting input...');
    const { handles, inputProof } = await input.encrypt();
    console.log('[FHE] Encryption complete');

    if (handles.length < 1) {
        throw new Error('FHE SDK returned insufficient handles');
    }

    return {
        handle: bytesToHex(handles[0]) as `0x${string}`,
        proof: bytesToHex(inputProof) as `0x${string}`,
    };
};

/**
 * Encrypt a uint32 value for identity fields (e.g., hash values)
 * @param contractAddress - The contract address
 * @param userAddress - The user's wallet address
 * @param value - The value to encrypt
 * @param provider - Optional ethereum provider
 */
export const encryptUint32 = async (
    value: number,
    contractAddress: string,
    userAddress: string,
    provider?: any
): Promise<{
    handle: `0x${string}`;
    proof: `0x${string}`;
}> => {
    console.log('[FHE] Encrypting uint32:', value);
    const instance = await getInstance(provider);
    const contractAddr = getAddress(contractAddress as Address);
    const userAddr = getAddress(userAddress as Address);

    const input = instance.createEncryptedInput(contractAddr, userAddr);
    input.add32(value);

    console.log('[FHE] Encrypting input...');
    const { handles, inputProof } = await input.encrypt();
    console.log('[FHE] Encryption complete');

    if (handles.length < 1) {
        throw new Error('FHE SDK returned insufficient handles');
    }

    return {
        handle: bytesToHex(handles[0]) as `0x${string}`,
        proof: bytesToHex(inputProof) as `0x${string}`,
    };
};

/**
 * Hash a string to a uint32 value for encryption
 * @param value - The string to hash
 */
export const hashString = (value: string): number => {
    const hash = keccak256(stringToBytes(value));
    const hashBigInt = BigInt(hash);
    return Number(hashBigInt & BigInt(0xffffffff));
};

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date string in ISO format
 */
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

/**
 * Check if FHE SDK is loaded and ready
 */
export const isFHEReady = (): boolean => {
    if (typeof window === "undefined") return false;
    return !!(window.RelayerSDK || window.relayerSDK);
};

/**
 * Check if FHE instance is initialized
 */
export const isFheReady = (): boolean => {
    return fheInstance !== null;
};

export const isSDKLoaded = isFHEReady;

/**
 * Wait for FHE SDK to be loaded (with timeout)
 */
export const waitForFHE = async (timeoutMs: number = 10000): Promise<boolean> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        if (isFHEReady()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
};

/**
 * Get FHE status for debugging
 */
export const getFHEStatus = (): {
    sdkLoaded: boolean;
    instanceReady: boolean;
} => {
    return {
        sdkLoaded: isFHEReady(),
        instanceReady: fheInstance !== null,
    };
};

// Backwards compatibility alias
export const initFhevm = initializeFHE;
