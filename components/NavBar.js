import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import Logout from "../public/images/logo.png";
import Image from "next/image";

const NavBar = () => {
  return (
    <Flex justify="start" align="center" padding="15px">
      <Image src={Logout} width="60px" height="60px" />
      <Text ps="5" fontSize="32px" color="#FFFFFF">
        Logout
      </Text>
    </Flex>
  );
};

export default NavBar;
