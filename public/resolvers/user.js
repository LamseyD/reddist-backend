"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const User_1 = require("../entities/User");
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
const constants_1 = require("../constants");
const UsernamePasswordInput_1 = require("../entities/UsernamePasswordInput");
const validateRegister_1 = require("../utils/validateRegister");
const UserResponse_1 = require("../entities/UserResponse");
const sendEmail_1 = require("../utils/sendEmail");
const uuid_1 = require("uuid");
let UserResolver = class UserResolver {
    email(user, { req }) {
        if (req.session.userId === user.id) {
            return user.email;
        }
        return "";
    }
    changePassword(token, newPassword, { redisClient, req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword.length <= 3) {
                return {
                    errors: [{
                            field: "password",
                            message: "length must be greater than 3"
                        }]
                };
            }
            const userId = yield redisClient.get(constants_1.FORGOT_PASSWORD_PREFIX + token);
            if (!userId) {
                return {
                    errors: [{
                            field: "token",
                            message: "token has expired"
                        }]
                };
            }
            const user = yield User_1.User.findOne(parseInt(userId));
            if (!user) {
                return {
                    errors: [{
                            field: "token",
                            message: "user no longer exists"
                        }]
                };
            }
            user.password = yield argon2_1.default.hash(newPassword);
            User_1.User.update({ id: parseInt(userId) }, { password: user.password });
            yield redisClient.del(constants_1.FORGOT_PASSWORD_PREFIX + token);
            req.session.userId = user.id;
            return { user };
        });
    }
    forgotPassword(email, { redisClient }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: { email } });
            if (!user) {
                return true;
            }
            const token = uuid_1.v4();
            yield redisClient.set(constants_1.FORGOT_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24);
            yield sendEmail_1.sendEmail(email, `<a href="http://localhost:3000/changePassword/${token}"> reset password </a>`);
            return true;
        });
    }
    me({ req }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.userId))
                return;
            const user = yield User_1.User.findOne(req.session.userId);
            console.log(req.session.userId);
            return user;
        });
    }
    register(options, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = validateRegister_1.validateRegister(options);
            if (errors)
                return { errors };
            const hashedPassword = yield argon2_1.default.hash(options.password);
            const user = User_1.User.create({
                username: options.username,
                email: options.email,
                password: hashedPassword
            });
            try {
                yield user.save();
                console.log(user);
            }
            catch (err) {
                console.log("error: ", err);
                if (err.sqlMessage.includes("for key 'user.user_email_unique'")) {
                    return {
                        errors: [{
                                field: "email",
                                message: "email already exists"
                            }]
                    };
                }
                if (err.sqlState === "23000")
                    return {
                        errors: [{
                                field: "username",
                                message: "username already exists",
                            }]
                    };
            }
            req.session.userId = user.id;
            return {
                user
            };
        });
    }
    login(username, password, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({ where: { username } });
            if (!user) {
                return {
                    errors: [{
                            field: "username",
                            message: 'that username doesnt exist'
                        }]
                };
            }
            const valid = yield argon2_1.default.verify(user.password, password);
            if (!valid) {
                return {
                    errors: [
                        {
                            field: "password",
                            message: "incorrect password",
                        }
                    ]
                };
            }
            req.session.userId = user.id;
            return {
                user
            };
        });
    }
    logout({ req, res }) {
        return new Promise((resolve) => req.session.destroy(err => {
            if (err) {
                console.log(err);
                resolve(false);
                return;
            }
            res.clearCookie(constants_1.COOKIE_NAME);
            resolve(true);
        }));
    }
};
__decorate([
    type_graphql_1.FieldResolver(() => String),
    __param(0, type_graphql_1.Root()),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [User_1.User, Object]),
    __metadata("design:returntype", String)
], UserResolver.prototype, "email", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse_1.UserResponse),
    __param(0, type_graphql_1.Arg('token')),
    __param(1, type_graphql_1.Arg('newPassword')),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Arg("email")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    type_graphql_1.Query(() => User_1.User, { nullable: true }),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse_1.UserResponse),
    __param(0, type_graphql_1.Arg('options')),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UsernamePasswordInput_1.UsernamePasswordInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse_1.UserResponse),
    __param(0, type_graphql_1.Arg('username')),
    __param(1, type_graphql_1.Arg('password')),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
UserResolver = __decorate([
    type_graphql_1.Resolver(User_1.User)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map