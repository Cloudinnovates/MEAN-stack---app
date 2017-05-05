angular.module('managmentController', [])

.controller('managmentCtrl', function(User, $scope) {
	var app = this;
	
	app.loading = true;
	app.accessDenied = true;
	app.errorMsg = false;
	app.editAccess 	= false;
	app.deleteAccess = false;
	app.limit = 5;

	// get users
	function getUsers() {
		User.getUsers().then(function(data) {

			if (data.data.success) {
				$scope.sortColumn = 'name';
				// checking if user have this permissions
				if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
					app.users = data.data.users;
					app.loading = false;
					app.accessDenied = false;
					// if user have admin permsiion
					if (data.data.permission === 'admin') {
						app.editAccess 	= true;
						app.deleteAccess = true;
						// if user have moderator permission 
					} else if (data.data.permission === 'moderator') {
						app.editAccess = true;
					}
				} else {
					app.errorMsg = 'Insufficent Permissions';
					app.loading = false;
				}

			} else {
				app.errorMsg = data.data.message;
			}

		});
	};

	getUsers();


	app.showMore = function(number) {
		app.showMoreError = false;

		if (number > 0) {
			app.limit = number;
		} else {
			app.showMoreError = 'Please enter a valid number';
		}
	};

	// show all users function
	app.showAll = function() {
		app.limit = undefined;
		app.showMoreError = false;
	};

	// delete user function
	app.deleteUser = function(username) {
		User.deleteUser(username).then(function(data) {
			if (data.data.success) {
				getUsers();
			} else {
				app.showMoreError = data.data.message;
			}
		});
	};

	// custom search user function 
	app.search = function(searchKeyword, number) {
		app.showMoreError = false;
		
		if (searchKeyword) {
			if (searchKeyword.length > 0) {
				app.limit = 0;
				app.showMoreError = false;
				$scope.searchFilter = searchKeyword;
				app.limit = number;
			} else {
				$scope.searchFilter = undefined;
				app.limit = 0;
			}
			
		} else {
			$scope.searchFilter = undefined;
			app.showMoreError = 'Please first fill in input.';
		}
	};

	// clear search inputs
	app.clearSearch = function() {
		app.limit = 0;
		app.limit = undefined;
		$scope.searchKeyword = undefined;
		$scope.searchFilter = undefined;
		$scope.number = undefined;
		app.showMoreError = false;
	}
})

.controller('editCtrl', function($scope, $routeParams, $timeout, User) {
	var app = this;
    $scope.nameTab = 'active'; // Set the 'name' tab to the default active tab
    app.phase1 = true; // Set the 'name' tab to default view

    // Function: get the user that needs to be edited
    User.getUser($routeParams.id).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            $scope.newName = data.data.user.name; // Display user's name in scope
            $scope.newEmail = data.data.user.email; // Display user's e-mail in scope
            $scope.newUsername = data.data.user.username; // Display user's username in scope
            $scope.newPermission = data.data.user.permission; // Display user's permission in scope
            app.currentUser = data.data.user._id; // Get user's _id for update functions
        } else {
            app.errorMsg = data.data.message; // Set error message
        }
    });

    // Function: Set the name pill to active
    app.namePhase = function() {
        $scope.nameTab = 'active'; // Set name list to active
        $scope.usernameTab = 'default'; // Clear username class
        $scope.emailTab = 'default'; // Clear email class
        $scope.permissionsTab = 'default'; // Clear permission class
        app.phase1 = true; // Set name tab active
        app.phase2 = false; // Set username tab inactive
        app.phase3 = false; // Set e-mail tab inactive
        app.phase4 = false; // Set permission tab inactive
        app.errorMsg = false; // Clear error message
    };

    // Function: Set the e-mail pill to active
    app.emailPhase = function() {
        $scope.nameTab = 'default'; 
        $scope.usernameTab = 'default'; 
        $scope.emailTab = 'active'; 
        $scope.permissionsTab = 'default'; 
        app.phase1 = false; 
        app.phase2 = false; 
        app.phase3 = true; 
        app.phase4 = false; 
        app.errorMsg = false; 
    };

    // Function: Set the username pill to active
    app.usernamePhase = function() {
        $scope.nameTab = 'default';
        $scope.usernameTab = 'active'; 
        $scope.emailTab = 'default'; 
        $scope.permissionsTab = 'default'; 
        app.phase1 = false; 
        app.phase2 = true; 
        app.phase3 = false; 
        app.phase4 = false; 
        app.errorMsg = false; 
    };

    // Function: Set the permission pill to active
    app.permissionsPhase = function() {
        $scope.nameTab = 'default';
        $scope.usernameTab = 'default'; 
        $scope.emailTab = 'default'; 
        $scope.permissionsTab = 'active'; 
        app.phase1 = false; 
        app.phase2 = false; 
        app.phase3 = false; 
        app.phase4 = true; 
        app.disableUser = false; 
        app.disableModerator = false; 
        app.disableAdmin = false; 
        app.errorMsg = false; 
        // Check which permission was set and disable that button
        if ($scope.newPermission === 'user') {
            app.disableUser = true; 
        } else if ($scope.newPermission === 'moderator') {
            app.disableModerator = true; 
        } else if ($scope.newPermission === 'admin') {
            app.disableAdmin = true; 
        }
    };

    // Function: Update the user's name
    app.updateName = function(newName, valid) {
        app.errorMsg = false;
        app.disabled = true; 
        // Check if the name being submitted is valid
        if (valid) {
            var userObject = {}; // Create a user object to pass to function
            userObject._id = app.currentUser; // Get _id to search database
            userObject.name = $scope.newName; // Set the new name to the user
            // Runs function to update the user's name
            User.editUser(userObject).then(function(data) {
                // Check if able to edit the user's name
                if (data.data.success) {
                    app.successMsg = data.data.message; 
                    // Function: After two seconds, clear and re-enable
                    $timeout(function() {
                        app.nameForm.name.$setPristine(); 
                        app.nameForm.name.$setUntouched(); 
                        app.successMsg = false; 
                        app.disabled = false; 
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message; 
                    app.disabled = false; 
                }
            });
        } else {
            app.errorMsg = 'Please ensure form is filled out properly'; 
            app.disabled = false; // Enable form for editing
        }
    };

});