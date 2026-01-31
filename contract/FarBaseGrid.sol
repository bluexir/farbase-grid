// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract FarBaseGrid {
    IERC20 public constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    
    address public owner;
    bool public paused = false;
    
    struct Player {
        address wallet;
        uint256 score;
        bool paid;
        bool disqualified;
    }
    
    mapping(uint256 => Player[]) public weeklyPlayers;
    mapping(uint256 => uint256) public weeklyPrizePool;
    mapping(uint256 => uint256) public monthlyPrizePool;
    mapping(uint256 => bool) public weekDistributed;
    
    uint256[] public rewards = [35, 25, 15, 10, 5];
    
    event Entered(uint256 indexed week, address player, uint256 score);
    event Distributed(uint256 indexed week, address[] winners, uint256[] amounts);
    event EmergencyWithdraw(uint256 amount);
    event PlayerDisqualified(uint256 indexed week, address player, string reason);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Yetki yok");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Sistem durduruldu");
        _;
    }
    
    function togglePause() external onlyOwner {
        paused = !paused;
    }
    
    function enterTournament(uint256 score) external whenNotPaused {
        uint256 week = block.timestamp / 1 weeks;
        
        require(USDC.transferFrom(msg.sender, address(this), 1_000_000), "Odeme basarisiz");
        
        weeklyPrizePool[week] += 900_000;
        monthlyPrizePool[block.timestamp / 30 days] += 100_000;
        
        weeklyPlayers[week].push(Player(msg.sender, score, false, false));
        
        emit Entered(week, msg.sender, score);
    }
    
    function updateScore(uint256 week, uint256 playerIndex, uint256 newScore) external onlyOwner {
        weeklyPlayers[week][playerIndex].score = newScore;
    }
    
    function disqualifyPlayer(uint256 week, uint256 playerIndex, string calldata reason) external onlyOwner {
        weeklyPlayers[week][playerIndex].disqualified = true;
        emit PlayerDisqualified(week, weeklyPlayers[week][playerIndex].wallet, reason);
    }
    
    function distributeWeekly(uint256 week) external onlyOwner whenNotPaused {
        require(!weekDistributed[week], "Zaten dagitildi");
        require(block.timestamp / 1 weeks >= week, "Hafta bitmedi");
        
        uint256 pool = weeklyPrizePool[week];
        require(pool > 0, "Havuz bos");
        
        Player[] storage players = weeklyPlayers[week];
        
        for (uint i = 0; i < players.length; i++) {
            for (uint j = i + 1; j < players.length; j++) {
                if (players[j].score > players[i].score && !players[j].disqualified) {
                    Player memory temp = players[i];
                    players[i] = players[j];
                    players[j] = temp;
                }
            }
        }
        
        address[] memory winners = new address[](5);
        uint256[] memory amounts = new uint256[](5);
        uint256 distributed = 0;
        uint256 winnerCount = 0;
        
        for (uint i = 0; i < players.length && winnerCount < 5; i++) {
            if (players[i].disqualified) continue;
            
            uint256 amount = (pool * rewards[winnerCount]) / 90;
            
            (bool success, ) = address(USDC).call(
                abi.encodeWithSelector(IERC20.transfer.selector, players[i].wallet, amount)
            );
            
            if (success) {
                players[i].paid = true;
                winners[winnerCount] = players[i].wallet;
                amounts[winnerCount] = amount;
                distributed += amount;
                winnerCount++;
            }
        }
        
        monthlyPrizePool[block.timestamp / 30 days] += (pool - distributed);
        weeklyPrizePool[week] = 0;
        weekDistributed[week] = true;
        
        emit Distributed(week, winners, amounts);
    }
    
    function manualPayout(address to, uint256 amount) external onlyOwner {
        USDC.transfer(to, amount);
    }
    
    function distributeMonthly(uint256 month) external onlyOwner {
        uint256 amount = monthlyPrizePool[month];
        require(amount > 0, "Havuz bos");
        USDC.transfer(owner, amount);
        monthlyPrizePool[month] = 0;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = USDC.balanceOf(address(this));
        require(USDC.transfer(owner, balance), "Transfer basarisiz");
        emit EmergencyWithdraw(balance);
    }
    
    function emergencyWithdrawMonthly(uint256 month) external onlyOwner {
        uint256 amount = monthlyPrizePool[month];
        monthlyPrizePool[month] = 0;
        USDC.transfer(owner, amount);
    }
    
    function getWeekInfo(uint256 week) external view returns (
        uint256 pool,
        uint256 playerCount,
        bool distributed
    ) {
        return (weeklyPrizePool[week], weeklyPlayers[week].length, weekDistributed[week]);
    }
    
    function getPlayer(uint256 week, uint256 index) external view returns (Player memory) {
        return weeklyPlayers[week][index];
    }
}
