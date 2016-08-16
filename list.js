
var ContactList = angular.module('ContactsList', [])

ContactList.controller('ListCtrl', function ($scope,$interval) {

    $scope.userInformations = {
        name: 'You',
        location: moment.tz.guess(),
        timeZoneName: moment.tz.guess(),
        UTC: moment.tz(moment.tz.guess()).format('Z'),
    };

    $scope.contacts = [];
    $scope.hours = [];

    if(localStorage.contacts){
        angular.forEach(JSON.parse(localStorage.contacts), function(list) {
            pushContact($scope.contacts, list);
        });
    }

    if(localStorage.userInformations) {
        $scope.showButtom = true;
        renameInformationAboutUser(JSON.parse(localStorage.userInformations));
    }
    else {
        getUserInformationsByIp();
    }

    $scope.getUserInformations = function() {
        renameInformationAboutUser($scope.userLocation);
        $scope.user.$setPristine();
        $scope.userCity = '';
        localStorage.userInformations = JSON.stringify($scope.userInformations);
        $scope.showButtom = true;     
    };

    $scope.addContact = function() {
        $scope.locationCity.name = $scope.contactName;
        
        pushContact($scope.contacts, $scope.locationCity);
        localStorage.contacts = JSON.stringify($scope.contacts);

        $scope.addNewContact.$setPristine();
        $scope.cityName = '';
        $scope.contactName = '';
        $scope.locationCity = '';
    };

    $scope.rectangleHeight = function() {
        return document.getElementsByClassName("table")[0].offsetHeight + 'px';
    };

    $scope.rectangle = function() {
        var hourNow = new Date().getUTCHours();
        var timeBlock = document.getElementsByClassName("time");

        if(timeBlock[hourNow]) {
            $scope.rectangleWidth = timeBlock[hourNow].offsetWidth + 'px';
        }

        return angular.element(timeBlock[hourNow]).prop('offsetLeft') + 'px';
    };

    $scope.onMouseOver = function($event) {
        $scope.rectangleLeft = angular.element($event.target).prop('offsetLeft') + 'px';
        $scope.rectangleWidth = angular.element($event.target).prop('offsetWidth') + 'px'
    };

    $scope.onMouseLeave = function() {
        $scope.rectangleLeft = undefined;
    };


    $scope.addHours = function(UTC){
        timeZone = parseInt(UTC);
        $scope.hours[0] = (timeZone <= 0)? timeZone + 24 : timeZone;

        for (var i = 1; i < 24; ++i) {
            $scope.hours[i] = ($scope.hours[i-1] == 24)? 1 : $scope.hours[i-1] + 1;
        }
    };

    $scope.removeContact = function(index) {
        $scope.contacts.splice(index, 1);
        localStorage.contacts = JSON.stringify($scope.contacts);
    };

    $scope.removeUserInformation = function() {
        localStorage.removeItem("userInformations");
        getUserInformationsByIp();
        $scope.showButtom = false;
    };

    var timer  = function() {
        $scope.clock = new Date();

        var updateClock = function() {
            $scope.clock = new Date();
        };

        setInterval( function() {
            $scope.$apply(updateClock);
        }, 1000);

        updateClock();
    }();

    function renameInformationAboutUser(information) {
        $scope.userInformations.location = information.location;
        $scope.userInformations.timeZoneName = information.timeZoneName;
        $scope.userInformations.UTC = moment.tz(information.timeZoneName).format('Z');
        $scope.userInformations.latitude = information.latitude;
        $scope.userInformations.longitude = information.longitude;
        $scope.userInformations.sunrise = getSunriseOrSanset(information.latitude, information.longitude,
         information.timeZoneName, 'sunrise');
        $scope.userInformations.sunset = getSunriseOrSanset(information.latitude, information.longitude,
         information.timeZoneName, 'sunset');
    }

    function getUserInformationsByIp() {
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'https://freegeoip.net/json/', true);
        xhr.responseType = 'json';

        xhr.onload = function() {
            var cord = xhr.response;
            $scope.userInformations.location = cord.city;
            $scope.userInformations.timeZoneName = cord.time_zone;
            $scope.userInformations.UTC = moment.tz(cord.time_zone).format('Z');
            $scope.userInformations.latitude = cord.latitude;
            $scope.userInformations.longitude = cord.longitude;
            $scope.userInformations.sunrise = getSunriseOrSanset($scope.userInformations.latitude,
             $scope.userInformations.longitude, $scope.userInformations.timeZoneName, 'sunrise');
            $scope.userInformations.sunset = getSunriseOrSanset($scope.userInformations.latitude,
             $scope.userInformations.longitude, $scope.userInformations.timeZoneName, 'sunset');
        };
        xhr.send();
    }   
    
    function getSunriseOrSanset(latitude, longitude, timeZoneName, dayPeriod) {

        var times = SunCalc.getTimes(new Date(), latitude, longitude);
        var sun = times[dayPeriod].getUTCHours() + parseInt(moment.tz(timeZoneName).format('Z'));

        if (sun < 1) {
            sun += 24;
        } 
        else if (sun > 24) {
            sun -= 24;
        }

        return sun;
    }

    function pushContact(list , contact) {

        list.push({
            name: contact.name,
            location: contact.location,
            timeZoneName: contact.timeZoneName,
            UTC: moment.tz(contact.timeZoneName).format('Z'),
            latitude: contact.latitude,
            longitude: contact.longitude,
            sunrise: getSunriseOrSanset(contact.latitude, contact.longitude, contact.timeZoneName, 'sunrise'),
            sunset: getSunriseOrSanset(contact.latitude, contact.longitude, contact.timeZoneName, 'sunset')
        });
    }

}); 

