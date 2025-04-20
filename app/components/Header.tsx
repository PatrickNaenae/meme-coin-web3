import { Eip1193Provider, ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

const { ethereum } = window;

function Header({
  account,
  setAccount,
}: {
  account: string;
  setAccount: (account: string) => void;
}) {
  async function connectHandler() {
    try {
      if (!ethereum) return alert("Please install MetaMask.");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = ethers.getAddress(accounts[0]);
      setAccount(account);
      window.location.reload();
    } catch (error) {
      console.log(error);
      throw new Error("No ethereum object");
    }
  }

  return (
    <header>
      <p className="brand">fun.pump</p>

      {account ? (
        <button onClick={connectHandler} className="btn--fancy">
          [ {account.slice(0, 6) + "..." + account.slice(38, 42)} ]
        </button>
      ) : (
        <button onClick={connectHandler} className="btn--fancy">
          [ connect ]
        </button>
      )}
    </header>
  );
}

export default Header;
