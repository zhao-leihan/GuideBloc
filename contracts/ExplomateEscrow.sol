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

    // Vaults for commission distribution
    address public gasOpsVault;
    address public saasGrowthVault;
    address public holdingDividendsVault;

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
    event VaultsUpdated(address indexed gasOpsVault, address indexed saasGrowthVault, address indexed holdingDividendsVault);

    constructor(
        address _gasOpsVault,
        address _saasGrowthVault,
        address _holdingDividendsVault
    ) Ownable(msg.sender) {
        require(_gasOpsVault != address(0), "Invalid gasOpsVault");
        require(_saasGrowthVault != address(0), "Invalid saasGrowthVault");
        require(_holdingDividendsVault != address(0), "Invalid holdingDividendsVault");

        gasOpsVault = _gasOpsVault;
        saasGrowthVault = _saasGrowthVault;
        holdingDividendsVault = _holdingDividendsVault;
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

        // Atomic Split of Commission
        _splitCommission(b.token, commission);

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
        
        // Atomic Split of Commission
        _splitCommission(b.token, commission);

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

    // Internal helper for atomic commission splitting
    function _splitCommission(address token, uint256 commission) private {
        if (commission > 0) {
            uint256 gasOpsShare = (commission * 10) / 100; // 10% alokasi ops
            uint256 saasGrowthShare = (commission * 50) / 100; // 50% alokasi ekspansi
            uint256 dividendsShare = commission - gasOpsShare - saasGrowthShare; // 40% alokasi deviden

            IERC20(token).safeTransfer(gasOpsVault, gasOpsShare);
            IERC20(token).safeTransfer(saasGrowthVault, saasGrowthShare);
            IERC20(token).safeTransfer(holdingDividendsVault, dividendsShare);
        }
    }

    // Admin functions
    function setGuideCommissionBps(address guide, uint256 bps) external onlyOwner {
        require(bps <= 5000, "Commission too high"); // max 50%
        guideCommissions[guide] = bps;
        emit GuideCommissionSet(guide, bps);
    }

    // Set vaults
    function setVaults(
        address _gasOpsVault,
        address _saasGrowthVault,
        address _holdingDividendsVault
    ) external onlyOwner {
        require(_gasOpsVault != address(0), "Invalid gasOpsVault");
        require(_saasGrowthVault != address(0), "Invalid saasGrowthVault");
        require(_holdingDividendsVault != address(0), "Invalid holdingDividendsVault");

        gasOpsVault = _gasOpsVault;
        saasGrowthVault = _saasGrowthVault;
        holdingDividendsVault = _holdingDividendsVault;

        emit VaultsUpdated(_gasOpsVault, _saasGrowthVault, _holdingDividendsVault);
    }

    function setDefaultCommissionBps(uint256 bps) external onlyOwner {
        require(bps <= 5000, "Commission too high");
        defaultCommissionBps = bps;
    }

    function getBooking(bytes32 bookingId) external view returns (BookingInfo memory) {
        return bookings[bookingId];
    }
}
