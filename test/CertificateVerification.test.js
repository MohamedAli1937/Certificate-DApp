import { network } from "hardhat";
import { expect } from "chai";

describe("CertificateVerification", function () {
  let contract;
  let owner;
  let otherUser;
  let ethers;

  beforeEach(async function () {
    const connection = await network.connect();
    ethers = connection.ethers;
    [owner, otherUser] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateVerification");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("should start with zero certificates", async function () {
      expect(await contract.totalCertificates()).to.equal(0);
    });
  });

  describe("Issuing Certificates", function () {
    it("should allow the owner to issue a certificate", async function () {
      await contract.issueCertificate("STU001", "Alice Johnson", "Blockchain 101", "A");

      const [name, course, grade, issueDate, revoked] = await contract.verifyCertificate("STU001");

      expect(name).to.equal("Alice Johnson");
      expect(course).to.equal("Blockchain 101");
      expect(grade).to.equal("A");
      expect(revoked).to.equal(false);
      expect(issueDate).to.be.gt(0);
    });

    it("should increment totalCertificates", async function () {
      await contract.issueCertificate("STU001", "Alice", "Course A", "A");
      await contract.issueCertificate("STU002", "Bob", "Course B", "B+");
      expect(await contract.totalCertificates()).to.equal(2);
    });

    it("should emit CertificateIssued event", async function () {
      await expect(contract.issueCertificate("STU001", "Alice", "Blockchain 101", "A")).to.emit(
        contract,
        "CertificateIssued"
      );
    });

    it("should reject duplicate student IDs", async function () {
      await contract.issueCertificate("STU001", "Alice", "Course A", "A");

      await expect(contract.issueCertificate("STU001", "Bob", "Course B", "B")).to.be.revertedWith(
        "Certificate already exists for this student ID"
      );
    });

    it("should reject empty student ID", async function () {
      await expect(contract.issueCertificate("", "Alice", "Course A", "A")).to.be.revertedWith(
        "Student ID cannot be empty"
      );
    });

    it("should reject empty student name", async function () {
      await expect(contract.issueCertificate("STU001", "", "Course A", "A")).to.be.revertedWith(
        "Student name cannot be empty"
      );
    });

    it("should prevent non-owner from issuing", async function () {
      await expect(contract.connect(otherUser).issueCertificate("STU001", "Alice", "Course", "A")).to.be.revertedWith(
        "Only admin can perform this action"
      );
    });
  });

  describe("Verifying Certificates", function () {
    it("should revert for non-existent certificate", async function () {
      await expect(contract.verifyCertificate("FAKE_ID")).to.be.revertedWith("Certificate does not exist");
    });

    it("should allow anyone to verify a certificate", async function () {
      await contract.issueCertificate("STU001", "Alice", "Course A", "A");

      const [name] = await contract.connect(otherUser).verifyCertificate("STU001");
      expect(name).to.equal("Alice");
    });
  });

  describe("Revoking Certificates", function () {
    beforeEach(async function () {
      await contract.issueCertificate("STU001", "Alice", "Course A", "A");
    });

    it("should allow owner to revoke a certificate", async function () {
      await contract.revokeCertificate("STU001");
      const [, , , , revoked] = await contract.verifyCertificate("STU001");
      expect(revoked).to.equal(true);
    });

    it("should emit CertificateRevoked event", async function () {
      await expect(contract.revokeCertificate("STU001")).to.emit(contract, "CertificateRevoked");
    });

    it("should reject revoking a non-existent certificate", async function () {
      await expect(contract.revokeCertificate("FAKE_ID")).to.be.revertedWith("Certificate does not exist");
    });

    it("should reject double revocation", async function () {
      await contract.revokeCertificate("STU001");
      await expect(contract.revokeCertificate("STU001")).to.be.revertedWith("Certificate is already revoked");
    });

    it("should prevent non-owner from revoking", async function () {
      await expect(contract.connect(otherUser).revokeCertificate("STU001")).to.be.revertedWith(
        "Only admin can perform this action"
      );
    });
  });

  describe("Certificate Hash", function () {
    it("should return consistent hash for the same certificate", async function () {
      await contract.issueCertificate("STU001", "Alice", "Course A", "A");

      const hash1 = await contract.getCertificateHash("STU001");
      const hash2 = await contract.getCertificateHash("STU001");
      expect(hash1).to.equal(hash2);
    });

    it("should revert for non-existent certificate", async function () {
      await expect(contract.getCertificateHash("FAKE_ID")).to.be.revertedWith("Certificate does not exist");
    });
  });
});
