import React, { FC, ReactNode, useMemo } from 'react';
import { BackpackWalletAdapter, GlowWalletAdapter, LedgerWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter, SolletWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// import { BrowserRouter, Routes, Route } from "react-router-dom";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { faSquareTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons'
import { faCompass } from '@fortawesome/free-solid-svg-icons'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { Toaster, toast } from 'react-hot-toast';

import ProgramApisProvider from '../providers/ProgramApisProvider';
import { AppProps } from 'next/app';
import { WalletError } from '@solana/wallet-adapter-base';
import RafflesStoreProvider from '../providers/RafflesStoreProvider';
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
require('@solana/wallet-adapter-react-ui/styles.css');
library.add(fas, faSquareTwitter, faDiscord, faCompass)

const App: FC<AppProps> = ({ Component, pageProps }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    // const network = WalletAdapterNetwork.Mainnet;

    // You can also provide a custom RPC endpoint.
  const endpoint =
    'https://damp-morning-brook.solana-mainnet.quiknode.pro/d79dcd6142732915a1c1f279547469aaffbdeb49/';

    const wallets = useMemo(
        () => [
            /**
             * Select the wallets you wish to support, by instantiating wallet adapters here.
             *
             * Common adapters can be found in the npm package `@solana/wallet-adapter-wallets`.
             * That package supports tree shaking and lazy loading -- only the wallets you import
             * will be compiled into your application, and only the dependencies of wallets that
             * your users connect to will be loaded.
             */
            new PhantomWalletAdapter(),
            new BackpackWalletAdapter(),
            new SolletWalletAdapter(),
            new SolflareWalletAdapter(),
            new GlowWalletAdapter(),
            new LedgerWalletAdapter(),
            new SlopeWalletAdapter(),
            new TorusWalletAdapter()
        ],
        []
    );

    const onError = React.useCallback(
        (error: WalletError) =>
            toast.error(error.message),
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect onError={onError}>
                <WalletModalProvider>
                    <ProgramApisProvider>
                        <RafflesStoreProvider>
                            <Component {...pageProps} />
                            <Toaster
                                position="bottom-left"
                                reverseOrder={false}
                                toastOptions={{
                                duration: 5000,
                                }}
                            />
                        </RafflesStoreProvider>
                    </ProgramApisProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default App;