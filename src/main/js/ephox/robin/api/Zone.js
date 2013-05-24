define(
  'ephox.robin.api.Zone',

  [
    'ephox.peanut.Fun'
  ],

  function (Fun) {
    var constant = function (elements) {
      return {
        elements: Fun.constant(elements)
      };
    };

    var empty = function () {
      return constant([]);
    };

    return {
      constant: constant,
      empty: empty
    };
  }
);
