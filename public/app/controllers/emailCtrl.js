angular.module('emailController', ['userService'])

.controller('emailCtrl', function(User, $routeParams, $location, $timeout) {
	var app =this;

	User.accountActive($routeParams.token).then(function(data) {
		app.successMsg = false;
		app.errorMsg = false;
		
		if (data.data.success) {
			app.successMsg = data.data.message + '....Redirecting';

			$timeout(function() {
				$location.path('/login');
			}, 2000);

		} else {
			app.errorMsg = data.data.message;
		}

	});
})

.controller('resendCtrl', function(User) {
	var app = this;

	app.checkCredentials = function(loginData) {
		app.errorMsg = false;
		app.successMsg = false;
		app.disabled = true;

		User.checkCredentials(app.loginData).then(function(data) {

			if (data.data.success) {
				
				User.resendLink(app.loginData).then(function(data) {
					if (data.data.success) {
						app.successMsg = data.data.message;
					} else {
						app.errorMsg = data.data.message;

					}
				});

			} else {
				app.errorMsg = data.data.message;
				app.disabled = false;
			}
		});
	}
})

.controller('usernameCtrl', function(User) {
	var app =this;

	app.sendUsername = function(userData, valid) {
		app.errorMsg = false;
		app.loading = true;
		app.disabled = true;
		
		if (valid) {
			User.sendUsername(app.userData.email).then(function(data) {
				app.loading = false;

				if (data.data.success) {
					app.successMsg = data.data.message;
				} else {
					app.disabled = false;
					app.errorMsg = data.data.message;
				}
			});

		} else {
			app.loading = false;
			app.disabled = false;
			app.errorMsg = 'Please eneter valid e-mail';
		}
		
	}
})

.controller('passwordCtrl', function(User) {
	var app = this;	
		app.errorMsg = false;
		app.loading = false;
		app.disabled = false;
		
	app.sendPassword = function(resetData, valid) {
		if (valid) {
				User.sendPassword(app.resetData).then(function(data) {
					console.log(data);
					

					if (data.data.success) {
						app.disabled = true;
						app.successMsg = data.data.message;
					} else {
						app.disabled = false;
						app.errorMsg = data.data.message;
					}
				});

			} else {
				app.disabled = false;
				app.errorMsg = 'Please eneter valid username';
			}
			
		}
		
})

.controller('resetCtrl', function(User, $routeParams, $scope) {
	var app = this;
	app.hide = true;

	User.resetUser($routeParams.token).then(function(data) {
		if (data.data.success) {
			app.hide = false;
			app.successMsg = 'Please enter a new password';
			$scope.username = data.data.user.username;
			console.log(data.data.user.username);
		} else {
			app.errorMsg = data.data.message;
		}
	});

	app.savePassword = function(regData, valid , confirmed) {
		app.errorMsg = false;
		app.successMsg = false;
		app.disabled = true;
		app.loading = true;
		

		if (valid && confirmed) {
			app.regData.username = $scope.username;
			User.savePassword(app.regData).then(function(data) {
				app.loading = false;
				if (data.data.success) {
					app.successMsg = data.data.message;
				} else {
					app.loading = false;
					app.disabled = false;
					app.errorMsg = data.data.message;
				}
			})
		} else {
			app.loading = false;
			app.errorMsg = 'Please ensure form is filled out properly.';
		}
	}
});