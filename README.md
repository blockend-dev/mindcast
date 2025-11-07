# 🎙️ MindCast - Decentralized Podcast Platform

![MindCast](https://img.shields.io/badge/MindCast-Decentralized_Podcasting-blue)
![0G](https://img.shields.io/badge/Powered_by-0G_Mainnet-black)
![Web3](https://img.shields.io/badge/Web3-Enabled-green)
![Live](https://img.shields.io/badge/Mainnet-Live-success)

A revolutionary decentralized podcasting platform where creators can record, upload, and publish voice content that's analyzed, summarized, and stored entirely on-chain via the 0G stack. Featuring a complete token economy with creator monetization and listener rewards.

## 🌟 Features

### 🎤 For Creators
- **Record & Upload**: High-quality audio recording directly in the browser
- **AI-Powered Analysis**: Automatic summary and topic generation using 0G Inference
- **On-Chain Storage**: All content stored permanently on 0G decentralized storage
- **Token Monetization**: Earn MIND tokens for content creation and engagement
- **Direct Tipping**: Receive crypto tips from listeners
- **Proof of Authorship**: Immutable on-chain proof of content creation
- **Revenue Dashboard**: Track earnings and listener metrics in real-time

### 🎧 For Listeners
- **Stream from 0G**: Direct streaming from decentralized storage
- **AI Summaries**: Quick understanding of episode content
- **On-Chain Verification**: Verify creator authenticity
- **Earn Rewards**: Get MIND tokens for engagement and discovery
- **Support Creators**: Direct tipping and token rewards
- **Personalized Feeds**: AI-curated content based on preferences

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with premium dark theme
- **Web3 Integration**: Wagmi + RainbowKit for wallet connection
- **Audio**: Web Audio API for recording and playback
- **UI Components**: Custom design system with modern aesthetics

### Smart Contract Ecosystem
- **Blockchain**: 0G Chain Mainnet (EVM-compatible)
- **MindCastRegistry**: Podcast episode management and tipping
- **MindCastToken**: ERC-20 token for platform economy
- **Staking Contract**: Token staking for premium features

### Storage & AI
- **Storage**: 0G Storage Mainnet for decentralized file storage
- **AI Inference**: 0G Inference for content analysis
- **Multi-format Support**: WAV, MP3, WebM, FLAC audio formats

### Data Flow
1. 🎙️ Creator records audio in browser
2. 📦 Audio uploaded to 0G Storage Mainnet
3. 🧠 AI analyzes content via 0G Inference
4. 💰 Token rewards distributed to creator
5. ⛓️ Metadata published to 0G Chain Mainnet
6. 🎧 Listeners stream from decentralized storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet
- 0G mainnet ETH for gas fees

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/blockend-dev/mindcast.git
   cd mindcast
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_WC_PROJECT_ID=walletProjectID
   OG_RPC_URL=https://evmrpc.0g.ai
   INDEXER_RPC=https://indexer-storage-turbo.0g.ai
   T_PRIVATE_KEY=yourTestnetPrivateKey
   PRIVATE_KEY=yourMainnetPrivateKey


# WalletConnect
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 💰 Token Economy

### MindCast Token (MIND)
- **Symbol**: MIND
- **Total Supply**: 1,000,000,000
- **Type**: ERC-20 on 0G Chain

### Reward Distribution
```solidity
// Creator Rewards
- Episode Publishing: 100 MIND
- Listener Engagement: 10 MIND per 100 listens
- Premium Content: 50 MIND per subscriber

// Listener Rewards  
- Daily Engagement: 5 MIND
- Content Discovery: 2 MIND per new creator followed
- Social Sharing: 3 MIND per share
```

### Staking Benefits
- **Basic**: 100 MIND - Access to premium analytics
- **Pro**: 1,000 MIND - Early access to features + revenue share
- **Elite**: 10,000 MIND - Governance rights + platform dividends

## 📱 Usage

### Creating a Podcast Episode

1. **Connect Wallet**
   - Click "Connect Wallet" in top right
   - Approve connection in your wallet

2. **Record Audio**
   - Select your microphone
   - Click "Start Recording" 
   - Speak your podcast content
   - Click "Stop Recording" when done

3. **Add Episode Details**
   - Enter compelling episode title
   - Add relevant tags (comma separated)
   - Click "Generate AI Content"

4. **Review & Publish**
   - Review AI-generated summary and topics
   - Click "Publish to MindCast"
   - Confirm transaction in your wallet
   - **Receive 100 MIND tokens** for publishing
   - Wait for on-chain confirmation

### Listening & Earning

1. **Browse Episodes**
   - View all published episodes on main feed
   - Filter by creator or topics
   - **Earn 5 MIND daily** for active engagement

2. **Play Content**
   - Click play on any episode
   - Stream directly from 0G Storage
   - Read AI summary and topics

3. **Support & Earn**
   - Tip creators with MIND tokens
   - Share episodes to earn rewards
   - Discover new creators for bonus tokens

## 🔧 Technical Details

### Smart Contracts

#### MindCastRegistry.sol
```solidity
contract MindCastRegistry {
    struct Episode {
        address creator;
        string title;
        string audioURI;      // 0G Storage CID
        string transcriptURI; // AI analysis CID  
        string summary;       // AI-generated summary
        string tags;          // Comma-separated topics
        uint256 timestamp;
        uint256 tipAmount;
        uint256 listenerCount;
    }
    
    function createEpisode(...) external;
    function tipCreator(uint256 episodeId) external payable;
    function getEpisodesByCreator(address) external view returns (uint256[]);
}
```

#### MindCastToken.sol
```solidity
contract MindCastToken is ERC20, Ownable {
    mapping(address => uint256) public creatorRewards;
    mapping(address => uint256) public listenerRewards;
    
    function rewardCreator(address creator, uint256 amount) external;
    function rewardListener(address listener, uint256 amount) external;
    function stakeTokens(uint256 amount) external;
}
```

### File Structure
```
mindcast/
├── app/                    # Next.js app router
│   ├── (routes)/          # Route groups
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── audio-recorder.tsx
│   │   ├── podcast-player.tsx
│   │   └── token-dashboard.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useMindCastContract.ts
│   │   └── useTokenRewards.ts
│   ├── lib/             # Utility libraries
│   │   ├── 0g-inference.ts
│   │   ├── 0g-storage.ts
│   │   └── transcription.ts
│   └── api/             # API routes
│       ├── upload/      # File upload to 0G
│       ├── inference/   # AI processing
│       ├── publish/     # On-chain publishing
│       └── download/    # File retrieval
├── contracts/           # Solidity smart contracts
│   ├── MindCastRegistry.sol
│   ├── MindCastToken.sol
│   └── StakingContract.sol
├── wagmi-config/        # Web3 configuration
└── public/             # Static assets
```

### Key Technologies

- **Blockchain**: 0G Chain Mainnet, Ethers.js, Wagmi
- **Storage**: 0G Storage Mainnet, @0glabs/0g-ts-sdk
- **AI**: 0G Inference, OpenAI-compatible API
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Audio**: Web Audio API, MediaRecorder API
- **Wallet**: RainbowKit, MetaMask
- **Token**: ERC-20 standard with reward mechanics

## 🗺️ Roadmap

### 🎯 Phase 1: Foundation ✅ COMPLETED
- [x] Core podcasting platform on 0G Testnet
- [x] Basic audio recording and playback
- [x] 0G Storage integration
- [x] AI content analysis

### 🚀 Phase 2: Token Economy ✅ COMPLETED  
- [x] MindCastToken deployment on Mainnet
- [x] Creator reward system
- [x] Listener engagement rewards
- [x] Staking mechanisms
- [x] Full migration to 0G Mainnet

### 🌟 Phase 3: Growth 🟡 IN PROGRESS
- [ ] Mobile app (iOS & Android)
- [ ] Advanced AI features (chapter markers, highlights)
- [ ] Social features (comments, playlists)
- [ ] Cross-chain expansion

### 💎 Phase 4: Ecosystem ⏳ PLANNED
- [ ] DAO governance for platform decisions
- [ ] NFT collectibles for episodes
- [ ] Metaverse integration
- [ ] DeFi integrations for token utility


## 🔒 Security

### Audits & Verification
- **Smart Contract Audit**: Completed by ThirdWeb
- **Code Review**: Peer-reviewed by 0G core team
- **Penetration Testing**: Security firm assessment passed
### Security Features
- **Wallet Security**: Private keys never exposed client-side
- **Content Verification**: All content hashed and stored on-chain
- **Access Control**: Role-based smart contract permissions
- **Data Integrity**: Cryptographic verification of stored content
- **Economic Security**: Anti-sybil measures for token rewards



## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details.



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🎉 Join the Revolution

MindCast is more than a platform—it's a movement to decentralize audio content and empower creators worldwide. With our mainnet launch and complete token economy, we're building the future of podcasting where creators own their content, listeners are rewarded for engagement, and everyone benefits from the value they create.

**Ready to revolutionize podcasting? Join us today!**

*Built with ❤️ on 0G Mainnet - Decentralizing audio content, one podcast at a time.*
