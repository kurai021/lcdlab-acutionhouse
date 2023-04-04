import React, { useState } from "react";
// import { Link, useLocation } from "react-router-dom";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";

import Image from 'react-bootstrap/Image';

// import './OlympusNavbar.css'
// import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
// import { Button } from "@chakra-ui/react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import RegisterItem from "../ItemForm";
import { ADMIN_ACCOUNTS, getAssociatedTokenAccountAddress } from "../../util/accounts";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useRouter } from 'next/router'
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button, Col, Modal, Row, Spinner, Stack } from "react-bootstrap";
import { timeSince } from "../../util/auction-house";
import { toast } from "react-hot-toast";

// const WalletDisconnectButtonDynamic = dynamic(
//     async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
//     { ssr: false }
// );
const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

function OlympusNavbar({forceRefresh, solPrice, refreshHandle}: any){
    const {wallet, publicKey, sendTransaction} = useWallet();
    const anchorWallet = useAnchorWallet();
    const {connection} = useConnection();
    const [ownedTokens, setOwnedTokens] = React.useState(0);
    const [ownedSol, setOwnedSol] = React.useState(0);
    const [displayCurrency, setDisplayCurrency] = React.useState("LCD")
    const [displayAmount, setDisplayAmount] = React.useState(0)
    const [showMyBids, setShowMyBids] = React.useState(false);
    const [myBids, setMyBids] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const location = useRouter();
    //change nav color when scrolling
    const [color, setColor] = useState(false)
    const [flexColumn, setFlexColumn] = useState(false)
    let nowTimestamp = BigInt(Math.floor(new Date().getTime() / 1000));

    const changeColor = () => {
        if (window.scrollY >= 90){
            setColor(true)
            setFlexColumn(true)
        }
        else {
            setColor(false)
            setFlexColumn(false)
        }
    }

    const handleCloseBids = () => {
      setShowMyBids(false)
      setLoading(false);
    };

  React.useEffect(() => {
    (async () => {
      if (!publicKey) return;
      let tokenAccount = await getAssociatedTokenAccountAddress(
        publicKey,
        new PublicKey("2sotku8LjU4myPUqFzsYE8NQvT3p25NtgNM7bhNeBgSu")
      );
      let doesAccountExist = await connection.getAccountInfo(tokenAccount);
      if(doesAccountExist !== null) {
          let accountBalance = await connection.getTokenAccountBalance(tokenAccount);
          let adjustedBalance: any = Number(accountBalance["value"]["uiAmountString"]).toFixed(5);
          setOwnedTokens(Number(adjustedBalance));
          setDisplayAmount(Number(adjustedBalance))
      }
      let solanaBalance = await connection.getBalance(publicKey)
      setOwnedSol(Number((solanaBalance/1000000000).toFixed(5)))
    })();
  }, [connection, publicKey, wallet]);
    
  const handleSwitch = async () => {
    if(displayCurrency === "LCD") {
        setDisplayCurrency("SOL")
        setDisplayAmount(ownedSol)
    } else {
        setDisplayCurrency("LCD")
        setDisplayAmount(ownedTokens)
    }
  }

    const cancelABid = async (bidPrice: number, bidId: any, bid: any, method: any) => {
        setLoading(true);
        if(!anchorWallet) return;

        toast.success("0/1: Beginning refund transaction")
        let fetchTheRefundIx = await fetch(`/api/refund/${bid.mint_id}?token=${bid.token}&amount=${1}&price=${bid.bid_amount}&buyer=${anchorWallet.publicKey.toString()}&bidId=${bidId}&method=${method}`);
        let refundTxRes = await fetchTheRefundIx.json();
        let recoveredRefundTx = await refundTxRes.data;

        const recoveredRefundTransaction = Transaction.from(
          Buffer.from(recoveredRefundTx, "base64")
        );

        let signedRefundTx = await sendTransaction(recoveredRefundTransaction, connection)

        let confirmedRefundTx = await connection.confirmTransaction(signedRefundTx, 'confirmed')

        if(confirmedRefundTx.value.err !== null) return toast.error("Error, please try again")
        toast.success(
          <div>
            1/1: Refund successful! TX:{' '}
            <a
              aria-label='Solscan direct link'
              href={`https://solscan.io/tx/${signedRefundTx}`}>
              {signedRefundTx.slice(0, 4)}...{signedRefundTx.slice(-4)}
            </a>
          </div>
        );

        setLoading(false);
        refreshHandle();
    }

    const cancelAllBids = async (token: any, method: any) => {
        setLoading(true);
        if(!anchorWallet) return;

        toast.success("0/1: Beginning refund(s) transaction")
        let fetchTheRefundIx = await fetch(`/api/refund/refundAll?token=${token}&amount=1&price=1&buyer=${anchorWallet.publicKey.toString()}&bidId=1&method=all`);
        let refundTxRes = await fetchTheRefundIx.json();
        let recoveredRefundTx = await refundTxRes.data;

        const recoveredRefundTransaction = Transaction.from(
          Buffer.from(recoveredRefundTx, "base64")
        );

        let signedRefundTx = await sendTransaction(recoveredRefundTransaction, connection)

        let confirmedRefundTx = await connection.confirmTransaction(signedRefundTx, 'confirmed')

        if(confirmedRefundTx.value.err !== null) return toast.error("Error, please try again")
        toast.success(
          <div>
            1/1: Refund(s) successful! TX:{' '}
            <a
              aria-label='Solscan direct link'
              href={`https://solscan.io/tx/${signedRefundTx}`}>
              {signedRefundTx.slice(0, 4)}...{signedRefundTx.slice(-4)}
            </a>
          </div>
        );

        setLoading(false);
        forceRefresh();
    }

    React.useEffect(() => {
        window.addEventListener('scroll', changeColor)
        // console.log("path", location.pathname)
    },[location.pathname])

    React.useEffect(() => {
        (async () => {
            if(!publicKey) return;
            setLoading(true);
            let bidsFetch = await fetch(`/api/allBids/${publicKey.toString()}`);
            let bidsJson = await bidsFetch.json();
            let returnedBids = bidsJson.data;
            setMyBids(returnedBids);
            setLoading(false);
        })()
    },[publicKey, refreshHandle])

    return (
      <Navbar
        bg={color ? 'dark' : 'light'}
        variant={color ? 'dark' : ''}
        expand='lg'
        fixed='top'
        style={{ transition: 'all 0.5s' }}>
        <Container fluid>
          <Navbar.Brand passHref as={Link} href='/'>
            <Image width='250px' height='auto' src={'./hor-logo.png'} />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto' style={{ margin: 'auto' }}>
              <Nav.Item
                style={{
                  fontWeight: location.pathname === '/' ? 600 : 'normal',
                }}>
                <Nav.Link passHref as={Link} href='/' eventKey={'/'}>
                  Home
                </Nav.Link>
              </Nav.Item>
              <Nav.Item
                style={{
                  fontWeight:
                    location.pathname === '/auctions' ? 600 : 'normal',
                }}>
                <Nav.Link
                  passHref
                  as={Link}
                  href='/auctions'
                  eventKey={'/auctions'}>
                  Auctions
                </Nav.Link>
              </Nav.Item>
              <Nav.Item
                style={{
                  fontWeight: location.pathname === '/raffles' ? 600 : 'normal',
                }}>
                <Nav.Link
                  passHref
                  as={Link}
                  href='/raffles'
                  eventKey={'/raffles'}>
                  Raffles
                </Nav.Link>
              </Nav.Item>
              <Nav.Item
                style={{
                  fontWeight: location.pathname === '/market' ? 600 : 'normal',
                }}>
                <Nav.Link
                  passHref
                  as={Link}
                  href='/market'
                  eventKey={'/market'}>
                  Market
                </Nav.Link>
              </Nav.Item>
              {/*
                        <Nav.Item style={{fontWeight: location.pathname === "/merch" ? 600 : "normal"}}>
                                <Nav.Link as={Link} href="/" eventKey={"/merch"}>Merch</Nav.Link>
                            </Nav.Item>
                        */}
                {
                  publicKey &&
                  <Nav.Item style={{cursor: "pointer", fontWeight: "600"}} onClick={() => setShowMyBids(true)}>
                      My Bids
                  </Nav.Item>
                }
              <Nav.Item>
                <RegisterItem
                  forceRefresh={forceRefresh}
                  solPrice={solPrice}
                  refreshHandle={refreshHandle}
                />
              </Nav.Item>
            </Nav>
            <Nav
              className={`ms-auto, ${flexColumn ? '' : 'flex-column'}`}
              style={{ transition: 'all 0.5s' }}>
              <Nav.Item>
                <div className='d-grid gap-2'>
                  <WalletMultiButtonDynamic className='btn-primary btn-lg'>
                    {wallet ? 'See Info' : 'Connect'}
                  </WalletMultiButtonDynamic>
                </div>
              </Nav.Item>
              <Nav.Item>
                <InputGroup size='lg'>
                  <InputGroup.Text
                    style={{ cursor: 'default' }}
                    id='lcd-balance'>
                    Balance
                  </InputGroup.Text>
                  <Form.Control
                    readOnly
                    style={{ cursor: 'pointer' }}
                    onClick={handleSwitch}
                    placeholder='0.000 LCD'
                    value={
                      displayAmount.toLocaleString() + ' ' + displayCurrency
                    }
                    aria-label='Balance'
                    aria-describedby='lcd-balance'
                  />
                </InputGroup>
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>
            <Modal
            show={showMyBids}
            onHide={handleCloseBids}
            size='lg'
            aria-labelledby='contained-modal-title-vcenter'
            centered>
            <Modal.Header closeButton>
                <Modal.Title>My bids</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{display: "flex", width: "50%", justifyContent: "space-around"}}>
                <Button onClick={() => cancelAllBids("SOL", "all")} variant='primary'>
                  Refund all SOL bids
                </Button>
                <Button onClick={() => cancelAllBids("LCD", "all")} variant='primary'>
                  Refund all LCD bids
                </Button>
              </div>
                {loading ?
                <Container className="p-5">
                    <Stack className="my-auto p-5 h-100">
                        <Row className="my-auto p-5 h-100">Please wait for transaction to finish before leaving this screen.</Row>
                        <Spinner className="mx-auto p-5" animation="border"  />
                    </Stack>
                </Container>
                :
                <Container>
                <Row>
                    {/* <Col sm={12} md={8} lg={8} xl={8} xxl={8}> */}
                    <Row>
                        <Col>Bids:</Col>
                    </Row>
                    <Row style={{color: "red"}}>
                      Bids may not add up to total refunded amount due to other marketplace activities. Use refund all whenever possible to be sure all escrow funds are restored.
                    </Row>
                        {myBids.length > 0 && myBids.map((bid: any) => {
                            return (
                            <Row>
                                <hr />
                                <Col>
                                {bid.bid_amount} {bid.token} - {bid.buyer.slice(0,4)}...{bid.buyer.slice(-4)}
                                </Col>
                                <Col>
                                {timeSince(Number(nowTimestamp) - bid.created_at)} ago
                                </Col>
                                {
                                    anchorWallet && anchorWallet.publicKey.toString() &&
                                    <Col>
                                    <Button onClick={() => cancelABid(bid.bid_amount, bid.id, bid, "one")} variant='primary'>
                                        Cancel
                                    </Button>
                                    </Col>
                                }
                            </Row>
                            )
                        })}
                </Row>
                </Container>
            }
            </Modal.Body>
            <Modal.Footer>
                If you do not see your bid, please contact an administrator
            </Modal.Footer>
            </Modal>
        </Container>
      </Navbar>
    );
}

export default OlympusNavbar;