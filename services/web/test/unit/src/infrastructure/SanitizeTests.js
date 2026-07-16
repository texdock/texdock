const { expect } = require('chai')
const { sanitizeControlCharacters } = require('../../../../app/src/infrastructure/Sanitize')

describe('Sanitize', function () {
  describe('sanitizeControlCharacters', function () {
    it('should pass through normal strings unchanged', function () {
      expect(sanitizeControlCharacters('hello world')).to.equal('hello world')
    })

    it('should escape null bytes', function () {
      expect(sanitizeControlCharacters('foo\u0000bar')).to.equal('foo\\u0000bar')
    })

    it('should escape newline characters', function () {
      expect(sanitizeControlCharacters('line1\nline2')).to.equal('line1\\u000aline2')
    })

    it('should escape carriage return', function () {
      expect(sanitizeControlCharacters('before\rafter')).to.equal('before\\u000dafter')
    })

    it('should escape tab characters', function () {
      expect(sanitizeControlCharacters('a\tb')).to.equal('a\\u0009b')
    })

    it('should escape delete character', function () {
      expect(sanitizeControlCharacters('a\u007Fb')).to.equal('a\\u007fb')
    })

    it('should escape zero-width spaces', function () {
      expect(sanitizeControlCharacters('a\u200Bb')).to.equal('a\\u200bb')
    })

    it('should escape BOM', function () {
      expect(sanitizeControlCharacters('a\uFEFFb')).to.equal('a\\ufeffb')
    })

    it('should escape multiple control chars', function () {
      const input = '\u0000\u0001\u001F'
      const expected = '\\u0000\\u0001\\u001f'
      expect(sanitizeControlCharacters(input)).to.equal(expected)
    })

    it('should throw on non-string input', function () {
      expect(() => sanitizeControlCharacters(123)).to.throw(TypeError)
      expect(() => sanitizeControlCharacters(null)).to.throw(TypeError)
    })

    it('should return empty string for empty input', function () {
      expect(sanitizeControlCharacters('')).to.equal('')
    })
  })
})
