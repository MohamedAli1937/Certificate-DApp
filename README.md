# <img src="frontend/assets/logo.png" width="40" height="40" style="vertical-align: middle; margin-right: 10px;"> CertChain

> A decentralized application for issuing and verifying academic certificates on the Ethereum blockchain.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Hardhat](https://img.shields.io/badge/Hardhat-v3-yellow)](https://hardhat.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-darkgray)](https://soliditylang.org/)
[![Ethers](https://img.shields.io/badge/Ethers.js-v6-blue)](https://docs.ethers.org/v6/)

---

## Architecture

![Architecture of CertChain DApp](assets/architecture.png)

---

## Application Flow

![Application Flow of CertChain DApp](assets/flow.png)

---

## Tech Stack

| Layer                 | Technology                     |
| --------------------- | ------------------------------ |
| **Smart Contract**    | Solidity 0.8.20                |
| **Blockchain Engine** | Hardhat v3 (ES Modules)        |
| **Frontend UI**       | Vanilla HTML5 / Modern CSS3    |
| **Logic Layer**       | Vanilla JS (ES13+)             |
| **Wallet Bridge**     | Ethers.js v6 (CDN)             |
| **Utils**             | jsPDF, QRCode.js, Html5-QRCode |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MetaMask](https://metamask.io/) browser extension

---

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

_Note: This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded accounts._

### 5. Deploy the Contract

In a **new** terminal:

```bash
npm run deploy
```

_Note: This deploys the contract and auto-generates `frontend/config.js` with the contract address and ABI._

### 6. Configure MetaMask

1. Open MetaMask > **Settings** > **Networks** > **Add Network** > **Add a network manually**
2. Enter the following details:
   - **Network Name:** Hardhat Local
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `1337` (or `31337` if MetaMask prompts an error)
   - **Currency Symbol:** `ETH`
3. Save and switch to the new network
4. Click your account icon > **Import Account**
5. Paste a private key from the `npm run node` output (Account #0 is the admin account)

### 7. Start Frontend

```bash
npm run serve
```

Open `http://127.0.0.1:3000` in your browser.

---

## Usage

### Admin Panel (Authority)

- **Connect Wallet**: Use the account that deployed the contract.
- **Issue**: Enter Student ID, Name, Course, and Grade. Confirm transaction in MetaMask.
- **QR Modal**: Upon success, a QR code is generated. Download it for the student.
- **Revoke**: Change certificate status to "Revoked" instantly if needed.

### Verification Panel (Public)

- **Manual Check**: Search by Student ID to pull live blockchain data.
- **Scanner**: Use your camera to scan a physical/digital QR code for instant lookup.
- **Download**: Generate a high-fidelity PDF certificate for valid credentials.

---

![Admin Panel of CertChain DApp](assets/admin.png)
![Verification Panel of CertChain DApp](assets/verify.png)
![Certificate of CertChain DApp](assets/cert.png)

## Project Structure

```text
Certificate-DApp/
├── contracts/
│   └── CertificateVerification.sol     # Smart contract logic
├── scripts/
│   └── deploy.js                       # Deployment automation script
├── test/
│   └── CertificateVerification.test.js # Comprehensive unit tests
├── frontend/
│   ├── assets/                         # Branding images and icons
│   │   ├── logo.png                    # Primary logo
│   │   └── logo_withoutbg.png          # Favicon/Clean logo
│   ├── index.html                      # Semantic UI structure
│   ├── index.css                       # Modern dark-mode styling
│   ├── app.js                          # Blockchain & UI interaction logic
│   └── config.js                       # Auto-generated contract config
├── assets/                             # Documentation diagrams
├── hardhat.config.js                   # Network & compiler configuration
└── package.json                        # Scripts and dependencies
```

---

## Smart Contract Functions

| Function                                    | Access     | Description                                 |
| ------------------------------------------- | ---------- | ------------------------------------------- |
| `issueCertificate(id, name, course, grade)` | Admin only | Stores a certificate on-chain               |
| `verifyCertificate(studentId)`              | Public     | Returns certificate data                    |
| `revokeCertificate(studentId)`              | Admin only | Marks certificate as revoked                |
| `getCertificateHash(studentId)`             | Public     | Returns keccak256 hash for tamper detection |
| `totalCertificates()`                       | Public     | Returns count of issued certificates        |

---

## Troubleshooting

**MetaMask nonce error after restarting the node:**
Navigate to MetaMask > Settings > Advanced > Clear activity tab data

**Contract not found errors:**
Re-deploy with `npm run deploy` after restarting `npm run node` to refresh the state

---

## Future Features

- **Multi-Admin Support**: Allow multiple universities or institutions to issue certificates securely
- **IPFS Integration**: Store certificate PDFs on IPFS and save the content hash on-chain
- **NFT Certificates (ERC-721)**: Mint each certificate as a transferable NFT directly reading in the student wallet
- **Network Deployment**: Establish pipelines for Sepolia or Ethereum mainnet deployment
- **Batch Issuance**: Support CSV uploads to issue multiple certificates in a single transaction
- **Extended Fields**: Support institution name, date of birth, category, and expiry metadata
- **Event Dashboard**: Trace full timelines of all on-chain issuance and revocation events
- **Email Notifications**: Dispatch updates to students automatically upon issuance or revocation

---

🤝 Contributions are welcome! Feel free to open an issue or submit a pull request.

## License

MIT
