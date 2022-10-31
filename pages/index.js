import { useAccount, ConnectButton, connector } from "@web3modal/react";
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
import Image from "next/image";
import boostNFT from "./BoostNFT.json";

const boostNFTAddress = "0xd2ccfC2d6522b77eA77ADa25dEf7Bd8C7ba629F1";

const baseURL =
  "https://gateway.pinata.cloud/ipfs/QmVV9wxKn4QhucX4R6dwujwdx3eMYkZAuMVbyKLEaeF3Zq/";

const baseExtension = ".json";

const METADATA_ID = 2;

const MAX_MINT_LIMIT = 4;

// const tokenPrices = [0.024, 0.024, 0.072, 0.14, 0.22];
const tokenPrices = [0, 0, 0, 0, 0];

const rarityDescription = [
  "Common",
  "Uncommon",
  "Rare",
  "Super Rare",
  "Legendary",
  "SG",
];

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
  const [nftMetadata, setNftMetadata] = useState([{}]);
  const nfts = [];

  useEffect(() => {
    if (isConnected) {
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

  function getNFTPrice() {
    let totalPrice = 0;
    for (let i = 0; i < mintAmount; i++) {
      totalPrice += tokenPrices[i];
    }
    totalPrice += 0.00001;
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
        console.log("isMinted", data.data[0].isMinted);
        console.log("amount", data.data[0].amount);
        setCurrentMintAmount(data.data[0].amount);
        setIsMintEligible(
          true
          // !data.data[0].isMinted
        );
      });
  }

  async function updateMintStatus() {
    fetch("/api/updateMintStatus", {
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
        console.log("Mint data saved");
      });
  }

  async function getNFTMetadata(id, rarity) {
    const res = await fetch(baseURL + id + baseExtension);
    if (res.status === 200) {
      const data = await res.json();
      const imageUrl = data.image.replace("ipfs://", "https://ipfs.io/ipfs/");
      const newData = {
        ...data,
        id,
        rarity: rarityDescription[rarity],
        image: imageUrl,
      };
      return newData;
    } else {
      console.log(res);
      return null;
    }
  }

  async function handleMint() {
    const signer = await connector.getSigner();
    const contract = new ethers.Contract(boostNFTAddress, boostNFT.abi, signer);
    try {
      setNftMetadata([{}]);
      setIsMinting(true);
      setIsMintFailed(false);
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
        let id = 0;
        for (let i = 0; i < mintAmount; i++) {
          id = i + 1;
          ids.push(BigNumber.from(id));
        }
        response = await contract.multiSafeMint(address, ids, {
          value: ethers.utils.parseEther(getNFTPrice().toString()),
        });
        const tx = await response.wait();

        if (tx.status === 1) {
          for (let i = 0; i < mintAmount; i++) {
            let event = tx.events[i];
            let value = event.args[2];
            const tokenId = value.toNumber();
            const data = await contract.getData(BigNumber.from(tokenId));
            const newData = await getNFTMetadata(id, data.rarity);
            nfts.push(newData);
          }
          setNftMetadata(nfts);
          updateMintStatus();
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
        if (tx.status === 1) {
          let event = tx.events[0];
          let value = event.args[2];
          const tokenId = value.toNumber();
          const data = await contract.getData(BigNumber.from(tokenId));
          const newData = await getNFTMetadata(METADATA_ID, data.rarity);
          setNftMetadata([newData]);
          updateMintStatus();
          setIsMinting(false);
          setIsMintSuccess(true);
        } else {
          setIsMintFailed(true);
          setIsMinting(false);
        }
      }
    } catch (error) {
      console.log(error);
      setIsMintFailed(true);
      setIsMinting(false);
    }
  }

  return (
    <>
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
          zIndex: -1,
        }}
      >
        <NavBar />
        <Container p="10" centerContent>
          {isMintSuccess ? (
            <Text
              textAlign="center"
              fontSize={isMobile ? "24px" : "36px"}
              letterSpacing="-5.5%"
            >
              Mint Success!
            </Text>
          ) : (
            <Text
              textAlign="center"
              fontSize={isMobile ? "24px" : "36px"}
              letterSpacing="-5.5%"
            >
              Congratulations. {<br />}
              Sleep is your partner in life and you have the opportunity to have
              the best sleep possible.
            </Text>
          )}
          {nftMetadata.map((metadata) => (
            <>
              <Container centerContent p="5">
                <Image
                  // src="https://ipfs.io/ipfs/QmYZPnxXZS3tNTj75is2853rxv85wToiFfZ2M3ZQhmb2i4/%E3%82%B7%E3%83%A7%E3%83%BC%E3%83%88%E3%82%B9%E3%83%AA%E3%83%BC%E3%83%91%E3%83%BC.jpg"
                  src={metadata.image ? metadata.image : Room}
                  width={isMobile ? "300px" : "500px"}
                  height={isMobile ? "300px" : "500px"}
                />
              </Container>
              {isConnected ? (
                isMintSuccess ? (
                  <Button
                    readOnly
                    width={"200px"}
                    mt={isMobile ? "1" : "5"}
                    border="none"
                    backgroundColor="#B175FF"
                    borderRadius="10px"
                    color="white"
                    cursor="pointer"
                    fontFamily="Inter"
                    fontSize="20px"
                    padding="15px"
                  >
                    {metadata.rarity} #{metadata.id}
                  </Button>
                ) : (
                  <Flex justify="center" padding="10">
                    <NumberInput
                      size={"md"}
                      onChange={(mintAmount) => setMintAmount(mintAmount)}
                      value={mintAmount}
                      defaultValue={1}
                      isDisabled={isMinting}
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
                      isActive={false}
                      isDisabled={!isMintEligible}
                      width={isMobile ? "150px" : "200px"}
                      border="none"
                      backgroundColor="#B175FF"
                      borderRadius="10px"
                      color="white"
                      cursor="pointer"
                      fontFamily="Inter"
                      fontSize="20px"
                      padding={isMobile ? "5" : "15"}
                      onClick={handleMint}
                    >
                      Mint
                    </Button>
                  </Flex>
                )
              ) : (
                <ConnectButton label="Connect to wallet" icon="" />
              )}
              {isMinting ? (
                <Text padding={isMobile ? "2" : "15"} textAlign="center">
                  This may take a few minutes depending on your gas fee...
                </Text>
              ) : null}
              {JSON.stringify(metadata) !== "{}" ? (
                <Box
                  w={isMobile ? "400" : "500"}
                  p={isMobile ? "4" : "4"}
                  m={isMobile ? "0" : "10"}
                  mt={isMobile ? "5" : "10"}
                  rounded="md"
                  bgColor="#53329C"
                >
                  <Flex>
                    <Text color="gray.300" pe="20">
                      Asset id
                    </Text>
                    <Spacer />
                    <Text>{metadata.id}</Text>
                  </Flex>
                  <Flex>
                    <Text color="gray.300">Current price</Text>
                    <Spacer />
                    <Image
                      src={BNB}
                      width={"25px"}
                      height={isMobile ? "2px" : "5px"}
                    />
                    <Text ps="5px">{metadata.price}</Text>
                  </Flex>
                  <Flex>
                    <Text color="gray.300">Description</Text>
                    <Spacer />
                    <Text>{metadata.description}</Text>
                  </Flex>
                  <Text pt="1">
                    Using this NFT, you can participate in LOGOUT games and need
                    to sleep better to increase your NFT level.
                  </Text>
                </Box>
              ) : null}
              )
            </>
          ))}
        </Container>
      </Box>
    </>
  );
}
