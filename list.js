
var ContactList = angular.module('ContactsList', []);

ContactList.controller('ListCtrl', function ($scope) {

    $scope.userInformation = {
        name: 'You',
        location: moment.tz.guess(),
        timeZoneName: moment.tz.guess(),
        UTC: moment.tz(moment.tz.guess()).format('Z')
    };

    $scope.conferenceTime = [];
    $scope.contacts = [];
    $scope.hours = [];
    $scope.locationCity = {};

    if(localStorage.contacts) {
        angular.forEach(JSON.parse(localStorage.contacts), function(list) {
            pushContact(list);
        });
    }

    if(localStorage.userInformation) {
        $scope.showButtom = true;
        renameInformationAboutUser(JSON.parse(localStorage.userInformation));
    }
    else {
        getUserInformationByIp();
    }

    $scope.getUserInformation = function() {
        renameInformationAboutUser($scope.userLocation);
        $scope.user.$setPristine();
        $scope.userCity = '';
        localStorage.userInformation = JSON.stringify($scope.userInformation);
        $scope.showButtom = true;     
    };

    $scope.addContact = function() {
        $scope.locationCity.name = $scope.contactName; 
        pushContact($scope.locationCity);
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
        $scope.rectangleWidth = angular.element($event.target).prop('offsetWidth') + 'px';
    };

    $scope.onMouseLeave = function() {
        $scope.rectangleLeft = undefined;
    };


    $scope.addHours = function(UTC){
        var timeZone = parseInt(UTC);
        $scope.hours[0] = (timeZone <= 0)? timeZone + 24 : timeZone;

        for (var i = 1; i < 24; ++i) {
            $scope.hours[i] = ($scope.hours[i-1] == 24)? 1 : $scope.hours[i-1] + 1;
        }
    };

    $scope.removeContact = function(index) {
        $scope.contacts.splice(index, 1);
        localStorage.contacts = JSON.stringify($scope.contacts);
        $scope.calculationConferenceTime();
    };

    $scope.removeUserInformation = function() {
        localStorage.removeItem("userInformation");
        getUserInformationByIp();
        $scope.showButtom = false;
    };

    $scope.calculationConferenceTime = function() {

        $scope.conferenceTime = [];

        var timeZone = parseInt($scope.userInformation.UTC);
        var hours = [];
        hours[0] = (timeZone <= 0)? timeZone + 24 : timeZone;

        for (var i = 1; i < 24; ++i) {
            hours[i] = (hours[i-1] == 24)? 1 : hours[i-1] + 1;
        }
        $scope.userInformation.hours = hours;


        angular.forEach($scope.contacts, function(contact) {
            if(contact.conference == true) {

                var timeZone = parseInt(contact.UTC);
                var hours = [];
                hours[0] = (timeZone <= 0)? timeZone + 24 : timeZone;

                for (var i = 1; i < 24; ++i) {
                    hours[i] = (hours[i-1] == 24)? 1 : hours[i-1] + 1;
                }
                contact.hours = hours;
            }
        });

        var k = [];
        var counter = 0;

        for (var i = 0; i < 24; ++i) {
            k[i] = 0
            angular.forEach($scope.contacts, function(contact) {
                if(contact.conference == true) { 
                    counter++;
                    if(contact.hours[i] <= 8 && contact.hours[i] >= 2) {
                        k[i] = k[i] + (9 - contact.hours[i]);
                    } else if(contact.hours[i] >= 19) {
                        k[i] = k[i] + (contact.hours[i] - 18);
                    } else if(contact.hours[i] == 1) {
                        k[i] = k[i] + 7;
                    }
                }
            });

            if($scope.userInformation.hours[i] <= 8 && $scope.userInformation.hours[i] >= 2) {
                k[i] = k[i] + (9 - $scope.userInformation.hours[i]);
            } else if($scope.userInformation.hours[i] >= 19) {
                k[i] = k[i] + ($scope.userInformation.hours[i] - 18);
            } else if($scope.userInformation.hours[i] == 1) {
                k[i] = k[i] + 7;
            }
        }
        var min = k[0];

        k.forEach(function(value){
            if(value < min) {
                min = value;
            }
        });

        k.forEach(function(value, i) {
            if(value == min) {
                $scope.conferenceTime.push(i + parseInt($scope.userInformation.UTC)); 
            }
        });

        if(counter == 0) {
            $scope.conferenceTime = [];
        }
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
    };
    timer();
    
    function renameInformationAboutUser(information) {
        $scope.userInformation.location = information.location;
        $scope.userInformation.timeZoneName = information.timeZoneName;
        $scope.userInformation.UTC = moment.tz(information.timeZoneName).format('Z');
        $scope.userInformation.latitude = information.latitude;
        $scope.userInformation.longitude = information.longitude;
        $scope.userInformation.sunrise = getSunriseOrSunset(information.latitude, information.longitude,
         information.timeZoneName, 'sunrise');
        $scope.userInformation.sunset = getSunriseOrSunset(information.latitude, information.longitude,
         information.timeZoneName, 'sunset');
    }

    function getUserInformationByIp() {
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'https://freegeoip.net/json/', true);
        xhr.responseType = 'json';

        xhr.onload = function() {
            var cord = xhr.response;
            $scope.userInformation.location = cord.city;
            $scope.userInformation.timeZoneName = cord.time_zone;
            $scope.userInformation.UTC = moment.tz(cord.time_zone).format('Z');
            $scope.userInformation.latitude = cord.latitude;
            $scope.userInformation.longitude = cord.longitude;
            $scope.userInformation.sunrise = getSunriseOrSunset($scope.userInformation.latitude,
             $scope.userInformation.longitude, $scope.userInformation.timeZoneName, 'sunrise');
            $scope.userInformation.sunset = getSunriseOrSunset($scope.userInformation.latitude,
             $scope.userInformation.longitude, $scope.userInformation.timeZoneName, 'sunset');
        };
        xhr.send();
    }   
    
    function getSunriseOrSunset(latitude, longitude, timeZoneName, dayPeriod) {

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

    function pushContact(contact) {

        $scope.contacts.push({
            name: contact.name,
            location: contact.location,
            timeZoneName: contact.timeZoneName,
            UTC: moment.tz(contact.timeZoneName).format('Z'),
            latitude: contact.latitude,
            longitude: contact.longitude,
            sunrise: getSunriseOrSunset(contact.latitude, contact.longitude, contact.timeZoneName, 'sunrise'),
            sunset: getSunriseOrSunset(contact.latitude, contact.longitude, contact.timeZoneName, 'sunset')
        });
    }

}); 

