var User = require('../models/user'); 		// import user modal
var jwt = require('jsonwebtoken');	 	 	// import JWT package
var secret = 'harrypotter';					// Create custom secret for use in JWT		
var nodemailer = require('nodemailer');		// Import Nodemailer Package
var sgTransport = require('nodemailer-sendgrid-transport');

module.exports = function(router) {

	// Start Sendgrid Configuration Settings  
	var options = {
	  auth: {
	    api_user: 'Nikac',	// sendgrid username
	    api_key: 'nikola99'	// sendgrid password
	  }
	}

	var client = nodemailer.createTransport(sgTransport(options));
	// End Sendgrid Configuration Settings  
	

	// Route to register new users  
	router.post('/users', function(req, res) {
		var user = new User(); // Create new User object
		user.name = req.body.name; // Save name from request to User object
		user.username = req.body.username; // Save username from request to User object
		user.password = req.body.password; // Save paswword from request to User object
		user.email = req.body.email; // Save email from request to User object
		user.temporaryToken = jwt.sign({ username: user.username, email: user.email}, secret, { expiresIn: '24h' }); // Create a token for activating account through e-mail
		
		 // Check if request is valid and not empty or null
		if(req.body.username == '' || req.body.username == null || req.body.password == '' || req.body.password == null || req.body.username == '' || req.body.username == null || req.body.name == '' || req.body.name == null) {
			res.json({ success: false, message : 'Ensure name, username, password or email.'});
		} else {
			// Save new user to database
			user.save(function(err) {
				if(err) {
					// Check if any validation errors exists (from user model)
					if (err.errors != null ) {
						if (err.errors.name) {
							res.json({ success: false, message: err.errors.name.message});
						} else if (err.errors.username) {
							res.json({ success: false, message: err.errors.username.message});
						} else if (err.errors.password) {
							res.json({ success: false, message: err.errors.password.message});
						}  else if (err.errors.email) {
							res.json({ success: false, message: err.errors.email.message});
						} else {
							res.json({ success: false, message: err });
						}
					} else if (err){
						 // Check if duplication error exists
							if (err.code == 11000) {
								res.json({ success: false, message: 'Username or email alredy taken.' });
							} else {
								res.json({ success: false, message: err });
							}
						}
				} else {
					 // Create e-mail object to send to user
					var email = {
					  from: 'Localhost awesome@bar.com',
					  to: user.email ,
					  subject: 'Localhost Activattion link ', 
					  text: 'Hello ' + user.name + 'Please click on the link for activate your account. Link: http://localhost:3000/activate/' + user.temporaryToken ,
					  html: '<b>Hello world</b>, '+ user.name + 'Please click on the link for activate your account. Link: <a href="http://localhost:3000/activate/' + user.temporaryToken + '">http://localhost:3000/activate/</a>' 
					};
					// Function to send e-mail to the user
					client.sendMail(email, function(err, info){
					    if (err ){
					      console.log(err);
					    }
					    else {
					      console.log('Message sent: ' + info.response);
					    }
					});

					res.json({ success: true, message: 'Account activated. Please check your email for activation link.'});
				}
			});
		}		
	});

	 // Route to check if username chosen on registration page is taken
	router.post('/checkusername', function(req, res) {
		User.findOne({ username: req.body.username }).select('username').exec(function(err, user) {
			if (err)  throw err;

			if (user) {
				res.json({ success: false, message: 'The username is already taken.' });
			} else {
				res.json({ success: true, message: 'Username valid.'})
			}	
		
		});		
	});

	// Route to check if e-mail chosen on registration page is taken 
	router.post('/checkemail', function(req, res) {
		User.findOne({ email: req.body.email }).select('email').exec(function(err, user) {
			if (err)  throw err;

			if (user) {
				res.json({ success: false, message: 'The email is already taken.' });
			} else {
				res.json({ success: true, message: 'E-mail valid.'})
			}	
		
		});		
	});

	 // Route for user logins
	router.post('/authenticate', function(req, res) {
		User.findOne({ username: req.body.username }).select('username password email active').exec(function(err, user) {
			if (err)  throw err;

			if (!user) {
				res.json({ success: false, message: 'Could not authenticate user' });
			} else if (user) {
				var validPassword = user.comparePassword(req.body.password);
				if (!validPassword) {
					res.json({ success: false, message: 'Could not authenticate the password'});
				} else if (!user.active) { 
					res.json({ success: false, message: 'Please check your e-mail for activation link', expired : true });
				}else {
					var token = jwt.sign({ username: user.username, email: user.email}, secret, { expiresIn: '24h' });
					res.json({ success: true, message: 'User authenticated', token : token});
				}
			}			
		});		
	});

	// Route to verify user credentials before re-sending a new activation link 
	router.post('/resend', function(req, res) {
		User.findOne({ username: req.body.username }).select('username password active').exec(function(err, user) {
			if (err)  throw err;

			if (!user) {
				res.json({ success: false, message: 'Could not authenticate user' });
			} else if (user) {
				var validPassword = user.comparePassword(req.body.password);
				if (!validPassword) {
					res.json({ success: false, message: 'Could not authenticate the password'});
				} else if (user.active) { 
					res.json({ success: true, message: 'Account has been activated!' });
				}else {
	
					res.json({ success: true, user: user});
				}
			}
		});		
	});

	// Route to send user a new activation link once credentials have been verified
	router.put('/resend', function(req, res) {
		User.findOne({ username: req.body.username }).select('username name email temporaryToken').exec(function(err, user) {
			if (err) throw err;

			user.temporaryToken = jwt.sign({ username: user.username, email: user.email}, secret, { expiresIn: '24h' });
			user.save(function(err) {
				if (err) {
					console.log(err);
				} else {
					var email = {
					  from: 'Localhost awesome@bar.com',
					  to: user.email ,
					  subject: 'Localhost Activattion link request', 
					  text: 'Hello ' + user.name + 'You recently requested new link for account. Please click on the link for activate your account. Link: http://localhost:3000/activate/' + user.temporaryToken ,
					  html: '<b>Hello world</b>, '+ user.name + 'You recently requested new link for account. Please click on the link for activate your account. Link: <a href="http://localhost:3000/activate/' + user.temporaryToken + '">http://localhost:3000/activate/</a>' 
					};

					client.sendMail(email, function(err, info){
					    if (err ){
					      console.log(error);
					    }
					    else {
					      console.log('Message sent: ' + info.response);
					    }
					});
					res.json({ success: true, message: 'Activation link has been sent to ' + user.email });
				}
			})
		});
	});

	// Route to activate the user's account 
	router.put('/activate/:token', function(req, res) {
		User.findOne({ temporaryToken: req.params.token }, function(err, user) {
			if (err) throw err;
			var token = req.params.token;

			// Function to verify the user's token
			jwt.verify(token, secret, function(err, decoded) {
				if (err) {
					res.json({ success: false, message: 'Activation link has expired.'});
				} else if (!user) {
					res.json({ success: false, message: 'Activation link has expired.'});
				} else {
					user.active = true;
					user.temporaryToken = false;
					user.save(function(err) {
						if (err) {
							console.log(err);
						} else {
							var email = {
							  from: 'Localhost awesome@bar.com',
							  to: user.email ,
							  subject: 'Account activated ',
							  text: 'Hello ' + user.name + 'Your account has been activated' ,
							  html: '<b>Hello world</b>, '+ user.name + ' Your account has been activated'
							};

							client.sendMail(email, function(err, info){
							    if (err ){
							      console.log(error);
							    }
							    else {
							      console.log('Message sent: ' + info.response);
							    }
							});
							res.json({ success: true, message: 'Account activated!' });
						}
					})
				}	  
			});
			
		});		
	});

	// Route to send user's username to e-mail
	router.get('/resetusername/:email', function(req, res) {
		User.findOne({ email: req.params.email }).select('username active email resettoken name').exec(function(err, user) {
				if (err) {
					res.json({ success: false, message: err });
				} else {
					if (!req.params.email) {
						res.json({ success: false, message: 'No e-mail was provided.' });
					} else {
					if (!user) {
						res.json({ success: false, message: 'E-mail was not found.' });
					} else {
						var email = {
						  from: 'Localhost awesome@bar.com',
						  to: user.email ,
						  subject: 'Localhost username request ',
						  text: 'Hello ' + user.name + 'You recently tequest your username. Please save it in your files: '+ user.username ,
						  html: '<b>Hello world</b>, '+ user.name + '<br/> You recently tequest your username. Please save it in your files: '+ user.username
						};

						client.sendMail(email, function(err, info){
						    if (err ){
						      console.log(error);
						    }
						    else {
						      console.log('Message sent: ' + info.response);
						    }
						});

						res.json({ success: true, message: 'Username has been sent to e-mail.' })
					}
				}
			};
		});
	});

	// Route to send reset link to the user
	router.put('/resetpassword', function(req, res) {
		User.findOne({ username: req.body.username }).select('username active email resettoken name').exec(function(err, user) {
			if (err) throw err;
			if(!user) {
				res.json({ success: false, message: 'Username was not found!' });
			} else if (!user.active) {
				res.json({ success: false, message: 'Account has not been activated.'});
			} else {
				user.resettoken = jwt.sign({ username: user.username, email: user.email}, secret, { expiresIn: '24h' });
				user.save(function(err) {
					if (err) {
						res.json({ success: false, message: err });
					} else {
						var email = {
						  from: 'Localhost awesome@bar.com',
						  to: user.email ,
						  subject: 'Localhost password request ',
						  text: 'Hello ' + user.name + 'You recently request your password. Please click on the folowing link: http://localhost:3000/reset/'+ user.resettoken ,
						  html: '<b>Hello world</b>, '+ user.name + '<br/> You recently request your password. Please click on the following link: <a href="http://localhost:3000/reset/'+ user.resettoken + '">http://localhost:3000/newpassword</a>'
						};

						client.sendMail(email, function(err, info){
						    if (err ){
						      console.log(error);
						    }
						    else {
						      console.log('Message sent: ' + info.response);
						    }
						});
						res.json({ success: true, message: 'Please check your e-mail for reset password' });
					}
				});
			}
		});
	});

	// Route to verify user's e-mail activation link
	router.get('/resetpassword/:token', function(req, res) {
		User.findOne({ resettoken: req.params.token }).select().exec(function(err, user) {
			if (err) throw err;
			var token = req.params.token;

			jwt.verify(token, secret, function(err, decoded) {
				  if (err) {
				  	res.json({ success: false, message: 'Pasword link has expired.'});
				  } else{
				  	if (!user) {
				  	 	res.json({ success: false, message: 'Password link has expired.' });
				  	} else {
				  		res.json({ success: true, user: user });
				  	}
				  }			  
			});		
		})
	});

	// Save user's new password to database
	router.put('/savepassword', function(req, res) {
		User.findOne({ username: req.body.username }).select('name username password resettoken email').exec(function(err, user) {
			if (err) throw err;
			if (req.body.password == null || req.body.password == '') {
				res.json({ success: false, message: 'Password has no provided!'})
			} else {
				user.password = req.body.password;
				user.resettoken = false;
				user.save(function(err) {
					if (err) {
						res.json({ success: false, message: err})
					} else {
						var email = {
						  from: 'Localhost awesome@bar.com',
						  to: user.email ,
						  subject: 'Localhost password request ',
						  text: 'Hello ' + user.name + 'This e-mail is to notify you that your password was recently reset at localhost.com',
						  html: '<b>Hello world</b>, '+ user.name + '<br/> This e-mail is to notify you that your password was recently reset at localhost.com'
						};

						client.sendMail(email, function(err, info){
						    if (err ){
						      console.log(error);
						    }
						    else {
						      console.log('Message sent: ' + info.response);
						    }
						});

						res.json({ success: true, message: 'Password has been reset!'})
					}
				});
			}
		});
	});


	/// Middleware for Routes that checks for token - Place all routes after this route that require the user to already be logged in
	router.use(function(req, res, next) {
		var token = req.body.token || req.body.query || req.headers['x-access-token'];

		if (token) {
			jwt.verify(token, secret, function(err, decoded) {
				  if (err) {
				  	 return err;
				  } else{
				  	 req.decoded = decoded;
				  	 next();
				  }			  
			});			
		} else {
			res.json({ success: false, message: 'No token provided'});
		}
	});

	// Route to get the currently logged in user
	router.post('/me', function(req, res) {
		res.send(req.decoded);
	});

	// Route to provide the user with a new token to renew session
	router.get('renewToken/:username', function(req, res) {
		User.findOne({ username: req.params.username }).select().exec(function(err, user) {
			if (err) throw err;

			if (!user) {
				res.json({ success: false, message: 'User was not found.'});
			} else {
				var newToken = jwt.sign({ username: user.username, email: user.email}, secret, { expiresIn: '23h' });
				res.json({ success: true, token : newToken });
			}
		});
	});

	// Route to get the current user's permission level
	router.get('/permission', function(req, res) {
		User.findOne({ username: req.decoded.username }, function(err, user) {
			if (err) throw err;
			if (!user) {
				res.json({ success: false, message: 'No user was found' });
			} else {
				res.json({ success: true, permission: user.permission });
			}
		})
	});

	// Route to get all users for management page
	router.get('/managment', function(req, res) {
		User.find({}, function(err, users) {
			if (err) throw err;
			User.findOne({ username: req.decoded.username }, function(err, mainUser) {
				if (err) throw err;
				if (!mainUser) {
					res.json({ success: false, message: 'No user found' });
				} else {
					if (mainUser.permission === 'admin' || mainUser.permission  === 'moderator' ) {
						if (!users) {
							res.json({ success: false, message: 'User not found' });
						} else {
							res.json({ success: true, users: users, permission: mainUser.permission });
						}
					} else {
						res.json({ success: false, message: 'Not allowed only admin can do that.'})
					}
				}
			})
		})
	});

	// Route to delete a user
	router.delete('/managment/:username', function(req, res) {
		var deletedUser = req.params.username;
		User.findOne({ username: req.decoded.username }, function(err, mainUser) {
			if (err) throw err;
			if (!mainUser) {
				res.json({ success: false, message: 'No user found' });
			} else {
				if (mainUser.permission !== 'admin') {
					res.json({ success: false, message: 'Insufficient Permission!' });
				} else {
					User.findOneAndRemove({ username : mongod }, function(err, user) {
						if (err) throw err;
						res.json({ success: true });
					});
				}
			}
		});
	});

	// Route to get the user that needs to be edited
    router.get('/edit/:id', function(req, res) {
        var editUser = req.params.id; // Assign the _id from parameters to variable
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw error if cannot connect
            // Check if logged in user was found in database
            if (!mainUser) {
                res.json({ success: false, message: 'No user found' }); // Return error
            } else {
                // Check if logged in user has editing privileges
                if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                    // Find the user to be editted
                    User.findOne({ _id: editUser }, function(err, user) {
                        if (err) throw err; // Throw error if cannot connect
                        // Check if user to edit is in database
                        if (!user) {
                            res.json({ success: false, message: 'No user found' }); // Return error
                        } else {
                            res.json({ success: true, user: user }); // Return the user to be editted
                        }
                    });
                } else {
                    res.json({ success: false, message: 'Insufficient Permission' }); // Return access error
                }
            }
        });
    });
	
   // Route to update/edit a user
    router.put('/edit', function(req, res) {
        var editUser = req.body._id; // Assign _id from user to be editted to a variable
        if (req.body.name) var newName = req.body.name; // Check if a change to name was requested
        if (req.body.username) var newUsername = req.body.username; // Check if a change to username was requested
        if (req.body.email) var newEmail = req.body.email; // Check if a change to e-mail was requested
        if (req.body.permission) var newPermission = req.body.permission; // Check if a change to permission was requested
        // Look for logged in user in database to check if have appropriate access
        User.findOne({ username: req.decoded.username }, function(err, mainUser) {
            if (err) throw err; // Throw err if cannot connnect
            // Check if logged in user is found in database
            if (!mainUser) {
                res.json({ success: false, message: "no user found" }); 
            } else {
                // Check if a change to name was requested
                if (newName) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user in database
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err; 
                            // Check if user is in database
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); 
                            } else {
                                user.name = newName; // Assign new name to user in database
                                // Save changes
                                user.save(function(err) {
                                    if (err) {
                                        console.log(err); 
                                    } else {
                                        res.json({ success: true, message: 'Name has been updated!' });
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); 
                    }
                }

                // Check if a change to username was requested
                if (newUsername) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user in database
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err; 
                            // Check if user is in database
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); 
                            } else {
                                user.username = newUsername; // Save new username to user in database
                                // Save changes
                                user.save(function(err) {
                                    if (err) {
                                        console.log(err); 
                                    } else {
                                        res.json({ success: true, message: 'Username has been updated' }); 
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); 
                    }
                }

                // Check if change to e-mail was requested
                if (newEmail) {
                    // Check if person making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user that needs to be editted
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err;
                            // Check if logged in user is in database
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); 
                            } else {
                                user.email = newEmail; // Assign new e-mail to user in databse
                                // Save changes
                                user.save(function(err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.json({ success: true, message: 'E-mail has been updated' }); 
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); 
                    }
                }

                // Check if a change to permission was requested
                if (newPermission) {
                    // Check if user making changes has appropriate access
                    if (mainUser.permission === 'admin' || mainUser.permission === 'moderator') {
                        // Look for user to edit in database
                        User.findOne({ _id: editUser }, function(err, user) {
                            if (err) throw err; 
                     
                            if (!user) {
                                res.json({ success: false, message: 'No user found' }); 
                            } else {
                                // Check if attempting to set the 'user' permission
                                if (newPermission === 'user') {
                                    // Check the current permission is an admin
                                    if (user.permission === 'admin') {
                                        // Check if user making changes has access
                                        if (mainUser.permission !== 'admin') {
                                            res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade an admin.' }); // Return error
                                        } else {
                                            user.permission = newPermission; // Assign new permission to user
                                            // Save changes
                                            user.save(function(err) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    res.json({ success: true, message: 'Permissions have been updated!' });
                                                }
                                            });
                                        }
                                    } else {
                                        user.permission = newPermission; // Assign new permission to user
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' }); 
                                            }
                                        });
                                    }
                                }
                                // Check if attempting to set the 'moderator' permission
                                if (newPermission === 'moderator') {
                                    // Check if the current permission is 'admin'
                                    if (user.permission === 'admin') {
                                        // Check if user making changes has access
                                        if (mainUser.permission !== 'admin') {
                                            res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to downgrade another admin' }); // Return error
                                        } else {
                                            user.permission = newPermission; // Assign new permission
                                            // Save changes
                                            user.save(function(err) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    res.json({ success: true, message: 'Permissions have been updated!' });
                                                }
                                            });
                                        }
                                    } else {
                                        user.permission = newPermission; // Assign new permssion
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); 
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' }); 
                                            }
                                        });
                                    }
                                }

                                // Check if assigning the 'admin' permission
                                if (newPermission === 'admin') {
                                    // Check if logged in user has access
                                    if (mainUser.permission === 'admin') {
                                        user.permission = newPermission; 
                                        // Save changes
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err); 
                                            } else {
                                                res.json({ success: true, message: 'Permissions have been updated!' }); 
                                            }
                                        });
                                    } else {
                                        res.json({ success: false, message: 'Insufficient Permissions. You must be an admin to upgrade someone to the admin level' }); // Return error
                                    }
                                }
                            }
                        });
                    } else {
                        res.json({ success: false, message: 'Insufficient Permissions' }); 

                    }
                }
            }
        });
    });

	return router;
};