
var ContactList = angular.module('ContactsList', [])

ContactList.controller('ListCtrl', function ($scope,$interval) {

    $scope.contacts = [{
        name: 'You',
        location: moment.tz.guess(),
        UTC: moment.tz(moment.tz.guess()).format('Z')
    }];

    $scope.locationCity = {};
    $scope.hours = [];

    if(localStorage.list){

        angular.forEach(JSON.parse(localStorage.list), function(list,i) {

            if(i !== 0) {
                $scope.contacts.push({
                    name: list.name,
                    location: list.location,
                    timeZoneName: list.timeZoneName,
                    UTC: moment.tz(list.timeZoneName).format('Z')
                });
            }
        });
    }

    $scope.addContact = function () {

        $scope.contacts.push({ 

            name: $scope.contactName, 
            location: $scope.locationCity.long_name,
            timeZoneName: $scope.locationCity.timeZoneName,
            UTC: moment.tz($scope.locationCity.timeZoneName).format('Z')
        });

        $scope.addNewContact.$setPristine();

        localStorage.list = JSON.stringify($scope.contacts);

        $scope.cityName = '';
        $scope.contactName = '';
        $scope.locationCity = {};
    };

    $scope.timer  = function() {

        $scope.clock = new Date();

        var updateClock = function () {
            $scope.clock = new Date();
        };

        setInterval(function () {
            $scope.$apply(updateClock);
        }, 1000);

        updateClock();
    };
    $scope.timer();

    $scope.addHours = function(UTC){

        timeZone = parseInt(UTC);
        $scope.hours[0] = (timeZone <= 0)? timeZone + 24 : timeZone;

        for(var i = 1; i < 24; ++i) {
            $scope.hours[i] = ($scope.hours[i-1] == 24)? 1 : $scope.hours[i-1] + 1;
        }
    };

    $scope.removeContact = function(index) {

        $scope.contacts.splice(index, 1);
        localStorage.list = JSON.stringify($scope.contacts);
    };

    
}); 

ContactList.directive('googleplace', function() {
    return {

        link: function(scope, element, attrs, model) {
            var opts = {types: ['(cities)']};
            var autocomplete = new google.maps.places.Autocomplete(element[0],opts);

            google.maps.event.addListener(autocomplete, 'place_changed', function() {

                var getJSON = function(latitude, longitude) {

                    return new Promise(function(resolve, reject) {

                        var xhr = new XMLHttpRequest();
                        xhr.open('get', 'https://maps.googleapis.com/maps/api/timezone/json?location='+latitude+','+longitude+'&timestamp=1331766000&sensor=false', true);
                        xhr.responseType = 'json';

                        xhr.onload = function() {

                            resolve(xhr.response.timeZoneId);
                        };
                        xhr.send();
                    });
                };

                var place = autocomplete.getPlace();
                var city = place.address_components[0];

                delete city.short_name;
                delete city.types;
                
                city.longitude = place.geometry.location.lng();
                city.latitude = place.geometry.location.lat();
                getJSON(city.latitude, city.longitude).then(function(timeZoneId) {
                    city.timeZoneName = timeZoneId;
                });
                
                scope.locationCity = city;
                scope.$apply();
                console.log(scope.locationCity);
            });
        }
    };
});
