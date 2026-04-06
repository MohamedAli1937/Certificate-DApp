import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying CertificateVerification contract...\n");

  const connection = await network.connect();
  const { ethers } = connection;

  const CertificateVerification = await ethers.getContractFactory("CertificateVerification");
  const contract = await CertificateVerification.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ CertificateVerification deployed to: ${contractAddress}`);

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "CertificateVerification.sol",
    "CertificateVerification.json"
  );

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const configContent = `
const CONTRACT_ADDRESS = "${contractAddress}";

const CONTRACT_ABI = ${JSON.stringify(artifact.abi, null, 2)};
`;

  const configPath = path.join(__dirname, "..", "frontend", "config.js");

  const frontendDir = path.dirname(configPath);
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(configPath, configContent);
  console.log(`📄 Frontend config written to: frontend/config.js`);

  const [deployer] = await ethers.getSigners();
  console.log(`\n── Deployment Summary ──`);
  console.log(`   Network:  localhost`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`\n🎉 Done!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
