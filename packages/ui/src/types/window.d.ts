export {};

declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{
        address: string;
        publicKey: string;
      }>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      account: () => Promise<{
        address: string;
        publicKey: string;
      }>;
      signMessage: (payload: {
        message: string;
        nonce: string;
      }) => Promise<{
        signature: string;
        fullMessage: string;
      }>;
      signTransaction: (transaction: any) => Promise<Uint8Array>;
      signAndSubmitTransaction: (transaction: any) => Promise<{
        hash: string;
      }>;
      network: () => Promise<{
        name: string;
        chainId: string;
      }>;
      onAccountChange: (callback: (account: any) => void) => void;
      onNetworkChange: (callback: (network: any) => void) => void;
    };
  }
}
