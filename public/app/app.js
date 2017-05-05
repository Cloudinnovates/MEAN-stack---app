angular.module('appUser', ['appRoutes', 'userController', 'ngAnimate','userService', 'mainController','authenticateService', 'emailController', 'managmentController'])

.config(function($httpProvider) {
	$httpProvider.interceptors.push('AuthInterceptor');
});