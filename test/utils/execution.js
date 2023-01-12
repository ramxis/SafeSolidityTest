"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSafeTransaction = exports.executeContractCallWithSigners = exports.executeTxWithSigners = exports.buildContractCall = exports.populateExecuteTx = exports.executeTx = exports.logGas = exports.buildSignatureBytes = exports.safeSignMessage = exports.signHash = exports.safeSignTypedData = exports.safeApproveHash = exports.calculateSafeMessageHash = exports.calculateSafeTransactionHash = exports.preimageSafeTransactionHash = exports.calculateSafeDomainSeparator = exports.EIP712_SAFE_MESSAGE_TYPE = exports.EIP712_SAFE_TX_TYPE = exports.EIP_DOMAIN = void 0;
var ethers_1 = require("ethers");
var constants_1 = require("@ethersproject/constants");
exports.EIP_DOMAIN = {
    EIP712Domain: [
        { type: "uint256", name: "chainId" },
        { type: "address", name: "verifyingContract" }
    ]
};
exports.EIP712_SAFE_TX_TYPE = {
    // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    SafeTx: [
        { type: "address", name: "to" },
        { type: "uint256", name: "value" },
        { type: "bytes", name: "data" },
        { type: "uint8", name: "operation" },
        { type: "uint256", name: "safeTxGas" },
        { type: "uint256", name: "baseGas" },
        { type: "uint256", name: "gasPrice" },
        { type: "address", name: "gasToken" },
        { type: "address", name: "refundReceiver" },
        { type: "uint256", name: "nonce" },
    ]
};
exports.EIP712_SAFE_MESSAGE_TYPE = {
    // "SafeMessage(bytes message)"
    SafeMessage: [
        { type: "bytes", name: "message" },
    ]
};
var calculateSafeDomainSeparator = function (safe, chainId) {
    return ethers_1.utils._TypedDataEncoder.hashDomain({ verifyingContract: safe.address, chainId: chainId });
};
exports.calculateSafeDomainSeparator = calculateSafeDomainSeparator;
var preimageSafeTransactionHash = function (safe, safeTx, chainId) {
    return ethers_1.utils._TypedDataEncoder.encode({ verifyingContract: safe.address, chainId: chainId }, exports.EIP712_SAFE_TX_TYPE, safeTx);
};
exports.preimageSafeTransactionHash = preimageSafeTransactionHash;
var calculateSafeTransactionHash = function (safe, safeTx, chainId) {
    return ethers_1.utils._TypedDataEncoder.hash({ verifyingContract: safe.address, chainId: chainId }, exports.EIP712_SAFE_TX_TYPE, safeTx);
};
exports.calculateSafeTransactionHash = calculateSafeTransactionHash;
var calculateSafeMessageHash = function (safe, message, chainId) {
    return ethers_1.utils._TypedDataEncoder.hash({ verifyingContract: safe.address, chainId: chainId }, exports.EIP712_SAFE_MESSAGE_TYPE, { message: message });
};
exports.calculateSafeMessageHash = calculateSafeMessageHash;
var safeApproveHash = function (signer, safe, safeTx, skipOnChainApproval) { return __awaiter(void 0, void 0, Promise, function () {
    var chainId, typedDataHash, signerSafe, signerAddress;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!!skipOnChainApproval) return [3 /*break*/, 3];
                if (!signer.provider)
                    throw Error("Provider required for on-chain approval");
                return [4 /*yield*/, signer.provider.getNetwork()];
            case 1:
                chainId = (_a.sent()).chainId;
                typedDataHash = ethers_1.utils.arrayify((0, exports.calculateSafeTransactionHash)(safe, safeTx, chainId));
                signerSafe = safe.connect(signer);
                return [4 /*yield*/, signerSafe.approveHash(typedDataHash)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [4 /*yield*/, signer.getAddress()];
            case 4:
                signerAddress = _a.sent();
                return [2 /*return*/, {
                        signer: signerAddress,
                        data: "0x000000000000000000000000" + signerAddress.slice(2) + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
                    }];
        }
    });
}); };
exports.safeApproveHash = safeApproveHash;
var safeSignTypedData = function (signer, safe, safeTx, chainId) { return __awaiter(void 0, void 0, Promise, function () {
    var cid, _a, signerAddress;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (!chainId && !signer.provider)
                    throw Error("Provider required to retrieve chainId");
                _a = chainId;
                if (_a) return [3 /*break*/, 2];
                return [4 /*yield*/, signer.provider.getNetwork()];
            case 1:
                _a = (_c.sent()).chainId;
                _c.label = 2;
            case 2:
                cid = _a;
                return [4 /*yield*/, signer.getAddress()];
            case 3:
                signerAddress = _c.sent();
                _b = {
                    signer: signerAddress
                };
                return [4 /*yield*/, signer._signTypedData({ verifyingContract: safe.address, chainId: cid }, exports.EIP712_SAFE_TX_TYPE, safeTx)];
            case 4: return [2 /*return*/, (_b.data = _c.sent(),
                    _b)];
        }
    });
}); };
exports.safeSignTypedData = safeSignTypedData;
var signHash = function (signer, hash) { return __awaiter(void 0, void 0, Promise, function () {
    var typedDataHash, signerAddress;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                typedDataHash = ethers_1.utils.arrayify(hash);
                return [4 /*yield*/, signer.getAddress()];
            case 1:
                signerAddress = _b.sent();
                _a = {
                    signer: signerAddress
                };
                return [4 /*yield*/, signer.signMessage(typedDataHash)];
            case 2: return [2 /*return*/, (_a.data = (_b.sent()).replace(/1b$/, "1f").replace(/1c$/, "20"),
                    _a)];
        }
    });
}); };
exports.signHash = signHash;
var safeSignMessage = function (signer, safe, safeTx, chainId) { return __awaiter(void 0, void 0, Promise, function () {
    var cid, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = chainId;
                if (_a) return [3 /*break*/, 2];
                return [4 /*yield*/, signer.provider.getNetwork()];
            case 1:
                _a = (_b.sent()).chainId;
                _b.label = 2;
            case 2:
                cid = _a;
                return [2 /*return*/, (0, exports.signHash)(signer, (0, exports.calculateSafeTransactionHash)(safe, safeTx, cid))];
        }
    });
}); };
exports.safeSignMessage = safeSignMessage;
var buildSignatureBytes = function (signatures) {
    signatures.sort(function (left, right) { return left.signer.toLowerCase().localeCompare(right.signer.toLowerCase()); });
    var signatureBytes = "0x";
    for (var _i = 0, signatures_1 = signatures; _i < signatures_1.length; _i++) {
        var sig = signatures_1[_i];
        signatureBytes += sig.data.slice(2);
    }
    return signatureBytes;
};
exports.buildSignatureBytes = buildSignatureBytes;
var logGas = function (message, tx, skip) { return __awaiter(void 0, void 0, Promise, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, tx.then(function (result) { return __awaiter(void 0, void 0, void 0, function () {
                var receipt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, result.wait()];
                        case 1:
                            receipt = _a.sent();
                            if (!skip)
                                console.log("           Used", receipt.gasUsed.toNumber(), "gas for >".concat(message, "<"));
                            return [2 /*return*/, result];
                    }
                });
            }); })];
    });
}); };
exports.logGas = logGas;
var executeTx = function (safe, safeTx, signatures, overrides) { return __awaiter(void 0, void 0, Promise, function () {
    var signatureBytes;
    return __generator(this, function (_a) {
        signatureBytes = (0, exports.buildSignatureBytes)(signatures);
        return [2 /*return*/, safe.execTransaction(safeTx.to, safeTx.value, safeTx.data, safeTx.operation, safeTx.safeTxGas, safeTx.baseGas, safeTx.gasPrice, safeTx.gasToken, safeTx.refundReceiver, signatureBytes, overrides || {})];
    });
}); };
exports.executeTx = executeTx;
var populateExecuteTx = function (safe, safeTx, signatures, overrides) { return __awaiter(void 0, void 0, Promise, function () {
    var signatureBytes;
    return __generator(this, function (_a) {
        signatureBytes = (0, exports.buildSignatureBytes)(signatures);
        return [2 /*return*/, safe.populateTransaction.execTransaction(safeTx.to, safeTx.value, safeTx.data, safeTx.operation, safeTx.safeTxGas, safeTx.baseGas, safeTx.gasPrice, safeTx.gasToken, safeTx.refundReceiver, signatureBytes, overrides || {})];
    });
}); };
exports.populateExecuteTx = populateExecuteTx;
var buildContractCall = function (contract, method, params, nonce, delegateCall, overrides) {
    var data = contract.interface.encodeFunctionData(method, params);
    return (0, exports.buildSafeTransaction)(Object.assign({
        to: contract.address,
        data: data,
        operation: delegateCall ? 1 : 0,
        nonce: nonce
    }, overrides));
};
exports.buildContractCall = buildContractCall;
var executeTxWithSigners = function (safe, tx, signers, overrides) { return __awaiter(void 0, void 0, void 0, function () {
    var sigs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all(signers.map(function (signer) { return (0, exports.safeSignTypedData)(signer, safe, tx); }))];
            case 1:
                sigs = _a.sent();
                return [2 /*return*/, (0, exports.executeTx)(safe, tx, sigs, overrides)];
        }
    });
}); };
exports.executeTxWithSigners = executeTxWithSigners;
var executeContractCallWithSigners = function (safe, contract, method, params, signers, delegateCall, overrides) { return __awaiter(void 0, void 0, void 0, function () {
    var tx, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = exports.buildContractCall;
                _b = [contract, method, params];
                return [4 /*yield*/, safe.nonce()];
            case 1:
                tx = _a.apply(void 0, _b.concat([_c.sent(), delegateCall, overrides]));
                return [2 /*return*/, (0, exports.executeTxWithSigners)(safe, tx, signers)];
        }
    });
}); };
exports.executeContractCallWithSigners = executeContractCallWithSigners;
var buildSafeTransaction = function (template) {
    return {
        to: template.to,
        value: template.value || 0,
        data: template.data || "0x",
        operation: template.operation || 0,
        safeTxGas: template.safeTxGas || 0,
        baseGas: template.baseGas || 0,
        gasPrice: template.gasPrice || 0,
        gasToken: template.gasToken || constants_1.AddressZero,
        refundReceiver: template.refundReceiver || constants_1.AddressZero,
        nonce: template.nonce
    };
};
exports.buildSafeTransaction = buildSafeTransaction;
