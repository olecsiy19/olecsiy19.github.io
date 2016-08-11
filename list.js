
var ContactList = angular.module('ContactsList', [])

ContactList.controller('ListCtrl', function ($scope,$interval) {

    $scope.userInformations = {
        name: 'You',
        location: moment.tz.guess(),
        timeZoneName: moment.tz.guess(),
        UTC: moment.tz(moment.tz.guess()).format('Z'),
    };

    $scope.contacts = [];
    $scope.workList = [];
    $scope.homeList = [];
    $scope.hours = [];
    $scope.coords = {};

    if(localStorage.workList){
        angular.forEach(JSON.parse(localStorage.workList), function(list) {
            pushContact($scope.workList, list);
        });
    }

    if(localStorage.homeList){
        angular.forEach(JSON.parse(localStorage.homeList), function(list) {
            pushContact($scope.homeList, list);
        });
    }

    if(localStorage.userInformations) {
        $scope.show = true;
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
        $scope.show = true;     
    };

    $scope.addContact = function () {
        $scope.locationCity.name = $scope.contactName;

        if($scope.group) {
            pushContact($scope.homeList, $scope.locationCity);
            localStorage.homeList = JSON.stringify($scope.homeList);
        }
        else {
            pushContact($scope.workList, $scope.locationCity);
            localStorage.workList = JSON.stringify($scope.workList);
        }

        $scope.addNewContact.$setPristine();
        $scope.cityName = '';
        $scope.contactName = '';
        $scope.locationCity = '';
    };
    $scope.rectangleHeight = function () {
        return document.getElementsByClassName("table")[0].offsetHeight + 'px';
    };
    $scope.rectangle = function () {
        var a = new Date().getUTCHours();
        var b = document.getElementsByClassName("time");
        if(document.getElementsByClassName("time")[a]) {
            $scope.rectangleWidth = document.getElementsByClassName("time")[a].offsetWidth + 'px';
        }
        return angular.element(b[a]).prop('offsetLeft') + 'px';
    };

    $scope.onMouseOver = function ($event) {
        $scope.onMouseMoveResult = angular.element($event.target).prop('offsetLeft') + 'px';
        $scope.rectangleWidth = angular.element($event.target).prop('offsetWidth') + 'px'
    };

    $scope.onMouseLeave = function () {

        $scope.onMouseMoveResult = undefined;
    };

    $scope.workTime = function (hour) {
        return (hour>8 && hour<19);
    };

    $scope.lightDay = function (hour, contact) {
        if(contact.sunrise < contact.sunset)
            return (hour > contact.sunrise && hour < contact.sunset);
        else if (contact.sunrise > contact.sunset)
            return !(hour > contact.sunset && hour < contact.sunrise);
    };

    $scope.firstLastHour = function(hour, periodOfTheDay) {
        return (hour == periodOfTheDay);
    };

    $scope.loadList = function() {
        if($scope.group)
            $scope.contacts = $scope.homeList;
        else
            $scope.contacts = $scope.workList;
    }

    $scope.timer  = function () {

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
        if($scope.group) {
            $scope.homeList.splice(index, 1);
            localStorage.homeList = JSON.stringify($scope.homeList);
        }
        else {
            $scope.workList.splice(index, 1);
            localStorage.workList = JSON.stringify($scope.workList);
        }
    };

    $scope.removeUserInformation = function() {
        localStorage.removeItem("userInformations");
        getUserInformationsByIp();
        $scope.show = false;
    };

    function renameInformationAboutUser (information) {

        $scope.userInformations.location = information.location;
        $scope.userInformations.timeZoneName = information.timeZoneName;
        $scope.userInformations.UTC = moment.tz(information.timeZoneName).format('Z');
        $scope.userInformations.latitude = information.latitude;
        $scope.userInformations.longitude = information.longitude;
        $scope.userInformations.sunrise = getSunrise(information.latitude, information.longitude, information.timeZoneName);
        $scope.userInformations.sunset = getSunset(information.latitude, information.longitude, information.timeZoneName);
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
            $scope.userInformations.sunrise = getSunrise($scope.userInformations.latitude, $scope.userInformations.longitude, $scope.userInformations.timeZoneName);
            $scope.userInformations.sunset = getSunset($scope.userInformations.latitude, $scope.userInformations.longitude, $scope.userInformations.timeZoneName);
        };
        xhr.send();
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
                city.location = city.long_name;

                getTimeZone(city.latitude, city.longitude).then(function(timeZoneId) {

                    city.timeZoneName = timeZoneId;
                    if(attrs.name === 'userLocation') {
                        scope.getUserInformations();
                    }
                });

                scope[attrs.name] = city;
                scope.$apply();
            });
        }
    };
});


function getSunrise(latitude, longitude, timeZoneName) {

    var times = SunCalc.getTimes(new Date(), latitude, longitude);
    sunrise = times.sunrise.getUTCHours() + parseInt(moment.tz(timeZoneName).format('Z'));

    if(sunrise < 1) {
        sunrise += 24;
    }
    else if(sunrise > 24) {
        sunrise -= 24;
    }

    return sunrise;
}

function getSunset(latitude, longitude, timeZoneName) {

    var times = SunCalc.getTimes(new Date(), latitude, longitude);
    sunset = times.sunset.getUTCHours() + parseInt(moment.tz(timeZoneName).format('Z'));

    if(sunset < 1) {
        sunset += 24;
    }
    else if(sunset > 24) {
        sunset -= 24;
    }
    return sunset;
}

function pushContact(list , contact) {

    list.push({
        name: contact.name,
        location: contact.location,
        timeZoneName: contact.timeZoneName,
        UTC: moment.tz(contact.timeZoneName).format('Z'),
        latitude: contact.latitude,
        longitude: contact.longitude,
        sunrise: getSunrise(contact.latitude, contact.longitude, contact.timeZoneName),
        sunset: getSunset(contact.latitude, contact.longitude, contact.timeZoneName)
    });
}