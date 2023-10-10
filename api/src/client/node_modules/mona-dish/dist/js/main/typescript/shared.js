"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gbl = void 0;
/**
 * various browsers handle the global variable different
 */
exports.gbl = ('undefined' != typeof globalThis) ? globalThis :
    ('undefined' != typeof window) ? window :
        ('undefined' != typeof global) ? global :
            null;
//# sourceMappingURL=shared.js.map