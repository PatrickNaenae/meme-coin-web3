"use client";

import { useState } from "react";

// Components
import Header from "./components/Header";
import List from "./components/List";
import Token from "./components/Token";
import Trade from "./components/Trade";

// ABIs & Config

import { useBlockchain } from "../context/BlockchainProvider";

interface TokenData {
  token: string;
  name: string;
  creator: string;
  sold: bigint;
  raised: bigint;
  isOpen: boolean;
  image: string;
}

export default function Home() {
  const { provider, account, factory, fee, tokens, setAccount } =
    useBlockchain();
  const [token, setToken] = useState<TokenData | null>(null);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [showTrade, setShowTrade] = useState<boolean>(false);

  function toggleCreate(): void {
    setShowCreate(!showCreate);
  }

  function toggleTrade(token: TokenData): void {
    setToken(token);
    setShowTrade(!showTrade);
  }

  return (
    <div className="page">
      <Header account={account as string} setAccount={setAccount} />

      <main>
        <div className="create">
          <button
            onClick={factory && account ? toggleCreate : undefined}
            className="btn--fancy"
            disabled={!factory || !account}
          >
            {!factory
              ? "[ contract not deployed ]"
              : !account
              ? "[ please connect ]"
              : "[ start a new token ]"}
          </button>
        </div>

        <div className="listings">
          <h1>new listings</h1>

          <div className="tokens">
            {!account ? (
              <p>please connect wallet</p>
            ) : tokens.length === 0 ? (
              <p>No tokens listed</p>
            ) : (
              tokens.map((token, index) => (
                <Token
                  toggleTrade={() => toggleTrade(token)}
                  token={token}
                  key={index}
                />
              ))
            )}
          </div>
        </div>

        {showCreate && provider && factory && (
          <List toggleCreate={toggleCreate} />
        )}

        {showTrade && token && provider && factory && (
          <Trade toggleTrade={() => toggleTrade(token)} token={token} />
        )}
      </main>
    </div>
  );
}
