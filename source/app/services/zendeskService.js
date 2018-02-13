angular.module('services').service("zendeskService", ['$q', 'ZAFClient', 'searchStringBuilder', function($q, client, searchStringBuilder) {
	return {
		loadUsers: function(filters) {
			var deferred = $q.defer();
			var users = [];
			var searchString = this.generateSearchString(filters)

			function loadAll(url) {
				client.request(url).then(response => {
					var next_page = response.next_page;
					var results = response.results;

					resultCounter = 1;
					results.map(result => {
						var hasDealer = false;
						result.checked = true;
						if (result.email == null) {
							return;
						}

						var tagCount = 1;
						result.tags.map((tag) => {
							if (/^organization/.test(tag)) {
								// result.dealer = tag;
								hasDealer = true;
								var newResult = {...result};
								// newResult.id = resultCounter;
								newResult.asDealer = tag;
								resultCounter++;
								users.push(newResult);
							}
						});

						if (!hasDealer) {
							users.push(result);
						}
					})
					if (next_page != null) {
						return loadAll(next_page);
					}
					return deferred.resolve(users);
				})
				.catch((error) => {
					return deferred.reject(error);
				})
			}
			loadAll('/api/v2/search.json?query=type:user '+ searchString);
			return deferred.promise
		},
		getUserFields: function() {
			var getUserFieldsParam = {
				url: '/api/v2/user_fields.json',
				type: 'GET',
				dataType : "json",
				contentType: "application/json; charset=utf-8",
				async: false,
			};
			return client.request(getUserFieldsParam);
		},
		searchUser: function(searchString) {
		  var searchUserParam = {
		    url: '/api/v2/search.json?query=type:user '+ searchString,
		    type: 'GET',
		    dataType : "json",
		    contentType: "application/json; charset=utf-8",
		    async: true,
		  };
		  return client.request(searchUserParam);
	  },
	  loadResource: function(resource) {
		  var config = {
			  url: '/api/v2/'+resource+'.json',
			  type: 'GET',
			  dataType : "json",
			  contentType: "application/json; charset=utf-8",
			  async: false,
		  };
		  return client.request(config);
	  },
	  generateSearchString: function(filters) {
		  var searchString = "";
		  filters.forEach(function(filter, index) {
			  try {
				  var type = filter.selectedField.type;
				  var key = filter.selectedField.key;
				  var operator = filter.selectedOperator.key;
				  var value = filter.selectedValue;

				  // var value = /\s/.test(filter.selectedValue) ? "\"" + filter.selectedValue + "\"" : filter.selectedValue;
				  // var value = value ? value : "none";
				  // console.log(searchStringBuilder.build(type, key, operator, value));
				  // If key or value is empty or null, just skip
				  // if (!key) return;
				  // searchString += searchStringBuilder.build(type, key, operator, value);
				  // Concatinate key with value
				  searchString += searchStringBuilder.build(type, key, operator, value);

				  // add space if item is not the last item
				  if (index < (filters.length - 1)) { searchString += " " };
			  } catch (error) {
				  console.error(error);
			  }
		  });
		  return searchString;
	  }
	};
}]);
