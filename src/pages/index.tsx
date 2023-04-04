import React, { useEffect, useState } from "react";
// import "./Home.css";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from 'react-bootstrap/Image';
import Offcanvas from "react-bootstrap/Offcanvas";
import Nav from "react-bootstrap/Nav";

import { motion } from "framer-motion"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import MeIcon from "../assets/meIcon"
import { NextPage } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";

// const WalletDisconnectButtonDynamic = dynamic(
//     async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
//     { ssr: false }
// );

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);

const Home: NextPage = () => {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(true)
        }, 2500);
        return () => clearTimeout(timer)
    }, [])

    return (
        <Container fluid className="containerHome backgroundMove">
            <Row>
                <Col>
                <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{
                        duration: 2,
                        delay: 1,
                        bounce: 1
                    }}
                    style={{
                        position: "fixed",
                        bottom: "0px"
                    }}
                >
                    <Col md={12} lg={8}>
                        <Image src={"./hipster-in-stone.png"} fluid={true} />
                    </Col>
                </motion.div>
                    <Offcanvas
                        show={show}
                        placement={"end"}
                        backdrop={false}
                    >
                        <Offcanvas.Header closeButton={false}>
                            <Offcanvas.Title>
                                <Image src={"./vert-logo.png"} width={"100px"} />
                                <h4 style={{cursor: "default"}}>Menu</h4>
                            </Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav defaultActiveKey="/" className="flex-column">
                                <Nav.Link passHref as={Link} href="/auctions">
                                    <h1 style={{fontWeight: "lighter", padding: "0.75rem", cursor: "pointer"}}>Auctions</h1>
                                </Nav.Link>
                                <Nav.Link passHref as={Link} href="/raffles">
                                    <h1 style={{fontWeight: "lighter", padding: "0.75rem", cursor: "pointer"}}>Raffles</h1>
                                </Nav.Link>
                                <Nav.Link passHref as={Link} href="/market">
                                    <h1 style={{fontWeight: "lighter", padding: "0.75rem", cursor: "pointer"}}>Marketplace</h1>
                                </Nav.Link>
                                <Nav.Link passHref as={Link} href="/">
                                    <div>
                                        <h1 style={{fontWeight: "lighter", textDecoration: "line-through", paddingTop: "0.75rem", cursor: "not-allowed"}}>Merchandise</h1>
                                        <small style={{cursor: "default"}}>Coming Soon</small>
                                    </div>
                                </Nav.Link>
                            </Nav>
                            <hr className="separator" />
                            <div className="d-grid gap-2">
                                <WalletMultiButtonDynamic className="btn-primary btn-lg" />
                            </div>
                            <hr className="separator" />
                            <Nav className="justify-content-center">
                                <a className="nav-link" href="https://twitter.com/LCDLabNFT" target={"_blank"} rel="noreferrer">
                                    <FontAwesomeIcon icon={['fab','square-twitter']} size="3x" />
                                </a>
                                <a className="nav-link" href="https://discord.com/invite/VvErr8MnZW" target={"_blank"} rel="noreferrer">
                                    <FontAwesomeIcon icon={['fab','discord']} size="3x" />
                                </a>
                                <a className="nav-link" href="https://magiceden.io/marketplace/the_stone_heads" target={"_blank"} rel="noreferrer">
                                    <MeIcon />
                                </a>
                                <a className="nav-link" href="https://www.lcd-lab.xyz/" target={"_blank"} rel="noreferrer">
                                    <FontAwesomeIcon icon={['fas','compass']} size="3x" />
                                </a>
                            </Nav>
                        </Offcanvas.Body>
                    </Offcanvas>
                </Col>
            </Row>
        </Container>
    );
}

export default Home;
