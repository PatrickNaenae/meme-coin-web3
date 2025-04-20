import { useEffect, useState } from "react";
import { ethers, BrowserProvider } from "ethers";
import type { Factory } from "../../typechain-types";

interface TradeProps {
  toggleTrade: () => void;
  token: {
    token: string;
    name: string;
    creator: string;
    sold: bigint;
    raised: bigint;
    isOpen: boolean;
    image: string;
  };
  provider: BrowserProvider;
  factory: Factory;
}

function Trade({ toggleTrade, token, provider, factory }: TradeProps) {
  const [target, setTarget] = useState<bigint>(0n);
  const [limit, setLimit] = useState<bigint>(0n);
  const [cost, setCost] = useState<bigint>(0n);

  async function buyHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const amount = formData.get("amount") as string;

    try {
      const cost = await factory.getCost(token.sold);
      const totalCost = cost * BigInt(amount);

      const signer = await provider.getSigner();

      const transaction = await factory
        .connect(signer)
        .buy(token.token, ethers.parseUnits(amount, 18), { value: totalCost });
      await transaction.wait();

      toggleTrade();
    } catch (error) {
      console.error("Transaction failed:", error);
      // You might want to add error state handling here
    }
  }

  async function getSaleDetails() {
    try {
      const target = await factory.TARGET();
      setTarget(target);

      const limit = await factory.TOKEN_LIMIT();
      setLimit(limit);

      const cost = await factory.getCost(token.sold);
      setCost(cost);
    } catch (error) {
      console.error("Failed to fetch sale details:", error);
    }
  }

  useEffect(() => {
    getSaleDetails();
  }, []);

  return (
    <div className="trade">
      <h2>trade</h2>

      <div className="token__details">
        <p className="name">{token.name}</p>
        <p>
          creator:{" "}
          {token.creator.slice(0, 6) + "..." + token.creator.slice(38, 42)}
        </p>
        <img src={token.image} alt={token.name} width={256} height={256} />
        <p>marketcap: {ethers.formatUnits(token.raised, 18)} ETH</p>
        <p>base cost: {ethers.formatUnits(cost, 18)} ETH</p>
      </div>

      {token.sold >= limit || token.raised >= target ? (
        <p className="disclaimer">target reached!</p>
      ) : (
        <form onSubmit={buyHandler}>
          <input
            type="number"
            name="amount"
            min={1}
            max={10000}
            placeholder="1"
            required
          />
          <button type="submit">[ buy ]</button>
        </form>
      )}

      <button onClick={toggleTrade} className="btn--fancy">
        [ cancel ]
      </button>
    </div>
  );
}

export default Trade;
