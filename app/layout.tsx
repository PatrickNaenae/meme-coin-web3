import { Nabla } from "next/font/google";
import "./globals.css";
import { BlockchainProvider } from "../context/BlockchainProvider";

const nabla = Nabla({ subsets: ["latin"] });

export const metadata = {
  title: "fun.pump",
  description: "create token listings",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={nabla.className}>
        <BlockchainProvider>{children}</BlockchainProvider>
      </body>
    </html>
  );
};

export default RootLayout;
