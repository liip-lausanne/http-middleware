import express from 'express';
import { HttpHandler } from 'msw';
export declare function createServer(...handlers: Array<HttpHandler>): express.Express;
