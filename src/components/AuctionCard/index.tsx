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
import toast from 'react-hot-toast';
// import "./Card.css"
import { bidAuction, formatCooldown, formatTime, getAtaForMint, refundBid, timeSince } from "../../util/auction-house";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { createClient } from "@supabase/supabase-js";
import { Spinner, Stack } from "react-bootstrap";
import { ADMIN_ACCOUNTS } from "../../util/accounts";
import { decodeMetadata, getMetadata, Metadata } from "../../util/metadata";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export default function AuctionCard({auction, handleRefresh}: any): any{
    const [show, setShow] = useState(false);
    const [showBids, setShowBids] = useState(false);
    const [lastBid, setLastBid]: any = useState([]);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(false);
    const [counter, setCounter] = useState(0);
    const {connection} = useConnection();
    const anchorWallet = useAnchorWallet();
    const {sendTransaction} = useWallet();
    const [price, setPrice] = React.useState(0);
    const [rewardDate, setRewardDate]: any = useState(new Date())
    let nowTimestamp = BigInt(Math.floor(rewardDate.getTime() / 1000));
    const handleClose = () => setShow(false);
    const handleCloseBids = () => {
      setShowBids(false)
      setShow(true);
      setLoading(false);
    };

    const handleShow = () => setShow(true);

    const handleShowBids = () => {
      setShow(false);
      setShowBids(true)
    };

    const handleClaimWinning = async () => {
      setLoading(true);
      if(!anchorWallet) return;
      toast.success("0/1: Beginning transaction")
      let fetchTheSaleTx = await fetch(`/api/execute/${auction.mint_id}?token=${auction.SOL ? "SOL" : "LCD"}&amount=1&price=${lastBid.bid_amount}&buyer=${anchorWallet.publicKey.toString()}&seller=${auction.seller}&type=auction`);
      let saleTxRes = await fetchTheSaleTx.json();
      let recoveredSaleTx = await saleTxRes.data;

      const recoveredSaleTransaction = Transaction.from(
        Buffer.from(recoveredSaleTx, "base64")
      );

      let signedSaleTx = await sendTransaction(recoveredSaleTransaction, connection)

      let confirmSaleTx = await connection.confirmTransaction(signedSaleTx, 'confirmed')

      if(confirmSaleTx.value.err !== null) return toast.error("Error, please try again")
      toast.success(<div>1/1: Sale confirmed! TX: <a aria-label="Solscan direct link" href={`https://solscan.io/tx/${signedSaleTx}`}>{signedSaleTx.slice(0, 4)}...{signedSaleTx.slice(-4)}</a></div>)
      let hideTheAuction = await hideAuction();
      setLoading(false);
      setShow(false);
    }

    React.useEffect(() => {
        (async () => {
          // console.log(auction)
            const auctionFetch = await fetch(`/api/bids/${auction.mint_id}?auctionId=${auction.id}&token=${auction.SOL ? "SOL" : "LCD"}`);
            const auctionJson = await auctionFetch.json();
            let newAuctions = await auctionJson.data;
            // console.log("Getting bids", newAuctions)
            newAuctions.sort((a: any, b: any) => b.bid_amount - a.bid_amount)
            setBids(newAuctions)
            if(newAuctions.length === 0) {
              setLastBid([])
            } else {
              setLastBid(newAuctions[0])
            }
        })()
    },[auction, connection])

    const makeABid = async () => {
        setLoading(true);
        if(!anchorWallet) return;
    let createAtaIx = []
    if(auction.SOL === false) {

    const metadata = await getMetadata(new PublicKey(auction.mint_id));
    

    const metadataObj = await connection.getAccountInfo(
      metadata,
    );
    

    if(!metadataObj) return;
    const metadataDecoded: Metadata = decodeMetadata(
      Buffer.from(metadataObj.data),
    );

    if(!metadataDecoded || !metadataDecoded.data || !metadataDecoded.data.creators) return;

      for (let i = 0; i < metadataDecoded.data.creators.length; i++) {
        let newCreatorWallet = metadataDecoded.data.creators[i].address;
        const ata = (
          await getAtaForMint(
            //@ts-ignore
            new PublicKey("2sotku8LjU4myPUqFzsYE8NQvT3p25NtgNM7bhNeBgSu"),
            new PublicKey(newCreatorWallet),
          )
        )[0];
            try {
              let balanceOfNewAta = await connection.getParsedAccountInfo(ata);
              console.log(balanceOfNewAta)
              if(balanceOfNewAta["value"] === null) {
                createAtaIx.push(
                  Token.createAssociatedTokenAccountInstruction(
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    new PublicKey("2sotku8LjU4myPUqFzsYE8NQvT3p25NtgNM7bhNeBgSu"),
                    ata,
                    new PublicKey(newCreatorWallet),
                    anchorWallet.publicKey,
                  )
                )
              }
            } catch (e) {
              console.log("error", e)
            }
      }
    }
    if(createAtaIx.length > 0) {
      let newTx = new Transaction();
      for(let i = 0; i < createAtaIx.length; i++) {
        let oneIx = createAtaIx[i]
        newTx.add(oneIx)
      }
      let signTransaction = await sendTransaction(newTx, connection)
    }
        // if(anchorWallet.publicKey.toString() === "6PC7dR6Fcmb3V2mLYPR3dx6tqE3kzzHQWRHYy5mL7VBT") {
        //   let makeNewAuction = await fetch(`/api/create/6vt5efHwKSo42Ssoojx2izRgRGMWM8SFbT1NXHKAoPgt?token=LCD&quantity=1&price=1&seller=6PC7dR6Fcmb3V2mLYPR3dx6tqE3kzzHQWRHYy5mL7VBT&page=market&type=public&reserve=0&hide=true&endTime=1776016936&featured=false`)
        //   let makeNewAuctionTx = await makeNewAuction.json();
        //   let recoveredAuctionTx = await makeNewAuctionTx.data;
          
        //   const recoveredAuctionTransaction = Transaction.from(
        //     Buffer.from(recoveredAuctionTx, "base64")
        //   );

        //   let signedAuctionTx = await sendTransaction(recoveredAuctionTransaction, connection);
        //   let confirmedAuctionTx = await connection.confirmTransaction(signedAuctionTx, 'confirmed');
        //   if(confirmedAuctionTx.value.err === null) {
        //     let postTheAuction = await fetch(`/api/create/6vt5efHwKSo42Ssoojx2izRgRGMWM8SFbT1NXHKAoPgt?token=LCD&quantity=1&price=1&seller=6PC7dR6Fcmb3V2mLYPR3dx6tqE3kzzHQWRHYy5mL7VBT&page=$marketPost&type=public&reserve=0&hide=true&endTime=1776016936&featured=false`);
        //     console.log("test item returned")
        //   }
        // }
        toast.success(`0/1: Starting bid transaction`)
        let fetchTheBidTx = await fetch(`/api/bid/${auction.mint_id}?token=${auction.SOL ? "SOL" : "LCD"}&amount=${auction.amount}&price=${price}&buyer=${anchorWallet.publicKey.toString()}&auctionId=${auction.id}&type=auctions`);
        let bidTxRes = await fetchTheBidTx.json();
        let recoveredBidTx = await bidTxRes.data;

        const recoveredBidTransaction = Transaction.from(
          Buffer.from(recoveredBidTx, "base64")
        );

        let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

        let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')

        if(confirmBidTx.value.err !== null) {
          toast.error("Error, please try again")
          return "error"
        }

        let postTheBidTx = await fetch(`/api/bid/${auction.mint_id}?token=${auction.SOL ? "SOL" : "LCD"}&amount=${auction.amount}&price=${price}&buyer=${anchorWallet.publicKey.toString()}&auctionId=${auction.id}&type=auctionsPost`);
        let postBidTx = await postTheBidTx.json();

        toast.success(<div>1/1: Bid successful! TX: <a aria-label="Solscan direct link" href={`https://solscan.io/tx/${signedBidTx}`}>{signedBidTx.slice(0, 4)}...{signedBidTx.slice(-4)}</a></div>)
        setLoading(false);
        setShow(false);
        handleRefresh();
    }

    const cancelABid = async (bidPrice: number, bidId: any) => {
        setLoading(true);
        if(!anchorWallet) return;

        // toast.success("0/2: Beginning cancel bid transaction")
        // let fetchTheSaleTx = await fetch(`/api/cancel/${auction.mint_id}?token=${auction.SOL ? "SOL" : "LCD"}&amount=${auction.amount}&price=${bidPrice}&buyer=${anchorWallet.publicKey.toString()}&seller=${auction.seller}&endAt=${auction.end_at}&bidId=${bidId}`);
        // let saleTxRes = await fetchTheSaleTx.json();
        // let recoveredSaleTx = await saleTxRes.data;

        // const recoveredSaleTransaction = Transaction.from(
        //   Buffer.from(recoveredSaleTx, "base64")
        // );

        // let signedSaleTx = await sendTransaction(recoveredSaleTransaction, connection)

        // let confirmSaleTx = await connection.confirmTransaction(signedSaleTx, 'confirmed')

        // if(confirmSaleTx.value.err !== null) return toast.error("Error, please try again")
        // toast.success("1/2: Cancel bid transaction successful")

        toast.success("0/1: Beginning refund transaction")
        let fetchTheRefundIx = await fetch(`/api/refund/${auction.mint_id}?token=${auction.SOL ? "SOL" : "LCD"}&amount=${auction.amount}&price=${bidPrice}&buyer=${anchorWallet.publicKey.toString()}&seller=${auction.seller}&endAt=${auction.end_at}&bidId=${bidId}&method=one`);
        let refundTxRes = await fetchTheRefundIx.json();
        let recoveredRefundTx = await refundTxRes.data;

        const recoveredRefundTransaction = Transaction.from(
          Buffer.from(recoveredRefundTx, "base64")
        );

        let signedRefundTx = await sendTransaction(recoveredRefundTransaction, connection)

        let confirmedRefundTx = await connection.confirmTransaction(signedRefundTx, 'confirmed')

        if(confirmedRefundTx.value.err !== null) return toast.error("Error, please try again")
        toast.success(<div>2/2: Refund successful! TX: <a aria-label="Solscan direct link" href={`https://solscan.io/tx/${signedRefundTx}`}>{signedRefundTx.slice(0, 4)}...{signedRefundTx.slice(-4)}</a></div>)

        setLoading(false);
        setShow(false);
        handleRefresh();
    }


    const deleteAnAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/delete/${auction.mint_id}?type=auction&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} auction ${auction.name} deleted`)
        handleRefresh();
      }
    }


    setTimeout(() => {
        let oldCount = counter;
        setCounter(oldCount+=1)
    }, 1000)
    React.useEffect(() => {
        setRewardDate(() => new Date())
    }, [counter])


    const publishAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/show/${auction.mint_id}?type=auction&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} auction ${auction.name} published`)
        handleRefresh();
      }
    }

    const hideAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/hide/${auction.mint_id}?type=auction&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} auction ${auction.name} hidden`)
        handleRefresh();
      }
    }

    return (
      <>
      {/* When it is an Admin */}
      {anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1 &&
        <Col style={{ padding: '1.5rem' }} className="d-flex">
          <Card className='card'>
            <Card.Img variant='top' src={auction.image} style={{aspectRatio: "1/1", objectFit: "cover"}}/>
            <Card.Body style={{backgroundColor: anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1 && auction.hide ? "red" : ""}}>
              <Card.Title>{auction.name}</Card.Title>
              <Card.Text as={'div'}>
                <Row>
                  <Col>
                    <small>Highest Bid</small>
                    <br />
                    {lastBid.length === 0 ? `0 ${auction.SOL ? "SOL" : "LCD"}` : `${lastBid.bid_amount} ${auction.SOL ? "SOL" : "LCD"}`}
                  </Col>
                  <Col>
                    <small>Auction ends in</small>
                    <br />
                    {formatTime(
                      auction.end_at - Number(nowTimestamp)
                    )}
                  </Col>
                </Row>
              </Card.Text>
                  {auction.end_at < (nowTimestamp) ? (
                    <div style={{display: "flex", width: "100%", justifyContent: "space-evenly"}}>
                        <Button variant='danger' onClick={handleShow}>
                          Ended
                        </Button>
                      {auction.hide ?
                        <Button variant='primary' onClick={publishAuction}>
                          Publish
                        </Button>
                        :
                        <Button variant='danger' onClick={hideAuction}>
                          Hide
                        </Button>
                      }
                    </div>
                  ) : (
                    <div style={{display: "flex", width: "100%", justifyContent: "space-evenly"}}>
                        <Button variant='primary' onClick={handleShow}>
                          Bid
                        </Button>
                      {auction.hide ?
                        <Button variant='primary' onClick={publishAuction}>
                          Publish
                        </Button>
                        :
                        <Button variant='danger' onClick={hideAuction}>
                          Hide
                        </Button>
                      }
                    </div>
                  )}
            </Card.Body>
          </Card>
        </Col>
      }

      {/* When its not an admin */}
      {anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) === -1 && auction.hide === false &&
        <Col style={{ padding: '1.5rem' }} className="d-flex">
          <Card className='card'>
            <Card.Img 
              variant='top'
              src={auction.image} 
              style={{aspectRatio: "1/1", objectFit: "cover"}} />
            <Card.Body>
              <Card.Title>{auction.name}</Card.Title>
              <Card.Text as={'div'}>
                <Row>
                  <Col>
                    <small>Highest Bid</small>
                    <br />
                    {lastBid.length === 0 ? `0 ${auction.SOL ? "SOL" : "LCD"}` : `${lastBid.bid_amount} ${auction.SOL ? "SOL" : "LCD"}`}
                  </Col>
                  <Col>
                    <small>Auction ends in</small>
                    <br />
                    {formatTime(
                      auction.end_at - Number(nowTimestamp)
                    )}
                  </Col>
                </Row>
              </Card.Text>
                  {auction.end_at < (nowTimestamp) ? (
                    <Button variant='danger' onClick={handleShow}>
                      Ended
                    </Button>
                  ) : (
                    <Button variant='primary' onClick={handleShow}>
                      Bid Up
                    </Button>
                  )}
            </Card.Body>
          </Card>
        </Col>
      }

      {/* When wallet is not connected */}
      {!anchorWallet && auction.hide === false &&
        <Col style={{ padding: '1.5rem' }}>
          <Card className='card'>
            <Card.Img variant='top' src={auction.image} />
            <Card.Body>
              <Card.Title>{auction.name}</Card.Title>
              <Card.Text as={'div'}>
                <Row>
                  <Col>
                    <small>Highest Bid</small>
                    <br />
                    {lastBid.length === 0 ? `0 ${auction.SOL ? "SOL" : "LCD"}` : `${lastBid.bid_amount} ${auction.SOL ? "SOL" : "LCD"}`}
                  </Col>
                  <Col>
                    <small>Auction ends in</small>
                    <br />
                    {formatTime(
                      auction.end_at - Number(nowTimestamp)
                    )}
                  </Col>
                </Row>
              </Card.Text>
                  {auction.end_at < (nowTimestamp) ? (
                    <Button variant='danger' onClick={handleShow}>
                      Ended
                    </Button>
                  ) : (
                    <Button variant='primary' onClick={handleShow}>
                      Bid Up
                    </Button>
                  )}
            </Card.Body>
          </Card>
        </Col>
      }
        <Modal
          show={show}
          onHide={handleClose}
          size='lg'
          aria-labelledby='contained-modal-title-vcenter'
          centered>
          <Modal.Header closeButton>
            <Modal.Title>{auction.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
                <Col sm={12} md={4} lg={4} xl={4} xxl={4}>
                  <Image fluid src={auction.image} />
                </Col>
                <Col sm={12} md={8} lg={8} xl={8} xxl={8}>
                  <Row>
                    <Col>{auction.description}</Col>
                  </Row>
                  {auction.end_at <
                    nowTimestamp && (
                    <Row>
                      <Col>
                        <span>
                          <strong>Winner: </strong>
                          {anchorWallet && lastBid.buyer === anchorWallet.publicKey.toString() ? 
                          <div style={{textAlign: "center"}}>
                            <br></br>
                            You Won!
                            <br></br>
                            <Button variant='danger' id='bidUp' onClick={handleClaimWinning}>
                              Claim NFT
                            </Button>
                          </div>
                          : 
                          lastBid.buyer}
                        </span>
                      </Col>
                    </Row>
                  )}
                  <Row className='centeredDetails'>
                    <Col>
                      <small>Highest Bid</small>
                      <br />
                      {lastBid.length === 0 ? `0 ${auction.SOL ? "SOL" : "LCD"}` : `${lastBid.bid_amount} ${auction.SOL ? "SOL" : "LCD"}`}
                      <br />
                      <br />
                    </Col>
                    <Col>
                      <small>Auction ends in</small>
                      <br />
                      {formatCooldown(
                        auction.end_at - Number(nowTimestamp)
                      )}
                    </Col>
                  </Row>
                  <Row className="centeredDetails">
                  <Col>
                    {
                        bids.length > 0 &&
                        <Button variant='primary' id='bidUp' onClick={handleShowBids} style={{width:"100%"}}>
                          Show Bids
                        </Button>
                      }
                    </Col>
                  </Row>
                </Col>
              </Row>
              {
                  anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1 ?
                  <>
                  <br></br>
                  <Row>
                      <hr />
                          <>
                              <Col>
                                <small>Step 1:</small>
                                <br />
                                  <Button variant="primary" onClick={() => console.log("TODO")}>
                                      Collect
                                  </Button>
                              </Col>
                              <Col>
                                  <small>Step 2:</small>
                                  <br />
                                  <b>Winner claims prize</b>
                              </Col>
                              {/* <Col>
                                  <small>Step 3 (option):</small>
                                  <br />
                                  <Button variant="primary" onClick={() => console.log("TODO")}>
                                      Claim for Winner
                                  </Button>
                              </Col> */}
                              <Col>
                                  <small>Step 3:</small>
                                  <br />
                                  <Button onClick={() => deleteAnAuction()} variant="danger">
                                      Delete
                                  </Button>
                                  <br />
                                  <small>Note:</small>
                                  <br />
                                  <small>Deleting an auction before bids are rescinded can cause loss of tokens to bidder</small>
                              </Col>
                          </>
                  </Row>
                  </>
                  :
                  <></>
              }
            </Container>
          }
          </Modal.Body>
          <Modal.Footer>
              {
                loading === false &&
                <>
                {/* Normie */}
                    {auction.end_at > Number(nowTimestamp) && anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) === -1 &&(
                      <Row>
                        <Col md={{ offset: 1 }}>
                          <InputGroup className='mb-3'>
                            <Form.Control
                              onChange={(e) => setPrice(Number(e.target.value))}
                              placeholder='Bid'
                              aria-label='Bid'
                              aria-describedby='bidUp'
                            />
                            <Button onClick={makeABid} variant='primary' id='bidUp'>
                              Bid Up
                            </Button>
                          </InputGroup>
                        </Col>
                      </Row>
                    )}
                  {/* Admin */}
                    {auction.end_at > Number(nowTimestamp) && anchorWallet && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1 &&(
                      <Row>
                        <Col md={{ offset: 1 }}>
                          {
                            auction.hide ?
                            <Button onClick={makeABid} variant='primary' id='bidUp'>
                              Show Auction
                            </Button>
                            :
                            <Button onClick={makeABid} variant='primary' id='bidUp'>
                              Hide Auction
                            </Button>
                          }
                        </Col>
                      </Row>
                    )}
                </>
            }
          </Modal.Footer>
        </Modal>

        <Modal
          show={showBids}
          onHide={handleCloseBids}
          size='lg'
          aria-labelledby='contained-modal-title-vcenter'
          centered>
          <Modal.Header closeButton>
            <Modal.Title>{auction.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
                      {bids.map((bid: any) => {
                        return (
                          <Row>
                            <hr />
                            <Col>
                              {bid.bid_amount} {auction.SOL ? "SOL" : "LCD"} - {bid.buyer.slice(0,4)}...{bid.buyer.slice(-4)}
                            </Col>
                            <Col>
                              {timeSince(Number(nowTimestamp) - bid.created_at)} ago
                            </Col>
                              {
                                anchorWallet && anchorWallet.publicKey.toString() === bid.buyer && lastBid.buyer !== anchorWallet.publicKey.toString() && ADMIN_ACCOUNTS.indexOf(anchorWallet.publicKey.toString()) === -1 &&
                                <Col>
                                  <Button onClick={() => cancelABid(bid.bid_amount, bid.id)} variant='primary'>
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
      </>
    );
}
