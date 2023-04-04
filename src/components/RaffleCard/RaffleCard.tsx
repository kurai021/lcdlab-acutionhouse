/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState} from "react";
import Container from "react-bootstrap/Container";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Image from 'react-bootstrap/Image';
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Modal from 'react-bootstrap/Modal';
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";

// import "./Card.css"
import { formatCooldown, formatTime, getAtaForMint } from "../../util/auction-house";
import { ADMIN_ACCOUNTS, getBuyerATABalance, getDisplayAmount, getWalletLamports } from "../../util/accounts";
import { buyTickets, BUY_TICKETS_TX_FEE_LAMPORTS, calculateBasketPrice } from "../../util/raffleActions/buyTickets";
import { useProgramApis } from "../../hooks/useProgramApis";
import { LCD_TOKEN, wrappedSOL } from "../../util/tokenRegistry";
import { DispenserRegistryRaw } from "../../providers/ProgramApisProvider";
import { PublicKey, SYSVAR_RECENT_BLOCKHASHES_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import { PaymentOption } from "../../util/types";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { expand } from "../../util/random";
import { collectProceeds } from "../../util/raffleActions/collectProceeds";
import { closeEntrants } from "../../util/raffleActions/closeEntrants";
import { claimPrize } from "../../util/raffleActions/claimPrize";
import { claimPrizeForThem } from "../../util/raffleActions/claimPrizeForThem";
import { toast } from "react-hot-toast";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";

const isLamportsEnough = (lamports: number | undefined) =>
  (lamports ?? 0) >= BUY_TICKETS_TX_FEE_LAMPORTS;

interface AccountBalance {
  mint: PublicKey;
  amount: u64 | undefined;
}

export default function RaffleCard({raffle}: any) {
    const [show, setShow] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [rewardDate, setRewardDate]: any = React.useState(new Date())
    let nowTimestamp = BigInt(Math.floor(rewardDate.getTime() / 1000));
    const [counter, setCounter] = React.useState(0);
    const [ticketAmount, setTicketAmount] = React.useState(1)
    const { raffleClient, dispenserClient } = useProgramApis();
    const [walletLamports, setWalletLamports] = React.useState<number>();
    const anchorWallet = useAnchorWallet();
    const {sendTransaction} = useWallet();
    const {connection} = useConnection();

    const hideRaffle = async () => {
        // console.log("in function", raffle.publicKey.toString())
      let request: any = await fetch(`/api/hideRaffle/${raffle.publicKey.toString()}`)
      let response: any = await request.json()
      if(response.message && ADMIN_ACCOUNTS.indexOf(raffleClient.provider.publicKey.toString()) !== -1) {
        toast.success("Raffle hidden!")
      }
    }

    const showRaffle = async () => {
      let request: any = await fetch(`/api/show/${raffle.publicKey.toString()}?type=raffle`)
      let response: any = await request.json()
      if(response.message && ADMIN_ACCOUNTS.indexOf(raffleClient.provider.publicKey.toString()) !== -1) {
        toast.success("Raffle is now visible!")
      }
    }

    const closeRaffle = React.useCallback(async () => {
      let request: any = await fetch(`/api/hide/${raffle.publicKey.toString()}?type=raffle`)
      let response: any = await request.json()
      if(response.message && ADMIN_ACCOUNTS.indexOf(raffleClient.provider.publicKey.toString()) !== -1) {
        toast.success("Raffle deleted!")
      }
    },[raffle.publicKey, raffleClient.provider.publicKey])

    const winningTickets = React.useMemo(() => {
        if (!raffle.randomness || !raffle.entrants || raffle.entrants.size === 0)
        return [];
        const secret = raffle.randomness;
        return raffle.prizes.map((_: any, prizeIndex: any) => {
        const rand = expand(secret, prizeIndex);
        return rand % raffle.totalTickets;
        });
    }, [raffle]);

    const nativePaymentOption = React.useMemo(
        () => ({
            mint: raffle.proceeds.mint,
            dispenserPriceIn: new u64(1),
            dispenserPriceOut: new u64(1),
        }),
        [raffle]
    );

    const entrant = React.useMemo(() => {
        if (!raffleClient.provider.wallet.publicKey) return;

        return raffle?.entrants.get(
        raffleClient.provider.wallet.publicKey.toString()
        );
    }, [raffle, raffleClient.provider.wallet.publicKey]);

  const entrantWinningTickets = React.useMemo(() => {
    if (!entrant || !winningTickets) return [];
    return winningTickets.reduce(
      (acc: any, ticketIndex: any, prizeIndex: any) => {
        if (entrant?.tickets.includes(ticketIndex)) {
          return [...acc, { prizeIndex, ticketIndex }];
        } else {
          return acc;
        }
      },
      []
    );
  }, [entrant, winningTickets]);

    const [paymentOption, setPaymentOption] = React.useState<PaymentOption>(nativePaymentOption);

    const [buyerATABalance, setBuyerATABalance] = useState<AccountBalance>({
        mint: raffle.proceeds.mint.publicKey,
        amount: undefined,
    });
    // const allTokens: any = tokenRegistry;
    const [dispensers, setDispensers] = React.useState<
        { account: DispenserRegistryRaw; publicKey: PublicKey }[]
    >([]);

  React.useEffect(() => {
    if (!raffleClient.provider.wallet.publicKey) return;
    async function updateBuyerATABalance() {
      setBuyerATABalance({
        mint: paymentOption.mint.publicKey,
        amount: await getBuyerATABalance(
          raffleClient.provider,
          paymentOption.mint.publicKey
        ),
      });
    }
    const timerId = setInterval(() => {
      updateBuyerATABalance();
    }, 5000);
    updateBuyerATABalance();
    return () => clearInterval(timerId);
  }, [
    raffleClient.provider,
    raffleClient.provider.wallet,
    paymentOption.mint.publicKey,
  ]);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    setTimeout(() => {
        let oldCount = counter;
        setCounter(oldCount+=1)
    }, 1000)
    React.useEffect(() => {
        setRewardDate(() => new Date())
    }, [counter])

  const getBasketPrice = React.useCallback(
    (ticketAmount: number) =>
      calculateBasketPrice(
        raffle.proceeds.ticketPrice,
        ticketAmount,
        paymentOption
      ),
    [raffle.proceeds.ticketPrice, paymentOption]
  );

//   const paymentOptions = React.useMemo(
//     () =>
//       (raffle.metadata.alternatePurchaseMints || []).reduce(
//         (acc: any, mintAddress: any) => {
//           if (!tokenInfoMap.has(mintAddress.toString())) {
//             console.log(
//               `Mint ${mintAddress.toString()} not found in token registry`
//             );
//             return acc;
//           }

//           const dispenser = dispensers.find(
//             (d) =>
//               d.account.mintTokenOut.toString() ===
//                 raffle.proceeds.mint.publicKey.toString() &&
//               d.account.mintTokenIn.toString() === mintAddress.toString()
//           );
//           if (!dispenser) {
//             return acc;
//           }

//           const tokenInfo = tokenInfoMap.get(mintAddress.toString())!;
//           acc.set(mintAddress.toString(), {
//             mint: {
//               name: tokenInfo.name,
//               publicKey: mintAddress,
//               logoUrl: tokenInfo.logoURI,
//               symbol: tokenInfo.symbol,
//               decimals: tokenInfo.decimals,
//             },
//             dispenserPriceIn: dispenser.account.rateTokenIn,
//             dispenserPriceOut: dispenser.account.rateTokenOut,
//           });
//           return acc;
//         },
//         new Map<string, PaymentOption>([
//           [
//             raffle.proceeds.mint.publicKey.toString(),
//             {
//               mint: raffle.proceeds.mint,
//               dispenserPriceIn: new u64(1),
//               dispenserPriceOut: new u64(1),
//             },
//           ],
//         ])
//       ),
//     [raffle, dispensers]
//   );

  React.useEffect(() => {
    dispenserClient.account.registry.all().then(setDispensers);
  }, [dispenserClient, setDispensers]);

  React.useEffect(() => {
    if (!raffleClient.provider.wallet?.publicKey) return;
    let timerId: ReturnType<typeof setInterval>;

    const updateLamports = async () => {
      const newWalletLamports = await getWalletLamports(raffleClient.provider);
      setWalletLamports(newWalletLamports);
      if (
        isLamportsEnough(walletLamports) &&
        !(paymentOption.mint.publicKey.toBase58() === wrappedSOL)
      ) {
        clearInterval(timerId);
      }
    };

    updateLamports();
    timerId = setInterval(() => {
      updateLamports();
    }, 5000);
    return () => clearInterval(timerId);
  }, [
    walletLamports,
    raffleClient.provider,
    raffleClient.provider.wallet.publicKey,
    paymentOption.mint.publicKey,
  ]);

//   const lamportsEnough = React.useMemo(
//     () => isLamportsEnough(walletLamports),
//     [walletLamports]
//   );

  const buyerTokenBalance = React.useMemo(() => {
    return paymentOption.mint.publicKey.toBase58() === wrappedSOL
      ? {
          mint: new PublicKey(wrappedSOL),
          amount: new u64(walletLamports ?? 0),
        } // We ignore the potential wSOL ATA
      : buyerATABalance;
  }, [walletLamports, buyerATABalance, paymentOption.mint.publicKey]);

//   const hasEnoughFunds = React.useMemo(() => {
//     const tokensEnough = buyerTokenBalance.amount?.gte(
//       getBasketPrice(ticketAmount)
//     );
//     return tokensEnough && lamportsEnough;
//   }, [buyerTokenBalance, lamportsEnough, ticketAmount, getBasketPrice]);

  const maxTicketsToBuyable = React.useMemo(() => {
    if (!buyerTokenBalance.amount) return new u64(0);
    const newMax = buyerTokenBalance.amount
      .mul(paymentOption.dispenserPriceOut)
      .div(paymentOption.dispenserPriceIn)
      .div(raffle.proceeds.ticketPrice);

    if (
      paymentOption.mint.publicKey.toString() ===
        buyerTokenBalance.mint.toString() &&
      newMax.ltn(ticketAmount)
    )
      setTicketAmount(newMax.toNumber());
    return newMax;
  }, [
    raffle.proceeds.ticketPrice,
    ticketAmount,
    buyerTokenBalance,
    paymentOption,
  ]);

    const purchaseTickets = React.useCallback(async () => {
        if(raffle === undefined) return;
        setLoading(true);
        let tx = await buyTickets(raffleClient, dispenserClient, raffle, ticketAmount, paymentOption, (buyerATABalance.amount !== undefined), connection)
        const recoveredBidTransaction = Transaction.from(
          Buffer.from(tx, "base64")
        );

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')
        
        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Tickets purchased successfully")

        setLoading(false);
        handleClose();
    },[raffle, raffleClient, dispenserClient, ticketAmount, paymentOption, buyerATABalance.amount, connection, sendTransaction])

    const userClaimPrize = React.useCallback(async (prizeIndex: any, ticketIndex: any) => {
        if(raffle === undefined) return;
        setLoading(true);
        let ix = await claimPrize(raffleClient, raffle, prizeIndex, ticketIndex, connection)
        let recoveredBidTransaction = new Transaction()
        let prize = raffle.prizes[0];
        const ata = (
          await getAtaForMint(
            //@ts-ignore
            prize.mint.publicKey,
            raffle.entrantsRaw[winningTickets[0]]
          )
        )[0];
        try {
            let balanceOfNewAta = await connection.getParsedAccountInfo(ata);
            if(balanceOfNewAta["value"] === null) {
            recoveredBidTransaction.add(
                Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                prize.mint.publicKey,
                ata,
                raffle.entrantsRaw[winningTickets[0]],
                raffleClient.provider.wallet.publicKey,
                )
            )
            }
        } catch (e) {
            console.log("error", e)
        }
        recoveredBidTransaction.add(ix);

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')

        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Prize claimed successfully")

        setLoading(false);
        handleClose();
    },[connection, raffle, raffleClient, sendTransaction, winningTickets])

    const adminClaimPrizeForUser = React.useCallback(async () => {
        if(raffle === undefined) return;
        console.log("Winner", raffle.entrantsRaw[winningTickets[0]].toString())
        setLoading(true);
        let ix = await claimPrizeForThem(raffleClient, raffle, 0, winningTickets[0], connection)
        let recoveredBidTransaction = new Transaction()
        let prize = raffle.prizes[0];
        const ata = (
          await getAtaForMint(
            //@ts-ignore
            prize.mint.publicKey,
            raffle.entrantsRaw[winningTickets[0]]
          )
        )[0];
        try {
            let balanceOfNewAta = await connection.getParsedAccountInfo(ata);
            console.log(balanceOfNewAta)
            if(balanceOfNewAta["value"] === null) {
            recoveredBidTransaction.add(
                Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                prize.mint.publicKey,
                ata,
                raffle.entrantsRaw[winningTickets[0]],
                raffleClient.provider.wallet.publicKey,
                )
            )
            }
        } catch (e) {
            console.log("error", e)
        }

        recoveredBidTransaction.add(ix);

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')

        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Prize claimed successfully")
        setLoading(false);
        handleClose();
    },[connection, raffle, raffleClient, sendTransaction, winningTickets])

    const adminClaimPrizeNoEntries = React.useCallback(async () => {
        if(raffle === undefined) return;
        setLoading(true);
        let ix = await claimPrizeForThem(raffleClient, raffle, 0, 0, connection)
        let recoveredBidTransaction = new Transaction()
        let prize = raffle.prizes[0];
        let winner = raffle.entrantsRaw[0];
        if (winner.toString() === "11111111111111111111111111111111") winner = raffleClient.provider.wallet.publicKey;

        const ata = (
          await getAtaForMint(
            //@ts-ignore
            prize.mint.publicKey,
            winner,
          )
        )[0];
        try {
            let balanceOfNewAta = await connection.getParsedAccountInfo(ata);
            if(balanceOfNewAta["value"] === null) {
            recoveredBidTransaction.add(
                Token.createAssociatedTokenAccountInstruction(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                prize.mint.publicKey,
                ata,
                winner,
                raffleClient.provider.wallet.publicKey,
                )
            )
            }
        } catch (e) {
            console.log("error", e)
        }
        recoveredBidTransaction.add(ix);
        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')

        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Prize claimed successfully")
        setLoading(false);
        handleClose();
    },[connection, raffle, raffleClient, sendTransaction])

    const adminEndRaffle = React.useCallback(async () => {
        if(raffle === undefined) return;
        setLoading(true);
        let ix = await raffleClient.instruction.endRaffleEarly({
          accounts: {
            raffle: raffle.publicKey,
            recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY
          }
        })
        const recoveredBidTransaction = new Transaction().add(ix)

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')

        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Raffle ended early successful")
        setLoading(false);
        handleClose();
    },[connection, raffle, raffleClient.instruction, sendTransaction])

    const adminRevealWinner = React.useCallback(async () => {
        if(raffle === undefined) return;
        setLoading(true);
        let ix = raffleClient.instruction.revealWinners({
          accounts: {
            raffle: raffle.publicKey,
            recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY
          }
        })
        const recoveredBidTransaction = new Transaction().add(ix)

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')
        
        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Winner revealed successfully")
        setLoading(false);
        handleClose();
    },[connection, raffle, raffleClient.instruction, sendTransaction])

    const adminCollectTokens = React.useCallback(async () => {
        if(raffle === undefined) return;
        setLoading(true);
        let tx = await collectProceeds(raffleClient, raffle.creator, raffle.proceeds.address, raffle, connection)
        const recoveredBidTransaction = Transaction.from(
          Buffer.from(tx, "base64")
        );

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')
        
        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Proceeds collected successfully")
        setLoading(false);
        handleClose();
    },[connection, raffle, raffleClient, sendTransaction])

    const adminCloseRafle = React.useCallback(async () => {
        if(raffle === undefined) return;
        setLoading(true);
        let tx = await closeEntrants(raffleClient, raffle.creator, raffle, connection);
        const recoveredBidTransaction = Transaction.from(
          Buffer.from(tx, "base64")
        );

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')
        
        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        toast.success("Raffle closed successfully")
        setLoading(false);
        closeRaffle();
        handleClose();
    },[closeRaffle, connection, raffle, raffleClient, sendTransaction])


    return (
      <>

      {/* NON ADMIN VIEW */}
        {raffle.hidden === false && anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) === -1 &&
        <div key={raffle.publicKey.toString()}>
        <Col style={{ padding: "1.5rem" }}>
            <Card className="card">
              <Card.Img 
                variant="top"
                src={raffle.prizes[0].meta.imageUri}
                style={{aspectRatio: "1/1", objectFit: "cover"}} />
                <Card.Body>
                    <Card.Title>{raffle.metadata.name}</Card.Title>
                                    <>
                                    <Card.Text as={"div"}>
                                        <Row>
                                            <Col>
                                                <small>Entries</small>
                                                <br/>
                                                {raffle.totalTickets}/{raffle.entrantsCap}
                                            </Col>
                                            <Col>
                                                <small>Raffle ends in</small>
                                                <br/>
                                                {
                                                    formatTime((new Date(raffle.endTimestamp).getTime()/1000) - Number(nowTimestamp))
                                                }
                                            </Col>
                                        </Row>
                                    </Card.Text>
                                        { raffle.isEnded ?
                                                <Button variant="danger"  onClick={handleShow}>Result</Button>
                                                :
                                                <Button variant="primary"  onClick={handleShow}>Join Raffle</Button>
                                        }
                                </>
                </Card.Body>
            </Card>
        </Col>

        <Modal
            show={show}
            onHide={handleClose}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>{raffle.metadata.name}</Modal.Title>
            </Modal.Header>
                            <Modal.Body>
                                <Container>
                                    <Row>
                                        <Col sm={12} md={4} lg={4} xl={4} xxl={4}>
                                            <Image fluid src={raffle.prizes[0].meta.imageUri} />
                                        </Col>
                                        <Col sm={12} md={8} lg={8} xl={8} xxl={8}>
                                            { (raffle.isEnded) && raffle.entrants &&
                                                    <Row>
                                                        {raffle.prizes.map((prize: any, prizeIndex: any) => {
                                                            const ticketIndex = winningTickets[prizeIndex];
                                                            console.log("prize", prize)
                                                            return (
                                                                <Col>
                                                                    <span>
                                                                        <strong>Winner: </strong>
                                                                        {raffle.entrantsRaw && raffle.entrantsRaw.length > 0 && raffle.randomness !== null && raffle.entrantsRaw[ticketIndex].toString()}
                                                                        {raffle.entrantsRaw.length === 0 && raffle.randomness !== null && "Raffle Ended"}
                                                                        {raffle.entrantsRaw.length > 0 && raffle.randomness === null && "is being drawn.. Hang tight!"}
                                                                    </span>
                                                                </Col>
                                                                )
                                                            })
                                                        }
                                                    </Row>
                                            }
                                            <Row className="centeredDetails">
                                                <Col>
                                                    <small>Entries</small>
                                                    <br />
                                                    {raffle.totalTickets}/{raffle.entrantsCap}
                                                </Col>
                                                <Col>
                                                    <small>My Tickets</small>
                                                    <br />
                                                    {entrant?.tickets.length}
                                                </Col>
                                                <Col>
                                                    <small>Price</small>
                                                    <br />
                                                        {`${getDisplayAmount(
                                                            raffle.proceeds.ticketPrice,
                                                            raffle.proceeds.mint
                                                        )} ${raffle.proceeds.mint.symbol}`}
                                                </Col>
                                                {!raffle.isEnded &&
                                                    <Col>
                                                        <small>Raffle ends in</small>
                                                        <br />
                                                        {
                                                            formatCooldown((new Date(raffle.endTimestamp).getTime()/1000) - Number(nowTimestamp))
                                                        }
                                                    </Col>
                                                }
                                            </Row>
                                        </Col>
                                    </Row>
                                    {
                                        ADMIN_ACCOUNTS.indexOf(raffleClient.provider.publicKey.toString()) !== -1 ?
                                        <>
                                        <br></br>
                                        <Row>
                                            <hr />
                                            {!raffle.isEnded &&
                                                <Col>
                                                    <small>Step 0:</small>
                                                    <br />
                                                    <Button onClick={adminEndRaffle} variant="primary">
                                                        End Early
                                                    </Button>
                                                </Col>
                                            }
                                            {
                                                raffle.isEnded &&
                                                <>
                                                    <Col>
                                                        <small>Step 1:</small>
                                                        <br />
                                                        <Button onClick={adminRevealWinner} variant="primary">
                                                           Draw
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 2:</small>
                                                        <br />
                                                        <Button variant="primary" onClick={adminCollectTokens}>
                                                            Collect {raffle.proceeds.mint.symbol === "LCD" ? "LCD" : "SOL"}
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 3:</small>
                                                        <br />
                                                        <b>Winner claims prize</b>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 3 (option):</small>
                                                        <br />
                                                        <Button variant="primary" onClick={() => raffle.entrants.size > 0 ? adminClaimPrizeForUser() : adminClaimPrizeNoEntries()}>
                                                            Claim for Winner
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 4:</small>
                                                        <br />
                                                        <Button onClick={hideRaffle} variant="danger">
                                                            Hide Raffle
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 5:</small>
                                                        <br />
                                                        <Button onClick={adminCloseRafle} variant="danger">
                                                            Close Raffle
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 6:</small>
                                                        <br />
                                                        <Button onClick={closeRaffle} variant="danger">
                                                            Remove Raffle
                                                        </Button>
                                                    </Col>
                                                    {/* <Col>
                                                        <small>ICE:</small>
                                                        <br />
                                                        <Button variant="danger">
                                                            Claim Prize
                                                        </Button>
                                                    </Col> */}
                                                </>
                                            }
                                        </Row>
                                        </>
                                        :
                                        <></>
                                    }
                                </Container>
                            </Modal.Body>
                            <Modal.Footer>
                                   {raffle.isEnded ?
                                            <Row>
                                                {raffle.prizes.map((prize: any, prizeIndex: any) => {
                                                const ticketIndex = winningTickets[prizeIndex];
                                                // console.log(ticketIndex)
                                                const isWon = entrantWinningTickets.some(
                                                    (entrantWinningTicket: any) =>
                                                    entrantWinningTicket.ticketIndex === ticketIndex
                                                );
                                                return (
                                                <Col md={{ offset: 1 }}>
                                                    {isWon && (
                                                        <Button
                                                        variant="primary"
                                                        id="joinRaffle"
                                                        disabled={prize.amount.isZero()}
                                                        onClick={() => userClaimPrize(prizeIndex, ticketIndex)}
                                                        >
                                                            {prize.amount.isZero() ? "Prize Claimed" : "Claim Prize"}
                                                        </Button>
                                                    )}
                                                    {!isWon &&
                                                        <small>
                                                            {raffle.entrantsRaw && raffle.entrantsRaw.length > 0 && raffle.randomness !== null && "Sorry, better luck next time!"}
                                                            {raffle.entrantsRaw.length === 0 && raffle.randomness !== null && "Raffle Ended"}
                                                            {raffle.entrantsRaw.length > 0 && raffle.randomness === null && "is being drawn.. Hang tight!"}
                                                        </small>
                                                    }
                                                </Col>
                                                )})}
                                            </Row>
                                            :
                                            <Row>
                                                <Col md={{ offset: 1 }}>
                                                    <InputGroup className="mb-3">
                                                        <Button variant="outline-secondary" onClick={() => {
                                                                let prevTickets = ticketAmount;
                                                                ticketAmount >= 2 && setTicketAmount(prevTickets-=1)
                                                            }}>-</Button>
                                                        <Form.Control
                                                            className="centered"
                                                            onChange={(e) => {
                                                                if(Number(e.target.value) <= raffle.entrantsCap - raffle.totalTickets) {
                                                                    setTicketAmount(Number(e.target.value))
                                                                }
                                                            }}
                                                            value={ticketAmount}
                                                            aria-label="Join"
                                                            aria-describedby="joinRaffle"
                                                        />
                                                        <Button onClick={() => {
                                                                let prevTickets = ticketAmount;
                                                                ticketAmount < raffle.entrantsCap - raffle.totalTickets && setTicketAmount(prevTickets+=1)
                                                            }} variant="outline-secondary">+</Button>
                                                        <Button
                                                        variant="primary"
                                                        id="joinRaffle"
                                                        onClick={purchaseTickets}
                                                        >
                                                            Join Raffle
                                                        </Button>
                                                    </InputGroup>
                                                </Col>
                                            </Row>
                                    }
                            </Modal.Footer>
        </Modal>
        </div>
        }


        {/* ADMIN VIEW */}
        {anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1 &&
        <div key={raffle.publicKey.toString() + "2"}>
        <Col style={{ padding: "1.5rem" , overflow: "hidden"}}>
            <Card className="card">
                    <Card.Img variant="top" style={{aspectRatio: "1/1", objectFit: "cover"}} src={raffle.prizes[0].meta.imageUri} />
                <Card.Body  style={{backgroundColor: raffle.hidden && "red"}}>
                    <Card.Title>{raffle.metadata.name}</Card.Title>
                                    <>
                                    <Card.Text as={"div"}>
                                        <Row>
                                            <Col>
                                                <small>Entries</small>
                                                <br/>
                                                {raffle.totalTickets}/{raffle.entrantsCap}
                                            </Col>
                                            <Col>
                                                <small>Raffle ends in</small>
                                                <br/>
                                                {
                                                    formatTime((new Date(raffle.endTimestamp).getTime()/1000) - Number(nowTimestamp))
                                                }
                                            </Col>
                                        </Row>
                                    </Card.Text>
                                        { raffle.isEnded ?
                                                <Button variant="danger"  onClick={handleShow}>Result</Button>
                                                :
                                                <Button variant="primary"  onClick={handleShow}>Join Raffle</Button>
                                        }
                                </>
                </Card.Body>
            </Card>
        </Col>

        <Modal
            show={show}
            onHide={handleClose}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>{raffle.metadata.name}</Modal.Title>
            </Modal.Header>
                            <Modal.Body>
                                <Container>
                                    <Row>
                                        <Col sm={12} md={4} lg={4} xl={4} xxl={4}>
                                            <Image fluid src={raffle.prizes[0].meta.imageUri} />
                                        </Col>
                                        <Col sm={12} md={8} lg={8} xl={8} xxl={8}>
                                            { (raffle.isEnded) && raffle.entrants &&
                                                    <Row>
                                                        {raffle.prizes.map((prize: any, prizeIndex: any) => {
                                                            const ticketIndex = winningTickets[prizeIndex];
                                                            // console.log("admin", ticketIndex, winningTickets, prize)
                                                            return (
                                                                <Col>
                                                                    <span>
                                                                        <strong>Winner: </strong>
                                                                        {raffle.entrantsRaw && raffle.entrantsRaw.length > 0 && raffle.randomness !== null && raffle.entrantsRaw[ticketIndex].toString()}
                                                                        {raffle.entrantsRaw.length === 0 && raffle.randomness !== null && "Raffle Ended"}
                                                                        {raffle.entrantsRaw.length > 0 && raffle.randomness === null && "is being drawn.. Hang tight!"}
                                                                    </span>
                                                                </Col>
                                                                )
                                                            })
                                                        }
                                                    </Row>
                                            }
                                            <Row className="centeredDetails">
                                                <Col>
                                                    <small>Entries</small>
                                                    <br />
                                                    {raffle.totalTickets}/{raffle.entrantsCap}
                                                </Col>
                                                <Col>
                                                    <small>My Tickets</small>
                                                    <br />
                                                    {entrant?.tickets.length}
                                                </Col>
                                                <Col>
                                                    <small>Price</small>
                                                    <br />
                                                        {`${getDisplayAmount(
                                                            raffle.proceeds.ticketPrice,
                                                            raffle.proceeds.mint
                                                        )} ${raffle.proceeds.mint.symbol}`}
                                                </Col>
                                                {!raffle.isEnded &&
                                                    <Col>
                                                        <small>Raffle ends in</small>
                                                        <br />
                                                        {
                                                            formatCooldown((new Date(raffle.endTimestamp).getTime()/1000) - Number(nowTimestamp))
                                                        }
                                                    </Col>
                                                }
                                            </Row>
                                        </Col>
                                    </Row>
                                    {
                                        ADMIN_ACCOUNTS.indexOf(raffleClient.provider.publicKey.toString()) !== -1 ?
                                        <>
                                        <br></br>
                                        <Row>
                                            <hr />
                                            {!raffle.isEnded &&
                                            <>
                                                <Col>
                                                    <small>Step 0:</small>
                                                    <br />
                                                    <Button onClick={adminEndRaffle} variant="primary">
                                                        End Early
                                                    </Button>
                                                </Col>
                                                <Col>
                                                    <small>Step 1:</small>
                                                    <br />
                                                    <Button onClick={showRaffle} variant="danger">
                                                        Show Raffle
                                                    </Button>
                                                </Col>
                                                <Col>
                                                    <small>Step 2:</small>
                                                    <br />
                                                    <Button onClick={hideRaffle} variant="danger">
                                                        Hide Raffle
                                                    </Button>
                                                </Col>
                                            </>
                                            }
                                            {
                                                raffle.isEnded &&
                                                <>
                                                    <Col>
                                                        <small>Step 1:</small>
                                                        <br />
                                                        <Button onClick={adminRevealWinner} variant="primary">
                                                           Draw
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 2:</small>
                                                        <br />
                                                        <Button variant="primary" onClick={adminCollectTokens}>
                                                            Collect {raffle.proceeds.mint.symbol === "LCD" ? "LCD" : "SOL"}
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 3:</small>
                                                        <br />
                                                        <b>Winner claims prize</b>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 3 (option):</small>
                                                        <br />
                                                        <Button variant="primary" onClick={() => raffle.entrants.size > 0 ? adminClaimPrizeForUser() : adminClaimPrizeNoEntries()}>
                                                            Claim for Winner
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 4:</small>
                                                        <br />
                                                        <Button onClick={hideRaffle} variant="danger">
                                                            Hide Raffle
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 5:</small>
                                                        <br />
                                                        <Button onClick={adminCloseRafle} variant="danger">
                                                            Close Raffle
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <small>Step 5:</small>
                                                        <br />
                                                        <Button onClick={closeRaffle} variant="danger">
                                                            Remove Raffle
                                                        </Button>
                                                    </Col>
                                                    {/* <Col>
                                                        <small>ICE:</small>
                                                        <br />
                                                        <Button variant="danger">
                                                            Claim Prize
                                                        </Button>
                                                    </Col> */}
                                                </>
                                            }
                                        </Row>
                                        </>
                                        :
                                        <></>
                                    }
                                </Container>
                            </Modal.Body>
                            <Modal.Footer>
                                   {raffle.isEnded ?
                                            <Row>
                                                {raffle.prizes.map((prize: any, prizeIndex: any) => {
                                                const ticketIndex = winningTickets[prizeIndex];
                                                // console.log(ticketIndex)
                                                const isWon = entrantWinningTickets.some(
                                                    (entrantWinningTicket: any) =>
                                                    entrantWinningTicket.ticketIndex === ticketIndex
                                                );
                                                return (
                                                <Col md={{ offset: 1 }}>
                                                    {isWon && (
                                                        <Button
                                                        variant="primary"
                                                        id="joinRaffle"
                                                        disabled={prize.amount.isZero()}
                                                        onClick={() => userClaimPrize(prizeIndex, ticketIndex)}
                                                        >
                                                            {prize.amount.isZero() ? "Prize Claimed" : "Claim Prize"}
                                                        </Button>
                                                    )}
                                                    {!isWon &&
                                                        <small>
                                                            {raffle.entrantsRaw && raffle.entrantsRaw.length > 0 && raffle.randomness !== null && "Sorry, better luck next time!"}
                                                            {raffle.entrantsRaw.length === 0 && raffle.randomness !== null && "Raffle Ended"}
                                                            {raffle.entrantsRaw.length > 0 && raffle.randomness === null && "is being drawn.. Hang tight!"}
                                                        </small>
                                                    }
                                                </Col>
                                                )})}
                                            </Row>
                                            :
                                            <Row>
                                                <Col md={{ offset: 1 }}>
                                                    <InputGroup className="mb-3">
                                                        <Button variant="outline-secondary" onClick={() => {
                                                                let prevTickets = ticketAmount;
                                                                ticketAmount >= 2 && setTicketAmount(prevTickets-=1)
                                                            }}>-</Button>
                                                        <Form.Control
                                                            className="centered"
                                                            onChange={(e) => {
                                                                if(Number(e.target.value) <= raffle.entrantsCap - raffle.totalTickets) {
                                                                    setTicketAmount(Number(e.target.value))
                                                                }
                                                            }}
                                                            value={ticketAmount}
                                                            aria-label="Join"
                                                            aria-describedby="joinRaffle"
                                                        />
                                                        <Button onClick={() => {
                                                                let prevTickets = ticketAmount;
                                                                ticketAmount < raffle.entrantsCap - raffle.totalTickets && setTicketAmount(prevTickets+=1)
                                                            }} variant="outline-secondary">+</Button>
                                                        <Button
                                                        variant="primary"
                                                        id="joinRaffle"
                                                        onClick={purchaseTickets}
                                                        >
                                                            Join Raffle
                                                        </Button>
                                                    </InputGroup>
                                                </Col>
                                            </Row>
                                    }
                            </Modal.Footer>
        </Modal>
        </div>
        } 
      </>
    )
}
