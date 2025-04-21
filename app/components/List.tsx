import { ethers } from "ethers";
import { useBlockchain } from "../../context/BlockchainProvider";

function List({ toggleCreate }: { toggleCreate: () => void }) {
  const contextValue = useBlockchain();
  if (!contextValue) {
    console.log("Context not found");
    return null;
  }

  const { provider, factory, fee } = contextValue;
  async function listHandler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const ticker = formData.get("ticker") as string;

    const signer = await provider?.getSigner();

    const transaction = await factory
      ?.connect(signer)
      .create(name, ticker, { value: fee });
    await transaction?.wait();

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
