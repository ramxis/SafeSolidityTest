// SPDX-License-Identifier: rameez
pragma solidity ^0.8.9;
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./UnicornToken.sol";

/// @title TokenWithdrawalModule - A Gnosis Safe module that allows third party accounts to withdraw tokens uisng a message generated by the safe owners
/// @author Rameez - <rameez.saleem@gmail.com>
/// @notice Owner generated signatures are time limited to 1h
contract TokenWithdrawalModule {
    using SafeMath for uint256;

    // The Gnosis Safe that this module is added to
    GnosisSafe public safe;

    // The token contract that the Safe holds
    UnicornToken public token;

    /// @dev constructor to deploy the withdrawal module contract
    /// @param _token address of deploye ERC20 UnicornToken
    /// @param _safe Address of the safe this module will be attached to
    constructor(address _token, address _safe) public {
        safe = GnosisSafe(payable(_safe));
        token = UnicornToken(_token);
    }

    /// @dev Function that allows user to withdraw Unicorn tokens from the safe by presenting valid message signed by the safe owners
    /// @param amount amount of tokens to withdraw.
    /// @param recipient Address that should receive the tokens
    /// @param signature owner signature allowing @param recipient to withdraw tokens
    /// @notice based on description of the task we intentially allow bob to use the signatures multiple times

    function withdrawTokensUsingSignatures(
        address recipient,
        uint256 amount,
        bytes memory signature,
        bytes32 messageHash
    ) public {
        require(token.balanceOf(address(safe)) >= amount, "Insufficient balance");

        address eip191Signer = ECDSA.recover(ECDSA.toEthSignedMessageHash(messageHash), signature);

        require(
            SignatureChecker.isValidSignatureNow(ECDSA.recover(messageHash, signature), messageHash, signature),
            "invalid Signature"
        );
        require(safe.isOwner(eip191Signer), "only message signed by a safe owner is accepted");

        bytes memory data = abi.encodeWithSignature("transfer(address,uint256)", recipient, amount);
        require(
            safe.execTransactionFromModule(address(token), 0, data, Enum.Operation.Call),
            "Could not execute token transfer"
        );
    }
}
