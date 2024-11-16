// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Market.sol";
// Position Token Contract

// Main Prediction Market Contract
contract AdvancedPredictionMarket is AccessControl {
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // Constants
    uint256 public constant CREATOR_FEE_PERCENTAGE = 20; // 2%
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 10; // 1%
    uint256 public constant DISPUTE_PERIOD = 3 days;
    uint256 public constant MIN_STAKE = 0.001 ether;
    uint256 public constant MAX_STAKE = 100 ether;

    // Enums
    enum MarketStatus {
        Active,
        Resolved,
        Disputed,
        Cancelled
    }
    enum OrderType {
        Market,
        Limit
    }
    enum DisputeStatus {
        None,
        Active,
        Resolved
    }

    // Structs
    struct UserPosition {
        uint256 yesTokens;
        uint256 noTokens;
        uint256 totalInvested;
        uint256[] limitOrders;
    }

    struct Profile {
        string username;
        string avatarIpfsHash;
        string bio;
        uint256 reputation;
        uint256[] createdMarkets;
        uint256[] participatedMarkets;
        uint256 totalProfits;
        uint256 creatorEarnings;
        bool isActive;
        bool isCreator;
        address[] followers;
        address[] following;
        mapping(uint256 => UserPosition) positions;
    }

    struct Market {
        string description;
        string category;
        string[] tags;
        uint256 endTime;
        uint256 resolutionTime;
        MarketStatus status;
        address creator;
        address yesToken;
        address noToken;
        uint256 yesPrice;
        uint256 noPrice;
        bool outcome;
        uint256 totalLiquidity;
        uint256 totalVolume;
        uint256 totalParticipants;
        uint256 creatorFees;
        uint256 platformFees;
        DisputeStatus disputeStatus;
        string imageIpfsHash;
        mapping(address => UserPosition) positions;
        mapping(address => bool) hasParticipated;
        mapping(uint256 => Comment) comments;
        uint256 commentCount;
        mapping(uint256 => LimitOrder) limitOrders;
        uint256 limitOrderCount;
    }

    struct Comment {
        address author;
        string content;
        uint256 timestamp;
        uint256[] replies;
        uint256 likes;
        mapping(address => bool) hasLiked;
    }

    struct LimitOrder {
        address creator;
        OrderType orderType;
        bool isYes;
        uint256 amount;
        uint256 targetPrice;
        bool isActive;
        uint256 timestamp;
    }

    struct MarketDispute {
        address disputer;
        string reason;
        uint256 stake;
        uint256 timestamp;
        mapping(address => bool) votes;
        uint256 yesVotes;
        uint256 noVotes;
        bool resolved;
    }

    // State Variables
    mapping(address => Profile) public profiles;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => MarketDispute) public disputes;
    mapping(string => uint256[]) public categoryToMarkets;
    mapping(string => bool) public verifiedCategories;
    mapping(address => bool) public verifiedCreators;
    address[] public verifiedCretorsList;
    string[] public categories;
    string[] public verifiedCategoriesList;
    uint256 private _marketIds;
    uint256 public minMarketDuration;
    uint256 public maxMarketDuration;
    uint256 public totalPlatformFees;
    uint256 public disputeResolutionThreshold;

    // Events
    event ProfileCreated(address indexed user, string username);
    event MarketCreated(uint256 indexed marketId, string description, address creator);
    event PositionTaken(uint256 indexed marketId, address user, bool isYes, uint256 amount);
    event PositionExited(uint256 indexed marketId, address user, bool isYes, uint256 amount, uint256 reward);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event DisputeCreated(uint256 indexed marketId, address disputer, string reason);
    event DisputeResolved(uint256 indexed marketId, bool originalOutcomeStood);
    event LimitOrderCreated(
        uint256 indexed marketId, uint256 orderId, address creator, bool isYes, uint256 amount, uint256 targetPrice
    );
    event LimitOrderFilled(uint256 indexed marketId, uint256 orderId);
    event CommentAdded(uint256 indexed marketId, uint256 commentId, address author);
    event MarketCategorized(uint256 indexed marketId, string category);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(MODERATOR_ROLE, msg.sender); // Changed from _setupRole

        minMarketDuration = 1 days;
        maxMarketDuration = 365 days;
        disputeResolutionThreshold = 100;
    }

    // Modifiers
    modifier onlyVerifiedCreator() {
        require(
            hasRole(CREATOR_ROLE, msg.sender) || verifiedCreators[msg.sender]
                || (profiles[msg.sender].isCreator && profiles[msg.sender].reputation >= 500),
            "Must be verified creator"
        );
        _;
    }

    modifier marketExists(uint256 marketId) {
        require(marketId < _marketIds, "Market doesn't exist");
        _;
    }

    modifier activeMarket(uint256 marketId) {
        require(markets[marketId].status == MarketStatus.Active, "Market not active");
        _;
    }

    // Profile Management Functions
    function createProfile(string memory _username, string memory _avatarIpfsHash, string memory _bio) external {
        require(!profiles[msg.sender].isActive, "Profile exists");
        require(bytes(_username).length > 0, "Empty username");

        Profile storage newProfile = profiles[msg.sender];
        newProfile.username = _username;
        newProfile.avatarIpfsHash = _avatarIpfsHash;
        newProfile.bio = _bio;
        newProfile.isActive = true;
        newProfile.reputation = 100;

        emit ProfileCreated(msg.sender, _username);
    }

    function followUser(address userToFollow) external {
        require(profiles[msg.sender].isActive, "Create profile first");
        require(profiles[userToFollow].isActive, "User to follow doesn't exist");
        require(msg.sender != userToFollow, "Can't follow self");

        profiles[msg.sender].following.push(userToFollow);
        profiles[userToFollow].followers.push(msg.sender);
    }

    // Market Creation and Management
    function createMarket(
        string memory _description,
        string memory _category,
        uint256 _duration,
        string memory _imageIpfsHash,
        string[] memory _tags
    ) external payable onlyVerifiedCreator {
        require(msg.value >= MIN_STAKE, "Insufficient stake");
        require(_duration >= minMarketDuration && _duration <= maxMarketDuration, "Invalid duration");
        categories.push(_category);
        uint256 marketId = _marketIds;
        _marketIds++;

        Market storage market = markets[marketId];
        market.description = _description;
        market.category = _category;
        market.tags = _tags;
        market.endTime = block.timestamp + _duration;
        market.creator = msg.sender;
        market.status = MarketStatus.Active;
        market.totalLiquidity = msg.value;
        market.imageIpfsHash = _imageIpfsHash;

        // Create position tokens
        string memory baseTokenName = string(abi.encodePacked("Market ", toString(marketId)));
        market.yesToken = address(
            new MarketPositionToken(
                string(abi.encodePacked(baseTokenName, " YES")),
                string(abi.encodePacked("MKT", toString(marketId), "YES")),
                address(this)
            )
        );
        market.noToken = address(
            new MarketPositionToken(
                string(abi.encodePacked(baseTokenName, " NO")),
                string(abi.encodePacked("MKT", toString(marketId), "NO")),
                address(this)
            )
        );

        // Initialize prices
        market.yesPrice = 500;
        market.noPrice = 500;

        // Update creator profile
        profiles[msg.sender].createdMarkets.push(marketId);
        categoryToMarkets[_category].push(marketId);

        emit MarketCreated(marketId, _description, msg.sender);
        emit MarketCategorized(marketId, _category);
    }

    // Trading Functions
    function takePosition(uint256 marketId, bool isYes, uint256 targetPrice) external payable activeMarket(marketId) {
        require(msg.value >= MIN_STAKE && msg.value <= MAX_STAKE, "Invalid stake amount");

        Market storage market = markets[marketId];
        require(block.timestamp < market.endTime, "Market ended");

        // Calculate fees and tokens
        uint256 creatorFee = (msg.value * CREATOR_FEE_PERCENTAGE) / 1000;
        uint256 platformFee = (msg.value * PLATFORM_FEE_PERCENTAGE) / 1000;
        uint256 netAmount = msg.value - creatorFee - platformFee;

        uint256 currentPrice = getCurrentPrice(marketId, isYes);
        require(targetPrice == 0 || currentPrice <= targetPrice, "Price too high");

        uint256 tokenAmount = (netAmount * 1000) / currentPrice;

        // Update position
        UserPosition storage position = market.positions[msg.sender];
        if (isYes) {
            position.yesTokens += tokenAmount;
        } else {
            position.noTokens += tokenAmount;
        }
        position.totalInvested += msg.value;

        // Update market state
        market.creatorFees += creatorFee;
        market.platformFees += platformFee;
        market.totalLiquidity += netAmount;
        market.totalVolume += msg.value;

        if (!market.hasParticipated[msg.sender]) {
            market.totalParticipants++;
            market.hasParticipated[msg.sender] = true;
        }

        // Mint tokens
        MarketPositionToken token = MarketPositionToken(isYes ? market.yesToken : market.noToken);
        token.mint(msg.sender, tokenAmount);

        // Update prices
        updatePrices(marketId);

        // Try to fill limit orders
        tryFillLimitOrders(marketId, !isYes);

        emit PositionTaken(marketId, msg.sender, isYes, tokenAmount);
    }

    function tryFillLimitOrders(uint256 marketId, bool isYes) internal {
        Market storage market = markets[marketId];
        uint256 currentPrice = getCurrentPrice(marketId, isYes);

        for (uint256 i = 0; i < market.limitOrderCount; i++) {
            LimitOrder storage order = market.limitOrders[i];

            if (!order.isActive || order.isYes != isYes) continue;

            // Check if the current price meets the target price
            if (isYes && currentPrice <= order.targetPrice || !isYes && currentPrice >= order.targetPrice) {
                // Fill the order
                UserPosition storage position = market.positions[order.creator];

                if (isYes) {
                    position.yesTokens += order.amount;
                } else {
                    position.noTokens += order.amount;
                }

                // Mint tokens
                MarketPositionToken token = MarketPositionToken(isYes ? market.yesToken : market.noToken);
                token.mint(order.creator, order.amount);

                // Mark order as filled
                order.isActive = false;

                emit LimitOrderFilled(marketId, i);

                // Update market state
                market.totalVolume += order.amount;
                updatePrices(marketId);
            }
        }
    }

    function createLimitOrder(uint256 marketId, bool isYes, uint256 amount, uint256 targetPrice)
        external
        payable
        activeMarket(marketId)
    {
        require(msg.value >= MIN_STAKE && msg.value <= MAX_STAKE, "Invalid stake amount");
        require(targetPrice > 0 && targetPrice <= 1000, "Invalid target price");

        Market storage market = markets[marketId];
        uint256 orderId = market.limitOrderCount++;

        LimitOrder storage order = market.limitOrders[orderId];
        order.creator = msg.sender;
        order.orderType = OrderType.Limit;
        order.isYes = isYes;
        order.amount = amount;
        order.targetPrice = targetPrice;
        order.isActive = true;
        order.timestamp = block.timestamp;

        market.positions[msg.sender].limitOrders.push(orderId);

        emit LimitOrderCreated(marketId, orderId, msg.sender, isYes, amount, targetPrice);
    }

    function cancelLimitOrder(uint256 marketId, uint256 orderId) external {
        Market storage market = markets[marketId];
        LimitOrder storage order = market.limitOrders[orderId];

        require(order.creator == msg.sender, "Not order creator");
        require(order.isActive, "Order not active");

        order.isActive = false;

        // Refund locked stake
        payable(msg.sender).transfer(order.amount);
    }

    // Resolution and Dispute Functions
    function resolveMarket(uint256 marketId, bool outcome) external onlyRole(ORACLE_ROLE) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Invalid status");
        require(block.timestamp >= market.endTime, "Market not ended");

        market.status = MarketStatus.Resolved;
        market.outcome = outcome;
        market.resolutionTime = block.timestamp;

        // Start dispute period
        disputes[marketId].timestamp = block.timestamp;

        emit MarketResolved(marketId, outcome);
    }

    function createDispute(uint256 marketId, string memory reason) external payable {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Not resolved");
        require(block.timestamp <= market.resolutionTime + DISPUTE_PERIOD, "Dispute period ended");
        require(msg.value >= MIN_STAKE, "Insufficient stake");

        MarketDispute storage dispute = disputes[marketId];
        require(dispute.disputer == address(0), "Dispute exists");

        dispute.disputer = msg.sender;
        dispute.reason = reason;
        dispute.stake = msg.value;
        dispute.timestamp = block.timestamp;

        market.status = MarketStatus.Disputed;
        market.disputeStatus = DisputeStatus.Active;

        emit DisputeCreated(marketId, msg.sender, reason);
    }

    function voteOnDispute(uint256 marketId, bool supportDispute) external {
        Market storage market = markets[marketId];
        MarketDispute storage dispute = disputes[marketId];

        require(market.status == MarketStatus.Disputed, "Not disputed");
        require(!dispute.votes[msg.sender], "Already voted");
        require(market.hasParticipated[msg.sender], "Must be participant");

        dispute.votes[msg.sender] = true;
        if (supportDispute) {
            dispute.yesVotes++;
        } else {
            dispute.noVotes++;
        }

        // Check if threshold reached
        if (dispute.yesVotes + dispute.noVotes >= disputeResolutionThreshold) {
            resolveDispute(marketId);
        }
    }

    function resolveDispute(uint256 marketId) internal {
        Market storage market = markets[marketId];
        MarketDispute storage dispute = disputes[marketId];

        bool originalOutcomeStood = dispute.noVotes >= dispute.yesVotes;

        if (!originalOutcomeStood) {
            market.outcome = !market.outcome;
            // Refund dispute stake
            payable(dispute.disputer).transfer(dispute.stake);
        }

        market.status = MarketStatus.Resolved;
        market.disputeStatus = DisputeStatus.Resolved;
        dispute.resolved = true;

        // Distribute rewards
        distributeRewards(marketId);

        emit DisputeResolved(marketId, originalOutcomeStood);
    }

    // Market Trading Helper Functions
    function distributeRewards(uint256 marketId) internal {
        Market storage market = markets[marketId];
        MarketPositionToken winningToken = MarketPositionToken(market.outcome ? market.yesToken : market.noToken);

        uint256 totalLiquidity = market.totalLiquidity;
        uint256 totalSupply = winningToken.totalSupply();

        if (totalSupply == 0) return;

        // Distribute to winning position holders
        for (uint256 i = 0; i < market.totalParticipants; i++) {
            address participant = address(uint160(i));
            if (!market.hasParticipated[participant]) continue;

            uint256 tokenBalance = winningToken.balanceOf(participant);
            if (tokenBalance == 0) continue;

            uint256 reward = (tokenBalance * totalLiquidity) / totalSupply;
            payable(participant).transfer(reward);

            // Update participant profile
            profiles[participant].totalProfits += reward;
            profiles[participant].reputation += 10;
        }
    }

    function updatePrices(uint256 marketId) internal {
        Market storage market = markets[marketId];
        market.yesPrice = getCurrentPrice(marketId, true);
        market.noPrice = getCurrentPrice(marketId, false);
    }

    function getCurrentPrice(uint256 marketId, bool isYes) public view returns (uint256) {
        Market storage market = markets[marketId];
        MarketPositionToken yesToken = MarketPositionToken(market.yesToken);
        MarketPositionToken noToken = MarketPositionToken(market.noToken);

        uint256 yesSupply = yesToken.totalSupply();
        uint256 noSupply = noToken.totalSupply();

        if (yesSupply + noSupply == 0) return 500;

        if (isYes) {
            return bound((yesSupply * 1000) / (yesSupply + noSupply), 50, 950);
        } else {
            return bound((noSupply * 1000) / (yesSupply + noSupply), 50, 950);
        }
    }

    // Social Features
    function addComment(uint256 marketId, string memory content) external {
        require(bytes(content).length > 0 && bytes(content).length <= 1000, "Invalid content");

        Market storage market = markets[marketId];
        uint256 commentId = market.commentCount++;

        Comment storage comment = market.comments[commentId];
        comment.author = msg.sender;
        comment.content = content;
        comment.timestamp = block.timestamp;

        emit CommentAdded(marketId, commentId, msg.sender);
    }

    function likeComment(uint256 marketId, uint256 commentId) external {
        Market storage market = markets[marketId];
        Comment storage comment = market.comments[commentId];

        require(!comment.hasLiked[msg.sender], "Already liked");

        comment.hasLiked[msg.sender] = true;
        comment.likes++;
    }

    // Admin Functions
    function setMarketDurationLimits(uint256 _minDuration, uint256 _maxDuration) external onlyRole(ADMIN_ROLE) {
        require(_minDuration < _maxDuration, "Invalid limits");
        minMarketDuration = _minDuration;
        maxMarketDuration = _maxDuration;
    }

    function addVerifiedCategory(string memory category) external onlyRole(ADMIN_ROLE) {
        verifiedCategories[category] = true;
        verifiedCategoriesList.push(category);
    }

    function removeVerifiedCategory(string memory category) external onlyRole(ADMIN_ROLE) {
        verifiedCategories[category] = false;
        verifiedCategoriesList.pop();
    }

    function verifyCreator(address creator) external onlyRole(ADMIN_ROLE) {
        verifiedCreators[creator] = true;
        verifiedCretorsList.push(creator);
    }

    function unVerifyCreator(address creator) external onlyRole(ADMIN_ROLE) {
        verifiedCreators[creator] = false;
        verifiedCretorsList.pop();
    }

    function getVerifiedCreator() public view returns (address[] memory) {
        return verifiedCretorsList;
    }

    function setDisputeThreshold(uint256 threshold) external onlyRole(ADMIN_ROLE) {
        disputeResolutionThreshold = threshold;
    }

    // View Functions
    function getMarketDetails(uint256 marketId)
        external
        view
        returns (
            string memory description,
            string memory category,
            uint256 endTime,
            MarketStatus status,
            uint256 totalLiquidity,
            uint256 totalVolume,
            uint256 totalParticipants,
            address creator,
            string[] memory tags,
            DisputeStatus disputeStatus
        )
    {
        Market storage market = markets[marketId];
        return (
            market.description,
            market.category,
            market.endTime,
            market.status,
            market.totalLiquidity,
            market.totalVolume,
            market.totalParticipants,
            market.creator,
            market.tags,
            market.disputeStatus
        );
    }

    function getCategories() public view returns (string[] memory) {
        return categories;
    }

    function getVerifiedCategories() public view returns (string[] memory) {
        return verifiedCategoriesList;
    }

    function getUserPositions(address user, uint256 marketId)
        external
        view
        returns (uint256 yesTokens, uint256 noTokens, uint256 totalInvested, uint256[] memory limitOrderIds)
    {
        UserPosition storage position = markets[marketId].positions[user];
        return (position.yesTokens, position.noTokens, position.totalInvested, position.limitOrders);
    }

    // Utility Functions
    function bound(uint256 value, uint256 min, uint256 max) internal pure returns (uint256) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    function getMarketIds() external view returns (uint256) {
        return _marketIds;
    }

    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";

        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return string(buffer);
    }

    // Fallback and Receive
    receive() external payable {}
    fallback() external payable {}
}
