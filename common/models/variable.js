module.exports = function(Variable) {

  // Init variable values.
  Variable.initValues = function(next) {
    Variable.app.models.LeprechaunHistory.initVarsInMonth(next);
  };
};