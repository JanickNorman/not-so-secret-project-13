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
								var newResult = JSON.parse(JSON.stringify(result));

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
				  if (index < (filters.length - 1)) { searchString += " " }
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
	  },
	  loadOrganizationsByName: function() {
		// var mockObject = {
		// 	"D 1111": {
		// 		"url": "https://treesdemo11496822632.zendesk.com/api/v2/organizations/360001148015.json",
		// 		"id": 360001148015,
		// 		"name": "D 1111",
		// 		"shared_tickets": false,
		// 		"shared_comments": false,
		// 		"external_id": null,
		// 		"created_at": "2017-10-24T07:40:18Z",
		// 		"updated_at": "2017-10-24T07:40:18Z",
		// 		"domain_names": [],
		// 		"details": "",
		// 		"notes": "",
		// 		"group_id": null,
		// 		"tags": [],
		// 		"organization_fields": {}
		// 	},
		// 	"D 2222": {
		// 		"url": "https://treesdemo11496822632.zendesk.com/api/v2/organizations/360001148035.json",
		// 		"id": 360001148035,
		// 		"name": "D 2222",
		// 		"shared_tickets": false,
		// 		"shared_comments": false,
		// 		"external_id": null,
		// 		"created_at": "2017-10-25T07:40:18Z",
		// 		"updated_at": "2017-10-25T07:40:18Z",
		// 		"domain_names": [],
		// 		"details": "",
		// 		"notes": "",
		// 		"group_id": null,
		// 		"tags": [],
		// 		"organization_fields": {}
		// 	},
		// 	"D 3333": {
		// 		"url": "https://treesdemo11496822632.zendesk.com/api/v2/organizations/360001148055.json",
		// 		"id": 360001148055,
		// 		"name": "D 3333",
		// 		"shared_tickets": false,
		// 		"shared_comments": false,
		// 		"external_id": null,
		// 		"created_at": "2017-10-26T07:40:18Z",
		// 		"updated_at": "2017-10-26T07:40:18Z",
		// 		"domain_names": [],
		// 		"details": "",
		// 		"notes": "",
		// 		"group_id": null,
		// 		"tags": [],
		// 		"organization_fields": {}
		// 	},
		// 	"D 4444": {
		// 		url: "https://treesdemo11496822632.zendesk.com/api/v2/organizations/360001121016.json",
		// 		id: 360001121016,
		// 		name: "D 4444",
		// 		shared_tickets: false,
		// 		shared_comments: false,
		// 		external_id: null,
		// 		created_at: "2018-03-01T07:01:32Z",
		// 		updated_at: "2018-03-01T07:01:32Z",
		// 		domain_names: [ ],
		// 		details: "",
		// 		notes: "",
		// 		group_id: null,
		// 		tags: [ ],
		// 		organization_fields: { }
		// 	}
		// };

		var deferred = $q.defer();
		var organizations = [];

		function loadAll(url) {
			client.request(url).then(response => {
				console.log(response); debugger;
				var next_page = response.next_page;
				var results = response.organizations;

				results.forEach(result => {
					organizations.push(result);
				});

				if (next_page != null) {
					return loadAll(next_page);
				}

				var result = organizations.reduce((organizationsByName, organization) => {
					if (!organizationsByName[organization.name]) {
						organizationsByName[organization.name] = organization;
					}

					return organizationsByName;
				}, {});
				console.log(result); debugger;
				return deferred.resolve(result);
			})
			.catch((error) => {
				console.log(error); debugger;
				return deferred.reject(error);
			});
		}
		loadAll('/api/v2/organizations');

		// deferred.resolve(mockObject);
		return deferred.promise;
	  }
	};
}]);
