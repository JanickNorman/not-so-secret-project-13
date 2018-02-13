describe('surveyMonkeyService', function () {

    var service;
    var httpBackend;

    beforeEach(module('services'));

    beforeEach(inject(function (surveyMonkeyService, $httpBackend) {
        service = surveyMonkeyService;
        httpBackend = $httpBackend;
    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingRequest();
    });

    describe('method \'getSurveys\'', function () {

        it('returns names as expected', function (done) {

            httpBackend.when('GET', 'https://api.surveymonkey.net/v3/surveys').respond(200, ['Eric', 'Toby', 'Kris']);

            service.getSurveys().then(function (result) {
                expect(result.data[0]).toEqual('Eric');
                done();
            });

            httpBackend.flush();

        });

    });

});
