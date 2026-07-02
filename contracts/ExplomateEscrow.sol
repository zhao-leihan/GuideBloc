// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ExplomateEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum BookingStatus {
        CREATED,
        FUNDED,
        CONFIRMED,
        RELEASED,
        REFUNDED,
        DISPUTED
    }

    struct BookingInfo {
        address tourist;
        address guide;
        address token;
        uint256 amount;
        BookingStatus status;
    }

    // State variables
    address public platformTreasury;
    uint256 public defaultCommissionBps = 1000; // 10% = 1000 bps
    mapping(bytes32 => BookingInfo) public bookings;
    mapping(address => uint256) public guideCommissions; // per-guide commission override

    // Events
    event BookingCreated(bytes32 indexed bookingId, address tourist, address guide, address token, uint256 amount);
    event BookingConfirmed(bytes32 indexed bookingId);
    event FundsReleased(bytes32 indexed bookingId, uint256 guideAmount, uint256 commission);
    event FundsRefunded(bytes32 indexed bookingId, uint256 amount);
    event DisputeOpened(bytes32 indexed bookingId);
    event GuideCommissionSet(address indexed guide, uint256 bps);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    constructor(address _treasury) Ownable(msg.sender) {
        platformTreasury = _treasury;
    }

    // Create a booking and lock funds in escrow
    function createBooking(
        bytes32 bookingId,
        address guide,
        address token,
        uint256 amount
    ) external nonReentrant {
        require(bookings[bookingId].status == BookingStatus.CREATED, "Booking already exists");
        require(guide != address(0), "Invalid guide address");
        require(amount > 0, "Amount must be > 0");

        // Transfer tokens from tourist to escrow
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        bookings[bookingId] = BookingInfo({
            tourist: msg.sender,
            guide: guide,
            token: token,
            amount: amount,
            status: BookingStatus.FUNDED
        });

        emit BookingCreated(bookingId, msg.sender, guide, token, amount);
    }

    // Admin confirms a booking
    function confirmBooking(bytes32 bookingId) external onlyOwner {
        BookingInfo storage b = bookings[bookingId];
        require(b.status == BookingStatus.FUNDED, "Not funded");

        b.status = BookingStatus.CONFIRMED;
        emit BookingConfirmed(bookingId);
    }

    // Release funds to guide after tour completion
    function releaseToGuide(bytes32 bookingId) external onlyOwner nonReentrant {
        BookingInfo storage b = bookings[bookingId];
        require(b.status == BookingStatus.CONFIRMED, "Not confirmed");

        // Get guide-specific commission or default
        uint256 commissionBps = guideCommissions[b.guide] > 0
            ? guideCommissions[b.guide]
            : defaultCommissionBps;

        uint256 commission = (b.amount * commissionBps) / 10000;
        uint256 guideAmount = b.amount - commission;

        b.status = BookingStatus.RELEASED;

        // Transfer net to guide
        IERC20(b.token).safeTransfer(b.guide, guideAmount);
        // Transfer commission to platform treasury
        IERC20(b.token).safeTransfer(platformTreasury, commission);

        emit FundsReleased(bookingId, guideAmount, commission);
    }

    // Refund tourist (admin-initiated)
    function refundTourist(bytes32 bookingId) external onlyOwner nonReentrant {
        BookingInfo storage b = bookings[bookingId];
        require(
            b.status == BookingStatus.FUNDED ||
            b.status == BookingStatus.CONFIRMED ||
            b.status == BookingStatus.DISPUTED,
            "Cannot refund"
        );

        b.status = BookingStatus.REFUNDED;
        IERC20(b.token).safeTransfer(b.tourist, b.amount);

        emit FundsRefunded(bookingId, b.amount);
    }

    // Guide claims earnings (for pre-approved bookings)
    function claimEarnings(bytes32 bookingId) external nonReentrant {
        BookingInfo storage b = bookings[bookingId];
        require(b.status == BookingStatus.CONFIRMED, "Not confirmed");
        require(msg.sender == b.guide, "Not the guide");

        uint256 commissionBps = guideCommissions[b.guide] > 0
            ? guideCommissions[b.guide]
            : defaultCommissionBps;

        uint256 commission = (b.amount * commissionBps) / 10000;
        uint256 guideAmount = b.amount - commission;

        b.status = BookingStatus.RELEASED;

        IERC20(b.token).safeTransfer(b.guide, guideAmount);
        IERC20(b.token).safeTransfer(platformTreasury, commission);

        emit FundsReleased(bookingId, guideAmount, commission);
    }

    // Open a dispute
    function openDispute(bytes32 bookingId) external {
        BookingInfo storage b = bookings[bookingId];
        require(
            msg.sender == b.tourist || msg.sender == b.guide,
            "Not authorized"
        );
        require(b.status == BookingStatus.CONFIRMED, "Not confirmed");

        b.status = BookingStatus.DISPUTED;
        emit DisputeOpened(bookingId);
    }

    // Admin functions
    function setGuideCommissionBps(address guide, uint256 bps) external onlyOwner {
        require(bps <= 5000, "Commission too high"); // max 50%
        guideCommissions[guide] = bps;
        emit GuideCommissionSet(guide, bps);
    }

    function setDefaultCommissionBps(uint256 bps) external onlyOwner {
        require(bps <= 5000, "Commission too high");
        defaultCommissionBps = bps;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(platformTreasury, newTreasury);
        platformTreasury = newTreasury;
    }

    function getBooking(bytes32 bookingId) external view returns (BookingInfo memory) {
        return bookings[bookingId];
    }
}
