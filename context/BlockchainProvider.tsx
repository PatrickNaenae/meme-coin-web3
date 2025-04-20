"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers, BrowserProvider, Network } from "ethers";
import { Factory__factory, Factory } from "../typechain-types";
import config from "../app/config.json";
import images from "../app/images.json";

// Custom hook to detect client-side rendering
function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
}

interface TokenData {
  token: string;
  name: string;
  creator: string;
  sold: bigint;
  raised: bigint;
  isOpen: boolean;
  image: string;
}

interface Config {
  [chainId: string]: {
    factory: {
      address: string;
    };
  };
}

interface BlockchainContextType {
  provider: BrowserProvider | null;
  account: string | null;
  setAccount: (account: string | null) => void;
  factory: Factory | null;
  fee: bigint;
  tokens: TokenData[];
  reloadTokens: () => void;
  isClient: boolean;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(
  undefined
);

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context)
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  return context;
};

export const BlockchainProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isClient = useIsClient();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [factory, setFactory] = useState<Factory | null>(null);
  const [fee, setFee] = useState<bigint>(0n);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBlockchainData = async () => {
    if (!isClient || !window.ethereum) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const _provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(_provider);

      const signer = await _provider.getSigner();
      const currentAccount = await signer.getAddress();
      setAccount(currentAccount);

      const network: Network = await _provider.getNetwork();
      const chainId = network.chainId.toString();

      // Add validation for config structure
      if (!(config as Config)[chainId]?.factory?.address) {
        throw new Error(`No factory address configured for chain ${chainId}`);
      }

      const factoryAddress = (config as Config)[chainId].factory.address;
      const factory = Factory__factory.connect(factoryAddress, _provider);
      setFactory(factory);

      const fee = await factory.fee();
      setFee(fee);

      const totalTokens = await factory.totalTokens();
      const loadedTokens: TokenData[] = [];

      const limit = Math.min(Number(totalTokens), 6);
      for (let i = 0; i < limit; i++) {
        const tokenSale = await factory.getTokenSale(i);
        loadedTokens.push({
          token: tokenSale.token,
          name: tokenSale.name,
          creator: tokenSale.creator,
          sold: tokenSale.sold,
          raised: tokenSale.raised,
          isOpen: tokenSale.isOpen,
          image: images[i],
        });
      }

      setTokens(loadedTokens.reverse());
    } catch (error) {
      console.error("Error loading blockchain data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, [isClient]);

  return (
    <BlockchainContext.Provider
      value={{
        provider,
        account,
        factory,
        fee,
        tokens,
        setAccount,
        reloadTokens: loadBlockchainData,
        isClient,
      }}
    >
      {isLoading ? (
        <div className="loading-indicator">Loading blockchain data...</div>
      ) : (
        children
      )}
    </BlockchainContext.Provider>
  );
};
