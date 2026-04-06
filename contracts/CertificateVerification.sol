// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateVerification {

    address public owner;
    uint256 public totalCertificates;

    struct Certificate {
        string studentId;
        string studentName;
        string courseName;
        string grade;
        uint256 issueDate;
        bool exists;
        bool revoked;
    }

    mapping(string => Certificate) private certificates;

    event CertificateIssued(
        string indexed studentId,
        string studentName,
        string courseName,
        string grade,
        uint256 issueDate
    );

    event CertificateRevoked(string indexed studentId, uint256 revokeDate);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCertificate(
        string memory _studentId,
        string memory _studentName,
        string memory _courseName,
        string memory _grade
    ) public onlyOwner {
        require(bytes(_studentId).length > 0, "Student ID cannot be empty");
        require(bytes(_studentName).length > 0, "Student name cannot be empty");
        require(bytes(_courseName).length > 0, "Course name cannot be empty");
        require(bytes(_grade).length > 0, "Grade cannot be empty");
        require(!certificates[_studentId].exists, "Certificate already exists for this student ID");

        certificates[_studentId] = Certificate({
            studentId: _studentId,
            studentName: _studentName,
            courseName: _courseName,
            grade: _grade,
            issueDate: block.timestamp,
            exists: true,
            revoked: false
        });

        totalCertificates++;

        emit CertificateIssued(
            _studentId,
            _studentName,
            _courseName,
            _grade,
            block.timestamp
        );
    }

    function revokeCertificate(string memory _studentId) public onlyOwner {
        require(certificates[_studentId].exists, "Certificate does not exist");
        require(!certificates[_studentId].revoked, "Certificate is already revoked");

        certificates[_studentId].revoked = true;

        emit CertificateRevoked(_studentId, block.timestamp);
    }

    function verifyCertificate(string memory _studentId)
        public
        view
        returns (
            string memory studentName,
            string memory courseName,
            string memory grade,
            uint256 issueDate,
            bool isRevoked
        )
    {
        require(certificates[_studentId].exists, "Certificate does not exist");

        Certificate memory cert = certificates[_studentId];
        return (
            cert.studentName,
            cert.courseName,
            cert.grade,
            cert.issueDate,
            cert.revoked
        );
    }

    function getCertificateHash(string memory _studentId)
        public
        view
        returns (bytes32)
    {
        require(certificates[_studentId].exists, "Certificate does not exist");

        Certificate memory cert = certificates[_studentId];
        return keccak256(
            abi.encodePacked(
                cert.studentId,
                cert.studentName,
                cert.courseName,
                cert.grade,
                cert.issueDate
            )
        );
    }
}
