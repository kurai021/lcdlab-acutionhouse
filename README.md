# Getting Started with Create React App

    <!-- SPL Token Auction House -->

    ts-node auction-house-cli.ts create_auction_house -e mainnet-beta -k ~/.config/solana/stonheads.json -tm 2sotku8LjU4myPUqFzsYE8NQvT3p25NtgNM7bhNeBgSu -sfbp 0 -ccsp true -rso true
    ts-node auction-house-cli.ts deposit -e mainnet-beta -ah JDtW36AVm1XJtLWqEr7gsb5mU7EYXSScsEHf23wzJBYr -k ~/.config/solana/stonheads.json -a 0.25

    wallet public key: FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K
    Using cluster mainnet-beta
    No treasury withdrawal dest detected, using keypair
    No fee withdrawal dest detected, using keypair
    Created auction house JDtW36AVm1XJtLWqEr7gsb5mU7EYXSScsEHf23wzJBYr

    <!-- SOL Auction House  -->

    ts-node auction-house-cli.ts create_auction_house -e mainnet-beta -k ~/.config/solana/stonheads.json -sfbp 0 -ccsp true -rso true
    ts-node auction-house-cli.ts deposit -e mainnet-beta -ah FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c -k ~/.config/solana/stonheads.json -a 0.25

    wallet public key: FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K
    Using cluster mainnet-beta
    No treasury withdrawal dest detected, using keypair
    No fee withdrawal dest detected, using keypair
    No treasury mint detected, using SOL.
    Created auction house FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c


    <!-- TEST AUCTION -->

    ts-node auction-house-cli.ts sell -e mainnet-beta -k ~/.config/solana/staking.json -ah FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c -ak ~/.config/solana/stonheads.json --buy-price 1 --mint BmbaYqmZ4p5aFL2DytKEZfj96qNAWDEVLuvVEec4itJU --token-size 1

    wallet public key: stakesVTTcLyZozxBmixmNZwuG4ahr1MzLoQoykPWYD
    wallet public key: FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K
    Using cluster mainnet-beta
    Set 1 BmbaYqmZ4p5aFL2DytKEZfj96qNAWDEVLuvVEec4itJU for sale for 1 from your account with Auction House FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c

    <!-- SHOW INFO -->

    ts-node auction-house-cli.ts show -e mainnet-beta -k ~/.config/solana/stonheads.json -ah FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c


    <!-- Make a "Buy" action on the auction -->

    ts-node auction-house-cli.ts buy -e mainnet-beta -k ~/.config/solana/stonheads.json -ak ~/.config/solana/stonheads.json -ah FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c --buy-price 1 --token-size 1 --mint BmbaYqmZ4p5aFL2DytKEZfj96qNAWDEVLuvVEec4itJU

    wallet public key: FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K
    wallet public key: FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K
    Using cluster mainnet-beta
    Made offer for  1


    <!-- Execute sale of NFT -->

    ts-node auction-house-cli.ts execute_sale -e mainnet-beta -k ~/.config/solana/stonheads.json -ah FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c -ak ~/.config/solana/stonheads.json --buy-price 1 --mint BmbaYqmZ4p5aFL2DytKEZfj96qNAWDEVLuvVEec4itJU --buyer-wallet FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K --seller-wallet stakesVTTcLyZozxBmixmNZwuG4ahr1MzLoQoykPWYD --token-size 1

    Accepted 1 BmbaYqmZ4p5aFL2DytKEZfj96qNAWDEVLuvVEec4itJU sale from wallet stakesVTTcLyZozxBmixmNZwuG4ahr1MzLoQoykPWYD to FgbN7UEZr8QXnUkz32VMkH5X4HJ6gFunaggqBe7iVF7K for 1 from your account with Auction House FwXH8GJfeL9sdvfaDBRkZknYgXds4MPGwErvDau6A13c

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
