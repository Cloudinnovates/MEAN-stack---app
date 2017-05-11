angular.module('mainController', ['authenticateService'])

// main controller is used to handle login and main index functions (stuff that should run on every page)
.controller('mainCtrl', function($http, Auth, User, AuthToken, $route, $window, $timeout, $location, $rootScope, $interval) {
	var app = this;
	app.loadme = false; // hide main html until data is obtained in Angular JS

	app.checkSession = function() {
		if (Auth.isloggedIn()) {
			app.checkingSession = true;
			var interval = $interval(function() {
				var token = $window.localStorage.getItem('token');
				if (token === null) {
					$interval.cancel(interval);
				} else {
					// converting token time to time stamp
					self.parseJwt = function(token) {
						var base64Url = token.split('.')[1];
						var base64 = base64Url.replace('-', '+').replace('-', '/');
						return JSON.parse($window.atob(base64));
					}
					var expireTime = self.parseJwt(token);
					var timeStamp = Math.floor(Date.now() / 1000);
					console.log(expireTime.exp);
					console.log(timeStamp);
					var timeCheck = expireTime.exp - timeStamp;
					console.log('timecheck: ' + timeCheck);
					if (timeCheck <= 25) {
						console.log('Token has expired');
						showModal(1);
						$interval.cancel(interval);
					} else {
						console.log('Token has not yet expired');
					}
				}

			}, 2000);
		}
	};

	app.checkSession();

	var showModal = function(option) {	
		app.choiceMade = false;
		app.modalHeader = undefined;
		app.modalBody = undefined;
		app.hideButton = false;

		if (option === 1) {
			$("#myModal").modal({backdrop: "static"});
			app.modalHeader = 'Timeout warning';
			app.modalBody = 'Your session will expire soon! Would you like to renew your session?'

		} else if (option === 2) {
			app.hideButton = true;
			app.modalHeader = 'Logging out';
			$("#myModal").modal({backdrop: "static"});
			$timeout(function() {
				Auth.logout();
				$location.path('/');
				$route.reload();
			}, 2000);
		}
		$timeout(function() {
			if (!app.choiceMade) {
				console.log('Logged out');
				hideModal();
			} 
		}, 4000);	
	};

	app.renewSession = function() {
		app.choiceMade = true;

		User.renewSession(app.username).then(function(data) {
			if (data.data.success) {
				AuthToken.setToken(data.data.token);
				app.checkSession();
			} else {
				app.modalBody = data.data.message;
			}
		});

		console.log('session has renewed');
		hideModal();
	};

	app.endSession = function() {
		app.choiceMade = true;
		console.log('session has ended');
		$timeout(function() {
			showModal(2);
		}, 1000);
		hideModal();
	};

	var hideModal = function() {
		$("#myModal").modal('hide');
	}

	// will run code every time a route changes
	$rootScope.$on('$routeChangeStart', function() {
		if (!app.checkingSession) app.checkSession();

		// check if user is logged in
		if (Auth.isloggedIn()) {
			app.isloggedIn = true;

			// custom function to retrive user data
			Auth.getUser().then(function(data) {
				app.username = data.data.username;
				app.email = data.data.email;
				
				
				User.getPermission().then(function(data) {
					if (data.data.permission == 'admin' || data.data.permission == 'moderator') {
						app.authorized = true; //show menagment page if this is true
						app.loadme = true; // show main html now that data is obtained in Angular JS
					} else {
						app.loadme = true; // show main html now that data is obtained in Angular JS
					}
				})
			});
		} else {
			app.username = '';
			app.isloggedIn = false;
		}
	});

	this.doLogin = function(loginData) {
			app.errorMsg  = false;
			app.loading = false;
			app.expired = false;
			app.disabled = true;
		// function that performs login
		Auth.login(app.loginData).then(function(data) {
			if (data.data.success) {
				app.loading = true;
				app.successMsg = data.data.message + ".... Redirecting";

				$timeout(function() {
					$location.path('/about'); // redirect to about page
					app.loading = false;
					app.successMsg = false;
				}, 2000);
			} else {
				if (data.data.expired) {
					app.expired = true;
					app.loading  = false;
					app.errorMsg = data.data.message;
				} else {
					app.loading  = false;
					app.disabled = false;
					app.errorMsg = data.data.message;
				}
			}
		});	
	};

	// function for logout
	app.logout = function() {
		showModal(2);
	};

});