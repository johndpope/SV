var validator = require('validator');
var async = require('async');

module.exports = function(Budget) {
  // Workaround for https://github.com/strongloop/loopback/issues/292
  Budget.definition.rawProperties.created.default =
    Budget.definition.properties.created.default = function() {
    return new Date();
  };

  // Workaround for https://github.com/strongloop/loopback/issues/292
  Budget.definition.rawProperties.modified.default =
    Budget.definition.properties.modified.default = function() {
    return new Date();
  };

  Budget.observe('after save', function(ctx, next) {
    if(ctx.instance) {
      var budget = ctx.instance;
      budget.income = budget.income || 0;
      budget.expense = budget.expense || 0;

      // Update total budget in Member.
      var MemberCollection = Budget.getDataSource().connector.collection(Budget.app.models.Member.modelName);
      MemberCollection.update({"_id": budget.memberId}, {
        "$inc": { "budget" : (budget.income - budget.expense) },
        $set: { modified: new Date()}
      }, function(err, result) {
        if (err) {
          return next(err);
        }

        next();
      });
    } else {
      next();
    }
  });

  // Init model
  Budget.setup = function () {
    // check if MemberId is valid
    function validateMemberId(cb_err, done) {
      var self = this;
      if(typeof self.memberId !== 'undefined') {
        // check existence by id
        Budget.app.models.Member.exists(self.memberId, function(err, isExist) {
          if(!isExist || err) {
            cb_err();
          } else if(self.memberId == self.friendId) {
            cb_err();
          }
          done();
        });
      } else {
        // definition in .json will handle the 'required' case, so here, just done()
        done();
      }
    }
    Budget.validateAsync('memberId', validateMemberId, {message: 'Invalid memberId'});

    // check if income is valid
    function validateIncome(cb_err) {
      if(typeof this.income !== 'undefined') {
        // number and equal or greater than 0
        if(!validator.isNumeric(this.income) || this.income < 0) {
          cb_err();
        }
      }
    }
    Budget.validate('income', validateIncome, {message: 'Invalid income'});

    // check if expense is valid
    function validateExpense(cb_err) {
      if(typeof this.expense !== 'undefined') {
        // number and equal or greater than 0
        if(!validator.isNumeric(this.expense) || this.expense < 0) {
          cb_err();
        }
      }
    }
    Budget.validate('expense', validateExpense, {message: 'Invalid expense'});

    // check if note is valid
    function validateNote(cb_err) {
      if(typeof this.note !== 'undefined') {
        // string
        if(typeof this.note !== 'string') {
          cb_err();
        }
      }
    }
    Budget.validate('note', validateNote, {message: 'Invalid note'});

    // check if modified is valid
    function validateModified(cb_err) {
      if (typeof this.modified !== 'undefined') {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.modified)) {
          cb_err();
        }
      }
    }
    Budget.validate('modified', validateCreated, {message: 'Invalid modified'});

    // check if created is valid
    function validateCreated(cb_err) {
      if (typeof this.created !== 'undefined') {
        // yyyy-mm-dd, from 1900-01-01 to 2099-12-31
        if (!validator.isDate(this.created)) {
          cb_err();
        }
      }
    }
    Budget.validate('created', validateCreated, {message: 'Invalid created'});
  };

  Budget.setup();
};
