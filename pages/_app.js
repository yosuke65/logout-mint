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
      // chains.binanceSmartChain,
      chains.binanceSmartChainTestnet,
    ],
    providers: [
      providers.walletConnectProvider({
        projectId: "c844211fea2ca447b59e0bee2e26d06e",
      }),
    ],
    autoConnect: false,
  },
  projectId: "c844211fea2ca447b59e0bee2e26d06e",
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
