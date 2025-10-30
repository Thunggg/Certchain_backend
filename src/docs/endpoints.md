## API Endpoints Overview

Base URL: http://localhost:3000/api/

### 1) Mint Certificate (SBT)

- Method: POST
- URL: `/certificate/mint`
- Auth: No
- Input (multipart/form-data):
  - owner: string (EVM address, required)
  - file: binary (image/pdf, required)
  - issuerName: string (optional)
  - certificateName: string (optional)
  - description: string (optional)
  - issueDate: string ISO-8601 (optional, not in the future)
  - recipientWallet: string (optional, EVM address)
- Output (200):

```json
{
  "code": 200,
  "message": "Certificate minted successfully",
  "status": 200,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "data": {
    "tokenId": "123",
    "publishedHash": "0x...",
    "originalHash": "0x...",
    "tokenURI": "https://res.cloudinary.com/.../metadata/abc.json",
    "transactionHash": "0x...",
    "qrUrl": "https://.../verify?tokenId=123&contract=0x...&chain=11155111&type=sbt",
    "qrImage": "data:image/png;base64,..."
  }
}
```

### 1b) Mint Creative (ERC-4907)

- Method: POST
- URL: `/creative/mint`
- Auth: No
- Input (multipart/form-data):
  - owner: string (EVM address, required)
  - issuerName: string (required)
  - file: binary (image/pdf, required)
  - title: string (optional)
  - description: string (optional)
- Output (200):

```json
{
  "code": 200,
  "message": "Creative minted successfully",
  "status": 200,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "data": {
    "tokenId": "123",
    "publishedHash": "0x...",
    "originalHash": "0x...",
    "tokenURI": "https://res.cloudinary.com/.../metadata/abc.json",
    "transactionHash": "0x...",
    "qrUrl": "",
    "qrImage": ""
  }
}
```

### 2) Verify by file upload

- Method: POST
- URL: `/certificate/verify`
- Auth: No
- Input (multipart/form-data):
  - tokenId (optional): number
  - file: binary
- Output (200):

```json
{
  "code": 200,
  "message": "Certificate verified successfully",
  "status": 200,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "data": {
    "tokenId": 123,
    "hash": "0x...",
    "typeHash": "published",
    "onChainMatch": true,
    "tokenURI": "https://.../metadata/abc.json"
  }
}
```

### 3) Verify by query (QR)

- Method: GET
- URL: `/certificate/verify`
- Auth: No
- Query:
  - tokenId: number (required)
  - contractAddress: string (required)
  - chainId: number (required)
  - type: sbt|4907 (optional)
  - sig: string (optional)
- Output (200):

```json
{
  "code": 200,
  "message": "Certificate verified successfully",
  "status": 200,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "data": {
    "tokenId": 123,
    "contractAddress": "0x...",
    "chainId": 11155111,
    "owner": "0x...",
    "tokenURI": "https://.../metadata/abc.json",
    "status": "verified"
  }
}
```

### Error Response Format

- Structure:

```json
{
  "code": 1000,
  "message": "Bad request",
  "status": 400,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "errors": [{ "field": "owner", "message": "Owner address is not valid", "value": "0x..." }]
}
```
