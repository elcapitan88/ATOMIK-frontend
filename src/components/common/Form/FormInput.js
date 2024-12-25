import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  FormHelperText,
  InputGroup,
  InputLeftElement,
  InputRightElement
} from '@chakra-ui/react';

const FormInput = ({
  label,
  value,
  onChange,
  error,
  helperText,
  type = 'text',
  leftElement,
  rightElement,
  isRequired,
  isDisabled,
  ...props
}) => {
  return (
    <FormControl 
      isInvalid={!!error}
      isRequired={isRequired}
      isDisabled={isDisabled}
    >
      {label && (
        <FormLabel color="whiteAlpha.900" fontSize="sm">{label}</FormLabel>
      )}
      <InputGroup>
        {leftElement && (
          <InputLeftElement color="whiteAlpha.600">
            {leftElement}
          </InputLeftElement>
        )}
        <Input
          type={type}
          value={value}
          onChange={onChange}
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color="white"
          _hover={{ borderColor: "whiteAlpha.300" }}
          _focus={{ 
            borderColor: "rgba(0, 198, 224, 0.6)",
            boxShadow: "0 0 0 1px rgba(0, 198, 224, 0.6)"
          }}
          {...props}
        />
        {rightElement && (
          <InputRightElement color="whiteAlpha.600">
            {rightElement}
          </InputRightElement>
        )}
      </InputGroup>
      {error ? (
        <FormErrorMessage>{error}</FormErrorMessage>
      ) : helperText ? (
        <FormHelperText color="whiteAlpha.600">{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

export default FormInput;