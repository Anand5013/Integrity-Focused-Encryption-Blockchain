# Securing Medical Images using Integrity Focused Encryption and Blockchain Technology

A secure medical image management system leveraging steganography, encryption, IPFS, and blockchain for enhanced privacy and integrity.

## System Overview

The project consists of three main components:

### Frontend (React.js)

- User interface for patients and administrators
- Image processing and blockchain interaction
- Located in [frontend/](frontend/) directory

### Backend (Node.js)

- REST API for authentication and file operations
- Middleware for authorization
- Located in [backend/](backend/) directory

### Blockchain (Solidity)

- Smart contracts for access control
- Located in [blockchain/](blockchain/) directory

## Key Features

- **Image Steganography**: Hide sensitive medical images within cover images
- **AES Encryption**: Secure image storage using encryption
- **IPFS Storage**: Distributed storage for redundancy and availability
- **Blockchain Records**: Immutable tracking using Ethereum smart contracts
- **Role-based Access**: Separate interfaces for patients/admins
- **MetaMask Integration**: Secure wallet-based authentication

## Prerequisites

- Node.js v14+
- MongoDB
- IPFS node
- MetaMask wallet
- Ganache (for local blockchain)

## Installation

```sh
# Install all dependencies
npm run install-all

# Start development servers
npm start
```

## Configuration

Create environment files:

`frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BLOCKCHAIN_NETWORK_ID=1337
```

`backend/.env`:

```
MONGODB_URI=mongodb://localhost:27017/medical_db
JWT_SECRET=your_jwt_secret
ADMIN_WALLET_ADDRESS=your_admin_address
```

## Security Features

- JWT authentication
- Role-based access control
- AES-256 encryption
- Blockchain verification
- Secure IPFS storage
- Image steganography
- MetaMask wallet integration

## API Endpoints

- `/api/auth/*` - Authentication routes
- `/api/images/*` - Image processing routes
- `/api/blockchain/*` - Smart contract interaction
- `/api/ipfs/*` - IPFS storage operations

## Author

Anand
