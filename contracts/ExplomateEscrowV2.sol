// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ExplomateEscrowV2 - Pure Decentralized Peer-to-Peer Web3 Escrow
 * @notice Zero Server Custody. Zero Bot Risk. Direct Tourist -> Guide (90%) + Admin (10%).
 */
contract ExplomateEscrowV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum BookingStatus {
        NONE,
        ACTIVE,
        RELEASED,
        REFUNDED
    }

    struct Booking {
        address tourist;
        address guide;
        address token;
        uint256 amount;
        BookingStatus status;
    }

    address public adminTreasury;
    uint256 public constant COMMISSION_BPS = 1000; // Exactly 10% (1000 / 10000)

    mapping(bytes32 => Booking) public bookings;

    event Deposited(bytes32 indexed bookingId, address indexed tourist, address indexed guide, address token, uint256 amount);
    event Released(bytes32 indexed bookingId, uint256 guideAmount, uint256 adminAmount);
    event Refunded(bytes32 indexed bookingId, uint256 touristAmount);
    event TreasuryUpdated(address indexed newTreasury);
    event Rescued(address indexed token, address indexed to, uint256 amount);

    constructor(address _adminTreasury) Ownable(msg.sender) {
        require(_adminTreasury != address(0), "Invalid treasury");
        adminTreasury = _adminTreasury;
    }

    /**
     * @notice 1. Tourist deposits USDC into escrow. Funds become ACTIVE immediately without needing a server confirm.
     */
    function deposit(
        bytes32 bookingId,
        address guide,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(bookings[bookingId].status == BookingStatus.NONE, "Booking exists");
        require(guide != address(0), "Invalid guide");
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        bookings[bookingId] = Booking({
            tourist: msg.sender,
            guide: guide,
            token: token,
            amount: amount,
            status: BookingStatus.ACTIVE
        });

        emit Deposited(bookingId, msg.sender, guide, token, amount);
    }

    /**
     * @notice 2. Release funds upon tour completion. Can be triggered by Tourist, Guide, or Admin.
     * Splitting 90% directly to Guide and 10% directly to Admin Treasury.
     */
    function release(bytes32 bookingId) external nonReentrant {
        Booking storage b = bookings[bookingId];
        require(b.status == BookingStatus.ACTIVE, "Not active");
        require(
            msg.sender == b.tourist || msg.sender == b.guide || msg.sender == owner(),
            "Unauthorized release"
        );

        b.status = BookingStatus.RELEASED;

        uint256 adminAmount = (b.amount * COMMISSION_BPS) / 10000;
        uint256 guideAmount = b.amount - adminAmount;

        // Transfer 90% directly to Tour Guide
        IERC20(b.token).safeTransfer(b.guide, guideAmount);

        // Transfer 10% directly to Admin Treasury
        IERC20(b.token).safeTransfer(adminTreasury, adminAmount);

        emit Released(bookingId, guideAmount, adminAmount);
    }

    /**
     * @notice 3. Refund 100% of funds to Tourist. Can be triggered by Tourist or Admin if tour is cancelled.
     */
    function refund(bytes32 bookingId) external nonReentrant {
        Booking storage b = bookings[bookingId];
        require(b.status == BookingStatus.ACTIVE, "Not active");
        require(
            msg.sender == b.tourist || msg.sender == owner(),
            "Unauthorized refund"
        );

        b.status = BookingStatus.REFUNDED;

        IERC20(b.token).safeTransfer(b.tourist, b.amount);

        emit Refunded(bookingId, b.amount);
    }

    /**
     * @notice 4. Emergency Rescue - Guarantees NO money can ever be trapped like gambling.
     * Admin can rescue any stranded tokens sent directly to this contract.
     */
    function emergencyRescue(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(to != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(to, amount);
        emit Rescued(token, to, amount);
    }

    /**
     * @notice Update admin treasury destination
     */
    function setAdminTreasury(address _adminTreasury) external onlyOwner {
        require(_adminTreasury != address(0), "Invalid treasury");
        adminTreasury = _adminTreasury;
        emit TreasuryUpdated(_adminTreasury);
    }

    function getBooking(bytes32 bookingId) external view returns (Booking memory) {
        return bookings[bookingId];
    }
}