ContactList.directive('googlePlace', function() {
    return {
        
        link: function(scope, element, attributes) {
            var opts = {types: ['(cities)']};
            var autoComplete = new google.maps.places.Autocomplete(element[0],opts);

            google.maps.event.addListener(autoComplete, 'place_changed', function() {

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

                var place = autoComplete.getPlace();
                var city = place.address_components[0];

                delete city.short_name;
                delete city.types;
                
                city.longitude = place.geometry.location.lng();
                city.latitude = place.geometry.location.lat();
                city.location = city.long_name;

                getTimeZone(city.latitude, city.longitude).then(function(timeZoneId) {

                    city.timeZoneName = timeZoneId;
                    if (attributes.name === 'userLocation') {
                        scope.getUserInformation();
                    }
                });

                scope[attributes.name] = city;
                scope.$apply();
            });
        }
    };
});

ContactList.directive('sunAndWorkDay', function () {
    return {

        link: function (scope, element, attributes) {
            scope.elementList = scope[attributes["sunAndWorkDay"]];
            var hour = scope[attributes["ngBind"]];

            var removeCssClass = function() {
                element.removeClass("work_hour not_work_hour day night sunrise sunset");
                element.removeClass("day_sun night_sun sunrise_sun sunset_sun");
            };

            var dayHour = function(day, night) {
                if(scope.elementList.sunrise < scope.elementList.sunset) {
                    if (hour > scope.elementList.sunrise && hour < scope.elementList.sunset) {
                        element.addClass(day);
                    } 
                    else {
                        element.addClass(night);
                    }
                } 
                else if (scope.elementList.sunrise > scope.elementList.sunset) {
                    if (!(hour > scope.elementList.sunset && hour < scope.elementList.sunrise)) {
                        element.addClass(day);
                    } 
                    else {
                        element.addClass(night);
                    }
                } 
                else {
                    element.addClass(night);
                }
            };

            var sunriseSunset = function(sunrise, sunset) {
                if(hour == scope.elementList.sunrise) {
                    element.addClass(sunrise);
                }
                if(hour == scope.elementList.sunset) {
                    element.addClass(sunset);
                }
            };

            var workHour = function(workHour, notWorkHour) {
                if (hour > 8 && hour < 19) {
                    element.addClass(workHour);
                } 
                else {
                    element.addClass(notWorkHour);
                }
            };

            scope.$watch(function() {
                    return angular.toJson([scope.group, scope.elementList]);
                }, function() {
                if (scope.group) {
                    removeCssClass();
                    dayHour("day_sun", "night_sun");
                    sunriseSunset("sunrise_sun", "sunset_sun");
                } 
                else {
                    removeCssClass();
                    workHour("work_hour", "not_work_hour");
                    dayHour("day", "night");
                    sunriseSunset("sunrise", "sunset");
                }                
            });
        }
    };
});