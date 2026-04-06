# CertChain — Blockchain Certificate Verification DApp

A decentralized application for issuing and verifying academic certificates on the Ethereum blockchain.

## Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Smart Contract | Solidity 0.8.20         |
| Framework      | Hardhat v3 (ES Modules) |
| Frontend       | Vanilla HTML / CSS / JS |
| Wallet Bridge  | Ethers.js v6 (CDN)      |
| Wallet         | MetaMask                |

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Compile the Smart Contract

```bash
npm run compile
```

### 3. Run Tests

```bash
npm run test
```

### 4. Start Local Blockchain

Open a terminal and keep it running:

```bash
npm run node
```

This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded accounts.

### 5. Deploy the Contract

In a **new** terminal:

```bash
npm run deploy
```

This deploys the contract and auto-generates `frontend/config.js` with the contract address and ABI.

### 6. Configure MetaMask

1. Open MetaMask → **Settings → Networks → Add Network → Add a network manually**
2. Enter:
   - **Network Name:** Hardhat Local
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `1337` (or `31337` if MetaMask complains about `1337`)
   - **Currency Symbol:** `ETH`
3. Save and switch to the new network
4. Click your account icon → **Import Account**
5. Paste a private key from the `npm run node` output (Account #0 is the admin)

### 7. Start Frontend

```bash
npm run serve
```

Open `http://127.0.0.1:3000` in your browser.

## Usage

### Admin (Contract Deployer)

1. Click **Connect Wallet** using the deployer account (Account #0)
2. Go to **Admin Panel** tab
3. Fill in Student ID, Name, Course, and Grade → click **Issue Certificate**
4. To revoke, enter the Student ID → click **Revoke Certificate**

### Anyone (Verification)

1. Go to **Verify Certificate** tab
2. Enter a Student ID → click **Verify**
3. The certificate details, validity status, and on-chain hash are displayed

## Project Structure

```
Certificate-DApp/
├── contracts/
│   └── CertificateVerification.sol    — Smart contract (issue, verify, revoke, hash)
├── scripts/
│   └── deploy.js                      — Deploys contract & generates frontend config
├── test/
│   └── CertificateVerification.test.js — 18 automated tests
├── frontend/
│   ├── index.html                     — Main UI (admin panel + verification portal)
│   ├── index.css                      — Dark-mode design system
│   ├── app.js                         — MetaMask + contract interaction logic
│   └── config.js                      — Auto-generated contract address & ABI
├── hardhat.config.js                  — Hardhat v3 config (ESM, chainId 1337)
├── package.json                       — Dependencies & npm scripts
├── .gitignore                         — Ignores node_modules, artifacts, cache
└── README.md
```

## Smart Contract Functions

| Function                                    | Access     | Description                                 |
| ------------------------------------------- | ---------- | ------------------------------------------- |
| `issueCertificate(id, name, course, grade)` | Admin only | Stores a certificate on-chain               |
| `verifyCertificate(studentId)`              | Public     | Returns certificate data                    |
| `revokeCertificate(studentId)`              | Admin only | Marks certificate as revoked                |
| `getCertificateHash(studentId)`             | Public     | Returns keccak256 hash for tamper detection |
| `totalCertificates()`                       | Public     | Returns count of issued certificates        |

## Troubleshooting

**MetaMask nonce error after restarting the node:**
Go to MetaMask → Settings → Advanced → Clear activity tab data

**Contract not found errors:**
Re-deploy with `npm run deploy` after restarting `npm run node` (new node = fresh state)

## Future Features

- **Multi-Admin Support** — Allow multiple universities/institutions to issue certificates using role-based access control
- **IPFS Integration** — Store certificate PDFs on IPFS and save only the content hash on-chain to reduce gas costs
- **NFT Certificates (ERC-721)** — Mint each certificate as a transferable NFT that appears in the student's wallet
- **Testnet / Mainnet Deployment** — Deploy to Sepolia or Ethereum mainnet using Infura/Alchemy providers
- **QR Code Verification** — Generate a QR code for each certificate that links directly to the verification page
- **Batch Issuance** — Allow admins to upload a CSV file to issue multiple certificates in a single transaction
- **Additional Certificate Fields** — Add institution name, date of birth, certificate type, and expiry date
- **Event History Dashboard** — Display a full timeline of all on-chain issuance and revocation events
- **Email Notifications** — Notify students via email when their certificate is issued or revoked
- **Export to PDF** — Generate a downloadable, styled PDF of the verified certificate with the on-chain hash

## License

MIT
