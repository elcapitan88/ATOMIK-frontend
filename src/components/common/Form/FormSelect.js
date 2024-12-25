import React from 'react';
import { 
  FormControl, 
  FormLabel, 
  Select, 
  FormErrorMessage,
  FormHelperText
} from '@chakra-ui/react';

const FormSelect = ({ 
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  isRequired,
  isDisabled,
  placeholder = "Select option",
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
      <Select
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
        sx={{
          option: {
            bg: "gray.800",
            color: "white",
          }
        }}
        placeholder={placeholder}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error ? (
        <FormErrorMessage>{error}</FormErrorMessage>
      ) : helperText ? (
        <FormHelperText color="whiteAlpha.600">{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

export default FormSelect;