angular.module('services').service("surveyMonkeyService", ['$http', '$q', 'ZAF_CONTEXT', 'ZAF_METADATA', function($http, $q, ZAF_CONTEXT, ZAF_METADATA) {

	// var SM_TOKEN = ZAF_METADATA.settings.survey_monkey_token ? ZAF_METADATA.settings.survey_monkey_token : "";

	// var SM_TOKEN = "apzqGssqUXFDD35T4S1gtQmu1hKOw3OyYAo5yO4B4JndJ9-P1vBoR4IMcKJELzmX96Z1sShRfp5k-Hr6misSJU0ekatmuF-JabnOag2BiDObFgfFoCnzOQnB0mY2cnVB";
	// var SM_TOKEN = "ylknOAfU7xHtNw0hpLlv88WCOurWy9BHN-pOgmJsHAm2cZtmxagTDNymDj-1zl08gQjxsJKIr4x4cch0c-XPu5pgCjxAcbVc-KuUBNpzXe2BOg4OnamC5Fq1Lxo8OLQ4";
	//Tes-fif-itnegration app
	// console.log(ZAF_CONTEXT);
	// console.log(ZAF_METADATA.settings.survey_monkey_token);
	var SM_TOKEN = ZAF_METADATA.settings.survey_monkey_token ? ZAF_METADATA.settings.survey_monkey_token : "";

	return {
		getSurveys: function() {
			var cancel = $q.defer();
			var config = {
				url: 'https://api.surveymonkey.net/v3/surveys',
				type: 'GET',
				dataType: "json",
				async: false,
				cors: true,
				cache: true,
				contentType: 'application/json',
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				timeout: cancel.promise,
				cancel: cancel
			}

			return $http(config);
		},

		getCollectors: function(surveyId) {
			var cancel = $q.defer();
			var getCollectors = {
				url: 'https://api.surveymonkey.net/v3/surveys/'+surveyId+'/collectors',
				type: 'GET',
				dataType: "json",
				async: false,
				cors: true,
				cache: true,
				contentType: 'application/json',
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				timeout: cancel.promise,
				cancel: cancel
			}

			return $http(getCollectors);
		},
		getCollector: function(collectorId) {
			var cancel = $q.defer();
			var getCollectors = {
				url: 'https://api.surveymonkey.net/v3/collectors/'+collectorId,
				type: 'GET',
				dataType: "json",
				cors: true,
				cache: true,
				contentType: 'application/json',
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				timeout: cancel.promise,
				cancel: cancel
			}

			return $http(getCollectors);
		},
		getMessages: function(collectorId) {
			var cancel = $q.defer();
			var getMessages = {
				url: 'https://api.surveymonkey.net/v3/collectors/'+collectorId+'/messages',
				type: 'GET',
				dataType: "json",
				async: false,
				cors: true,
				contentType: 'application/json',
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				timeout: cancel.promise,
				cancel: cancel
			}
			return $http(getMessages);
		},
		getMessage: function(collectorId, messageId) {
			var cancel = $q.defer();
			var config = {
				url: 'https://api.surveymonkey.net/v3/collectors/'+collectorId+'/messages/'+messageId,
				type: 'GET',
				dataType: "json",
				async: false,
				cors: true,
				contentType: 'application/json',
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				timeout: cancel.promise,
				cancel: cancel
			}
			return $http(config);
		},
		get: function(url) {
			var cancel = $q.defer();
			var config = {
				url: url,
				type: 'GET',
				dataType: "json",
				async: false,
				cors: true,
				contentType: 'application/json',
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				timeout: cancel.promise,
				cancel: cancel
			}
			return $http(config);
		},

		// https://api.surveymonkey.net/v3/collectors/{{COLLECTOR_ID}}/messages/{{MESSAGE_ID}}/recipient
		addRecipients: function(collectorId, messageId, data) {
			var cancel = $q.defer();
			var url = 'https://api.surveymonkey.net/v3/collectors/'+collectorId+'/messages/'+messageId+'/recipients/bulk';
			var config = {
				method: 'POST',
				url: url,
				cors: true,
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				contentType: 'application/json',
				timeout: cancel.promise,
				cancel: cancel
			}
			return $http.post(url, data, config);
		},

		sendMessage: function(collectorId, messageId, data) {
			var cancel = $q.defer();
			var url = 'https://api.surveymonkey.net/v3/collectors/'+collectorId+'/messages/'+messageId+'/send';
			var config = {
				method: 'POST',
				url: url,
				cors: true,
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				contentType: 'application/json',
				timeout: cancel.promise,
				cancel: cancel
			}
			return $http.post(url, data, config);
		},

		postContact: function(data) {
			var cancel = $q.defer();
			var getCollectors = {
				url: 'https://api.surveymonkey.net/v3/contacts',
				type: 'POST',
				dataType: "json",
				async: false,
				data: data,
				cors: true,
				contentType: 'application/json',
				headers: {
					"Authorization": "Bearer " + SM_TOKEN
				},
				timeout: cancel.promise,
				cancel: cancel
			}

			return $http(getCollectors);
		},

		loadCollectorsWithDetail: function(surveyId) {
			var deferred = $q.defer();

			this.getCollectors(surveyId).then((result) => {
				var collectors = result.data.data;

				if (collectors.length < 1) {
					return deferred.resolve(collectors);
				}

				var ctr = 0;
				collectors.forEach((collector, index, array) => {
					var collectorId = collector.id;
					this.getCollector(collectorId).then((result) => {
						var collectorDetail = result.data;
						array[index] = collectorDetail;

						ctr++;
						if (ctr == array.length) {
							deferred.resolve(collectors);
						}
					}, (error) => {
						deferred.reject(error);
					});
				});
			}, function(error) {
				deferred.reject(error);
			});
			return deferred.promise;
		},

		loadMessagesWithDetail: function(collectorId) {
			var deferred = $q.defer();

			this.getMessages(collectorId).then((result) => {
				var messages = result.data.data;

				if (messages.length < 1) {
					return deferred.resolve(messages);
				}

				var ctr = 0;
				messages.forEach((message, index, array) => {
					var messageId = message.id;

					this.getMessage(collectorId, messageId).then((result) => {
						var messageDetail = result.data;
						array[index] = messageDetail;
						ctr++;
						if (ctr == array.length) {
							deferred.resolve(messages);
						}
					}, (error) => {
						deferred.reject(error);
					});
				});
			}, function(error) {
				deferred.reject(error);
			});
			return deferred.promise;
		},

		loadRecipients: function(collectorId, messageId) {
			var self = this;
			var deferred = $q.defer();
			var data = [];

			function loadAll(url) {
				self.get(url).then(response => {
					console.log(response); debugger;
					var next_page = response.data.links.next;
					var results = response.data.data;

					results.forEach(result => {
						data.push(result);
					});
					if (next_page != null) {
						return loadAll(next_page);
					}
					return deferred.resolve(data);
				})
				.catch((error) => {
					return deferred.reject(error);
				})
			}
			loadAll('https://api.surveymonkey.net/v3/collectors/' + collectorId + '/messages/' + messageId + '/recipients?per_page=100');
			return deferred.promise
		}
	}
}]);
