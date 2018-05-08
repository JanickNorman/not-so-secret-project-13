angular.module('controllers').controller('MainController', ['$scope', '$http', '$element', '$window', 'zendeskService', 'surveyMonkeyService', 'filtersFactory', 'searchStringBuilder', 'NgTableParams', '$modal', 'ZAF_CONTEXT', 'ZAF_METADATA', function($scope, $http, $element, $window, zendeskService, surveyMonkeyService, filtersFactory, searchStringBuilder, NgTableParams, $modal, ZAF_CONTEXT, ZAF_METADATA) {

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
            handleSurveyMonkeyError(response, (status, message) => {
                $scope.getSurveyIsLoading = false;
            });
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
            $scope.collectors = collectors.filter(function(collector){ return collector.type === "email"});
            $scope.getCollectorsIsLoading = false;
        }, function(error) {
            handleSurveyMonkeyError(error, (status, message) => {});
            $scope.getCollectorsIsLoading = false;
        });
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
                return message.status === 'not_sent' && !message.is_scheduled;
            });
            $scope.getMessagesIsLoading = false;
        }, function(error) {
            handleSurveyMonkeyError(error, (status, message) => {});
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
            console.log($scope.userTable.userList); debugger;
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
        let selectedUsers = [];
        var surveyId = $scope.surveyFormSelections.survey.id;
        var surveyTitle = $scope.surveyFormSelections.survey.title;
        var collectorId = $scope.surveyFormSelections.collector.id;
        var messageId = $scope.surveyFormSelections.message.id;

        // Build survey monkey compatible recipients adding
        var data = {
            contacts: []
        };
        $scope.userTable.userList.forEach(function(user) {
            if (!user.checked) {
                return false;
            }

            // WARNING this code is redundant
            data.contacts.push({email: user.email})
            selectedUsers.push(user);
        });

        $scope.submitToSurveyMonkeyIsLoading = true;
        let organizationsByName;
        surveyMonkeyService.addRecipients(collectorId, messageId, data)
        .then(function(response) {
            var succeeded = response.data.succeeded;
            var duplicate = response.data.duplicate;
            var existing = response.data.existing;
            var total_succeess = succeeded.length + existing.length;

            var notification_title = 'Success adding recipients';
            var notification_message = 'on survey: \"'+ $scope.surveyFormSelections.survey.title +'\"; duplicate: ' + duplicate.length + ', existing: ' + existing.length + ", total: " + total_succeess;
            $scope.notifySuccess(notification_title, notification_message);

            // Decorate each user with its recipient_id
            return surveyMonkeyService.loadRecipients(collectorId, messageId)
            .then((recipients) => {
                console.log(recipients); debugger;

                // Populate recipient with user information
                var users = selectedUsers;
                var userRecipients = recipients.reduce((filteredUsers, recipient) => {
                    for (var index in users) {
                        var user = users[index];
                        if (recipient.email === user.email) {
                            console.log(user); debugger;

                            var userRecipient = JSON.parse(JSON.stringify(user));

                            // userRecipient.recipient_id = recipient.id; DULU
                            userRecipient.id = recipient.id;
                            filteredUsers.push(userRecipient);
                            break;
                        }
                    }
                    return filteredUsers;
                }, []);

                console.log(userRecipients); debugger;

                return surveyMonkeyService.sendMessage(collectorId, messageId, {})
                .then((response) => {
                    response.data.recipients = userRecipients;
                    return response
                });
            })
        })
        .then((response) => {
            return zendeskService.loadOrganizationsByName()
            .then((result) => {
                organizationsByName = result;
                return response;
            })
            .catch(error => {
                // Assign organizationsByName with null object in case of exception
                organizationsByName = {
                    "": {
                        id: 0
                    }
                };
                return response;
            });
        })
        .then(function(response) {
            var recipients = response.data.recipients;
            var scheduled_date = response.data.scheduled_date;
            var date = new Date(scheduled_date).toString();
            var notification_title = "Success sending survey";
            var notification_message = "Scheduled at: " + date;

            $scope.notifySuccess(notification_title, notification_message);

            console.log(ZAF_METADATA.settings); debugger;
            // create many tickets TO DO: Iterate so that it could create more than 100 tickets
            var tickets = recipients.map(recipient => {
                var subject = surveyTitle + " - " + recipient.email;
                var body = "Survey is scheduled at " + date;
                var email = recipient.email ? recipient.email : "unknown@tes.com";
                var name = email.substring(0, email.indexOf("@"));

                var dealer_field_id = ZAF_METADATA.settings.dealer_field_id ? ZAF_METADATA.settings.dealer_field_id : 3333333330; //360000032316
                var cabang_field_id = ZAF_METADATA.settings.cabang_field_id ? ZAF_METADATA.settings.cabang_field_id : 3333333331;  //360000032336
                var quadran_field_id = ZAF_METADATA.settings.quadran_field_id ? ZAF_METADATA.settings.quadran_field_id : 3333333332; //360000032375
                // var panel_field_id = ZAF_METADATA.settings.panel_field_id ? ZAF_METADATA.settings.panel_field_id : 360000032356;
                var survey_response_identifier_id = ZAF_METADATA.settings.survey_response_identifier_field_id ? ZAF_METADATA.settings.survey_response_identifier_field_id : 0; //360000033575
                var survey_response_identifier_value = "smres_id_" + surveyId + "_" + collectorId + "_" + recipient.id;
                var ticket_form_id = ZAF_METADATA.settings.ticket_form_id ? ZAF_METADATA.settings.ticket_form_id : 3333333334; //360000001216

                var custom_fields = [];
                custom_fields.push({id: dealer_field_id, value: recipient.dealer});
                custom_fields.push({id: cabang_field_id, value: recipient.cabang});
                custom_fields.push({id: quadran_field_id, value: recipient.quadran});
                // custom_fields.push({id: panel_field_id, value: recipient.panel});
                custom_fields.push({id: survey_response_identifier_id, value: survey_response_identifier_value});

                var ticket = {
                    subject: subject,
                    comment: {body: body},
                    requester: {name: name, email: recipient.email},
                    custom_fields: custom_fields,
                    ticket_form_id: ticket_form_id
                };

                // assign recipient to its proper organization
                var organization_name = recipient.cabang ? "D " + recipient.cabang : "";
                var organization_id = organizationsByName[organization_name] ? organizationsByName[organization_name].id : 0;
                if (organization_id) {ticket["organization_id"] = organization_id;}
                console.log(ticket); debugger;
                return ticket;
            })
            console.log(tickets);debugger;

            return zendeskService.createManyTicketsBulk(tickets);
        })
        .then((response) => {
            var numOfTickets = "x";
            //$scope.notifySuccess("Processing tickets", "start creating " + numOfTickets + " tickets");
            console.log(response); debugger;
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

    // Handle only those from survey monkey api
    function handleSurveyMonkeyError(response, callback) {
        console.log(response); debugger;
        var status = response.status;
        var message = response.data.error.message;

        callback(status, message);

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
            var message = "We've detected too many request, don't worry, please try again later";
            $scope.notifyError("error", message);
            return;
        }

        $scope.notifyError("error", message);
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
