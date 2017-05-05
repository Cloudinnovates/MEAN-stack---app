angular.module('userController', ['userService'])



.controller('userCtrl', function($http, $timeout, $location, User) {
	
	var app = this;
	
	this.regUser = function(regData, valid) {
		app.errorMsg = false;
		app.loading = false;
		app.disabled = true;

		if (valid) {
			User.create(app.regData).then(function(data) {
				if(data.data.success) {
					app.successMsg = data.data.message;
					app.loading = true;

					// redirect to home page
					$timeout(function() {
						$location.path('/');
					},2000)
				} else {
					app.disabled = false;
					app.loading = false;
					app.errorMsg = data.data.message;
				}
			});
		} else {
			app.loading = false;
			app.errorMsg = 'Please ensure form is filled properly.';
		}
		
	};

	this.checkUsername = function(regData) {
		
		User.checkUsername(app.regData).then(function(data) {
			app.invalidUsername  = true;
			app.usernameMsg = false;
			console.log(data.data.message);
			if (data.data.success) {
				app.invalidUsername  = false;
				app.usernameMsg = data.data.message;
			} else {
				app.invalidUsername  = true;
				app.usernameMsg = data.data.message;
			}
		});
	};

	this.checkEmail = function(regData) {
		
		User.checkEmail(app.regData).then(function(data) {
			app.invalidEmail = true;
			app.emailMsg = false;

			if (data.data.success) {
				app.invalidEmail = false;
				app.emailMsg = data.data.message;
			} else {
				app.invalidEmail = true;
				app.emailMsg = data.data.message;
			}
		});
	};
	
})

.directive('match', function() {
	return {
		restict: 'A',
		controller: function($scope) {
			$scope.confirmed = false;

			$scope.doConfirm  = function(value) {
				value.forEach(function(ele) {
					
					if ( $scope.confirm == ele ) {
						$scope.confirmed = true;
					} else {
						$scope.confirmed = false;
					}
				});
			}
		},
		link: function(scope, element, attrs) {

			attrs.$observe('match', function() {
				scope.matches = JSON.parse(attrs.match);
				scope.doConfirm(scope.matches);
			});

			scope.$watch('confirm', function() {
				scope.matches = JSON.parse(attrs.match);
				scope.doConfirm(scope.matches);
			});
		}
	};
});