ContactList.directive('googleplace', function() {
    return {

        link: function(scope, element, attrs, model) {
            var opts = {types: ['(cities)']};
            var autocomplete = new google.maps.places.Autocomplete(element[0],opts);

            google.maps.event.addListener(autocomplete, 'place_changed', function() {

                var getTimeZone = function(latitude, longitude) {

                    return new Promise(function(resolve, reject) {

                        var xhr = new XMLHttpRequest();
                        xhr.open('get', 'https://maps.googleapis.com/maps/api/timezone/json?location=' + latitude 
                         + ',' + longitude + '&timestamp=1331766000&sensor=false', true);
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
                city.location = city.long_name;

                getTimeZone(city.latitude, city.longitude).then(function(timeZoneId) {

                    city.timeZoneName = timeZoneId;
                    if (attrs.name === 'userLocation') {
                        scope.getUserInformations();
                    }
                });

                scope[attrs.name] = city;
                scope.$apply();
            });
        }
    };
});

ContactList.directive('sunAndWorkDay', function () {
    return {

        link: function (scope, element, attrs) {
            scope.elementList = scope[attrs["sunAndWorkDay"]];
            var hour = scope[attrs["ngBind"]];

            scope.$watch(function() {
                    return angular.toJson([scope.group, scope.elementList]);
                }, function() {
                if (scope.group) {
                    element.removeClass("work_hour not_work_hour day night sunrise sunset");
                    element.removeClass("day_sun night_sun sunrise_sun sunset_sun");

                    if(scope.elementList.sunrise < scope.elementList.sunset) {
                        if (hour > scope.elementList.sunrise && hour < scope.elementList.sunset) {
                            element.addClass("day_sun");
                        } 
                        else {
                            element.addClass("night_sun");
                        }
                    } 
                    else if (scope.elementList.sunrise > scope.elementList.sunset) {
                        if (!(hour > scope.elementList.sunset && hour < scope.elementList.sunrise)) {
                            element.removeClass('day');
                            element.addClass("day_sun");
                        } 
                        else {
                            element.addClass("night_sun");
                        }
                    } 
                    else {
                        element.addClass("night_sun");
                    }

                    if(hour == scope.elementList.sunrise) {
                        element.addClass("sunrise_sun");
                    }

                    if(hour == scope.elementList.sunset) {
                        element.addClass("sunset_sun");
                    }
                } 
                else {
                    element.removeClass("work_hour not_work_hour day night sunrise sunset");
                    element.removeClass("day_sun night_sun sunrise_sun sunset_sun");
                    if (hour > 8 && hour < 19) {
                        element.addClass("work_hour");
                    } 
                    else {
                        element.addClass("not_work_hour");
                    }

                    if(scope.elementList.sunrise < scope.elementList.sunset) {
                        if (hour > scope.elementList.sunrise && hour < scope.elementList.sunset) {
                            element.addClass("day");
                        } 
                        else {
                            element.addClass("night");
                        }
                    } 
                    else if (scope.elementList.sunrise > scope.elementList.sunset) {
                        if (!(hour > scope.elementList.sunset && hour < scope.elementList.sunrise)) {
                            element.addClass("day");
                        } 
                        else {
                            element.addClass("night");
                        }
                    } 
                    else {
                        element.addClass("night");
                    }

                    if(hour == scope.elementList.sunrise) {
                        element.addClass("sunrise");
                    }

                    if(hour == scope.elementList.sunset) {
                        element.addClass("sunset");
                    }
                }                
            });
        }
    };
});
