# CertChain

CertChain is a decentralized application (dApp) for issuing, verifying, and revoking tamper-proof certificates on the Ethereum blockchain. Built with React, Vite, and ethers.js, it interacts with a Solidity smart contract to ensure the authenticity and permanence of educational or professional credentials.

## Features

- **Web3 Integration:** Connect via MetaMask to interact with the blockchain.
- **Verify Certificates:** Anyone can enter a Certificate ID to verify its validity, issuer, and student details on-chain.
- **Issue Certificates:** Authorized issuers can create new certificates.
- **Revoke Certificates:** Authorized issuers can revoke existing certificates, making them permanently invalid on-chain.
- **Admin Panel:** The contract owner can manage authorized issuers (add/remove).
- **Public Records:** View a list of all issued certificates directly from the blockchain's events.

## Tech Stack

- **Frontend:** React, Vite, CSS
- **Web3:** ethers.js (v6)
- **Smart Contract:** Solidity (Deployed on an Ethereum EVM compatible network)

## Getting Started

### Prerequisites
- Node.js
- MetaMask extension installed in your browser

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the provided local URL (usually `http://localhost:5173`).

### Usage
- **Connecting:** Click "Connect MetaMask" to link your Web3 wallet.
- **Verifying:** Use the "Verify" tab to check a certificate's authenticity.
- **Issuing (Authorized Only):** Navigate to the "Issue" tab to create a certificate. Requires a small amount of ETH for gas fees.
