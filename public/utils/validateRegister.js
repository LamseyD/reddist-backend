"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
function validateRegister(options) {
    if (!options.email.includes('@')) {
        return [{
                field: "email",
                message: "not a valid email"
            }];
    }
    if (options.username.includes("@")) {
        return [{
                field: "username",
                message: "cannot include an @"
            }];
    }
    if (options.username.length <= 2) {
        return [{
                field: "username",
                message: "length must be greater than 2"
            }];
    }
    if (options.password.length <= 3) {
        return [{
                field: "password",
                message: "length must be greater than 3"
            }];
    }
    return null;
}
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map