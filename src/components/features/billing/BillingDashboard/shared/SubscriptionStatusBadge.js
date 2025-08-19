import React from 'react';
import { Badge } from '@chakra-ui/react';

const SubscriptionStatusBadge = ({ status, isLifetime = false, size = "sm" }) => {
  const getStatusProps = () => {
    if (isLifetime) {
      return {
        bg: "purple.500",
        color: "white",
        text: "Lifetime"
      };
    }

    switch (status?.toLowerCase()) {
      case 'active':
        return {
          bg: "green.500",
          color: "white",
          text: "Active"
        };
      case 'trialing':
        return {
          bg: "yellow.500",
          color: "white",
          text: "Trial"
        };
      case 'past_due':
        return {
          bg: "orange.500",
          color: "white",
          text: "Past Due"
        };
      case 'canceled':
      case 'cancelled':
        return {
          bg: "red.500",
          color: "white",
          text: "Canceled"
        };
      case 'incomplete':
        return {
          bg: "gray.500",
          color: "white",
          text: "Incomplete"
        };
      case 'unpaid':
        return {
          bg: "red.600",
          color: "white",
          text: "Unpaid"
        };
      default:
        return {
          bg: "gray.500",
          color: "white",
          text: status || "Unknown"
        };
    }
  };

  const statusProps = getStatusProps();

  return (
    <Badge
      bg={statusProps.bg}
      color={statusProps.color}
      fontSize={size === "xs" ? "xs" : "sm"}
      px={2}
      py={1}
      borderRadius="md"
      textTransform="capitalize"
    >
      {statusProps.text}
    </Badge>
  );
};

export default SubscriptionStatusBadge;