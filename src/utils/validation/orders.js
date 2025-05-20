export const validateOrder = (order) => {
    const errors = {};
    
    if (!order.symbol) {
      errors.symbol = 'Symbol is required';
    }
    
    if (!order.quantity || order.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    if (order.type === 'LIMIT' && !order.price) {
      errors.price = 'Price is required for limit orders';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };