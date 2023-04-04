import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from 'react-bootstrap/Alert';

import OlympusNavbar from '../components/Navbar/OlympusNavbar'
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import MarketCard from "../components/MarketCard/MarketCard";


function Market(){
    const {connection} = useConnection();
    const [auctions, setAuctions] = React.useState([])
    const [refreshHandle, forceRefresh] = React.useReducer((x) => !x, true);
    const [nftsHeld, setNftsHeld] = React.useState(0);
    const {publicKey} = useWallet();
    const [solPrice, setSolPrice] = React.useState(0);

    React.useEffect(() => {
        (async () => {
            let holderFetch = await fetch(`/api/sol`)
            let holderJson = await holderFetch.json();
            setSolPrice(holderJson.data);
        })()
    },[refreshHandle])

    React.useEffect(() => {
        (async () => {
            let holderFetch = await fetch(`/api/holder/${publicKey}`)
            let holderJson = await holderFetch.json();
            setNftsHeld(holderJson.data);
        })()
    },[publicKey])
    
    React.useEffect(() => {
        (async () => {
            let auctionFetch = await fetch("/api/market");
            let auctionJson = await auctionFetch.json()
            let newAuctions = await auctionJson.data;
            // console.log("market", newAuctions)
            if(nftsHeld === 0) {
                let publicAuctions = newAuctions.filter((auction: any) => auction.type === "public").sort((a: any, b: any) => b.id - a.id)
                setAuctions(publicAuctions)
            }
            if(nftsHeld > 0 && nftsHeld < 30) {
                let holderAuctions = newAuctions.filter((auction: any) => auction.type === "public" || auction.type === "holder").sort((a: any, b: any) => b.id - a.id)
                setAuctions(holderAuctions)
            }
            if(nftsHeld >= 30 && nftsHeld < 100) {
                let moonAuctions = newAuctions.filter((auction: any) => auction.type === "public" || auction.type === "moon" || auction.type === "holder").sort((a: any, b: any) => b.id - a.id)
                setAuctions(moonAuctions)
            }
            if(nftsHeld >= 100) {
                setAuctions(newAuctions.sort((a: any, b: any) => b.id - a.id));
            }
        })()
    },[connection, nftsHeld, refreshHandle])

    return (
        <>
            <OlympusNavbar solPrice={solPrice} refreshHandle={refreshHandle} forceRefresh={forceRefresh} />
            <Container fluid className="containerMarket">
                {auctions.length === 0 && (
            <Row className='alertContainer'>
                <Col lg={{ span: 8, offset: 2 }}>
                  <Alert key='info' variant='info'>
                    <Alert.Heading>There are no items in the store at this time.</Alert.Heading>
                    If you think this is a bug, please contact a moderator.
                  </Alert>
                </Col>
              </Row>
          )}
                {auctions.length >= 0 && (
                    <Row xs={1} sm={2} md={3} lg={4} xl={6} xxl={8} className="cardContainer">
                    {
                        auctions !== undefined && 
                        auctions.length > 0 &&
                        auctions.map(auction => 
                            <MarketCard solPrice={solPrice} refreshHandle={forceRefresh} auction={auction} />
                        )
                    }
                </Row>
                )}
            </Container>
        </>
    );
}

export default Market;