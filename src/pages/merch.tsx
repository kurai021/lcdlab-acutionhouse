import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import OlympusNavbar from '../components/Navbar/OlympusNavbar'
import MerchCard from "../components/MerchCard/MerchCard";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

function Merch(){
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
            let holderFetch = await fetch(`/api/merch/${publicKey}`)
            let holderJson = await holderFetch.json();
            setNftsHeld(holderJson.data);
        })()
    },[publicKey])
    
    React.useEffect(() => {
        (async () => {
            let auctionFetch = await fetch("/api/market");
            let auctionJson = await auctionFetch.json()
            let newAuctions = await auctionJson.data;
            if(nftsHeld === 0) {
                let publicAuctions = newAuctions.filter((auction: any) => auction.type === "public")
                setAuctions(publicAuctions)
            }
            if(nftsHeld > 0 && nftsHeld < 30) {
                let holderAuctions = newAuctions.filter((auction: any) => auction.type === "public" || auction.type === "holder")
                setAuctions(holderAuctions)
            }
            if(nftsHeld >= 30 && nftsHeld < 100) {
                let moonAuctions = newAuctions.filter((auction: any) => auction.type === "public" || auction.type === "moon" || auction.type === "holder")
                setAuctions(moonAuctions)
            }
            if(nftsHeld >= 100) {
                setAuctions(newAuctions);
            }
        })()
    },[connection, nftsHeld, refreshHandle])

    return (
        <>
            <OlympusNavbar solPrice={solPrice} refreshHandle={refreshHandle} forceRefresh={forceRefresh} />
            <Container fluid className="containerMerch">
                <Row xs={1} sm={2} md={3} lg={4} xl={6} xxl={8} className="cardContainer">
                    {
                        auctions !== undefined && 
                        auctions.length > 0 &&
                        auctions.map((auction: any) => 
                            <MerchCard solPrice={solPrice} refreshHandle={forceRefresh} auction={auction} />
                        )
                    }
                </Row>
            </Container>
        </>
    );
}

export default Merch;