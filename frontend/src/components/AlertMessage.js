import React from 'react';
import { Alert } from 'react-bootstrap';

const AlertMessage = ({ variant, message, onClose, dismissible = true }) => {
  return (
    <Alert variant={variant} onClose={onClose} dismissible={dismissible}>
      {message}
    </Alert>
  );
};

export default AlertMessage;