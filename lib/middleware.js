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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMiddleware = void 0;
const node_stream_1 = require("node:stream");
const node_crypto_1 = __importDefault(require("node:crypto"));
const msw_1 = require("msw");
const strict_event_emitter_1 = require("strict-event-emitter");
const emitter = new strict_event_emitter_1.Emitter();
function createMiddleware(...handlers) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const serverOrigin = `${req.protocol}://${req.get('host')}`;
        const method = req.method || 'GET';
        // Ensure the request body input passed to the MockedRequest
        // is always the raw body from express req.
        // "express.raw({ type: '*/*' })" must be used to get "req.body".
        const mockedRequest = new Request(
        // Treat all relative URLs as the ones coming from the server.
        new URL(req.url, serverOrigin), {
            method: req.method,
            headers: new Headers(req.headers),
            credentials: 'omit',
            // Request with GET/HEAD method cannot have body.
            body: ['GET', 'HEAD'].includes(method) ? undefined : req.body,
        });
        yield (0, msw_1.handleRequest)(mockedRequest, node_crypto_1.default.randomUUID(), handlers, {
            onUnhandledRequest: () => null,
        }, emitter, {
            resolutionContext: {
                /**
                 * @note Resolve relative request handler URLs against
                 * the server's origin (no relative URLs in Node.js).
                 */
                baseUrl: serverOrigin,
            },
            onMockedResponse: (mockedResponse) => __awaiter(this, void 0, void 0, function* () {
                const { status, statusText, headers } = mockedResponse;
                res.statusCode = status;
                res.statusMessage = statusText;
                headers.forEach((value, name) => {
                    res.setHeader(name, value);
                });
                if (mockedResponse.body) {
                    const stream = node_stream_1.Readable.fromWeb(mockedResponse.body);
                    stream.pipe(res);
                }
                else {
                    res.end();
                }
            }),
            onPassthroughResponse() {
                next();
            },
        });
    });
}
exports.createMiddleware = createMiddleware;
