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
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { Spinner, Stack } from "react-bootstrap";
import { ADMIN_ACCOUNTS } from "../../util/accounts";
import { toast } from "react-hot-toast";

export default function MerchCard({auction, refreshHandle, solPrice}: any): any{
    const [show, setShow] = useState(false);
    const {connection} = useConnection()
    const anchorWallet = useAnchorWallet();
    const [loading, setLoading] = useState(false);
    const {sendTransaction} = useWallet();

    const handleClose = () => {
      setShow(false);
      setLoading(false);
    }

    const deleteAnAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/delete/${auction.mint_id}?type=merch&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} item ${auction.name} deleted`)
      }
      refreshHandle();
    }

    const publishAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/show/${auction.mint_id}?type=merch&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} item ${auction.name} published`)
      }
      refreshHandle();
    }

    const hideAuction = async () => {
      if(!anchorWallet) return;
      let request: any = await fetch(`/api/hide/${auction.mint_id}?type=merch&publicKey=${anchorWallet?.publicKey}&id=${auction.id}`)
      let response: any = await request.json()
      if(response.message && ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1) {
        toast.success(`${auction.SOL ? "SOL" : "LCD"} item ${auction.name} hidden`)
      }
      refreshHandle();
    }

    const buyMerchItem = async () => {
      if(!anchorWallet) return;
      setLoading(true)

      let token = auction.SOL ? "SOL" : "LCD";
      toast.success("0/2: Starting buy transaction")
      if (solPrice === 0) return;
      let fetchTheBidTx = await fetch(`/api/bid/${auction.mint_id}?token=${token}&amount=1&price=${(auction.usd_cost/solPrice).toFixed(2)}&buyer=${anchorWallet.publicKey.toString()}&type=merch`);
      let bidTxRes = await fetchTheBidTx.json();
      let recoveredBidTx = await bidTxRes.data;
      
      const recoveredBidTransaction = Transaction.from(
        Buffer.from(recoveredBidTx, "base64")
      );

      let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

      let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')

      toast.success("1/2: Starting transfer transaction")

      if(confirmBidTx.value.err !== null) return toast.error("Error, please try again")
      if(solPrice === 0) return;
      let fetchTheSaleTx = await fetch(`/api/execute/${auction.mint_id}?token=${token}&amount=1&price=${(auction.usd_cost/solPrice).toFixed(2)}&buyer=${anchorWallet.publicKey.toString()}&seller=${auction.seller}&type=auction`);
      let saleTxRes = await fetchTheSaleTx.json();
      let recoveredSaleTx = await saleTxRes.data;

      const recoveredSaleTransaction = Transaction.from(
        Buffer.from(recoveredSaleTx, "base64")
      );

      let signedSaleTx = await sendTransaction(recoveredSaleTransaction, connection)

      let confirmSaleTx = await connection.confirmTransaction(signedSaleTx, 'confirmed')

      if(confirmSaleTx.value.err !== null) return toast.error("Error, please try again")
      toast.success(<div>2/2: Sale confirmed! TX: <a aria-label="Solscan direct link" href={`https://solscan.io/tx/${signedSaleTx}`}>{signedSaleTx.slice(0, 4)}...{signedSaleTx.slice(-4)}</a></div>)
      let hideTheAuction = await hideAuction();
      setLoading(false);
      setShow(false);
    }

    const handleShow = () => setShow(true);

    return (
      <>
        {/* Admin Use */}
        {anchorWallet &&
          ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1 && (
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
                        )}{' '}
                      </Col>
                    </Row>
                  </Card.Text>
                  {auction.hide ? (
                    <Button variant='primary' onClick={handleShow}>
                      Publish
                    </Button>
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
          ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) === -1 && (
            <Col style={{ padding: '1.5rem' }} className='d-flex'>
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
        {!anchorWallet && (
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
            {loading ? (
              <Container className='p-5'>
                <Stack className='my-auto p-5 h-100'>
                  <Row className='my-auto p-5 h-100'>
                    Please wait for transaction to finish before leaving this
                    screen.
                  </Row>
                  <Spinner className='mx-auto p-5' animation='border' />
                </Stack>
              </Container>
            ) : (
              <Container>
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
                        {(() => {
                          if (auction.units === 1) {
                            return <>{auction.units} unit</>;
                          } else {
                            return <>{auction.units} units</>;
                          }
                        })()}
                      </Col>
                    </Row>
                  </Col>
                </Row>
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
                            onClick={() => deleteAnAuction()}
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
            )}
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
                    onClick={buyMerchItem}>
                    Buy
                  </Button>
                </InputGroup>
              </Col>
            </Row>
          </Modal.Footer>
        </Modal>
      </>
    );
}
