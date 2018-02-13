angular.module('controllers').controller('MainController', ['$scope', '$http', '$element', '$window', 'zendeskService', 'surveyMonkeyService', 'filtersFactory', 'searchStringBuilder', 'NgTableParams', 'Notification', '$modal', 'ZAF_CONTEXT', function($scope, $http, $element, $window, zendeskService, surveyMonkeyService, filtersFactory, searchStringBuilder, NgTableParams, Notification, $modal, ZAF_CONTEXT) {
    $scope.subdomain = ZAF_CONTEXT.account.subdomain;
    $scope.notifications = [];
    $scope.surveys = [];
    $scope.collectors = [];
    $scope.messages = [];
    $scope.filters = [];
    $scope.userTable = {
        checkedAll: true,
        userList: []
    }
    $scope.userListTableParams = userListTableParamsSetting($scope.userTable.userList);
    $scope.getCollectorsIsLoading = false;
    $scope.surveyFormSelections = {
        survey: null,
        collector: null,
        message: null
    };
    $scope.tokenIsValid = true;

    $scope.$watch(() => {
        return $scope.userTable.checkedAll;
    }, (value) => {
        $scope.userTable.userList.map((user) => {
            user.checked = value;
        });
    });

    $scope.init = function() {
        $scope.userListTableParams = userListTableParamsSetting($scope.userTable.userList);
        $scope.surveyFormSelections = {
            survey: null,
            collector: null,
            message: null
        }; 
        $scope.submitButtonDisabled = false;       

        $scope.getSurveyIsLoading = true;
        surveyMonkeyService.getSurveys().then(function(result) {
            $scope.tokenIsValid = true;
            var surveys = result.data.data;
            $scope.getSurveyIsLoading = false;
            $scope.surveys = surveys;
        }, function(response) {
            var status = response.status;
            var message = response.data.error.message;

            $scope.getSurveyIsLoading = false;
            if (status == 401) {
                $scope.tokenIsValid = false;
                $modal.open({
                  templateUrl: 'invalid_token_template.html',
                  backdrop: true,
                  size: 'lg'
                });
                // Popeye.open('dialog_template.html', {msg: message});
                return;
            }

            if (status == 429) {
                var message = "We've detected too many request, please try again later";
                $scope.notifyError("error", message);
                return;
            }

            $scope.notifyError("error", message);
        });

    }

    $scope.init();

    $scope.getFiltersDataIsLoading = true;
    filtersFactory.getData().then(function(data) {
        $scope.getFiltersDataIsLoading = false;
        $scope.filterKeys = data;
    }, function(error) {
        console.log(error);
        $scope.getFiltersDataIsLoading = false;
    });

    $scope.handleSurveyChange = function(selectedSurvey) {
        $scope.getCollectorsIsLoading = true;
        cancelAllRequests();

        // $scope.selectedSurvey = selectedSurvey;
        var surveyId = selectedSurvey.id;

        // Nullifying child dropdowns
        $scope.collectors.length = 0;
        $scope.collectors = [];
        $scope.surveyFormSelections.collector = null;
        $scope.messages.length = 0;
        $scope.messages = [];
        $scope.surveyFormSelections.message = null;

        surveyMonkeyService.loadCollectorsWithDetail(surveyId).then(function(collectors) {
            $scope.collectors = collectors.filter(collector => collector.type == "email");
            $scope.getCollectorsIsLoading = false;
        }, function(error) {
            $scope.getCollectorsIsLoading = false;
        })
    }

    $scope.handleCollectorChange = function(selectedCollector) {
        $scope.getMessagesIsLoading = true;

        cancelAllRequests();

        // $scope.selectedCollector = selectedCollector;
        var collectorId = selectedCollector.id;

        // Nullifying child dropdowns
        $scope.messages.length = 0;
        $scope.surveyFormSelections.message = null;
        $scope.messages = [];

        surveyMonkeyService.loadMessagesWithDetail(collectorId).then(function(messages) {
            $scope.messages = messages.filter((message, index, array) => {
                var ceilingNumber = array.length <= 10 ? array.length : 10;
                var name = "Invitation message " + (ceilingNumber - index);
                message.displayed_title = name + ": \"" + message.subject + "\"";
                return message.status == 'not_sent' && !message.is_scheduled;
            });
            $scope.getMessagesIsLoading = false;
        }, function(error) {
            $scope.getMessagesIsLoading = false;
        })
    }

    $scope.handleMessageChange = function(selectedMessage) {
        cancelAllRequests();

        // $scope.selectedMessage = selectedMessage;
    }

    $scope.handleFilterFieldChange = function(filter) {
        // Nullify the corresponding field
        filter.selectedValue = null
        // console.log(filter);
    }

    $scope.searchUser = function() {
        var filters = $scope.filters;

        $scope.searchString = $scope.generateSearchString(filters);

        $scope.searchUserIsLoading = true;
        zendeskService.loadUsers(filters).then(function(users) {
            $scope.userTable.userList = users;
            $scope.userListTableParams = userListTableParamsSetting($scope.userTable.userList);
            $scope.userListTableParams.reload();
            $scope.searchUserIsLoading = false;

            $scope.$apply();
        }, function(error) {
            console.log(error);
            $scope.searchUserIsLoading = false;
        })
    }

    $scope.addFilter = function() {
        $scope.filters.push({
            "selectedField": null,
            "selectedOperator": null,
            "selectedValue": null
        })
        console.log($scope.filters);
    }

    $scope.removeFilter = function(index) {
        $scope.filters.splice(index, 1)
    }

    $scope.clearFilters = function() {
        $scope.filters.length = 0;
    }

    $scope.getOperatorsByType = function(type) {
        return searchStringBuilder.getOperatorsByType(type);
    }

    $scope.submit = function() {
        $scope.submitButtonDisabled = true;
        var collectorId = $scope.surveyFormSelections.collector.id;
        var messageId = $scope.surveyFormSelections.message.id;

        var data = {
            contacts: []
        };
        $scope.userTable.userList.forEach(function(user) {
            if (!user.checked) {
                return false;
            }
            data.contacts.push({email: user.email})
        });

        $scope.submitToSurveyMonkeyIsLoading = true;
        surveyMonkeyService.addRecipients(collectorId, messageId, data).then(function(response) {
            var succeeded = response.data.succeeded;
            var duplicate = response.data.duplicate;
            var existing = response.data.existing;
            var total_succeess = succeeded.length + existing.length;

            var notification_title = 'Success adding '+ total_succeess +' recipients';
            var notification_message = 'on survey: \"'+ $scope.surveyFormSelections.survey.title +'\"; succeeded: ' + succeeded.length + ', duplicate: ' + duplicate.length + ', existing: ' + existing.length;
            $scope.notifySuccess(notification_title, notification_message);

            return surveyMonkeyService.sendMessage(collectorId, messageId, {});
        })
        .then(function(response) {
            var scheduled_date = response.data.scheduled_date;
            var date = new Date(scheduled_date).toString();            
            
            var notification_title = "Success sending survey";
            var notification_message = "Scheduled at: " + date;
            $scope.notifySuccess(notification_title, notification_message);

            $scope.submitToSurveyMonkeyIsLoading = false;
            $scope.init();
        })
        .catch(function(response) {
            var message = response.data.error.message;

            $scope.notifyError("Error", message);

            $scope.submitButtonDisabled = false;
            $scope.submitToSurveyMonkeyIsLoading = false;
        });
    }

    $scope.generateSearchString = function(filters) {
        return zendeskService.generateSearchString(filters);
    }

    // this function is supposed to abstract loading in the option field from a dropdown type input NEED REFACTOR to filtersFactory AND TEST
    $scope.loadDropdownOptions = function(field) {
        if (field['custom_field_options']) {
            field['options'] = field['custom_field_options'];
        }
        if (field["field_options_api"]) {
            zendeskService.loadResource(field['field_options_api'])
            .then(function(result) {
                // NEED TEST BADLY
                var resources = result[field['field_options_api']].map(field["option_map"]);
                field['options'] = field['initial_options'] ? field['initial_options'].concat(resources) : resources;
            })
            .catch(function(error) {
                field['options'] = field['options'] ? field['options'] : [{name: "Aloha", key: "aloha", value: "Aloha"}];
            })
        }
        console.log(field);
    }

    $scope.notifySuccess = function(title, message) {
        $scope.notifications.push({title: title, message: message, type: "success"});
        $window.scrollTo(0, 0);
    }

    $scope.notifyError = function(title, message) {
        $scope.notifications.push({title: title, message: message, type: "error"});
        $window.scrollTo(0, 0);
    }

    $scope.closeNotification = function(index) {
        $scope.notifications.splice(index, 1);
    }


    function userListTableParamsSetting(data) {
        return new NgTableParams({count: 10}, { counts: [], dataset: data});
    }

    function cancelAllRequests()
    {
        $http.pendingRequests.forEach(function(request) {
            if (request.cancel) {
                console.log(request.cancel);
                request.cancel.reject();
            }
        });
    }
}]);
