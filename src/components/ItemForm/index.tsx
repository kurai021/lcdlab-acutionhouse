import React, { useState} from 'react'

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from "react-bootstrap/Form";
import Stack from 'react-bootstrap/Stack';

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import InputGroup from 'react-bootstrap/InputGroup';
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
// import { createAuction, createMarket, createMerch } from '../../util/auction-house';
import { PublicKey, Transaction } from '@solana/web3.js';
import { Spinner } from 'react-bootstrap';
import { instantRaffle } from '../../util/raffleActions/instantRaffle';
import { useProgramApis } from '../../hooks/useProgramApis';
import { WRAPPED_SOL_MINT } from '@metaplex-foundation/js';
import { LCD_TOKEN, tokenInfoMap } from '../../util/tokenRegistry';
// import { useLocation } from 'react-router-dom';
import { ADMIN_ACCOUNTS } from '../../util/accounts';
import { useNfts } from '../../hooks/useNfts';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { decodeMetadata, getMetadata, Metadata } from '../../util/metadata';
import { getAtaForMint } from '../../util/auction-house';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useRafflesStore } from '../../hooks/useRafflesStore';

function RegisterItem({refreshHandle, solPrice, forceRefresh}: any){
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const anchorWallet = useAnchorWallet();
    const {sendTransaction} = useWallet();
    const location = useRouter()
    const { raffleClient } = useProgramApis();
    const {updateRaffleById} = useRafflesStore();
    const {connection} = useConnection()
    const [listingType, setListingType] = React.useState(location.pathname.slice(1));
    const [endDate, setEndDate] = useState("");
    const [maxEntrants, setMaxEntrants] = useState(5000);
    const [selectToken, setSelectToken] = useState('SOL');
    const [mintId, setMintId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(1);
    const [reserve, setReserve] = useState(0);
    const [holderType, setHolderType] = useState("public");
    const [featured, setFeatured] = useState(false);
    const [usdCost, setUsdCost] = useState(100);
    const [reservePrice, setReservePrice] = useState(100);
    const nfts = useNfts(refreshHandle);

    const handleUsdChange = (e: any) => {
      setUsdCost(e.target.value)
      setPrice(Number((e.target.value/solPrice).toFixed(2)))
    }
    
    const createItem = async (label: any) => {
      if(!anchorWallet) return;
      setLoading(true)

      toast.success(`0/1: Starting ${label} transaction`)
      let fetchTheBidTx = await fetch(
        `/api/create/${mintId}?token=${selectToken}&quantity=${quantity}&price=${price}&seller=${anchorWallet.publicKey.toString()}&page=${listingType}&type=${holderType}&reserve=${reserve}&hide=true&endTime=${(
          new Date(endDate).getTime() / 1000
        ).toFixed(0)}&featured=${featured}`
      );
      let bidTxRes = await fetchTheBidTx.json();
      let recoveredBidTx = await bidTxRes.data;
      // console.log("here", recoveredBidTx)
      const recoveredBidTransaction = Transaction.from(
        Buffer.from(recoveredBidTx, "base64")
      );

      let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

      let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')
        
      if(confirmBidTx.value.err !== null) {
        toast.error("Error, please try again")
        return "error"
      }

      toast.success(<div>1/1: {label} created! TX: <a aria-label="Solscan direct link" href={`https://solscan.io/tx/${signedBidTx}`}>{signedBidTx.slice(0, 4)}...{signedBidTx.slice(-4)}</a></div>)

      setLoading(false);
      setShow(false);

      return signedBidTx;
    }

    const handleListing = async (e: any) => {
        e.preventDefault()
        setLoading(true)
        if(!anchorWallet) return;
        if(listingType === "raffles") {
          const finalToken = Array.from(tokenInfoMap.values()).filter((t) => t.symbol === selectToken)[0];
          let fixedPrice = Number(price) * Math.pow(10, Number(finalToken.decimals));
          let [tx, raffleId] = await instantRaffle(raffleClient, raffleClient.provider.wallet.publicKey, new PublicKey(selectToken === "SOL" ? WRAPPED_SOL_MINT : new PublicKey(LCD_TOKEN.address)), Number((new Date(endDate).getTime()/1000).toFixed(0)), fixedPrice, maxEntrants, new PublicKey(mintId), 0, quantity, connection)
          const recoveredBidTransaction = Transaction.from(
            Buffer.from(tx, "base64")
          );

          let signedBidTx = await sendTransaction(recoveredBidTransaction, connection)

          let confirmBidTx = await connection.confirmTransaction(signedBidTx, 'confirmed')
            
          if(confirmBidTx.value.err !== null) {
            toast.error("Error, please try again")
            return "error"
          }

          let fetchTheBidTx = await fetch(
            `/api/create/${mintId}?token=${selectToken}&quantity=${quantity}&price=${price}&seller=${anchorWallet.publicKey.toString()}&page=${listingType}&type=${holderType}&reserve=${reserve}&hide=true&endTime=${(
              new Date(endDate).getTime() / 1000
            ).toFixed(0)}&featured=${featured}&raffleId=${raffleId}`
          );

          let responseJson = await fetchTheBidTx.json()
          if(responseJson.message && responseJson.data === "success") {
            toast.success("Raffle Created! Please wait.")
          }

          updateRaffleById(raffleId)
          setLoading(false);
          setShow(false);
        }
    let createAtaIx = []
    if(selectToken === "LCD" && listingType !== "raffles") {

    const metadata = await getMetadata(new PublicKey(mintId));
    

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
        if(listingType === "auctions") {
          let tx = await createItem("Auction")
          if (tx !== "error") {
          let fetchTheBidTx = await fetch(
            `/api/create/${mintId}?token=${selectToken}&quantity=${quantity}&price=${price}&seller=${anchorWallet.publicKey.toString()}&page=${listingType}Post&type=${holderType}&reserve=${reserve}&hide=true&endTime=${(
              new Date(endDate).getTime() / 1000
            ).toFixed(0)}&featured=${featured}`
          );
            forceRefresh();
          }
        }
        if(listingType === "merch") {
          let tx = await createItem("Merch")
          if (tx !== "error") {
          let fetchTheBidTx = await fetch(
            `/api/create/${mintId}?token=${selectToken}&quantity=${quantity}&price=${price}&seller=${anchorWallet.publicKey.toString()}&page=${listingType}Post&type=${holderType}&reserve=${reserve}&hide=true&endTime=${(
              new Date(endDate).getTime() / 1000
            ).toFixed(0)}&featured=${featured}&usdCost=${usdCost}`
          );
            forceRefresh();
          }
        }
        if(listingType === "market") {
          let tx = await createItem("Market Item")
          if (tx !== "error") {
          let fetchTheBidTx = await fetch(
            `/api/create/${mintId}?token=${selectToken}&quantity=${quantity}&price=${price}&seller=${anchorWallet.publicKey.toString()}&page=${listingType}Post&type=${holderType}&reserve=${reserve}&hide=true&endTime=${(
              new Date(endDate).getTime() / 1000
            ).toFixed(0)}&featured=${featured}&usdCost=${usdCost}`
          );
            forceRefresh();
          }
        }
    }

    const handleSelectToken=(e: any)=>{
        setSelectToken(e)
    }
    
    React.useEffect(() => {
      if(!nfts || nfts.length <= 0) return
      setMintId(nfts[0].mint)
    },[nfts])

    return (
      <Container>
        {
          anchorWallet &&
          ADMIN_ACCOUNTS.indexOf(anchorWallet?.publicKey.toString()) !== -1 && (
          <Row>
            <Col>
              <Button variant='primary' onClick={handleShow}>
                Register Item
              </Button>

              <Modal
                show={show}
                onHide={handleClose}
                size='lg'
                aria-labelledby='contained-modal-title-vcenter'
                centered>
                <Modal.Header closeButton>
                  <Modal.Title>Register Item</Modal.Title>
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
                      <Col>
                        <Form onSubmit={handleListing}>
                          <Stack>
                            <Form.Group className='mb-3' controlId='mintID'>
                              <Form.Label>Select NFT</Form.Label>
                              <Form.Select
                              defaultValue={"select"}
                                onChange={(event: any) => {
                                  // console.log(event.target.value, "target")
                                  setMintId(event.target.value);
                                }}
                              >
                                <option value={"select"}>Select...</option>
                                {
                                  nfts && nfts.length > 0 &&
                                  nfts.map((nft): any => (
                                    <option key={nft.mint} value={nft.mint}>
                                      {nft.data.name} - {nft.mint}
                                    </option>
                                  ))
                                }
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className='mb-3' controlId='typeItem'>
                              <Form.Label>Type</Form.Label>
                              <Form.Select
                                defaultValue={listingType === null ? "market" : listingType}
                                onChange={(event: any) => {
                                  setListingType(event.target.value);
                                }}>
                                <option value='raffles'>Raffle</option>
                                <option value='auctions'>Auction</option>
                                <option value='merch'>Merch</option>
                                <option value='market'>Market</option>
                              </Form.Select>
                            </Form.Group>

                          { (listingType === "raffles" || listingType === "auctions") &&
                            <Form.Group className="mb-3" controlId="endDate">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control onChange={(e) => setEndDate(e.target.value)} type="datetime-local" />
                            </Form.Group>
                          }
                          {
                              listingType === "merch" && selectToken === "SOL" &&
                              <>
                                <Form.Label>Price</Form.Label>
                                <InputGroup className='mb-3'>
                                  <Form.Control defaultValue={1} onChange={(e) =>  setPrice(Number(e.target.value))} value={price} disabled={listingType === "merch" && selectToken === "SOL"} aria-label='Price' />
                                  <DropdownButton
                                    variant='secondary'
                                    title={selectToken}
                                    id='input-group-dropdown-2'
                                    align='end'
                                    onSelect={handleSelectToken}>
                                    <Dropdown.Item eventKey='LCD'>
                                      LCD
                                    </Dropdown.Item>
                                    <Dropdown.Item eventKey='SOL'>
                                      SOL
                                    </Dropdown.Item>
                                  </DropdownButton>
                                </InputGroup>
                              </>
                          }
                          {
                              selectToken !== "SOL" &&
                              <>
                                <Form.Label>Price</Form.Label>
                                <InputGroup className='mb-3'>
                                  <Form.Control defaultValue={1} onChange={(e) => setPrice(Number(e.target.value))} aria-label='Price' />
                                  <DropdownButton
                                    variant='secondary'
                                    title={selectToken}
                                    id='input-group-dropdown-2'
                                    align='end'
                                    onSelect={handleSelectToken}>
                                    <Dropdown.Item eventKey='LCD'>
                                      LCD
                                    </Dropdown.Item>
                                    <Dropdown.Item eventKey='SOL'>
                                      SOL
                                    </Dropdown.Item>
                                  </DropdownButton>
                                </InputGroup>
                              </>
                          }
                          {
                              selectToken === "SOL" && listingType !== "market" && listingType !== "merch" &&
                              <>
                                <Form.Label>Price</Form.Label>
                                <InputGroup className='mb-3'>
                                  <Form.Control defaultValue={1} onChange={(e) => setPrice(Number(e.target.value))} aria-label='Price' />
                                  <DropdownButton
                                    variant='secondary'
                                    title={selectToken}
                                    id='input-group-dropdown-2'
                                    align='end'
                                    onSelect={handleSelectToken}>
                                    <Dropdown.Item eventKey='LCD'>
                                      LCD
                                    </Dropdown.Item>
                                    <Dropdown.Item eventKey='SOL'>
                                      SOL
                                    </Dropdown.Item>
                                  </DropdownButton>
                                </InputGroup>
                              </>
                          }
                          {
                              listingType === "market" && selectToken === "SOL" &&
                              <>
                              <Form.Label>Price</Form.Label>
                              <InputGroup className='mb-3'>
                                <Form.Control defaultValue={1} onChange={(e) => setPrice(Number(e.target.value))} value={price} disabled={listingType === "market" && selectToken === "SOL"} aria-label='Price' />
                                <DropdownButton
                                  variant='secondary'
                                  title={selectToken}
                                  id='input-group-dropdown-2'
                                  align='end'
                                  onSelect={handleSelectToken}>
                                  <Dropdown.Item eventKey='LCD'>
                                    LCD
                                  </Dropdown.Item>
                                  <Dropdown.Item eventKey='SOL'>
                                    SOL
                                  </Dropdown.Item>
                                </DropdownButton>
                              </InputGroup>
                              </>
                            }

                            {
                              listingType === "market" && selectToken === "SOL" &&
                              <Form.Group
                                className='mb-3'
                                controlId='usdCost'>
                                <Form.Label>USD Value</Form.Label>
                                <Form.Control onChange={handleUsdChange} type='number' defaultValue={100}/>
                              </Form.Group>
                            }

                            {
                              listingType === "merch" && selectToken === "SOL" &&
                              <Form.Group
                                className='mb-3'
                                controlId='usdCost'>
                                <Form.Label>USD Value</Form.Label>
                                <Form.Control onChange={handleUsdChange} type='number' defaultValue={100}/>
                              </Form.Group>
                            }

                          {
                            listingType === "auctions" &&
                            <>
                            <Form.Label>Reserve Price</Form.Label>
                            <InputGroup className='mb-3'>
                              <Form.Control defaultValue={reservePrice} onChange={(e) => setReservePrice(Number(e.target.value))} aria-label='ReservePrice' />
                              <DropdownButton
                                variant='secondary'
                                title={selectToken}
                                disabled
                                id='input-group-dropdown-3'
                                align='end'
                                >
                              </DropdownButton>
                            </InputGroup>
                            </>
                          }

                            <Form.Group
                              className='mb-3'
                              controlId='tokensAvailable'>
                              <Form.Label>Tokens Available</Form.Label>
                              <Form.Control onChange={(e) => setQuantity(Number(e.target.value))} type='number' defaultValue={1} />
                            </Form.Group>

                            {
                              listingType === "raffles" &&
                              <Form.Group
                                className='mb-3'
                                controlId='maxEntrants'>
                                <Form.Label>Tickets Available (10,000 max)</Form.Label>
                                <Form.Control onChange={(e) => setMaxEntrants(Number(e.target.value))} type='number' defaultValue={5000}/>
                              </Form.Group>
                            }

                            <Button
                              variant='primary'
                              type='submit'>
                              Submit
                            </Button>
                          </Stack>
                        </Form>
                      </Col>
                    </Row>
                  </Container>
                    }
                </Modal.Body>
              </Modal>
            </Col>
          </Row>
        )}
      </Container>
    );
}

export default RegisterItem
