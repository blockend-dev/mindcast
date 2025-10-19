// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MindCastRegistry {
    struct Episode {
        address creator;
        string title;
        string audioURI;
        string transcriptURI;
        string summary;
        string tags;
        uint256 timestamp;
        uint256 tipAmount;
    }
    
    Episode[] public episodes;
    mapping(address => uint256[]) public creatorEpisodes;
    mapping(address => uint256) public creatorTips;
    
    event EpisodeCreated(
        uint256 indexed episodeId,
        address indexed creator,
        string title,
        uint256 timestamp
    );
    
    event TipSent(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    
    function createEpisode(
        string memory _title,
        string memory _audioURI,
        string memory _transcriptURI,
        string memory _summary,
        string memory _tags
    ) external {
        uint256 episodeId = episodes.length;
        
        episodes.push(Episode({
            creator: msg.sender,
            title: _title,
            audioURI: _audioURI,
            transcriptURI: _transcriptURI,
            summary: _summary,
            tags: _tags,
            timestamp: block.timestamp,
            tipAmount: 0
        }));
        
        creatorEpisodes[msg.sender].push(episodeId);
        
        emit EpisodeCreated(episodeId, msg.sender, _title, block.timestamp);
    }
    
    function tipCreator(uint256 _episodeId) external payable {
        require(_episodeId < episodes.length, "Episode does not exist");
        require(msg.value > 0, "Tip amount must be greater than 0");
        
        address creator = episodes[_episodeId].creator;
        episodes[_episodeId].tipAmount += msg.value;
        creatorTips[creator] += msg.value;
        
        (bool sent, ) = creator.call{value: msg.value}("");
        require(sent, "Failed to send tip");
        
        emit TipSent(msg.sender, creator, msg.value);
    }
    
    function getEpisodesByCreator(address _creator) external view returns (uint256[] memory) {
        return creatorEpisodes[_creator];
    }
    
    function getEpisode(uint256 _episodeId) external view returns (Episode memory) {
        require(_episodeId < episodes.length, "Episode does not exist");
        return episodes[_episodeId];
    }
    
    function getTotalEpisodes() external view returns (uint256) {
        return episodes.length;
    }
}