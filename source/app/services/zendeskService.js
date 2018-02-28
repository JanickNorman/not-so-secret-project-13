angular.module('services').service("zendeskService", ['$q', 'ZAFClient', 'searchStringBuilder', function($q, client, searchStringBuilder) {
	String.prototype.contains = function(str) { return this.indexOf(str) != -1; };

	return {
		loadUsers: function(filters) {
			var deferred = $q.defer();
			var users = [];
			var searchString = this.generateSearchString(filters)

			function loadAll(url) {
				client.request(url).then(response => {
					var next_page = response.next_page;
					var results = response.results;

					results.map(result => {
						var hasDealer = false;
						result.checked = true;
						if (result.email == null) {
							return;
						}

						var tagCount = 1;
						result.tags.map((tag) => {
							//check if tag indicates dealer information
							debugger;
							if  (tag.contains("~")) {
								hasDealer = true;
								var newResult = {...result};

								tag.split("~").forEach((info, index, array) => {
									switch (index) {
										case 0:
											newResult.dealer = info;
											break;
										case 1:
											newResult.cabang = info
											break;
										case 2:
											newResult.quadran = info
											break;
										case 3:
											newResult.panel = info
											break;
										default:
									}
								});
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
	  createManyTickets: function(data) {
		  var config = {
			  url: '/api/v2/tickets/create_many',
			  type: 'POST',
			  dataType : "json",
			  contentType: "application/json; charset=utf-8",
			  async: false,
			  data: JSON.stringify(data)
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
	  },
	  createManyUsers: function(data) {
		  var config = {
			  url: '/api/v2/users/create_many',
			  type: 'POST',
			  dataType : "json",
			  contentType: "application/json; charset=utf-8",
			  async: false,
			  data: JSON.stringify(data)
		  };
		  return client.request(config);
	  },
	  createManyTickets: function(data) {
		  var config = {
			  url: '/api/v2/tickets/create_many',
			  type: 'POST',
			  dataType : "json",
			  contentType: "application/json; charset=utf-8",
			  async: false,
			  data: JSON.stringify(data)
		  };
		  return client.request(config);
	  },
	  // THIS METHOD MODIFY THE PARAMETER BY REFERENCE
	  createManyTicketsBulk: function(tickets) {
		  	console.log(tickets); debugger;
			const CHUNKSIZE = 100;
			const NUM_OF_TICKETS = tickets.length;
			const NUM_OF_ITERATION = Math.floor(NUM_OF_TICKETS / CHUNKSIZE);
			var self = this;
			var deferred = $q.defer();
			var jobs = [];

			var counter = 0;
			while(tickets.length) {
				var ticketsChunk = tickets.splice(0, CHUNKSIZE);

				self.createManyTickets({tickets: ticketsChunk})
				.then((result) => {
					console.log(result);
					jobs.push(result);
				})
				.catch((error) => {
					console.log(error);
					jobs.push(error);
				})
				.finally(() => {
					counter++;
					if (counter >= NUM_OF_ITERATION) {
						deferred.resolve(jobs);
					}
				});
			}
			return deferred.promise
	  }
	};
}]);
