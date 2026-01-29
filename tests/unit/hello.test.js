const { assert } = require('chai');

describe('hello', function () {
    describe('world', function () {
        it('should hello world', function () {
            let str = "Hello World";

            assert.isString(str);
            assert.isNotEmpty(str);
            assert.equal(str, "Hello World");
        });
    });
});
