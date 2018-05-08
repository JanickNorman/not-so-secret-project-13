angular.module('services').factory('filtersFactory', ['$http', '$q', 'zendeskService', function ($http, $q, zendeskService) {
	// Original user field https://support.zendesk.com/hc/en-us/articles/203663226#ariaid-title13, use custom_field_options property for dropdow
	var originalUserFields = [
		{
			id: 1,
			type: "text",
			key: "name",
			title: "Name",
			description: ""
		},
		{
			id: 2,
			type: "dropdown",
			key: "role",
			title: "Role",
			description: "",
			initial_options: [
				{name: "Admin", value: "admin"},
				{name: "Agent", value: "agent"},
				{name: "End User", value: "end-user"}
			],
			field_options_api: "custom_roles",
			option_map: function(option){
				return {name: option.name, value: option.name};
			}
		},
		{
			id: 3,
			type: "text",
			key: "email",
			title: "Email",
			description: ""
		},
		{
			id: 4,
			type: "dropdown",
			key: "group",
			title: "Group",
			description: "",
			field_options_api: "groups",
			option_map: function(option){
				return {name: option.name, value: option.name};
			}
		},
		{
			id: 5,
			type: "dropdown",
			key: "organization",
			title: "Organization",
			description: "",
			field_options_api: "organizations",
			option_map: function(option){
				return {name: option.name, value: option.name};
			}
		},
		{
			id: 6,
			type: "date",
			key: "created",
			title: "Created At",
			description: ""
		},
		{
			id: 7,
			type: "text",
			key: "notes",
			title: "Notes",
			description: ""
		},
		{
			id: 8,
			type: "text",
			key: "details",
			title: "Details",
			description: ""
		},
		{
			id: 9,
			type: "text",
			key: "external_id",
			title: "External Id",
			description: ""
		},
		{
			id: 10,
			type: "text",
			key: "phone",
			title: "Phone",
			description: ""
		},
		{
			id: 11,
			type: "text",
			key: "tags",
			title: "Tags",
			description: ""
		}
	];

	return {
		getData: function() {
			return zendeskService.getUserFields().then(function(data) {
				var result = originalUserFields.concat(data.user_fields);
				return result;
			});
		}
	}
}]);
