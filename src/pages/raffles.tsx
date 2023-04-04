/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
// import "./Raffles.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import OlympusNavbar from '../components/Navbar/OlympusNavbar'
import { useRafflesStore } from "../hooks/useRafflesStore";
import { Raffle } from "../util/types";
import { useWallet } from "@solana/wallet-adapter-react";
import RaffleCard from "../components/RaffleCard/RaffleCard";

import Alert from 'react-bootstrap/Alert';

function Raffles(){
    const { raffles, fetchAllRaffles, fetching } = useRafflesStore();
    const [showOwnRafflesOnly, setShowOwnRafflesOnly] = React.useState(false);
    const [hideEndedRaffles, setHideEndedRaffles] = React.useState(false);
    const { publicKey } = useWallet();
    const [solPrice, setSolPrice] = React.useState(0);

    React.useEffect(() => {
        (async () => {
            let holderFetch = await fetch(`/api/sol`)
            let holderJson = await holderFetch.json();
            setSolPrice(holderJson.data);
        })()
    },[])

    React.useEffect(() => {
      if(!fetchAllRaffles) return
      fetchAllRaffles()
    }, [fetchAllRaffles]);

    // console.log(raffles, "RAFFFLES")
  const filterMap = React.useMemo(
    () => ({
      own: (raffle: Raffle) => raffle.entrants.has(publicKey?.toString() || ''),
      ongoing: (raffle: Raffle) => new Date() < raffle.endTimestamp,
    }),
    [publicKey]
  );

  const rafflesToShow = React.useMemo(() => {
    if (!publicKey || !raffles) return;
    //@ts-ignore
    let toShow = [...raffles.values()].sort(
      (raffle1, raffle2) =>
        raffle2.endTimestamp.getTime() - raffle1.endTimestamp.getTime()
    );
    if (showOwnRafflesOnly) toShow = toShow.filter(filterMap.own);
    if (hideEndedRaffles) toShow = toShow.filter(filterMap.ongoing);
    toShow = toShow.filter((raffle: any) => raffle.deleted === false)
    return toShow;
  }, [publicKey, raffles, showOwnRafflesOnly, filterMap.own, filterMap.ongoing, hideEndedRaffles]);

      return (
        <>
          <OlympusNavbar solPrice={solPrice} />
          <Container fluid className='containerRaffles'>
            {raffles && raffles.size === 0 && fetching && (
              <Row
                xs={1}
                sm={2}
                md={3}
                lg={4}
                xl={6}
                xxl={8}
                className='cardContainer'>
                {/* {data.content.body.map(block => 
                          <RaffleCard block={block} />
                      )} */}
              </Row>
            )}
            {raffles && raffles.size === 0 && (
              <Row className='alertContainer'>
                <Col lg={{ span: 8, offset: 2 }}>
                  <Alert key='info' variant='info'>
                    <Alert.Heading>No raffles to show</Alert.Heading>
                    If you think this is a bug, please contact a moderator.
                  </Alert>
                </Col>
              </Row>
            )}
            {raffles && raffles.size !== 0 && rafflesToShow && (
              <Row
                xs={1}
                sm={2}
                md={3}
                lg={4}
                xl={6}
                xxl={8}
                className='cardContainer'>
                {rafflesToShow
                  .filter((r) => r.prizes.length > 0)
                  .map((raffle: Raffle) => (
                    <RaffleCard
                      key={raffle.publicKey.toString()}
                      raffle={raffle}
                    />
                  ))}
              </Row>
            )}
          </Container>
        </>
      );


}

export default Raffles;