import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { Web3Modal } from "@web3modal/react";
import { chains, providers } from "@web3modal/ethereum";
import theme from "../lib/theme";

const modalConfig = {
  theme: "dark",
  accentColor: "purple",
  ethereum: {
    appName: "Logout mint",
    chains: [
      // chains.goerli,
      // chains.binanceSmartChainTestnet,
      chains.binanceSmartChain
    ],
    providers: [
      providers.walletConnectProvider({
        projectId: process.env.WALLET_CONNECT_PROJECT_ID,
      }),
    ],
    autoConnect: false,
  },
  projectId: process.env.WALLET_CONNECT_PROJECT_ID,
};

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
      <Web3Modal config={modalConfig} />
    </ChakraProvider>
  );
}

export default MyApp;
