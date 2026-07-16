const SandboxedModule = require('sandboxed-module')
const sinon = require('sinon')
const { expect } = require('chai')

const MODULE_PATH = require('node:path').join(
  __dirname,
  '../../../../app/src/Features/Errors/ErrorController'
)

describe('ErrorController', function () {
  beforeEach(function () {
    this.Errors = {
      NotFoundError: class NotFoundError extends Error {},
      ForbiddenError: class ForbiddenError extends Error {},
      TooManyRequestsError: class TooManyRequestsError extends Error {},
      InvalidError: class InvalidError extends Error {},
      DuplicateNameError: class DuplicateNameError extends Error {},
      InvalidNameError: class InvalidNameError extends Error {},
      NonDeletableEntityError: class NonDeletableEntityError extends Error {},
      SAMLSessionDataMissing: class SAMLSessionDataMissing extends Error {},
    }
    this.SessionManager = {
      getSessionUser: sinon.stub().returns(null),
    }
    this.SamlLogHandler = {
      promises: { log: sinon.stub().resolves() },
    }
    this.HttpErrorHandler = {
      badRequest: sinon.stub(),
    }
    this.plainTextResponse = sinon.stub()
    this.ErrorController = SandboxedModule.require(MODULE_PATH, {
      requires: {
        './Errors': this.Errors,
        '../Authentication/SessionManager': this.SessionManager,
        '../SamlLog/SamlLogHandler': this.SamlLogHandler,
        './HttpErrorHandler': this.HttpErrorHandler,
        '../../infrastructure/Response': { plainTextResponse: this.plainTextResponse },
        '@overleaf/promise-utils': {
          expressifyErrorHandler: fn => fn,
        },
      },
    })
  })

  describe('handleApiError', function () {
    beforeEach(function () {
      this.req = {
        logger: {
          addFields: sinon.stub(),
          setLevel: sinon.stub(),
        },
      }
      this.res = {
        headersSent: false,
        sendStatus: sinon.stub(),
        status: sinon.stub().returnsThis(),
        render: sinon.stub(),
      }
      this.next = sinon.stub()
    })

    describe('when headers have NOT been sent', function () {
      it('should send 404 for NotFoundError', function () {
        const err = new this.Errors.NotFoundError()
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.calledWith(404)).to.equal(true)
      })

      it('should send 429 for TooManyRequestsError', function () {
        const err = new this.Errors.TooManyRequestsError()
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.calledWith(429)).to.equal(true)
      })

      it('should send 403 for ForbiddenError', function () {
        const err = new this.Errors.ForbiddenError()
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.calledWith(403)).to.equal(true)
      })

      it('should send 500 for unknown errors', function () {
        const err = new Error('something went wrong')
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.calledWith(500)).to.equal(true)
      })
    })

    describe('when headers HAVE been sent', function () {
      beforeEach(function () {
        this.res.headersSent = true
      })

      it('should NOT call sendStatus for NotFoundError', function () {
        const err = new this.Errors.NotFoundError()
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.called).to.equal(false)
      })

      it('should NOT call sendStatus for TooManyRequestsError', function () {
        const err = new this.Errors.TooManyRequestsError()
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.called).to.equal(false)
      })

      it('should NOT call sendStatus for ForbiddenError', function () {
        const err = new this.Errors.ForbiddenError()
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.called).to.equal(false)
      })

      it('should NOT call sendStatus for unknown errors', function () {
        const err = new Error('something went wrong')
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.res.sendStatus.called).to.equal(false)
      })

      it('should not throw "headers already sent" error', function () {
        const err = new this.Errors.NotFoundError()
        expect(() => {
          this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        }).to.not.throw()
      })
    })

    describe('error classification', function () {
      it('should set warn level for NotFoundError', function () {
        const err = new this.Errors.NotFoundError()
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.req.logger.setLevel.calledWith('warn')).to.equal(true)
      })

      it('should set error level for unknown errors', function () {
        const err = new Error('something went wrong')
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.req.logger.setLevel.calledWith('error')).to.equal(true)
      })

      it('should log the error fields', function () {
        const err = new Error('test')
        this.ErrorController.handleApiError(err, this.req, this.res, this.next)
        expect(this.req.logger.addFields.calledWith({ err })).to.equal(true)
      })
    })
  })
})
