var app = angular.module('appRoutes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {

	$routeProvider
	.when('/', {
		templateUrl : 'app/views/pages/home.html'
	})
	.when('/about', {
		templateUrl: 'app/views/pages/about.html'
	})
	.when('/register', {
		templateUrl: 'app/views/pages/user/register.html',
		controller: 'userCtrl',
		controllerAs: 'register',
		authenticated: false
	})
	.when('/login', {
		templateUrl: 'app/views/pages/user/login.html',
		authenticated: false
	})
	.when('/logout', {
		templateUrl: 'app/views/pages/user/logout.html',
		authenticated: true
	})
	.when('/profile', {
		templateUrl: 'app/views/pages/user/profile.html',
		authenticated: true
	})
	.when('/activate/:token', {
		templateUrl: 'app/views/pages/user/activation/activate.html',
		controller: 'emailCtrl',
		controllerAs: 'email'
	})
	.when('/resend', {
		templateUrl: 'app/views/pages/user/activation/resend.html',
		controller: 'resendCtrl',
		controllerAs: 'resend'
	})
	.when('/resetUsername', {
		templateUrl: 'app/views/pages/user/reset/username.html',
		controller: 'usernameCtrl',
		controllerAs: 'username',
		authenticated: false
	})
	.when('/resetPassword', {
		templateUrl: 'app/views/pages/user/reset/password.html',
		controller: 'passwordCtrl',
		controllerAs: 'password',
		authenticated: false
	})
	.when('/reset/:token', {
		templateUrl: 'app/views/pages/user/reset/newpassword.html',
		controller: 'resetCtrl',
		controllerAs: 'reset',
		authenticated: false
	})
	.when('/managment', {
		templateUrl: 'app/views/pages/menagment/menagment.html',
		controller: 'managmentCtrl',
		controllerAs: 'managment',
		authenticated: true,
		permission: ['admin', 'moderator']
	})
	.when('/edit/:id', {
		templateUrl: 'app/views/pages/menagment/edit.html',
		controller: 'editCtrl',
		controllerAs: 'edit',
		authenticated: true,
		permission: ['admin', 'moderator']
	})


	.otherwise({ redirectTo: '/' }); // otherwise redirect to home page

	$locationProvider.html5Mode({ enabled: true, requireBase: false });
});

// Run a check on each route to see if user is logged in or not (depending on if it is specified in the individual route)
app.run(['$rootScope', 'Auth', '$location', 'User', function($rootScope, Auth, $location, User) {

    // Check each time route changes    
    $rootScope.$on('$routeChangeStart', function(event, next, current) {

        // Only perform if user visited a route listed above
        if (next.$$route !== undefined) {
            // Check if authentication is required on route
            if (next.$$route.authenticated === true) {
                // Check if authentication is required, then if permission is required
                if (!Auth.isloggedIn()) {
                    event.preventDefault(); // If not logged in, prevent accessing route
                    $location.path('/'); // Redirect to home instead
                } else if (next.$$route.permission) {
                    // Function: Get current user's permission to see if authorized on route
                    User.getPermission().then(function(data) {
                        // Check if user's permission matches at least one in the array
                        if (next.$$route.permission[0] !== data.data.permission) {
                            if (next.$$route.permission[1] !== data.data.permission) {
                                event.preventDefault(); // If at least one role does not match, prevent accessing route
                                $location.path('/'); // Redirect to home instead
                            }
                        }
                    });
                }
            } else if (next.$$route.authenticated === false) {
                // If authentication is not required, make sure is not logged in
                if (Auth.isloggedIn()) {
                    event.preventDefault(); // If user is logged in, prevent accessing route
                    $location.path('/profile'); // Redirect to profile instead
                }
            }
        }
    });
}]);