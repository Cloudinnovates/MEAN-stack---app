var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var titlize = require('mongoose-title-case');
var validate = require('mongoose-validator');

// name validator
var nameValidator = [
  validate({
      validator: 'isLength',
      arguments: [3, 30],
      message: 'Name and surname should be long between 3 - 30 characters.'
  }),
  validate({
     validator: 'matches',
   	 arguments: /^(([a-zA-Z]{3,20})+[ ]+([a-zA-Z]{3,20})+)+$/,
   	 message: 'Name and surname must have spave between.'
  })
]; 

// username validator
var usernameValidator = [
  validate({
    validator: 'isLength',
    arguments: [3, 30],
    message: 'Username should be long between 3 - 30 characters.'
  }),
  validate({
    validator: 'isAlphanumeric',
    passIfEmpty: true,
    message: 'Username should contain alpha-numeric characters only.'
  })
];

// password validator
var passwordValidator = [
  validate({
    validator: 'isLength',
    arguments: [3, 30],
    message: 'Password should be long between 3 - 30 characters.'
  }),
  validate({
  	 validator: 'matches',
 	 arguments: /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[\d])(?=.*?[\W]).{1,}$/,
 	 message: 'Password must have at least one lowecase letter, one uppercase letter, one number and one special character.'
  })
]; 

// email validator
var emailValidator = [
  validate({
    validator: 'isLength',
    arguments: [3, 30],
    message: 'Email should be long between 3 - 30 characters.'
  }),
  validate({
     validator: 'matches',
    arguments: /^[a-z]+[a-z0-9._]+@[a-z]+\.[a-z.]{2,5}$/,
    message: 'E-mail should have monkey.'
  })
];

// user shema for export
var UserSchema = new Schema({
	name: { type: String, required: true, validate: nameValidator },
	username: { type: String, lowercase: true, required: true, unique: true, validate: usernameValidator},
	password: { type: String , required: true, validate: passwordValidator , select : false },
	email: { type: String, required: true, lowercase: true, unique: true , validate: emailValidator },
  active: { type: Boolean, required: true, default: false },
  temporaryToken: { type: String, required: true },
  resettoken: { type: String, required: false },
  permission: { type: String, required: true, default: 'user' }
});

///before save use encrypt to password
UserSchema.pre('save', function(next) {
	
	var user = this;

  if (!user.isModified('password')) return next();

	bcrypt.hash(user.password, null, null, function(err, hash) {
		
		if(err) return next(err);
		user.password = hash;
		next();

	});
});

// tltize plugin for name - first letter turn to uppercase
UserSchema.plugin(titlize, {
  paths: [ 'name' ]
});

// custom method for comparing passwords
UserSchema.methods.comparePassword = function(password) {
	return bcrypt.compareSync(password, this.password);
}

// export user
module.exports = mongoose.model('User', UserSchema);