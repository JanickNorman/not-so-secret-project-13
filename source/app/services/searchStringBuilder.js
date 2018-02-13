angular.module('services').factory('searchStringBuilder', [function () {
    const operatorList = {
        "less_than": {
            key: "less_than",
            name: "Less Than",
            symbol: "<"
        },
        "less_than_equal": {
            key: "less_than_equal",
            name: "Less Than Equal",
            symbol: "<="
        },
        "equals": {
            key: "equal",
            name: "Equal",
            symbol: ":"
        },
        "more_than_equal": {
            key: "more_than_equal",
            name: "More Than Equal",
            symbol: ">="
        },
        "more_than": {
            key: "more_than",
            name: "More Than",
            symbol: ">"
        },
        "is": {
            key: "is",
            name: "Is",
            symbol: ":"
        },
        "is_not": {
            key: "is_not",
            name: "Is Not",
            symbol: "-",
            decorate_on_key: true
        },
        "include": {
            key: "include",
            name: "Include",
            symbol: ":"
        },
        "exclude": {
            key: "exclude",
            name: "Exclude",
            symbol: "-",
            decorate_on_key: true
        },
        "null": {
            key: "is",
            name: "Is",
            symbol: ":"
        }
    }
    const operatorValuesByType = {
        "date": ["less_than", "less_than_equal", "equals", "more_than_equal", "more_than"],
        "dropdown": ["is", "is_not"],
        "text": ["include", "exclude"]
	};

	return {
        build: function(type, key, operator, value) {
            var value = /\s/.test(value) ? "\"" + value + "\"" : value;
            var value = value ? value : "none";
            var symbol = this.getOperatorSymbol(operator); //operator.symbol
            var operator = this.getOperatorDetail(operator);
            debugger;
            // If key or value is empty or null, just skip
            if (!key) return;

            if (operator.decorate_on_key) {
                return symbol + key + ":" + value;
            }
            // Concatinate key with value
            return key + symbol + value;
        },
        getOperatorsByType: function(type) {
            var operators = [];
            var operatorValues = this.getOperatorValuesByType(type);
            operatorValues.forEach((value) => {
                operators.push(this.getOperatorDetail(value));
            });
            return operators;
        },
        getOperatorValuesByType: function(type) {
            // default to text
            return operatorValuesByType[type] ? operatorValuesByType[type] : operatorValuesByType["text"];
        },
        getOperatorDetail: function(value) {
            // default to null object
            return operatorList[value] ? operatorList[value] : operatorList["null"];
        },
        getOperatorSymbol: function(value) {
            var operator = this.getOperatorDetail(value);
            var symbol;
            try {
                symbol = operator.symbol;
            } catch (e) {
                symbol = ":";
            }
            return symbol;
        }
    }
}]);
