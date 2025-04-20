import { ethers, BrowserProvider } from "ethers";
import type { Factory } from "../../typechain-types";

function List({
  toggleCreate,
  fee,
  provider,
  factory,
}: {
  toggleCreate: () => void;
  fee: bigint;
  provider: BrowserProvider;
  factory: Factory;
}) {
  async function listHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const ticker = formData.get("ticker") as string;

    const signer = await provider.getSigner();

    const transaction = await factory
      .connect(signer)
      .create(name, ticker, { value: fee });
    await transaction.wait();

    toggleCreate();
  }

  return (
    <div className="list">
      <h2>list new token</h2>

      <div className="list__description">
        <p>fee: {ethers.formatUnits(fee, 18)} ETH</p>
      </div>

      <form onSubmit={listHandler}>
        <input type="text" name="name" placeholder="name" required />
        <input type="text" name="ticker" placeholder="ticker" required />
        <button type="submit">[ list ]</button>
      </form>

      <button onClick={toggleCreate} className="btn--fancy">
        [ cancel ]
      </button>
    </div>
  );
}

export default List;
