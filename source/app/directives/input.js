angular.module('filters').directive('input', function() {
    return {
        restrict : 'E',
        require : ['?ngModel'],
        priority : 100,
        link : function( scope, element, attr, ngModel ) {
            if ( attr.type === "date" ) {
                var model = ngModel[0];
                model.$parsers.length = 0;
                model.$formatters.length = 0;
            }
        }
    };
} );
