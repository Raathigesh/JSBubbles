import React from "react";
import { Flex } from "@chakra-ui/core";
import { ResizableBox } from "react-resizable";

export default function WidgetFrame({
  title,
  subTitle,
  Icon,
  height,
  width,
  children,
  mb
}: any) {
  return (
    <Flex mb={mb}>
      <ResizableBox
        handle={
          <Flex
            width="100%"
            height="8px"
            backgroundColor="#f4f4f4"
            cursor="ns-resize"
            alignItems="center"
            justifyContent="center"
          >
            <svg
              width="24"
              height="6"
              viewBox="0 0 44 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect y="12" width="34" height="1.5" fill="gray" />
              <rect width="34" height="1.5" fill="gray" />
              <rect y="6" width="34" height="1.5" fill="gray" />
            </svg>
          </Flex>
        }
        axis="y"
        width={width}
        height={height}
        draggableOpts={{}}
      >
        <Flex
          backgroundColor="#F9F9F9"
          direction="column"
          height="100%"
          borderStyle="solid"
        >
          <Flex borderRadius="3px" padding="8px" alignItems="center">
            <Flex
              borderRadius="5px"
              backgroundColor="#5935B7"
              padding="9px"
              mr="3px"
            >
              <Icon size={14} color="#F9F9F9" />
            </Flex>
            <Flex flexDirection="column">
              <Flex ml="5px" fontSize="13px" fontWeight={700} color="#5935B7">
                {title}
              </Flex>
              <Flex ml="5px" fontSize="11px" color="gray">
                {subTitle}
              </Flex>
            </Flex>
          </Flex>
          <Flex padding="8px" direction="column" overflow="auto">
            {children}
          </Flex>
        </Flex>
      </ResizableBox>
    </Flex>
  );
}
