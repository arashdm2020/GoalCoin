# 🎨 NFT System Implementation Guide

## Overview
Premium tier NFT system on Polygon testnet (Mumbai) for Founder tier users.

---

## 🎯 NFT Features

### Founder NFT Benefits
- **Exclusive Access:** Premium challenges & content
- **Burn Multiplier:** 2x burn rate on all activities
- **Governance Power:** 2 votes per wallet in DAO
- **Early Access:** New features before public release
- **Special Badge:** Unique profile badge

---

## 🔧 Technical Stack

### Smart Contract
- **Network:** Polygon Mumbai Testnet
- **Standard:** ERC-721
- **Framework:** Hardhat / Foundry
- **Language:** Solidity ^0.8.0

### Contract Features
```solidity
// GoalCoinFounderNFT.sol
contract GoalCoinFounderNFT is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public currentTokenId = 0;
    string public baseTokenURI;
    
    mapping(address => bool) public hasMinted;
    
    function mintFounderNFT(address to) external onlyOwner {
        require(currentTokenId < MAX_SUPPLY, "Max supply reached");
        require(!hasMinted[to], "Already minted");
        
        currentTokenId++;
        _safeMint(to, currentTokenId);
        hasMinted[to] = true;
    }
}
```

---

## 📊 Database Schema

```sql
CREATE TABLE nft_mints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  token_id INT NOT NULL,
  contract_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'mumbai',
  minted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(wallet_address, contract_address)
);

CREATE INDEX idx_nft_mints_user ON nft_mints(user_id);
CREATE INDEX idx_nft_mints_wallet ON nft_mints(wallet_address);
```

---

## 🚀 Implementation Steps

### Phase 1: Smart Contract
1. Write & test contract
2. Deploy to Mumbai testnet
3. Verify on Polygonscan
4. Setup minting backend

### Phase 2: Backend Integration
```typescript
// backend/src/services/nftService.ts
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.MUMBAI_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

export async function mintFounderNFT(userWallet: string) {
  const contract = new ethers.Contract(
    process.env.NFT_CONTRACT_ADDRESS,
    NFT_ABI,
    wallet
  );
  
  const tx = await contract.mintFounderNFT(userWallet);
  await tx.wait();
  
  return {
    txHash: tx.hash,
    tokenId: await contract.currentTokenId(),
  };
}
```

### Phase 3: API Endpoints
```typescript
POST /api/nft/mint
GET /api/nft/check/:wallet
GET /api/nft/metadata/:tokenId
```

---

## 💰 Cost Estimates

### Mumbai Testnet (Free)
- Gas: Free MATIC from faucet
- Deployment: ~$0
- Testing: Unlimited

### Mainnet (Future)
- Deployment: ~$50
- Per mint: ~$0.01-0.05
- Monthly: Depends on volume

---

## 🔐 Security

### Best Practices
- Admin wallet in secure vault
- Rate limiting on minting
- Whitelist verification
- Transaction monitoring
- Emergency pause function

---

## 📝 Metadata Example

```json
{
  "name": "GoalCoin Founder #123",
  "description": "Exclusive Founder NFT for GoalCoin ecosystem",
  "image": "ipfs://QmXxx.../founder-123.png",
  "attributes": [
    {
      "trait_type": "Tier",
      "value": "Founder"
    },
    {
      "trait_type": "Burn Multiplier",
      "value": "2x"
    },
    {
      "trait_type": "Voting Power",
      "value": "2"
    },
    {
      "trait_type": "Mint Date",
      "value": "2025-01-15"
    }
  ]
}
```

---

**Status:** Documentation complete, ready for Phase 2 implementation
