import { useAccount, ConnectButton, connectors } from "@web3modal/react";
import { useState, useEffect } from "react";
import { useMediaQuery } from "@chakra-ui/react";
import { ethers, BigNumber } from "ethers";
import {
  Flex,
  Container,
  Spacer,
  Text,
  Box,
  Button,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputStepper,
  NumberInput,
  NumberInputField,
  useToast,
} from "@chakra-ui/react";
import NavBar from "../components/NavBar";
import Room from "../public/images/room.png";
import BNB from "../public/images/bnb-logo.png";
import BackgroundImg from "../public/images/wallPaper.png";
import Image from "next/image";
import boostNFT from "./BoostNFT.json";

const boostNFTAddress = "0xb404ab334d7Cf931bd77c8C9a11c5a2745b31094";

const METADATA_ID = 2;

const MAX_MINT_LIMIT = 4;

const tokenPrices = [0.024, 0.024, 0.072, 0.14, 0.22];

let tokenId = "0";

export default function Home() {
  const { address, isConnected, connector } = useAccount();
  const toast = useToast();
  const [isMinting, setIsMinting] = useState(false);
  const [isMintEligible, setIsMintEligible] = useState(true);
  const [isMintFailed, setIsMintFailed] = useState(false);
  const [isMintSuccess, setIsMintSuccess] = useState(false);
  const [mintAmount, setMintAmount] = useState(1);
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [currentMintAmount, setCurrentMintAmount] = useState(0);
  const [nftMetadata, setNftMetadata] = useState({});

  useEffect(() => {
    if (isConnected) {
      console.log("Connected to", connector);
      getMintEligibility();
    }
  }, [isConnected]);

  useEffect(() => {
    if (isMintFailed) {
      toast({
        title: "Transaction failed",
        description: "Try again later",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      setIsMintFailed(false);
    }
  }, [isMintFailed]);

  useEffect(() => {
    if (!isMintEligible) {
      toast({
        title: "You are not eligible to mint",
        description: "You have already minted",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [isMintEligible]);

  useEffect(() => {
    if (isMintSuccess) {
      toast({
        title: "Mint success",
        description: "You have successfully minted your NFT",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }
  }, [isMintSuccess]);

  function getNFTPrice() {
    let totalPrice = 0;
    for (let i = 0; i < mintAmount; i++) {
      totalPrice += tokenPrices[i];
    }
    totalPrice += 0.0001;
    console.log(totalPrice);
    return totalPrice;
  }

  async function getMintEligibility() {
    fetch("/api/getMintEligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        } else {
          console.log(res);
        }
      })
      .then((data) => {
        console.log(data.data[0].isMinted);
        console.log(data.data[0].amount);
        setCurrentMintAmount(data.data[0].amount);
        setIsMintEligible(
          data.data[0] != undefined && data.data[0].amount <= MAX_MINT_LIMIT
        );
      });
  }

  async function updateIsMintStatus() {
    fetch("/api/updateMintStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
      .then((res) => {
        if (res.status === 200) {
          console.log("Mint data saved", res);
          return res.json();
        } else {
          console.log(res);
        }
      })
      .then((data) => {
        console.log("Mint data saved");
      });
  }

  async function getNFTMetadata(tokenURI) {
    console.log(tokenURI);
    setNftMetadata({
      price: "0.072",
      description: "This is a description",
    });
    // fetch(tokenURI)
    //   .then((res) => {
    //     if (res.status === 200) {
    //       return res.json();
    //     } else {
    //       console.log(res);
    //     }
    //   })
    //   .then((data) => {
    //     console.log(JSON.parse(data));
    //     setNftMetadata(JSON.parse(data));
    //   });
  }

  async function handleMint() {
    const signer = await connector.getSigner();
    const contract = new ethers.Contract(boostNFTAddress, boostNFT.abi, signer);
    try {
      setIsMinting(true);
      setIsMintSuccess(false);
      // For dev only ------------------------------------------------------------
      console.log("Checking whitelist...");
      // await contract.addWhiteList("0x62a2cE0A0A898d8bBA66018c4a4D8DB6C46D661C");
      const isWhiteListed = await contract.exists(address);
      console.log("isWhitelisted: ", isWhiteListed);
      // For dev only ------------------------------------------------------------
      let response;
      if (mintAmount > 1) {
        let ids = [];
        for (let i = 0; i > mintAmount; i++) {
          ids.push(BigNumber.from(METADATA_ID));
        }
        response = await contract.multiSafeMint(address, ids, {
          value: ethers.utils.parseEther(getNFTPrice().toString()),
        });
        const tx = await response.wait();

        if (tx.status === 1) {
          let event = tx.events[0];
          let value = event.args[2];
          let tokenIds = value;
          console.log("tokenIds", tokenIds);
          const tokenURL = await contract.tokenURI(BigNumber.from(tokenId));
          console.log("tokenURL", tokenURL);
          updateIsMintStatus();
          setIsMinting(false);
          setIsMintSuccess(true);
        } else {
          setIsMintFailed(true);
          setIsMinting(false);
        }
      } else {
        response = await contract.safeMint(
          address,
          BigNumber.from(METADATA_ID),
          {
            value: ethers.utils.parseEther(getNFTPrice().toString()),
          }
        );
        const tx = await response.wait();
        console.log(tx);
        if (tx.status === 1) {
          let event = tx.events[0];
          let value = event.args[2];
          // let id = value.toNumber();
          let id = "3";
          console.log("tokenId", id);
          const tokenURL = await contract.tokenURI(BigNumber.from(id));
          console.log("tokenURL", tokenURL);
          tokenId = id.toString();
          getNFTMetadata(tokenURL);
          updateIsMintStatus();
          setIsMinting(false);
          setIsMintSuccess(true);
        } else {
          setIsMintFailed(true);
          setIsMinting(false);
        }
      }
    } catch (error) {
      setIsMintFailed(true);
      setIsMinting(false);
    }
  }

  return (
    <Box
      _after={{
        content: '""',
        bgImage: "url('/images/wallPaper.png')",
        bgSize: "cover",
        pos: "absolute",
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        opacity: 0.9,
      }}
    >
      <NavBar />
      <Container mt="10" centerContent>
        {isMintSuccess ? (
          <Text
            textAlign="center"
            fontSize={isMobile ? "24px" : "36px"}
            letterSpacing="-5.5%"
          >
            {" "}
            Mint Success!
          </Text>
        ) : (
          <Text
            textAlign="center"
            fontSize={isMobile ? "24px" : "36px"}
            letterSpacing="-5.5%"
          >
            {" "}
            Congratulations. {<br />}
            Sleep is your partner in life and you have the opportunity to have
            the best sleep possible.
          </Text>
        )}
        <Image
          src={Room}
          width={isMobile ? "300px" : "500px"}
          height={isMobile ? "300px" : "500px"}
        />
        {isConnected ? (
          <div>
            <Flex
              justify="center"
              padding="10px 10px 10px 10px"
              marginTop="10px"
            >
              <NumberInput
                size={isMobile ? "md" : "md"}
                onChange={(mintAmount) => setMintAmount(mintAmount)}
                value={mintAmount}
                defaultValue={1}
                marginEnd="10px"
                fontSize="20px"
                max={MAX_MINT_LIMIT - currentMintAmount}
                min={1}
              >
                <NumberInputField
                  placeholder="0"
                  readOnly
                  border="none"
                  width="70px"
                  backgroundColor={"#B175FF4A"}
                  textAlign="center"
                  fontFamily="Inter Medium"
                  textColor="#FFFFFF"
                  fontSize="20px"
                  borderRadius="10px"
                  padding="15px"
                />
                <NumberInputStepper>
                  <NumberIncrementStepper color="#FFFFFF" />
                  <NumberDecrementStepper color="#FFFFFF" />
                </NumberInputStepper>
              </NumberInput>
              <Button
                isLoading={isMinting}
                isDisabled={!isMintEligible}
                width={isMobile ? "100px" : "200px"}
                border="none"
                backgroundColor="#B175FF"
                borderRadius="10px"
                color="white"
                cursor="pointer"
                fontFamily="Inter"
                fontSize="20px"
                padding="15px"
                onClick={handleMint}
              >
                Mint
              </Button>
            </Flex>
          </div>
        ) : (
          <ConnectButton label="Connect to wallet" icon="" />
        )}
        {isMinting ? (
          <Text padding="15px 15px">
            This can take a few minutes depending on your gas fee...
          </Text>
        ) : null}
        {
          /* {JSON.stringify(nftMetadata) !== "{}"*/ true ? (
            <Box
              w={isMobile ? "300" : "500px"}
              p="4"
              m="6"
              rounded="md"
              bgColor="#53329C"
            >
              <Flex>
                <Text color="gray.300" pe="20">
                  Asset id
                </Text>
                <Spacer />
                <Text>{tokenId}</Text>
              </Flex>
              <Flex>
                <Text color="gray.300">Current price</Text>
                <Spacer />
                <Image
                  src={BNB}
                  width={isMobile ? "25px" : "25px"}
                  height={isMobile ? "5px" : "5px"}
                />
                <Text ps="5px">{nftMetadata.price} BNB</Text>
              </Flex>
              <Flex>
                <Text color="gray.300">Description</Text>
                <Spacer />
                <Text>{nftMetadata.description}</Text>
              </Flex>
              <Text pt="1">
                Using this NFT, you can participate in LOGOUT games and need to
                sleep better to increase your NFT level.
              </Text>
            </Box>
          ) : null
        }
      </Container>
    </Box>
  );
}
