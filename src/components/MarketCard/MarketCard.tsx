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
import { PublicKey, Transaction } from "@solana/web3.js";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "react-hot-toast";
import { ADMIN_ACCOUNTS } from "../../util/accounts";
import { Stack, Spinner } from "react-bootstrap";
import { getAtaForMint, getMetadata } from "../../util/auction-house";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { decodeMetadata, Metadata } from "../../util/metadata";

export default function MarketCard({auction, refreshHandle, solPrice}: any): any{
    const {connection} = useConnection()
    const [show, setShow] = useState(false);
    const anchorWallet = useAnchorWallet();
    const {sendTransaction} = useWallet()
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
      setShow(false);
      setLoading(false);
    }

    const deleteMarketItem = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/delete/${auction.mint_id}?type=market&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} item ${auction.name} deleted`)
      }
      refreshHandle();
    }

    const handleShow = () => setShow(true);

    const publishAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/show/${auction.mint_id}?type=market&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} auction ${auction.name} published`)
      }
      refreshHandle();
    }

    const hideAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/hide/${auction.mint_id}?type=market&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} auction ${auction.name} hidden`)
      }
      refreshHandle();
    }

    const buyMarketItem = async () => {
      if(!anchorWallet) return;
      setLoading(true)
      let token = auction.SOL ? "SOL" : "LCD";

      toast.success("0/2: Starting buy transaction")
      if(solPrice === 0) return;
      let fetchTheBidTx = await fetch(
        `/api/bid/${auction.mint_id}?token=${token}&amount=1&price=${
          token === "SOL"
            ? (auction.usd_cost / solPrice).toFixed(2)
            : auction.starting_price
        }&buyer=${anchorWallet.publicKey.toString()}&type=market`
      );
      let bidTxRes = await fetchTheBidTx.json();
      let recoveredBidTx = await bidTxRes.data;
      
      const recoveredBidTransaction = Transaction.from(
        Buffer.from(recoveredBidTx, "base64")
      );

      let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

      let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')

      toast.success("1/2: Starting transfer transaction")

      if(confirmBidTx.value.err !== null) { 
        return toast.error("Error, please try again")
      } else {
        if(solPrice === 0) return;
        let fetchTheSaleTx = await fetch(`/api/execute/${auction.mint_id}?token=${token}&amount=1&price=${token === "SOL" ? (auction.usd_cost/solPrice).toFixed(2) : auction.starting_price}&buyer=${anchorWallet.publicKey.toString()}&seller=${auction.seller}&type=market`);
        // console.log(`/api/execute/${auction.mint_id}?token=${token}&amount=1&price=${token === "SOL" ? (auction.usd_cost/solPrice).toFixed(2) : auction.starting_price}&buyer=${anchorWallet.publicKey.toString()}&seller=${auction.seller}&type=market`)
        let saleTxRes = await fetchTheSaleTx.json();
        let recoveredSaleTx = await saleTxRes.data;
  
        const recoveredSaleTransaction = Transaction.from(
          Buffer.from(recoveredSaleTx, "base64")
        );
  
  
        let signedSaleTx = await sendTransaction(recoveredSaleTransaction, connection)
  
        let confirmSaleTx = await connection.confirmTransaction(signedSaleTx, 'confirmed')
  
        if(confirmSaleTx.value.err !== null)  {
          return toast.error("Error, please try again")
        }
        
        let newRequest: any = await fetch(`/api/delete/${auction.mint_id}?type=market&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
        let newResponse: any = await newRequest.json()
        if(newResponse.data === "Success deleting market") {
          toast.success(<div>2/2: Sale confirmed! TX: <a aria-label="Solscan direct link" href={`https://solscan.io/tx/${signedSaleTx}`}>{signedSaleTx.slice(0, 4)}...{signedSaleTx.slice(-4)}</a></div>)
          refreshHandle()
          setLoading(false);
          setShow(false);
        }
      }
    }


    return (
      <>
        {auction.image !== undefined && (
          <>
            {/* Admin Use */}
            {anchorWallet &&
              ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !==
                -1 && (
                <Col style={{ padding: '1.5rem' }} className='d-flex'>
                  <Card className='card'>
                    <Card.Img
                      variant='top'
                      src={auction.image}
                      style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                    />
                    <Card.Body
                      style={{ backgroundColor: auction.hide ? 'red' : '' }}>
                      <Card.Title>{auction.name}</Card.Title>
                      <Card.Text as={'div'}>
                        <Row>
                          <Col>
                            <small>Price</small>
                            <br />
                            {auction.SOL &&
                              solPrice > 0 &&
                              (auction.usd_cost / solPrice).toFixed(2) + ' SOL'}
                            {!auction.SOL && (
                              <>
                                {auction.starting_price}{' '}
                                {auction.SOL ? ' SOL' : ' LCD'}
                              </>
                            )}
                          </Col>
                        </Row>
                      </Card.Text>
                      {auction.hide ? (
                        <div>
                          <Button variant='primary' onClick={publishAuction}>
                            Publish
                          </Button>
                          <Button variant='primary' onClick={deleteMarketItem}>
                            Delete
                          </Button>
                          <Button variant='primary' onClick={handleShow}>
                            Buy
                          </Button>
                        </div>
                      ) : (
                        <Button variant='primary' onClick={handleShow}>
                          Buy
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              )}
            {/* Regular wallet use */}
            {anchorWallet &&
              ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) ===
                -1 &&
              !auction.hide && (
                <Col style={{ padding: '1.5rem' }} className='d-flex'>
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
                            <small>Price</small>
                            <br />
                            {auction.SOL &&
                              solPrice > 0 &&
                              (auction.usd_cost / solPrice).toFixed(2) + ' SOL'}
                            {!auction.SOL && (
                              <>
                                {auction.starting_price}{' '}
                                {auction.SOL ? ' SOL' : ' LCD'}
                              </>
                            )}{' '}
                          </Col>
                        </Row>
                      </Card.Text>
                      <Button variant='primary' onClick={handleShow}>
                        Buy
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            {/* Normie use */}
            {!anchorWallet && !auction.hide && (
              <Col style={{ padding: '1.5rem' }}>
                <Card className='card'>
                  <Card.Img variant='top' src={auction.image} />
                  <Card.Body>
                    <Card.Title>{auction.name}</Card.Title>
                    <Card.Text as={'div'}>
                      <Row>
                        <Col>
                          <small>Price</small>
                          <br />
                          {auction.SOL &&
                            (auction.usd_cost / solPrice).toFixed(2) + ' SOL'}
                          {!auction.SOL && (
                            <>
                              {auction.starting_price}{' '}
                              {auction.SOL ? ' SOL' : ' LCD'}
                            </>
                          )}{' '}
                        </Col>
                      </Row>
                    </Card.Text>
                    <Button variant='primary' onClick={handleShow}>
                      Buy
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )}

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
                <Container>
                  {loading ? (
                    <Container className='p-5'>
                      <Stack className='my-auto p-5 h-100'>
                        <Row className='my-auto p-5 h-100'>
                          Please wait for transaction to finish before leaving
                          this screen.
                        </Row>
                        <Spinner className='mx-auto p-5' animation='border' />
                      </Stack>
                    </Container>
                  ) : (
                    <Row>
                      <Col sm={12} md={4} lg={4} xl={4} xxl={4}>
                        <Image fluid src={auction.image} />
                      </Col>
                      <Col sm={12} md={8} lg={8} xl={8} xxl={8}>
                        <Row>
                          <Col>{auction.description}</Col>
                        </Row>
                        <Row className='centeredDetails'>
                          <Col>
                            <small>Price</small>
                            <br />
                            {auction.SOL &&
                              (auction.usd_cost / solPrice).toFixed(2) + ' SOL'}
                            {!auction.SOL && (
                              <>
                                {auction.starting_price}{' '}
                                {auction.SOL ? ' SOL' : ' LCD'}
                              </>
                            )}{' '}
                          </Col>
                          <Col>
                            <small>Existing Units</small>
                            <br />
                            {auction.quantity}
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  )}
                  {anchorWallet &&
                  ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !==
                    -1 ? (
                    <>
                      <br></br>
                      <Row>
                        <hr />
                        <>
                          <Col>
                            <small>Step 1:</small>
                            <br />
                            <Button
                              onClick={() => hideAuction()}
                              variant='primary'>
                              Hide
                            </Button>
                          </Col>
                          <Col>
                            <small>Step 2:</small>
                            <br />
                            <Button
                              onClick={() => deleteMarketItem()}
                              variant='primary'>
                              Delete
                            </Button>
                          </Col>
                          <Col>
                            <small>Note:</small>
                            <br />
                            Deleting an auction before bids are rescinded can
                            cause loss of tokens to bidder
                          </Col>
                        </>
                      </Row>
                    </>
                  ) : (
                    <></>
                  )}
                </Container>
              </Modal.Body>
              <Modal.Footer>
                <Row>
                  <Col md={{ offset: 1 }}>
                    <InputGroup className='mb-3'>
                      <Button variant='outline-secondary'>-</Button>
                      <Form.Control
                        className='centered'
                        placeholder='1'
                        aria-label='Buy'
                        aria-describedby='Buy'
                      />
                      <Button variant='outline-secondary'>+</Button>
                      <Button
                        variant='primary'
                        id='joinRaffle'
                        onClick={buyMarketItem}>
                        Buy
                      </Button>
                    </InputGroup>
                  </Col>
                </Row>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </>
    );
}
