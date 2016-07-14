
var ContactList = angular.module('ContactsList', ['ngSanitize', 'ui.select'])

ContactList.controller('ListCtrl', function ($scope,$interval) {

    $scope.contacts = [{
        name: 'You',
        location: moment.tz.guess(),
        UTC: moment.tz(moment.tz.guess()).format('Z')
    }];

    $scope.contactLocation ={};
    $scope.timeZoneNames = [];
    $scope.hours = [];

    if(localStorage.list){

        angular.forEach(JSON.parse(localStorage.list), function(list,i) {

            if(i !== 0) {
                $scope.contacts.push({
                    name: list.name,
                    location: list.location,
                    UTC: moment.tz(list.location).format('Z')
                });
            }
        });
    }

    angular.forEach(moment.tz.names(), function(i) {
        $scope.timeZoneNames.push({
            name: i
        });
    });

    /*var locationsString = "";

    angular.forEach($scope.timeZoneNames, function(tz,i) {
        locationsString += "^" + tz.name + "$";

        if(i != $scope.timeZoneNames.length-1) {
            locationsString += "|"; 
        }
    });

    $scope.validLocation = new RegExp(locationsString);
    $scope.validName = new RegExp("^[a-zA-Z]");*/

    $scope.addContact = function () {

        $scope.contacts.push({ 

            name: $scope.contactName, 
            location: $scope.contactLocation.selected.name,
            UTC: moment.tz($scope.contactLocation.selected.name).format('Z')
        });

        $scope.addNewContact.$setPristine();
        localStorage.list = JSON.stringify($scope.contacts);

        $scope.contactName = '';
        $scope.contactLocation = {};
    };

   /* $scope.clock = function(location) {
        
        $scope.time = {
            time: moment.tz(location).format('HH:mm:ss');
        }

        $interval(function() {
            $scope.time = moment.tz(location).format('HH:mm:ss');
        }, 1000);
    };*/

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

